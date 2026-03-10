const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const moment = require('moment');

// Data file paths
const MACHINES_FILE = path.join(__dirname, '../data/machines.json');
const APPOINTMENTS_FILE = path.join(__dirname, '../data/appointments.json');

// Helper functions to read data
const getMachines = async () => {
  try {
    const data = await fs.readFile(MACHINES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading machines file:', error);
    return [];
  }
};

const getMachineById = async (machineId) => {
  const machines = await getMachines();
  return machines.find(m => m.machine_id === machineId);
};

const getAppointments = async () => {
  try {
    const data = await fs.readFile(APPOINTMENTS_FILE, 'utf8');
    const json = JSON.parse(data);
    // Return the appointments array, not the whole object
    return json.appointments || [];
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
};

/**
 * Calculate Equipment Uptime Percentage
 * Uptime (%) = ((Total Time - Downtime) / Total Time) × 100
 */
const calculateUptime = (totalTime, downtime) => {
  if (totalTime === 0) return 100;
  return ((totalTime - downtime) / totalTime) * 100;
};

/**
 * Calculate Downtime Percentage
 * Downtime (%) = (Downtime / Total Time) × 100
 */
const calculateDowntime = (totalTime, downtime) => {
  if (totalTime === 0) return 0;
  return (downtime / totalTime) * 100;
};

/**
 * Calculate Mean Time Between Failures (MTBF)
 * MTBF = Total Operating Time / Number of Failures
 */
const calculateMTBF = (operatingTime, failures) => {
  if (failures === 0) return operatingTime;
  return operatingTime / failures;
};

/**
 * Calculate Mean Time To Repair (MTTR)
 * MTTR = Total Repair Time / Number of Repairs
 */
const calculateMTTR = (totalRepairTime, repairs) => {
  if (repairs === 0) return 0;
  return totalRepairTime / repairs;
};

/**
 * Calculate Availability (System Reliability Metric)
 * Availability = MTBF / (MTBF + MTTR)
 */
const calculateAvailability = (mtbf, mttr) => {
  if (mtbf + mttr === 0) return 1;
  return mtbf / (mtbf + mttr);
};

/**
 * Calculate Failure Rate
 * Failure Rate = Number of Failures / Total Operating Time
 */
const calculateFailureRate = (failures, operatingTime) => {
  if (operatingTime === 0) return 0;
  return failures / operatingTime;
};

/**
 * Calculate Downtime Cost
 * Downtime Cost = Downtime Duration × Revenue Loss Per Hour
 */
const calculateDowntimeCost = (downtimeDuration, revenuePerHour) => {
  return downtimeDuration * revenuePerHour;
};

/**
 * Get reliability metrics for a specific machine
 */
exports.getMachineReliabilityMetrics = async (machineId, periodDays = 30) => {
  try {
    const machine = await getMachineById(machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} not found`);
    }

    // Calculate time period in hours
    const totalTimeHours = periodDays * 24;
    const endDate = moment();
    const startDate = moment().subtract(periodDays, 'days');

    // Get maintenance history for the period
    const maintenanceHistory = (machine.maintenance_history || []).filter(m => 
      moment(m.date).isBetween(startDate, endDate, null, '[]')
    );

    // Calculate failures (critical repairs)
    const failures = maintenanceHistory.filter(m => 
      m.type && (m.type.toLowerCase().includes('repair') || m.type.toLowerCase().includes('failure'))
    );

    // Calculate downtime hours (assuming each maintenance takes some time)
    // For repair/failure: average 4 hours, for preventive: 2 hours
    let downtimeHours = 0;
    let totalRepairTime = 0;
    let repairCount = 0;

    maintenanceHistory.forEach(m => {
      if (m.type && m.type.toLowerCase().includes('repair')) {
        downtimeHours += 4; // Repair downtime
        totalRepairTime += 4;
        repairCount++;
      } else {
        downtimeHours += 2; // Preventive maintenance downtime
      }
    });

    // Get appointments for response time calculation
    const allAppointments = await getAppointments();
    const appointments = allAppointments.filter(apt => 
      apt.machine_id === machineId &&
      moment(apt.appointment_date).isBetween(startDate, endDate, null, '[]')
    );

    // Calculate average response time (hours between creation and appointment)
    let totalResponseTime = 0;
    let responseCount = 0;
    appointments.forEach(apt => {
      if (apt.createdAt && apt.appointment_date) {
        const responseHours = moment(apt.appointment_date).diff(moment(apt.createdAt), 'hours', true);
        if (responseHours >= 0 && responseHours < 168) { // Within a week
          totalResponseTime += responseHours;
          responseCount++;
        }
      }
    });

    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 1.5;

    // Calculate operating time
    const operatingTime = totalTimeHours - downtimeHours;

    // Calculate all metrics
    const failureCount = failures.length;
    const uptimePercent = calculateUptime(totalTimeHours, downtimeHours);
    const downtimePercent = calculateDowntime(totalTimeHours, downtimeHours);
    const mtbf = calculateMTBF(operatingTime, failureCount);
    const mttr = calculateMTTR(totalRepairTime, repairCount);
    const availability = calculateAvailability(mtbf, mttr);
    const failureRate = calculateFailureRate(failureCount, operatingTime);

    // Calculate downtime cost (assuming ₹50,000 revenue loss per hour)
    const revenuePerHour = 50000;
    const downtimeCost = calculateDowntimeCost(downtimeHours, revenuePerHour);

    // Calculate total maintenance costs
    const totalMaintenanceCost = maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      machine_id: machineId,
      period_days: periodDays,
      uptime: {
        percentage: parseFloat(uptimePercent.toFixed(2)),
        hours: parseFloat((totalTimeHours - downtimeHours).toFixed(2)),
        total_hours: totalTimeHours
      },
      downtime: {
        percentage: parseFloat(downtimePercent.toFixed(2)),
        hours: parseFloat(downtimeHours.toFixed(2)),
        total_hours: totalTimeHours
      },
      mtbf: {
        hours: parseFloat(mtbf.toFixed(2)),
        failures: failureCount,
        operating_time: parseFloat(operatingTime.toFixed(2))
      },
      mttr: {
        hours: parseFloat(mttr.toFixed(2)),
        total_repair_time: parseFloat(totalRepairTime.toFixed(2)),
        repairs: repairCount
      },
      availability: {
        percentage: parseFloat((availability * 100).toFixed(2)),
        decimal: parseFloat(availability.toFixed(4))
      },
      failure_rate: {
        rate: parseFloat(failureRate.toFixed(6)),
        failures: failureCount,
        operating_time: parseFloat(operatingTime.toFixed(2))
      },
      response_time: {
        average_hours: parseFloat(avgResponseTime.toFixed(2)),
        appointments_analyzed: responseCount
      },
      costs: {
        downtime_cost: parseFloat(downtimeCost.toFixed(2)),
        maintenance_cost: parseFloat(totalMaintenanceCost.toFixed(2)),
        total_cost: parseFloat((downtimeCost + totalMaintenanceCost).toFixed(2)),
        revenue_per_hour: revenuePerHour
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error calculating machine reliability metrics:', error);
    throw error;
  }
};

/**
 * Get reliability metrics for all machines
 */
exports.getAllMachinesReliabilityMetrics = async (periodDays = 30) => {
  try {
    const machines = await getMachines();
    const metricsPromises = machines.map(machine => 
      this.getMachineReliabilityMetrics(machine.machine_id, periodDays)
    );

    const allMetrics = await Promise.all(metricsPromises);

    // Calculate aggregate metrics
    const totalMachines = allMetrics.length;
    const avgUptime = allMetrics.reduce((sum, m) => sum + m.uptime.percentage, 0) / totalMachines;
    const avgDowntime = allMetrics.reduce((sum, m) => sum + m.downtime.percentage, 0) / totalMachines;
    const avgMTBF = allMetrics.reduce((sum, m) => sum + m.mtbf.hours, 0) / totalMachines;
    const avgMTTR = allMetrics.reduce((sum, m) => sum + m.mttr.hours, 0) / totalMachines;
    const avgAvailability = allMetrics.reduce((sum, m) => sum + m.availability.percentage, 0) / totalMachines;
    const totalDowntimeCost = allMetrics.reduce((sum, m) => sum + m.costs.downtime_cost, 0);
    const totalMaintenanceCost = allMetrics.reduce((sum, m) => sum + m.costs.maintenance_cost, 0);

    return {
      summary: {
        total_machines: totalMachines,
        period_days: periodDays,
        average_uptime: parseFloat(avgUptime.toFixed(2)),
        average_downtime: parseFloat(avgDowntime.toFixed(2)),
        average_mtbf: parseFloat(avgMTBF.toFixed(2)),
        average_mttr: parseFloat(avgMTTR.toFixed(2)),
        average_availability: parseFloat(avgAvailability.toFixed(2)),
        total_downtime_cost: parseFloat(totalDowntimeCost.toFixed(2)),
        total_maintenance_cost: parseFloat(totalMaintenanceCost.toFixed(2)),
        total_cost: parseFloat((totalDowntimeCost + totalMaintenanceCost).toFixed(2))
      },
      machines: allMetrics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error calculating reliability metrics for all machines:', error);
    throw error;
  }
};

module.exports = exports;
