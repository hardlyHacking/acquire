class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      funds: props.funds,
      name: props.name,
      shares: funds.shares,
    }
  }

  getHotelName(index) {
    switch (index) {
      case 0:
        return 'american';
      case 1:
        return 'continental';
      case 2:
        return 'festival';
      case 3:
        return 'imperial';
      case 4:
        return 'luxor';
      case 5:
        return 'tower';
      default:
        return 'worldwide';
    }
  }

  renderSharesTable() {
    const numInvestments = this.state.shares
      .filter((value) => { return value > 0; });
    if (shareCounts === 0) {
      return null;
    }
    const shareCounts = numInvestments.map((value, index) => {
      return (
        <tr>
          <td>{this.getHotelName(index)}</td>
          <td>{value}</td>
        </tr>
      )});

    return (
      <table>
        <tr>
          <th>Hotel</th>
          <th>Shares</th>
        </tr>
        {shareCounts}
      </table>
    );
  }

  render() {
    return (
      <div>
        <p>{this.state.name}</p>
        <p>Funds: {this.state.funds}</p>
        {this.renderSharesTable()}
      </div>
    );
  }
}
