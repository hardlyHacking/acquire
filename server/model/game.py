import enum
import random


class Cell(object):
    def __init__(self, letter, num):
        self.num = int(num)
        self.letter = letter.upper()

    def column(self):
        return self.num

    def row(self):
        return ord(self.letter) - ord('A')

    def __eq__(self, other):
        return isInstance(other, Cell) and self.num == other.num \
            self.letter == other.letter

    def __lt__(self, other):
        return isInstance(other, Cell) and (self.num < other.num or
            (self.num == other.num and ord(self.letter) < ord(other.letter)))

    def __gt__(self, other):
        return isInstance(other, Cell) and (self.num > other.num or
            (self.num == other.num and ord(self.letter) > ord(other.letter)))

    def __str__(self):
        return str(self.num) + self.letter


class Hotel(enum.Enum):
    luxor = 1
    tower = 2
    american = 3
    festival = 4
    worldwide = 5
    continental = 6
    imperial = 7


class Player(object):
    def __init__(self, name, hand):
        self.name = name
        self.cash = 6000
        self.hand = hand
        self.stocks = {}


class Game(object):
    COLUMN = 12
    ROW = 9

    def __init__(self, names):
        self.bag = self._prep_tiles()
        self.board = [[None] * 12] * 9
        self.hotels = {h:[] for h in Hotel}
        self.hotel_tiles = {}
        self.players = [new Player(n, self.get_tiles(6)) for n in names]

    def _assign_tiles():
        tiles = get_tiles(len(self.players))

    def _prep_tiles():
        s = set()
        for i in range(1, 13):
            for j in range(9):
                c = new Cell(chr(ord('A') + j), i)
                s.add(c)
        return s

    def get_tiles(num=1):
        vals = random.sample(self.bag, num)
        [self.bag.remove(v) for v in vals]
        return vals

    def does_create_hotel(cell):
        x, y = cell.row(), cell.column()
        isHotel = 0
        if x > 0:
            if self.board[x][y] is not None and
                self.board[x][y] in self.hotel_tiles:
                
        if y > 0:
        if x < ROW:
            pass
        if y < COLUMN:
            pass
