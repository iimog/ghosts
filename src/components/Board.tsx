import * as React from "react";
import { shallowEqual, useSelector } from "react-redux";
import { State, Piece } from "../logic/game";

function Square(props: { piece: Piece | null }) {
  let owner = "";
  if (props.piece !== null) {
    owner = props.piece.owner;
  }
  return <div className="Square"> {owner} </div>;
}

export default function Board() {
  let squares = Array(36);
  const selectedData = useSelector(
    (state: State) => ({
      board: state.board,
      turn: state.turn,
      phase: state.phase,
      stats: state.stats
    }),
    shallowEqual
  );
  for (let i = 0; i < 36; i++) {
    squares[i] = <Square key={i} piece={selectedData.board[i]} />;
  }

  return <div className="Board">{squares}</div>;
}
