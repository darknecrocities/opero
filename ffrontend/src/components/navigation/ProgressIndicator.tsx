import React from 'react';
import { motion, type MotionValue } from 'framer-motion';

export interface ProgressIndicatorProps {
  progress: MotionValue<number>;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => (
  <div
    aria-hidden="true"
    className="fixed top-[92px] left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none"
  >
    <motion.div
      className="h-full origin-left bg-[#247BFA]"
      style={{ scaleX: progress }}
    />
  </div>
);
