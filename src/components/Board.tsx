import * as React from "react";
import { shallowEqual, useSelector, useDispatch } from "react-redux";
import { State, Piece, Direction, gameSlice } from "../logic/game";

function Square(props: {
  piece: Piece | null;
  onClick: (index: number) => void;
  selected: boolean;
}) {
  let owner = "";
  if (props.piece !== null) {
    owner = props.piece.owner;
    let ali = props.piece.alignment;
    if (ali === "good") {
      owner = owner.toLowerCase();
    }
  }
  let color = props.selected ? "orange" : "lightgrey";
  return (
    <button className="Square" {...props} style={{ backgroundColor: color }}>
      {" "}
      {owner}{" "}
    </button>
  );
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
  const dispatch = useDispatch();
  const [selectedField, setSelectedField] = React.useState(-1);
  const clickOnField = (index: number) => {
    return () => {
      let piece = selectedData.board[index];
      if (piece === null || piece.owner !== selectedData.turn) {
        if (selectedField < 0) {
          return;
        }
        try {
          let oldPos = boardCoord(selectedField);
          let direction: Direction = getDirection(selectedField, index);
          if (direction === null) {
            return;
          }
          dispatch(
            gameSlice.actions.move({
              x: oldPos.x,
              y: oldPos.y,
              direction: direction
            })
          );
          setSelectedField(-1);
        } catch (e) {
          console.log(e.message);
        }
        return;
      }
      setSelectedField(index);
    };
  };
  for (let i = 0; i < 36; i++) {
    squares[i] = (
      <Square
        key={i}
        piece={selectedData.board[i]}
        onClick={clickOnField(i)}
        selected={selectedField === i}
      />
    );
  }

  return <div className="Board">{squares}</div>;
}

const boardCoord = (index: number) => {
  return { x: index % 6, y: Math.floor(index / 6) };
};

const getDirection = (source: number, target: number) => {
  let diff: number = target - source;
  if (diff === 1 && target % 6 !== 0) {
    return "r";
  }
  if (diff === -1 && source % 6 !== 0) {
    return "l";
  }
  if (diff === 6) {
    return "d";
  }
  if (diff === -6) {
    return "u";
  }
  return null;
};
