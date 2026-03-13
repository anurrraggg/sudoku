import { memo } from 'react';
import { motion } from 'framer-motion';

interface CellProps {
  value: number | null;
  notes: Set<number>;
  isGiven: boolean;
  isSelected: boolean;
  isRelated: boolean;
  isMatch: boolean;
  hasConflict: boolean;
  onPointerDown: () => void;
  onPointerEnter: () => void;
  row: number;
  col: number;
}

export const Cell = memo(({
  value,
  notes,
  isGiven,
  isSelected,
  isRelated,
  isMatch,
  hasConflict,
  onPointerDown,
  onPointerEnter,
  row,
  col,
}: CellProps) => {
  // Thick borders for 3x3 blocks
  const borderClasses = [
    'border-[0.5px] border-[var(--color-sudoku-line)]',
    row % 3 === 0 ? 'border-t-2 border-t-[var(--color-sudoku-block)]' : '',
    col % 3 === 0 ? 'border-l-2 border-l-[var(--color-sudoku-block)]' : '',
    row === 8 ? 'border-b-2 border-b-[var(--color-sudoku-block)]' : '',
    col === 8 ? 'border-r-2 border-r-[var(--color-sudoku-block)]' : '',
  ].join(' ');

  // Background and Text colors
  let bgClass = 'bg-[var(--color-sudoku-surface)] hover:bg-[var(--color-sudoku-hover)] transition-colors duration-200';
  let textClass = 'text-foreground';

  if (hasConflict) {
    bgClass = 'bg-[var(--color-sudoku-conflict-bg)]';
    textClass = 'text-[var(--color-sudoku-text-conflict)] font-bold';
  } else if (isSelected) {
    bgClass = 'bg-[var(--color-sudoku-selected)] ring-inset ring-2 ring-primary/20';
  } else if (isGiven) {
    textClass = 'text-[var(--color-sudoku-text-given)] font-extrabold';
  } else {
    textClass = 'text-[var(--color-sudoku-text-user)] font-semibold';
  }

  if (!hasConflict && !isSelected) {
    if (isMatch) {
      bgClass = 'bg-[var(--color-sudoku-match)]';
    } else if (isRelated) {
      bgClass = 'bg-[var(--color-sudoku-related)]';
    }
  }

  return (
    <motion.div
      onPointerDown={(e) => {
        // Only react to main button click
        if (e.button === 0) onPointerDown();
      }}
      onPointerEnter={onPointerEnter}
      className={`
        relative w-full aspect-square flex items-center justify-center 
        text-[clamp(1rem,5vw,1.875rem)] cursor-pointer select-none font-sans
        touch-none /* prevent scrolling on mobile while dragging over cells */
        ${borderClasses} ${bgClass} ${textClass}
      `}
      whileTap={!isGiven ? { scale: 0.95 } : {}}
      animate={hasConflict ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.2 }}
    >
      {value ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        >
          {value}
        </motion.span>
      ) : (
        notes.size > 0 && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[2px] pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <div key={n} className="flex items-center justify-center">
                {notes.has(n) && (
                  <span className="text-[9px] md:text-xs font-medium text-[var(--color-sudoku-notes)] leading-none text-center">
                    {n}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
});

Cell.displayName = 'Cell';
