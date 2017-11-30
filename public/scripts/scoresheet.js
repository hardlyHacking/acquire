class ScoreSheet extends React.Component {
  constructor(props) {
    super(props);
  }

  getBackgroundStyle(column) {
    switch (column) {
      case 1:
        return { backgroundColor: '#9ACD32' };
      case 2:
        return { backgroundColor: '#FF6347' };
      case 3:
        return { backgroundColor: '#FFD700' };
      case 4:
        return { backgroundColor: '#4169E1' };
      case 5:
        return { backgroundColor: '#6B8E23' };
      case 6:
        return { backgroundColor: '#D2691E' };
      case 7:
        return { backgroundColor: '#48D1CC' };
      case 8:
        return { backgroundColor: '#DA70D6' };
      default:
        return { backgroundColor: '#FFFFFF' };
    }
  }

  render() {
    if (this.props.playerNames === undefined) {
      return null;
    }

    const players = this.props.playerNames.map((name, index) => {
        return <Player
          funds={this.props.playerFunds[index]}
          key={name}
          name={name}
          shares={this.props.playerShares[index]} /> });

    const columnStyles = [...Array(9).keys()].map((blah, i) => {
      return <col key={i} style={this.getBackgroundStyle(i)} />
    });

    return (
      <div className="status">
        <h4>Score Ledger</h4>
        <table>
          <colgroup>
            {columnStyles}
          </colgroup>
          <thead>
            <tr>
              <th>Player</th>
              <th>Cash</th>
              <th>Luxor</th>
              <th>Tower</th>
              <th>American</th>
              <th>Festival</th>
              <th>Worldwide</th>
              <th>Continental</th>
              <th>Imperial</th>
            </tr>
          </thead>
          <tbody>
            {players}
          </tbody>
        </table>
      </div>
    );
  }
}
