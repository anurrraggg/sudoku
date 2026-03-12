import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { loadStats, ACHIEVEMENTS, PlayerStats } from "@/lib/player-stats"
import { Button } from "@/components/ui/button"
import { BarChart3, Trophy, Flame, Award } from "lucide-react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function StatsModal() {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<PlayerStats | null>(null)

  useEffect(() => {
    if (open) {
      setStats(loadStats())
    }
  }, [open])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--"
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!stats && open) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shadow-sm hover:shadow-md bg-background/50 backdrop-blur-md border-border/80 mr-2 rounded-xl"
          title="Player Statistics"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 bg-muted/40 border-b border-border/30">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Player Profile
          </DialogTitle>
        </DialogHeader>

        {stats && (
          <div className="p-6 flex flex-col gap-8 max-h-[80vh] overflow-y-auto">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-background/80 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Played</span>
                <span className="text-2xl font-mono font-bold text-foreground">{stats.gamesPlayed}</span>
              </div>
              <div className="bg-background/80 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Won</span>
                <span className="text-2xl font-mono font-bold text-green-500">{stats.gamesWon}</span>
              </div>
              <div className="bg-background/80 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" /> Current
                </span>
                <span className="text-2xl font-mono font-bold text-foreground">{stats.currentStreak}</span>
              </div>
              <div className="bg-background/80 border border-border/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Best Streak</span>
                <span className="text-2xl font-mono font-bold text-foreground">{stats.bestStreak}</span>
              </div>
            </div>

            {/* Best Times */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                ⏱️ Personal Records
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border border-border/20">
                  <span className="text-xs font-semibold mb-1 text-primary">Easy</span>
                  <span className="font-mono font-medium">{formatTime(stats.bestTimes.easy)}</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border border-border/20">
                  <span className="text-xs font-semibold mb-1 text-primary">Medium</span>
                  <span className="font-mono font-medium">{formatTime(stats.bestTimes.medium)}</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted/30 rounded-xl border border-border/20">
                  <span className="text-xs font-semibold mb-1 text-primary">Hard</span>
                  <span className="font-mono font-medium">{formatTime(stats.bestTimes.hard)}</span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" /> Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(ACHIEVEMENTS).map(achv => {
                  const isUnlocked = stats.achievements.includes(achv.id)
                  return (
                    <div 
                      key={achv.id} 
                      className={`flex items-start gap-4 p-3 rounded-2xl border transition-all duration-300 ${
                        isUnlocked 
                        ? 'bg-primary/5 border-primary/20 shadow-sm opacity-100' 
                        : 'bg-muted/20 border-border/10 opacity-50 grayscale'
                      }`}
                    >
                      <div className="text-3xl mt-1 select-none">{achv.icon}</div>
                      <div className="flex flex-col">
                        <span className={`font-bold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {achv.name}
                        </span>
                        <span className="text-xs text-muted-foreground leading-snug mt-0.5">
                          {achv.description}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
