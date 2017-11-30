class HotelPick extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    };

    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }

  onMouseEnter() {
    if (!this.props.disabled) {
      this.setState({
        hovered: true
      });
    }
  }

  onMouseLeave() {
    if (!this.props.disabled) {
      this.setState({
        hovered: false
      });
    }
  }

  getDefaultColor() {
    if (this.props.disabled) {
      return '#BFBDBC';
    }
    switch (this.props.name.toLowerCase()) {
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
      <button
        className="hotel-pick-choice"
        disabled={this.props.disabled}
        onClick={() => this.props.onClick()}
        onMouseEnter={() => this.onMouseEnter()}
        onMouseLeave={() => this.onMouseLeave()}
        type="submit"
        style={buttonStyle}
      > {this.props.name} </button>
    );
  }
}
