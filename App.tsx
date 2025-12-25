import React, { useState, useEffect, useRef } from 'react';
import { GameState, Entity, UnitType, Lane, Commentary, VisualEffect } from './types';
import { TICK_RATE, MAX_ELIXIR, ELIXIR_REGEN_RATE, UNIT_STATS, TOWER_MAX_HP } from './constants';
import UnitEntity from './components/UnitEntity';
import SpellEffect from './components/SpellEffect';
import CardDeck from './components/CardDeck';
import GameOverlay from './components/GameOverlay';
import { getGameCommentary, getStrategyAdvice } from './services/geminiService';
import { MessageSquare, Zap, Ban, Volume2 } from 'lucide-react';

// Utility for unique IDs
const uuid = () => Math.random().toString(36).substr(2, 9);

const INITIAL_STATE: GameState = {
  isPlaying: false,
  gameOver: false,
  winner: null,
  tick: 0,
  playerElixir: 5,
  enemyElixir: 5,
  playerScore: 0,
  enemyScore: 0,
  playerTowerHp: TOWER_MAX_HP,
  enemyTowerHp: TOWER_MAX_HP,
  entities: [],
  effects: []
};

function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [selectedCard, setSelectedCard] = useState<UnitType | null>(null);
  const [commentary, setCommentary] = useState<Commentary>({ text: "Prepare-se para a batalha!", mood: "neutral" });
  const [strategy, setStrategy] = useState<string>("");
  const [invalidSpawn, setInvalidSpawn] = useState<{x: number, y: number} | null>(null);
  
  const fieldRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(INITIAL_STATE);
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const lastCommentaryRef = useRef<number>(0);

  const resetGame = () => {
    stateRef.current = JSON.parse(JSON.stringify(INITIAL_STATE));
    setGameState(stateRef.current);
    setCommentary({ text: "A partida começou!", mood: "excited" });
    setStrategy("");
  };

  const startGame = () => {
    resetGame();
    stateRef.current.isPlaying = true;
    lastUpdateRef.current = Date.now();
    gameLoop();
  };

  // Generic Cast Function (Unit or Spell)
  const castCard = (type: UnitType, owner: 'player' | 'enemy', lane: Lane, xPercent: number, yPercent: number) => {
    const stats = UNIT_STATS[type];
    const currentState = stateRef.current;
    
    // Elixir Check
    const currentElixir = owner === 'player' ? currentState.playerElixir : currentState.enemyElixir;
    if (currentElixir < stats.cost) return;

    // Deduct Elixir
    if (owner === 'player') currentState.playerElixir -= stats.cost;
    else currentState.enemyElixir -= stats.cost;

    // SPELL LOGIC
    if (stats.isSpell) {
      // 1. Visual Effect
      currentState.effects.push({
        id: uuid(),
        type: type === UnitType.FIREBALL ? 'explosion' : 'zap',
        x: xPercent,
        y: yPercent,
        createdAt: currentState.tick
      });

      // 2. Damage Logic (Area of Effect)
      // Check collision with Units
      currentState.entities.forEach(entity => {
        if (entity.owner === owner) return; // Don't hurt self
        
        // Simple distance check in % (approximate since X and Y scale differently but ok for game feel)
        // Since lane X is fixed (25 or 75), we use entity.lane to determine entity X
        const entityX = entity.lane === Lane.LEFT ? 25 : 75;
        const dist = Math.sqrt(Math.pow(entityX - xPercent, 2) + Math.pow(entity.y - yPercent, 2));

        if (dist <= stats.range) {
          entity.hp -= stats.damage;
          if (entity.hp <= 0) {
             entity.state = 'dying';
             entity.hp = 0;
          }
        }
      });

      // Check collision with Towers
      const towerX = 50;
      const enemyTowerY = 10;
      const playerTowerY = 90;
      
      const distToEnemyTower = Math.sqrt(Math.pow(towerX - xPercent, 2) + Math.pow(enemyTowerY - yPercent, 2));
      const distToPlayerTower = Math.sqrt(Math.pow(towerX - xPercent, 2) + Math.pow(playerTowerY - yPercent, 2));

      // Spells deal reduced damage to towers usually, but let's keep it simple or full damage for fun
      if (owner === 'player' && distToEnemyTower <= stats.range) {
        currentState.enemyTowerHp -= stats.damage;
      } else if (owner === 'enemy' && distToPlayerTower <= stats.range) {
        currentState.playerTowerHp -= stats.damage;
      }

      triggerCommentary(`${owner === 'player' ? 'Jogador' : 'Inimigo'} usou ${stats.name}!`);

    } else {
      // UNIT SPAWN LOGIC
      // Force X based on lane to keep units aligned
      const spawnX = lane === Lane.LEFT ? 25 : 75; 
      
      // Force Y for non-spells if not provided (though player click always provides Y)
      // If AI spawns, it sets Y to 10.
      
      const newEntity: Entity = {
        id: uuid(),
        type,
        owner,
        lane,
        y: yPercent,
        hp: stats.hp,
        maxHp: stats.maxHp,
        lastAttackTick: -100,
        state: 'moving'
      };

      currentState.entities.push(newEntity);
      
      if (owner === 'player' && Math.random() > 0.7) {
        triggerCommentary(`O jogador invocou ${stats.name}!`);
      }
    }
  };

  const handleFieldClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!stateRef.current.isPlaying || !selectedCard || !fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const stats = UNIT_STATS[selectedCard];
    const lane = xPercent < 50 ? Lane.LEFT : Lane.RIGHT;

    // Validation:
    // Spells can be cast anywhere.
    // Units can only be spawned on own side (y > 45%).
    if (!stats.isSpell && yPercent < 45) {
      setInvalidSpawn({ x: clientX, y: clientY });
      setTimeout(() => setInvalidSpawn(null), 500);
      return;
    }

    castCard(selectedCard, 'player', lane, xPercent, yPercent);
    setSelectedCard(null);
  };

  const triggerCommentary = async (event: string) => {
    const now = Date.now();
    if (now - lastCommentaryRef.current < 4000) return;
    lastCommentaryRef.current = now;

    try {
      const result = await getGameCommentary(stateRef.current, event);
      setCommentary(result);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStrategy = async () => {
     if (!stateRef.current.isPlaying) return;
     const enemyUnits = stateRef.current.entities
        .filter(e => e.owner === 'enemy')
        .map(e => UNIT_STATS[e.type].name);
     
     const advice = await getStrategyAdvice(stateRef.current.playerElixir, enemyUnits);
     setStrategy(advice);
  };

  // --- GAME LOOP ---
  const gameLoop = () => {
    if (!stateRef.current.isPlaying || stateRef.current.gameOver) return;

    const now = Date.now();
    const dt = now - lastUpdateRef.current;

    if (dt >= TICK_RATE) {
      updateGameState();
      lastUpdateRef.current = now;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const updateGameState = () => {
    const state = stateRef.current;
    state.tick++;

    // 1. Elixir Regen
    if (state.playerElixir < MAX_ELIXIR) state.playerElixir = Math.min(MAX_ELIXIR, state.playerElixir + ELIXIR_REGEN_RATE);
    if (state.enemyElixir < MAX_ELIXIR) state.enemyElixir = Math.min(MAX_ELIXIR, state.enemyElixir + ELIXIR_REGEN_RATE);

    // 2. Remove Old Effects (last 15 ticks = 0.5s)
    state.effects = state.effects.filter(ef => state.tick - ef.createdAt < 15);

    // 3. AI Logic
    if (state.tick % 60 === 0) {
      if (state.enemyElixir > 6) {
        // AI Spell Chance
        if (Math.random() > 0.8) {
             const spell = Math.random() > 0.5 ? UnitType.FIREBALL : UnitType.ZAP;
             // Aim at player cluster or tower
             castCard(spell, 'enemy', Lane.LEFT, 25, 80); // Dumb AI aiming at bottom left
        } else {
             const lane = Math.random() > 0.5 ? Lane.LEFT : Lane.RIGHT;
             const availableUnits = Object.values(UNIT_STATS).filter(u => u.cost <= state.enemyElixir && !u.isSpell);
             if (availableUnits.length > 0) {
                const randomUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
                castCard(randomUnit.type, 'enemy', lane, lane === Lane.LEFT ? 25 : 75, 10);
             }
        }
      }
    }

    // 4. Entity Processing
    const entities = state.entities;

    entities.forEach(entity => {
      const stats = UNIT_STATS[entity.type];
      let target: Entity | null = null;

      // Find targets in SAME LANE
      const enemies = entities.filter(e => 
        e.owner !== entity.owner && 
        e.lane === entity.lane && 
        e.hp > 0
      );
      
      let minDist = Infinity;
      enemies.forEach(e => {
        const dist = Math.abs(entity.y - e.y);
        if (dist < minDist) {
          minDist = dist;
          target = e;
        }
      });

      // Target Logic for Tower
      const towerY = entity.owner === 'player' ? 12 : 88;
      const distToTower = Math.abs(entity.y - towerY);

      // Friendly Collision (Simple)
      const isBlockedByFriend = entities.some(friend => 
        friend.id !== entity.id &&
        friend.owner === entity.owner &&
        friend.lane === entity.lane &&
        (entity.owner === 'player' ? (friend.y < entity.y) : (friend.y > entity.y)) &&
        Math.abs(friend.y - entity.y) < 7 
      );

      if (stats.type === UnitType.GIANT) target = null;

      const range = stats.range;
      
      // -- MOVEMENT & ATTACK STATE MACHINE --
      if (target && minDist <= range) {
        // Attack Unit
        entity.state = 'attacking';
        if (state.tick - entity.lastAttackTick >= stats.attackSpeed) {
           target.hp -= stats.damage;
           entity.lastAttackTick = state.tick;
           if (target.hp <= 0) { target.state = 'dying'; target.hp = 0; }
        }
      } else if (distToTower <= range) {
        // Attack Tower
        entity.state = 'attacking';
        if (state.tick - entity.lastAttackTick >= stats.attackSpeed) {
           if (entity.owner === 'player') {
             state.enemyTowerHp -= stats.damage;
             if (state.enemyTowerHp <= 0) endGame('player');
           } else {
             state.playerTowerHp -= stats.damage;
             if (state.playerTowerHp <= 0) endGame('enemy');
           }
           entity.lastAttackTick = state.tick;
        }
      } else {
        // Move
        if (!isBlockedByFriend) {
          entity.state = 'moving';
          const moveDir = entity.owner === 'player' ? -1 : 1;
          entity.y += moveDir * stats.speed;
        } else {
          // Idle but "moving" state for animation
          entity.state = 'moving'; 
        }

        // --- STRICT BOUNDARIES (Fixes Infinite Walking) ---
        // Player units must stop at Enemy Tower Y (approx 12)
        if (entity.owner === 'player' && entity.y < 12) {
            entity.y = 12;
            // Force attack state if stuck at wall (attacking tower usually handles this, but this is a failsafe)
            entity.state = 'attacking'; 
        }
        // Enemy units must stop at Player Tower Y (approx 88)
        if (entity.owner === 'enemy' && entity.y > 88) {
            entity.y = 88;
            entity.state = 'attacking';
        }
      }
    });

    state.entities = entities.filter(e => e.hp > 0);

    if (state.enemyTowerHp <= 0 && !state.gameOver) endGame('player');
    if (state.playerTowerHp <= 0 && !state.gameOver) endGame('enemy');

    setGameState({ ...state });
  };

  const endGame = (winner: 'player' | 'enemy') => {
    stateRef.current.gameOver = true;
    stateRef.current.winner = winner;
    stateRef.current.isPlaying = false;
    triggerCommentary(winner === 'player' ? "Vitória do Jogador!" : "Vitória do Inimigo!");
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setGameState({ ...stateRef.current });
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // --- RENDER ---
  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden font-sans select-none flex flex-col items-center">
      
      {/* HEADER BAR (NEW CHAT LOCATION) */}
      <div className="w-full max-w-md bg-neutral-800 text-white p-2 flex items-center justify-between border-b-4 border-neutral-900 z-50 shadow-md h-16">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-yellow-500 rounded-full p-1.5 flex-shrink-0">
            <Volume2 size={16} className="text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Narração Ao Vivo</span>
            <span className={`text-xs font-medium leading-tight truncate transition-colors duration-300 ${commentary.mood === 'excited' ? 'text-yellow-200' : 'text-gray-200'}`}>
              {commentary.text}
            </span>
          </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div 
        ref={fieldRef}
        onClick={handleFieldClick}
        className="relative w-full max-w-md flex-1 bg-[#5d9635] shadow-2xl overflow-hidden flex flex-col cursor-crosshair"
      >
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #8bc34a 2px, transparent 2.5px)', backgroundSize: '20px 20px' }} 
        />
        
        {/* River */}
        <div className="absolute top-1/2 left-0 w-full h-12 -mt-6 bg-blue-400 border-y-4 border-blue-600/50 z-0 flex items-center justify-center pointer-events-none">
           <div className="animate-pulse opacity-50 text-blue-800 text-xs tracking-widest font-bold">RIO</div>
        </div>

        {/* Bridges */}
        <div className="absolute top-1/2 left-[25%] w-16 h-16 -mt-8 -ml-8 bg-amber-700 border-x-4 border-amber-900 z-0 rounded-sm pointer-events-none" />
        <div className="absolute top-1/2 left-[75%] w-16 h-16 -mt-8 -ml-8 bg-amber-700 border-x-4 border-amber-900 z-0 rounded-sm pointer-events-none" />

        {/* Strategy Button */}
         {gameState.isPlaying && (
          <div className="absolute top-4 right-2 z-30" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={fetchStrategy}
              className="bg-purple-600 text-white p-2 rounded-full shadow-lg border-2 border-purple-400 active:scale-90 transition-transform"
            >
              <Zap size={20} />
            </button>
            {strategy && (
              <div className="absolute right-10 top-0 w-40 bg-purple-900/90 text-white text-xs p-2 rounded-lg border border-purple-400 shadow-xl z-50">
                {strategy}
              </div>
            )}
          </div>
        )}

        {/* ENEMY AREA (TOP) */}
        <div className="flex-1 relative border-b-2 border-black/10 pointer-events-none">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
            <div className="w-24 h-4 bg-gray-800 rounded-full border border-black mb-1 overflow-hidden">
               <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(gameState.enemyTowerHp / TOWER_MAX_HP) * 100}%` }} />
            </div>
            <div className="w-16 h-16 bg-red-600 rounded-lg border-4 border-red-800 shadow-lg flex items-center justify-center text-3xl">🏰</div>
            <span className="text-xs font-bold text-white drop-shadow-md mt-1">{Math.max(0, Math.floor(gameState.enemyTowerHp))}</span>
          </div>
        </div>

        {/* PLAYER AREA (BOTTOM) */}
        <div className="flex-1 relative border-t-2 border-black/10 pointer-events-none">
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
             <span className="text-xs font-bold text-white drop-shadow-md mb-1">{Math.max(0, Math.floor(gameState.playerTowerHp))}</span>
             <div className="w-16 h-16 bg-blue-600 rounded-lg border-4 border-blue-800 shadow-lg flex items-center justify-center text-3xl">🏯</div>
             <div className="w-24 h-4 bg-gray-800 rounded-full border border-black mt-1 overflow-hidden">
               <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${(gameState.playerTowerHp / TOWER_MAX_HP) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Invalid Spawn Indicator */}
        {invalidSpawn && (
          <div 
            className="absolute z-50 text-red-500 font-bold text-sm pointer-events-none flex items-center gap-1 animate-bounce bg-black/70 px-3 py-1 rounded-full border border-red-500"
            style={{ left: invalidSpawn.x, top: invalidSpawn.y, transform: 'translate(-50%, -100%)' }}
          >
            <Ban size={16} /> Área Inimiga!
          </div>
        )}

        {/* RENDER SPELL EFFECTS */}
        {gameState.effects.map(effect => (
          <SpellEffect key={effect.id} effect={effect} />
        ))}

        {/* RENDER ENTITIES */}
        {gameState.entities.map(entity => (
          <UnitEntity key={entity.id} entity={entity} gameTick={gameState.tick} />
        ))}

        <div className="mt-auto pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <CardDeck 
            elixir={gameState.playerElixir} 
            onSelectCard={(type) => setSelectedCard(selectedCard === type ? null : type)}
            selectedCard={selectedCard}
          />
        </div>

        <GameOverlay 
          gameState={gameState} 
          onStart={startGame} 
          onRestart={startGame}
        />

      </div>
    </div>
  );
}

export default App;