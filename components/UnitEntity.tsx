import React, { useEffect, useState } from 'react';
import { Entity, UnitType } from '../types';
import { UNIT_STATS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface UnitEntityProps {
  entity: Entity;
  gameTick: number; // Used to sync animations
}

const AttackEffect: React.FC<{ type: UnitType; owner: 'player' | 'enemy' }> = ({ type, owner }) => {
  const isPlayer = owner === 'player';
  const direction = isPlayer ? -1 : 1;

  if (type === UnitType.ARCHER) {
    return (
      <motion.div
        className="absolute w-1 h-4 bg-yellow-300 rounded-sm z-0 shadow-sm shadow-yellow-500"
        style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
        initial={{ y: 0, opacity: 1, scale: 1, rotate: isPlayer ? 0 : 180 }}
        animate={{ y: direction * 80, opacity: 0 }}
        transition={{ duration: 0.25, ease: "linear" }}
      />
    );
  }

  // Melee Visuals
  return (
    <motion.div
      className="absolute w-14 h-14 border-2 border-white rounded-full z-20 opacity-50"
      style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
      initial={{ scale: 0.5, opacity: 0.8 }}
      animate={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.2 }}
    />
  );
};

const UnitEntity: React.FC<UnitEntityProps> = ({ entity, gameTick }) => {
  const stats = UNIT_STATS[entity.type];
  const isPlayer = entity.owner === 'player';
  const topPosition = `${entity.y}%`;
  const healthPercent = (entity.hp / entity.maxHp) * 100;
  
  // Detect attack
  const [showEffect, setShowEffect] = useState(false);
  
  useEffect(() => {
    // If last attack was extremely recent (within 2 ticks), trigger effect
    if (gameTick - entity.lastAttackTick < 2 && entity.lastAttackTick > 0) {
      setShowEffect(true);
      const timer = setTimeout(() => setShowEffect(false), 300);
      return () => clearTimeout(timer);
    }
  }, [entity.lastAttackTick, gameTick]);

  // Animation variants for walking
  const walkVariants = {
    moving: { 
      y: [0, -4, 0],
      transition: { 
        duration: 0.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }
    },
    attacking: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    idle: {}
  };

  return (
    <div
      className="absolute w-12 h-12 flex flex-col items-center justify-center transition-all duration-300 ease-linear z-10"
      style={{
        top: topPosition,
        left: entity.lane === 'LEFT' ? '25%' : '75%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Attack Effects Layer */}
      <AnimatePresence>
        {showEffect && <AttackEffect type={entity.type} owner={entity.owner} />}
      </AnimatePresence>

      {/* Health Bar */}
      <div className="absolute -top-3 w-10 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-black/50 z-20">
        <div 
          className={`h-full ${isPlayer ? 'bg-green-500' : 'bg-red-500'}`} 
          style={{ width: `${healthPercent}%` }}
        />
      </div>

      {/* Unit Sprite with Animation */}
      <motion.div 
        className={`
          w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl shadow-lg relative z-10
          ${isPlayer ? 'bg-blue-100 border-blue-600' : 'bg-red-100 border-red-600'}
        `}
        animate={entity.state === 'attacking' ? 'attacking' : 'moving'}
        variants={walkVariants}
      >
        {stats.icon}
      </motion.div>
    </div>
  );
};

export default UnitEntity;