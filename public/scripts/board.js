class Board extends React.Component {
  constructor(props) {
    super(props);

    let costMatrix = Array(7).fill(null);
    // Cheap, Medium, Expensive, Stock Price, First, Second
    costMatrix[0]  = [2,    null, null, 200,  2000,  1000];
    costMatrix[1]  = [3,    2,    null, 300,  3000,  1500];
    costMatrix[2]  = [4,    3,    2,    400,  4000,  2000];
    costMatrix[3]  = [5,    4,    3,    500,  5000,  2500];
    costMatrix[4]  = [6,    5,    4,    600,  6000,  3000];
    costMatrix[5]  = [11,   6,    5,    700,  7000,  3500];
    costMatrix[6]  = [21,   11,   6,    800,  8000,  4000];
    costMatrix[7]  = [31,   21,   11,   900,  9000,  4500];
    costMatrix[8]  = [41,   31,   21,   1000, 10000, 5000];
    costMatrix[9]  = [null, 41,   31,   1100, 11000, 5500];
    costMatrix[10] = [null, null, 41,   1200, 12000, 6000];

    const indexOffset = Math.max(this.props.numColumns, this.props.numRows);
    const squares = Array(props.numRows).fill(Array(props.numColumns).fill(null));

    this.state = {
      costMatrix: costMatrix,
      gameId: location.search.split('game_id=')[1],
      gameOver: false,
      hand: new Set(),
      indexOffset: indexOffset,
      isCreatingHotel: false,
      isMergingHotel: false,
      hotelAmericanTiles: new Set(),
      hotelContinentalTiles: new Set(),
      hotelFestivalTiles: new Set(),
      hotelImperialTiles: new Set(),
      hotelLuxorTiles: new Set(),
      hotelTowerTiles: new Set(),
      hotelWorldwideTiles: new Set(),
      maxHotelSize: 0,
      newHotel: new Set(),
      numHotelsLeft: 7,
      squares: squares,
      turn: 0,
      turnPhaseBuy: false,
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
    const numPlayers = parseInt(data.numPlayers);
    const playerFunds = Array(numPlayers).fill(6000);
    const playerShares = Array(numPlayers).fill(Array(7).fill(0));
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
      hotelContinentalTiles: new Set(data.hotelContinentalTiles.map((i) => { return parseInt(i); })),
      hotelFestivalTiles: new Set(data.hotelFestivalTiles.map((i) => { return parseInt(i); })),
      hotelImperialTiles: new Set(data.hotelImperialTiles.map((i) => { return parseInt(i); })),
      hotelLuxorTiles: new Set(data.hotelLuxorTiles.map((i) => { return parseInt(i); })),
      hotelTowerTiles: new Set(data.hotelTowerTiles.map((i) => { return parseInt(i); })),
      hotelWorldwideTiles: new Set(data.hotelWorldwideTiles.map((i) => { return parseInt(i); })),
      numHotelsLeft: data.numHotelsLeft,
      numPlayers: numPlayers,
      playerFunds: playerFunds,
      playerNames: data.players,
      playerShares: playerShares,
      squares: squaresCopy,
      turn: data.turn,
      turnPhaseBuy: data.turnPhaseBuy,
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
    if (this.state.isMergingHotel) {
      alert('Cannot end turn during hotel merger!');
      return;
    }
    this.pickupNewTile();
  }

  gameOver() {
    const hotelSizes = this.getHotelArray().map((key) => {
      return this.state.key.size;
    });
    const maxHotel = Math.max(...hotelSizes);
    const safeChains = hotelSizes.filter((size) => { return size >= 11; });
    const gameOver = maxHotel >= 41 || safeChains.length === 7;
    this.setState({
      gameOver: gameOver,
    });
    return gameOver;
  }

  /*
   * Given a raw tile number, get the hotel occupying that tile.
   */
  getHotel(i) {
    const hotels = this.getHotelArray().filter((name) => {
      return this.state[name].has(i);
    });

    return hotels.length === 1 ? hotels[0] : null;
  }

  /*
   * Returns the set of hotels in the game.
   */
  getHotelArray() {
    return Object.keys(this.state).filter((key) => { return key.startsWith('hotel'); });
  }

  /*
   * Fetch a particular tile in the state given row and column numbers.
   */
  getSquareByIndex(i) {
    const column = this.decodeColumn(i);
    const row = this.decodeRow(i);
    return this.state.squares[row][column];
  }

  /*
   * Given a set of surrounding (occupied) squares and an origin square i
   * (all squares in absolute tile number positioning), return a set of
   * hotels represented by the surrounding squares.
   */
  getSurroundingHotels(i, surroundingSquares) {
    if (surroundingSquares.length === 0) {
      return new Set();
    }
    const hotels = surroundingSquares
      .map((i) => { return this.getHotel(i) })
      .filter((i) => { return i !== null; });
    return new Set(hotels);
  }

  /*
   * Get the (up to) four occupied squares surrounding a given tile.
   * Diagonals are not included.
   * All parameters and return types are in the raw tile number format.
   */
  getSurroundingSquares(i) {
    const column = this.decodeColumn(i);
    const row = this.decodeRow(i);
    let surrounding = [];
    if (column !== 0) {
      const i = this.encodeCoordinate(column - 1, row);
      if (this.getSquareByIndex(i) !== null) {
        surrounding.push(i);
      }
    }
    if (column !== this.state.squares[0].length - 1) {
      const j = this.encodeCoordinate(column + 1, row);
      if (this.getSquareByIndex(j) !== null) {
        surrounding.push(j);
      }
    }
    if (row !== 0) {
      const k = this.encodeCoordinate(column, row - 1);
      if (this.getSquareByIndex(k) !== null) {
        surrounding.push(k);
      }
    }
    if (row !== this.state.squares.length - 1) {
      const l = this.encodeCoordinate(column, row + 1);
      if (this.getSquareByIndex(l) !== null) {
        surrounding.push(l);
      }
    }
    return surrounding;
  }

  handleHotelPickClick(name) {
    $.post({
      url: 'http://localhost:3000/board/new_hotel',
      data: {
        gameId: this.state.gameId,
        hotelName: name,
        hotelTiles: this.state.newHotel,
        tile: this.state.temporaryTile
      },
      success: this.getBoardState
    });

    const newState = function(name, numHotelsLeft, newHotel) {
      let stateObject = {
        isCreatingHotel: false,
        newHotel: [],
        numHotelsLeft: numHotelsLeft - 1,
        turnPlacePhase: true
      };
      stateObject[`${name}`] = new Set(newHotel);
      return stateObject;
    }
    this.setState(newState(name, this.state.numHotelsLeft, this.state.newHotel));
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

    const surroundingSquares = this.getSurroundingSquares(i),
          surroundingHotels = this.getSurroundingHotels(i, surroundingSquares),
          doesMakeHotel = surroundingSquares.length >= 1 && surroundingHotels.size === 0,
          isJoiningHotel = surroundingHotels.size === 1,
          isMerger = surroundingHotels.size > 1;

    const numSafeHotels = Array.from(surroundingHotels).filter((name) => {
      return this.state[`${name}`].size > 10;
    });
    // Cannot merge two or more safe hotels
    if (numSafeHotels > 1) {
      return;
    }

    // Cannot form a hotel if all available hotels are already on the board
    if (this.state.numHotelsLeft === 0 && doesMakeHotel) {
      alert(`All available hotels are in use.\n
            Please wait for mergers to occur before refounding.\n
            In the meantime, select another tile.`);
      return;
    }

    const newHand = new Set(this.state.hand);
    newHand.delete(i);
    squares[row][column] = this.decodeValue(i);
    this.setState({
      hand: newHand,
      squares: squares,
      turnPlacePhase: true
    });

    if (doesMakeHotel) {
      surroundingSquares.push(i);
      this.setState({
        isCreatingHotel: true,
        newHotel: surroundingSquares,
        temporaryTile: i
      });
      return;
    }

    if (isMerger) {
      this.setState({
        isMergingHotel: true
      });
      return;
    }

    if (isJoiningHotel) {
      surroundingSquares.push(i);
      const hotelName = surroundingHotels.values().next().value;
      const newHotel = Array.from(this.state[`${hotelName}`]).concat(surroundingSquares);
      let newState = {};
      newState[`${hotelName}`] = new Set(newHotel);
      this.setState(newState);
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
      turnPhaseBuy: false,
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

  renderBoard() {
    return this.state.squares.map((row, rowNum) => {
      let column = row.map((cell, columnNum) => {
        return this.renderSquare(rowNum * this.state.indexOffset + columnNum);
      });
      return (
        <div key={rowNum} className="board-row">
          {column}
        </div>
      );
    });
  }

  renderBuyPhase() {
    if (this.state.numHotelsLeft === 7) {
      return null;
    }
    const buyableHotels = Object.keys(this.state.hotels)
      .filter((name) => { return this.state.hotels[name].size > 0; })
      .map((name) => {
        return null;
      });
    return null;
  }

  renderEndTurn() {
    if (this.state.gameOver) {
      return null;
    }
    return (
      <button onClick={() => this.endTurn()}
      >End Turn</button>
    );
  }

  renderGameOver() {
    return null;
  }

  renderHand() {
    let hand = Array.from(this.state.hand).map((tile) => {
      const value = this.decodeValue(tile);
      return <Square key={tile} value={value} />
    });
    return(
      <div className="board-row">
        {hand}
      </div>
    );
  }

  renderMergingHotelModal() {
    if (this.state.isMergingHotel) {

    }
    return null;
  }

  renderNewHotelModal() {
    if (this.state.isCreatingHotel) {
      const newHotels = this.getHotelArray().filter((name) => {
        return this.state[name].size === 0;
      });
      if (this.state.numHotelsLeft !== newHotels.length) {
        throw '(numHotelsLeft, newHotels): ' + this.state.numHotelsLeft + ',' + newHotels.length;
      }
      const hotels = newHotels.map((hotel) => {
        const name = hotel.split('Tiles')[0].split('hotel')[1];
        return <HotelPick key={hotel} name={name} onClick={() => this.handleHotelPickClick(hotel)} />;
      });
      return (
        <div className="hotel-pick">
          <h4>Choose a Hotel</h4>
          {hotels}
        </div>
      );
    }
    return null;
  }

  renderSquare(i) {
    const row = this.decodeRow(i),
          column = this.decodeColumn(i),
          value = this.state.squares[row][column],
          hotel = this.getHotelArray().filter((name) => {
            return this.state[name].has(i); });
    const hotelName = hotel.length === 1 ? hotel[0].split('Tiles')[0].split('hotel')[1] : null;
    return <Square key={i} hotel={hotelName} value={value}
      onClick={() => this.handleSquareClick(i)} inHand={this.state.hand.has(i)}/>
  }

  renderPlayer(player) {
    return <Player funds={player.funds} name={player.name} shares={player.shares} />;
  }

  renderPlayers() {
    if (this.state.playerNames === undefined) {
      return null;
    }
    return this.state.playerNames.map((name, index) => {
        return <Player
          funds={this.state.playerFunds[index]}
          key={name}
          name={name}
          shares={this.state.playerShares[index]} />
    });
  }

  render() {
    if (this.state.playerNames === undefined) {
      return null;
    }

    const board = this.renderBoard();
    const hand = this.renderHand();
    const mergeHotelModal = this.renderMergingHotelModal();
    const newHotelModal = this.renderNewHotelModal();
    const players = this.renderPlayers();
    return (
      <div>
        <h4>{this.state.playerNames[this.state.turn % this.state.numPlayers]} to Act</h4>
        {this.renderEndTurn()}
        {board}
        <h4>Tiles in Hand</h4>
        {hand}
        {mergeHotelModal}
        {newHotelModal}
        <div className="status">{players}</div>
      </div>
    );
  }
}
