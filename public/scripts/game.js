class Game extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board numRows={9} numColumns={12} />
        </div>
        <div className="game-info">
          <div></div>
          <ol></ol>
        </div>
      </div>
    );
  }
}
