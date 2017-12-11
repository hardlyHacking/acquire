class Player extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const renderedInvestments = this.props.shares.map((value, i) => {
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
