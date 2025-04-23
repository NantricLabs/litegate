'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Copy, Check, AlertTriangle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const API = process.env.NEXT_PUBLIC_API_URL

const LitecoinIcon = ({ className = "h-6 w-6" }) => (
    <svg
        viewBox="0 0 82.6 82.6"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <circle cx="41.3" cy="41.3" r="36.83" style={{ fill: "#fff" }} />
        <path
            d="M41.3,0A41.3,41.3,0,1,0,82.6,41.3h0A41.18,41.18,0,0,0,41.54,0ZM42,42.7,37.7,57.2h23a1.16,1.16,0,0,1,1.2,1.12v.38l-2,6.9a1.49,1.49,0,0,1-1.5,1.1H23.2l5.9-20.1-6.6,2L24,44l6.6-2,8.3-28.2a1.51,1.51,0,0,1,1.5-1.1h8.9a1.16,1.16,0,0,1,1.2,1.12v.38L43.5,38l6.6-2-1.4,4.8Z"
            style={{ fill: "#14b8a6" }}
        />
    </svg>
)

interface PaymentData {
    id: string | string[];
    amount: string;
    usdAmount: string;
    address: string;
    status: string;
    created_at: string | number | Date;
    expires_at: string | number | Date;
    received: string;
    confirmations: number;
}

export default function Page() {
    const { id } = useParams()
    const [data, setData] = useState<PaymentData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [copied, setCopied] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(0)
    const [refreshPulse, setRefreshPulse] = useState(false)

    const getTimeData = (created_at: string | number | Date, expires_at: string | number | Date) => {
        if (!created_at || !expires_at) {
            console.log('Missing date values:', { created_at, expires_at })
            return {
                remainingMs: 0,
                totalDurationMs: 0,
                expired: true
            }
        }

        // Parse timestamps carefully
        const now = new Date().getTime()

        // Handle different timestamp formats
        let createdTime, expiryTime

        // Handle numeric timestamps
        if (typeof created_at === 'number' && typeof expires_at === 'number') {
            // Check if seconds instead of milliseconds (Unix timestamps)
            if (created_at < 10000000000) {
                createdTime = created_at * 1000
            } else {
                createdTime = created_at
            }

            if (expires_at < 10000000000) {
                expiryTime = expires_at * 1000
            } else {
                expiryTime = expires_at
            }
        } else {
            // String handling
            createdTime = new Date(created_at).getTime()
            expiryTime = new Date(expires_at).getTime()

            // Debug invalid dates
            if (isNaN(createdTime) || isNaN(expiryTime)) {
                console.log('Invalid date parsing:', {
                    created_at,
                    expires_at,
                    createdTime: isNaN(createdTime) ? 'Invalid' : createdTime,
                    expiryTime: isNaN(expiryTime) ? 'Invalid' : expiryTime
                })

                // Fallback for demo/testing - set expiry 15 minutes from now
                if (isNaN(createdTime)) createdTime = now - 300000 // 5 minutes ago
                if (isNaN(expiryTime)) expiryTime = now + 900000   // 15 minutes ahead
            }
        }

        const totalDuration = expiryTime - createdTime
        const remaining = expiryTime - now

        console.log('Time calculation:', {
            now,
            createdTime,
            expiryTime,
            totalDuration,
            remaining,
            remainingFormatted: `${Math.floor(Math.max(0, remaining) / 60000)}:${Math.floor((Math.max(0, remaining) % 60000) / 1000).toString().padStart(2, '0')}`
        })

        return {
            remainingMs: Math.max(0, remaining),
            totalDurationMs: Math.max(1, totalDuration), // Prevent division by zero
            expired: remaining <= 0
        }
    }

    const getStatusDetails = (status: string | null) => {
        if (!status) return {
            color: '#737373',
            bgColor: 'rgba(0, 0, 0, 0.5)',
            label: 'Unknown',
            icon: <AlertTriangle className="h-4 w-4" />
        }

        switch (status.toLowerCase()) {
            case 'pending':
                return {
                    color: '#eab308',
                    bgColor: 'rgba(0, 0, 0, 0.5)',
                    label: 'Pending Payment',
                    icon: <Clock className="h-4 w-4" />
                }
            case 'completed':
                return {
                    color: '#14b8a6',
                    bgColor: 'rgba(0, 0, 0, 0.5)',
                    label: 'Payment Confirmed',
                    icon: <Check className="h-4 w-4" />
                }
            case 'expired':
                return {
                    color: '#ef4444',
                    bgColor: 'rgba(0, 0, 0, 0.5)',
                    label: 'Expired',
                    icon: <AlertTriangle className="h-4 w-4" />
                }
            default:
                return {
                    color: '#737373',
                    bgColor: 'rgba(0, 0, 0, 0.5)',
                    label: status,
                    icon: <AlertTriangle className="h-4 w-4" />
                }
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    useEffect(() => {
        if (!data) return

        const timer = setInterval(() => {
            setLastRefresh(prev => prev + 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [data])

    useEffect(() => {
        if (!id) return

        const load = async () => {
            try {
                // For debugging - check if we're using a test environment
                if (!API || API === 'undefined') {
                    console.warn('API URL is not defined. Using mock data for testing.')

                    // Mock data for testing the UI when API is unavailable
                    const now = new Date()
                    const mockData = {
                        id: id,
                        amount: '0.25',
                        usdAmount: '19.99',
                        address: 'MKL45asdJK23lkj5235lkjfsSADFja',
                        status: 'pending',
                        created_at: new Date(now.getTime() - 300000).toISOString(), // 5 minutes ago
                        expires_at: new Date(now.getTime() + 900000).toISOString(),  // 15 minutes from now
                        received: '0.00',
                        confirmations: 0
                    }

                    console.log('Using mock data:', mockData)
                    setData(mockData)
                    setError(false)
                } else {
                    const r = await fetch(`${API}/payments/${id}`)
                    if (r.ok) {
                        const jsonData = await r.json()
                        console.log('API response:', jsonData)
                        setData(jsonData)
                        setError(false)
                    } else {
                        console.error('API error status:', r.status)
                        setError(true)
                    }
                }

                setRefreshPulse(true)
                setTimeout(() => setRefreshPulse(false), 1000)
                setLastRefresh(0)
            } catch (e) {
                console.error('Error loading data:', e)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        load()

        const t = setInterval(() => {
            load()
        }, 5000)

        return () => clearInterval(t)
    }, [id])

    const timeData = data ? getTimeData(data.created_at, data.expires_at) : {
        remainingMs: 0,
        totalDurationMs: 0,
        expired: true
    }

    const statusDetails = data ? getStatusDetails(data.status) : getStatusDetails(null)

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Modern, minimalist background */}
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

                {/* Subtle horizontal divider */}
                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/10 to-transparent top-1/2 transform -translate-y-1/2"></div>

                {/* Clean vertical divider */}
                <div className="absolute top-[30%] bottom-[30%] w-px bg-gradient-to-b from-transparent via-teal-500/10 to-transparent left-1/2 transform -translate-x-1/2"></div>

                {/* Single horizontal scan line */}
                <motion.div
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent"
                    initial={{ top: "-10%" }}
                    animate={{ top: "110%" }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                ></motion.div>
            </div>

            {/* Content */}
            <div className="max-w-xl w-full mx-auto z-10">
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

                {/* Loading State */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            className="bg-black/30 backdrop-blur-md rounded-xl p-10 border border-white/5 flex flex-col items-center justify-center mb-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="h-12 w-12 border-4 border-teal-500/50 border-t-transparent rounded-full mb-4"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                            <p className="text-gray-300 font-medium">Loading payment details...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error State */}
                <AnimatePresence>
                    {!loading && error && (
                        <motion.div
                            className="bg-black/30 backdrop-blur-md rounded-xl border border-red-500/20 p-6 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-start">
                                <div className="bg-red-500/10 p-3 rounded-lg mr-4">
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-red-500 mb-2">Error Loading Payment</h2>
                                    <p className="text-gray-400 mb-4">We couldn&apos;t load the payment details. Please check the payment ID and try again.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Payment Information */}
                <AnimatePresence>
                    {!loading && !error && data && (
                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <motion.div
                                className="bg-black/30 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden shadow-xl"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {/* Header Section */}
                                <div className="border-b border-white/5 px-6 py-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-white flex items-center">
                                            Payment Status
                                        </h2>
                                        <motion.div
                                            style={{
                                                color: statusDetails.color
                                            }}
                                            className="px-3 py-1 rounded-full text-xs font-medium flex items-center bg-black/60 border border-white/10"
                                        >
                                            <motion.div
                                                className="mr-2 relative"
                                                animate={{
                                                    opacity: data.status === 'pending' ? [0.6, 1, 0.6] : 1
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: data.status === 'pending' ? Infinity : 0
                                                }}
                                            >
                                                {statusDetails.icon}
                                            </motion.div>
                                            <span>{statusDetails.label}</span>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column - Payment Details */}
                                        <div className="space-y-4">
                                            {/* Amount Section */}
                                            <div>
                                                <p className="text-sm font-medium text-gray-400 mb-2">Amount</p>
                                                <div className="flex items-center">
                                                    <LitecoinIcon className="h-5 w-5 mr-2" />
                                                    <p className="text-xl font-semibold text-white">{data.amount} LTC</p>
                                                </div>
                                                <div className="flex flex-col mt-1">
                                                    <p className="text-sm text-gray-500">
                                                        <span className="text-gray-400">Received:</span> {data.received} LTC
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Creation Date */}
                                            <div>
                                                <p className="text-sm font-medium text-gray-400 mb-1">Created</p>
                                                <p className="text-sm text-gray-300">
                                                    {data.created_at && new Date(
                                                        typeof data.created_at === 'number' && data.created_at < 10000000000
                                                            ? data.created_at * 1000  // Convert seconds to milliseconds
                                                            : data.created_at
                                                    ).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: 'numeric',
                                                        second: 'numeric',
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>

                                            {/* Timer Section */}
                                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                                                <div className="flex items-center">
                                                    <div className="relative w-10 h-10 mr-3">
                                                        <svg viewBox="0 0 24 24" className="w-full h-full">
                                                            <circle
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                fill="none"
                                                                stroke="#27272a"
                                                                strokeWidth="2"
                                                            />
                                                            <motion.circle
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                fill="none"
                                                                stroke="#14b8a6"
                                                                strokeWidth="2"
                                                                strokeDasharray={2 * Math.PI * 10}
                                                                strokeDashoffset={(2 * Math.PI * 10) * (1 - (timeData.remainingMs / timeData.totalDurationMs))}
                                                                transform="rotate(-90 12 12)"
                                                                animate={{
                                                                    strokeDashoffset: (2 * Math.PI * 10) * (1 - (timeData.remainingMs / timeData.totalDurationMs))
                                                                }}
                                                                transition={{ duration: 1 }}
                                                            />
                                                        </svg>
                                                        <motion.div
                                                            className="absolute inset-0 flex items-center justify-center text-white text-opacity-80 text-xs font-medium"
                                                            animate={{ opacity: [0.8, 1, 0.8] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                        >
                                                            <Clock className="h-3 w-3" />
                                                        </motion.div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Time Remaining</p>
                                                        <p className="text-sm text-teal-500 font-mono">
                                                            {`${Math.floor(timeData.remainingMs / 60000)}:${Math.floor((timeData.remainingMs % 60000) / 1000).toString().padStart(2, '0')}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Confirmation Progress */}
                                            <motion.div
                                                className="bg-black/60 rounded-lg p-4 border border-white/5 backdrop-blur-sm"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-xs text-gray-400 font-medium">Confirmations</p>
                                                    <span className="text-base font-bold text-white">
                                                        {data.confirmations || 0}<span className="text-xs text-gray-500 ml-1">/2</span>
                                                    </span>
                                                </div>

                                                <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden mb-3 border border-white/5">
                                                    <motion.div
                                                        className="h-full bg-teal-500"
                                                        style={{ width: `${Math.min(100, ((data.confirmations || 0) / 2) * 100)}%` }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, ((data.confirmations || 0) / 2) * 100)}%` }}
                                                        transition={{ delay: 0.6, duration: 0.8 }}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    {[...Array(2)].map((_, i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="flex flex-col items-center"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.7 + (i * 0.1) }}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${i < (data.confirmations || 0) ? 'bg-teal-500' : 'bg-white/20'}`} />
                                                            <span className="text-[10px] mt-1 text-gray-500">
                                                                {i === 0 ? 'Pending' : 'Confirmed'}
                                                            </span>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {(data.confirmations || 0) === 0 && (
                                                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                                                        Waiting for network confirmation...
                                                    </p>
                                                )}
                                            </motion.div>
                                        </div>

                                        {/* Right Column - QR Code and Address */}
                                        <div className='space-y-8'>
                                            <p className="text-sm font-medium text-gray-400 mb-4">Payment Address</p>

                                            <div className="flex flex-col items-center justify-center">
                                                {data.address ? (
                                                    <motion.div
                                                        className="bg-black/80 p-4 border border-white/10 rounded-lg"
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: 0.4 }}
                                                    >
                                                        <div className="relative">
                                                            <QRCodeSVG
                                                                value={`litecoin:${data.address}?amount=${data.amount}`}
                                                                size={150}
                                                                level="M"
                                                                bgColor="#000000"
                                                                fgColor="#14b8a6"
                                                                includeMargin={true}
                                                                className="mx-auto"
                                                            />
                                                            <motion.div
                                                                className="absolute inset-0 bg-gradient-to-br from-transparent to-teal-500/5 pointer-events-none"
                                                                animate={{ opacity: [0.1, 0.2, 0.1] }}
                                                                transition={{ duration: 4, repeat: Infinity }}
                                                            />
                                                            <p className="text-gray-400 text-xs mt-2 text-center">Scan to pay</p>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <p className="text-gray-500 text-center">QR code not available</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative group">
                                                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between border border-white/10 transition-colors duration-200 group-hover:border-teal-500/20">
                                                    <p className="text-gray-300 text-sm font-mono truncate">
                                                        {data.address || "Not available"}
                                                    </p>
                                                    {data.address && (
                                                        <motion.button
                                                            onClick={() => copyToClipboard(data.address)}
                                                            className="text-gray-400 hover:text-teal-500 p-1 transition-colors duration-200"
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            {copied ? <Check className="h-4 w-4 text-teal-500" /> : <Copy className="h-4 w-4" />}
                                                        </motion.button>
                                                    )}
                                                </div>
                                                <motion.div
                                                    className="absolute inset-0 -z-10 rounded-lg opacity-0 bg-teal-500/5 blur-md"
                                                    initial={{ opacity: 0 }}
                                                    whileHover={{ opacity: 0.7 }}
                                                    transition={{ duration: 0.2 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-black/60 border-t border-white/5 px-4 py-3">
                                    <div className="flex items-center text-xs text-gray-400 justify-end">
                                        {!loading && !error && (
                                            <motion.div
                                                className="ml-3 flex items-center text-xs"
                                                animate={{ opacity: refreshPulse ? 1 : 0.7 }}
                                            >
                                                <motion.div
                                                    className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-2"
                                                    animate={{
                                                        scale: refreshPulse ? [1, 1.5, 1] : 1,
                                                        opacity: [0.7, 1, 0.7]
                                                    }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <span>auto-refreshed {lastRefresh}s ago</span>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}