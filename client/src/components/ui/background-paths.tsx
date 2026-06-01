import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

function waveDurationSeconds(id: number, position: number): number {
  const seed = (id * 97 + Math.abs(position) * 53) % 130;
  return 20 + seed / 10;
}

/** Original SVG paths variant — slate / white “currentColor” strokes (full-page demo). */
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-slate-950 dark:text-white"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background paths</title>
        {paths.map((pathRow) => (
          <motion.path
            key={pathRow.id}
            d={pathRow.d}
            stroke="currentColor"
            strokeWidth={pathRow.width}
            strokeOpacity={0.1 + pathRow.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.55, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: waveDurationSeconds(pathRow.id, position),
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/** Gold-tinted paths for the Urbanova home hero (dark UI). */
function FloatingGoldPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.45 + i * 0.026,
    baseOpacity: 0.035 + i * 0.018,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full scale-[1.18] translate-y-[-6%] text-[#f2ca50]"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Gold background paths</title>
        {paths.map((pathRow) => (
          <motion.path
            key={pathRow.id}
            d={pathRow.d}
            stroke="currentColor"
            strokeWidth={pathRow.width}
            strokeOpacity={Math.min(pathRow.baseOpacity + 0.06, 0.58)}
            initial={{ pathLength: 0.22, opacity: 0.5 }}
            animate={{
              pathLength: 1,
              opacity: [0.32, 0.62, 0.34],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: waveDurationSeconds(pathRow.id + 12, position),
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Drops both gold path layers behind existing hero markup — Home page only intended use.
 */
export function GoldFloatingPathsBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 isolate z-0 overflow-hidden',
        '[mask-image:linear-gradient(to_bottom,black_0%,black_94%,transparent_100%)]',
        '[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_94%,transparent_100%)]',
        className,
      )}
    >
      <div className="absolute inset-[-7%_-12%_-3%_-12%] opacity-[0.48] blur-[0.45px] sm:opacity-[0.56] md:opacity-[0.62] md:blur-[0.35px]">
        <FloatingGoldPaths position={1} />
        <FloatingGoldPaths position={-1} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-black/72 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_115%_70%_at_50%_18%,rgba(242,202,80,0.07),transparent_58%)]" />
    </div>
  );
}

export function BackgroundPaths({
  title = 'Background Paths',
}: {
  title?: string;
}) {
  const words = title.split(' ');

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 text-center md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-8 text-5xl font-bold tracking-tighter sm:text-7xl md:text-8xl">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="mr-4 inline-block last:mr-0">
                {word.split('').map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay:
                        wordIndex * 0.1 + letterIndex * 0.03,
                      type: 'spring',
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block bg-gradient-to-r from-neutral-900 to-neutral-700/80 bg-clip-text text-transparent dark:from-white dark:to-white/80"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <div
            className="group relative inline-block overflow-hidden rounded-2xl bg-gradient-to-b from-black/10 to-white/10 p-px shadow-lg backdrop-blur-lg transition-shadow duration-300 hover:shadow-xl dark:from-white/10 dark:to-black/10"
          >
            <Button
              variant="ghost"
              className="rounded-[1.15rem] border border-black/10 bg-white/95 px-8 py-6 text-lg font-semibold text-black backdrop-blur-md transition-all duration-300 hover:bg-white/100 hover:shadow-md group-hover:-translate-y-0.5 dark:border-white/10 dark:bg-black/95 dark:text-white dark:hover:bg-black/100 dark:hover:shadow-neutral-800/50"
            >
              <span className="opacity-90 transition-opacity group-hover:opacity-100">
                Discover Excellence
              </span>
              <span
                className="ml-3 opacity-70 transition-all duration-300 group-hover:translate-x-1.5 group-hover:opacity-100"
              >
                →
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function DemoBackgroundPaths() {
  return <BackgroundPaths title="Background Paths" />;
}
