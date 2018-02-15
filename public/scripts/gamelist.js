class MiniBoard extends React.Component {
  constructor(props) {
    super(props);

    const board = [[], [], [], [], [], [], [], [], []];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 12; j++) {
        board[i].push(i * 12 + j);
      }
    }

    this.state = {
      american: new Set(this.props.game.hotelAmericanTiles),
      board: board,
      continental: new Set(this.props.game.hotelContinentalTiles),
      festival: new Set(this.props.game.hotelFestivalTiles),
      imperial: new Set(this.props.game.hotelImperialTiles),
      luxor: new Set(this.props.game.hotelLuxorTiles),
      tower: new Set(this.props.game.hotelTowerTiles),
      worldwide: new Set(this.props.game.hotelWorldwideTiles),
      squares: new Set(this.props.game.squares)
    }
  }

  renderMiniSquare(i) {
    let hotel = 'Empty';
    if (this.state.squares.has(i)) {
      hotel = 'NonHotel';
      if (this.state.american.has(i)) {
        hotel = 'American';
      } else if (this.state.continental.has(i)) {
        hotel = 'Continental';
      } else if (this.state.festival.has(i)) {
        hotel = 'Festival';
      } else if (this.state.imperial.has(i)) {
        hotel = 'Imperial';
      } else if (this.state.luxor.has(i)) {
        hotel = 'Luxor';
      } else if (this.state.tower.has(i)) {
        hotel = 'Tower';
      } else if (this.state.worldwide.has(i)) {
        hotel = 'Worldwide';
      }
    }

    return (
      <td key={i}>
        <MiniSquare hotel={hotel} />
      </td>
    );
  }

  render() {
    const columns = this.state.board.map((row, rowNum) => {
      let column = row.map(column => {
        return this.renderMiniSquare(column);
      });
      return (
        <tr key={rowNum}>
          {column}
        </tr>
      );
    })

    return(
      <table>
        <tbody>
          {columns}
        </tbody>
      </table>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <div onClick={ () =>
        window.location.href='http://localhost:3000/game?game_id=' + this.props.game._id}
      >
        <p>{this.props.game.players.join(',')}</p>
        <p>Turn: {this.props.game.players[this.props.game.turn]}</p>
        <p>Game over: {this.props.game.gameOver ? "True": "False"}</p>
        <MiniBoard game={this.props.game} />
      </div>
    );
  }
}

class GameList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const gameCells = this.props.games.map((g) => {
      return(
        <tr key={g._id}>
          <td>
            <Game game={g} />
          </td>
        </tr>
      );
    });

    return (
      <table>
        <tbody>
          {gameCells}
        </tbody>
      </table>
    );
  }
}
