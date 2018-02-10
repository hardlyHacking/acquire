class CreatePlayer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name : 'sample_name',
      password: 'sample_password'
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    if (event.target.name === 'name') {
      this.setState({ name: event.target.value });
    } else if (event.target.name === 'password') {
      this.setState({ password: event.target.value })
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    $.post({
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      url: 'http://localhost:3000/new_player',
      data: JSON.stringify({
        name: this.state.name,
        password: this.state.password
      }),
      success: function(data, textStatus, jqXHR) {
        alert(`Success! Created player`);
      }
    })
    .fail(function() {
      alert('Failed to create player - likely user name is already taken!');
    });
  }

  render() {
    return(
      <form>
        <h2>Create Account</h2>
        <table>
          <tbody>
            <tr>
              <td>
                <label>Display name</label>
              </td>
            </tr>
            <tr>
              <td>
                <input name="name"
                       type="text"
                       value={this.state.name}
                       onChange={this.handleChange} />
                <input name="password"
                       type="password"
                       value={this.state.password}
                       onChange={this.handleChange} />
              </td>
            </tr>
            <tr>
              <td>
                <button type="button" onClick={this.handleSubmit}>Create player</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    )
  }
}

class JoinGame extends React.Component {
  constructor(props) {
    super(props);

    this.state = { value: '' }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    alert('Joining a game w00t!');
  }

  render() {
    return(
      <form onSubmit={this.handleSubmit}>
        <h2>Join a Game</h2>
        <table>
          <tbody>
            <tr>
              <td>
                <label htmlFor="gameCode">Game code</label>
              </td>
            </tr>
            <tr>
              <td>
                <input name="gameCode"
                       type="text"
                       value={this.state.value}
                       onChange={this.handleChange} />
              </td>
            </tr>
            <tr>
              <td>
                <input type="submit" value="Join game" />
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    );
  }
}

class Landing extends React.Component {
  render() {
    return(
      <table>
        <tbody>
          <tr>
            <td>
              <JoinGame />
            </td>
          </tr>
          <tr>
            <td>
              <NewGame minPlayers="3" maxPlayers="6"/>
            </td>
          </tr>
          <tr>
            <td>
              <Login />
            </td>
          </tr>
          <tr>
            <td>
              <CreatePlayer />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}

ReactDOM.render(
  <Landing />,
  document.getElementById('container')
);
