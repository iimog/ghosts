import * as React from "react";
import { shallowEqual, useSelector, useDispatch } from "react-redux";
import {
  State,
  Player,
  gameSlice,
  selectWinner,
  selectTurn,
  selectStats,
  selectPhase,
  Position,
  selectPiece,
  selectIsSelected
} from "../logic/game";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ghostA_src from "../pictures/ghost_yellow.svg";
import ghostB_src from "../pictures/ghost_purple.svg";
import evil_src from "../pictures/devil.svg";
import good_src from "../pictures/angel.svg";
import crown_src from "../pictures/crown.svg";
import circle_src from "../pictures/circle.svg";
import circleA_src from "../pictures/circle_yellow.svg";
import circleB_src from "../pictures/circle_purple.svg";

const playerImages = {
  A: circleA_src,
  B: circleB_src
};

const mask = (player: Player) => (player === "A" ? "X" : "O");

function Square({ position, masked }: { position: Position; masked: boolean }) {
  const turn = useSelector(selectTurn);
  const piece = useSelector(selectPiece(position));
  const selected = useSelector(selectIsSelected(position));
  const gameOver = useSelector(selectPhase) === "won";
  const dispatch = useDispatch();

  let owner = "";
  if (piece !== null) {
    owner = piece.owner;
    let ali = piece.alignment;
    if (ali === "good") {
      owner = owner.toLowerCase();
    }
    if (masked || (!gameOver && piece.owner !== turn)) {
      owner = mask(piece.owner);
    }
  }
  let color = selected ? "orange" : "lightgrey";
  let image = <img></img>;
  if (owner && piece !== null) {
    let imageStyle = {};
    if (piece.owner === "A") {
      imageStyle = { transform: "scaleY(-1)", WebkitTransform: "scaleY(-1)" };
    }
    let image_path = "";
    image_path = piece.alignment === "good" ? good_src : evil_src;
    if (masked || (!gameOver && piece.owner !== turn)) {
      image_path = piece.owner === "A" ? ghostA_src : ghostB_src;
    }
    image = <img src={image_path} style={imageStyle}></img>;
  }
  return (
    <button
      className="Square"
      onClick={() => dispatch(gameSlice.actions.selectField(position))}
      style={{ backgroundColor: color }}
    >
      {image}
    </button>
  );
}

function InfoBar({ player }: { player: Player }) {
  const turn = useSelector(selectTurn);
  const {
    [player]: { good, evil }
  } = useSelector(selectStats);
  const winner = useSelector(selectWinner);
  const isWinner = winner === player;
  const isCurrentTurn = turn === player;

  return (
    <div>
      {Array(good)
        .fill(undefined)
        .map((_, i) => (
          <img key={i} src={good_src} width="40px"></img>
        ))}
      <img
        src={
          isWinner
            ? crown_src
            : !isCurrentTurn
            ? circle_src
            : playerImages[player]
        }
        width="40px"
      />
      {Array(evil)
        .fill(undefined)
        .map((_, i) => (
          <img key={i} src={evil_src} width="40px"></img>
        ))}
    </div>
  );
}

export default function Board() {
  const selectedData = useSelector(
    (state: State) => ({
      diedLastTurn: state.lastAction.died
    }),
    shallowEqual
  );
  const [toastRequired, setToastRequired] = React.useState(false);
  const [masked, setMasked] = React.useState(true);

  if (toastRequired) {
    if (selectedData.diedLastTurn !== null) {
      let imgSrc = selectedData.diedLastTurn === "evil" ? evil_src : good_src;
      toast(<img src={imgSrc}></img>, {
        position: undefined,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
    setToastRequired(false);
  }

  return (
    <div className="Board" style={{ display: "inline-block" }}>
      <InfoBar player="A" />
      {Array(36)
        .fill(undefined)
        .map((_, i) => (
          <Square key={i} position={boardCoord(i)} masked={masked} />
        ))}
      <InfoBar player="B" />
      <MaskButton masked={masked} onClick={() => setMasked(!masked)} />
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        draggable
        pauseOnHover
      />
    </div>
  );
}

const boardCoord = (index: number) => {
  return { x: index % 6, y: Math.floor(index / 6) };
};

const MaskButton = (props: { masked: boolean; onClick: (e: any) => void }) => {
  const text = props.masked ? "Unmask!" : "Mask!";
  return <button {...props}> {text} </button>;
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
