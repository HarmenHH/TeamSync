import React from 'react';
import { motion } from 'framer-motion';

export default function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full flex items-center p-0.5 transition shrink-0 ${
        enabled ? 'bg-green-500' : 'bg-slate-200'
      }`}
    >
      <motion.div
        layout
        className={`w-5 h-5 bg-white rounded-full shadow ${
          enabled ? 'ml-auto' : ''
        }`}
      />
    </button>
  );
}
