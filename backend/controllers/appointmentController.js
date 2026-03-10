import appointmentService from '../services/appointmentService.js';
import MLServiceClient from '../services/mlService.js';
import logger from '../utils/logger.js';

/**
 * Get all appointments
 */
export const getAllAppointments = async (req, res, next) => {
  try {
    const { machine_id, status, date } = req.query;
    const appointments = await appointmentService.getAllAppointments({ machine_id, status, date });
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    logger.error('Error in getAllAppointments:', error);
    next(error);
  }
};

/**
 * Get machine schedule
 */
export const getMachineSchedule = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { start_date, end_date } = req.query;
    
    const date_range = (start_date && end_date) ? { start_date, end_date } : null;
    const schedule = await MLServiceClient.get_scan_schedule(machineId, date_range);
    
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error(`Error getting schedule for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Create new appointment
 */
export const createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    
    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    logger.error('Error creating appointment:', error);
    next(error);
  }
};

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { new_slot, reason } = req.body;
    
    if (!new_slot) {
      return res.status(400).json({
        success: false,
        error: 'new_slot required'
      });
    }
    
    const result = await MLServiceClient.reschedule_appointment(appointmentId, new_slot);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Appointment rescheduled successfully'
    });
  } catch (error) {
    logger.error(`Error rescheduling appointment ${req.params.appointmentId}:`, error);
    next(error);
  }
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    
    const result = await appointmentService.cancelAppointment(appointmentId, reason || 'Cancelled by request');
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    logger.error(`Error cancelling appointment ${req.params.appointmentId}:`, error);
    next(error);
  }
};

/**
 * Get affected appointments for maintenance window
 */
export const getAffectedAppointments = async (req, res, next) => {
  try {
    const { machine_id, start_time, end_time } = req.query;
    
    if (!machine_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'machine_id, start_time, and end_time required'
      });
    }
    
    const affected = await appointmentService.getAffectedAppointments(machine_id, start_time, end_time);
    
    res.status(200).json({
      success: true,
      data: affected
    });
  } catch (error) {
    logger.error('Error getting affected appointments:', error);
    next(error);
  }
};

/**
 * Bulk reschedule appointments
 */
export const bulkReschedule = async (req, res, next) => {
  try {
    const { appointment_ids, reason } = req.body;
    
    if (!appointment_ids || !Array.isArray(appointment_ids)) {
      return res.status(400).json({
        success: false,
        error: 'appointment_ids array required'
      });
    }
    
    const result = await appointmentService.bulkReschedule(appointment_ids, reason);
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Processed ${result.total_processed} appointments`
    });
  } catch (error) {
    logger.error('Error bulk rescheduling appointments:', error);
    next(error);
  }
};
