class ShareBuyTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      buyableHotels: new Set(this.props.buyableHotels),
      enableBuyButton: this.props.enableBuyButton,
      hotelShares: this.props.totalHotels.map(hotel => {
        const isBuyable = this.state.buyableHotels.has(hotel)
        const name = hotel.split('Tiles')[0].split('hotel')[1];
        return <ShareBuy name={name} key={hotel} disabled={!isBuyable} />;
      }),
      totalHotels: this.props.totalHotels
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props != nextProps) {
      this.setState({
        buyableHotels: new Set(nextProps.buyableHotels),
        enableBuyButton: nextProps.enableBuyButton,
        hotelShares: nextProps.totalHotels.map(hotel => {
          const isBuyable = this.state.buyableHotels.has(hotel)
          const name = hotel.split('Tiles')[0].split('hotel')[1];
          return <ShareBuy disabled={!isBuyable}
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
                <button disabled={this.state.enableBuyButton}
                        onClick={() => this.buyShares()}
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
