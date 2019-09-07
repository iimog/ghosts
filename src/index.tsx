import * as React from "react";
import { render } from "react-dom";

import "./styles.css";
import "./logic/game";

function Square() {
  return <div className="Square" />;
}

function Board() {
  let squares = Array(36);
  for (let i = 0; i < 36; i++) {
    squares[i] = <Square key={i} />;
  }
  return <div className="Board">{squares}</div>;
}

function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <Board />
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
