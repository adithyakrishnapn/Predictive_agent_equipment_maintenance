const Machine = require('../models/Machine');
const Vendor = require('../models/Vendor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const logger = require('../utils/logger');

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Machine.deleteMany({});
    await Vendor.deleteMany({});
    await Appointment.deleteMany({});
    await User.deleteMany({});

    logger.info('Cleared existing data');

    // Helper function to create maintenance history for different time periods
    const createMaintenanceHistory = (machineType) => {
      const history = [];
      const today = new Date();
      
      // Add maintenance events over the past 30 days
      if (machineType === 'MRI_001') {
        history.push(
          {
            date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
            type: 'Preventive Maintenance',
            vendor: 'Siemens Healthineers',
            cost: 45000,
            description: 'Routine helium refill and coil calibration',
            technician: 'Robert Chen'
          },
          {
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            type: 'Inspection',
            vendor: 'Siemens Healthineers',
            cost: 15000,
            description: 'Quarterly safety inspection',
            technician: 'Robert Chen'
          }
        );
      } else if (machineType === 'MRI_002') {
        history.push(
          {
            date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
            type: 'Repair',
            vendor: 'GE Healthcare Services',
            cost: 85000,
            description: 'RF coil replacement due to intermittent failures',
            technician: 'Michael Torres'
          },
          {
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            type: 'Repair',
            vendor: 'GE Healthcare Services',
            cost: 120000,
            description: 'Gradient system repair - cooling fan failure',
            technician: 'Michael Torres'
          },
          {
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            type: 'Preventive Maintenance',
            vendor: 'GE Healthcare Services',
            cost: 50000,
            description: 'System recalibration after repairs',
            technician: 'Sarah Johnson'
          }
        );
      } else if (machineType === 'CT_001') {
        history.push(
          {
            date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
            type: 'Preventive Maintenance',
            vendor: 'Philips Medical Systems',
            cost: 40000,
            description: 'Tube warm-up and detector calibration',
            technician: 'David Lee'
          }
        );
      } else if (machineType === 'CT_002') {
        history.push(
          {
            date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000), // 27 days ago
            type: 'Repair',
            vendor: 'Siemens Healthineers',
            cost: 150000,
            description: 'Gantry bearing replacement - critical failure',
            technician: 'Robert Chen'
          },
          {
            date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
            type: 'Repair',
            vendor: 'Siemens Healthineers',
            cost: 95000,
            description: 'High voltage generator repair',
            technician: 'Robert Chen'
          },
          {
            date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
            type: 'Repair',
            vendor: 'Siemens Healthineers',
            cost: 75000,
            description: 'Detector array module replacement',
            technician: 'Lisa Park'
          },
          {
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            type: 'Preventive Maintenance',
            vendor: 'Siemens Healthineers',
            cost: 60000,
            description: 'Complete system diagnostic and calibration',
            technician: 'Robert Chen'
          }
        );
      }
      
      return history;
    };

    // Seed Machines
    const machines = await Machine.insertMany([
      {
        machine_id: 'MRI_001',
        type: 'MRI',
        manufacturer: 'Siemens',
        model: 'Magnetom Skyra 3T',
        location: {
          department: 'Radiology',
          room: 'R-101',
          floor: '1'
        },
        installation_date: new Date('2020-05-15'),
        last_maintenance_date: new Date('2025-12-01'),
        status: 'operational',
        current_health_score: 85,
        current_risk_level: 'Monitor',
        maintenance_history: createMaintenanceHistory('MRI_001')
      },
      {
        machine_id: 'MRI_002',
        type: 'MRI',
        manufacturer: 'GE Healthcare',
        model: 'Signa Premier',
        location: {
          department: 'Radiology',
          room: 'R-102',
          floor: '1'
        },
        installation_date: new Date('2019-03-20'),
        last_maintenance_date: new Date('2025-11-15'),
        status: 'operational',
        current_health_score: 75,
        current_risk_level: 'Maintenance',
        maintenance_history: createMaintenanceHistory('MRI_002')
      },
      {
        machine_id: 'CT_001',
        type: 'CT',
        manufacturer: 'Philips',
        model: 'Brilliance iCT',
        location: {
          department: 'Emergency',
          room: 'E-201',
          floor: '2'
        },
        installation_date: new Date('2021-08-10'),
        last_maintenance_date: new Date('2026-01-05'),
        status: 'operational',
        current_health_score: 95,
        current_risk_level: 'Normal',
        maintenance_history: createMaintenanceHistory('CT_001')
      },
      {
        machine_id: 'CT_002',
        type: 'CT',
        manufacturer: 'Siemens',
        model: 'Somatom Definition',
        location: {
          department: 'Radiology',
          room: 'R-103',
          floor: '1'
        },
        installation_date: new Date('2018-11-30'),
        last_maintenance_date: new Date('2025-10-20'),
        status: 'maintenance',
        current_health_score: 45,
        current_risk_level: 'Critical',
        maintenance_history: createMaintenanceHistory('CT_002')
      }
    ]);

    logger.info(`Seeded ${machines.length} machines`);

    // Seed Vendors
    const vendors = await Vendor.insertMany([
      {
        name: 'GE Healthcare Services',
        company: 'GE Healthcare',
        specialization: ['MRI', 'CT', 'General Imaging'],
        contact: {
          email: 'service@gehealthcare.com',
          phone: '+1-800-643-4636',
          address: '3000 N Grandview Blvd, Waukesha, WI 53188'
        },
        service_rate: 60000,
        response_time: 'Same day',
        rating: 4.5,
        availability: [
          { day: 'Monday-Friday', time_slots: ['9:00 AM', '2:00 PM', '4:00 PM'] },
          { day: 'Saturday', time_slots: ['10:00 AM'] }
        ],
        certifications: ['ISO 9001', 'FDA Certified'],
        is_active: true
      },
      {
        name: 'Siemens Healthineers',
        company: 'Siemens Healthcare',
        specialization: ['MRI', 'CT'],
        contact: {
          email: 'support@siemens-healthineers.com',
          phone: '+1-888-826-9702',
          address: '40 Liberty Blvd, Malvern, PA 19355'
        },
        service_rate: 70000,
        response_time: '24 hours',
        rating: 4.7,
        availability: [
          { day: 'Monday-Friday', time_slots: ['8:00 AM', '11:00 AM', '3:00 PM'] }
        ],
        certifications: ['ISO 13485', 'CE Mark'],
        is_active: true
      },
      {
        name: 'Philips Medical Systems',
        company: 'Philips Healthcare',
        specialization: ['CT', 'General Imaging'],
        contact: {
          email: 'service@philips.com',
          phone: '+1-800-722-9377',
          address: '3000 Minuteman Rd, Andover, MA 01810'
        },
        service_rate: 65000,
        response_time: 'Next day',
        rating: 4.3,
        availability: [
          { day: 'Monday-Friday', time_slots: ['9:00 AM', '1:00 PM'] }
        ],
        certifications: ['ISO 9001', 'FDA Certified'],
        is_active: true
      }
    ]);

    logger.info(`Seeded ${vendors.length} vendors`);

    // Seed Appointments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.insertMany([
      {
        appointment_id: 'APT000001',
        machine_id: 'MRI_001',
        patient: {
          name: 'John Doe',
          id: 'P12345',
          contact: '+1-555-0101'
        },
        scheduled_time: new Date(tomorrow.setHours(10, 0, 0, 0)),
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
          contact: '+1-555-0102'
        },
        scheduled_time: new Date(tomorrow.setHours(11, 0, 0, 0)),
        duration: 30,
        scan_type: 'Chest CT',
        priority: 'urgent',
        status: 'scheduled',
        referring_doctor: 'Dr. Johnson',
        department: 'Emergency'
      }
    ]);

    logger.info(`Seeded ${appointments.length} appointments`);

    // Seed Users
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@hospital.com',
        password: 'admin123',
        role: 'admin',
        department: 'IT'
      },
      {
        name: 'John Technician',
        email: 'tech@hospital.com',
        password: 'tech123',
        role: 'technician',
        department: 'Maintenance'
      },
      {
        name: 'Dr. Sarah Wilson',
        email: 'doctor@hospital.com',
        password: 'doctor123',
        role: 'doctor',
        department: 'Radiology'
      }
    ]);

    logger.info(`Seeded ${users.length} users`);
    logger.info('Database seeding completed successfully!');

    return {
      machines: machines.length,
      vendors: vendors.length,
      appointments: appointments.length,
      users: users.length
    };

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seedDatabase;
