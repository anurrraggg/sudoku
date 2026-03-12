"use client"

import { useState, useEffect } from "react"
import { useSudoku } from "@/hooks/use-sudoku"
import { Difficulty, DIFFICULTIES } from "@/lib/sudoku-logic"
import { Board } from "./sudoku/board"
import { Controls } from "./sudoku/controls"
import { Numpad } from "./sudoku/numpad"
import { StatsModal } from "./sudoku/stats-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sun, Moon, Play, Pause, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

export default function SudokuGame() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  
  const [showConnectDropdown, setShowConnectDropdown] = useState(false)

  const {
    difficulty,
    setDifficulty,
    puzzle,
    userGrid,
    notes,
    conflicts,
    mistakes,
    selectedCells,
    setSelectedCells,
    notesMode,
    isZenMode,
    setIsZenMode,
    gameMode,
    isGenerating,
    isComplete,
    isPlaying,
    time,
    hints,
    historySize,
    redoSize,
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
  } = useSudoku("medium")

  // Theme toggle
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

  // Handle outside click for Connect Dropdown
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

  // Initialize first game automatically
  useEffect(() => {
    generateGame(difficulty)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty])

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedCells.length === 0 || isGenerating || isComplete || !isPlaying) return

      const num = Number.parseInt(e.key)
      if (num >= 1 && num <= 9) {
        inputNumber(num)
      } else if (e.key === "Backspace" || e.key === "Delete") {
        clearCell()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [selectedCells, inputNumber, clearCell, isGenerating, isComplete, isPlaying])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative min-h-screen pt-4 pb-12 px-2 md:px-6 flex flex-col items-center transition-all duration-700">
      <header className={`w-full max-w-5xl flex justify-between items-center py-6 mb-2 px-4 md:px-0 transition-opacity duration-500 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Sudoku
          </h1>
          
        </motion.div>
        
        <div className="flex items-center gap-3">
          <StatsModal />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsZenMode(true)}
            className="shadow-sm hover:shadow-md bg-background/50 backdrop-blur-md border-border/80 mr-2 rounded-xl"
            title="Focus Mode"
          >
            Zen Mode
          </Button>

          <div className="relative connect-dropdown z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectDropdown((prev) => !prev)}
              className="shadow-sm hover:shadow-md bg-background/50 backdrop-blur-md border-border/80"
            >
              Connect
            </Button>
            {showConnectDropdown && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-border/50 bg-card/95 p-1 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-200">
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
                    className="w-full justify-start px-3 py-2 text-sm hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] dark:hover:bg-[#0A66C2]/20 dark:hover:text-[#4298e1] rounded-xl transition-colors"
                  >
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
                    className="w-full justify-start px-3 py-2 text-sm hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-white rounded-xl transition-colors"
                  >
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
                    className="w-full justify-start px-3 py-2 text-sm hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-white rounded-xl transition-colors"
                  >
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
            className="rounded-full w-10 h-10 shadow-sm hover:shadow-md bg-background/50 backdrop-blur-md border-border/80"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className={`w-full max-w-5xl grid gap-10 lg:gap-14 items-start px-2 md:px-0 transition-all duration-700 ${isZenMode ? 'lg:grid-cols-1 place-items-center mt-10' : 'lg:grid-cols-[1fr_360px]'}`}>
        
        {/* ZEN MODE EXIT BUTTON */}
        {isZenMode && (
          <div className="absolute top-8 left-8 z-50">
            <Button variant="ghost" className="opacity-50 hover:opacity-100" onClick={() => setIsZenMode(false)}>
              Exit Zen Mode
            </Button>
          </div>
        )}

        {/* LEFT COLUMN: BOARD & CONTROLS */}
        <div className="flex flex-col gap-6 w-full items-center">
          <div className={`flex justify-between items-end w-full max-w-[28rem] px-2 mb-1 transition-opacity duration-500 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex gap-6 items-center">
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Mistakes</span>
                 <span className="text-xl font-mono font-medium leading-none tabular-nums text-foreground/90">{mistakes}/3</span>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
              {gameMode === "builder" ? (
                <Button 
                  onClick={validateAndPlayBuilder}
                  disabled={isGenerating}
                  className="rounded-full h-10 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary to-blue-600 text-primary-foreground"
                >
                  Validate & Play
                </Button>
              ) : (
                <>
                  <span className="text-3xl font-mono tracking-wider font-light tabular-nums text-foreground/90">{formatTime(time)}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleTimer} 
                    disabled={isGenerating || isComplete}
                    className="rounded-full h-10 w-10 bg-primary/5 hover:bg-primary/15 text-primary transition-colors"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative w-full flex justify-center">
             {isGenerating ? (
               <div className="w-full max-w-[28rem] aspect-square flex items-center justify-center rounded-xl border-2 border-border/40 bg-card/10 backdrop-blur-sm">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
               </div>
             ) : (
               <Board 
                 puzzle={puzzle}
                 userGrid={userGrid}
                 notes={notes}
                 selectedCells={selectedCells}
                 setSelectedCells={setSelectedCells}
                 conflicts={conflicts}
                 isComplete={isComplete}
               />
             )}

             {!isPlaying && !isComplete && !isGenerating && gameMode !== "builder" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-md rounded-xl max-w-[28rem] mx-auto aspect-square border border-border/20">
                   <Button size="lg" className="rounded-full shadow-2xl px-10 h-14 text-lg font-semibold" onClick={toggleTimer}>
                     <Play className="mr-3 h-5 w-5" fill="currentColor" /> Resume Game
                   </Button>
                </div>
             )}
          </div>

          <div className={`transition-opacity duration-500 w-full flex flex-col items-center gap-6 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Controls 
              notesMode={notesMode}
              toggleNotesMode={toggleNotesMode}
              clearCell={clearCell}
              undo={undo}
              redo={redo}
              useHint={useHint}
              historySize={historySize}
              redoSize={redoSize}
            />

            <Numpad inputNumber={inputNumber} disabled={!isPlaying || isComplete || isGenerating} />
          </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS & STATS */}
        <div className={`flex flex-col gap-6 w-full lg:sticky lg:top-8 mt-8 lg:mt-0 transition-opacity duration-500 ${isZenMode ? 'hidden' : 'opacity-100'}`}>
           <Card className="border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
             <CardHeader className="pb-4 bg-muted/30 border-b border-border/20 px-8 pt-8">
               <CardTitle className="text-xl font-bold">Game Setup</CardTitle>
               <CardDescription className="text-sm mt-1">Select your challenge level</CardDescription>
             </CardHeader>
             <CardContent className="pt-8 px-8 flex flex-col gap-8">
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/40">
                  {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`py-3 px-2 text-sm font-semibold rounded-xl capitalize transition-all duration-300 ${
                        difficulty === diff 
                          ? 'bg-background shadow-md text-foreground border border-border/20' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    className={`w-full rounded-2xl h-14 text-base font-bold shadow-lg active:scale-[0.98] transition-all ${gameMode === "classic" ? 'shadow-primary/20' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    onClick={() => generateGame(difficulty, "classic")}
                    disabled={isGenerating}
                  >
                    Play Classic
                  </Button>
                  <Button 
                    className={`w-full rounded-2xl h-14 text-base font-bold shadow-lg active:scale-[0.98] transition-all bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white ${gameMode === "daily" ? 'ring-2 ring-offset-2 ring-purple-500 ring-offset-background' : ''}`}
                    onClick={() => generateGame("hard", "daily")}
                    disabled={isGenerating}
                  >
                    Daily Challenge
                  </Button>
                  <Button 
                    variant="outline"
                    className={`w-full rounded-2xl h-14 text-base font-bold shadow-sm active:scale-[0.98] transition-all border-border/60 ${gameMode === "builder" ? 'bg-primary/10 text-primary border-primary/30' : 'bg-transparent hover:bg-muted/30'}`}
                    onClick={startBuilderMode}
                    disabled={isGenerating}
                  >
                    Custom Builder
                  </Button>
                  {gameMode !== "builder" && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl h-14 text-base font-semibold active:scale-[0.98] transition-all border-border/60 bg-transparent hover:bg-muted/30 mt-2"
                      onClick={restart}
                      disabled={isGenerating}
                    >
                      <RotateCcw className="mr-2 h-5 w-5" /> Restart Puzzle
                    </Button>
                  )}
                </div>
             </CardContent>
           </Card>

           {isComplete && (
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
             >
               <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-xl rounded-[2rem] overflow-hidden">
                 <CardContent className="pt-8 pb-8 px-8 flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-3xl">🏆</span>
                    </div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Victory!</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      You conquered the {difficulty} puzzle in {formatTime(time)}.
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                      <div className="bg-background border border-border/30 shadow-sm rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Mistakes</span>
                        <span className="text-2xl font-mono font-medium">{mistakes}</span>
                      </div>
                      <div className="bg-background border border-border/30 shadow-sm rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Hints Used</span>
                        <span className="text-2xl font-mono font-medium">{hints}</span>
                      </div>
                    </div>
                 </CardContent>
               </Card>
             </motion.div>
           )}
        </div>
      </main>
    </div>
  )
}
