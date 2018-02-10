class MiniBoard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <p>I swear there is a board here.</p>
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
