export type Difficulty = "easy" | "medium" | "hard"
export type SudokuGrid = (number | null)[][]

export const DIFFICULTIES = {
  easy: 40,
  medium: 50,
  hard: 60,
} as const

export const isValid = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false
  }

  // Check 3x3 box
  const startRow = row - (row % 3)
  const startCol = col - (col % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false
    }
  }

  return true
}

// Simple seeded PRNG (Mulberry32)
export function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export const generateCompleteGrid = (random: () => number = Math.random): SudokuGrid => {
  const grid: SudokuGrid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(null))

  const fillGrid = (grid: SudokuGrid): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => random() - 0.5)
          for (const num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num
              if (fillGrid(grid)) return true
              grid[row][col] = null
            }
          }
          return false
        }
      }
    }
    return true
  }

  fillGrid(grid)
  return grid
}

export const createPuzzle = (completeGrid: SudokuGrid, cellsToRemove: number, random: () => number = Math.random): SudokuGrid => {
  const puzzle = completeGrid.map((row) => [...row])
  const positions = []

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j])
    }
  }

  // Shuffle positions to remove linearly
  positions.sort(() => random() - 0.5)

  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [row, col] = positions[i]
    puzzle[row][col] = null
  }

  return puzzle
}

export const findConflicts = (grid: SudokuGrid): Set<string> => {
  const conflicts = new Set<string>()

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = grid[row][col]
      if (value === null) continue

      // Check row conflicts
      for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === value) {
          conflicts.add(`${row}-${col}`)
          conflicts.add(`${row}-${c}`)
        }
      }

      // Check column conflicts
      for (let r = 0; r < 9; r++) {
        if (r !== row && grid[r][col] === value) {
          conflicts.add(`${row}-${col}`)
          conflicts.add(`${r}-${col}`)
        }
      }

      // Check 3x3 box conflicts
      const startRow = Math.floor(row / 3) * 3
      const startCol = Math.floor(col / 3) * 3
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          if ((r !== row || c !== col) && grid[r][c] === value) {
            conflicts.add(`${row}-${col}`)
            conflicts.add(`${r}-${c}`)
          }
        }
      }
    }
  }

  return conflicts
}

export const checkComplete = (grid: SudokuGrid): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) return false
    }
  }
  return true
}

export const solveGrid = (grid: SudokuGrid): SudokuGrid | null => {
  const g = grid.map(r => [...r]);
  const fill = (g: SudokuGrid): boolean => {
    for(let r=0; r<9; r++) {
      for(let c=0; c<9; c++) {
        if(g[r][c] === null) {
          for(let n=1; n<=9; n++) {
            if (isValid(g, r, c, n)) {
              g[r][c] = n;
              if (fill(g)) return true;
              g[r][c] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  if (fill(g)) return g;
  return null;
}
