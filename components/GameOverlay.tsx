import React from 'react';
import { GameState } from '../types';

interface GameOverlayProps {
  gameState: GameState;
  onStart: () => void;
  onRestart: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ gameState, onStart, onRestart }) => {
  if (gameState.isPlaying && !gameState.gameOver) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-blue-500">
        {!gameState.isPlaying && !gameState.gameOver ? (
          <>
            <h1 className="text-4xl font-black text-blue-600 mb-2">CLASH DE REACT</h1>
            <p className="text-gray-600 mb-6">Destrua a torre inimiga! Gerencie seu elixir e escolha a melhor tropa.</p>
            <div className="space-y-2 mb-6 text-sm text-left bg-gray-100 p-4 rounded-lg">
              <p>⚔️ <strong>Cavaleiro:</strong> Bom status geral.</p>
              <p>🏹 <strong>Arqueira:</strong> Ataca de longe.</p>
              <p>🦍 <strong>Gigante:</strong> Só ataca torres, muita vida.</p>
              <p>💀 <strong>Esqueletos:</strong> Distração barata.</p>
            </div>
            <button 
              onClick={onStart}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xl shadow-[0_4px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all"
            >
              BATALHAR!
            </button>
          </>
        ) : (
          <>
            <h2 className={`text-4xl font-black mb-4 ${gameState.winner === 'player' ? 'text-green-500' : 'text-red-500'}`}>
              {gameState.winner === 'player' ? 'VITÓRIA!' : 'DERROTA!'}
            </h2>
            <div className="text-6xl mb-6">
              {gameState.winner === 'player' ? '👑' : '😭'}
            </div>
            <p className="text-gray-600 mb-8">
              {gameState.winner === 'player' 
                ? 'Você destruiu a torre inimiga!' 
                : 'Sua torre foi destruída!'}
            </p>
            <button 
              onClick={onRestart}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg text-lg shadow-[0_4px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none transition-all"
            >
              JOGAR NOVAMENTE
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameOverlay;
