import { promises as fs } from 'fs';
import path from 'path';
import moment from 'moment';
import logger from '../utils/logger.js';
import emailService from './emailService.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APPOINTMENTS_FILE = path.join(__dirname, '../data/appointments.json');

class AppointmentService {
  constructor() {
    this.ensureDataDirectory();
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      await this.initializeAppointmentsFile();
    }
  }

  /**
   * Initialize appointments file with sample data
   */
  async initializeAppointmentsFile() {
    const sampleAppointments = {
      appointments: [
        {
          appointment_id: 'APT000001',
          machine_id: 'MRI_001',
          patient: {
            name: 'John Doe',
            id: 'P12345',
            email: 'john.doe@email.com',
            contact: '+1-555-0101'
          },
          scheduled_time: moment().add(1, 'day').set({ hour: 10, minute: 0 }).toISOString(),
          duration: 45,
          scan_type: 'Brain MRI',
          priority: 'routine',
          status: 'scheduled',
          referring_doctor: 'Dr. Smith',
          department: 'Neurology'
        },
        {
          appointment_id: 'APT000002',
          machine_id: 'CT_001',
          patient: {
            name: 'Jane Smith',
            id: 'P12346',
            email: 'jane.smith@email.com',
            contact: '+1-555-0102'
          },
          scheduled_time: moment().add(1, 'day').set({ hour: 11, minute: 0 }).toISOString(),
          duration: 30,
          scan_type: 'Chest CT',
          priority: 'urgent',
          status: 'scheduled',
          referring_doctor: 'Dr. Johnson',
          department: 'Emergency'
        },
        {
          appointment_id: 'APT000003',
          machine_id: 'MRI_001',
          patient: {
            name: 'Bob Wilson',
            id: 'P12347',
            email: 'bob.wilson@email.com',
            contact: '+1-555-0103'
          },
          scheduled_time: moment().add(2, 'days').set({ hour: 14, minute: 0 }).toISOString(),
          duration: 60,
          scan_type: 'Full Body MRI',
          priority: 'routine',
          status: 'scheduled',
          referring_doctor: 'Dr. Lee',
          department: 'Oncology'
        }
      ]
    };

    await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify(sampleAppointments, null, 2));
    logger.info('Appointments file initialized with sample data');
  }

  /**
   * Read appointments from JSON file
   */
  async readAppointments() {
    try {
      const data = await fs.readFile(APPOINTMENTS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.warn('Appointments file not found, initializing...');
      await this.initializeAppointmentsFile();
      return await this.readAppointments();
    }
  }

  /**
   * Write appointments to JSON file
   */
  async writeAppointments(data) {
    await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * Get all appointments
   */
  async getAllAppointments(filters = {}) {
    const data = await this.readAppointments();
    let appointments = data.appointments;

    // Apply filters
    if (filters.machine_id) {
      appointments = appointments.filter(apt => apt.machine_id === filters.machine_id);
    }
    if (filters.status) {
      appointments = appointments.filter(apt => apt.status === filters.status);
    }
    if (filters.date) {
      const targetDate = moment(filters.date).format('YYYY-MM-DD');
      appointments = appointments.filter(apt => 
        moment(apt.scheduled_time).format('YYYY-MM-DD') === targetDate
      );
    }

    return appointments;
  }

  /**
   * Get machine schedule
   */
  async getMachineSchedule(machine_id, date_range = null) {
    const data = await this.readAppointments();
    let appointments = data.appointments.filter(apt => 
      apt.machine_id === machine_id && apt.status === 'scheduled'
    );

    // Filter by date range if provided
    if (date_range && date_range.start_date && date_range.end_date) {
      const startDate = moment(date_range.start_date);
      const endDate = moment(date_range.end_date);
      
      appointments = appointments.filter(apt => {
        const aptDate = moment(apt.scheduled_time);
        return aptDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    return {
      machine_id,
      date_range: date_range || 'all',
      total_appointments: appointments.length,
      appointments: appointments.map(apt => ({
        appointment_id: apt.appointment_id,
        patient_name: apt.patient.name,
        patient_id: apt.patient.id,
        scheduled_time: apt.scheduled_time,
        scan_type: apt.scan_type,
        duration: apt.duration,
        priority: apt.priority,
        department: apt.department
      }))
    };
  }

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData) {
    const data = await this.readAppointments();
    
    // Generate new appointment ID
    const lastId = data.appointments.length > 0 
      ? parseInt(data.appointments[data.appointments.length - 1].appointment_id.replace('APT', ''))
      : 0;
    const newId = `APT${String(lastId + 1).padStart(6, '0')}`;

    const newAppointment = {
      appointment_id: newId,
      ...appointmentData,
      status: appointmentData.status || 'scheduled',
      created_at: new Date().toISOString()
    };

    data.appointments.push(newAppointment);
    await this.writeAppointments(data);

    logger.info(`Appointment created: ${newId}`);
    return newAppointment;
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(appointment_id, new_slot, reason = 'Equipment maintenance') {
    const data = await this.readAppointments();
    const appointmentIndex = data.appointments.findIndex(apt => apt.appointment_id === appointment_id);

    if (appointmentIndex === -1) {
      throw new Error(`Appointment ${appointment_id} not found`);
    }

    const appointment = data.appointments[appointmentIndex];
    const oldTime = appointment.scheduled_time;

    // Update appointment
    appointment.scheduled_time = new_slot;
    appointment.status = 'rescheduled';
    appointment.reschedule_history = appointment.reschedule_history || [];
    appointment.reschedule_history.push({
      old_time: oldTime,
      new_time: new_slot,
      reason,
      rescheduled_at: new Date().toISOString()
    });

    data.appointments[appointmentIndex] = appointment;
    await this.writeAppointments(data);

    // Send notification to patient if email available
    if (appointment.patient.email) {
      try {
        await emailService.notifyPatientReschedule(
          appointment.patient.email,
          {
            patient_name: appointment.patient.name,
            original_time: moment(oldTime).format('MMMM DD, YYYY [at] h:mm A'),
            new_time: moment(new_slot).format('MMMM DD, YYYY [at] h:mm A'),
            scan_type: appointment.scan_type,
            machine_id: appointment.machine_id
          },
          reason
        );
      } catch (emailError) {
        logger.error('Failed to send patient notification:', emailError.message);
      }
    }

    logger.info(`Appointment ${appointment_id} rescheduled from ${oldTime} to ${new_slot}`);

    return {
      success: true,
      appointment_id,
      old_time: oldTime,
      new_time: new_slot,
      patient: appointment.patient.name,
      notification_sent: !!appointment.patient.email,
      message: 'Appointment rescheduled successfully'
    };
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointment_id, reason) {
    const data = await this.readAppointments();
    const appointmentIndex = data.appointments.findIndex(apt => apt.appointment_id === appointment_id);

    if (appointmentIndex === -1) {
      throw new Error(`Appointment ${appointment_id} not found`);
    }

    data.appointments[appointmentIndex].status = 'cancelled';
    data.appointments[appointmentIndex].cancellation_reason = reason;
    data.appointments[appointmentIndex].cancelled_at = new Date().toISOString();

    await this.writeAppointments(data);

    logger.info(`Appointment ${appointment_id} cancelled`);
    return { success: true, appointment_id, status: 'cancelled' };
  }

  /**
   * Get appointments affected by maintenance window
   */
  async getAffectedAppointments(machine_id, maintenance_start, maintenance_end) {
    const data = await this.readAppointments();
    
    const startMoment = moment(maintenance_start);
    const endMoment = moment(maintenance_end);

    const affected = data.appointments.filter(apt => {
      if (apt.machine_id !== machine_id || apt.status !== 'scheduled') {
        return false;
      }

      const aptTime = moment(apt.scheduled_time);
      return aptTime.isBetween(startMoment, endMoment, null, '[]');
    });

    return {
      machine_id,
      maintenance_window: {
        start: maintenance_start,
        end: maintenance_end
      },
      affected_count: affected.length,
      affected_appointments: affected
    };
  }

  /**
   * Bulk reschedule appointments
   */
  async bulkReschedule(appointment_ids, reason = 'Equipment maintenance') {
    const results = [];

    for (const apt_id of appointment_ids) {
      try {
        // Find next available slot (simple logic: add 1 day)
        const data = await this.readAppointments();
        const appointment = data.appointments.find(apt => apt.appointment_id === apt_id);
        
        if (appointment) {
          const newSlot = moment(appointment.scheduled_time).add(1, 'day').toISOString();
          const result = await this.rescheduleAppointment(apt_id, newSlot, reason);
          results.push(result);
        }
      } catch (error) {
        logger.error(`Error rescheduling ${apt_id}:`, error.message);
        results.push({ success: false, appointment_id: apt_id, error: error.message });
      }
    }

    return {
      total_processed: appointment_ids.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

export default new AppointmentService();
