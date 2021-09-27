import { h } from 'https://cdn.skypack.dev/preact?min';
import htm from 'https://cdn.skypack.dev/htm?min';
import { useState, useRef } from 'https://cdn.skypack.dev/preact/hooks?min';

const html = htm.bind(h);

function Cell({ value, onTurn, coords }) {
  function onCellClick() {
    if (value !== '') return console.log('Already clicked');

    onTurn(coords);
  }

  return html`<div className="cell" onClick=${onCellClick}>${value}</div>`
}

const defaultGrid = [
  ['', '', ''],
  ['', '', ''],
  ['', '', ''],
];

function evaluate(grid) {
  let win = false;

  // check rows
  grid.forEach((row) => {
    if (row[0] !== '' && row[0] === row[1] && row[0] === row[2]) {
      win = true;
    }
  });

  // check cols
  for (let col = 0; col < 3; col += 1) {
    if (grid[0][col] !== '' && grid[0][col] === grid[1][col] && grid[0][col] === grid[2][col]) {
      win = true;
    }
  }
  // check diagonals
  if (grid[0][0] !== '' && grid[0][0] === grid[1][1] && grid[0][0] === grid[2][2]) {
    win = true;
  }
  if (grid[0][2] !== '' && grid[0][2] === grid[1][1] && grid[0][2] === grid[2][0]) {
    win = true;
  }

  return {
    win,
  };
}

export default function PageA({
  // defaultName,
  // clicks,
  // setClicks,
}) {
  // 0-9
  const [countTurns, setCountTurns] = useState(0);
  const [lastTurnValue, setLastTurnValue] = useState('o');
  const grid = useRef([...defaultGrid]);
  const [message, setMessage] = useState('');


  // useEffect(() => {
  //   // if even => 'o'
  //   // if uneven => 'x'
  //   // if 
  // }, [grid, lastTurn, setLastTurn])

  function reset() {
    // setCountTurns(0);
    // grid.current = [...defaultGrid];
  }

  function onTurn(coords) {
    setCountTurns(countTurns + 1);

    const [x, y] = coords;
    const currentValue = grid.current[y][x];

    console.log(coords, currentValue, grid.current)

    if (lastTurnValue === 'o') {
      setLastTurnValue('x');
      grid.current[y][x] = 'x';
    } else {
      setLastTurnValue('o');
      grid.current[y][x] = 'o';
    }

    const result = evaluate(grid.current);
    console.log(result);

    //if winner - show message - reset
    if (result.win) {
      setMessage(`${grid.current[y][x]} wins!`)
      reset();
    } else if (countTurns === 8) {
      //if no winner - same - reset
      setMessage(`It's a draw.`)
      reset();
    }
    //if ongoing game - do nothing
  }

  if (!!message) {
    return html`<p>${message}</p>`;
  }

  return html`
<div className="grid">
  <div className="row">
  ${grid.current[0].map((value, column) => {
    return html`<${Cell} value=${value} onTurn=${onTurn} coords=${[column, 0]} />`;
  })}
  </div>
  <div className="row">
    ${grid.current[1].map((value, column) => {
    return html`<${Cell} value=${value} onTurn=${onTurn} coords=${[column, 1]} />`;
  })}
  </div>
  <div className="row">
  ${grid.current[2].map((value, column) => {
    return html`<${Cell} value=${value} onTurn=${onTurn} coords=${[column, 2]} />`;
  })}
  </div>
</div>
  `;
}
