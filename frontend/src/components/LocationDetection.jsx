import React, { useState, useEffect } from 'react'
import { MapPin, Search, Loader2, CheckCircle, AlertCircle, Navigation } from 'lucide-react'
import { detectGPS, reverseGeocode, searchAddress } from '../services/locationService'
import LogoAnimation from './LogoAnimation'

export default function LocationDetection({ onLocationConfirmed }) {
    const [mode, setMode] = useState(null) // 'gps' | 'manual' | null
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [location, setLocation] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)

    // Handle GPS detection
    const handleGPSDetect = async () => {
        setMode('gps')
        setLoading(true)
        setError(null)

        try {
            const coords = await detectGPS()
            const address = await reverseGeocode(coords.lat, coords.lng)

            setLocation({
                ...address,
                method: 'gps',
                accuracy: coords.accuracy
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle manual address search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setSuggestions([])
            return
        }

        const timeoutId = setTimeout(async () => {
            setSearchLoading(true)
            try {
                const results = await searchAddress(searchQuery)
                setSuggestions(results)
            } catch (err) {
                console.error('Search error:', err)
            } finally {
                setSearchLoading(false)
            }
        }, 500) // Debounce

        return () => clearTimeout(timeoutId)
    }, [searchQuery])

    const handleSelectAddress = (address) => {
        setLocation({
            ...address,
            method: 'manual'
        })
        setSuggestions([])
        setSearchQuery(address.formatted)
        setMode('manual')
    }

    const handleConfirm = () => {
        if (location) {
            onLocationConfirmed(location)
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4" style={{ backgroundColor: '#F5F3ED' }}>
            <div className="w-full max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <LogoAnimation size="small" animation="float" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4" style={{ color: '#2C2C2C' }}>
                        Where is the loan applicant located?
                    </h1>
                    <p className="text-lg" style={{ color: '#666666' }}>
                        Choose how you'd like to provide the location
                    </p>
                </div>

                {!location ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* GPS Detection Option */}
                        <div className="bg-white rounded-2xl p-8 border hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                            style={{ borderColor: '#E5E5E5' }}>
                            <div className="flex flex-col items-center text-center gap-6">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: '#F5F3ED' }}>
                                    {loading && mode === 'gps' ? (
                                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#2D5F3F' }} />
                                    ) : (
                                        <Navigation className="w-10 h-10" style={{ color: '#2D5F3F' }} />
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold mb-2" style={{ color: '#2C2C2C' }}>Use GPS</h3>
                                    <p style={{ color: '#666666' }}>
                                        Automatically detect current location
                                    </p>
                                </div>

                                <button
                                    onClick={handleGPSDetect}
                                    disabled={loading}
                                    className="w-full text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                    style={{ backgroundColor: '#2D5F3F' }}
                                >
                                    {loading && mode === 'gps' ? 'Detecting...' : 'Detect Location'}
                                </button>

                                {error && mode === 'gps' && (
                                    <div className="flex items-center gap-2 text-sm" style={{ color: '#E53935' }}>
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manual Search Option */}
                        <div className="bg-white rounded-2xl p-8 border hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                            style={{ borderColor: '#E5E5E5' }}>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center gap-6">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: '#F5F3ED' }}>
                                        <Search className="w-10 h-10" style={{ color: '#2D5F3F' }} />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold mb-2" style={{ color: '#2C2C2C' }}>Enter Address</h3>
                                        <p style={{ color: '#666666' }}>
                                            Search for village, city, or district
                                        </p>
                                    </div>
                                </div>

                                {/* Search Input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Type to search..."
                                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                                        style={{
                                            backgroundColor: '#FAFAFA',
                                            borderColor: '#E5E5E5',
                                            color: '#2C2C2C',
                                            '--tw-ring-color': '#2D5F3F'
                                        }}
                                    />
                                    {searchLoading && (
                                        <Loader2 className="absolute right-3 top-3 w-5 h-5 animate-spin" style={{ color: '#999999' }} />
                                    )}
                                </div>

                                {/* Suggestions Dropdown */}
                                {suggestions.length > 0 && (
                                    <div className="bg-white border rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-lg"
                                        style={{ borderColor: '#E5E5E5' }}>
                                        {suggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.id}
                                                onClick={() => handleSelectAddress(suggestion)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                style={{ borderColor: '#F5F3ED' }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#2D5F3F' }} />
                                                    <div>
                                                        <p className="font-medium text-sm" style={{ color: '#2C2C2C' }}>
                                                            {suggestion.formatted}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Location Confirmation Card */
                    <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-xl border"
                        style={{ borderColor: '#E5E5E5' }}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#2D5F3F' }}>
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Location Selected</h3>
                                <p style={{ color: '#666666' }}>Please confirm this is correct</p>
                            </div>
                        </div>

                        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#F5F3ED' }}>
                            <div className="flex items-start gap-3 mb-4">
                                <MapPin className="w-6 h-6 flex-shrink-0" style={{ color: '#2D5F3F' }} />
                                <div>
                                    <p className="font-medium text-lg mb-2" style={{ color: '#2C2C2C' }}>
                                        {location.formatted}
                                    </p>
                                    <p className="text-sm" style={{ color: '#666666' }}>
                                        Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                    </p>
                                    {location.accuracy && (
                                        <p className="text-sm" style={{ color: '#666666' }}>
                                            Accuracy: ±{Math.round(location.accuracy)}m
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setLocation(null)
                                    setMode(null)
                                    setSearchQuery('')
                                    setError(null)
                                }}
                                className="flex-1 border px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
                                style={{ borderColor: '#E5E5E5', color: '#666666' }}
                            >
                                Change Location
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                                style={{ backgroundColor: '#2D5F3F' }}
                            >
                                Confirm & Continue
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
