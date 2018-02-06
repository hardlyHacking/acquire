import bson.json_util
import bson.objectid
import flask
import json
import os
import pymongo
import random


app = flask.Flask(__name__, static_url_path='', static_folder='public')
client = pymongo.MongoClient()
db = client.test_database


@app.route('/')
def home_page():
    return flask.send_from_directory('public', 'index.html')


@app.route('/game')
def game_page():
    return flask.send_from_directory('public', 'game.html')


@app.route('/player/<name>')
def get_player(name):
    player = db.players.find_one({'name': name})
    if player is None:
        return flask.jsonify({}), 404
    else:
        return flask.jsonify(player), 200


@app.route('/new_player/<name>', methods=['POST'])
def create_player(name):
    player = db.players.find_one({'name': name})
    if player is None:
        new_player = {'name': name}
        pid = db.players.insert_one(new_player).inserted_id
        return flask.jsonify({'id': str(pid)}), 200
    return flask.jsonify({}), 404


@app.route('/new_game', methods=['POST'])
def new_game():
    data = flask.request.form
    num_players, players = int(data['numPlayers']), data.getlist('playerNames[]')
    game = _create_game(num_players, players)
    game_id = db.games.insert_one(game).inserted_id
    return flask.jsonify({'id': str(game_id)}), 200


@app.route('/join_game/<game_id>/<user_id>', methods=['POST'])
def join_game(game_id, user_id):
    real_id = bson.objectid.ObjectId(game_id)
    game = db.games.find_one({'_id': real_id})
    numPlayers = game['numPlayers'] + 1
    players = game['players'].append(bson.objectid.ObjectId(user_id))
    db.games.update_one({'_id': real_id},
            {'$set': {'numPlayers': numPlayers, 'players': players}})
    return flask.jsonify({}), 200


@app.route('/board/<game_id>')
def board_state(game_id):
    real_id = bson.objectid.ObjectId(game_id)
    return _get_board_state(real_id)


@app.route('/board/pick_hotel', methods=['POST'])
def pick_hotel():
    data = flask.request.form
    game_id, hotel_name = data['gameId'], data['hotelName']
    real_id = bson.objectid.ObjectId(game_id)
    game = db.games.find_one({'_id': real_id})

    if game['isCreatingHotel']:
        return _create_hotel(real_id, hotel_name)

    if game['isPickingFinalMergeWinner']:
        return _pick_final_merger(real_id, hotel_name)

    if game['isMergingHotel']:
        return _merge_hotels(real_id, game['mergingHotels'], hotel_name)


@app.route('/board/place_tile', methods=['POST'])
def place_tile():
    data = flask.request.form
    game_id, tile_number = data['gameId'], int(data['tile'])
    real_id = bson.objectid.ObjectId(game_id)

    # Validate this is a real game
    game = db.games.find_one({'_id': real_id})
    if game is None:
        return flask.jsonify({}), 404

    # Validate that a tile has not already been placed
    if tile_number in game['squares']:
        return flask.jsonify({}), 400

    # TODO: use $pull on the mongo-db side instead of in-memory here
    hand_num = game['turn'] % game['numPlayers']
    hand = game['hand' + str(hand_num)]
    hand.remove(tile_number)

    # Check if tile_number is joining an existing hotel
    possible_squares = _get_possible_surrounding_squares(tile_number)
    surrounding_squares = [s for s in possible_squares if s in game['squares']]
    hotel_dict = _create_hotel_dict(game)
    surrounding_hotels = _get_surrounding_hotels(surrounding_squares, hotel_dict)
    surrounding_hotels = sorted(surrounding_hotels, key=lambda hotel: len(game[hotel]))
    safe_hotels = [s for s in surrounding_hotels if len(set(game[s])) > 10]

    # Validate that this is not an illegal tile
    if len(safe_hotels) > 1:
        return flask.jsonify({}), 400

    # There are no hotels left to found
    if (len(surrounding_hotels) == 0 and
        len(surrounding_squares) > 0 and
        game['numHotelsLeft'] == 0):
        return flask.jsonify({}), 400

    # No surrounding hotels but surrounding tiles - hotel creation
    if len(surrounding_hotels) == 0 and len(surrounding_squares) > 0:
        # Possible that surrounding squares have other squares adjacent but
        # not part of a hotel - if any of the initial randomly chosen tiles
        # end up adjacent to each other then we have this scenario
        recursive_surrounding_squares = [_get_possible_surrounding_squares(s)
            for s in surrounding_squares if s in game['squares']]
        flat_recursive = list(set([s for sublist in recursive_surrounding_squares for s in sublist]))
        new_squares = list(set(flat_recursive + surrounding_squares))
        final_squares = list(set([int(s) for s in new_squares if s != [] and int(s) in game['squares']]))
        db.games.find_one_and_update({'_id': real_id},
            {
                '$push': {
                    'squares': tile_number,
                },
                '$set': {
                    'hand' + str(hand_num): hand,
                    'isCreatingHotel': True,
                    'mergingHotels': surrounding_hotels,
                    'newHotel': list(set(final_squares + [tile_number])),
                    'turnPlacePhase': True,
                },
            })
        return _get_board_state(real_id)

    # There is a single hotel to which tiles are being added
    if len(surrounding_hotels) == 1:
        new_squares = [int(s) for s in surrounding_squares + [tile_number] if s != []]
        db.games.find_one_and_update({'_id': real_id},
            {
                '$pushAll': {
                    'squares': new_squares,
                    surrounding_hotels[0]: new_squares,
                },
                '$set': {
                    'hand' + str(hand_num): hand,
                    'turnPlacePhase': True,
                },
            })
        return _get_board_state(real_id)

    # Placing a lone tile without any surrounding hotels or tiles
    if len(surrounding_squares) == 0:
        db.games.find_one_and_update({'_id': real_id},
            {
                '$push': {
                    'squares': tile_number
                },
                '$set': {
                    'hand' + str(hand_num): hand,
                    'turnPlacePhase': True,
                },
            })
        return _get_board_state(real_id)

    # Merger special case - all mergable hotels are same length
    surrounding_hotels_length = set([len(game[s]) for s in surrounding_hotels])
    if len(surrounding_hotels) > 1 and len(surrounding_hotels_length) == 1:
        db.games.find_one_and_update({'_id': real_id},
        {
            '$push': {
                'squares': tile_number,
            },
            '$set': {
                'hand' + str(hand_num): hand,
                'isMergingHotel': True,
                'isPickingFinalMergeWinner': True,
                'mergingHotels': surrounding_hotels,
                'mergerTile': tile_number,
                'turnPlacePhase': True,
            },
        })
        return _get_board_state(real_id)

    # Regular merger
    if len(surrounding_hotels) > 1:
        db.games.find_one_and_update({'_id': real_id},
        {
            '$push': {
                'squares': tile_number
            },
            '$set': {
                'hand' + str(hand_num): hand,
                'isMergingHotel': True,
                'mergerTile': tile_number,
                'turnPlacePhase': True,
            },
        })
        return _merge_hotels(real_id, surrounding_hotels, None)

    return _get_board_state(real_id)


@app.route('/board/new_tile', methods=['POST'])
def new_tile():
    data = flask.request.form
    game_id = bson.objectid.ObjectId(data['gameId'])
    game = db.games.find_one({'_id': game_id})
    hand_label = str(game['turn'] % game['numPlayers'])

    # Validate the current player's hand only has 5 tiles
    if len(game['hand' + hand_label]) != 5:
        return flask.jsonify({}), 400

    # Validate that a tile has been placed
    if not game['turnPlacePhase']:
        return flask.jsonify({}), 400

    # TODO: use $pull on the mongo-db side instead of in-memory here
    tile = random.sample(game['bag'], 1)[0]
    game['bag'].remove(tile)
    db.games.find_one_and_update({'_id': game_id},
        {
            '$set': {
                'bag': game['bag'],
            },
            '$push': {
                'hand' + hand_label: tile,
            },
        })

    return flask.jsonify({'tile': tile}), 200


@app.route('/board/buy_shares', methods=['POST'])
def buy_shares():
    data = flask.request.get_json()
    game_id = bson.objectid.ObjectId(data['gameId'])
    shares = data['shares']
    game = db.games.find_one({'_id': game_id})

    # Validate the game exists
    if game is None:
        return flask.jsonify({}), 404

    # Validate a tile has been placed
    if not game['turnPlacePhase']:
        return flask.jsonify({}), 400

    # Validate a maximum of three shares being selected
    if sum(shares.values()) > 3:
        return flask.jsonify({}), 400

    # Validate there are still enough shares to be bought
    hotelShares = game['hotelShares']
    for s in shares:
        if hotelShares[_get_hotel_index(s)] < shares[s]:
            return flask.jsonify({}), 400

    # Determine the price of the shares and the user has enough cash
    hand_num = game['turn'] % game['numPlayers']
    money = game['playerFunds'][hand_num]
    money_needed = _calculate_needed_funds(shares, game)
    if money_needed > money:
        return flask.jsonify({}), 400

    hotelShares = game['hotelShares']
    playerShares = game['playerShares']
    for s in shares:
        index = _get_hotel_index(s)
        hotelShares[index] -= shares[s]
        playerShares[7 * hand_num + index] += shares[s]

    playerFunds = game['playerFunds']
    playerFunds[hand_num] -= money_needed

    db.games.find_one_and_update({'_id': game_id},
        {
            '$set': {
                'hotelShares': hotelShares,
                'playerFunds': playerFunds,
                'playerShares': playerShares,
            },
        })

    return flask.jsonify({}), 200


@app.route('/board/end_turn', methods=['POST'])
def end_turn():
    data = flask.request.form
    game_id = bson.objectid.ObjectId(data['gameId'])
    game = db.games.find_one({'_id': game_id})


    # Validate this is a real game
    if game is None:
        return flask.jsonify({}), 404

    # Validate that a tile has been placed
    if not game['turnPlacePhase']:
        return flask.jsonify({}), 400

    db.games.find_one_and_update({'_id': game_id},
        {
            '$set': {
                'turnPlacePhase': False,
                'turnBuyPhase': False,
            },
            '$inc': { 'turn': 1 },
        })
    return flask.jsonify({}), 200


def _create_hotel(game_id, hotel_name):
    # Validate this is a real game
    game = db.games.find_one({'_id': game_id})
    if game is None:
        return flask.jsonify({}), 404

    # Validate hotel is not already created
    if game['numHotelsLeft'] == 0 or len(game[hotel_name]) > 0:
       return flask.jsonify({}), 400

    # Increment player shares for that hotel
    partialName = hotel_name.split('hotel')[1].split('Tiles')[0]
    playerShares = game['playerShares']
    hand_num = game['turn'] % game['numPlayers']

    hotel_partial_index = _get_hotel_index(partialName)
    hotelShares = game['hotelShares']
    if hotelShares[_get_hotel_index(partialName)] > 0:
        playerShares[7 * hand_num + hotel_partial_index] += 1
        hotelShares[hotel_partial_index] -= 1

    db.games.find_one_and_update({'_id': game_id},
        {
            '$set': {
                hotel_name: game['newHotel'],
                'isCreatingHotel': False,
                'newHotel': [],
                'playerShares': playerShares,
                'hotelShares': hotelShares,
            },
            '$inc': {
                'numHotelsLeft': -1,
            },
        })

    return _get_board_state(game_id)


def _create_hotel_dict(game):
    hotel_names = ['hotelLuxorTiles', 'hotelTowerTiles', 'hotelAmericanTiles',
        'hotelFestivalTiles', 'hotelWorldwideTiles', 'hotelContinentalTiles',
        'hotelImperialTiles']
    return {name: set(game[name]) for name in hotel_names}


def _merge_hotels(game_id, surrounding_hotels, name=None):
    game = db.games.find_one({'_id': game_id})
    # Sort surrounding hotels from smallest to largest
    hotels = sorted(surrounding_hotels, key=lambda hotel: len(game[hotel]))

    # Keep performing auto-merges until finished
    while len(hotels) > 1:
        # Auto merge possible
        if len(game[hotels[0]]) < len(game[hotels[1]]):
            db.games.find_one_and_update({'_id': game_id},
            {
                '$set': {
                    hotels[0]: [],
                    hotels[-1]: game[hotels[0]] + game[hotels[-1]],
                    'mergingHotels': hotels[1:],
                },
                '$inc': { 'numHotelsLeft': 1, },
            })
            hotels = hotels[1:]
        # This is the result of a special isPickingFinalMergeWinner
        elif len(hotels) == 2 and 'finalMergerWinner' in game:
            db.games.find_one_and_update({'_id': game_id},
            {
                '$set': {
                    hotels[0]: [],
                    hotels[-1]: game[hotels[0]] + game[hotels[-1]],
                    'mergingHotels': hotels[1:],
                },
                '$inc': { 'numHotelsLeft': 1, },
            })
            hotels = hotels[1:]
        # User input has already been selected
        elif len(game[hotels[0]]) == len(game[hotels[1]]) and name is not None:
            hotels.remove(name)
            db.games.find_one_and_update({'_id': game_id},
            {
                '$set': {
                    name: [],
                    hotels[-1]: game[name] + game[hotels[-1]],
                    'isMergingHotel': len(hotels) == 2,
                    'mergingHotels': hotels,
                },
                '$inc': { 'numHotelsLeft': 1, },
            })
        # Needs user input to select which hotel will be merged
        elif len(game[hotels[0]]) == len(game[hotels[1]]) and name is None:
            db.games.find_one_and_update({'_id': game_id},
            {
                '$set': {
                    'isMergingHotel': True,
                    'isTieBreaking': True,
                    'mergingHotels': hotels,
                },
            })
            break

    # The final merger took place in the while loop
    # Add the initial merger tile to the final hotel result
    if len(hotels) == 1:
        db.games.find_one_and_update({'_id': game_id},
        {
            '$push': {
                hotels[0]: game['mergerTile'],
            },
            '$set': {
                'isMergingHotel': False,
                'isPickingFinalMergeWinner': False,
                'isTieBreaking': False,
                'mergingHotels': [],
            },
            '$unset': {
                'finalMergerWinner': 1,
                'mergerTile': 1,
            },
        })

    return _get_board_state(game_id)


def _pick_final_merger(game_id, name):
    game = db.games.find_one({'_id': game_id})

    if game is None:
        return flask.jsonify({}), 404

    # Move the designated hotel to the final element
    # which will be the remaining hotel after all merges are complete
    merging_hotels = game['mergingHotels']
    merging_hotels.remove(name)
    merging_hotels.append(name)

    db.games.find_one_and_update({'_id': game_id},
        {
            '$set': {
                'isPickingFinalMergeWinner': False,
                'finalMergerWinner': name,
                'mergingHotels': merging_hotels,
            },
        })

    return _merge_hotels(game_id, merging_hotels, None)


def _get_board_state(game_id):
    game = db.games.find_one({'_id': game_id})

    if game is None:
        return flask.jsonify({}), 404

    # Calculate player's hand
    hand_num = game['turn'] % game['numPlayers']
    hand = game['hand' + str(hand_num)]
    # Don't return other players' hands as part of the JSON response
    for i in range(game['numPlayers']):
        game.pop('hand' + str(i))
    # Assign returned hand to temporary 'hand' key
    game['hand'] = hand

    return flask.jsonify(json.loads(bson.json_util.dumps(game))), 200


def _get_hotel_index(name):
    if name == 'Luxor':
        return 0
    if name == 'Tower':
        return 1
    if name == 'American':
        return 2
    if name == 'Festival':
        return 3
    if name == 'Worldwide':
        return 4
    if name == 'Continental':
        return 5
    if name == 'Imperial':
        return 6


def _get_column(index):
    return int(index % 12)


def _get_row(index):
    return int(index / 12)


def _get_raw_index(row, column):
    return int((row * 12) + column)


def _get_possible_surrounding_squares(index):
    row = _get_row(index)
    column = _get_column(index)
    result = []

    if (row > 0):
        result.append(_get_raw_index(row - 1, column))

    if (row < 8):
        result.append(_get_raw_index(row + 1, column))

    if (column > 0):
        result.append(_get_raw_index(row, column - 1))

    if (column < 11):
        result.append(_get_raw_index(row, column + 1))

    return result


# Returns a list of names a particular tile belongs to
# In practice, it will be an empty list if the tile is not part of any hotel
# And a list with a single element otherwise, as tiles only belong to 1 hotel
def _get_surrounding_hotels(surrounding_squares, hotel_dict):
    hotels = [[name for name in hotel_dict.keys() if tile in hotel_dict[name]]
        for tile in surrounding_squares]
    return list(set([item for sublist in hotels for item in sublist]))


def _get_hotel_cost_per_share(hotel, size):
    base_cost = 0
    if size == 2:
        base_cost = 200
    elif size == 3:
        base_cost = 300
    elif size == 4:
        base_cost = 400
    elif size == 5:
        base_cost = 500
    elif size > 5 and size < 11:
        base_cost = 600
    elif size > 10 and size < 21:
        base_cost = 700
    elif size > 20 and size < 31:
        base_cost = 800
    elif size > 30 and size < 41:
        base_cost = 900
    else:
        base_cost = 1000

    if hotel == 'Luxor' or hotel == 'Tower':
        return base_cost
    elif hotel == 'American' or hotel == 'Festival' or hotel == 'Worldwide':
        return base_cost + 100
    else:
        return base_cost + 200

def _calculate_needed_funds(shares, game):
    total = 0
    for s in shares:
        size = len(set(game['hotel{0}Tiles'.format(s)]))
        cost = _get_hotel_cost_per_share(s, size)
        total += shares[s] * cost

    return total


def _create_game(num_players, players=None):
    random_bag = range(12 * 9)
    starting_board = list(random.sample(random_bag, num_players))
    turn_num = starting_board.index(min(starting_board))
    bag = [square for square in random_bag if square not in starting_board]
    player_hands = list(random.sample(bag, num_players * 6))
    bag = [s for s in bag if s not in player_hands]
    game = {
        'bag': bag,
        'gameOver': False,
        'hotelLuxorTiles': [],
        'hotelTowerTiles': [],
        'hotelAmericanTiles': [],
        'hotelFestivalTiles': [],
        'hotelWorldwideTiles': [],
        'hotelContinentalTiles': [],
        'hotelImperialTiles': [],
        'hotelShares': [25] * 7,
        'isCreatingHotel': False,
        'isMergingHotel': False,
        'isPickingFinalMergeWinner': False,
        'isTieBreaking': False,
        'mergingIndex': 0,
        'mergingHotels': [],
        'maxHotelSize': 0,
        'newHotel': [],
        'numHotelsLeft': 7,
        'numPlayers': num_players,
        'players': [] if players is None else players,
        'playerFunds': [6000] * num_players,
        'playerShares': [0] * num_players * 7,
        'squares': starting_board,
        'turn': turn_num,
        'turnBuyPhase': False,
        'turnPlacePhase': False,
    }
    game['numPlayers'] = num_players
    for num in range(num_players):
        game['hand' + str(num)] = player_hands[num*6 : (num+1)*6]
    return game


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 3000)))
