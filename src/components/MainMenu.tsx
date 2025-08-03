/**
 * Simple main menu with start, settings and credits hooks.
 */
import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
  onSettings: () => void;
  onCredits: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onSettings, onCredits }) => (
  <div className="main-menu">
    <h1>Grand Theft Lux</h1>
    <button onClick={onStartGame}>Start</button>
    <button onClick={onSettings}>Settings</button>
    <button onClick={onCredits}>Credits</button>
  </div>
);

export default MainMenu;
