import {
  configureStore,
  createSlice,
  PayloadAction,
  getDefaultMiddleware,
  Middleware,
  Action
} from "redux-starter-kit";

export type Player = "A" | "B";
export type Alignment = "good" | "evil";
export type Phase = "assignment" | "running" | "won";
export type Direction = "u" | "d" | "l" | "r";
export type Position = { x: number; y: number };

export interface Piece {
  owner: Player;
  alignment: Alignment;
}

type PlayerStats = { [alignment in Alignment]: number };

export interface State {
  board: Array<Piece | null>;
  turn: Player;
  phase: Phase;
  stats: { [player in Player]: PlayerStats };
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
  }
};

export const gameSlice = createSlice({
  initialState,
  reducers: {
    markEvil(_state, _action: PayloadAction<Position>) {},
    move(
      _state,
      _action: PayloadAction<Position & { direction: Direction }>
    ) {},
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
    },
    ghostMoved(
      state,
      {
        payload: { direction, ...position }
      }: PayloadAction<Position & { direction: Direction }>
    ) {
      const ghost = selectGhost(state, position)!;
      state.board[boardPosition(targetPosition(position, direction))] = ghost;
      state.board[boardPosition(position)] = null;
    },
    turnChangedTo(state, action: PayloadAction<Player>) {
      state.turn = action.payload;
    },
    changePhase(state, action: PayloadAction<Phase>) {
      state.phase = action.payload;
    }
  }
});

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
  if (isMoveAction(action)) {
    const { direction, ...position } = action.payload;
    let state = api.getState();
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
    const targetPos = targetPosition(position, direction);
    const target = selectGhost(state, targetPos);
    if (target) {
      if (target.owner === state.turn) {
        throw new Error("do you want to kill your own ghost?");
      }
      api.dispatch(gameSlice.actions.ghostKilled(targetPos));
    }
    api.dispatch(gameSlice.actions.ghostMoved({ direction, ...position }));
    state = api.getState();
    if (state.stats[other(state.turn)].good === 0) {
      api.dispatch(gameSlice.actions.changePhase("won"));
    }

    api.dispatch(gameSlice.actions.turnChangedTo(other(state.turn)));

    if (state.stats[state.turn].evil === 0) {
      api.dispatch(gameSlice.actions.changePhase("won"));
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
    api.dispatch(gameSlice.actions.turnChangedTo(other(state.turn)));
    state = api.getState();
    if (state.stats.A.evil === 4 && state.stats.B.evil === 4) {
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

const boardPosition = ({ x, y }: Position) => x + y * 6;
const targetPosition = ({ x, y }: Position, direction: Direction) => {
  function assert(stillOnBoard: boolean) {
    if (!stillOnBoard) {
      throw new Error("you are leaving known lands!");
    }
  }
  switch (direction) {
    case "r":
      assert(x < 5);
      return { x: x + 1, y };
    case "l":
      assert(x > 0);
      return { x: x - 1, y };
    case "d":
      assert(y < 5);
      return { x, y: y + 1 };
    case "u":
      assert(y > 0);
      return { x, y: y - 1 };
  }
};

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
store.dispatch(gameSlice.actions.markEvil({ x: 1, y: 1 }));
store.dispatch(gameSlice.actions.markEvil({ x: 1, y: 4 }));
store.dispatch(gameSlice.actions.markEvil({ x: 2, y: 1 }));
store.dispatch(gameSlice.actions.markEvil({ x: 2, y: 4 }));
store.dispatch(gameSlice.actions.markEvil({ x: 3, y: 1 }));
store.dispatch(gameSlice.actions.markEvil({ x: 3, y: 4 }));
store.dispatch(gameSlice.actions.markEvil({ x: 4, y: 1 }));
store.dispatch(gameSlice.actions.markEvil({ x: 4, y: 4 }));
print(store.getState());
