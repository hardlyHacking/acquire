class PriceSheet extends React.Component {
  render() {
    return(
      <table>
        <tbody>
          <tr>
            <td colSpan="3">Number of Hotels in Chain on Board</td>
            <td></td>
            <td colSpan="2">Majority holder bonus</td>
          </tr>
          <tr>
            <td>Luxor<br />Tower</td>
            <td>American<br />Festival<br />Worldwide</td>
            <td>Continental<br />Imperial</td>
            <td>Stock Price per Block<br />Buying / Selling</td>
            <td>First</td>
            <td>Second</td>
          </tr>
          <tr>
            <td>2</td>
            <td>-</td>
            <td>-</td>
            <td>$200</td>
            <td>$2000</td>
            <td>$1000</td>
          </tr>
          <tr>
            <td>3</td>
            <td>2</td>
            <td>-</td>
            <td>$300</td>
            <td>$3000</td>
            <td>$1500</td>
          </tr>
          <tr>
            <td>4</td>
            <td>3</td>
            <td>2</td>
            <td>$400</td>
            <td>$4000</td>
            <td>$2000</td>
          </tr>
          <tr>
            <td>5</td>
            <td>4</td>
            <td>3</td>
            <td>$500</td>
            <td>$5000</td>
            <td>$2500</td>
          </tr>
          <tr>
            <td>6-10</td>
            <td>5</td>
            <td>4</td>
            <td>$600</td>
            <td>$6000</td>
            <td>$3000</td>
          </tr>
          <tr>
            <td>11-20</td>
            <td>6-10</td>
            <td>5</td>
            <td>$700</td>
            <td>$7000</td>
            <td>$3500</td>
          </tr>
          <tr>
            <td>21-30</td>
            <td>11-20</td>
            <td>6-10</td>
            <td>$800</td>
            <td>$8000</td>
            <td>$4000</td>
          </tr>
          <tr>
            <td>31-40</td>
            <td>21-30</td>
            <td>11-20</td>
            <td>$900</td>
            <td>$9000</td>
            <td>$4500</td>
          </tr>
          <tr>
            <td>41 & over</td>
            <td>31-40</td>
            <td>21-30</td>
            <td>$1000</td>
            <td>$10000</td>
            <td>$5000</td>
          </tr>
          <tr>
            <td>-</td>
            <td>41 & over</td>
            <td>31-40</td>
            <td>$1100</td>
            <td>$11000</td>
            <td>$5500</td>
          </tr>
          <tr>
            <td>-</td>
            <td>-</td>
            <td>41 & over</td>
            <td>$1200</td>
            <td>$12000</td>
            <td>$6000</td>
          </tr>
        </tbody>
      </table>
    );
  }
}
