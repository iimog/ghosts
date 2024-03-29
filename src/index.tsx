import * as React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

import "./styles.css";
import { createStoreWithMiddleware, isSelectFieldAction } from "./logic/game";

import Board from "./components/Board";

import io from "socket.io-client";

const socket = io.connect(`${location.protocol}//localhost:3001`);
socket.on("message", (data: string) => {
  console.log(data);
});
socket.emit("message", "Player connected");
//window.socket = socket;

const store = createStoreWithMiddleware([
  api => next => action => {
    if (isSelectFieldAction(action)) {
      console.info("emitting", JSON.stringify(action));
      socket.emit("message", JSON.stringify(action));
    }
    return next(action);
  }
]);

function App() {
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
