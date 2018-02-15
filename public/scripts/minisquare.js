class MiniSquare extends React.Component {
  constructor(props) {
    super(props);
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
      case 'Empty':
        return '#FFFFFF';
      default:
        return '#000000';
    }
  }

  render() {
    const color = this.getDefaultColor();
    const buttonStyle = { backgroundColor: color };
    return (
      <div className="mini-square" style={buttonStyle}></div>
    );
  }
}
