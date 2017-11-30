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
    const hotels = this.props.allHotelArray.map((name, index) => {
      const canFound = this.props.hotels[index].size === 0,
            hotelName = name.split('Tiles')[0].split('hotel')[1];
      return <HotelPick disabled={!canFound}
                        key={name}
                        name={hotelName}
                        onClick={() => this.props.handleClick(name)} />;
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
    const index = this.props.mergingIndex;
    const mergingHotels = this.props.mergingHotels;

    let i = index + 1;
    for ( ; i < mergingHotels.length; i++) {
      if (this.props[mergingHotels[i]].size !== this.props[mergingHotels[index]].size) {
        break;
      }
    }

    // We can merge without user input because
    // no hotel is the same size as the current one
    // Logic for index === surroundingHotels.length - 1 is handled elsewhere
    const autoMerge = i === index + 1 && i < mergingHotels.length;

    let hotels;
    if (autoMerge) {
      const name = mergingHotels[index].split('Tiles')[0].split('hotel')[1];
      const hotel = mergingHotels[index];
      hotels = [<HotelPick key={hotel} name={name} onClick={() => this.props.autoMerge(hotel)} />];
    } else {
      hotels = mergingHotels.slice(index, i).map((hotel) => {
        const name = hotel.split('Tiles')[0].split('hotel')[1];
        return <HotelPick key={hotel} name={name} onClick={() => this.props.handleMerge(hotel)} />;
      });
    }

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
    const tiedSet = new Set(this.props.tiedHotels);
    const hotels = this.props.allHotelArray.map(name => {
      const isTied = tiedSet.has(name);
      const hotelName = hotel.split('Tiles')[0].split('hotel')[1];
      return <HotelPick disabled={!isTied}
                        key={name}
                        name={hotelName}
                        onClick={() => this.onClick(hotel)} />;
    });

    return(
      <BaseHotelModal hotels={hotels}
                      secondaryText={`Becasue hotels are the same size, please choose the hotel that will remain after all mergers are complete.`}
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
    if (this.props.isTieBreaking) {
      modal = <TieBreakHotelModal allHotelArray={this.props.allHotelArray}
                                  tiedHotels={this.props.mergingHotels}
                                  onClick={this.props.handleTieBreakClick} />
    } else if (this.props.isMergingHotel) {
      modal = <MergeHotelModal allHotelArray={this.props.allHotelArray}
                               autoMerge={this.props.handleHotelAutoMergeClick}
                               handleMerge={this.props.handleHotelMergeClick}
                               mergingHotels={this.props.mergingHotels}
                               mergingIndex={this.props.mergingIndex} />
    } else if (this.props.isCreatingHotel) {
      modal = <CreateHotelModal allHotelArray={this.props.allHotelArray}
                                handleClick={this.props.handleHotelPickClick}
                                hotels={this.props.hotels} />
    } else {
      modal = <DisabledHotelModal allHotelArray={this.props.allHotelArray} />
    }

    return modal;
  }
}
