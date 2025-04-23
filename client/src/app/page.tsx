"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, ArrowRight, Info, Check, CreditCard, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API = process.env.NEXT_PUBLIC_API_URL
const EXPIRATION_OPTIONS = [
  { label: "15m", value: "900" },
  { label: "1h", value: "3600" },
  { label: "24h", value: "86400" },
  { label: "Never", value: "0" }
]
const INFO_CARDS: Array<{
  title: string;
  value: string;
  description: string;
  icon: 'litecoin' | 'check' | 'clock';
}> = [
  {
    title: "Network Fee",
    value: "~0.001 LTC",
    description: "Average transaction fee",
    icon: "litecoin",
  },
  {
    title: "Confirmations",
    value: "2 required",
    description: "For payment verification",
    icon: "check",
  },
  {
    title: "Processing",
    value: "~2.5 min",
    description: "Average confirmation time",
    icon: "clock",
  }
]

// Components
const LitecoinIcon = ({ className = "h-6 w-6" }) => (
  <svg
    viewBox="0 0 82.6 82.6"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="41.3" cy="41.3" r="36.83" style={{ fill: "#000" }} />
    <path
      d="M41.3,0A41.3,41.3,0,1,0,82.6,41.3h0A41.18,41.18,0,0,0,41.54,0ZM42,42.7,37.7,57.2h23a1.16,1.16,0,0,1,1.2,1.12v.38l-2,6.9a1.49,1.49,0,0,1-1.5,1.1H23.2l5.9-20.1-6.6,2L24,44l6.6-2,8.3-28.2a1.51,1.51,0,0,1,1.5-1.1h8.9a1.16,1.16,0,0,1,1.2,1.12v.38L43.5,38l6.6-2-1.4,4.8Z"
      style={{ fill: "#14b8a6" }}
    />
  </svg>
)

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="relative group ml-2">
    <Info className="h-4 w-4 text-gray-400" />
    <motion.div
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/80 backdrop-blur-sm text-gray-300 text-xs p-2 rounded-lg shadow-lg w-48 z-10 border border-white/5"
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {text}
    </motion.div>
  </div>
)

const BackgroundDecoration = () => (
  <div className="fixed inset-0 pointer-events-none">
    {/* Pure black base */}
    <div className="absolute inset-0 bg-black"></div>

    {/* Subtle gradient noise texture */}
    <div className="absolute inset-0 opacity-[0.07]">
      <svg width="100%" height="100%">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>

    {/* Clean dot matrix pattern */}
    <div className="absolute inset-0">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      ></div>
    </div>

    {/* Geometric accent elements */}
    <div className="absolute inset-0">
      {/* Top right accent */}
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.12]"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="49" stroke="#14b8a6" strokeWidth="0.5" fill="none" />
          <circle cx="50" cy="50" r="40" stroke="#14b8a6" strokeWidth="0.2" fill="none" />
          <line x1="1" y1="50" x2="99" y2="50" stroke="#14b8a6" strokeWidth="0.2" />
          <line x1="50" y1="1" x2="50" y2="99" stroke="#14b8a6" strokeWidth="0.2" />
        </svg>
      </motion.div>

      {/* Bottom left accent */}
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] opacity-[0.08]">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <rect x="10" y="10" width="80" height="80" stroke="#14b8a6" strokeWidth="0.5" fill="none" />
          <rect x="25" y="25" width="50" height="50" stroke="#14b8a6" strokeWidth="0.3" fill="none" />
          <rect x="40" y="40" width="20" height="20" stroke="#14b8a6" strokeWidth="0.2" fill="none" />
        </svg>
      </div>
    </div>

    {/* Minimal gradient accent */}
    <div
      className="absolute top-0 right-0 w-[50%] h-[40%] opacity-10"
      style={{
        background: 'radial-gradient(circle at top right, rgba(20, 184, 166, 0.4), transparent 70%)',
        filter: 'blur(60px)'
      }}
    ></div>

    <div
      className="absolute bottom-0 left-0 w-[40%] h-[30%] opacity-5"
      style={{
        background: 'radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.4), transparent 70%)',
        filter: 'blur(50px)'
      }}
    ></div>

    {/* Single horizontal scan line */}
    <motion.div
      className="absolute left-0 right-0 h-[40px] bg-gradient-to-b from-transparent via-teal-500/3 to-transparent"
      initial={{ top: "-10%" }}
      animate={{ top: "110%" }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      }}
    ></motion.div>
  </div>
)

interface InfoCardProps {
  title: string;
  value: string;
  description: string;
  icon: 'litecoin' | 'check' | 'clock';
}

const InfoCard = ({ title, value, description, icon }: InfoCardProps) => (
  <motion.div
    className="bg-black/30 backdrop-blur-md rounded-xl border border-white/5 p-4 shadow-lg"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    whileHover={{
      y: -5,
      border: "1px solid rgba(20, 184, 166, 0.2)"
    }}
  >
    <div className="bg-black/60 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-3 border border-white/5">
      {icon === 'litecoin' ? <LitecoinIcon className="h-6 w-6" /> :
        icon === 'check' ? <Check className="h-6 w-6 text-teal-500" /> :
          <Clock className="h-6 w-6 text-gray-400" />}
    </div>
    <p className="text-xs text-gray-400 mb-1">{title}</p>
    <p className="text-sm font-medium text-white mb-1">{value}</p>
    <p className="text-xs text-gray-500">{description}</p>
  </motion.div>
)

interface SubmitButtonProps {
  formState: 'idle' | 'loading' | 'success' | 'error';
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const SubmitButton = ({ formState, handleSubmit }: SubmitButtonProps) => (
  <AnimatePresence mode="wait">
    {formState === 'idle' && (
      <motion.button
        key="submit"
        type="submit"
        className="relative w-full py-3 px-4 bg-teal-500 text-white font-medium rounded-lg overflow-hidden group disabled:opacity-70"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          Generate Payment Link
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </span>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-500"
          initial={{ x: "100%" }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </motion.button>
    )}

    {formState === 'loading' && (
      <motion.div
        key="loading"
        className="w-full px-6 py-4 bg-teal-500 text-white rounded-lg text-base font-medium flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <motion.div
          className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <span className="ml-3">Processing...</span>
      </motion.div>
    )}

    {formState === 'success' && (
      <motion.div
        key="success"
        className="w-full px-6 py-4 bg-green-500 text-white rounded-lg text-base font-medium flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Check className="h-5 w-5 mr-2" />
        <span>Payment Link Created!</span>
      </motion.div>
    )}

    {formState === 'error' && (
      <motion.div
        key="error"
        className="w-full px-6 py-4 bg-red-500 text-white rounded-lg text-base font-medium flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, x: [0, -5, 5, -5, 5, 0] }}
        transition={{ x: { delay: 0.3, duration: 0.5 } }}
        exit={{ opacity: 0, y: 20 }}
      >
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span>Failed to create payment</span>
      </motion.div>
    )}
  </AnimatePresence>
)

export default function Page() {
  const [amount, setAmount] = useState('')
  const [ttl, setTtl] = useState('3600')
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('loading')

    try {
      const r = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), ttl: Number(ttl) })
      })

      if (!r.ok) {
        throw new Error('Payment creation failed')
      }

      const { id } = await r.json()
      setFormState('success')

      setTimeout(() => {
        router.push(`/${id}`)
      }, 1000)
    } catch {
      setFormState('error')
      setTimeout(() => setFormState('idle'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <BackgroundDecoration />

      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          className="flex items-center justify-center mb-10"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-white text-4xl font-bold mr-8">
            ∠
          </p>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Nantric Pay</h1>
            <p className="text-gray-400 text-sm">A Fast, secure cryptocurrency transaction</p>
          </div>
        </motion.div>

        <motion.div
          className="w-full bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center mb-6">
              <div className="mr-3 p-1.5 bg-teal-500/10 rounded-md border border-teal-500/20">
                <CreditCard className="h-5 w-5 text-teal-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Create New Payment</h2>
            </div>
            <p className="text-gray-400 text-sm pl-11 mb-6">
              Generate a secure Litecoin payment link that auto-expires.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="relative group"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center mb-2">
                LTC Amount
                <InfoTooltip text="Enter the amount in Litecoin that you want to receive" />
              </label>
              <div className="absolute left-3 top-[54px] -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors duration-200">
                <LitecoinIcon className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full pl-10 pr-16 py-3 bg-black/60 border border-white/10 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-gray-500 transition-all"
              />
              <div className="absolute right-3 top-[54px] -translate-y-1/2 text-xs font-medium text-gray-400 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md border border-white/10">
                LTC
              </div>
            </motion.div>

            {/* Expiration Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="relative group"
            >
              <label className="text-sm font-medium text-gray-300 flex items-center mb-2">
                Payment Expiration
                <InfoTooltip text="Specify how long this payment will remain valid before expiring" />
              </label>
              <div className="absolute left-3 top-[54px] -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors duration-200">
                <Clock className="w-5 h-5" />
              </div>
              <input
                type="number"
                placeholder="3600"
                value={ttl}
                onChange={e => setTtl(e.target.value)}
                required
                className="w-full pl-10 pr-20 py-3 bg-black/60 border border-white/10 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-gray-500 transition-all"
              />
              <div className="absolute right-3 top-[54px] -translate-y-1/2 text-xs font-medium text-gray-400 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md border border-white/10">
                seconds
              </div>
            </motion.div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                {EXPIRATION_OPTIONS.map(option => (
                  <motion.button
                    key={option.value}
                    type="button"
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors backdrop-blur-sm ${ttl === option.value
                      ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20'
                      : 'bg-black/60 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    onClick={() => setTtl(option.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="pt-4"
            >
              <SubmitButton formState={formState} handleSubmit={handleSubmit} />
            </motion.div>
          </form>
        </motion.div>

        <motion.div
          className="grid grid-cols-3 gap-4 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {INFO_CARDS.map((item, index) => (
            <InfoCard
              key={index}
              title={item.title}
              value={item.value}
              description={item.description}
              icon={item.icon}
            />
          ))}
        </motion.div>

        <motion.div
          className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></div>
          <span>Network Online</span>
          <span className="mx-2">•</span>
          <span>Processed via the Litecoin network</span>
        </motion.div>
      </div>
    </div>
  )
}