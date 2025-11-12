"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Coffee,
  RotateCcw,
  Check,
  Zap,
  Sun,
  Moon,
  ChevronDown,
  Linkedin,
  Github,
  CreditCard,
  Wallet,
  Clock,
  Pause,
  Play,
  Sparkles,
  AlertTriangle,
  Grid3x3,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Difficulty = "easy" | "medium" | "hard"
type SudokuGrid = (number | null)[][]
type SudokuState = {
  puzzle: SudokuGrid
  solution: SudokuGrid
  userGrid: SudokuGrid
  selectedCell: [number, number] | null
  conflicts: Set<string>
  isComplete: boolean
}

const DIFFICULTIES = {
  easy: 40,
  medium: 50,
  hard: 60,
} as const

export default function SudokuGame() {
  const [gameState, setGameState] = useState<SudokuState>({
    puzzle: [],
    solution: [],
    userGrid: [],
    selectedCell: null,
    conflicts: new Set(),
    isComplete: false,
  })
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [showConnectDropdown, setShowConnectDropdown] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    setIsTimerRunning(true)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsTimerRunning(false)
  }, [])

  const toggleTimer = () => {
    if (isTimerRunning) {
      stopTimer()
    } else {
      startTimer()
    }
  }

  // Generate a complete valid Sudoku grid
  const generateCompleteGrid = useCallback((): SudokuGrid => {
    const grid: SudokuGrid = Array(9)
      .fill(null)
      .map(() => Array(9).fill(null))

    const isValid = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
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

    const fillGrid = (grid: SudokuGrid): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === null) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
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
  }, [])

  // Create puzzle by removing numbers from complete grid
  const createPuzzle = useCallback((completeGrid: SudokuGrid, cellsToRemove: number): SudokuGrid => {
    const puzzle = completeGrid.map((row) => [...row])
    const positions = []

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        positions.push([i, j])
      }
    }

    positions.sort(() => Math.random() - 0.5)

    for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
      const [row, col] = positions[i]
      puzzle[row][col] = null
    }

    return puzzle
  }, [])

  // Generate new game
  const generateNewGame = useCallback(
    async (diff: Difficulty) => {
      setIsGenerating(true)
      stopTimer()
      setElapsedTime(0)
      setMistakeCount(0)
      setHintsUsed(0)

      // Add small delay for smooth UX
      await new Promise((resolve) => setTimeout(resolve, 100))

      const solution = generateCompleteGrid()
      const puzzle = createPuzzle(solution, DIFFICULTIES[diff])
      const userGrid = puzzle.map((row) => [...row])

      setGameState({
        puzzle,
        solution,
        userGrid,
        selectedCell: null,
        conflicts: new Set(),
        isComplete: false,
      })

      setIsGenerating(false)
       startTimer()
    },
    [generateCompleteGrid, createPuzzle, startTimer, stopTimer],
  )

  // Check for conflicts
  const findConflicts = useCallback((grid: SudokuGrid): Set<string> => {
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
  }, [])

  // Check if puzzle is complete
  const checkComplete = useCallback((grid: SudokuGrid): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) return false
      }
    }
    return true
  }, [])

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameState.puzzle[row][col] !== null) return // Can't select given cells
    setGameState((prev) => ({
      ...prev,
      selectedCell: [row, col],
    }))
  }

  // Handle number input
  const handleNumberInput = (num: number | null) => {
    if (!gameState.selectedCell) return

    const [row, col] = gameState.selectedCell
    if (gameState.puzzle[row][col] !== null) return // Can't modify given cells

    const newUserGrid = gameState.userGrid.map((r) => [...r])
    newUserGrid[row][col] = num

    if (num !== null && gameState.solution[row][col] !== num) {
      setMistakeCount((prev) => prev + 1)
    }

    const conflicts = findConflicts(newUserGrid)
    const isComplete = checkComplete(newUserGrid) && conflicts.size === 0

    setGameState((prev) => ({
      ...prev,
      userGrid: newUserGrid,
      conflicts,
      isComplete,
    }))

    if (isComplete) {
      stopTimer()
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState.selectedCell) return

      const num = Number.parseInt(e.key)
      if (num >= 1 && num <= 9) {
        handleNumberInput(num)
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleNumberInput(null)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [gameState.selectedCell])

  // Auto-solve function
  const autoSolve = () => {
    setGameState((prev) => ({
      ...prev,
      userGrid: prev.solution.map((row) => [...row]),
      conflicts: new Set(),
      isComplete: true,
      selectedCell: null,
    }))
    stopTimer()
  }

  // Check solution
  const checkSolution = () => {
    const conflicts = findConflicts(gameState.userGrid)
    const isComplete = checkComplete(gameState.userGrid)

    setGameState((prev) => ({
      ...prev,
      conflicts,
      isComplete: isComplete && conflicts.size === 0,
    }))

    if (isComplete && conflicts.size === 0) {
      stopTimer()
    }
  }

  // Reset puzzle
  const resetPuzzle = () => {
    setGameState((prev) => ({
      ...prev,
      userGrid: prev.puzzle.map((row) => [...row]),
      conflicts: new Set(),
      isComplete: false,
      selectedCell: null,
    }))
    setMistakeCount(0)
    setHintsUsed(0)
    setElapsedTime(0)
    stopTimer()
    startTimer()
  }

  const handleHint = () => {
    const emptyCells: Array<[number, number]> = []

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.puzzle[row][col] === null && gameState.userGrid[row][col] === null) {
          emptyCells.push([row, col])
        }
      }
    }

    if (emptyCells.length === 0) return

    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const value = gameState.solution[row][col]
    const newUserGrid = gameState.userGrid.map((r) => [...r])
    newUserGrid[row][col] = value

    const conflicts = findConflicts(newUserGrid)
    const isComplete = checkComplete(newUserGrid) && conflicts.size === 0

    setGameState((prev) => ({
      ...prev,
      userGrid: newUserGrid,
      conflicts,
      isComplete,
      selectedCell: [row, col],
    }))
    setHintsUsed((prev) => prev + 1)

    if (isComplete) {
      stopTimer()
    }
  }

  const cellsRemaining = useMemo(() => {
    return gameState.userGrid.reduce((acc, row) => acc + row.filter((cell) => cell === null).length, 0)
  }, [gameState.userGrid])

  const completionPercentage = useMemo(() => {
    return Math.round(((81 - cellsRemaining) / 81) * 100)
  }, [cellsRemaining])

  const canUseHint = useMemo(() => {
    return cellsRemaining > 0 && !gameState.isComplete && !isGenerating
  }, [cellsRemaining, gameState.isComplete, isGenerating])

  const timerStatusLabel = useMemo(() => {
    if (gameState.isComplete) return "Completed"
    return isTimerRunning ? "Running" : "Paused"
  }, [gameState.isComplete, isTimerRunning])

  const selectedCellValue = useMemo(() => {
    if (!gameState.selectedCell) return null
    const [row, col] = gameState.selectedCell
    return gameState.userGrid[row]?.[col] ?? null
  }, [gameState.selectedCell, gameState.userGrid])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Initialize game
  useEffect(() => {
    generateNewGame(difficulty)
  }, [generateNewGame, difficulty])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  useEffect(() => {
    const savedTheme = (localStorage.getItem("sudoku-theme") as "light" | "dark") || "dark"
    setTheme(savedTheme)
    document.documentElement.classList.toggle("dark", savedTheme === "dark")
  }, [])

  useEffect(() => {
    localStorage.setItem("sudoku-theme", theme)
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".connect-dropdown")) {
        setShowConnectDropdown(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      stopTimer()
    }
  }, [stopTimer])

  const boardBorderClass =
    theme === "dark"
      ? "border-[rgb(var(--sudoku-border-thick-dark))]"
      : "border-[rgb(var(--sudoku-border-thick-light))]"

  const boardWrapperClass = theme === "dark" ? "bg-slate-950/60" : "bg-white/70"

  const getCellClassName = (row: number, col: number) => {
    const isSelected = gameState.selectedCell?.[0] === row && gameState.selectedCell?.[1] === col
    const isGiven = gameState.puzzle[row][col] !== null
    const hasConflict = gameState.conflicts.has(`${row}-${col}`)
    const isComplete = gameState.isComplete
    const cellValue = gameState.userGrid[row]?.[col] ?? null
    const isSameRow = gameState.selectedCell?.[0] === row
    const isSameCol = gameState.selectedCell?.[1] === col
    const isSameBox =
      gameState.selectedCell &&
      Math.floor(gameState.selectedCell[0] / 3) === Math.floor(row / 3) &&
      Math.floor(gameState.selectedCell[1] / 3) === Math.floor(col / 3)
    const isRelated = !isSelected && (isSameRow || isSameCol || isSameBox)
    const isMatchingValue = selectedCellValue !== null && selectedCellValue === cellValue && cellValue !== null

    let className =
      "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center text-base sm:text-lg md:text-xl font-mono cursor-pointer transition-all duration-200 border select-none"

    // Background colors with theme support
    if (hasConflict) {
      className +=
        theme === "dark"
          ? "bg-[rgb(var(--sudoku-cell-conflict-dark))] "
          : "bg-[rgb(var(--sudoku-cell-conflict-light))] "
    } else if (isSelected) {
      className +=
        theme === "dark"
          ? "bg-[rgb(var(--sudoku-cell-selected-dark))] "
          : "bg-[rgb(var(--sudoku-cell-selected-light))] "
    } else if (isGiven) {
      className +=
        theme === "dark" ? "bg-[rgb(var(--sudoku-cell-given-dark))] " : "bg-[rgb(var(--sudoku-cell-given-light))] "
    } else {
      className +=
        theme === "dark"
          ? "bg-[rgb(var(--sudoku-cell-dark))] hover:bg-[rgb(var(--sudoku-cell-hover-dark))] "
          : "bg-[rgb(var(--sudoku-cell-light))] hover:bg-[rgb(var(--sudoku-cell-hover-light))] "
    }

    if (!hasConflict && !isSelected) {
      if (isMatchingValue) {
        className +=
          theme === "dark"
            ? "bg-[rgb(var(--sudoku-cell-match-dark))] ring-2 ring-primary/40 "
            : "bg-[rgb(var(--sudoku-cell-match-light))] ring-2 ring-primary/40 "
      } else if (isRelated) {
        className +=
          theme === "dark"
            ? "bg-[rgb(var(--sudoku-cell-related-dark))] "
            : "bg-[rgb(var(--sudoku-cell-related-light))] "
      }
    }

    // Enhanced text colors for better visibility
    if (isGiven) {
      className += "text-foreground font-bold "
    } else {
      className += "text-foreground font-medium "
    }

    // Borders with theme support
    className +=
      theme === "dark"
        ? "border-[rgb(var(--sudoku-border-thin-dark))] "
        : "border-[rgb(var(--sudoku-border-thin-light))] "

    // Thick borders for 3x3 sections
    const thickBorderColor =
      theme === "dark"
        ? "border-[rgb(var(--sudoku-border-thick-dark))]"
        : "border-[rgb(var(--sudoku-border-thick-light))]"

    if (row % 3 === 0) className += `border-t-2 ${thickBorderColor} `
    if (col % 3 === 0) className += `border-l-2 ${thickBorderColor} `
    if (row === 8) className += `border-b-2 ${thickBorderColor} `
    if (col === 8) className += `border-r-2 ${thickBorderColor} `

    // Completion effect
    if (isComplete) {
      className += "animate-pulse "
    }

    return className
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 py-12 sm:py-16 transition-colors duration-500 ${
        theme === "dark"
          ? "bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_rgba(15,23,42,0.96))]"
          : "bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.2),_rgba(248,250,252,0.98))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute left-1/2 top-[-140px] h-80 w-80 -translate-x-1/2 rounded-full blur-3xl opacity-60 ${
            theme === "dark" ? "bg-primary/40" : "bg-primary/25"
          }`}
        />
        <div
          className={`absolute bottom-[-160px] right-[-80px] h-96 w-96 rounded-full blur-3xl opacity-40 ${
            theme === "dark" ? "bg-emerald-500/30" : "bg-sky-300/30"
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-3xl border border-border/40 bg-card/70 p-6 shadow-xl backdrop-blur sm:p-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 text-center md:text-left">
            
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
              Sudoku Studio
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
            <div className="relative connect-dropdown">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConnectDropdown((prev) => !prev)}
                className="shadow-md"
              >
                Connect
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              {showConnectDropdown && (
                <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-border/60 bg-card/95 p-1 shadow-2xl backdrop-blur animate-slide-down">
                  <a
                    href="https://www.linkedin.com/in/anurrraggg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit LinkedIn profile"
                    className="block"
                    onClick={() => setShowConnectDropdown(false)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start px-3 py-2 text-sm ${
                        theme === "dark"
                          ? "hover:bg-blue-900/50 hover:text-blue-100"
                          : "hover:bg-blue-100 hover:text-blue-800"
                      }`}
                    >
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </Button>
                  </a>
                  <a
                    href="https://github.com/anurrraggg"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit GitHub profile"
                    className="block"
                    onClick={() => setShowConnectDropdown(false)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start px-3 py-2 text-sm ${
                        theme === "dark"
                          ? "hover:bg-slate-800/60 hover:text-white"
                          : "hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  </a>
                  <a
                    href="https://x.com/anurrraggg"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visit Twitter/X profile"
                    className="block"
                    onClick={() => setShowConnectDropdown(false)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start px-3 py-2 text-sm ${
                        theme === "dark"
                          ? "hover:bg-slate-900/60 hover:text-white"
                          : "hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      X (Twitter)
                    </Button>
                  </a>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full border-border/70 bg-background/60 shadow-md backdrop-blur"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
          <Card className="border-border/60 bg-card/80 shadow-2xl backdrop-blur">
            <CardHeader className="gap-5 pb-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-xl font-semibold">Daily challenge</CardTitle>
                <Badge variant="secondary" className="capitalize">
                  {difficulty}
                </Badge>
              </div>
              <CardDescription>
                Pick a difficulty, immerse yourself in the flow, and enjoy responsive feedback every step of the way.
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diff) => (
                  <Button
                    key={diff}
                    variant={difficulty === diff ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty(diff)}
                    disabled={isGenerating}
                    className="capitalize"
                  >
                    {diff}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-center">
                <div className={`relative min-w-[18rem] rounded-3xl border border-border/50 ${boardWrapperClass} p-3 shadow-inner sm:min-w-[22rem] md:min-w-[26rem]`}>
                  {isGenerating ? (
                    <div className="flex h-[18rem] items-center justify-center sm:h-[22rem] md:h-[26rem]">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-9 gap-0 overflow-hidden rounded-2xl border-2 ${boardBorderClass} bg-background/20 shadow-inner`}
                    >
                      {gameState.userGrid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={getCellClassName(rowIndex, colIndex)}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                          >
                            {cell || ""}
                          </div>
                        )),
                      )}
                    </div>
                  )}
                </div>
              </div>

              {gameState.selectedCell ? (
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleNumberInput(num)}
                      className="h-10 w-full font-mono font-semibold"
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNumberInput(null)}
                    className="h-10 w-full font-semibold"
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">Tap an empty tile to open the number palette.</p>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => generateNewGame(difficulty)} disabled={isGenerating} variant="outline" size="sm">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Game
                </Button>
                <Button onClick={checkSolution} variant="outline" size="sm" disabled={isGenerating}>
                  <Check className="mr-2 h-4 w-4" />
                  Check
                </Button>
                <Button onClick={handleHint} variant="outline" size="sm" disabled={!canUseHint}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Hint
                </Button>
                <Button onClick={autoSolve} variant="outline" size="sm" disabled={isGenerating}>
                  <Zap className="mr-2 h-4 w-4" />
                  Solve
                </Button>
                <Button onClick={resetPuzzle} variant="outline" size="sm" disabled={isGenerating}>
                  Reset
                </Button>
                <Button
                  onClick={toggleTimer}
                  variant="outline"
                  size="sm"
                  disabled={isGenerating || gameState.isComplete}
                >
                  {isTimerRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isTimerRunning ? "Pause" : "Resume"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/60 p-4 text-center shadow-inner">
                <p className="text-sm text-muted-foreground">Progress</p>
                <div className="mt-2 text-3xl font-bold">{completionPercentage}%</div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {cellsRemaining === 0 ? "Board complete. Great job!" : `${cellsRemaining} cells remaining`}
                </p>
              </div>

              {gameState.isComplete && (
                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center shadow-lg">
                  <h2 className="text-2xl font-bold text-primary">🎉 Congratulations!</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You solved this board in {formatTime(elapsedTime)} with {mistakeCount} mistake
                    {mistakeCount === 1 ? "" : "s"} and {hintsUsed} hint{hintsUsed === 1 ? "" : "s"}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Session stats</CardTitle>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    Live
                  </Badge>
                </div>
                <CardDescription>Keep an eye on your rhythm and course-correct quickly.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 pt-6">
                <div className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    Time
                  </div>
                  <div className="mt-2 text-2xl font-bold">{formatTime(elapsedTime)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{timerStatusLabel}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Mistakes
                  </div>
                  <div className="mt-2 text-2xl font-bold">{mistakeCount}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Try to stay under 3 for a perfect run.</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Hints
                  </div>
                  <div className="mt-2 text-2xl font-bold">{hintsUsed}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hintsUsed === 0 ? "Clean solve in progress." : "Hints used to keep momentum."}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Grid3x3 className="h-4 w-4 text-primary" />
                    Cells left
                  </div>
                  <div className="mt-2 text-2xl font-bold">{cellsRemaining}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Fill the board to hit 100% completion.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-semibold">Quick tips</CardTitle>
                <CardDescription>Make faster deductions with these pro moves.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
                <p>- Trace the highlighted row, column, and box to eliminate options quickly.</p>
                <p>- Tap any filled tile to spotlight identical numbers across the board.</p>
                <p>- Use hints sparingly - each hint reveals a guaranteed correct value.</p>
                <p>- Pause the run anytime to take a breather; your progress stays intact.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-20">
        <Button
          size="sm"
          onClick={() => setShowPaymentDialog(true)}
          className="bg-[rgb(var(--coffee-button))] text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-[rgb(var(--coffee-button))]/90 hover:shadow-2xl"
        >
          <Coffee className="mr-2 h-4 w-4" />
          Buy Me a Coffee
        </Button>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>Select how you'd like to support me.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button
              onClick={() => {
                window.open("https://buymeacoffee.com/anurrraggg", "_blank", "noopener,noreferrer")
                setShowPaymentDialog(false)
              }}
              className="w-full justify-start py-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Card Payment</span>
                  <span className="text-xs text-muted-foreground">Pay via Buy Me a Coffee</span>
                </div>
              </div>
            </Button>
            <Button
              onClick={() => {
                window.open("upi://pay?pa=7268955274@ptsbi&pn=Anurag%20Pandey&cu=INR", "_blank", "noopener,noreferrer")
                setShowPaymentDialog(false)
              }}
              className="w-full justify-start py-4"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">UPI Payment</span>
                  <span className="text-xs text-muted-foreground">Pay directly via UPI app</span>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
