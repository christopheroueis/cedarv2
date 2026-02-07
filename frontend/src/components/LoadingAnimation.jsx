import React, { useState, useEffect } from 'react'
import { TrendingUp, Cloud, AlertTriangle, Users, CheckCircle2 } from 'lucide-react'
import LogoAnimation from './LogoAnimation'

const metrics = [
    {
        icon: TrendingUp,
        text: 'Analyzing economic indicators...',
        color: '#2D5F3F', // Forest Green
        duration: 2000
    },
    {
        icon: Cloud,
        text: 'Fetching climate patterns...',
        color: '#4CAF50', // Green
        duration: 2000
    },
    {
        icon: AlertTriangle,
        text: 'Assessing conflict risk...',
        color: '#F59E0B', // Amber
        duration: 2000
    },
    {
        icon: Users,
        text: 'Loading social metrics...',
        color: '#795548', // Brown
        duration: 1500
    }
]

export default function LoadingAnimation({ onComplete, minimumDuration = 5000 }) {
    const [currentMetric, setCurrentMetric] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        const startTime = Date.now()
        let metricIndex = 0
        let progressValue = 0

        // Metric cycling
        const metricInterval = setInterval(() => {
            if (metricIndex < metrics.length - 1) {
                metricIndex++
                setCurrentMetric(metricIndex)
            }
        }, metrics[0].duration)

        // Progress animation
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime
            progressValue = Math.min((elapsed / minimumDuration) * 100, 100)
            setProgress(progressValue)

            if (progressValue >= 100) {
                clearInterval(progressInterval)
                clearInterval(metricInterval)
                setIsComplete(true)

                // Small delay before calling onComplete
                setTimeout(() => {
                    onComplete?.()
                }, 500)
            }
        }, 50)

        return () => {
            clearInterval(metricInterval)
            clearInterval(progressInterval)
        }
    }, [minimumDuration, onComplete])

    const CurrentIcon = metrics[currentMetric].icon

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-24 overflow-hidden relative"
            style={{ backgroundColor: '#F5F3ED' }}>

            <div className="relative z-10 w-full max-w-2xl">
                {/* Main Content */}
                <div className="bg-white rounded-3xl p-12 shadow-xl border"
                    style={{ borderColor: '#E5E5E5' }}>
                    {/* Icon Area */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <LogoAnimation size="medium" animation={isComplete ? 'grow' : 'pulse'} />
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                {isComplete ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600 animate-scale-in" />
                                ) : (
                                    <CurrentIcon className="w-6 h-6 animate-pulse" style={{ color: metrics[currentMetric].color }} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Text */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-4 transition-all duration-500" style={{ color: '#2C2C2C' }}>
                            {isComplete ? 'Data Ready!' : metrics[currentMetric].text}
                        </h2>
                        <p style={{ color: '#666666' }}>
                            {isComplete ? 'Preparing your assessment...' : 'Please wait while we gather information'}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E5E5' }}>
                            <div
                                className="h-full transition-all duration-300 ease-out relative"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: metrics[currentMetric].color
                                }}
                            >
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                            </div>
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-sm" style={{ color: '#666666' }}>
                                {Math.round(progress)}%
                            </span>
                            <span className="text-sm" style={{ color: '#666666' }}>
                                {isComplete ? 'Complete' : 'Loading...'}
                            </span>
                        </div>
                    </div>

                    {/* Metric Indicators */}
                    <div className="grid grid-cols-4 gap-4">
                        {metrics.map((metric, index) => {
                            const Icon = metric.icon
                            const isActive = index === currentMetric
                            const isCompleted = index < currentMetric || isComplete

                            return (
                                <div
                                    key={index}
                                    className={`
                                        flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300
                                        ${isActive ? 'bg-gray-50 ring-1 ring-gray-200' : ''}
                                        ${isCompleted && !isActive ? 'opacity-50' : ''}
                                    `}
                                >
                                    {isCompleted && !isActive ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <Icon
                                            className="w-6 h-6 transition-all duration-300"
                                            style={{
                                                color: isActive ? metric.color : '#999999',
                                                transform: isActive ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                        />
                                    )}
                                    <span className="text-xs text-center transition-colors duration-300"
                                        style={{
                                            color: isActive ? '#2C2C2C' : '#999999',
                                            fontWeight: isActive ? 600 : 400
                                        }}>
                                        {metric.text.split(' ')[0]}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes scale-in {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                .animate-scale-in {
                    animation: scale-in 0.5s ease-out;
                }
            `}</style>
        </div>
    )
}
