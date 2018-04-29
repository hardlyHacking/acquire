class ShareBuy extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
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

  onChange(event) {
    this.props.handleChange(this.props.name, parseInt(event.target.value) || 0);
  }

  render() {
    const buttonStyle = {
      width: '90px',
      backgroundColor: this.getDefaultColor()
    };
    return (
      <div style={buttonStyle}>
        <h5>{this.props.name}</h5>
        <input type="number"
               onChange={(event) => this.onChange(event)}
               name={this.props.name}
               min="0"
               max="3"
               disabled={this.props.disabled} />
      </div>
    );
  }
}
