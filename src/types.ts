export interface ColorTheme {
    bg: string;
    border: string;
    text: string;
}

export interface FixedNumber {
    x: number;
    y: number;
    value: number;
}

export interface Cell {
    x: number;
    y: number;
    value: number; // 0 if empty/no number
}

export interface Rect {
    id?: number;
    x: number;
    y: number;
    w: number;
    h: number;
    theme?: ColorTheme;
}

export interface LevelConfig {
    level: number;
    label: string;
    width: number;
    height: number;
    numbers: FixedNumber[];
}

export interface Puzzle {
    puzzleCells: Cell[];
    solution: Rect[];
}
