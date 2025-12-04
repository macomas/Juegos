import { BOARD_SIZE, Cell, CellStatus, Coordinate, Grid, Ship } from '../types';

export const createEmptyGrid = (): Grid => {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({
      x,
      y,
      status: 'EMPTY' as CellStatus,
      shipId: null,
    }))
  );
};

export const isValidPlacement = (
  grid: Grid,
  shipSize: number,
  x: number,
  y: number,
  orientation: 'horizontal' | 'vertical'
): boolean => {
  if (orientation === 'horizontal') {
    if (x + shipSize > BOARD_SIZE) return false;
    for (let i = 0; i < shipSize; i++) {
      if (grid[y][x + i].status !== 'EMPTY' || grid[y][x + i].shipId !== null) return false;
    }
  } else {
    if (y + shipSize > BOARD_SIZE) return false;
    for (let i = 0; i < shipSize; i++) {
      if (grid[y + i][x].status !== 'EMPTY' || grid[y + i][x].shipId !== null) return false;
    }
  }
  return true;
};

export const placeShipOnGrid = (
  grid: Grid,
  ship: Ship,
  x: number,
  y: number,
  orientation: 'horizontal' | 'vertical'
): { newGrid: Grid; placedShip: Ship } => {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  const coordinates: Coordinate[] = [];

  for (let i = 0; i < ship.size; i++) {
    const cx = orientation === 'horizontal' ? x + i : x;
    const cy = orientation === 'horizontal' ? y : y + i;
    newGrid[cy][cx].status = 'SHIP';
    newGrid[cy][cx].shipId = ship.id;
    coordinates.push({ x: cx, y: cy });
  }

  return {
    newGrid,
    placedShip: { ...ship, placed: true, orientation, coordinates },
  };
};

export const getRandomCoordinates = (): Coordinate => {
  return {
    x: Math.floor(Math.random() * BOARD_SIZE),
    y: Math.floor(Math.random() * BOARD_SIZE),
  };
};

export const placeShipsRandomly = (ships: Ship[]): { grid: Grid; ships: Ship[] } => {
  let grid = createEmptyGrid();
  const placedShips: Ship[] = [];

  ships.forEach((shipTemplate) => {
    let placed = false;
    while (!placed) {
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const { x, y } = getRandomCoordinates();

      if (isValidPlacement(grid, shipTemplate.size, x, y, orientation)) {
        const result = placeShipOnGrid(grid, shipTemplate, x, y, orientation);
        grid = result.newGrid;
        placedShips.push(result.placedShip);
        placed = true;
      }
    }
  });

  return { grid, ships: placedShips };
};

export const checkWinCondition = (ships: Ship[]): boolean => {
  return ships.every((ship) => ship.hits >= ship.size);
};

export const getAiMove = (grid: Grid): Coordinate => {
    // Simple AI: Random valid move
    // Improvement: Could implement a "Hunt" stack for adjacent hits
    let valid = false;
    let x = 0;
    let y = 0;
    
    // Safety break to prevent infinite loops in weird edge cases
    let attempts = 0;
    while (!valid && attempts < 200) {
        const coords = getRandomCoordinates();
        if (grid[coords.y][coords.x].status !== 'HIT' && grid[coords.y][coords.x].status !== 'MISS') {
            x = coords.x;
            y = coords.y;
            valid = true;
        }
        attempts++;
    }
    
    // Fallback if random fails (scan for first empty)
    if (!valid) {
        for(let r=0; r<BOARD_SIZE; r++) {
            for(let c=0; c<BOARD_SIZE; c++) {
                 if (grid[r][c].status !== 'HIT' && grid[r][c].status !== 'MISS') {
                    return { x: c, y: r };
                 }
            }
        }
    }

    return { x, y };
};