const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// GET all appointments
router.get('/', appointmentController.getAllAppointments);

// GET machine schedule
router.get('/schedule/:machineId', appointmentController.getMachineSchedule);

// GET affected appointments (for maintenance planning)
router.get('/affected', appointmentController.getAffectedAppointments);

// POST create new appointment
router.post('/', appointmentController.createAppointment);

// PUT reschedule appointment
router.put('/:appointmentId/reschedule', appointmentController.rescheduleAppointment);

// PUT cancel appointment
router.put('/:appointmentId/cancel', appointmentController.cancelAppointment);

// POST bulk reschedule appointments
router.post('/bulk-reschedule', appointmentController.bulkReschedule);

module.exports = router;
