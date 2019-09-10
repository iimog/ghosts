import * as React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

import "./styles.css";
import { store } from "./logic/game";

import Board from "./components/Board";

function App() {
  return (
    <div className="App">
      <h1>Spökspelet</h1>
      <h2>
        This is a fun board game for two:{" "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://en.wikipedia.org/wiki/Ghosts_(board_game)"
        >
          rules
        </a>
      </h2>
      <Board />
    </div>
  );
}

const rootElement = document.getElementById("root");
render(
  <Provider store={store}>
    <App />
  </Provider>,
  rootElement
);
