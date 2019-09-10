import * as React from "react";
import { shallowEqual, useSelector, useDispatch } from "react-redux";
import {
  State,
  Piece,
  Direction,
  Player,
  Phase,
  PlayerStats,
  gameSlice
} from "../logic/game";

function Square(props: {
  piece: Piece | null;
  onClick: (index: number) => void;
  selected: boolean;
  turn: Player;
}) {
  let owner = "";
  if (props.piece !== null) {
    owner = props.piece.owner;
    let ali = props.piece.alignment;
    if (ali === "good") {
      owner = owner.toLowerCase();
    }
    if (props.piece.owner !== props.turn) {
      owner = "X";
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

function InfoBox(props: {
  phase: Phase;
  turn: Player;
  winner: Player | "";
  stats: { [player in Player]: PlayerStats };
}) {
  return (
    <div>
      <table>
        <tbody>
          <tr>
            <th>Phase:</th>
            <td>{props.phase}</td>
          </tr>
          <tr>
            <th>Turn:</th>
            <td>{props.turn}</td>
          </tr>
          <tr>
            <th>Winner:</th>
            <td>{props.winner}</td>
          </tr>
          <tr>
            <th>A:</th>
            <td>
              good: {props.stats.A.good}, evil: {props.stats.A.evil}
            </td>
          </tr>
          <tr>
            <th>B:</th>
            <td>
              good: {props.stats.B.good}, evil: {props.stats.B.evil}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
  const isOwnGhost = (piece: Piece | null, turn: Player) =>
    piece !== null && piece.owner === turn;
  const clickOnField = (index: number) => {
    return () => {
      if (selectedData.phase === "won") {
        return;
      }
      let piece = selectedData.board[index];
      if (isOwnGhost(piece, selectedData.turn)) {
        if (selectedData.phase === "running") {
          setSelectedField(index);
        }
        if (selectedData.phase === "assignment") {
          dispatch(gameSlice.actions.markEvil(boardCoord(index)));
        }
      } else {
        if (selectedData.phase !== "running" || selectedField < 0) {
          return;
        }
        try {
          let oldPos = boardCoord(selectedField);
          let direction: Direction | null = getDirection(selectedField, index);
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
    };
  };
  for (let i = 0; i < 36; i++) {
    squares[i] = (
      <Square
        key={i}
        piece={selectedData.board[i]}
        onClick={clickOnField(i)}
        selected={selectedField === i}
        turn={selectedData.turn}
      />
    );
  }

  let winner = selectedData.phase === "won" ? selectedData.turn : "";
  return (
    <div className="Board">
      {squares}
      <InfoBox
        phase={selectedData.phase}
        winner={winner}
        turn={selectedData.turn}
        stats={selectedData.stats}
      />
    </div>
  );
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
