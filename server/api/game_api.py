import flask


app = flask.Flask(__name__, static_url_path='', static_folder='public')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))


@app.route('/game', methods=['GET'])
def all_public_games():
    pass


@app.route('/game/<size>', methods=['POST'])
def create_game(size=3):
    pass


@app.route('/game/<game>', methods=['POST'])
def join_game(game=None):
    pass


@app.route('/game/<game>', methods=['DELETE'])
def delete_game(game=None):
    pass


@app.route('/game/<game>/accept/<user>', methods=['POST'])
def accept_user(game=None, user=None):
    pass


@app.route('/game/<game>/reject/<user>', methods=['POST'])
def reject_user(game=None, user=None):
    pass


@app.route('/game/<game>', methods=['POST'])
def start_game(game=None):
    pass


@app.route('/game/<game>', methods=['POST'])
def cancel_game(game=None):
    pass
