import {
  configureStore,
  createSlice,
  PayloadAction,
  getDefaultMiddleware,
  Middleware,
  Action
} from "redux-starter-kit";

import { createSelector, createSelectorCreator } from "reselect";

export type Player = "A" | "B";
export type Alignment = "good" | "evil";
export type Phase = "assignment" | "running" | "won";
export type Direction = "u" | "d" | "l" | "r";
export type Position = { x: number; y: number };

export interface Piece {
  owner: Player;
  alignment: Alignment;
}

export type PlayerStats = { [alignment in Alignment]: number };

export interface State {
  board: Array<Piece | null>;
  turn: Player;
  phase: Phase;
  stats: { [player in Player]: PlayerStats };
  lastAction: { died: Alignment | null };
  selectedField: null | Position;
}

const initialState: State = {
  board: Array(36)
    .fill(null)
    .map((val, pos) => {
      const y = Math.floor(pos / 6),
        x = pos % 6;
      return x > 0 && x < 5
        ? y < 2
          ? ({ owner: "A", alignment: "good" } as Piece)
          : y > 3
          ? ({ owner: "B", alignment: "good" } as Piece)
          : null
        : null;
    }),
  turn: "A",
  phase: "assignment",
  stats: {
    A: { good: 8, evil: 0 },
    B: { good: 8, evil: 0 }
  },
  lastAction: { died: null },
  selectedField: null
};

export const gameSlice = createSlice({
  initialState,
  reducers: {
    selectField(_state, _action: PayloadAction<Position>) {},
    markEvil(_state, _action: PayloadAction<Position>) {},
    move(_state, _action: PayloadAction<Position>) {},
    currentFieldSelected(state, { payload }: PayloadAction<Position | null>) {
      state.selectedField = payload;
    },
    newMoveStarted(state) {
      state.lastAction.died = null;
    },
    ghostMarkedEvil(state, action: PayloadAction<Position>) {
      const ghost = selectGhost(state, action.payload)!;
      ghost.alignment = "evil";
      state.stats[state.turn].evil++;
      state.stats[state.turn].good--;
    },
    ghostKilled(state, action: PayloadAction<Position>) {
      const ghost = selectGhost(state, action.payload)!;
      state.stats[ghost.owner][ghost.alignment]--;
      state.board[boardPosition(action.payload)] = null;
      state.lastAction.died = ghost.alignment;
    },
    ghostMoved(
      state,
      { payload: { from, to } }: PayloadAction<{ from: Position; to: Position }>
    ) {
      state.board[boardPosition(to)] = selectGhost(state, from);
      state.board[boardPosition(from)] = null;
    },
    turnChangedTo(state, action: PayloadAction<Player>) {
      state.turn = action.payload;
    },
    changePhase(state, action: PayloadAction<Phase>) {
      state.phase = action.payload;
    }
  }
});

function isSelectFieldAction(
  action: Action
): action is ReturnType<typeof gameSlice["actions"]["selectField"]> {
  return action.type === gameSlice.actions.selectField.type;
}

function isMoveAction(
  action: Action
): action is ReturnType<typeof gameSlice["actions"]["move"]> {
  return action.type === gameSlice.actions.move.type;
}

function isMarkEvilAction(
  action: Action
): action is ReturnType<typeof gameSlice["actions"]["markEvil"]> {
  return action.type === gameSlice.actions.markEvil.type;
}

const gameLogic: Middleware<any, State> = api => next => action => {
  if (isSelectFieldAction(action)) {
    let state = api.getState();
    const position = action.payload;
    if (state.phase === "assignment") {
      api.dispatch(gameSlice.actions.markEvil(position));
    } else if (state.phase === "running") {
      if (state.selectedField) {
        const targetGhost = selectGhost(state, position);
        if (targetGhost && targetGhost.owner === state.turn) {
          api.dispatch(gameSlice.actions.currentFieldSelected(position));
        } else if (positionEquals(state.selectedField, position)) {
          api.dispatch(gameSlice.actions.currentFieldSelected(null));
        } else {
          api.dispatch(gameSlice.actions.move(position));
        }
      } else {
        const selectedPiece = state.board[boardPosition(position)];
        if (selectedPiece && selectedPiece.owner === state.turn) {
          api.dispatch(gameSlice.actions.currentFieldSelected(position));
        }
      }
    }
  } else if (isMoveAction(action)) {
    const targetPos = action.payload;
    let state = api.getState();
    const position = state.selectedField;
    if (!position) {
      throw new Error("there was no selection!");
    }
    if (state.phase !== "running") {
      throw new Error("not in running phase!");
    }
    const ghost = selectGhost(state, position);
    if (!ghost) {
      throw new Error("there is no ghost!");
    }
    if (ghost.owner !== state.turn) {
      throw new Error("not your ghost!");
    }
    if (!isValidMove(position, targetPos)) {
      throw new Error("that's a weird move!");
    }

    const target = selectGhost(state, targetPos);
    api.dispatch(gameSlice.actions.newMoveStarted());
    if (target) {
      if (target.owner === state.turn) {
        throw new Error("do you want to kill your own ghost?");
      }
      api.dispatch(gameSlice.actions.ghostKilled(targetPos));
    }
    api.dispatch(
      gameSlice.actions.ghostMoved({ from: position, to: targetPos })
    );
    state = api.getState();
    if (state.stats[other(state.turn)].good === 0) {
      api.dispatch(gameSlice.actions.changePhase("won"));
      return;
    }
    state = api.getState();

    api.dispatch(gameSlice.actions.currentFieldSelected(null));
    api.dispatch(gameSlice.actions.turnChangedTo(other(state.turn)));

    state = api.getState();
    if (state.stats[state.turn].evil === 0) {
      api.dispatch(gameSlice.actions.changePhase("won"));
      return;
    }
    const enemyHomeRow = state.turn === "A" ? 5 : 0;
    if (
      state.stats[state.turn].evil === 0 ||
      [
        selectGhost(state, { x: 0, y: enemyHomeRow }),
        selectGhost(state, { x: 5, y: enemyHomeRow })
      ].some(
        ghost =>
          !!ghost && ghost.owner === state.turn && ghost.alignment === "good"
      )
    ) {
      api.dispatch(gameSlice.actions.changePhase("won"));
      return;
    }
  }

  if (isMarkEvilAction(action)) {
    const position = action.payload;
    let state = api.getState();
    if (state.phase !== "assignment") {
      throw new Error("not in assignment phase!");
    }
    const ghost = selectGhost(state, position);
    if (!ghost) {
      throw new Error("there is no ghost!");
    }
    if (ghost.owner !== state.turn) {
      throw new Error("not your ghost!");
    }
    if (ghost.alignment === "evil") {
      throw new Error("it's not possible to make it even more evil!");
    }
    if (state.stats[state.turn].evil >= 4) {
      throw new Error("not so fast!");
    }
    api.dispatch(gameSlice.actions.ghostMarkedEvil(position));
    state = api.getState();
    if (state.stats.A.evil === 4 && state.turn === "A") {
      api.dispatch(gameSlice.actions.turnChangedTo(other(state.turn)));
    }
    state = api.getState();
    if (state.stats.A.evil === 4 && state.stats.B.evil === 4) {
      api.dispatch(gameSlice.actions.turnChangedTo(other(state.turn)));
      api.dispatch(gameSlice.actions.changePhase("running"));
    }
  }

  return next(action);
};

function other(player: Player) {
  return player === "A" ? "B" : "A";
}

export const store = configureStore({
  reducer: gameSlice.reducer,
  middleware: [...getDefaultMiddleware(), gameLogic]
});

export const boardPosition = ({ x, y }: Position) => x + y * 6;

function isValidMove(from: Position, to: Position) {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y) === 1;
}

const selectGhost = (state: State, position: Position) =>
  state.board[boardPosition(position)];

function print(state: State) {
  let board = "";
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      const item = selectGhost(state, { x, y });
      board += !item
        ? "."
        : item.alignment === "evil"
        ? item.owner
        : item.owner.toLowerCase();
    }
    board += "\n";
  }
  console.log(board);
}

print(store.getState());
//store.dispatch(gameSlice.actions.markEvil({ x: 1, y: 1 }));
//store.dispatch(gameSlice.actions.markEvil({ x: 1, y: 4 }));
//store.dispatch(gameSlice.actions.markEvil({ x: 2, y: 1 }));
//store.dispatch(gameSlice.actions.markEvil({ x: 2, y: 4 }));
//store.dispatch(gameSlice.actions.markEvil({ x: 3, y: 1 }));
//store.dispatch(gameSlice.actions.markEvil({ x: 3, y: 4 }));
//store.dispatch(gameSlice.actions.markEvil({ x: 4, y: 1 }));
//store.dispatch(gameSlice.actions.markEvil({ x: 4, y: 4 }));
//print(store.getState());

export function positionEquals(a: Position | null, b: Position | null) {
  return a && b && a.x === b.x && a.y === b.y;
}

export const selectPhase = (state: State) => state.phase;
export const selectTurn = (state: State) => state.turn;
export const selectStats = (state: State) => state.stats;
export const selectBoard = (state: State) => state.board;
export const selectSelectedField = (state: State) => state.selectedField;
export const selectWinner = createSelector(
  selectPhase,
  selectTurn,
  (phase, turn) => (phase === "won" ? turn : "")
);

export const selectPiece = (position: Position) => (state: State) =>
  selectBoard(state)[boardPosition(position)];

export const selectIsSelected = (position: Position) => (state: State) =>
  positionEquals(selectSelectedField(state), position);
