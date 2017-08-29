class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      funds: props.funds,
      shares: props.shares,
    }
  }

  render() {
    let numInvestments = this.state.shares
      .filter((value) => { return value > 0; });
    if (numInvestments.length === 0) {
      numInvestments = [0, 0, 0, 0, 0, 0, 0];
    }

    const renderedInvestments = numInvestments.map((value, i) => {
      return <td key={i}>{value}</td>
    });

    return (
      <tr>
        <td>{this.props.name}</td>
        <td>{this.props.funds}</td>
        {renderedInvestments}
      </tr>
    );
  }
}
