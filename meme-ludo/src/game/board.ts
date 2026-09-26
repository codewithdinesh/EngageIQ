export type ColorId = "red" | "blue" | "yellow" | "green";

export type Cell = { row: number; col: number };

function cells(pairs: readonly (readonly [number, number])[]): Cell[] {
  return pairs.map(([row, col]) => ({ row, col }));
}

/**
 * Shared outer track, clockwise, 52 cells.
 * Index 0 is (6,0). Each color starts 13 steps apart.
 */
export const OUTER: Cell[] = cells([
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
]);

/** Starts plus the star eight steps later. Safe for every color. */
export const SAFE_OUTER = new Set([1, 9, 14, 22, 27, 35, 40, 48]);

export type PlayerDef = {
  color: ColorId;
  label: string;
  /** Fill used for tokens, start, and home column. */
  main: string;
  /** Text/pip color that stays readable on `main`. */
  ink: string;
  yard: string;
  startIndex: number;
  /** Five home-column cells, outside → center. */
  home: Cell[];
  /** Top-left cell of the 6×6 yard. */
  yardOrigin: Cell;
  /** Where finished tokens sit inside the center. */
  finishAnchor: Cell;
};

export const PLAYERS: Record<ColorId, PlayerDef> = {
  red: {
    color: "red",
    label: "Red",
    main: "#E5484D",
    ink: "#FFFFFF",
    yard: "#4C1D28",
    startIndex: 40,
    home: cells([
      [13, 7],
      [12, 7],
      [11, 7],
      [10, 7],
      [9, 7],
    ]),
    yardOrigin: { row: 9, col: 0 },
    finishAnchor: { row: 8, col: 6 },
  },
  blue: {
    color: "blue",
    label: "Blue",
    main: "#3B82F6",
    ink: "#FFFFFF",
    yard: "#172848",
    startIndex: 27,
    home: cells([
      [7, 13],
      [7, 12],
      [7, 11],
      [7, 10],
      [7, 9],
    ]),
    yardOrigin: { row: 9, col: 9 },
    finishAnchor: { row: 8, col: 8 },
  },
  yellow: {
    color: "yellow",
    label: "Yellow",
    main: "#FFC53D",
    ink: "#3A2800",
    yard: "#463610",
    startIndex: 14,
    home: cells([
      [1, 7],
      [2, 7],
      [3, 7],
      [4, 7],
      [5, 7],
    ]),
    yardOrigin: { row: 0, col: 9 },
    finishAnchor: { row: 6, col: 8 },
  },
  green: {
    color: "green",
    label: "Green",
    main: "#30A46C",
    ink: "#FFFFFF",
    yard: "#123524",
    startIndex: 1,
    home: cells([
      [7, 1],
      [7, 2],
      [7, 3],
      [7, 4],
      [7, 5],
    ]),
    yardOrigin: { row: 0, col: 0 },
    finishAnchor: { row: 6, col: 6 },
  },
};

/** Clockwise around the table: bottom-left → bottom-right → top-right → top-left. */
export const FOUR_PLAYER_ORDER: ColorId[] = ["red", "blue", "yellow", "green"];
/** Opposite corners. */
export const TWO_PLAYER_ORDER: ColorId[] = ["red", "yellow"];

/** Track index of a finished token. Positions 0–55 are on the board; 56 leaves it. */
export const FINISH_POS = 56;
/** Last cell of the colored home column. */
export const LAST_HOME_POS = 55;
/** Last cell that is still on the shared outer track. */
export const LAST_OUTER_POS = 50;

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function outerCell(color: ColorId, pos: number): Cell {
  const index = (PLAYERS[color].startIndex + pos) % OUTER.length;
  return OUTER[index];
}

export function outerIndex(color: ColorId, pos: number): number {
  return (PLAYERS[color].startIndex + pos) % OUTER.length;
}

export function isSafeOuter(index: number): boolean {
  return SAFE_OUTER.has(index);
}

export type CellKind =
  | { type: "yard"; color: ColorId }
  | { type: "center" }
  | { type: "home"; color: ColorId }
  | { type: "start"; color: ColorId }
  | { type: "safe" }
  | { type: "path" };

function buildCellMap(): CellKind[][] {
  const grid: CellKind[][] = Array.from({ length: 15 }, () =>
    Array.from({ length: 15 }, () => ({ type: "path" as const })),
  );

  (Object.keys(PLAYERS) as ColorId[]).forEach((color) => {
    const def = PLAYERS[color];
    for (let r = 0; r < 6; r += 1) {
      for (let c = 0; c < 6; c += 1) {
        grid[def.yardOrigin.row + r][def.yardOrigin.col + c] = { type: "yard", color };
      }
    }
    def.home.forEach((cell) => {
      grid[cell.row][cell.col] = { type: "home", color };
    });
    const start = OUTER[def.startIndex];
    grid[start.row][start.col] = { type: "start", color };
  });

  for (let r = 6; r <= 8; r += 1) {
    for (let c = 6; c <= 8; c += 1) {
      grid[r][c] = { type: "center" };
    }
  }

  SAFE_OUTER.forEach((index) => {
    const cell = OUTER[index];
    const current = grid[cell.row][cell.col];
    if (current.type === "path") {
      grid[cell.row][cell.col] = { type: "safe" };
    }
  });

  return grid;
}

export const CELL_MAP = buildCellMap();

export function classifyCell(row: number, col: number): CellKind {
  return CELL_MAP[row][col];
}
