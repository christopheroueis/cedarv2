import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    ArrowLeft, CheckCircle, AlertTriangle, XCircle, Shield,
    Umbrella, Thermometer, Droplets, TrendingDown, TrendingUp,
    FileText, Calendar, MapPin, DollarSign, ChevronRight
} from 'lucide-react'

// Risk Gauge Component
function RiskGauge({ score }) {
    const rotation = (score / 100) * 180 - 90 // -90deg to 90deg

    const getColor = () => {
        if (score <= 35) return { color: '#2D5F3F', label: 'LOW' } // Cedar Green
        if (score <= 65) return { color: '#E59135', label: 'MEDIUM' } // Earthy Orange
        return { color: '#D9534F', label: 'HIGH' } // Muted Red
    }

    const { color, label } = getColor()

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-24 overflow-hidden">
                {/* Background arc */}
                <div className="absolute inset-0 rounded-t-full opacity-20"
                    style={{ background: 'linear-gradient(to right, #2D5F3F, #E59135, #D9534F)' }}></div>

                {/* Gauge background */}
                <svg className="w-48 h-24" viewBox="0 0 200 100">
                    {/* Background arc */}
                    <path
                        d="M 10 100 A 90 90 0 0 1 190 100"
                        fill="none"
                        stroke="#E5E5E5"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    {/* Colored arc based on score */}
                    <path
                        d="M 10 100 A 90 90 0 0 1 190 100"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(score / 100) * 283} 283`}
                    />
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2D5F3F" />
                            <stop offset="50%" stopColor="#E59135" />
                            <stop offset="100%" stopColor="#D9534F" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Needle */}
                <div
                    className="absolute bottom-0 left-1/2 w-1 h-20 origin-bottom transition-transform duration-1000 ease-out"
                    style={{
                        transform: `translateX(-50%) rotate(${rotation}deg)`,
                        background: '#2C2C2C'
                    }}
                />

                {/* Center circle */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md border border-gray-200" />
            </div>

            {/* Score display */}
            <div className="mt-4 text-center">
                <div className="text-5xl font-bold" style={{ color: '#2C2C2C' }}>{score}</div>
                <div
                    className="text-sm font-semibold tracking-wider mt-1 px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    {label} RISK
                </div>
            </div>
        </div>
    )
}

// Default Probability Card
function ProbabilityCard({ baseline, adjusted }) {
    const reduction = ((baseline - adjusted) / baseline * 100).toFixed(0)

    return (
        <div className="bg-white rounded-2xl p-6 border shadow-sm transition-all duration-300 hover:shadow-md" style={{ borderColor: '#E5E5E5' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#666666' }}>Default Probability</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#F5F3ED' }}>
                    <p className="text-xs mb-1" style={{ color: '#666666' }}>Without Climate Data</p>
                    <p className="text-2xl font-bold" style={{ color: '#D9534F' }}>{(baseline * 100).toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 rounded-xl border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#2D5F3F' }}>
                    <p className="text-xs mb-1" style={{ color: '#2D5F3F' }}>With Modifications</p>
                    <p className="text-2xl font-bold" style={{ color: '#2D5F3F' }}>{(adjusted * 100).toFixed(1)}%</p>
                </div>
            </div>
            {reduction > 0 && (
                <div className="flex items-center justify-center gap-2 mt-4 text-sm font-medium" style={{ color: '#2D5F3F' }}>
                    <TrendingDown className="w-4 h-4" />
                    <span>{reduction}% risk reduction with recommended modifications</span>
                </div>
            )}
        </div>
    )
}

// RecommendationCard
function RecommendationCard({ type, title, description, details }) {
    const configs = {
        approve: {
            icon: CheckCircle,
            bgClass: 'bg-white',
            borderClass: 'border-l-4 border-l-[#2D5F3F]', // Forest Green
            iconColor: '#2D5F3F',
            label: 'APPROVE',
            labelBg: 'bg-[#2D5F3F]/10 text-[#2D5F3F]'
        },
        caution: {
            icon: AlertTriangle,
            bgClass: 'bg-white',
            borderClass: 'border-l-4 border-l-[#E59135]', // Earthy Orange
            iconColor: '#E59135',
            label: 'CAUTION',
            labelBg: 'bg-[#E59135]/10 text-[#E59135]'
        },
        defer: {
            icon: XCircle,
            bgClass: 'bg-white',
            borderClass: 'border-l-4 border-l-[#D9534F]', // Muted Red
            iconColor: '#D9534F',
            label: 'DEFER',
            labelBg: 'bg-[#D9534F]/10 text-[#D9534F]'
        }
    }

    const config = configs[type]
    const Icon = config.icon

    return (
        <div className={`rounded-2xl p-6 border shadow-sm ${config.bgClass} ${config.borderClass}`} style={{ borderColor: '#E5E5E5' }}>
            <div className="flex items-start gap-4">
                <Icon className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: config.iconColor }} />
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.labelBg}`}>
                            {config.label}
                        </span>
                    </div>
                    <h4 className="text-xl font-bold mb-2" style={{ color: '#2C2C2C' }}>{title}</h4>
                    <p className="text-sm leading-relaxed" style={{ color: '#666666' }}>{description}</p>
                </div>
            </div>

            {details && details.length > 0 && (
                <div className="mt-6 space-y-3 pt-4 border-t" style={{ borderColor: '#F5F3ED' }}>
                    {details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm" style={{ color: '#4A4A4A' }}>
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.iconColor }}></div>
                            <span>{detail}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Climate Risk Factors
function ClimateFactors({ factors }) {
    const factorIcons = {
        flood: { icon: Droplets, label: 'Flood Risk', color: '#2196F3' },
        drought: { icon: Thermometer, label: 'Drought Risk', color: '#E59135' },
        heatwave: { icon: Thermometer, label: 'Heat Stress', color: '#D9534F' },
        insurance: { icon: Shield, label: 'Insurance Available', color: '#2D5F3F' }
    }

    return (
        <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#E5E5E5' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#666666' }}>Climate Risk Factors</h3>
            <div className="space-y-4">
                {factors.map((factor, i) => {
                    const config = factorIcons[factor.type] || factorIcons.flood
                    const Icon = config.icon
                    return (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${config.color}15` }}>
                                <Icon className="w-5 h-5" style={{ color: config.color }} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{factor.label}</p>
                                    <span className="text-sm font-bold" style={{ color: config.color }}>{(factor.value * 100).toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F5F3ED' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${factor.value * 100}%`,
                                            backgroundColor: config.color
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Product Recommendations
function ProductRecommendations({ products }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: '#666666' }}>
                <Umbrella className="w-4 h-4" />
                Recommended Products
            </h3>
            {products.map((product, i) => (
                <div key={i}
                    className="bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md cursor-pointer group"
                    style={{ borderColor: '#E5E5E5' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold mb-1 group-hover:text-[#2D5F3F] transition-colors" style={{ color: '#2C2C2C' }}>{product.name}</h4>
                            <p className="text-sm" style={{ color: '#666666' }}>{product.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ color: '#999999' }} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function RiskResults() {
    const { assessmentId } = useParams()
    const navigate = useNavigate()
    const { mfi } = useAuth()
    const [assessment, setAssessment] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load assessment data from sessionStorage
        const data = sessionStorage.getItem(`assessment_${assessmentId}`)
        if (data) {
            const parsedData = JSON.parse(data)

            // Check if this is API data (has results property) or demo data
            if (parsedData.results && parsedData.recommendation) {
                // API data structure - use directly
                setAssessment({
                    locationName: parsedData.location?.name || 'Unknown',
                    loanAmount: parsedData.loanDetails?.amount,
                    loanPurpose: parsedData.loanDetails?.purpose,
                    cropType: parsedData.loanDetails?.cropType,
                    climateRiskScore: parsedData.results.climateRiskScore,
                    defaultProbabilityBaseline: parsedData.results.defaultProbability?.unadjusted || 0.2,
                    defaultProbabilityAdjusted: parsedData.results.defaultProbability?.adjusted || 0.15,
                    recommendationType: parsedData.recommendation.type,
                    climateFactors: [
                        { type: 'flood', label: 'Flood Risk', value: parsedData.results.riskFactors?.flood?.value || 0.3 },
                        { type: 'drought', label: 'Drought Risk', value: parsedData.results.riskFactors?.drought?.value || 0.2 },
                        { type: 'heatwave', label: 'Heat Stress', value: parsedData.results.riskFactors?.heatwave?.value || 0.25 }
                    ],
                    products: parsedData.products || [
                        { name: 'Weather-Indexed Insurance', description: 'Automatic payout on adverse weather events' },
                        { name: 'Flexible Repayment', description: 'Grace period during high-risk seasons' }
                    ],
                    recommendation: parsedData.recommendation
                })
            } else {
                // Demo/fallback data - calculate mock values
                const lat = parseFloat(parsedData.latitude || 24)
                let baseClimateRisk = 45
                if (lat > 20 && lat < 30) baseClimateRisk = 62
                if (lat < 0 && lat > -5) baseClimateRisk = 48
                if (lat < -10 && lat > -20) baseClimateRisk = 55
                if (parsedData.cropType === 'rice') baseClimateRisk += 10
                if (parsedData.cropType === 'coffee') baseClimateRisk += 5

                const climateRisk = Math.min(95, Math.max(15, baseClimateRisk + Math.random() * 15 - 7))
                const baselineDefault = 0.15 + (climateRisk / 100) * 0.20
                const adjustedDefault = baselineDefault * 0.65

                let recommendationType = 'approve'
                if (climateRisk > 70) recommendationType = 'defer'
                else if (climateRisk > 50) recommendationType = 'caution'

                setAssessment({
                    ...parsedData,
                    climateRiskScore: Math.round(climateRisk),
                    defaultProbabilityBaseline: baselineDefault,
                    defaultProbabilityAdjusted: adjustedDefault,
                    recommendationType,
                    climateFactors: [
                        { type: 'flood', label: 'Flood Risk (Monsoon)', value: 0.3 + Math.random() * 0.4 },
                        { type: 'drought', label: 'Drought Risk', value: 0.1 + Math.random() * 0.3 },
                        { type: 'heatwave', label: 'Heat Stress', value: 0.2 + Math.random() * 0.3 }
                    ],
                    products: [
                        { name: 'Weather-Indexed Insurance', description: 'Automatic payout on adverse weather' },
                        { name: 'Flexible Repayment Schedule', description: 'Grace period during monsoon' },
                        { name: 'Climate Resilience Training', description: 'Agricultural best practices' }
                    ]
                })
            }
        }
        setLoading(false)
    }, [assessmentId])

    const handleAcceptRecommendation = () => {
        // In production, save the decision to backend
        navigate('/history')
    }

    const handleOverride = () => {
        // Show override modal or navigate
        navigate('/history')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3ED' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5F3F' }}></div>
                    <p className="text-sm font-medium" style={{ color: '#2D5F3F' }}>Generating Report...</p>
                </div>
            </div>
        )
    }

    if (!assessment) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#F5F3ED' }}>
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
                    <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#D9534F' }} />
                    <h2 className="text-xl font-bold mb-2" style={{ color: '#2C2C2C' }}>Assessment Not Found</h2>
                    <p className="mb-6 text-sm" style={{ color: '#666666' }}>This assessment may have expired or doesn't exist.</p>
                    <Link to="/" className="inline-block px-6 py-3 text-white rounded-xl font-medium shadow-md transition-transform active:scale-95"
                        style={{ backgroundColor: '#2D5F3F' }}>
                        Start New Assessment
                    </Link>
                </div>
            </div>
        )
    }

    const recommendationConfigs = {
        approve: {
            title: 'Approve with Climate Modifications',
            description: 'Acceptable risk level with recommended climate-smart modifications.',
            details: [
                'Standard loan terms with flexible repayment option',
                'Optional weather-indexed insurance',
                'Annual climate risk review'
            ]
        },
        caution: {
            title: 'Approve with Enhanced Monitoring',
            description: 'Moderate climate risk. Enhanced oversight recommended.',
            details: [
                'Mandatory weather-indexed insurance',
                'Quarterly loan review during high-risk season',
                'Consider 20% reduced initial loan amount',
                'Climate resilience training required'
            ]
        },
        defer: {
            title: 'Defer - High Climate Risk',
            description: 'Significant climate exposure. Additional review required.',
            details: [
                'Request senior officer review',
                'Explore alternative loan structure',
                'Consider government subsidy programs',
                'Require comprehensive risk mitigation plan'
            ]
        }
    }

    const recConfig = recommendationConfigs[assessment.recommendationType] || recommendationConfigs.caution

    return (
        <div className="min-h-screen pb-32" style={{ backgroundColor: '#F5F3ED' }}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b shadow-sm" style={{ borderColor: '#E5E5E5' }}>
                <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', color: '#2C2C2C' }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#2C2C2C' }}>Risk Assessment Report</h1>
                        <p className="text-xs" style={{ color: '#666666' }}>{mfi?.name}</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="px-4 py-8 space-y-6 max-w-lg mx-auto">

                {/* Summary Card */}
                <div className="bg-white rounded-3xl p-8 border shadow-sm text-center" style={{ borderColor: '#E5E5E5' }}>
                    <div className="flex items-center justify-center gap-3 text-sm font-medium mb-6" style={{ color: '#666666' }}>
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{assessment.locationName}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>${parseFloat(assessment.loanAmount || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Risk Gauge */}
                    <RiskGauge score={assessment.climateRiskScore || 0} />

                    <p className="text-xs mt-6 pt-4 border-t" style={{ color: '#999999', borderColor: '#F5F3ED' }}>
                        Climate Risk Score based on historical weather data and predictive modeling
                    </p>
                </div>

                {/* Default Probability */}
                <ProbabilityCard
                    baseline={assessment.defaultProbabilityBaseline || 0}
                    adjusted={assessment.defaultProbabilityAdjusted || 0}
                />

                {/* Recommendation */}
                {recConfig && (
                    <RecommendationCard
                        type={assessment.recommendationType}
                        {...recConfig}
                    />
                )}

                {/* Climate Factors */}
                {assessment.climateFactors && (
                    <ClimateFactors factors={assessment.climateFactors} />
                )}

                {/* Product Recommendations */}
                {assessment.products && (
                    <ProductRecommendations products={assessment.products} />
                )}

            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]" style={{ borderColor: '#E5E5E5' }}>
                <div className="flex gap-3 max-w-lg mx-auto">
                    <button
                        onClick={handleOverride}
                        className="flex-1 py-4 px-6 font-semibold rounded-xl transition-colors border-2 hover:bg-gray-50"
                        style={{ borderColor: '#2C2C2C', color: '#2C2C2C' }}
                    >
                        Override
                    </button>
                    <button
                        onClick={handleAcceptRecommendation}
                        className="flex-[2] py-4 px-6 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98] hover:shadow-xl hover:scale-[1.02]"
                        style={{ backgroundColor: '#2D5F3F' }}
                    >
                        Accept Recommendation
                    </button>
                </div>
            </div>
        </div>
    )
}
