import * as React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

import "./styles.css";
import { store } from "./logic/game";

import Board from "./components/Board";

import io from "socket.io-client";

const socket = io.connect(`${location.protocol}//${location.host}`);
socket.on("message", (data: string) => {
  console.log(data);
});
socket.emit("message", "Player connected");
//window.socket = socket;

function App() {
  const [c, sC] = React.useState(0);
  if (c === 0) {
    sC(setInterval(() => sC(x => x + 1), 1000));
  }
  return (
    <div className="App" style={{ textAlign: "center" }}>
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
