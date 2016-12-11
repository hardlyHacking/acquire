class HotelPick extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    };
  }

  getDefaultColor() {
    switch (this.props.name) {
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
        onClick={() => this.props.onClick()}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
        type="submit"
        style={buttonStyle}
      > {this.props.name} </button>
    );
  }
}

class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    }
  }

  getDefaultColor() {
    switch (this.props.hotel) {
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
      <button className="square" style={buttonStyle}
        onClick={() => this.props.onClick()}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      > {this.props.value} </button>
    );
  }
}

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      funds: props.funds,
      name: props.name,
      shares: funds.shares,
    }
  }

  getHotelName(index) {
    switch (index) {
      case 0:
        return 'american';
      case 1:
        return 'continental';
      case 2:
        return 'festival';
      case 3:
        return 'imperial';
      case 4:
        return 'luxor';
      case 5:
        return 'tower';
      default:
        return 'worldwide';
    }
  }

  renderSharesTable() {
    const numInvestments = this.state.shares
      .filter((value) => { return value > 0; });
    if (shareCounts === 0) {
      return null;
    }
    const shareCounts = numInvestments.map((value, index) => {
      return (
        <tr>
          <td>{this.getHotelName(index)}</td>
          <td>{value}</td>
        </tr>
      )});

    return (
      <table>
        <tr>
          <th>Hotel</th>
          <th>Shares</th>
        </tr>
        {shareCounts}
      </table>
    );
  }

  render() {
    return (
      <div>
        <p>{this.state.name}</p>
        <p>Funds: {this.state.funds}</p>
        {this.renderSharesTable()}
      </div>
    );
  }
}

class Board extends React.Component {
  constructor(props) {
    super(props);

    let squares = Array(props.numRows).fill(null).map((row) => {
      return Array(props.numColumns).fill(null);
    });

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

    const players = props.playerNames.map((name) => {
      return { funds: 6000, name: name, shares: Array(6).fill(0) };
    });
    const indexOffset = Math.max(this.props.numColumns, this.props.numRows);

    this.state = {
      costMatrix: costMatrix,
      gameOver: false,
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
      numHotelsLeft: 6,
      numPlayers: props.playerNames.length,
      players: players,
      squares: squares,
      turn: 0,
    };
  }

  decodeColumn(i) {
    return i % this.props.numColumns;
  }

  decodeRow(i) {
    return Math.floor(i / this.props.numColumns);
  }

  encodeCoordinate(column, row) {
    const numColumns = this.state.squares[0].length;
    return row * numColumns + column;
  }

  getHotel(i) {
    for (let hotel in this.state.hotels) {
      if (this.state.hotels[hotel].has(i)) {
        return hotel;
      }
    }
    return null;
  }

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
    const squares = this.state.squares.map((row) => { return row.slice(); }),
          column = this.decodeColumn(i),
          row = this.decodeRow(i);
    if (squares[row][column]) {
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

    squares[row][column] = String.fromCharCode('A'.charCodeAt(0) + row) + String(column + 1);
    if (doesMakeHotel) {
      this.setState({
        isCreatingHotel: true,
        newHotel: new Set([i, surroundingSquares[0]]),
        squares: squares,
      });
      return;
    }

    if (isMerger) {
      this.setState({
        isMergingHotel: true,
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
      });
    } else {
      this.setState({
        squares: squares,
      });
    }
  }

  renderBoard() {
    if (this.state.isCreatingHotel || this.state.isMergingHotel) {
      return null;
    }

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

  renderMergingHotelModal() {
    if (this.state.isMergingHotel) {

    }
    return null;
  }

  renderNewHotelModal() {
    if (this.state.isCreatingHotel) {
      let newHotels = [];
      for (let hotel in this.state.hotels) {
        if (this.state.hotels[hotel].size === 0) {
          newHotels.push(hotel);
        }
      }
      if (this.state.numHotelsLeft !== newHotels.length - 1) {
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
    return this.state.players.map((player) => {
      this.renderPlayer(player);
    });
  }

  render() {
    const board = this.renderBoard()
    const mergeHotelModal = this.renderMergingHotelModal();
    const newHotelModal = this.renderNewHotelModal();
    const players = this.renderPlayers();
    return (
      <div>
        <div className="status">{players}</div>
        {mergeHotelModal}
        {newHotelModal}
        {board}
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    const playerNames = ['player1', 'player2', 'player3', 'player4'];
    return (
      <div className="game">
        <div className="game-board">
          <Board numRows={9} numColumns={12} playerNames={playerNames} />
        </div>
        <div className="game-info">
          <div></div>
          <ol></ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game numPlayers={4} />,
  document.getElementById('container')
);
