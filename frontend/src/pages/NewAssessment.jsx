import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { assessmentsAPI } from '../services/api'
import {
    MapPin, DollarSign, Briefcase, Wheat, User, FileCheck,
    ChevronDown, Navigation, Menu, LogOut, History as HistoryIcon,
    LayoutDashboard, Loader2, AlertCircle, Mic, MicOff, Square,
    Sparkles, PenLine, Check, X, Edit2, ChevronLeft, BarChart3
} from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import LocationDetection from '../components/LocationDetection'
import LoadingAnimation from '../components/LoadingAnimation'
import LogoAnimation from '../components/LogoAnimation'
import { formatLocationForBackend } from '../services/locationService'

// API base URL
const API_BASE = 'http://localhost:3001'

export default function NewAssessment() {
    const { user, mfi, logout } = useAuth()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [gpsLoading, setGpsLoading] = useState(false)

    // Multi-step flow state
    const [step, setStep] = useState('mode-select') // 'mode-select' | 'location-detect' | 'loading' | 'manual-form' | 'recording' | 'review'
    const [entryMode, setEntryMode] = useState(null) // 'manual' | 'ai'

    // Location state
    const [location, setLocation] = useState(null)

    // Recording state
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const recognitionRef = useRef(null)

    // AI extraction state
    const [extracting, setExtracting] = useState(false)
    const [extractedData, setExtractedData] = useState(null)
    const [confidence, setConfidence] = useState({})
    const [extractionError, setExtractionError] = useState('')

    const [formData, setFormData] = useState({
        latitude: '',
        longitude: '',
        locationName: '',
        loanAmount: '',
        loanPurpose: '',
        cropType: '',
        clientAge: '',
        clientName: '',
        existingLoans: '0',
        repaymentHistory: '95',
        monthlyIncome: ''
    })

    const loanPurposes = [
        { id: 'agriculture', name: 'Agriculture', icon: '🌾' },
        { id: 'livestock', name: 'Livestock', icon: '🐄' },
        { id: 'small_business', name: 'Small Business', icon: '🏪' },
        { id: 'housing', name: 'Housing', icon: '🏠' }
    ]

    const cropTypes = [
        { id: 'rice', name: 'Rice' },
        { id: 'wheat', name: 'Wheat' },
        { id: 'maize', name: 'Maize/Corn' },
        { id: 'coffee', name: 'Coffee' },
        { id: 'tea', name: 'Tea' },
        { id: 'sugarcane', name: 'Sugarcane' },
        { id: 'vegetables', name: 'Mixed Vegetables' },
        { id: 'fruits', name: 'Fruits' },
        { id: 'cotton', name: 'Cotton' },
        { id: 'other', name: 'Other' }
    ]

    const demoLocations = {
        'bangladesh-mfi': { lat: 24.8949, lng: 91.8687, name: 'Sylhet, Bangladesh' },
        'kenya-mfi': { lat: -0.4167, lng: 36.9500, name: 'Nyeri, Kenya' },
        'peru-mfi': { lat: -13.5319, lng: -71.9675, name: 'Cusco, Peru' }
    }

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = 'en-US'

            recognitionRef.current.onresult = (event) => {
                let interim = ''
                let final = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (result.isFinal) {
                        final += result[0].transcript + ' '
                    } else {
                        interim += result[0].transcript
                    }
                }
                if (final) {
                    setTranscript(prev => prev + final)
                }
                setInterimTranscript(interim)
            }

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error)
                if (event.error === 'not-allowed') {
                    setExtractionError('Microphone access denied. Please allow microphone access.')
                }
            }

            recognitionRef.current.onend = () => {
                if (isRecording) {
                    recognitionRef.current.start()
                }
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [isRecording])

    const startRecording = () => {
        setTranscript('')
        setInterimTranscript('')
        setExtractionError('')
        setIsRecording(true)
        recognitionRef.current?.start()
    }

    const stopRecording = async () => {
        setIsRecording(false)
        recognitionRef.current?.stop()

        // Extract data from transcript
        if (transcript.trim().length > 5) {
            await extractDataFromTranscript()
        } else {
            setExtractionError('No speech detected. Please speak clearly and try again.')
        }
    }

    const extractDataFromTranscript = async () => {
        setExtracting(true)
        setExtractionError('')

        try {
            const response = await fetch(`${API_BASE}/api/v2/ai/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript })
            })

            const result = await response.json()

            if (result.success) {
                setExtractedData(result.extracted)
                setConfidence(result.confidence || {})

                // Merge extracted data into form
                setFormData(prev => ({
                    ...prev,
                    clientName: result.extracted.clientName || prev.clientName,
                    clientAge: result.extracted.clientAge?.toString() || prev.clientAge,
                    loanAmount: result.extracted.loanAmount?.toString() || prev.loanAmount,
                    loanPurpose: mapProjectType(result.extracted.projectType) || prev.loanPurpose,
                    cropType: result.extracted.cropType || prev.cropType,
                    existingLoans: result.extracted.existingLoans?.toString() || prev.existingLoans,
                    repaymentHistory: result.extracted.repaymentHistory?.toString() || prev.repaymentHistory,
                    monthlyIncome: result.extracted.monthlyIncome?.toString() || prev.monthlyIncome
                }))

                setStep('review')
            } else {
                setExtractionError(result.error || 'Failed to extract data. Please try again.')
            }
        } catch (error) {
            console.error('Extraction error:', error)
            setExtractionError('Failed to connect to AI service. Please try again.')
        } finally {
            setExtracting(false)
        }
    }

    const mapProjectType = (type) => {
        const mapping = {
            'agriculture': 'agriculture',
            'livestock': 'livestock',
            'retail': 'small_business',
            'manufacturing': 'small_business',
            'services': 'small_business',
            'housing': 'housing',
            'fishing': 'agriculture',
            'transport': 'small_business'
        }
        return mapping[type] || null
    }

    const getConfidenceColor = (field) => {
        const level = confidence[field]
        if (level === 'high') return 'text-emerald-400 bg-emerald-500/20'
        if (level === 'medium') return 'text-amber-400 bg-amber-500/20'
        return 'text-rose-400 bg-rose-500/20'
    }

    const detectLocation = async () => {
        setGpsLoading(true)

        if (!navigator.geolocation) {
            const demoLoc = demoLocations[mfi?.id] || demoLocations['bangladesh-mfi']
            setFormData(prev => ({
                ...prev,
                latitude: demoLoc.lat.toString(),
                longitude: demoLoc.lng.toString(),
                locationName: demoLoc.name + ' (Demo)'
            }))
            setGpsLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                    locationName: 'GPS Location Detected'
                }))
                setGpsLoading(false)
            },
            () => {
                const demoLoc = demoLocations[mfi?.id] || demoLocations['bangladesh-mfi']
                setFormData(prev => ({
                    ...prev,
                    latitude: demoLoc.lat.toString(),
                    longitude: demoLoc.lng.toString(),
                    locationName: demoLoc.name + ' (Demo)'
                }))
                setGpsLoading(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await assessmentsAPI.createAssessment({
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                locationName: formData.locationName,
                loanAmount: parseFloat(formData.loanAmount),
                loanPurpose: formData.loanPurpose,
                cropType: formData.cropType || null,
                clientAge: parseInt(formData.clientAge),
                existingLoans: parseInt(formData.existingLoans),
                repaymentHistory: parseFloat(formData.repaymentHistory)
            })

            if (result.success && result.assessment) {
                sessionStorage.setItem(`assessment_${result.assessment.id}`, JSON.stringify(result.assessment))
                setLoading(false)
                navigate(`/results/${result.assessment.id}`)
                return
            }
        } catch (error) {
            console.warn('API call failed, using demo mode:', error.message)
        }

        // Fallback to demo mode
        const assessmentId = `assess_${Date.now()}`
        sessionStorage.setItem(`assessment_${assessmentId}`, JSON.stringify({
            ...formData,
            mfiId: mfi?.slug || mfi?.id,
            loanOfficerId: user?.id,
            loanOfficerName: user?.name,
            timestamp: new Date().toISOString()
        }))
        setLoading(false)
        navigate(`/results/${assessmentId}`)
    }

    const handleModeSelect = (mode) => {
        setEntryMode(mode)
        setStep('location-detect')
    }

    const handleLocationConfirmed = (detectedLocation) => {
        setLocation(detectedLocation)
        // Update form data with location
        setFormData(prev => ({
            ...prev,
            latitude: detectedLocation.lat.toString(),
            longitude: detectedLocation.lng.toString(),
            locationName: detectedLocation.formatted
        }))
        setStep('loading')
    }

    const handleLoadingComplete = () => {
        if (entryMode === 'manual') {
            setStep('manual-form')
        } else {
            setStep('recording')
        }
    }

    const handleBack = () => {
        if (step === 'manual-form' || step === 'recording') {
            setStep('mode-select')
            setEntryMode(null)
        } else if (step === 'review') {
            setStep('recording')
        }
    }

    // ============ RENDER SECTIONS ============

    const renderHeader = () => (
        <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E5E5E5' }}>
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    {step !== 'mode-select' && (
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 flex items-center justify-center rounded-lg mr-1 transition-colors"
                            style={{ backgroundColor: '#F5F3ED', color: '#2C2C2C' }}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <LogoAnimation size="small" animation="pulse" />
                    <div>
                        <h1 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>
                            {step === 'mode-select' && 'New Assessment'}
                            {step === 'manual-form' && 'Manual Entry'}
                            {step === 'recording' && 'AI Assistant'}
                            {step === 'review' && 'Review Data'}
                        </h1>
                        <p className="text-xs" style={{ color: '#666666' }}>{mfi?.name}</p>
                    </div>
                </div>

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: '#F5F3ED', color: '#2C2C2C' }}
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {menuOpen && (
                <div className="absolute right-4 top-16 w-56 bg-white rounded-xl shadow-xl p-2 z-50"
                    style={{ border: '1px solid #E5E5E5' }}>
                    <div className="px-3 py-2 border-b mb-2" style={{ borderColor: '#E5E5E5' }}>
                        <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{user?.name}</p>
                        <p className="text-xs" style={{ color: '#666666' }}>
                            {user?.role === 'manager' ? 'Manager' : 'Loan Officer'}
                        </p>
                    </div>

                    {user?.role === 'manager' && (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                            style={{ color: '#2C2C2C' }}
                            onClick={() => setMenuOpen(false)}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                    )}

                    <Link
                        to="/history"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                        style={{ color: '#2C2C2C' }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <HistoryIcon className="w-4 h-4" />
                        Assessment History
                    </Link>

                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm w-full transition-colors"
                        style={{ color: '#E53935' }}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </header>
    )

    const renderModeSelection = () => (
        <div className="px-4 py-8 max-w-lg mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C2C2C' }}>How would you like to enter data?</h2>
                <p style={{ color: '#666666' }}>Choose your preferred method for this assessment</p>
            </div>

            {/* AI Assistant Option */}
            <button
                onClick={() => handleModeSelect('ai')}
                className="w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-[1.02] hover:shadow-lg"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#2D5F3F'
                }}
            >
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(45, 95, 63, 0.1)' }}>
                        <Sparkles className="w-7 h-7" style={{ color: '#2D5F3F' }} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: '#2C2C2C' }}>
                            AI Assistant
                            <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(45, 95, 63, 0.1)', color: '#2D5F3F' }}>
                                Recommended
                            </span>
                        </h3>
                        <p className="text-sm mb-3" style={{ color: '#666666' }}>
                            Record your conversation with the client. AI will transcribe and extract data automatically.
                        </p>
                        <div className="flex items-center gap-4 text-xs" style={{ color: '#666666' }}>
                            <span className="flex items-center gap-1">
                                <Mic className="w-3 h-3" /> Voice Recording
                            </span>
                            <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Auto-Extract
                            </span>
                        </div>
                    </div>
                </div>
            </button>

            {/* Manual Entry Option */}
            <button
                onClick={() => handleModeSelect('manual')}
                className="w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-[1.02] hover:shadow-lg"
                style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E5E5'
                }}
            >
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#F5F3ED' }}>
                        <PenLine className="w-7 h-7" style={{ color: '#2C2C2C' }} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: '#2C2C2C' }}>Manual Entry</h3>
                        <p className="text-sm mb-3" style={{ color: '#666666' }}>
                            Fill out the form manually with client information.
                        </p>
                        <div className="flex items-center gap-4 text-xs" style={{ color: '#666666' }}>
                            <span className="flex items-center gap-1">
                                <Edit2 className="w-3 h-3" /> Type Data
                            </span>
                            <span className="flex items-center gap-1">
                                <FileCheck className="w-3 h-3" /> Full Control
                            </span>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    )

    const renderRecording = () => (
        <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
            {/* Recording Controls */}
            <div className="p-8 bg-white rounded-2xl border text-center transition-all duration-300"
                style={{ borderColor: '#E5E5E5' }}>
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-300
                    ${isRecording
                        ? 'animate-pulse shadow-lg'
                        : ''}`}
                    style={{
                        backgroundColor: isRecording ? '#E53935' : '#F5F3ED',
                        boxShadow: isRecording ? '0 0 20px rgba(229, 57, 53, 0.4)' : 'none'
                    }}
                >
                    {isRecording ? (
                        <Mic className="w-16 h-16 text-white" />
                    ) : (
                        <MicOff className="w-16 h-16" style={{ color: '#999999' }} />
                    )}
                </div>

                {!isRecording && !extracting && (
                    <button
                        onClick={startRecording}
                        className="px-8 py-3 rounded-xl text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        style={{ backgroundColor: '#2D5F3F' }}
                    >
                        Start Recording
                    </button>
                )}

                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="px-8 py-3 rounded-xl text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 mx-auto"
                        style={{ backgroundColor: '#E53935' }}
                    >
                        <Square className="w-5 h-5" />
                        Stop & Extract
                    </button>
                )}

                {extracting && (
                    <div className="flex items-center justify-center gap-3" style={{ color: '#2D5F3F' }}>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="font-medium">AI is extracting data...</span>
                    </div>
                )}

                {isRecording && (
                    <p className="text-sm mt-4" style={{ color: '#666666' }}>
                        Recording... Speak naturally with your client
                    </p>
                )}
            </div>

            {/* Transcript Area - Editable */}
            <div className="p-6 bg-white rounded-2xl border" style={{ borderColor: '#E5E5E5' }}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#2C2C2C' }}>
                        Transcript
                    </h3>
                    <span className="text-xs" style={{ color: '#666666' }}>
                        {transcript.length > 0 ? `${transcript.split(' ').length} words` : 'Type or speak'}
                    </span>
                </div>
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Speech will appear here... OR type/paste your conversation transcript manually"
                    className="w-full min-h-[180px] p-4 rounded-xl border resize-none focus:ring-1 transition-all"
                    style={{
                        backgroundColor: '#FAFAFA',
                        borderColor: '#E5E5E5',
                        color: '#2C2C2C',
                        '--tw-ring-color': '#2D5F3F'
                    }}
                />
                {interimTranscript && (
                    <p className="text-sm mt-2 italic" style={{ color: '#666666' }}>{interimTranscript}</p>
                )}
            </div>

            {/* Manual Extract Button */}
            {!isRecording && !extracting && transcript.trim().length > 0 && (
                <button
                    onClick={extractDataFromTranscript}
                    className="w-full py-4 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#2D5F3F' }}
                >
                    <Sparkles className="w-6 h-6" />
                    Extract Data with AI
                </button>
            )}

            {/* Error Message */}
            {extractionError && (
                <div className="p-4 rounded-xl flex items-start gap-3"
                    style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2' }}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D32F2F' }} />
                    <p className="text-sm" style={{ color: '#B71C1C' }}>{extractionError}</p>
                </div>
            )}

            {/* Speech Recognition Notice */}
            {!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window) && (
                <div className="p-4 rounded-xl flex items-start gap-3"
                    style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFECB3' }}>
                    <p className="text-sm" style={{ color: '#F57F17' }}>
                        ⚠️ Speech recognition not available. You can type or paste your conversation above.
                    </p>
                </div>
            )}

            {/* Tip */}
            <div className="text-center text-sm" style={{ color: '#666666' }}>
                <p>💡 Tip: You can type or paste the conversation directly if voice isn't working</p>
            </div>
        </div>
    )

    const renderReview = () => (
        <div className="px-4 py-6 max-w-lg mx-auto">
            <div className="mb-6 p-4 rounded-xl border flex items-center gap-3"
                style={{ backgroundColor: 'rgba(45, 95, 63, 0.05)', borderColor: 'rgba(45, 95, 63, 0.2)' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#2D5F3F' }} />
                <div>
                    <span className="font-semibold block" style={{ color: '#2D5F3F' }}>AI Extracted Data</span>
                    <p className="text-sm" style={{ color: '#666666' }}>
                        Review and edit the extracted information before proceeding
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location - Always required */}
                <section className="bg-white p-6 rounded-2xl border space-y-4" style={{ borderColor: '#E5E5E5' }}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
                        style={{ color: '#2C2C2C' }}>
                        <MapPin className="w-4 h-4" />
                        Client Location
                    </h3>

                    <button
                        type="button"
                        onClick={detectLocation}
                        disabled={gpsLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all"
                        style={{ backgroundColor: '#2196F3' }}
                    >
                        {gpsLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Detecting Location...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-5 h-5" />
                                Auto-Detect GPS Location
                            </>
                        )}
                    </button>

                    {formData.locationName && (
                        <div className="p-3 rounded-lg border"
                            style={{ backgroundColor: '#F5F3ED', borderColor: '#E5E5E5' }}>
                            <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{formData.locationName}</p>
                            <p className="text-xs mt-1" style={{ color: '#666666' }}>
                                {formData.latitude}, {formData.longitude}
                            </p>
                        </div>
                    )}
                </section>

                {/* Extracted Fields with Confidence */}
                <section className="bg-white p-6 rounded-2xl border space-y-4" style={{ borderColor: '#E5E5E5' }}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
                        style={{ color: '#2C2C2C' }}>
                        <Sparkles className="w-4 h-4" />
                        Extracted Information
                    </h3>

                    {/* Client Name */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Client Name</label>
                            {confidence.clientName && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('clientName')}`}>
                                    {confidence.clientName}
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            placeholder="Enter client name"
                            className="w-full p-2 border rounded-lg"
                            style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                        />
                    </div>

                    {/* Client Age */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Client Age</label>
                            {confidence.clientAge && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('clientAge')}`}>
                                    {confidence.clientAge}
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            name="clientAge"
                            value={formData.clientAge}
                            onChange={handleChange}
                            placeholder="Age"
                            min="18"
                            max="100"
                            required
                            className="w-full p-2 border rounded-lg"
                            style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                        />
                    </div>

                    {/* Loan Amount */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Loan Amount (USD)</label>
                            {confidence.loanAmount && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('loanAmount')}`}>
                                    {confidence.loanAmount}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#666666' }}>$</span>
                            <input
                                type="number"
                                name="loanAmount"
                                value={formData.loanAmount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                min="50"
                                max="50000"
                                required
                                className="pl-10 w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>
                    </div>

                    {/* Loan Purpose */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Loan Purpose</label>
                            {confidence.projectType && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor('projectType')}`}>
                                    {confidence.projectType}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {loanPurposes.map(purpose => (
                                <button
                                    key={purpose.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, loanPurpose: purpose.id }))}
                                    className="p-3 rounded-xl border-2 text-left transition-all"
                                    style={{
                                        borderColor: formData.loanPurpose === purpose.id ? '#2D5F3F' : '#E5E5E5',
                                        backgroundColor: formData.loanPurpose === purpose.id ? '#F5F3ED' : '#FFFFFF'
                                    }}
                                >
                                    <span className="text-xl">{purpose.icon}</span>
                                    <p className="text-sm font-medium mt-1" style={{ color: '#2C2C2C' }}>{purpose.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Existing Loans */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Existing Loans</label>
                            </div>
                            <input
                                type="number"
                                name="existingLoans"
                                value={formData.existingLoans}
                                onChange={handleChange}
                                min="0"
                                max="10"
                                required
                                className="w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium" style={{ color: '#2C2C2C' }}>Monthly Income</label>
                            </div>
                            <input
                                type="number"
                                name="monthlyIncome"
                                value={formData.monthlyIncome}
                                onChange={handleChange}
                                placeholder="USD"
                                min="0"
                                className="w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>
                    </div>

                    {/* Repayment History */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                            Repayment History
                            <span className="ml-2 font-semibold" style={{ color: '#2D5F3F' }}>{formData.repaymentHistory}%</span>
                        </label>
                        <input
                            type="range"
                            name="repaymentHistory"
                            value={formData.repaymentHistory}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{ backgroundColor: '#E5E5E5', accentColor: '#2D5F3F' }}
                        />
                    </div>
                </section>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !formData.latitude || !formData.loanPurpose}
                    className="w-full py-4 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#2D5F3F' }}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Analyzing Climate Risk...
                        </>
                    ) : (
                        <>
                            <Check className="w-6 h-6" />
                            Confirm & Assess Risk
                        </>
                    )}
                </button>
            </form>
        </div>
    )

    const renderManualForm = () => (
        <main className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                {/* Location Section */}
                <section className="bg-white p-6 rounded-2xl border space-y-4" style={{ borderColor: '#E5E5E5' }}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
                        style={{ color: '#2C2C2C' }}>
                        <MapPin className="w-4 h-4" />
                        Client Location
                    </h3>

                    <button
                        type="button"
                        onClick={detectLocation}
                        disabled={gpsLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all"
                        style={{ backgroundColor: '#2196F3' }}
                    >
                        {gpsLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Detecting Location...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-5 h-5" />
                                Auto-Detect GPS Location
                            </>
                        )}
                    </button>

                    {formData.locationName && (
                        <div className="p-3 rounded-lg border"
                            style={{ backgroundColor: '#F5F3ED', borderColor: '#E5E5E5' }}>
                            <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{formData.locationName}</p>
                            <p className="text-xs mt-1" style={{ color: '#666666' }}>
                                {formData.latitude}, {formData.longitude}
                            </p>
                        </div>
                    )}
                </section>

                {/* Client Information */}
                <section className="bg-white p-6 rounded-2xl border space-y-4" style={{ borderColor: '#E5E5E5' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <PenLine className="w-5 h-5" style={{ color: '#2D5F3F' }} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#2C2C2C' }}>
                            Client Information
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2C2C' }}>Client Name</label>
                            <input
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleChange}
                                placeholder="Full Name"
                                required
                                className="w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2C2C' }}>Age</label>
                            <input
                                type="number"
                                name="clientAge"
                                value={formData.clientAge}
                                onChange={handleChange}
                                placeholder="Age"
                                min="18"
                                max="100"
                                required
                                className="w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>
                    </div>
                </section>

                {/* Loan Details */}
                <section className="bg-white p-6 rounded-2xl border space-y-4" style={{ borderColor: '#E5E5E5' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5" style={{ color: '#2D5F3F' }} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#2C2C2C' }}>
                            Loan Details
                        </h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2C2C' }}>Loan Amount (USD)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#666666' }}>$</span>
                            <input
                                type="number"
                                name="loanAmount"
                                value={formData.loanAmount}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="50"
                                max="50000"
                                required
                                className="pl-10 w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-3" style={{ color: '#2C2C2C' }}>Loan Purpose</label>
                        <div className="grid grid-cols-2 gap-3">
                            {loanPurposes.map(purpose => (
                                <button
                                    key={purpose.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, loanPurpose: purpose.id }))}
                                    className="p-3 rounded-xl border-2 text-left transition-all"
                                    style={{
                                        borderColor: formData.loanPurpose === purpose.id ? '#2D5F3F' : '#E5E5E5',
                                        backgroundColor: formData.loanPurpose === purpose.id ? '#F5F3ED' : '#FFFFFF'
                                    }}
                                >
                                    <span className="text-xl">{purpose.icon}</span>
                                    <p className="text-sm font-medium mt-1" style={{ color: '#2C2C2C' }}>{purpose.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Financial Health */}
                <section className="bg-white p-6 rounded-2xl border space-y-4" style={{ borderColor: '#E5E5E5' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5" style={{ color: '#2D5F3F' }} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#2C2C2C' }}>
                            Financial Health
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2C2C' }}>Existing Loans</label>
                            <input
                                type="number"
                                name="existingLoans"
                                value={formData.existingLoans}
                                onChange={handleChange}
                                min="0"
                                max="10"
                                required
                                className="w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2C2C2C' }}>Monthly Income</label>
                            <input
                                type="number"
                                name="monthlyIncome"
                                value={formData.monthlyIncome}
                                onChange={handleChange}
                                placeholder="USD"
                                min="0"
                                className="w-full p-2 border rounded-lg"
                                style={{ borderColor: '#E5E5E5', color: '#2C2C2C' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                            Repayment History
                            <span className="ml-2 font-semibold" style={{ color: '#2D5F3F' }}>{formData.repaymentHistory}%</span>
                        </label>
                        <input
                            type="range"
                            name="repaymentHistory"
                            value={formData.repaymentHistory}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{ backgroundColor: '#E5E5E5', accentColor: '#2D5F3F' }}
                        />
                    </div>
                </section>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !formData.latitude || !formData.loanPurpose}
                    className="w-full py-4 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#2D5F3F' }}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Analyzing Climate Risk...
                        </>
                    ) : (
                        <>
                            <Check className="w-6 h-6" />
                            Confirm & Assess Risk
                        </>
                    )}
                </button>
            </form>
        </main>
    )

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: '#F5F3ED' }}>
            {/* Progress Bar - shown for all steps except mode-select */}
            {step !== 'mode-select' && (
                <ProgressBar
                    currentStep={step}
                />
            )}

            {/* Regular header for mode-select and data entry steps */}
            {(step === 'mode-select' || step === 'manual-form' || step === 'recording' || step === 'review') && renderHeader()}

            {step === 'mode-select' && renderModeSelection()}
            {/* For LocationDetection, we render it directly. It has its own internal styling but we can wrap it if needed. 
                Actually LocationDetection has its own full page layout, so we might want to check if it clashes.
                Looking at LocationDetection.jsx, it has "min-h-screen pt-24 pb-12 px-4" and background color.
                So if we render it here inside a div that also has min-h-screen, it might be fine or double scroll.
                However, NewAssessment is the main page controller.
            */}
            {step === 'location-detect' && <LocationDetection onLocationConfirmed={handleLocationConfirmed} />}

            {step === 'loading' && <LoadingAnimation onComplete={handleLoadingComplete} minimumDuration={6000} />}

            {step === 'manual-form' && renderManualForm()}
            {step === 'recording' && renderRecording()}
            {step === 'review' && renderReview()}
        </div>
    )
}
