import React from 'react';
import { motion } from 'framer-motion';
import { VisualEffect } from '../types';

interface SpellEffectProps {
  effect: VisualEffect;
}

const SpellEffect: React.FC<SpellEffectProps> = ({ effect }) => {
  if (effect.type === 'explosion') {
    return (
      <motion.div
        className="absolute z-40 flex items-center justify-center pointer-events-none"
        style={{ 
          left: `${effect.x}%`, 
          top: `${effect.y}%`, 
          width: '80px', 
          height: '80px',
          transform: 'translate(-50%, -50%)'
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-orange-500 rounded-full blur-md opacity-70" />
        <div className="absolute inset-2 bg-yellow-300 rounded-full blur-sm" />
        <div className="text-4xl animate-pulse">💥</div>
      </motion.div>
    );
  }

  if (effect.type === 'zap') {
    return (
      <motion.div
        className="absolute z-40 flex items-center justify-center pointer-events-none"
        style={{ 
            left: `${effect.x}%`, 
            top: `${effect.y}%`, 
            width: '60px', 
            height: '60px',
            transform: 'translate(-50%, -50%)'
        }}
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: [0, 1, 0], scale: 1 }}
        transition={{ duration: 0.3 }}
      >
         <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-50" />
         <div className="text-4xl">⚡</div>
      </motion.div>
    );
  }

  return null;
};

export default SpellEffect;