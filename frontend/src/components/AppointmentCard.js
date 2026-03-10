import React, { useState } from 'react';
import '../styles/AppointmentCard.css';

export default function AppointmentCard({ appointment, onReschedule }) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newSlot, setNewSlot] = useState('');

  const handleReschedule = () => {
    if (newSlot) {
      onReschedule(newSlot);
      setShowReschedule(false);
      setNewSlot('');
    }
  };

  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <h4>{appointment.patient_name}</h4>
        <span className={`status-badge ${appointment.status?.toLowerCase()}`}>
          {appointment.status}
        </span>
      </div>

      <div className="appointment-details">
        <p><strong>Appointment ID:</strong> {appointment.appointment_id}</p>
        <p><strong>Machine:</strong> {appointment.machine_id}</p>
        <p><strong>Scheduled:</strong> {new Date(appointment.scheduled_date).toLocaleString()}</p>
        <p><strong>Scan Type:</strong> {appointment.scan_type}</p>
        <p><strong>Duration:</strong> {appointment.duration_minutes} minutes</p>
      </div>

      {!showReschedule ? (
        <button
          className="btn btn-secondary"
          onClick={() => setShowReschedule(true)}
        >
          Reschedule
        </button>
      ) : (
        <div className="reschedule-form">
          <input
            type="datetime-local"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            className="reschedule-input"
          />
          <div className="form-buttons">
            <button
              className="btn btn-primary"
              onClick={handleReschedule}
              disabled={!newSlot}
            >
              Confirm
            </button>
            <button
              className="btn btn-cancel"
              onClick={() => setShowReschedule(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
