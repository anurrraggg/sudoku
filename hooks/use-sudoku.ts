import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SudokuGrid,
  Difficulty,
  generateCompleteGrid,
  createPuzzle,
  findConflicts,
  checkComplete,
  DIFFICULTIES,
  mulberry32,
  solveGrid
} from '@/lib/sudoku-logic';
import { recordGameResult } from '@/lib/player-stats';
import { toast } from 'sonner';

export type NotesGrid = Set<number>[][];
export type GameMode = "classic" | "daily" | "builder";

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export interface SudokuState {
  userGrid: SudokuGrid;
  notes: NotesGrid;
  conflicts: Set<string>;
  mistakes: number;
}

export const triggerHaptic = (type: "light" | "heavy" | "success", enabled: boolean = true) => {
  if (!enabled) return;
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    if (type === "light") navigator.vibrate(10);
    else if (type === "heavy") navigator.vibrate([30, 50, 30]);
    else if (type === "success") navigator.vibrate([10, 50, 10, 50, 50]);
  }
};

export function useSudoku(initialDifficulty: Difficulty = 'medium') {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [puzzle, setPuzzle] = useState<SudokuGrid>([]);
  const [solution, setSolution] = useState<SudokuGrid>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [notesMode, setNotesMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  
  const [state, setState] = useState<SudokuState>({
    userGrid: [],
    notes: [],
    conflicts: new Set(),
    mistakes: 0,
  });

  const [history, setHistory] = useState<SudokuState[]>([]);
  const [redoStack, setRedoStack] = useState<SudokuState[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [hints, setHints] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    setIsPlaying(true);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
  }, []);

  const toggleTimer = useCallback(() => {
    if (isPlaying) stopTimer();
    else startTimer();
  }, [isPlaying, startTimer, stopTimer]);

  useEffect(() => {
    const savedHaptic = localStorage.getItem("sudoku-haptic");
    if (savedHaptic !== null) {
      setHapticEnabled(savedHaptic === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sudoku-haptic", hapticEnabled.toString());
  }, [hapticEnabled]);

  useEffect(() => {
    return stopTimer;
  }, [stopTimer]);

  const initEmptyNotes = useCallback(() => {
    return Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set<number>())
    );
  }, []);

  const generateGame = useCallback(async (diff: Difficulty, mode: GameMode = "classic") => {
    setIsGenerating(true);
    stopTimer();
    setTime(0);
    setHints(0);
    setGameMode(mode);

    // Small delay to allow UI to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    let prng = Math.random;
    if (mode === "daily") {
      const today = new Date().toISOString().split('T')[0];
      prng = mulberry32(hashString(today));
      diff = "hard"; // Daily challenge is always Hard
    }

    const sol = generateCompleteGrid(prng);
    const puz = createPuzzle(sol, DIFFICULTIES[diff], prng);
    
    setSolution(sol);
    setPuzzle(puz);
    setSelectedCells([]);
    
    setState({
      userGrid: puz.map(row => [...row]),
      notes: initEmptyNotes(),
      conflicts: new Set(),
      mistakes: 0,
    });
    setHistory([]);
    setRedoStack([]);
    setIsComplete(false);
    setIsGenerating(false);
    startTimer();
  }, [stopTimer, initEmptyNotes, startTimer]);

  const startBuilderMode = useCallback(() => {
    stopTimer();
    setTime(0);
    setHints(0);
    setGameMode("builder");
    
    const emptyGrid = Array(9).fill(null).map(() => Array(9).fill(null));
    setPuzzle(emptyGrid);
    setSolution(emptyGrid);
    setSelectedCells([]);
    setState({
      userGrid: emptyGrid,
      notes: initEmptyNotes(),
      conflicts: new Set(),
      mistakes: 0,
    });
    setHistory([]);
    setRedoStack([]);
    setIsComplete(false);
    setIsGenerating(false);
  }, [stopTimer, initEmptyNotes]);

  const validateAndPlayBuilder = useCallback(() => {
    const sol = solveGrid(state.userGrid);
    if (!sol) {
      toast.error("Invalid Puzzle", { description: "This board has no valid solution. Please modify the numbers." });
      return;
    }
    
    // Lock the current userGrid as the new 'puzzle' template
    setPuzzle(state.userGrid.map(row => [...row]));
    setSolution(sol);
    setGameMode("classic");
    setDifficulty("medium");
    startTimer();
    toast.success("Ready to Play!", { description: "Custom puzzle locked in and timer started." });
  }, [state.userGrid, startTimer]);

  // Handle cell click (single selection fallback, will be superseded by drag later)
  const selectCell = useCallback((row: number, col: number, multi?: boolean) => {
    if (isGenerating || isComplete || !isPlaying) return;
    if (multi) {
      setSelectedCells(prev => {
        // Find if already exists
        const exists = prev.find(p => p[0] === row && p[1] === col);
        if (exists) return prev.filter(p => !(p[0] === row && p[1] === col));
        return [...prev, [row, col]];
      });
    } else {
      setSelectedCells([[row, col]]);
    }
  }, [isGenerating, isComplete, isPlaying]);

  // Handle number input (1-9) or clear (null)
  const inputNumber = useCallback((num: number | null) => {
    if (selectedCells.length === 0 || isGenerating || isComplete || !isPlaying) return;

    // Detect if we can actually modify anything
    const editableCells = selectedCells.filter(([r, c]) => puzzle[r][c] === null);
    if (editableCells.length === 0) return;

    // Save history before modifying
    setHistory(prev => [...prev, state]);
    setRedoStack([]); // Clear redo stack on new input

    let newNotes = state.notes.map(r => r.map(c => new Set(c)));
    let newUserGrid = state.userGrid.map(r => [...r]);
    let newMistakes = state.mistakes;

    let hapticPlayedStatus: "light" | "heavy" | null = null;
    let anyChanges = false;

    // Apply to all selected editable cells
    for (const [row, col] of editableCells) {
      if (notesMode && num !== null) {
        // Toggle note
        if (newNotes[row][col].has(num)) {
          newNotes[row][col].delete(num);
        } else {
          newNotes[row][col].add(num);
        }
        anyChanges = true;
        if (!hapticPlayedStatus) hapticPlayedStatus = "light";
      } else {
        // Normal mode
        if (num !== null && newUserGrid[row][col] === num) {
          // If clicking same number, clear it
          newUserGrid[row][col] = null;
          anyChanges = true;
          if (!hapticPlayedStatus) hapticPlayedStatus = "light";
        } else {
          newUserGrid[row][col] = num;
          anyChanges = true;
          
          if (gameMode !== "builder") {
            // Increment mistakes if it's incorrect (only outside builder mode)
            if (num !== null && solution[row][col] !== num) {
              newMistakes += 1;
              hapticPlayedStatus = "heavy"; // Upgrade haptic to heavy for mistake
            }

            // Automatically remove valid notes from affected row, col, and box if input is correct
            if (num !== null && solution[row][col] === num) {
                if (!hapticPlayedStatus) hapticPlayedStatus = "light";
                for(let i=0; i<9; i++) {
                    newNotes[row][i].delete(num);
                    newNotes[i][col].delete(num);
                }
                const startR = Math.floor(row / 3) * 3;
                const startC = Math.floor(col / 3) * 3;
                for(let i=startR; i<startR+3; i++) {
                    for(let j=startC; j<startC+3; j++) {
                        newNotes[i][j].delete(num);
                    }
                }
            }
          } else {
             if (!hapticPlayedStatus) hapticPlayedStatus = "light";
          }
        }
      }
    }

    if (!anyChanges) return;

    if (hapticPlayedStatus) {
      triggerHaptic(hapticPlayedStatus, hapticEnabled);
    }

    const newConflicts = findConflicts(newUserGrid);
    const complete = gameMode !== "builder" && checkComplete(newUserGrid) && newConflicts.size === 0;

    setState({
      userGrid: newUserGrid,
      notes: newNotes,
      conflicts: newConflicts,
      mistakes: newMistakes,
    });

    if (complete) {
      triggerHaptic("success", hapticEnabled);
      setIsComplete(true);
      stopTimer();

      // Record Stats
      const result = recordGameResult({
        difficulty: difficulty,
        time: time,
        mistakes: newMistakes,
        hints: hints,
        isWin: true
      });

      // Show Achievement Toasts
      result.newAchievements.forEach((achv, idx) => {
        setTimeout(() => {
          toast(`Achievement Unlocked: ${achv.name}`, {
            description: achv.description,
            icon: achv.icon,
            duration: 5000,
          });
        }, idx * 1000); // Stagger toasts
      });
    }
  }, [selectedCells, isGenerating, isComplete, isPlaying, puzzle, state, notesMode, solution, stopTimer, difficulty, time, hints]);

  const undo = useCallback(() => {
    if (history.length === 0 || isGenerating || isComplete) return;
    const prevState = history[history.length - 1];
    setRedoStack(prev => [state, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setState(prevState);
  }, [history, state, isGenerating, isComplete]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || isGenerating || isComplete) return;
    const nextState = redoStack[0];
    setHistory(prev => [...prev, state]);
    setRedoStack(prev => prev.slice(1));
    setState(nextState);
  }, [redoStack, state, isGenerating, isComplete]);

  const clearCell = useCallback(() => {
    inputNumber(null);
  }, [inputNumber]);

  const toggleNotesMode = useCallback(() => {
    if (!isPlaying || isComplete || isGenerating) return;
    setNotesMode(prev => !prev);
  }, [isPlaying, isComplete, isGenerating]);

  const useHint = useCallback(() => {
    if (isGenerating || isComplete || !isPlaying || gameMode === "builder") return;
    
    // Find an empty cell or an incorrect cell
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (state.userGrid[r][c] === null || state.userGrid[r][c] !== solution[r][c]) {
          if (puzzle[r][c] === null) {
            emptyCells.push([r, c]);
          }
        }
      }
    }

    if (emptyCells.length === 0) return;

    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const correctVal = solution[row][col] as number;

    setHistory(prev => [...prev, state]);
    setRedoStack([]);
    
    const newUserGrid = state.userGrid.map(r => [...r]);
    newUserGrid[row][col] = correctVal;

    // Remove notes
    const newNotes = state.notes.map(r => r.map(c => new Set(c)));
    for(let i=0; i<9; i++) {
        newNotes[row][i].delete(correctVal);
        newNotes[i][col].delete(correctVal);
    }
    const startR = Math.floor(row / 3) * 3;
    const startC = Math.floor(col / 3) * 3;
    for(let i=startR; i<startR+3; i++) {
        for(let j=startC; j<startC+3; j++) {
            newNotes[i][j].delete(correctVal);
        }
    }

    const newConflicts = findConflicts(newUserGrid);
    const complete = checkComplete(newUserGrid) && newConflicts.size === 0;

    setState({
      userGrid: newUserGrid,
      notes: newNotes,
      conflicts: newConflicts,
      mistakes: state.mistakes,
    });
    setHints(prev => prev + 1);
    setSelectedCells([[row, col]]);
    triggerHaptic("light", hapticEnabled);

    if (complete) {
      triggerHaptic("success", hapticEnabled);
      setIsComplete(true);
      stopTimer();

      // Record Stats with hints + 1
      const result = recordGameResult({
        difficulty: difficulty,
        time: time,
        mistakes: state.mistakes,
        hints: hints + 1,
        isWin: true
      });

      result.newAchievements.forEach((achv, idx) => {
        setTimeout(() => {
          toast(`Achievement Unlocked: ${achv.name}`, {
            description: achv.description,
            icon: achv.icon,
            duration: 5000,
          });
        }, idx * 1000);
      });
    }
  }, [isGenerating, isComplete, isPlaying, state, puzzle, solution, stopTimer, difficulty, time, hints]);

  const restart = useCallback(() => {
    setState({
      userGrid: puzzle.map(r => [...r]),
      notes: initEmptyNotes(),
      conflicts: new Set(),
      mistakes: 0
    });
    setHistory([]);
    setRedoStack([]);
    setSelectedCells([]);
    setHints(0);
    setTime(0);
    setIsComplete(false);
    startTimer();
  }, [puzzle, initEmptyNotes, startTimer]);

  return {
    difficulty,
    setDifficulty,
    puzzle,
    solution,
    ...state,
    selectedCells,
    setSelectedCells,
    notesMode,
    isZenMode,
    setIsZenMode,
    hapticEnabled,
    setHapticEnabled,
    gameMode,
    isGenerating,
    isComplete,
    isPlaying,
    time,
    hints,
    historySize: history.length,
    redoSize: redoStack.length,
    generateGame,
    startBuilderMode,
    validateAndPlayBuilder,
    selectCell,
    inputNumber,
    clearCell,
    toggleNotesMode,
    undo,
    redo,
    useHint,
    restart,
    toggleTimer
  };
}
