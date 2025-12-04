import React from 'react';
import { Cell, CellStatus, Coordinate, Grid } from '../types';
import { Crosshair, Circle, X } from 'lucide-react';

interface BoardProps {
  grid: Grid;
  isPlayer: boolean;
  onCellClick?: (x: number, y: number) => void;
  onCellHover?: (x: number, y: number) => void;
  onCellLeave?: () => void;
  title: string;
  isActive: boolean;
  previewCoords?: Coordinate[];
  isValidPreview?: boolean;
}

const getCellColor = (status: CellStatus, isPlayer: boolean, isPreview: boolean, isValid: boolean): string => {
  if (isPreview) {
    return isValid ? 'bg-emerald-500/50' : 'bg-rose-500/50';
  }

  switch (status) {
    case 'HIT':
      return 'bg-rose-900/40 border-rose-500/30';
    case 'MISS':
      return 'bg-slate-800/40';
    case 'SHIP':
      return isPlayer ? 'bg-cyan-900/60 border-cyan-500/30' : 'bg-slate-900/50'; // Hide enemy ships
    case 'EMPTY':
    default:
      return 'bg-slate-900/50 hover:bg-slate-800/50';
  }
};

export const Board: React.FC<BoardProps> = ({
  grid,
  isPlayer,
  onCellClick,
  onCellHover,
  onCellLeave,
  title,
  isActive,
  previewCoords = [],
  isValidPreview = true,
}) => {
  return (
    <div className={`flex flex-col items-center gap-4 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`}></div>
        <h3 className="text-lg font-bold tracking-widest uppercase text-cyan-400/90">{title}</h3>
      </div>

      <div 
        className="grid grid-cols-10 gap-1 p-2 bg-slate-900/80 border border-slate-700/50 rounded-md backdrop-blur-sm shadow-2xl relative"
        onMouseLeave={onCellLeave}
      >
        {/* Grid Overlay Effects */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/5 z-0 rounded-md"></div>
        
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const isPreview = previewCoords.some((c) => c.x === x && c.y === y);
            const cellClasses = getCellColor(cell.status, isPlayer, isPreview, isValidPreview);
            
            return (
              <div
                key={`${x}-${y}`}
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 
                  border border-slate-800 
                  flex items-center justify-center 
                  cursor-pointer transition-all duration-150
                  relative
                  ${cellClasses}
                  ${isActive && !isPlayer && cell.status === 'EMPTY' ? 'hover:border-cyan-400/50' : ''}
                `}
                onClick={() => isActive && onCellClick && onCellClick(x, y)}
                onMouseEnter={() => isActive && onCellHover && onCellHover(x, y)}
              >
                {/* Content based on status */}
                {cell.status === 'HIT' && (
                  <X className="w-6 h-6 text-rose-500 animate-[ping_0.5s_ease-out_1]" />
                )}
                {cell.status === 'HIT' && (
                   <X className="w-6 h-6 text-rose-500 absolute" />
                )}
                {cell.status === 'MISS' && (
                  <Circle className="w-3 h-3 text-slate-500 fill-slate-500/50" />
                )}
                {cell.status === 'SHIP' && isPlayer && (
                   <div className="w-3/4 h-3/4 bg-cyan-700/40 rounded-sm border border-cyan-500/20"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};