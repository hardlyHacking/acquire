class ShareBuyTable extends React.Component {
  constructor(props) {
    super(props);
    const buyableHotelsSet = new Set(this.props.buyableHotels);
    this.state = {
      buyableHotels: buyableHotelsSet,
      enableBuyButton: props.enableBuyButton,
      hotelShares: props.totalHotels.map(hotel => {
        const isBuyable = buyableHotelsSet.has(hotel)
        const name = hotel.split('Tiles')[0].split('hotel')[1];
        return <ShareBuy disabled={!isBuyable}
                         handleChange={(name, value) => this.props.handleChange(name, value)}
                         key={hotel}
                         name={name} />;
      }),
      totalHotels: this.props.totalHotels,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props != nextProps) {
      const newBuyableHotelSet = new Set(nextProps.buyableHotels);
      this.setState({
        buyableHotels: newBuyableHotelSet,
        enableBuyButton: nextProps.enableBuyButton,
        hotelShares: nextProps.totalHotels.map(hotel => {
          const isBuyable = newBuyableHotelSet.has(hotel)
          const name = hotel.split('Tiles')[0].split('hotel')[1];
          return <ShareBuy disabled={!isBuyable}
                           handleChange={(name, value) => this.props.handleChange(name, value)}
                           key={hotel}
                           name={name} />;
        }),
        totalHotels: nextProps.totalHotels
      });
    }
  }

  render() {
    return (
      <div>
        <h4>Buy Shares of Hotels</h4>
        <table>
          <tbody>
            <tr>
              <td>
                <button disabled={this.state.enableBuyButton && this.state.validShareNum}
                        onClick={() => this.props.buyShares()}
                >Buy Shares</button>
              </td>
            </tr>
            <tr>
              <td> {this.state.hotelShares[0]} </td>
              <td> {this.state.hotelShares[1]} </td>
              <td> {this.state.hotelShares[2]} </td>
            </tr>
            <tr>
              <td> {this.state.hotelShares[3]} </td>
              <td> {this.state.hotelShares[4]} </td>
              <td> {this.state.hotelShares[5]} </td>
              <td> {this.state.hotelShares[6]} </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
