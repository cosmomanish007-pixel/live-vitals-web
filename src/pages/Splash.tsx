import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Splash = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    navigate(user ? '/new-session' : '/auth');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Pulse rings */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-32 rounded-full bg-primary/10 animate-pulse-ring" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-primary/20 animate-pulse-ring [animation-delay:0.5s]" />
        </div>
        <motion.div
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 border border-primary/40"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Heart className="h-10 w-10 text-primary animate-heartbeat" />
        </motion.div>
      </div>

      <motion.h1
        className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        AURA-STETH AI
      </motion.h1>

      <motion.p
        className="mt-3 text-center text-sm text-muted-foreground sm:text-base"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Intelligent Real-Time Health Monitoring
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-10 w-full max-w-xs"
      >
        <Button
          onClick={handleGetStarted}
          className="w-full h-12 text-base font-semibold rounded-xl"
          size="lg"
        >
          Get Started
        </Button>
      </motion.div>
    </div>
  );
};

export default Splash;
