import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    ArrowLeft, Search, MapPin, DollarSign,
    CheckCircle, AlertTriangle, XCircle, SlidersHorizontal, Plus
} from 'lucide-react'

// Mock historical assessments
const generateHistoricalData = (mfiSlug) => {
    const locations = {
        'bangladesh-mfi': ['Sylhet', 'Dhaka', 'Chittagong', 'Khulna'],
        'kenya-mfi': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
        'peru-mfi': ['Lima', 'Cusco', 'Arequipa', 'Trujillo']
    }

    const names = {
        'bangladesh-mfi': ['Ahmed Hassan', 'Fatima Begum', 'Mohammad Ali', 'Rashida Khatun', 'Kamal Hossain'],
        'kenya-mfi': ['John Kimani', 'Mary Wanjiku', 'Peter Ochieng', 'Grace Akinyi', 'James Mwangi'],
        'peru-mfi': ['Maria Santos', 'Carlos Mendoza', 'Ana Garcia', 'Jose Rodriguez', 'Rosa Martinez']
    }

    const locs = locations[mfiSlug] || locations['bangladesh-mfi']
    const clientNames = names[mfiSlug] || names['bangladesh-mfi']

    const assessments = []
    const now = Date.now()

    for (let i = 0; i < 25; i++) {
        const riskScore = Math.floor(20 + Math.random() * 60)
        let status = 'approved'
        if (riskScore > 65) status = 'deferred'
        else if (riskScore > 50) status = 'caution'

        assessments.push({
            id: `hist_${i}`,
            clientName: clientNames[i % clientNames.length],
            location: locs[i % locs.length],
            loanAmount: Math.floor(200 + Math.random() * 3000),
            loanPurpose: ['agriculture', 'livestock', 'small_business', 'housing'][i % 4],
            riskScore,
            status,
            date: new Date(now - i * 24 * 60 * 60 * 1000 * Math.random() * 3).toISOString(),
            officer: 'You'
        })
    }

    return assessments.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const statusConfig = {
    approved: { icon: CheckCircle, label: 'Approved', color: '#2D5F3F', bg: 'rgba(45, 95, 63, 0.1)' },
    caution: { icon: AlertTriangle, label: 'Caution', color: '#E59135', bg: 'rgba(229, 145, 53, 0.1)' },
    deferred: { icon: XCircle, label: 'Deferred', color: '#D9534F', bg: 'rgba(217, 83, 79, 0.1)' }
}

const purposeLabels = {
    agriculture: '🌾 Agriculture',
    livestock: '🐄 Livestock',
    small_business: '🏪 Business',
    housing: '🏠 Housing'
}

function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 24) {
        if (diffHours < 1) return 'Just now'
        return `${Math.floor(diffHours)}h ago`
    }
    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function History() {
    const { mfi } = useAuth()
    const navigate = useNavigate()
    const [assessments, setAssessments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            setAssessments(generateHistoricalData(mfi?.slug))
            setLoading(false)
        }, 500)
    }, [mfi?.slug])

    const filteredAssessments = assessments.filter(a => {
        const matchesSearch = searchQuery === '' ||
            a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.location.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = filterStatus === 'all' || a.status === filterStatus

        return matchesSearch && matchesStatus
    })

    const stats = {
        total: assessments.length,
        approved: assessments.filter(a => a.status === 'approved').length,
        caution: assessments.filter(a => a.status === 'caution').length,
        deferred: assessments.filter(a => a.status === 'deferred').length
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3ED' }}>
                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#2D5F3F' }}></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-8" style={{ backgroundColor: '#F5F3ED' }}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E5E5E5' }}>
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                            style={{ backgroundColor: '#F5F3ED', color: '#2C2C2C' }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>Assessment History</h1>
                            <p className="text-xs" style={{ color: '#666666' }}>{stats.total} assessments</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
                        style={{
                            backgroundColor: showFilters ? '#2D5F3F' : '#F5F3ED',
                            color: showFilters ? '#FFFFFF' : '#2C2C2C'
                        }}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#999999' }} />
                        <input
                            type="text"
                            placeholder="Search by client or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-1"
                            style={{
                                backgroundColor: '#FAFAFA',
                                borderColor: '#E5E5E5',
                                color: '#2C2C2C',
                                '--tw-ring-color': '#2D5F3F'
                            }}
                        />
                    </div>
                </div>

                {/* Filter Pills */}
                {showFilters && (
                    <div className="px-4 pb-3">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {[
                                { key: 'all', label: `All (${stats.total})` },
                                { key: 'approved', label: `Approved (${stats.approved})` },
                                { key: 'caution', label: `Caution (${stats.caution})` },
                                { key: 'deferred', label: `Deferred (${stats.deferred})` }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => setFilterStatus(filter.key)}
                                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                                    style={{
                                        backgroundColor: filterStatus === filter.key ? '#2D5F3F' : '#F5F3ED',
                                        color: filterStatus === filter.key ? '#FFFFFF' : '#666666'
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Assessments List */}
            <main className="px-4 py-4 max-w-4xl mx-auto">
                {filteredAssessments.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto mb-4" style={{ color: '#999999' }} />
                        <p style={{ color: '#666666' }}>No assessments found</p>
                        <p className="text-sm mt-1" style={{ color: '#999999' }}>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredAssessments.map((assessment) => {
                            const config = statusConfig[assessment.status]
                            const Icon = config.icon
                            const riskColor = assessment.riskScore > 65 ? '#D9534F' :
                                assessment.riskScore > 50 ? '#E59135' : '#2D5F3F'

                            return (
                                <div
                                    key={assessment.id}
                                    className="bg-white p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                                    style={{ borderColor: '#E5E5E5' }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium" style={{ color: '#2C2C2C' }}>{assessment.clientName}</h3>
                                                <span className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: config.bg, color: config.color }}>
                                                    {config.label}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: '#666666' }}>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {assessment.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    ${assessment.loanAmount.toLocaleString()}
                                                </span>
                                                <span>{purposeLabels[assessment.loanPurpose]}</span>
                                            </div>
                                        </div>

                                        <div className="text-right ml-4">
                                            <div className="text-xl font-bold" style={{ color: riskColor }}>
                                                {assessment.riskScore}
                                            </div>
                                            <p className="text-xs" style={{ color: '#999999' }}>{formatDate(assessment.date)}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* FAB - New Assessment */}
            <Link
                to="/new-assessment"
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                   text-white hover:scale-110 transition-transform"
                style={{ backgroundColor: '#2D5F3F' }}
            >
                <Plus className="w-6 h-6" />
            </Link>
        </div>
    )
}
