class NewGame extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      numPlayers: 3,
      playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    if (event.target.name === 'numPlayers') {
      this.setState({ numPlayers: parseInt(event.target.value) });
    } else {
      const playerNumber = parseInt(event.target.name.split('player')[1]);
      let namesArray = this.state.playerNames.slice();
      namesArray[playerNumber - 1] = event.target.value;
      this.setState({ playerNames: namesArray })
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    $.post({
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      url: 'http://localhost:3000/new_game',
      data: JSON.stringify({
        numPlayers: this.state.numPlayers,
        playerNames: this.state.playerNames.slice(0, this.state.numPlayers)
      }),
      success: function(data) {
        const game_id = data.id;
        window.location = 'http://localhost:3000/game?game_id=' + game_id;
      }})
      .fail(function() {
        alert('Failed to create game. Make sure all usernames are valid players.');
      });
  }

  render() {
    let nameInputs = [];
    for (let i = 1; i <= parseInt(this.state.numPlayers); i++) {
      nameInputs.push(
        <tr key={"row" + i}>
        <td>
          <label id={"labelPlayer" + i}
                 htmlFor={"player" + i}
          >Player {i}</label>
        </td>
        <td>
          <input id={"valuePlayer" + i}
                 type="text"
                 name={"player" + i}
                 value={this.state.playerNames[i - 1]}
                 onChange={this.handleChange} />
        </td>
        </tr>);
    }

    return(
      <form onSubmit={this.handleSubmit}>
        <h2>Start a new game</h2>
        <label htmlFor="numPlayers">Number of Players</label>
        <input name="numPlayers"
               type="number"
               value={this.state.numPlayers}
               min={this.props.minPlayers}
               max={this.props.maxPlayers}
               onChange={this.handleChange} />

        <table>
          <tbody>
            {nameInputs}
          </tbody>
        </table>
        <input type="submit" value="Start new game" />
      </form>
    );
  }
}
