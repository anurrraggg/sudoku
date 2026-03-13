import { Button } from '@/components/ui/button';
import { RotateCcw, Pencil, Lightbulb, Eraser, Undo, Redo } from 'lucide-react';
import { motion } from 'framer-motion';

interface ControlsProps {
  notesMode: boolean;
  toggleNotesMode: () => void;
  clearCell: () => void;
  undo: () => void;
  redo: () => void;
  useHint: () => void;
  historySize: number;
  redoSize: number;
}

export const Controls = ({
  notesMode,
  toggleNotesMode,
  clearCell,
  undo,
  redo,
  useHint,
  historySize,
  redoSize,
}: ControlsProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="flex justify-between items-center w-full max-w-[28rem] mx-auto gap-2 py-4 px-2"
    >
      <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={undo}>
        <Button 
          variant="secondary" 
          size="icon" 
          disabled={historySize === 0}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-card border border-border/40 group-hover:-translate-y-1 group-active:translate-y-0"
        >
          <Undo className={`w-5 h-5 sm:w-6 sm:h-6 ${historySize === 0 ? 'text-muted-foreground/50' : 'text-foreground/80'}`} />
        </Button>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Undo</span>
      </div>

      <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={clearCell}>
        <Button 
          variant="secondary" 
          size="icon" 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-card border border-border/40 group-hover:-translate-y-1 group-active:translate-y-0"
        >
          <Eraser className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/80" />
        </Button>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Erase</span>
      </div>

      <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={toggleNotesMode}>
        <Button 
          variant={notesMode ? 'default' : 'secondary'}
          size="icon" 
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-border/40 group-hover:-translate-y-1 group-active:translate-y-0 ${notesMode ? 'shadow-primary/30 border-transparent' : 'bg-card'}`}
        >
          <Pencil className={`w-5 h-5 sm:w-6 sm:h-6 ${notesMode ? 'text-primary-foreground' : 'text-foreground/80'}`} />
        </Button>
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${notesMode ? 'text-primary' : 'text-muted-foreground'}`}>Notes {notesMode ? 'On' : 'Off'}</span>
      </div>

      <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={useHint}>
        <Button 
          variant="secondary" 
          size="icon" 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-card border border-border/40 overflow-hidden relative group-hover:-translate-y-1 group-active:translate-y-0"
        >
          <div className="absolute inset-0 bg-amber-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 relative z-10" />
        </Button>
        <span className="text-[11px] font-semibold text-amber-600/90 dark:text-amber-500/90 uppercase tracking-wide">Hint</span>
      </div>
    </motion.div>
  );
};
