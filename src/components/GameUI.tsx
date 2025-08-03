/**
 * Minimal in-game UI overlay.
 * Provides controls for pausing, resuming and returning to menu.
 */
import React from 'react';
import { GameState } from '../game/types/GameState';

interface GameUIProps {
  gameState: GameState;
  onPause: () => void;
  onResume: () => void;
  onMenu: () => void;
}

// memoized to avoid rerenders when props are unchanged
export const GameUI: React.FC<GameUIProps> = React.memo(
  ({ gameState, onPause, onResume, onMenu }) => {
    return (
      <div className="game-ui">
        <div className="hud">
          <span>Vehicles: {gameState.vehicles.size}</span>
        </div>
        <div className="controls">
          <button onClick={onPause}>Pause</button>
          <button onClick={onResume}>Resume</button>
          <button onClick={onMenu}>Menu</button>
        </div>
      </div>
    );
  }
);

export default GameUI;
