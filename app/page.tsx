'use client'

import Link from 'next/link'
import { motion } from "motion/react"
import { Music2, Mic2, ArrowRight, Play } from "lucide-react"
import { ResonanceLogo } from '@/components/resonance-logo'

const fadeIn = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8 } }
}

// Palette
// Deep Teal    #31696B  — primary
// Dark Plum    #432C4D  — secondary
// Deep Purple  #502952  — accent

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white selection:bg-[#31696B]/30 overflow-x-hidden">
      {/* Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] mesh-gradient-top blur-[60px] rounded-full" />
        <div className="absolute -bottom-[150px] -left-[150px] w-[500px] h-[500px] mesh-gradient-bottom blur-[60px] rounded-full" />
        {/* Mid gradient for depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(ellipse, rgba(49,105,107,0.12) 0%, transparent 70%)' }} />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <section className="px-6 w-full mt-0">
          <div className="max-w-7xl mx-auto text-center relative z-20">

            {/* Logo mark + wordmark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col md:flex-row justify-center items-center gap-4 mb-14"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ResonanceLogo size={56} />
              </motion.div>
              <span className="font-display font-black text-3xl md:text-5xl tracking-[0.2em] uppercase"
                style={{
                  background: 'linear-gradient(90deg,#FFFFFF 0%,#A6A6A6 40%,#31696B 70%,#FFFFFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.2))',
                }}>
                Resonance
              </span>
            </motion.div>

            {/* Hero heading */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
              }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-12 flex flex-col md:flex-row flex-wrap justify-center items-center gap-4 md:gap-8 lg:gap-12 leading-normal"
            >
              {/* Listen — teal */}
              <motion.span variants={fadeIn} className="inline-block pb-2 lg:pb-4"
                style={{
                  background: 'linear-gradient(135deg, #5FAAAD 0%, #31696B 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(49,105,107,0.4))',
                }}>Listen</motion.span>

              <motion.span variants={fadeIn} className="text-[#31696B] opacity-40 hidden md:block pb-2 lg:pb-4">•</motion.span>

              {/* Vibe — white */}
              <motion.span variants={fadeIn} className="inline-block pb-2 lg:pb-4"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))',
                }}>Vibe</motion.span>

              <motion.span variants={fadeIn} className="text-[#2D555E] opacity-40 hidden md:block pb-2 lg:pb-4">•</motion.span>

              {/* Connect — neutral */}
              <motion.span variants={fadeIn} className="inline-block pb-2 lg:pb-4"
                style={{
                  background: 'linear-gradient(135deg, #E4E4E4 0%, #888888 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.15))',
                }}>Connect</motion.span>

              <motion.span variants={fadeIn} className="text-[#FFFFFF] opacity-40 hidden md:block pb-2 lg:pb-4">•</motion.span>

              {/* Enjoy — teal/black gradient */}
              <motion.span variants={fadeIn} className="relative inline-block pb-2 lg:pb-4"
                style={{
                  background: 'linear-gradient(135deg, #31696B 0%, #1A3638 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(49,105,107,0.6))',
                }}>
                Enjoy
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
                  className="absolute top-0 -right-12 w-8 h-8 opacity-80"
                >
                  <Music2 className="w-full h-full" style={{ color: '#31696B' }} />
                </motion.div>
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto text-sm md:text-lg mb-10 font-medium leading-relaxed"
              style={{ color: '#8AACB0' }}
            >
              Where artists and fans resonate worldwide — secure, seamless, and built for what&apos;s next.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth/login"
                className="w-full sm:w-auto px-8 py-4 text-white rounded-lg font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #31696B 0%, #1A3638 100%)',
                  boxShadow: '0 4px 20px rgba(49,105,107,0.4)',
                }}>
                Sign In <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(49,105,107,0.08)',
                  border: '1px solid rgba(49,105,107,0.3)',
                  color: '#E4F1F1',
                }}>
                Register <Play className="w-4 h-4 fill-current" />
              </Link>
            </motion.div>
          </div>

          {/* Floating decorations */}
          <motion.div
            animate={{ y: [-15, 15, -15], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-[20%] right-[15%] w-24 h-24 rounded-3xl rotate-12 border hidden lg:flex items-center justify-center z-10"
            style={{
              background: 'rgba(49,105,107,0.06)',
              borderColor: 'rgba(49,105,107,0.25)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 0 30px -5px rgba(49,105,107,0.3)',
            }}
          >
            <Music2 className="w-8 h-8 opacity-70" style={{ color: '#31696B' }} />
          </motion.div>

          <motion.div
            animate={{ y: [15, -15, 15], rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] left-[15%] w-20 h-20 rounded-full border hidden lg:flex items-center justify-center z-10"
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 0 30px -5px rgba(255,255,255,0.1)',
            }}
          >
            <Mic2 className="w-8 h-8 opacity-70" style={{ color: '#FFFFFF' }} />
          </motion.div>
        </section>
      </main>
    </div>
  )
}
