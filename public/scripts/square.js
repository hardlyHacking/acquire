class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    }
  }

  getDefaultColor() {
    switch (this.props.hotel) {
      case 'American':
        return '#4169E1';
      case 'Continental':
        return '#48D1CC';
      case 'Festival':
        return '#6B8E23';
      case 'Imperial':
        return '#DA70D6';
      case 'Luxor':
        return '#FF6347';
      case 'Tower':
        return '#FFD700';
      case 'Worldwide':
        return '#D2691E';
      default:
        return '#FFFFFF';
    }
  }

  render() {
    let color;
    if (this.props.inHand && this.state.hovered) {
      color = '#E8DAEF';
    } else if (this.props.inHand) {
      color = '#E6B0AA';
    } else  if (this.state.hovered) {
      color = '#A9A9A9';
    } else {
      color = this.getDefaultColor();
    }
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
