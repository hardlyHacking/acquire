// Generic form handling username and password
class UsernamePasswordForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: 'sample_name',
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
      url: this.props.submitUrl,
      data: JSON.stringify({
        name: this.state.name,
        password: this.state.password
      }),
      success: this.props.successFunction
    })
    .fail(function() {
      alert(this.props.failureMessage);
    })
  }

  render() {
    return(
      <form>
        <h2>Login</h2>
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
                <button type="button" onClick={this.handleSubmit}>
                  {this.props.buttonText}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    )
  }
}

function Login(props) {
  return(
    <UsernamePasswordForm
      buttonText = 'Login'
      failureMessage = 'Could not log in!'
      submitUrl = 'http://localhost:3000/login'
      successFunction = {
        (data) => window.location = 'http://localhost:3000/dashboard?name=' + data.name
      }
    />
  )
}
