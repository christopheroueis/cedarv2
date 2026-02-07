import React from 'react'
import { MapPin, Mic, BarChart3, CheckCircle2 } from 'lucide-react'

const steps = [
    { id: 'mode-select', label: 'Mode', icon: MapPin },
    { id: 'location-detect', label: 'Location', icon: MapPin },
    { id: 'manual-form', label: 'Data', icon: Mic }, // Or recording
    { id: 'review', label: 'Review', icon: CheckCircle2 }
]

// Mapping for dynamic steps based on flow could be added here, but keeping it simple for now based on the provided file's structure.
// The original file had: Location, Data Entry, Assessment, Results.
// let's stick to a generic 4-step flow visually.

export default function ProgressBar({ currentStep }) {
    // We need to map the currentStep string to an index.
    // The currentStep props passed from NewAssessment are: 'mode-select', 'location-detect', 'manual-form'/'recording', 'review', 'loading'

    let activeIndex = 0;
    if (currentStep === 'mode-select') activeIndex = 0;
    else if (currentStep === 'location-detect') activeIndex = 1;
    else if (currentStep === 'manual-form' || currentStep === 'recording') activeIndex = 2;
    else if (currentStep === 'review') activeIndex = 3;
    else if (currentStep === 'loading' || currentStep === 'results') activeIndex = 4;

    const displaySteps = [
        { label: 'Start', icon: MapPin },
        { label: 'Location', icon: MapPin },
        { label: 'Data', icon: Mic },
        { label: 'Review', icon: CheckCircle2 }
    ]

    return (
        <div className="sticky top-16 z-40 bg-white border-b" style={{ borderColor: '#E5E5E5' }}>
            <div className="max-w-3xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between relative">
                    {/* Progress Bar Background Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />

                    {/* Progress Bar Fill Line */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-600 -z-10 transition-all duration-500 ease-out"
                        style={{ width: `${(activeIndex / (displaySteps.length - 1)) * 100}%`, backgroundColor: '#2D5F3F' }}
                    />

                    {displaySteps.map((step, index) => {
                        const Icon = step.icon
                        const isActive = index === activeIndex
                        const isCompleted = index < activeIndex

                        return (
                            <div key={index} className="flex flex-col items-center gap-2 bg-white px-2">
                                <div
                                    className={`
                                        flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
                                        ${isActive ? 'scale-110' : ''}
                                    `}
                                    style={{
                                        backgroundColor: isCompleted || isActive ? '#2D5F3F' : '#FFFFFF',
                                        borderColor: isCompleted || isActive ? '#2D5F3F' : '#E5E5E5',
                                        color: isCompleted || isActive ? '#FFFFFF' : '#999999'
                                    }}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <Icon className="w-4 h-4" />
                                    )}
                                </div>
                                <span className="text-xs font-medium"
                                    style={{ color: isActive || isCompleted ? '#2D5F3F' : '#999999' }}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
