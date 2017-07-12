import flask


app = flask.Flask(__name__, static_url_path='', static_folder='public')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))


@app.route('/user/<name>', methods=['GET'])
def get_user(name=None):
    pass


@app.route('/user/<name>', methods=['POST'])
def create_user(name=None):
    pass


@app.route('/user/<name>', methods=['PUT'])
def edit_user(name=None):
    pass


@app.route('/user/<name>', methods=['DELETE'])
def delete_user(name=None):
    pass
