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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { isFulfilled } from "q";
import ghostA_src from '../pictures/ghost_yellow.svg';
import ghostB_src from '../pictures/ghost_purple.svg';
import evil_src from '../pictures/devil.svg';
import good_src from '../pictures/angel.svg';
import crown_src from '../pictures/crown.svg';
import circle_src from '../pictures/circle.svg';
import circleA_src from '../pictures/circle_yellow.svg';
import circleB_src from '../pictures/circle_purple.svg';

const mask = (player: Player) => (player === "A" ? "X" : "O");

function Square(props: {
  piece: Piece | null;
  onClick: (e: any) => void;
  selected: boolean;
  turn: Player;
  masked: boolean;
  gameOver: boolean;
}) {
  let owner = "";
  if (props.piece !== null) {
    owner = props.piece.owner;
    let ali = props.piece.alignment;
    if (ali === "good") {
      owner = owner.toLowerCase();
    }
    if (props.masked || (!props.gameOver && props.piece.owner !== props.turn)) {
      owner = mask(props.piece.owner);
    }
  }
  let color = props.selected ? "orange" : "lightgrey";
  let image = <img></img>;
  if(owner && props.piece !== null){
    let imageStyle = {};
    if(props.piece.owner === "A"){
      imageStyle = {transform: "scaleY(-1)", WebkitTransform: "scaleY(-1)"};
    }
    let image_path = "";
    image_path = props.piece.alignment === "good" ? good_src : evil_src;
    if (props.masked || (!props.gameOver && props.piece.owner !== props.turn)) {
      image_path = (props.piece.owner === 'A' ? ghostA_src: ghostB_src);
    }
    image = <img src={image_path} style={imageStyle}></img>
  }
  return (
    <button className="Square" {...props} style={{ backgroundColor: color }}>
      {image}
    </button>
  );
}

function InfoBar(props: {
  phase: Phase;
  turn: Player;
  winner: Player | "";
  stats: { [player in Player]: PlayerStats };
  player: Player;
}) {
  let good = [];
  for(let i=0; i<props.stats[props.player].good; i++){
    good.push(<img src={good_src} width="40px"></img>);
  }
  let evil = [];
  for(let i=0; i<props.stats[props.player].evil; i++){
    evil.push(<img src={evil_src} width="40px"></img>);
  }
  let status_src = (props.turn !== props.player ? circle_src : (props.player === "A" ? circleA_src : circleB_src));
  if(props.winner === props.player){
    status_src = crown_src;
  }
  let status = <img src={status_src} width="40px"></img>;
  return (
    <div>
      {good}
      {status}
      {evil}
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
      stats: state.stats,
      diedLastTurn: state.lastAction.died
    }),
    shallowEqual
  );
  const dispatch = useDispatch();
  const [selectedField, setSelectedField] = React.useState(-1);
  const [toastRequired, setToastRequired] = React.useState(false);
  const [masked, setMasked] = React.useState(true);
  const isOwnGhost = (piece: Piece | null, turn: Player) =>
    piece !== null && piece.owner === turn;
  const clickOnField = (index: number): (e: MouseEvent) => void => {
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
          if (selectedData.stats[selectedData.turn].evil >= 3){
            setMasked(true);
          }
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
          setMasked(true);
          setToastRequired(true);
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
        masked={masked}
        gameOver={selectedData.phase === "won"}
      />
    );
  }
  if(toastRequired){
    if(selectedData.diedLastTurn !== null){
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

  let winner: Player | "" = selectedData.phase === "won" ? selectedData.turn : "";
  return (
    <div className="Board" style={{display: "inline-block"}}>
      <InfoBar
        phase={selectedData.phase}
        winner={winner}
        turn={selectedData.turn}
        stats={selectedData.stats}
        player="A"
      />
      {squares}
      <InfoBar
        phase={selectedData.phase}
        winner={winner}
        turn={selectedData.turn}
        stats={selectedData.stats}
        player="B"
      />
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

const MaskButton = (props: {masked: boolean, onClick: (e: any) => void}) => {
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
