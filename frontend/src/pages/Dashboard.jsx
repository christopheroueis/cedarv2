import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LogoAnimation from '../components/LogoAnimation'
import { Plus, FileCheck, Menu, LogOut, User, History as HistoryIcon } from 'lucide-react'

export default function Dashboard() {
    const { user, mfi, logout } = useAuth()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = React.useState(false)

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#F5F3ED' }}>
            {/* Header with Logo */}
            <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E5E5E5' }}>
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <LogoAnimation size="small" animation="pulse" />
                        <div>
                            <h1 className="text-lg font-semibold" style={{ color: '#2C2C2C' }}>Cedar</h1>
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

            {/* Main Content */}
            <main className="px-4 py-8 max-w-6xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-2" style={{ color: '#2C2C2C' }}>
                        Welcome back, {user?.name}
                    </h2>
                    <p style={{ color: '#666666' }}>
                        Manage your climate-smart loan portfolio
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => navigate('/new-assessment')}
                        className="p-6 bg-white rounded-2xl border-2 transition-all hover:shadow-lg text-left"
                        style={{ borderColor: '#2D5F3F' }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold mb-2" style={{ color: '#2D5F3F' }}>
                                    New Assessment
                                </h3>
                                <p className="text-sm mb-4" style={{ color: '#666666' }}>
                                    Start evaluating a new loan application with AI-powered climate risk analysis
                                </p>
                                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#2D5F3F' }}>
                                    <Plus className="w-4 h-4" />
                                    Create Assessment
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(45, 95, 63, 0.1)' }}>
                                <Plus className="w-6 h-6" style={{ color: '#2D5F3F' }} />
                            </div>
                        </div>
                    </button>

                    <Link
                        to="/history"
                        className="p-6 bg-white rounded-2xl border transition-all hover:shadow-lg text-left block"
                        style={{ borderColor: '#E5E5E5' }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold mb-2" style={{ color: '#2C2C2C' }}>
                                    View History
                                </h3>
                                <p className="text-sm mb-4" style={{ color: '#666666' }}>
                                    Access past assessments and track portfolio performance over time
                                </p>
                                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#2D5F3F' }}>
                                    <FileCheck className="w-4 h-4" />
                                    Browse Assessments
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#F5F3ED' }}>
                                <FileCheck className="w-6 h-6" style={{ color: '#2D5F3F' }} />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Info Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white rounded-xl border" style={{ borderColor: '#E5E5E5' }}>
                        <div className="text-3xl mb-2">🌍</div>
                        <h4 className="font-semibold mb-1" style={{ color: '#2C2C2C' }}>
                            Climate Intelligence
                        </h4>
                        <p className="text-sm" style={{ color: '#666666' }}>
                            Real-time climate data and risk scoring based on location
                        </p>
                    </div>

                    <div className="p-6 bg-white rounded-xl border" style={{ borderColor: '#E5E5E5' }}>
                        <div className="text-3xl mb-2">🤖</div>
                        <h4 className="font-semibold mb-1" style={{ color: '#2C2C2C' }}>
                            AI-Powered
                        </h4>
                        <p className="text-sm" style={{ color: '#666666' }}>
                            Automated data extraction and ML-driven predictions
                        </p>
                    </div>

                    <div className="p-6 bg-white rounded-xl border" style={{ borderColor: '#E5E5E5' }}>
                        <div className="text-3xl mb-2">📊</div>
                        <h4 className="font-semibold mb-1" style={{ color: '#2C2C2C' }}>
                            Smart Analytics
                        </h4>
                        <p className="text-sm" style={{ color: '#666666' }}>
                            Comprehensive risk assessment combining multiple factors
                        </p>
                    </div>
                </div>

                {/* Institution Info */}
                <div className="mt-8 p-6 bg-white rounded-xl border" style={{ borderColor: '#E5E5E5' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#2C2C2C' }}>
                        Institution Details
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span style={{ color: '#666666' }}>Institution:</span>
                            <span className="font-medium" style={{ color: '#2C2C2C' }}>{mfi?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: '#666666' }}>Your Role:</span>
                            <span className="font-medium" style={{ color: '#2C2C2C' }}>
                                {user?.role === 'manager' ? 'Portfolio Manager' : 'Loan Officer'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: '#666666' }}>Account:</span>
                            <span className="font-medium" style={{ color: '#2C2C2C' }}>{user?.username}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
