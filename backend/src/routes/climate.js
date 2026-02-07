import express from 'express'
import { optionalAuth } from '../middleware/auth.js'
import climateService from '../services/climateService.js'
import { demoData } from '../config/database.js'

const router = express.Router()

// GET /api/climate-data/:lat/:lng - Get climate data for a location
router.get('/:lat/:lng', optionalAuth, async (req, res) => {
    try {
        const lat = parseFloat(req.params.lat)
        const lng = parseFloat(req.params.lng)

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                error: 'Invalid coordinates',
                message: 'Please provide valid latitude and longitude values'
            })
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                error: 'Coordinates out of range',
                message: 'Latitude must be -90 to 90, longitude must be -180 to 180'
            })
        }

        const climateData = await climateService.getClimateData(lat, lng)

        res.json({
            success: true,
            data: climateData
        })

    } catch (error) {
        console.error('Climate data error:', error)
        res.status(500).json({
            error: 'Failed to fetch climate data',
            message: 'An error occurred while fetching climate data'
        })
    }
})

// GET /api/climate-data/risk-score - Calculate risk score for given parameters
router.post('/risk-score', optionalAuth, async (req, res) => {
    try {
        const { latitude, longitude, loanPurpose, cropType } = req.body

        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing coordinates',
                message: 'Please provide latitude and longitude'
            })
        }

        const climateData = await climateService.getClimateData(
            parseFloat(latitude),
            parseFloat(longitude)
        )

        const riskScore = climateService.calculateClimateRiskScore(
            climateData,
            loanPurpose || 'small_business',
            cropType
        )

        res.json({
            success: true,
            location: climateData.location,
            riskScore: riskScore.score,
            factors: riskScore.factors,
            seasonalMultiplier: riskScore.seasonalMultiplier,
            source: climateData.source
        })

    } catch (error) {
        console.error('Risk score error:', error)
        res.status(500).json({
            error: 'Failed to calculate risk score',
            message: 'An error occurred while calculating climate risk'
        })
    }
})

// GET /api/climate-data/regions - Get pre-loaded climate zones
router.get('/regions/all', (req, res) => {
    const regions = demoData.climateZones.map(zone => ({
        id: zone.id,
        name: zone.region_name,
        country: zone.country,
        coordinates: { lat: zone.lat, lng: zone.lng },
        risks: {
            flood: zone.flood_risk,
            drought: zone.drought_risk,
            heatwave: zone.heatwave_risk
        }
    }))

    res.json({ regions })
})

export default router
