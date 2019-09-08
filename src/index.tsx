import * as React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

import "./styles.css";
import { store } from "./logic/game";

import Board from "./components/Board";

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
render(
  <Provider store={store}>
    <App />
  </Provider>,
  rootElement
);
