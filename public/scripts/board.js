const NUM_HOTELS = 7;

class Board extends React.Component {
  constructor(props) {
    super(props);

    const indexOffset = Math.max(this.props.numColumns, this.props.numRows);
    const squares = Array(props.numRows).fill(Array(props.numColumns).fill(null));

    this.state = {
      buyShares: {},
      gameId: location.search.split('game_id=')[1],
      gameOver: false,
      hand: new Set(),
      indexOffset: indexOffset,
      isCreatingHotel: false,
      isMergingHotel: false,
      isPickingFinalMergeWinner: false,
      isTieBreaking: false,
      hotelAmericanTiles: new Set(),
      hotelContinentalTiles: new Set(),
      hotelFestivalTiles: new Set(),
      hotelImperialTiles: new Set(),
      hotelLuxorTiles: new Set(),
      hotelTowerTiles: new Set(),
      hotelWorldwideTiles: new Set(),
      maxHotelSize: 0,
      mergingIndex: 0,
      mergingHotels: [],
      newHotel: new Set(),
      numHotelsLeft: NUM_HOTELS,
      sharesToBuy: {},
      squares: squares,
      turn: 0,
      turnBuyPhase: false,
      turnPlacePhase: false,
    };

    this.getBoardState = this.getBoardState.bind(this);
    this.processBoardState = this.processBoardState.bind(this);
    this.processNewTile = this.processNewTile.bind(this);
  }

  getBoardState() {
    $.get({
      url: 'http://localhost:3000/board/' + this.state.gameId,
      success: this.processBoardState
    });
  }

  processBoardState(data) {
    let squaresCopy = this.state.squares.map((row) => { return row.slice(); });
    data.squares.map((encodedSquare) => {
      const tileNumber = parseInt(encodedSquare);
      const row = this.decodeRow(tileNumber);
      const column = this.decodeColumn(tileNumber);
      squaresCopy[row][column] = String.fromCharCode('A'.charCodeAt(0) + row) + String(column + 1);
    });

    this.setState({
      hand: new Set(data.hand),
      hotelAmericanTiles: new Set(data.hotelAmericanTiles.map((i) => { return parseInt(i); })),
      hotelAmericanShares: parseInt(data.hotelShares[2]),
      hotelContinentalTiles: new Set(data.hotelContinentalTiles.map((i) => { return parseInt(i); })),
      hotelContinentalShares: parseInt(data.hotelShares[5]),
      hotelFestivalTiles: new Set(data.hotelFestivalTiles.map((i) => { return parseInt(i); })),
      hotelFestivalShares: parseInt(data.hotelShares[3]),
      hotelImperialTiles: new Set(data.hotelImperialTiles.map((i) => { return parseInt(i); })),
      hotelImperialShares: parseInt(data.hotelShares[6]),
      hotelLuxorTiles: new Set(data.hotelLuxorTiles.map((i) => { return parseInt(i); })),
      hotelLuxorShares: parseInt(data.hotelShares[0]),
      hotelTowerTiles: new Set(data.hotelTowerTiles.map((i) => { return parseInt(i); })),
      hotelTowerShares: parseInt(data.hotelShares[1]),
      hotelWorldwideTiles: new Set(data.hotelWorldwideTiles.map((i) => { return parseInt(i); })),
      hotelWorldwideShares: parseInt(data.hotelShares[4]),
      isCreatingHotel: data.isCreatingHotel,
      isMergingHotel: data.isMergingHotel,
      isPickingFinalMergeWinner: data.isPickingFinalMergeWinner,
      isTieBreaking: data.isTieBreaking,
      mergingIndex: data.mergingIndex,
      mergingHotels: data.mergingHotels,
      newHotel: new Set(data.newHotel),
      numHotelsLeft: parseInt(data.numHotelsLeft),
      numPlayers: parseInt(data.numPlayers),
      playerFunds: data.playerFunds,
      playerNames: data.players,
      playerShares: data.playerShares.map((i) => { return parseInt(i); }),
      sharesToBuy: {},
      squares: squaresCopy,
      turn: data.turn,
      turnBuyPhase: data.turnBuyPhase,
      turnPlacePhase: data.turnPlacePhase
    });
  }

  componentWillMount() {
    this.getBoardState();
  }

  /*
   * Convert a raw tile number into a column number.
   */
  decodeColumn(i) {
    return i % this.props.numColumns;
  }

  /*
   * Convert a raw tile number into a row number.
   */
  decodeRow(i) {
    return Math.floor(i / this.props.numColumns);
  }

  /*
   * Conver a raw tile number into its string value representation.
   * E.G. 0 -> "A1"
   */
  decodeValue(i) {
    const column = this.decodeColumn(i);
    const row = this.decodeRow(i);
    return String.fromCharCode('A'.charCodeAt(0) + row) + String(column + 1);
  }

  /*
   * Convert a row and column into a raw tile number.
   */
  encodeCoordinate(column, row) {
    const numColumns = this.state.squares[0].length;
    return row * numColumns + column;
  }

  endTurn() {
    if (!this.state.turnPlacePhase) {
      alert('Cannot end turn without placing a tile!');
      return;
    }
    if (this.state.isCreatingHotel) {
      alert('Cannot end turn during hotel creation!');
      return;
    }
    if (this.state.isMergingHotel || this.state.isPickingFinalMergeWinner) {
      alert('Cannot end turn during hotel merger!');
      return;
    }
    this.pickupNewTile();
  }

  gameOver() {
    $.post({
      url: 'http://localhost:3000/board/end_game',
      data: {
        gameId: this.state.gameId
      },
      success: this.getBoardState
    })
    .fail(function() {
      alert('Could not end the game at this time.');
    });
  }

  /*
   * Returns the set of hotels in the game.
   */
  getHotelArray() {
    return Object.keys(this.state).filter((key) => {
      return key.startsWith('hotel') && key.endsWith('Tiles');
    });
  }

  /*
   * Fetch a particular tile in the state given row and column numbers.
   */
  getSquareByIndex(i) {
    const column = this.decodeColumn(i);
    const row = this.decodeRow(i);
    return this.state.squares[row][column];
  }

  handleHotelPickClick(name) {
    $.post({
      url: 'http://localhost:3000/board/pick_hotel',
      data: {
        gameId: this.state.gameId,
        hotelName: name
      },
      success: this.getBoardState
    });
  }

  handleShareBuyChange(name, value) {
    this.setState({
      sharesToBuy: {
        ...this.state.sharesToBuy,
        [name]: value
      }
    });
  }

  handleShareBuyClick() {
    $.post({
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      url: 'http://localhost:3000/board/buy_shares',
      data: JSON.stringify({
        gameId: this.state.gameId,
        shares: this.state.sharesToBuy,
      }),
      success: this.getBoardState
    });
  }

  handleSquareClick(i) {
    // Cannot place a tile if one has already been placed this turn
    // Cannot place a tile during hotel creation
    if (this.state.turnPlacePhase || this.state.isCreatingHotel) {
      return;
    }

    const inHand = this.state.hand.has(i);
    if (!inHand) {
      return;
    }

    const squares = this.state.squares.map((row) => { return row.slice(); }),
          column = this.decodeColumn(i),
          row = this.decodeRow(i);
    // Square is already taken with another tile
    if (squares[row][column]) {
      return;
    }

    $.post({
      url: 'http://localhost:3000/board/place_tile',
      dataType: 'json',
      data: {
        gameId: this.state.gameId,
        tile: i
      },
      success: this.getBoardState
      })
      .fail(function() {
        alert('Could not post tile, please refresh and try again');
      });
  }

  pickupNewTile() {
    $.post({
      url: 'http://localhost:3000/board/new_tile',
      dataType: 'json',
      data: { gameId: this.state.gameId },
      success: this.processNewTile
      })
      .fail(function() {
        alert('Could not pick up new tile');
      })
  }

  processNewTile(data) {
    const newHand = new Set(this.state.hand);
    newHand.add(data.tile);
    this.setState({
      hand: newHand,
      turnPlacePhase: false,
      turnBuyPhase: false,
      turn: this.state.turn + 1
    });

    $.post({
      url: 'http://localhost:3000/board/end_turn',
      dataType: 'json',
      data: {
        gameId: this.state.gameId
      },
      success: this.getBoardState })
      .fail(function() {
        alert('Could not end turn - please refresh and try again.');
      });
  }

  renderActionButtons() {
    if (this.state.gameOver) {
      return null;
    }
    return (
      <div>
        <button disabled={!this.state.turnPlacePhase}
                onClick={() => this.endTurn()}
        >End Turn</button>
        <button onClick={() => this.gameOver()}
        >Game Over</button>
      </div>
    );
  }

  renderBoard() {
    const columns = this.state.squares.map((row, rowNum) => {
      let column = row.map((cell, columnNum) => {
        return this.renderSquare(rowNum * this.state.indexOffset + columnNum);
      });
      return (
        <tr key={rowNum} className="board-row">
          {column}
        </tr>
      );
    });

    return(
      <table>
        <tbody>
          {columns}
        </tbody>
      </table>
    );
  }

  renderBuyPhase() {
    // All hotels of length > 0 that have outstanding shares
    const buyableHotels = this.getHotelArray()
      .filter((name) => {
        const prefix = name.split('Tiles')[0];
        const sharesName = prefix + 'Shares';
        return this.state[name].size > 0 && this.state[sharesName] > 0;
      });
    const enableBuyButton = buyableHotels.length === 0 ||
      !(this.state.turnPlacePhase && !this.state.turnBuyPhase);
    return <ShareBuyTable
        buyableHotels={buyableHotels}
        buyShares={() => this.handleShareBuyClick()}
        enableBuyButton={enableBuyButton}
        handleChange={(name, value) => this.handleShareBuyChange(name, value)}
        totalHotels={this.getHotelArray()} />
  }

  renderGameOver() {
    return null;
  }

  renderHand() {
    let hand = Array.from(this.state.hand).map((tile) => {
      const value = this.decodeValue(tile);
      return <Square key={tile}
                     onClick={() => this.handleSquareClick(tile)}
                     value={value} />
    });
    return(
      <div className="board-row">
        <h4>Tiles in Hand</h4>
        {hand}
      </div>
    );
  }

  renderHotelActionModal() {
    const hotels = this.getHotelArray().map(item => { return this.state[item] });
    const mergingHotels = this.state.mergingHotels.map(name => { return this.state[name] });

    return (
      <HotelActionModal allHotelArray={this.getHotelArray()}
                        hotels={hotels}
                        isCreatingHotel={this.state.isCreatingHotel}
                        isMergingHotel={this.state.isMergingHotel}
                        isPickingFinalMergeWinner={this.state.isPickingFinalMergeWinner}
                        isTieBreaking={this.state.isTieBreaking}
                        mergingHotelNames={this.state.mergingHotels}
                        mergingHotels={mergingHotels}
                        onClick={(name) => this.handleHotelPickClick(name)} />
    );
  }

  renderSquare(i) {
    const row = this.decodeRow(i),
          column = this.decodeColumn(i),
          value = this.state.squares[row][column],
          hotel = this.getHotelArray().filter(name => { return this.state[name].has(i); });
    const hotelName = hotel.length === 1 ? hotel[0].split('Tiles')[0].split('hotel')[1] : null;
    return (
      <td key={i}>
        <Square hotel={hotelName}
                inHand={this.state.hand.has(i)}
                onClick={() => this.handleSquareClick(i)}
                value={value} />
      </td>
    );
  }

  renderScoreSheet() {
    return <ScoreSheet playerNames={this.state.playerNames}
        playerFunds={this.state.playerFunds}
        playerShares={this.state.playerShares} />
  }

  renderPriceSheet() {
    return (
      <div>
        <h4>Acquire Information Card</h4>
        <PriceSheet />
      </div>
    );
  }

  render() {
    if (this.state.playerNames === undefined) {
      return null;
    }

    const board = this.renderBoard(),
          buyPhase = this.renderBuyPhase(),
          hand = this.renderHand(),
          hotelModal = this.renderHotelActionModal(),
          priceSheet = this.renderPriceSheet(),
          scoreSheet = this.renderScoreSheet();

    const paddingLeft = {
      paddingLeft: '20px'
    };

    return (
      <div>
        {this.renderActionButtons()}
        <table>
          <tbody>
            <tr><td><h2>
              {this.state.playerNames[this.state.turn % this.state.numPlayers]} to Act
            </h2></td></tr>
            <tr>
              <td> {board} </td>
              <td style={paddingLeft}> {priceSheet} </td>
            </tr>
            <tr>
              <td> {hand} </td>
              <td style={paddingLeft}> {scoreSheet} </td>
            </tr>
            <tr>
              <td> {hotelModal} </td>
              <td style={paddingLeft}> {buyPhase} </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
