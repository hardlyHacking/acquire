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
      hand: [],
      indexOffset: indexOffset,
      isCreatingHotel: false,
      isMergingHotel: false,
      hotels: {
        'american': new Set(),
        'continental': new Set(),
        'festival': new Set(),
        'imperial': new Set(),
        'luxor': new Set(),
        'tower': new Set(),
        'worldwide': new Set(),
      },
      maxHotelSize: 0,
      newHotel: new Set(),
      numHotelsLeft: 7,
      squares: squares,
      turn: 0,
      turnPhaseBuy: false,
      turnPhasePlace: false,
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
    })

     this.setState({
       hand: data.hand,
       numPlayers: numPlayers,
       playerFunds: playerFunds,
       playerNames: data.players,
       playerShares: playerShares,
       squares: squaresCopy,
       turn: data.turn,
       turnPhaseBuy: data.turnPhaseBuy,
       turnPhasePlace: data.turnPlacePhase
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
    if (!this.state.turnPhasePlace) {
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
    const hotelSizes = Object.keys(this.state.hotels)
      .map((name) => { return this.state.hotels[name].size; });
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
    for (let hotel in this.state.hotels) {
      if (this.state.hotels[hotel].has(i)) {
        return hotel;
      }
    }
    return null;
  }

  /*
   * Fetch a particular tile in the state given row and column numbers.
   */
  getSquareByIndex(i) {
    const column = this.decodeColumn(i);
    const row = this.decodeRow(i);
    return this.state.squares[row][column];
  }

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
   * Get the (up to) four squares surrounding a given tile.
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
    const newSquares = this.state.newHotel;
    let copyHotels = Object.assign({}, this.state.hotels);
    copyHotels[name] = this.state.newHotel;
    this.setState({
      hotels: copyHotels,
      isCreatingHotel: false,
      newHotel: new Set(),
      numHotelsLeft: this.state.numHotelsLeft - 1,
    });
  }

  handleSquareClick(i) {
    const tileIndex = this.state.hand.indexOf(i);
    if (tileIndex < 0) {
      alert('This tile is not in your hand!');
      return;
    } else {
      const newHand = this.state.hand.slice();
      newHand.splice(tileIndex, 1);
      this.setState({
        hand: newHand
      });
    }

    const squares = this.state.squares.map((row) => { return row.slice(); }),
          column = this.decodeColumn(i),
          row = this.decodeRow(i);
    if (this.state.turnPhasePlace || this.state.isCreatingHotel || squares[row][column]) {
      return;
    }

    const surroundingSquares = this.getSurroundingSquares(i),
          surroundingHotels = this.getSurroundingHotels(i, surroundingSquares),
          doesMakeHotel = surroundingSquares.length === 1 && surroundingHotels.size === 0,
          isJoiningHotel = surroundingHotels.size === 1,
          isMerger = surroundingHotels.size > 1;

    if (this.state.numHotelsLeft === 0 && this.doesMakeHotel(i)) {
      alert('All available hotels are in use.');
      return;
    }

    squares[row][column] = this.decodeValue(i);
    if (doesMakeHotel) {
      this.setState({
        isCreatingHotel: true,
        newHotel: new Set([i, surroundingSquares[0]]),
        squares: squares,
        turnPhasePlace: true,
      });
      return;
    }

    if (isMerger) {
      this.setState({
        isMergingHotel: true,
        turnPhasePlace: true,
      });
      return;
    }

    if (isJoiningHotel) {
      const hotelName = surroundingHotels.values().next().value;
      const newHotelSet = this.state.hotels[hotelName].add(i);
      let copyHotels = Object.assign({}, this.state.hotels);
      copyHotels[hotelName] = newHotelSet;
      this.setState({
        hotels: copyHotels,
        squares: squares,
        turnPhasePlace: true,
      });
    } else {
      this.setState({
        squares: squares,
        turnPhasePlace: true,
      });

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
    const newHand = this.state.hand.slice();
    newHand.push(data.tile);
    this.setState({
      hand: newHand,
      turnPhasePlace: false,
      turnPhaseBuy: false,
      turn: this.state.turn + 1
    });

    $.post({
      url: 'http://localhost:3000/board/end_turn',
      dataType: 'json',
      data: {
        gameId: this.state.gameId
      },
      success: function(data) {
        alert('Turn ended; please wait for your turn and refresh periodically.');
      }})
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
    let hand = this.state.hand.map((tile) => {
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
      const newHotels = Object.keys(this.state.hotels)
        .filter((name) => { return this.state.hotels[name].size === 0; });
      if (this.state.numHotelsLeft !== newHotels.length) {
        throw '(numHotelsLeft, newHotels): ' + this.state.numHotelsLeft + ',' + newHotels.length;
      }
      const hotels = newHotels.map((hotel) => {
        return <HotelPick key={hotel} name={hotel} onClick={() => this.handleHotelPickClick(hotel)} />;
      });
      return (
        <div className="hotel-pick">
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
          hotel = Object.keys(this.state.hotels).filter((hotelName) => {
            return this.state.hotels[hotelName].has(i); });
    return <Square key={i} hotel={hotel.length === 1 ? hotel[0] : null} value={value}
      onClick={() => this.handleSquareClick(i)} />
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
