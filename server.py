import bson.objectid
import flask
import flask.ext.login
import json
import os
import pymongo


app = flask.Flask(__name__, static_url_path='', static_folder='public')
client = pymongo.MongoClient()
db = client.test_database
login_manager = flask.ext.login.LoginManager()
login_manager.init_app(app)


@app.route('/game/<game_id>')
#@flask.ext.login.login_required
def game(game_id):
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
    else:
        return flask.jsonify({'game': game}), 200


@login_manager.user_loader
def load_user_from_request(request):
    api_key = request.args.get('api_key')
    return User.get(api_key)


def _create_game(num_players, players=None):
    game = {
        'board': [0] * 108,
        'numPlayers': num_players,
        'players': [] if players is None else players,
        'luxor': [],
        'tower': [],
        'american': [],
        'festival': [],
        'worldwide': [],
        'continental': [],
        'imperial': [],
    }
    game['numPlayers'] = num_players
    for num in range(num_players):
        i = str(num)
        game['hand' + i] = []
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
