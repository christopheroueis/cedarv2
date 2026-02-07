/**
 * Conflict Data Service
 * Uses pre-loaded FSI (Fragile States Index) data from conflictdata.xlsx
 * Instead of relying on external ACLED API
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load conflict data from JSON file
let CONFLICT_DATA = {}
try {
    const dataPath = join(__dirname, '../../data/conflictData.json')
    CONFLICT_DATA = JSON.parse(readFileSync(dataPath, 'utf8'))
    console.log(`✓ Loaded conflict data for ${Object.keys(CONFLICT_DATA).length} countries`)
} catch (error) {
    console.warn('Could not load conflictData.json, using defaults')
}

/**
 * Get conflict risk data for a country
 * @param {string} countryCode - ISO2 country code
 * @returns {Object} Conflict risk scores
 */
export function getConflictScore(countryCode) {
    const code = countryCode?.toUpperCase()
    const data = CONFLICT_DATA[code]

    if (!data) {
        // Default for unknown countries (moderate risk)
        return {
            source: 'default',
            countryCode: code,
            country: 'Unknown',
            totalScore: 60,
            normalizedRisk: 0.5,
            riskLevel: 'medium',
            components: {}
        }
    }

    // Normalize total score (0-120) to risk (0-1)
    // Higher FSI = higher risk
    const normalizedRisk = Math.min(1, data.total / 120)

    // Calculate component-based risk
    const conflictComponents = {
        securityApparatus: data.securityApparatus / 10, // 0-10 → 0-1
        factionalizedElites: data.factionalizedElites / 10,
        groupGrievance: data.groupGrievance / 10,
        humanRights: data.humanRights / 10,
        stateLegitimacy: data.stateLegitimacy / 10,
        externalIntervention: data.externalIntervention / 10
    }

    // Weighted conflict score (focusing on security-related indicators)
    const weightedScore = (
        conflictComponents.securityApparatus * 0.30 +
        conflictComponents.factionalizedElites * 0.25 +
        conflictComponents.groupGrievance * 0.20 +
        conflictComponents.humanRights * 0.15 +
        conflictComponents.externalIntervention * 0.10
    )

    // Determine risk level
    let riskLevel = 'low'
    if (normalizedRisk > 0.75) riskLevel = 'very-high'
    else if (normalizedRisk > 0.6) riskLevel = 'high'
    else if (normalizedRisk > 0.45) riskLevel = 'medium'

    return {
        source: 'fsi-2023',
        countryCode: code,
        country: data.country,
        rank: data.rank,
        totalScore: data.total,
        normalizedRisk: parseFloat(normalizedRisk.toFixed(3)),
        weightedConflictRisk: parseFloat(weightedScore.toFixed(3)),
        riskLevel,
        components: conflictComponents
    }
}

/**
 * Get political stability risk based on FSI components
 * @param {string} countryCode - ISO2 country code
 */
export function getPoliticalStabilityRisk(countryCode) {
    const code = countryCode?.toUpperCase()
    const data = CONFLICT_DATA[code]

    if (!data) return 0.5 // Default medium

    // State legitimacy + factionalized elites are key political stability indicators
    const stabilityScore = (
        (data.stateLegitimacy / 10) * 0.5 +
        (data.factionalizedElites / 10) * 0.3 +
        (data.humanRights / 10) * 0.2
    )

    return parseFloat(stabilityScore.toFixed(3))
}

/**
 * Get all available country codes
 */
export function getAvailableCountries() {
    return Object.keys(CONFLICT_DATA).map(code => ({
        code,
        name: CONFLICT_DATA[code].country,
        totalScore: CONFLICT_DATA[code].total
    }))
}

export default {
    getConflictScore,
    getPoliticalStabilityRisk,
    getAvailableCountries,
    CONFLICT_DATA
}
