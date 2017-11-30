class ShareBuy extends React.Component {
  constructor(props) {
    super(props);
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
    const buttonStyle = {
      width: '90px',
      backgroundColor: this.getDefaultColor()
    };
    return (
      <div style={buttonStyle}>
        <h5>{this.props.name}</h5>
        <input type="number"
               min="1"
               max="3"
               name={this.props.name}
               disabled={this.props.disabled} />
      </div>
    );
  }
}
