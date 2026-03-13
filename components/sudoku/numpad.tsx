import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface NumpadProps {
  inputNumber: (num: number) => void;
  disabled?: boolean;
}

export const Numpad = ({ inputNumber, disabled }: NumpadProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="grid grid-cols-9 gap-1 sm:gap-2 md:gap-3 w-full max-w-[28rem] mx-auto px-1 sm:px-2"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <motion.div key={num} whileTap={disabled ? {} : { scale: 0.9 }}>
          <Button
            variant="outline"
            className="w-full aspect-square text-lg sm:text-2xl md:text-3xl font-light rounded-xl sm:rounded-2xl md:rounded-3xl hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-300 shadow-sm bg-card border-border/60 hover:shadow-md disabled:opacity-50 p-0 min-w-0"
            onClick={() => inputNumber(num)}
            disabled={disabled}
          >
            {num}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
};
