import { Difficulty } from "./sudoku-logic";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_win: { id: "first_win", name: "First Steps", description: "Solve your first Sudoku puzzle.", icon: "🌱" },
  speed_demon: { id: "speed_demon", name: "Speed Demon", description: "Solve a Medium puzzle in under 3 minutes.", icon: "⚡" },
  flawless: { id: "flawless", name: "Flawless Victory", description: "Solve any puzzle with 0 mistakes.", icon: "🎯" },
  no_help: { id: "no_help", name: "Untouchable", description: "Solve a Hard puzzle with 0 hints.", icon: "🧠" },
  streak_3: { id: "streak_3", name: "On Fire", description: "Achieve a 3-win streak.", icon: "🔥" },
  streak_10: { id: "streak_10", name: "Sudoku Master", description: "Achieve a 10-win streak.", icon: "👑" },
};

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  bestTimes: Record<Difficulty, number | null>;
  achievements: string[]; // array of unlocked achievement IDs
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestTimes: {
    easy: null,
    medium: null,
    hard: null,
  },
  achievements: [],
};

const STORAGE_KEY = "sudoku-player-stats";

export function loadStats(): PlayerStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: PlayerStats) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export interface GameResult {
  difficulty: Difficulty;
  time: number;
  mistakes: number;
  hints: number;
  isWin: boolean;
}

// Returns newly unlocked achievements
export function recordGameResult(result: GameResult): { newAchievements: Achievement[], stats: PlayerStats } {
  const stats = loadStats();
  
  stats.gamesPlayed += 1;
  const newAchievements: Achievement[] = [];

  if (result.isWin) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }

    // Update best time
    const currentBest = stats.bestTimes[result.difficulty];
    if (currentBest === null || result.time < currentBest) {
      stats.bestTimes[result.difficulty] = result.time;
    }

    // Check Achievements
    const checkAward = (id: string, condition: boolean) => {
      if (condition && !stats.achievements.includes(id)) {
        stats.achievements.push(id);
        newAchievements.push(ACHIEVEMENTS[id]);
      }
    };

    checkAward("first_win", true);
    checkAward("speed_demon", result.difficulty === "medium" && result.time < 180);
    checkAward("flawless", result.mistakes === 0);
    checkAward("no_help", result.difficulty === "hard" && result.hints === 0);
    checkAward("streak_3", stats.currentStreak >= 3);
    checkAward("streak_10", stats.currentStreak >= 10);

  } else {
    // Loss (gave up / new game overrides)
    stats.currentStreak = 0;
  }

  saveStats(stats);
  return { newAchievements, stats };
}
