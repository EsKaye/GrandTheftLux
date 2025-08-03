/**
 * Basic loading screen with progress indicator and retry option.
 */
import React from 'react';

interface LoadingScreenProps {
  progress: number;
  error: string | null;
  onRetry: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, error, onRetry }) => {
  return (
    <div className="loading-screen">
      <div className="progress">{progress}%</div>
      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={onRetry}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
