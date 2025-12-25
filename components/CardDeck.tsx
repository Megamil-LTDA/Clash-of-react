import React from 'react';
import { UnitType } from '../types';
import { UNIT_STATS } from '../constants';

interface CardDeckProps {
  elixir: number;
  onSelectCard: (type: UnitType) => void;
  selectedCard: UnitType | null;
}

const CardDeck: React.FC<CardDeckProps> = ({ elixir, onSelectCard, selectedCard }) => {
  const cards = Object.values(UNIT_STATS);

  return (
    <div className="bg-slate-800 p-2 sm:p-4 border-t-4 border-slate-900 shadow-2xl relative z-20">
      {/* Elixir Bar */}
      <div className="mb-3 relative w-full h-6 bg-slate-900 rounded-full border-2 border-slate-700 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all duration-200"
          style={{ width: `${(elixir / 10) * 100}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white shadow-black drop-shadow-md">
          {Math.floor(elixir)} / 10 Elixir
        </div>
      </div>

      {/* Cards */}
      <div className="flex gap-2 justify-between overflow-x-auto pb-1">
        {cards.map((card) => {
          const canAfford = elixir >= card.cost;
          const isSelected = selectedCard === card.type;

          return (
            <button
              key={card.type}
              onClick={() => canAfford && onSelectCard(card.type)}
              disabled={!canAfford}
              className={`
                relative flex-1 min-w-[70px] aspect-[3/4] rounded-lg border-b-4 transition-all duration-100 flex flex-col items-center justify-between p-1
                ${isSelected 
                  ? 'bg-yellow-100 border-yellow-600 -translate-y-2 shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
                  : canAfford 
                    ? 'bg-white border-slate-400 hover:bg-slate-50 active:scale-95' 
                    : 'bg-gray-400 border-gray-600 opacity-60 cursor-not-allowed grayscale'}
              `}
            >
              <div className="text-xs font-bold text-slate-800 text-center leading-tight w-full">{card.name}</div>
              <div className="text-2xl">{card.icon}</div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                {card.cost}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CardDeck;
