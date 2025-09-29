"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Coffee, RotateCcw, Check, Zap, Sun, Moon, ChevronDown, Linkedin, Github } from "lucide-react"

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
    },
    [generateCompleteGrid, createPuzzle],
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

    const conflicts = findConflicts(newUserGrid)
    const isComplete = checkComplete(newUserGrid) && conflicts.size === 0

    setGameState((prev) => ({
      ...prev,
      userGrid: newUserGrid,
      conflicts,
      isComplete,
    }))
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
  }

  // Initialize game
  useEffect(() => {
    generateNewGame(difficulty)
  }, [])

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

  const getCellClassName = (row: number, col: number) => {
    const isSelected = gameState.selectedCell?.[0] === row && gameState.selectedCell?.[1] === col
    const isGiven = gameState.puzzle[row][col] !== null
    const hasConflict = gameState.conflicts.has(`${row}-${col}`)
    const isComplete = gameState.isComplete

    let className =
      "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-sm sm:text-base md:text-lg font-mono cursor-pointer transition-all duration-200 border "

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

  const handleSocialConnect = (platform: string) => {
    const urls = {
      linkedin: "https://linkedin.com",
      github: "https://github.com",
      twitter: "https://twitter.com",
    }
    window.open(urls[platform as keyof typeof urls], "_blank", "noopener,noreferrer")
    setShowConnectDropdown(false)
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center relative">
      <div className="fixed top-4 right-4 z-10">
        <Button variant="outline" size="sm" onClick={toggleTheme} className="w-10 h-10 p-0 bg-transparent">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-balance bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Sudoku
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">Challenge your mind with this classic puzzle game</p>
      </div>

      {/* Difficulty Selection */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diff) => (
          <Button
            key={diff}
            variant={difficulty === diff ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setDifficulty(diff)
              generateNewGame(diff)
            }}
            disabled={isGenerating}
            className="capitalize"
          >
            {diff}
          </Button>
        ))}
      </div>

      {/* Game Board */}
      <Card className="p-4 sm:p-6 mb-6 bg-card border-border shadow-xl">
        {isGenerating ? (
          <div className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div
            className={`grid grid-cols-9 gap-0 border-2 ${theme === "dark" ? "border-[rgb(var(--sudoku-border-thick-dark))]" : "border-[rgb(var(--sudoku-border-thick-light))]"} rounded-lg overflow-hidden shadow-inner`}
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
      </Card>

      {/* Number Input */}
      {gameState.selectedCell && (
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              size="sm"
              onClick={() => handleNumberInput(num)}
              className="w-8 h-8 p-0 font-mono font-bold"
            >
              {num}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleNumberInput(null)} className="w-8 h-8 p-0">
            ×
          </Button>
        </div>
      )}

      {/* Game Controls */}
      <div className="flex gap-2 mb-8 flex-wrap justify-center">
        <Button onClick={() => generateNewGame(difficulty)} disabled={isGenerating} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
        <Button onClick={checkSolution} variant="outline" size="sm">
          <Check className="w-4 h-4 mr-2" />
          Check
        </Button>
        <Button onClick={autoSolve} variant="outline" size="sm">
          <Zap className="w-4 h-4 mr-2" />
          Solve
        </Button>
        <Button onClick={resetPuzzle} variant="outline" size="sm">
          Reset
        </Button>
      </div>

      {/* Completion Message */}
      {gameState.isComplete && (
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-primary mb-2">🎉 Congratulations!</h2>
          <p className="text-muted-foreground">You've successfully completed the puzzle!</p>
        </div>
      )}

      <div className="mb-4 relative connect-dropdown">
        <Button
          variant="default"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          onClick={() => setShowConnectDropdown(!showConnectDropdown)}
        >
          Connect
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>

        {showConnectDropdown && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[160px] animate-slide-down">
            <a
  href="https://www.linkedin.com/in/anurrraggg/"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Visit LinkedIn profile"
>
  <Button
    variant="ghost"
    size="sm"
    className={`w-full justify-start mb-1 transition-colors duration-150 ${
      theme === "dark"
        ? "hover:bg-blue-800 hover:text-white"
        : "hover:bg-blue-100 hover:text-blue-800"
    }`}
  >
    <Linkedin className="w-4 h-4 mr-2" />
    LinkedIn
  </Button>
</a>

            <a
  href="https://github.com/anurrraggg"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Visit GitHub profile"
>
  <Button
    variant="ghost"
    size="sm"
    className={`w-full justify-start mb-1 transition-colors duration-150 ${
      theme === "dark"
        ? "hover:bg-blue-800 hover:text-white"
        : "hover:bg-blue-100 hover:text-blue-800"
    }`}
  >
    <Github className="w-4 h-4 mr-2" />
    GitHub
  </Button>
</a>

            <a
  href="https://x.com/anurrraggg"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Visit Twitter/X profile"
>
  <Button
    variant="ghost"
    size="sm"
    className={`w-full justify-start mb-1 transition-colors duration-150 ${
      theme === "dark"
        ? "hover:bg-gray-800 hover:text-white"
        : "hover:bg-gray-100 hover:text-black"
    }`}
  >
    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
    X (Twitter)
  </Button>
</a>

          </div>
        )}
      </div>

      {/* Buy Me a Coffee Button */}
      <div className="fixed bottom-4 right-4">
  <Button
    asChild
    size="sm"
    className="bg-[rgb(var(--coffee-button))] hover:bg-[rgb(var(--coffee-button))]/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
  >
    <a
      href="upi://pay?pa=7268955274@ptsbi&pn=Anurag%20Pandey&cu=INR"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2"
    >
      <Coffee className="w-4 h-4" />
      Buy Me a Coffee
    </a>
  </Button>
</div>

    </div>
  )
}
