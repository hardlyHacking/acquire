class ShareBuyTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      totalHotels: this.props.totalHotels,
      buyableHotels: new Set(this.props.buyableHotels)
    };
  }

  render() {
    const hotelShares = this.state.totalHotels.map(hotel => {
      const isBuyable = this.state.buyableHotels.has(hotel)
      const name = hotel.split('Tiles')[0].split('hotel')[1];
      return <ShareBuy name={name} key={hotel} disabled={!isBuyable} />;
    });

    return (
      <div>
        <h4>Buy Shares of Hotels</h4>
        <table>
          <tbody>
            <tr>
              <td> {hotelShares[0]} </td>
              <td> {hotelShares[1]} </td>
              <td> {hotelShares[2]} </td>
            </tr>
            <tr>
              <td> {hotelShares[3]} </td>
              <td> {hotelShares[4]} </td>
              <td> {hotelShares[5]} </td>
              <td> {hotelShares[6]} </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
