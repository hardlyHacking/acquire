import bson.json_util
import bson.objectid
import flask
import flask.ext.login
import json
import os
import pymongo
import random


app = flask.Flask(__name__, static_url_path='', static_folder='public')
client = pymongo.MongoClient()
db = client.test_database
login_manager = flask.ext.login.LoginManager()
login_manager.init_app(app)


#@app.route('/game/<game_id>')
#@flask.ext.login.login_required
#def game(game_id):
#    return flask.send_from_directory('public', 'game.html')


@app.route('/game')
#@flask.ext.login.login_required
def game_stuff():
    return flask.send_from_directory('public', 'game.html')


@app.route('/')
def home_page():
    return flask.send_from_directory('public', 'index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    pass
    #TODO
    '''
    form = LoginForm()
    if form.validate_on_submit():
        login_user(user)
        flask.flash('Logged in successfully.')

        next = flask.request.args.get('next')
        if not is_safe_url(next):
            return flask.abort(400)

        return flask.redirect(next or flask.url_for('index'))
    return flask.send_from_directory('public', 'login.html')
    '''


@app.route('/logout', methods=['POST'])
@flask.ext.login.login_required
def logout():
    return flask.send_from_directory('public', 'index.html')


@app.route('/player/<name>')
def get_player(name):
    player = db.players.find_one({'name': name})
    if player is None:
        return flask.jsonify({}), 404
    else:
        return flask.jsonify(player), 200


@app.route('/new_player/<username>/<password>', methods=['POST'])
def create_player(name, password):
    player = db.players.find_one({'name': name})
    if player is None:
        new_player = {'name': name, 'password': password}
        pid = db.players.insert_one(new_player).inserted_id
        return flask.jsonify({'id': str(pid)}), 200
    return flask.jsonify({}), 404


@app.route('/new_game', methods=['POST'])
#@flask.ext.login.login_required
def new_game():
    data = flask.request.form
    num_players, players = int(data['numPlayers']), data.getlist('playerNames[]')
    game = _create_game(num_players, players)
    game_id = db.games.insert_one(game).inserted_id
    return flask.jsonify({'id': str(game_id)}), 200


@app.route('/join_game/<game_id>/<user_id>', methods=['POST'])
@flask.ext.login.login_required
def join_game(game_id, user_id):
    real_id = bson.objectid.ObjectId(game_id)
    game = db.games.find_one({'_id': real_id})
    numPlayers = game['numPlayers'] + 1
    players = game['players'].append(bson.objectid.ObjectId(user_id))
    db.games.update_one({'_id': real_id},
            {'$set': {'numPlayers': numPlayers, 'players': players}})
    return flask.jsonify({}), 200


@app.route('/board/<game_id>')
#@flask.ext.login.login_required
def board_state(game_id):
    real_id = bson.objectid.ObjectId(game_id)
    game = db.games.find_one({'_id': real_id})

    if game is None:
        return flask.jsonify({}), 404

    hand_num = game['turn'] % game['numPlayers']
    hand = game['hand' + str(hand_num)]
    for i in range(game['numPlayers']):
        game.pop('hand' + str(i))
    game['hand'] = hand
    return flask.jsonify(json.loads(bson.json_util.dumps(game))), 200


@app.route('/board/merge_tie_hotel', methods=['POST'])
def merge_tie_hotel():
    data = flask.request.form
    game_id = data['gameId']
    real_id = bson.objectid.ObjectId(game_id)
    larger_hotel, smaller_hotel = data['largerHotel'], data['smallerHotel']

    # Validate this is a real game
    game = db.games.find_one({'_id': real_id})
    if game is None:
        return flask.jsonify({}), 404

    # Validate that both hotels exist
    if larger_hotel not in game or smaller_hotel not in game:
        return flask.jsonify({}), 400

    # Validate that larger_hotel is larger than the smaller_hotel
    if len(game[larger_hotel]) < len(game[smaller_hotel]):
        return flask.jsonify({}), 400

    merging_hotels = game['mergingHotels']
    merging_hotels.remove(smaller_hotel)

    db.games.find_one_and_update({'_id': real_id},
        {
            '$set': {
                'isMergingHotel': True,
                larger_hotel: game[larger_hotel] + game[smaller_hotel],
                'mergingHotels': merging_hotels,
                smaller_hotel: [],
            },
            '$inc': {
                'numHotelsLeft': 1,
            }
        })

    return flask.jsonify({}), 200


@app.route('/board/merge_hotel', methods=['POST'])
def merge_hotel():
    data = flask.request.form
    game_id = data['gameId']
    real_id = bson.objectid.ObjectId(game_id)
    larger_hotel, smaller_hotel = data['largerHotel'], data['smallerHotel']

    # Validate this is a real game
    game = db.games.find_one({'_id': real_id})
    if game is None:
        return flask.jsonify({}), 404

    # Validate that both hotels exist
    if larger_hotel not in game or smaller_hotel not in game:
        return flask.jsonify({}), 400

    # Validate that larger_hotel is larger than the smaller_hotel
    if len(game[larger_hotel]) < len(game[smaller_hotel]):
        return flask.jsonify({}), 400

    db.games.find_one_and_update({'_id': real_id},
        {
            '$set': {
                'isMergingHotel': True,
                larger_hotel: game[larger_hotel] + game[smaller_hotel],
                smaller_hotel: [],
            },
            '$inc': {
                'mergingIndex': 1,
                'numHotelsLeft': 1,
            }
        })

    return flask.jsonify({}), 200

@app.route('/board/merge_finish', methods=['POST'])
def merge_finish():
    data = flask.request.form
    game_id, tile_number = data['gameId'], int(data['tile'])
    real_id = bson.objectid.ObjectId(game_id)
    hotel = data['hotel']

    # Validate this is a real game
    game = db.games.find_one({'_id': real_id})
    if game is None:
        return flask.jsonify({}), 404

    # Validate that the hotel exists
    if len(game[hotel]) == 0:
        return flask.jsonify({}), 400

    possible_squares = _get_possible_surrounding_squares(tile_number)
    surrounding_squares = [s for s in possible_squares if s in game['squares']]
    unmerged_squares = [s for s in surrounding_squares if s not in game[hotel]]

    db.games.find_one_and_update({'_id': real_id},
        {
            '$pushAll': {
                hotel: unmerged_squares + [tile_number],
            },
            '$set': {
                'isMergingHotel': False,
                'mergingIndex': 0,
                'mergingHotels': [],
                'turnPlacePhase': True,
            }
        })

    return flask.jsonify({}), 200


@app.route('/board/merge_tie_break', methods=['POST'])
def merge_tie_break():
    data = flask.request.form
    game_id = data['gameId']
    real_id = bson.objectid.ObjectId(game_id)
    merging_hotels = data.getlist('mergingHotels[]')

    # Validate this is a real game
    game = db.games.find_one({'_id': real_id})
    if game is None:
        return flask.jsonify({}), 404

    db.games.find_one_and_update({'_id': real_id},
        {
            '$set': {
                'isTieBreaking': False,
                'mergingHotels': merging_hotels,
            }
        })

    return flask.jsonify({}), 200


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

    # TODO: make sure none of the surrounding_squares belong to hotels
    # Check if tile_number is joining an existing hotel
    possible_squares = _get_possible_surrounding_squares(tile_number)
    surrounding_squares = [s for s in possible_squares if s in game['squares']]
    hotel_dict = _create_hotel_dict(game)
    surrounding_hotels = _get_surrounding_hotels(surrounding_squares, hotel_dict)

    # Validate that this is not an illegal tile
    safe_hotels = [s for s in surrounding_hotels if len(game[s]) >= 10]
    if len(safe_hotels) > 1:
        return flask.jsonify({}), 400

    # There is a single hotel to which tiles are being added
    if len(surrounding_hotels) == 1:
        db.games.find_one_and_update({'_id': real_id},
            {
                '$pushAll': {
                    surrounding_hotels[0]: surrounding_squares + [tile_number],
                },
            })

    if len(surrounding_hotels) <= 1:
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

    if len(surrounding_hotels) > 1:
        tie_breaking = len({len(game[s]) for s in surrounding_hotels}) == 1

        db.games.find_one_and_update({'_id': real_id},
        {
            '$push': {
                'squares': tile_number
            },
            '$set': {
                'hand' + str(hand_num): hand,
                'turnPlacePhase': True,
                'isMergingHotel': True,
                'isTieBreaking': tie_breaking,
                'mergingHotels': surrounding_hotels,
                'mergingIndex': 0,
            },
        })

    return flask.jsonify({}), 200


@app.route('/board/new_hotel', methods=['POST'])
def new_hotel():
    data = flask.request.form
    game_id = bson.objectid.ObjectId(data['gameId'])
    tile_number = int(data['tile'])

    # Validate this is a real game
    game = db.games.find_one({'_id': game_id})
    if game is None:
        return flask.jsonify({}), 404

    # Validate that a tile has not already been placed
    if tile_number in game['squares']:
        return flask.jsonify({}), 400

    # TODO: use $pull on the mongo-db side instead of in-memory here
    hand_num = game['turn'] % game['numPlayers']
    hand = game['hand' + str(hand_num)]
    hand.remove(tile_number)

    # Validate hotel is not already created
    hotel_name = data['hotelName']
    hotel_tiles = [int(h) for h in data.getlist('hotelTiles[]')]
    if game['numHotelsLeft'] < 1 or \
       len(game[hotel_name]) > 0:
       return flask.jsonify({}), 400

    db.games.find_one_and_update({'_id': game_id},
        {
            '$set': {
                'turnPlacePhase': True,
                'hand' + str(hand_num): hand,
                hotel_name: hotel_tiles,
            },
            '$push': {
                'squares': tile_number,
            },
            '$inc': {
                'numHotelsLeft': -1,
            },
        })

    return flask.jsonify({}), 200


@app.route('/board/new_tile', methods=['POST'])
def new_tile():
    data = flask.request.form
    game_id = bson.objectid.ObjectId(data['gameId'])
    game = db.games.find_one({'_id': game_id})
    hand_label = str(game['turn'] % game['numPlayers'])

    # TODO: validate that the current player only has 5 tiles in hand
    if len(game['hand' + hand_label]) != 5:
        pass

    # TODO: validate that a tile has been placed
    if not game['turnPlacePhase']:
        pass

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


@app.route('/board/end_turn', methods=['POST'])
def end_turn():
    data = flask.request.form
    game_id = bson.objectid.ObjectId(data['gameId'])

    # TODO: validate that a tile has been placed
    # TODO: validate that all players have 6 tiles in their hands

    db.games.find_one_and_update({'_id': game_id},
        {
            '$set': {
                'turnPlacePhase': False,
                'turnBuyPhase': False,
            },
            '$inc': { 'turn': 1 },
        })
    return flask.jsonify({}), 200


@login_manager.user_loader
def load_user_from_request(request):
    api_key = request.args.get('api_key')
    return User.get(api_key)


def _get_row(index):
    return index / 12


def _get_column(index):
    return index % 12


def _get_raw_index(row, column):
    return (row * 12) + column


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


def _create_hotel_dict(game):
    hotel_names = ['hotelLuxorTiles', 'hotelTowerTiles', 'hotelAmericanTiles',
        'hotelFestivalTiles', 'hotelWorldwideTiles', 'hotelContinentalTiles',
        'hotelImperialTiles']
    return {name: set(game[name]) for name in hotel_names}


# Returns a list of names a particular tile belongs to
# In practice, it will be an empty list if the tile is not part of any hotel
# And a list with a single element otherwise, as tiles only belong to 1 hotel
def _get_surrounding_hotels(surrounding_squares, hotel_dict):
    hotels = [[name for name in hotel_dict.keys() if tile in hotel_dict[name]]
        for tile in surrounding_squares]
    return list(set([item for sublist in hotels for item in sublist]))

def _create_game(num_players, players=None):
    random_bag = range(12*9)
    starting_board = list(random.sample(random_bag, num_players))
    turn_num = starting_board.index(min(starting_board))
    bag = [square for square in random_bag if square not in starting_board]
    player_hands = list(random.sample(bag, num_players * 6))
    bag = [s for s in bag if s not in player_hands]
    game = {
        'bag': bag,
        'gameOver': False,
        'hotelLuxorTiles': [],
        'hotelLuxorShares': [],
        'hotelTowerTiles': [],
        'hotelTowerShares': [],
        'hotelAmericanTiles': [],
        'hotelAmericanShares': [],
        'hotelFestivalTiles': [],
        'hotelFestivalShares': [],
        'hotelWorldwideTiles': [],
        'hotelWorldwideShares': [],
        'hotelContinentalTiles': [],
        'hotelContinentalShares': [],
        'hotelImperialTiles': [],
        'hotelImperialShares': [],
        'isMergingHotel': False,
        'isTieBreaking': False,
        'mergingIndex': 0,
        'mergingHotels': [],
        'maxHotelSize': 0,
        'numHotelsLeft': 7,
        'numPlayers': num_players,
        'players': [] if players is None else players,
        'squares': starting_board,
        'turn': turn_num,
        'turnBuyPhase': False,
        'turnPlacePhase': False,
    }
    game['numPlayers'] = num_players
    for num in range(num_players):
        i = str(num)
        game['hand' + i] = player_hands[num*6:(num+1)*6]
        game['shares' + i] = []
        game['cash' + i] = []
    return game


class User(flask.ext.login.UserMixin):
    def __init__(self, username, password, uid, session=''):
        self.username = username
        self.password = password
        self.id = uid
        self.session = session

    @classmethod
    def get(cls, session_id):
        real_id = bson.objectid.ObjectId(session_id)
        user_dict = db.players.find_one({'session_id': real_id})
        return cls(user_dict['username'], user_dict['password'],
                user_dict['_id'], user_dict['session'])

    def get_id(self):
        return self.session


if __name__ == '__main__':
    app.run(port=int(os.environ.get("PORT", 3000)), debug=True)
