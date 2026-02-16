'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import WaveBackground from '@/components/ui/WaveBackground';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <WaveBackground />

      <motion.div
        className="relative z-30 flex flex-col items-center gap-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          <Logo size="large" glow />
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-4 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link href="/login" className="w-full">
            <Button size="fullWidth">LOGIN</Button>
          </Link>
          <Link href="/signup" className="w-full">
            <Button variant="secondary" size="fullWidth">
              REQUEST ACCESS
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
