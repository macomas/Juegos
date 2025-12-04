import React from 'react';
import { Ship } from '../types';
import { RotateCw, Play, RefreshCw, Anchor } from 'lucide-react';

interface ControlsProps {
  phase: 'PLACEMENT' | 'PLAYING' | 'GAME_OVER';
  shipsToPlace: Ship[];
  selectedShipId: string | null;
  onSelectShip: (id: string) => void;
  orientation: 'horizontal' | 'vertical';
  onToggleOrientation: () => void;
  onReset: () => void;
  onAutoPlace?: () => void;
  logs: string[];
}

export const Controls: React.FC<ControlsProps> = ({
  phase,
  shipsToPlace,
  selectedShipId,
  onSelectShip,
  orientation,
  onToggleOrientation,
  onReset,
  onAutoPlace,
  logs,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full lg:w-80 h-full">
      {/* Game Status / Logs */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 shadow-lg min-h-[160px] flex flex-col">
        <h4 className="text-cyan-400 text-sm font-bold uppercase mb-3 flex items-center gap-2">
          <Anchor size={16} /> Bitácora de Batalla
        </h4>
        <div className="flex-1 overflow-y-auto space-y-2 max-h-40 pr-2 font-mono text-xs">
          {logs.length === 0 ? (
            <span className="text-slate-500 italic">Esperando órdenes...</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-slate-300 border-l-2 border-slate-600 pl-2 py-1">
                <span className="text-cyan-600 mr-2">{`[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]`}</span>
                {log}
              </div>
            ))
          )}
          <div id="log-end" />
        </div>
      </div>

      {/* Placement Controls */}
      {phase === 'PLACEMENT' && (
        <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 shadow-lg animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-slate-200 font-bold uppercase text-sm">Astillero</h4>
            <div className="flex gap-2">
                 <button
                onClick={onAutoPlace}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-cyan-400 transition-colors"
                title="Colocar aleatoriamente"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={onToggleOrientation}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-cyan-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
              >
                <RotateCw size={18} />
                {orientation === 'horizontal' ? 'Horiz' : 'Vert'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {shipsToPlace.filter(s => !s.placed).map((ship) => (
              <button
                key={ship.id}
                onClick={() => onSelectShip(ship.id)}
                className={`
                  w-full p-3 rounded border text-left flex justify-between items-center group transition-all
                  ${selectedShipId === ship.id 
                    ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-400'}
                `}
              >
                <span className="font-bold text-sm">{ship.name}</span>
                <div className="flex gap-1">
                  {Array.from({ length: ship.size }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-2 h-4 rounded-sm ${selectedShipId === ship.id ? 'bg-cyan-400' : 'bg-slate-600 group-hover:bg-slate-500'}`} 
                    />
                  ))}
                </div>
              </button>
            ))}
            {shipsToPlace.every(s => s.placed) && (
              <div className="text-center p-4 text-emerald-400 font-bold animate-pulse">
                ¡Flota lista para el despliegue!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over / Reset Controls */}
      <div className="mt-auto">
        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-900/50 text-rose-400 rounded transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
        >
          <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          Reiniciar Misión
        </button>
      </div>
    </div>
  );
};