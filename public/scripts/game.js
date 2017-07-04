class Game extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const playerNames = ['player1', 'player2', 'player3', 'player4'];
    return (
      <div className="game">
        <div className="game-board">
          <Board numRows={9} numColumns={12} playerNames={playerNames} />
        </div>
        <div className="game-info">
          <div></div>
          <ol></ol>
        </div>
      </div>
    );
  }
}
