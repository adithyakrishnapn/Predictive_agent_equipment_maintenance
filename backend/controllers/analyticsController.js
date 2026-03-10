import MLServiceClient from '../services/mlService.js';
import appointmentService from '../services/appointmentService.js';
import * as reliabilityService from '../services/reliabilityService.js';
import logger from '../utils/logger.js';
import moment from 'moment';

/**
 * Get dashboard analytics
 */
export const getDashboard = async (req, res, next) => {
  try {
    // Get all machines from ML service
    const mlData = await MLServiceClient.getAllMachines();
    const machines = mlData.machines || [];
    
    // Calculate statistics
    const totalMachines = machines.length;
    const criticalMachines = machines.filter(m => m.risk_level === 'Critical').length;
    const maintenanceMachines = machines.filter(m => m.risk_level === 'Maintenance').length;
    const healthyMachines = machines.filter(m => m.risk_level === 'Normal').length;
    
    // Average health score
    const avgHealthScore = machines.reduce((sum, m) => sum + (m.health_score || 100), 0) / totalMachines;
    
    // Today's appointments
    const today = moment().format('YYYY-MM-DD');
    const allAppointments = await appointmentService.getAllAppointments({ date: today });
    const todayAppointments = allAppointments.filter(apt => apt.status === 'scheduled').length;
    
    res.status(200).json({
      success: true,
      data: {
        machines: {
          total: totalMachines,
          critical: criticalMachines,
          maintenance: maintenanceMachines,
          healthy: healthyMachines,
          averageHealth: Math.round(avgHealthScore)
        },
        appointments: {
          today: todayAppointments
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error in getDashboard:', error);
    next(error);
  }
};

/**
 * Get cost analysis
 */
export const getCostAnalysis = async (req, res, next) => {
  try {
    const { timeframe = '30' } = req.query; // days
    
    // Get machines at risk
    const mlData = await MLServiceClient.getAllMachines();
    const machines = mlData.machines || [];
    
    const criticalCount = machines.filter(m => m.risk_level === 'Critical').length;
    const maintenanceCount = machines.filter(m => m.risk_level === 'Maintenance').length;
    
    // Cost projections
    const preventiveCost = 60000;
    const breakdownCost = 300000;
    const lostRevenue = 1000000;
    const totalBreakdownCost = breakdownCost + lostRevenue;
    const potentialSavings = totalBreakdownCost - preventiveCost;
    
    // Calculate projected savings
    const projectedSavings = (criticalCount + maintenanceCount) * potentialSavings;
    
    res.status(200).json({
      success: true,
      data: {
        timeframe: `${timeframe} days`,
        cost_comparison: {
          preventive_maintenance: preventiveCost,
          breakdown_repair: breakdownCost,
          lost_revenue_per_breakdown: lostRevenue,
          total_breakdown_cost: totalBreakdownCost,
          savings_per_prevention: potentialSavings
        },
        projections: {
          machines_at_risk: criticalCount + maintenanceCount,
          critical_machines: criticalCount,
          maintenance_required: maintenanceCount,
          potential_savings: projectedSavings,
          roi_percentage: Math.round((potentialSavings / preventiveCost) * 100)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getCostAnalysis:', error);
    next(error);
  }
};

/**
 * Get predictive insights
 */
export const getPredictiveInsights = async (req, res, next) => {
  try {
    const mlData = await MLServiceClient.getAllMachines();
    const machines = mlData.machines || [];
    
    const highRiskMachines = machines.filter(m => 
      m.risk_level === 'Critical' || m.risk_level === 'Maintenance'
    );
    
    const insights = {
      high_risk_count: highRiskMachines.length,
      high_risk_machines: highRiskMachines.map(m => ({
        machine_id: m.machine_id,
        risk_level: m.risk_level,
        health_score: m.health_score,
        predicted_failure_days: m.predicted_failure_days || 'N/A'
      })),
      recommended_actions: [],
      cost_impact: {}
    };
    
    // Generate recommendations
    highRiskMachines.forEach(machine => {
      if (machine.risk_level === 'Critical') {
        insights.recommended_actions.push({
          machine_id: machine.machine_id,
          action: 'Immediate Maintenance Required',
          priority: 'Critical',
          estimated_cost: 60000,
          urgency: 'Within 24 hours'
        });
      } else if (machine.risk_level === 'Maintenance') {
        insights.recommended_actions.push({
          machine_id: machine.machine_id,
          action: 'Schedule Preventive Maintenance',
          priority: 'High',
          estimated_cost: 40000,
          urgency: 'Within 7 days'
        });
      }
    });
    
    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Error in getPredictiveInsights:', error);
    next(error);
  }
};

/**
 * Get reliability metrics for a specific machine
 */
export const getMachineReliabilityMetrics = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { period = 30 } = req.query; // Default 30 days
    
    const periodDays = parseInt(period, 10);
    if (isNaN(periodDays) || periodDays < 1 || periodDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Period must be between 1 and 365 days'
      });
    }
    
    const metrics = await reliabilityService.getMachineReliabilityMetrics(machineId, periodDays);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error in getMachineReliabilityMetrics:', error);
    next(error);
  }
};

/**
 * Get reliability metrics for all machines
 */
export const getAllReliabilityMetrics = async (req, res, next) => {
  try {
    const { period = 30 } = req.query; // Default 30 days
    
    const periodDays = parseInt(period, 10);
    if (isNaN(periodDays) || periodDays < 1 || periodDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Period must be between 1 and 365 days'
      });
    }
    
    const metrics = await reliabilityService.getAllMachinesReliabilityMetrics(periodDays);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error in getAllReliabilityMetrics:', error);
    next(error);
  }
};
