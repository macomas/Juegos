import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { 
  GameState, 
  Grid, 
  Ship, 
  INITIAL_SHIPS, 
  Coordinate 
} from './types';
import { 
  createEmptyGrid, 
  placeShipOnGrid, 
  isValidPlacement, 
  placeShipsRandomly, 
  getAiMove,
  checkWinCondition
} from './utils/gameLogic';
import { Radar, Trophy, AlertTriangle } from 'lucide-react';

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    phase: 'PLACEMENT',
    turn: 'PLAYER',
    winner: null,
    logs: ['Bienvenido, Comandante. Coloque su flota para iniciar la batalla.'],
  });

  // Grids
  const [playerGrid, setPlayerGrid] = useState<Grid>(createEmptyGrid());
  const [aiGrid, setAiGrid] = useState<Grid>(createEmptyGrid());

  // Ships
  const [playerShips, setPlayerShips] = useState<Ship[]>(
    INITIAL_SHIPS.map(s => ({ ...s, hits: 0, placed: false, orientation: 'horizontal' as const, coordinates: [] }))
  );
  const [aiShips, setAiShips] = useState<Ship[]>([]);

  // Placement State
  const [selectedShipId, setSelectedShipId] = useState<string | null>('carrier');
  const [placementOrientation, setPlacementOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [hoverCoords, setHoverCoords] = useState<Coordinate | null>(null);

  // Refs for auto-scroll logs
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setGameState(prev => ({ ...prev, logs: [msg, ...prev.logs] }));
  };

  // --- Game Loop: AI Turn ---
  useEffect(() => {
    if (gameState.phase === 'PLAYING' && gameState.turn === 'AI') {
      const timer = setTimeout(() => {
        handleAiTurn();
      }, 1000 + Math.random() * 1000); // Realistic delay
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.turn]);

  const handleAiTurn = () => {
    const move = getAiMove(playerGrid);
    const targetCell = playerGrid[move.y][move.x];
    let hitShipName = '';
    let isSunk = false;

    const newGrid = playerGrid.map(row => row.map(cell => ({ ...cell })));
    const newCell = newGrid[move.y][move.x];
    let status: 'HIT' | 'MISS' = 'MISS';

    if (targetCell.status === 'SHIP' && targetCell.shipId) {
      status = 'HIT';
      const shipIndex = playerShips.findIndex(s => s.id === targetCell.shipId);
      if (shipIndex !== -1) {
        const newShips = [...playerShips];
        newShips[shipIndex].hits += 1;
        hitShipName = newShips[shipIndex].name;
        
        if (newShips[shipIndex].hits >= newShips[shipIndex].size) {
            isSunk = true;
            addLog(`¡ALERTA! El enemigo ha hundido nuestro ${hitShipName}.`);
        } else {
            addLog(`¡Impacto recibido en ${hitShipName}!`);
        }
        setPlayerShips(newShips);
      }
    } else {
        addLog(`El enemigo disparó al agua en ${String.fromCharCode(65 + move.x)}${move.y + 1}.`);
    }

    newCell.status = status;
    setPlayerGrid(newGrid);

    // Check Win
    if (checkWinCondition(playerShips)) {
      setGameState(prev => ({ ...prev, phase: 'GAME_OVER', winner: 'AI', logs: ['¡Flota destruida! Hemos perdido la batalla.', ...prev.logs] }));
    } else {
      setGameState(prev => ({ ...prev, turn: 'PLAYER' }));
    }
  };

  // --- Player Actions ---

  const handleCellClick = (x: number, y: number) => {
    if (gameState.phase === 'PLACEMENT') {
      handlePlacement(x, y);
    } else if (gameState.phase === 'PLAYING' && gameState.turn === 'PLAYER') {
      handleAttack(x, y);
    }
  };

  const handlePlacement = (x: number, y: number) => {
    if (!selectedShipId) return;
    const shipToPlace = playerShips.find(s => s.id === selectedShipId);
    if (!shipToPlace) return;

    if (isValidPlacement(playerGrid, shipToPlace.size, x, y, placementOrientation)) {
      const { newGrid, placedShip } = placeShipOnGrid(playerGrid, shipToPlace, x, y, placementOrientation);
      setPlayerGrid(newGrid);
      
      const updatedShips = playerShips.map(s => s.id === selectedShipId ? placedShip : s);
      setPlayerShips(updatedShips);

      // Select next unplaced ship
      const nextShip = updatedShips.find(s => !s.placed);
      if (nextShip) {
        setSelectedShipId(nextShip.id);
      } else {
        setSelectedShipId(null);
        startGame(updatedShips);
      }
    } else {
        // Feedback for invalid placement?
    }
  };

  const handleAttack = (x: number, y: number) => {
    if (aiGrid[y][x].status === 'HIT' || aiGrid[y][x].status === 'MISS') return;

    const newGrid = aiGrid.map(row => row.map(cell => ({ ...cell })));
    const targetCell = newGrid[y][x];
    let hit = false;
    
    if (targetCell.status === 'SHIP' && targetCell.shipId) {
        targetCell.status = 'HIT';
        hit = true;
        
        // Update AI ships state
        const shipIndex = aiShips.findIndex(s => s.id === targetCell.shipId);
        if (shipIndex !== -1) {
            const newShips = [...aiShips];
            newShips[shipIndex].hits += 1;
            
            if (newShips[shipIndex].hits >= newShips[shipIndex].size) {
                 addLog(`¡Confirmado! Has hundido el ${newShips[shipIndex].name} enemigo.`);
            } else {
                 addLog(`¡Impacto confirmado en coordenadas ${String.fromCharCode(65 + x)}${y + 1}!`);
            }
            setAiShips(newShips);
        }
    } else {
        targetCell.status = 'MISS';
        addLog(`Disparo fallido en ${String.fromCharCode(65 + x)}${y + 1}.`);
    }

    setAiGrid(newGrid);

    if (checkWinCondition(aiShips)) {
        setGameState(prev => ({ ...prev, phase: 'GAME_OVER', winner: 'PLAYER', logs: ['¡VICTORIA! Toda la flota enemiga ha sido neutralizada.', ...prev.logs] }));
    } else {
        setGameState(prev => ({ ...prev, turn: 'AI' }));
    }
  };

  const startGame = (currentShips: Ship[]) => {
    // Generate AI Board
    const { grid: enemyGrid, ships: enemyShips } = placeShipsRandomly(
        INITIAL_SHIPS.map(s => ({ ...s, hits: 0, placed: false, orientation: 'horizontal', coordinates: [] }))
    );
    setAiGrid(enemyGrid);
    setAiShips(enemyShips);
    
    setGameState(prev => ({
        ...prev,
        phase: 'PLAYING',
        logs: ['COMBATE INICIADO. ¡A sus puestos de batalla!', ...prev.logs]
    }));
  };

  const autoPlacePlayerShips = () => {
    const { grid, ships } = placeShipsRandomly(
        INITIAL_SHIPS.map(s => ({ ...s, hits: 0, placed: false, orientation: 'horizontal', coordinates: [] }))
    );
    setPlayerGrid(grid);
    setPlayerShips(ships);
    setSelectedShipId(null);
    startGame(ships);
  };

  const resetGame = () => {
    setPlayerGrid(createEmptyGrid());
    setAiGrid(createEmptyGrid());
    setPlayerShips(INITIAL_SHIPS.map(s => ({ ...s, hits: 0, placed: false, orientation: 'horizontal', coordinates: [] })));
    setAiShips([]);
    setGameState({
        phase: 'PLACEMENT',
        turn: 'PLAYER',
        winner: null,
        logs: ['Sistema reiniciado. Esperando órdenes.'],
    });
    setSelectedShipId('carrier');
  };

  // --- Helper for Placement Preview ---
  const getPlacementPreview = () => {
    if (gameState.phase !== 'PLACEMENT' || !selectedShipId || !hoverCoords) return { coords: [], isValid: false };
    
    const ship = playerShips.find(s => s.id === selectedShipId);
    if (!ship) return { coords: [], isValid: false };

    const coords: Coordinate[] = [];
    const isValid = isValidPlacement(playerGrid, ship.size, hoverCoords.x, hoverCoords.y, placementOrientation);

    for(let i=0; i<ship.size; i++) {
        const x = placementOrientation === 'horizontal' ? hoverCoords.x + i : hoverCoords.x;
        const y = placementOrientation === 'horizontal' ? hoverCoords.y : hoverCoords.y + i;
        if (x < 10 && y < 10) {
            coords.push({ x, y });
        }
    }
    return { coords, isValid };
  };

  const { coords: previewCoords, isValid: isPreviewValid } = getPlacementPreview();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 flex flex-col items-center selection:bg-cyan-500/30">
        
      {/* Header */}
      <header className="w-full max-w-6xl mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 rounded border border-cyan-800">
                <Radar className="w-8 h-8 text-cyan-400 animate-[spin_4s_linear_infinite]" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    BATTLESHIP COMMAND
                </h1>
                <p className="text-xs text-slate-500 font-mono tracking-widest">SYSTEM ONLINE // SECURE CONNECTION</p>
            </div>
        </div>
        
        {gameState.phase === 'GAME_OVER' && (
            <div className={`px-6 py-2 rounded-lg border flex items-center gap-3 animate-bounce ${gameState.winner === 'PLAYER' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' : 'bg-rose-900/50 border-rose-500 text-rose-400'}`}>
                {gameState.winner === 'PLAYER' ? <Trophy size={24} /> : <AlertTriangle size={24} />}
                <span className="font-bold text-xl">{gameState.winner === 'PLAYER' ? 'VICTORIA' : 'DERROTA'}</span>
            </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 lg:gap-16 justify-center items-start">
        
        {/* Left: Player Board */}
        <div className="flex flex-col gap-4">
             <Board 
                grid={playerGrid} 
                isPlayer={true} 
                isActive={gameState.phase === 'PLACEMENT' || (gameState.phase === 'PLAYING' && gameState.turn === 'AI')}
                title="Flota Aliada"
                onCellClick={handleCellClick}
                onCellHover={(x, y) => setHoverCoords({ x, y })}
                onCellLeave={() => setHoverCoords(null)}
                previewCoords={previewCoords}
                isValidPreview={isPreviewValid}
             />
             <div className="text-center text-xs text-slate-500 font-mono">
                COORDENADAS DE RED: [SECURE]
             </div>
        </div>

        {/* Middle: Controls */}
        <div className="order-first lg:order-none w-full lg:w-auto">
            <Controls 
                phase={gameState.phase}
                shipsToPlace={playerShips}
                selectedShipId={selectedShipId}
                onSelectShip={setSelectedShipId}
                orientation={placementOrientation}
                onToggleOrientation={() => setPlacementOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                onReset={resetGame}
                onAutoPlace={autoPlacePlayerShips}
                logs={gameState.logs}
            />
        </div>

        {/* Right: Enemy Board */}
        <div className={`flex flex-col gap-4 transition-all duration-500 ${gameState.phase === 'PLACEMENT' ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
             <Board 
                grid={aiGrid} 
                isPlayer={false} 
                isActive={gameState.phase === 'PLAYING' && gameState.turn === 'PLAYER'}
                title="Radar Enemigo"
                onCellClick={handleCellClick}
             />
              <div className="text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                ESTADO DEL OBJETIVO: {gameState.phase === 'PLACEMENT' ? 'OFFLINE' : 'DETECTADO'}
             </div>
        </div>

      </main>

      {/* Footer / Overlay Instructions */}
      <footer className="mt-12 text-slate-600 text-sm font-mono">
        {gameState.phase === 'PLACEMENT' && "INSTRUCCIONES: Seleccione un barco y haga clic en la cuadrícula aliada para posicionarlo."}
        {gameState.phase === 'PLAYING' && gameState.turn === 'PLAYER' && "TURNO: Seleccione una coordenada en el Radar Enemigo para atacar."}
        {gameState.phase === 'PLAYING' && gameState.turn === 'AI' && "TURNO ENEMIGO: Calculando trayectoria de impacto..."}
      </footer>

    </div>
  );
}