class User(object):
    def __init__(self, name, pwd, games=None):
        self.name = name
        self.pwd = pwd
        self.games = if games is None: [] else games

    def add_game(self, game):
        self.games.append(game)
