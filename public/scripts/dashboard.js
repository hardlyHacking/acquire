class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    const split_location = location.search.split('/');
    const split_len = split_location.length
    const playerName = split_location[split_len - 1].split('?name=')[1];

    this.state = {
      games: [],
      name: playerName,
    }

    this.getDashboardState = this.getDashboardState.bind(this);
    this.processDashboardState = this.processDashboardState.bind(this);
  }

  componentWillMount() {
    this.getDashboardState();
  }

  getDashboardState() {
    $.get({
      url: 'http://localhost:3000/player_home/' + this.state.name,
      success: this.processDashboardState
    });
  }

  processDashboardState(data) {
    this.setState({
      games: data.games
    });
  }

  render() {
    return(
      <div>
        <h2>{this.state.name} Player Dashboard</h2>
        {this.state.games.length === 0 ? (
          <p>Womp womp. No games yet.</p>
        ) : (
          <p>All the games here dawg.</p>
        )}
      </div>
    )
  }
}

ReactDOM.render(
  <Dashboard />,
  document.getElementById('container')
);
