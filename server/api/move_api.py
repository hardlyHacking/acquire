import flask


app = flask.Flask(__name__, static_url_path='', static_folder='public')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))


@app.route('/move/<game>/status', methods=['GET'])
def get_game_status(game=None):
    pass


@app.route('/move/<game>/place/<tile>', methods=['POST'])
def place_tile(game=None, tile=None):
    pass


@app.route('/move/<game>/buy', methods=['POST'])
def buy_shares(game=None):
    pass


@app.route('/move/<game>/pick', methods=['POST'])
def pick_tile(game=None):
    pass


@app.route('/move/<game>/found/<hotel>', methods=['POST'])
def found_hotel(game=None, hotel=None):
    pass


@app.route('/move/<game>/merge', methods=['POST'])
def merger_action(game=None):
    pass


@app.route('/move/<game>/end', methods=['POST'])
def end_game(game=None):
    pass
