class BaseHotelModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="hotel-pick">
        <h4>{this.props.text}</h4>
        <h5>{this.props.secondaryText}</h5>
        {this.props.hotels}
      </div>
    );
  }
}

class DisabledHotelModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const hotels = this.props.allHotelArray.map(name => {
      const hotelName = name.split('Tiles')[0].split('hotel')[1];
      return <HotelPick disabled={true} key={name} name={hotelName} />;
    });

    return (
      <BaseHotelModal hotels={hotels}
                      text={`No Hotel Based Actions Possible`} />
    );
  }
}

class CreateHotelModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const hotels = this.props.allHotelArray.map((fullName, index) => {
      const canFound = this.props.hotels[index].size === 0,
            hotelName = fullName.split('Tiles')[0].split('hotel')[1];
      return <HotelPick disabled={!canFound}
                        key={fullName}
                        name={hotelName}
                        onClick={() => this.props.onClick(fullName)} />;
    });

    return (
      <BaseHotelModal hotels={hotels} text={`Choose A Hotel To Found`} />
    );
  }
}

class MergeHotelModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
      const minimumSize = this.props.mergingHotels[0].length
      const hotels = this.props.allHotelArray.map((name, index) => {
        const realName = name.split('Tiles')[0].split('hotel')[1];
        return <HotelPick disabled={this.props.hotels[index].length === minimumSize}
                          key={name}
                          name={realName} onClick={() => this.props.onClick(name)} />;
      });

    return(
      <BaseHotelModal hotels={hotels} text={`Choose The Hotel To Be Acquired`} />
    );
  }
}

class TieBreakHotelModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const mergingHotels = new Set(this.props.mergingHotelNames)
    const hotels = this.props.allHotelArray.map(name => {
      const hotelName = name.split('Tiles')[0].split('hotel')[1];
      return <HotelPick disabled={!mergingHotels.has(name)}
                        key={name}
                        name={hotelName}
                        onClick={() => this.props.onClick(name)} />;
    });

    return(
      <BaseHotelModal hotels={hotels}
                      secondaryText={`Hotels are all the same size. Choose the hotel that will remain after all mergers.`}
                      text={`Choose The Final Hotel`} />
    );
  }
}

class HotelActionModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let modal;
    if (this.props.isPickingFinalMergeWinner) {
      modal = <TieBreakHotelModal allHotelArray={this.props.allHotelArray}
                                  mergingHotelNames={this.props.mergingHotelNames}
                                  onClick={(name) => this.props.onClick(name)} />
    } else if (this.props.isMergingHotel || this.props.isTieBreaking) {
      modal = <MergeHotelModal allHotelArray={this.props.allHotelArray}
                               hotels={this.props.hotels}
                               mergingHotels={this.props.mergingHotels}
                               mergingHotelNames={this.props.mergingHotelNames}
                               onClick={(name) => this.props.onClick(name)} />
    } else if (this.props.isCreatingHotel) {
      modal = <CreateHotelModal allHotelArray={this.props.allHotelArray}
                                hotels={this.props.hotels}
                                onClick={(name) => this.props.onClick(name)} />
    } else {
      modal = <DisabledHotelModal allHotelArray={this.props.allHotelArray} />
    }

    return modal;
  }
}
