import * as React from "react";
import { shallowEqual, useSelector, useDispatch } from "react-redux";
import {
  State,
  Player,
  gameSlice,
  selectWinner,
  selectTurn,
  selectStats,
  Position,
  selectPiece,
  selectIsSelected,
  Piece
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
import styled from "@emotion/styled";

const playerImages = {
  A: circleA_src,
  B: circleB_src
};

const mask = (player: Player) => (player === "A" ? "X" : "O");

type SquareButtonProps = {
  selected: boolean;
  piece: Piece | null;
  currentPlayer: Player;
  masked: boolean;
};
const SquareButton = styled("button")<SquareButtonProps>(
  ({ selected, piece, masked, currentPlayer }) => ({
    color: selected ? "orange" : "lightgrey",
    transform: `scaleY(${piece && piece.owner === "A" ? "-1" : "1"})`,
    border: "solid 1px black",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    transition: "background-image 0.3s ease-in-out",
    backgroundImage: !piece
      ? "none"
      : `url('${
          masked || currentPlayer !== piece.owner
            ? piece.owner === "A"
              ? ghostA_src
              : ghostB_src
            : piece.alignment === "good"
            ? good_src
            : evil_src
        }')`
  })
);

function Square({ position, masked }: { position: Position; masked: boolean }) {
  const turn = useSelector(selectTurn);
  const piece = useSelector(selectPiece(position));
  const selected = useSelector(selectIsSelected(position));
  const dispatch = useDispatch();

  return (
    <SquareButton
      onClick={() => dispatch(gameSlice.actions.selectField(position))}
      piece={piece}
      selected={!!selected}
      masked={masked}
      currentPlayer={turn}
    />
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(6, 1fr);
  grid-gap: 10px;
  width: 600px;
  height: 600px;
`;

export default function Board() {
  const diedLastTurn = useSelector(
    (state: State) => state.lastAction.died,
    shallowEqual
  );
  const [masked, setMasked] = React.useState(true);

  React.useEffect(() => {
    if (diedLastTurn !== null) {
      toast(
        <img src={diedLastTurn.alignment === "evil" ? evil_src : good_src} />,
        {
          position: undefined,
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    }
  }, [diedLastTurn]);

  return (
    <div style={{ display: "inline-block" }}>
      <InfoBar player="A" />
      <Grid>
        {Array(36)
          .fill(undefined)
          .map((_, i) => (
            <Square key={i} position={boardCoord(i)} masked={masked} />
          ))}
      </Grid>
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
