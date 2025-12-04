export type CellStatus = 'EMPTY' | 'SHIP' | 'HIT' | 'MISS';

export interface Coordinate {
  x: number;
  y: number;
}

export interface Ship {
  id: string;
  name: string;
  size: number;
  hits: number;
  placed: boolean;
  orientation: 'horizontal' | 'vertical';
  coordinates: Coordinate[];
}

export interface Cell {
  x: number;
  y: number;
  status: CellStatus;
  shipId: string | null;
}

export type Grid = Cell[][];

export type GamePhase = 'PLACEMENT' | 'PLAYING' | 'GAME_OVER';
export type Turn = 'PLAYER' | 'AI';

export interface GameState {
  phase: GamePhase;
  turn: Turn;
  winner: 'PLAYER' | 'AI' | null;
  logs: string[];
}

export const BOARD_SIZE = 10;

export const INITIAL_SHIPS: Omit<Ship, 'orientation' | 'coordinates' | 'placed' | 'hits'>[] = [
  { id: 'carrier', name: 'Portaaviones', size: 5 },
  { id: 'battleship', name: 'Acorazado', size: 4 },
  { id: 'cruiser', name: 'Crucero', size: 3 },
  { id: 'submarine', name: 'Submarino', size: 3 },
  { id: 'destroyer', name: 'Destructor', size: 2 },
];