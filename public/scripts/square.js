class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    }
  }

  getDefaultColor() {
    switch (this.props.hotel) {
      case 'american':
        return '#4169E1';
      case 'continental':
        return '#48D1CC';
      case 'festival':
        return '#6B8E23';
      case 'imperial':
        return '#DA70D6';
      case 'luxor':
        return '#FF6347';
      case 'tower':
        return '#FFD700';
      case 'worldwide':
        return '#D2691E';
      default:
        return '#FFFFFF';
    }
  }

  render() {
    const color = this.state.hovered ? '#A9A9A9' : this.getDefaultColor();
    const buttonStyle = { backgroundColor: color };
    return (
      <button className="square" style={buttonStyle}
        onClick={() => this.props.onClick()}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      > {this.props.value} </button>
    );
  }
}
