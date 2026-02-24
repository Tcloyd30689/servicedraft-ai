'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import WaveBackground from '@/components/ui/WaveBackground';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <WaveBackground centerYPercent={0.40} />

      <div className="relative z-30 flex flex-col items-center px-4">
        {/* Logo — dominant visual, enters first */}
        <motion.div
          className="pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo size="large" glow className="max-w-[90vw]" />
        </motion.div>

        {/* Subtitle + buttons — pulled up into logo blank space */}
        <div className="relative z-10 flex flex-col items-center -mt-56">
          {/* Subtitle / tagline — enters second */}
          <motion.p
            className="text-[var(--text-muted)] text-xs sm:text-sm tracking-[0.35em] font-medium text-center uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
          >
            AI-Powered Repair Narrative Generator
          </motion.p>

          {/* Buttons — enter last */}
          <motion.div
            className="flex flex-col items-center gap-4 w-full max-w-xs mt-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1, ease: 'easeOut' }}
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
        </div>
      </div>
    </div>
  );
}
