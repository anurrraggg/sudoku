import { useMemo, useRef, useEffect } from 'react';
import { Cell } from './cell';
import { NotesGrid } from '@/hooks/use-sudoku';
import { SudokuGrid } from '@/lib/sudoku-logic';
import { motion } from 'framer-motion';

interface BoardProps {
  puzzle: SudokuGrid;
  userGrid: SudokuGrid;
  notes: NotesGrid;
  selectedCells: [number, number][];
  setSelectedCells: (cells: [number, number][]) => void;
  conflicts: Set<string>;
  isComplete: boolean;
}

export const Board = ({
  puzzle,
  userGrid,
  notes,
  selectedCells,
  setSelectedCells,
  conflicts,
  isComplete,
}: BoardProps) => {

  const selectedValue = useMemo(() => {
    if (selectedCells.length === 0) return null;
    const [r, c] = selectedCells[0];
    return userGrid[r][c] || puzzle[r][c];
  }, [selectedCells, userGrid, puzzle]);

  // Local drag state
  const isDragging = useRef(false);

  useEffect(() => {
    const handlePointerUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const handlePointerDown = (row: number, col: number) => {
    if (isComplete) return;
    isDragging.current = true;
    setSelectedCells([[row, col]]);
  };

  const handlePointerEnter = (row: number, col: number) => {
    if (!isDragging.current || isComplete) return;
    // Append to selection if not already selected
    const alreadySelected = selectedCells.some(c => c[0] === row && c[1] === col);
    if (!alreadySelected) {
      setSelectedCells([...selectedCells, [row, col]]);
    }
  };

  return (
    <div className="relative w-full max-w-[28rem] mx-auto aspect-square select-none touch-none">
      <motion.div 
        className="w-full h-full grid grid-cols-9 grid-rows-9 bg-background shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden rounded-xl border-[3px] border-[var(--color-sudoku-block)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {userGrid.map((row: (number | null)[], rowIndex: number) =>
          row.map((val: number | null, colIndex: number) => {
            const isSelected = selectedCells.some(c => c[0] === rowIndex && c[1] === colIndex);
            const isGiven = puzzle[rowIndex][colIndex] !== null;
            const hasConflict = conflicts.has(`${rowIndex}-${colIndex}`);
            
            // For related highlights, we look at the primarily selected cell (the first one)
            const primaryCell = selectedCells.length > 0 ? selectedCells[0] : null;

            const isSameRow = primaryCell?.[0] === rowIndex;
            const isSameCol = primaryCell?.[1] === colIndex;
            const isSameBox = primaryCell &&
              Math.floor(primaryCell[0] / 3) === Math.floor(rowIndex / 3) &&
              Math.floor(primaryCell[1] / 3) === Math.floor(colIndex / 3);
            
            const isRelated = !isSelected && selectedCells.length === 1 && (isSameRow || isSameCol || isSameBox);
            
            const displayVal = val || puzzle[rowIndex][colIndex];
            // Only highlight matches if one cell is selected and it has a value
            const isMatch = !!selectedValue && selectedCells.length === 1 && !isSelected && selectedValue === displayVal;

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                row={rowIndex}
                col={colIndex}
                value={displayVal}
                notes={notes[rowIndex]?.[colIndex] || new Set()}
                isGiven={isGiven}
                isSelected={isSelected}
                isRelated={!!isRelated}
                isMatch={isMatch}
                hasConflict={hasConflict}
                onPointerDown={() => handlePointerDown(rowIndex, colIndex)}
                onPointerEnter={() => handlePointerEnter(rowIndex, colIndex)}
              />
            );
          })
        )}
      </motion.div>
      
      {isComplete && (
        <motion.div 
          className="absolute inset-0 bg-background/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.4 }}
            className="bg-card px-10 py-8 rounded-[2rem] shadow-2xl border border-border/50 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-primary to-blue-600 bg-clip-text text-transparent">
              Puzzle Solved
            </h2>
            <p className="mt-2 text-muted-foreground font-medium">Breathtaking performance.</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
