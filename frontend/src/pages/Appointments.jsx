import { useState, useEffect } from 'react';
import '../styles/Appointments.css';

export default function Appointments({ apiUrl }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/appointments`);
      const data = await res.json();
      setAppointments(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD HH:MM):', '2026-03-20 14:00');
    if (!newDate) return;

    try {
      const res = await fetch(`${apiUrl}/appointments/${appointmentId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_slot: new Date(newDate).toISOString(),
          reason: 'Maintenance window'
        })
      });

      if (res.ok) {
        alert('Appointment rescheduled successfully');
        fetchAppointments();
      }
    } catch (err) {
      alert('Error rescheduling appointment: ' + err.message);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const res = await fetch(`${apiUrl}/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Equipment maintenance' })
      });

      if (res.ok) {
        alert('Appointment cancelled successfully');
        fetchAppointments();
      }
    } catch (err) {
      alert('Error cancelling appointment: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Loading appointments...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');
  const rescheduledAppointments = appointments.filter(a => a.status === 'rescheduled');

  return (
    <div className="appointments">
      <div className="appointments-header">
        <h2>Appointment Management</h2>
        <div className="appointment-tabs">
          <div className="tab-info">
            <span className="tab-badge upcoming">{upcomingAppointments.length}</span> Upcoming
            <span className="tab-badge rescheduled">{rescheduledAppointments.length}</span> Rescheduled
            <span className="tab-badge cancelled">{cancelledAppointments.length}</span> Cancelled
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="appointments-section">
        <h3>Upcoming Appointments</h3>
        {upcomingAppointments.length === 0 ? (
          <p className="no-data">No upcoming appointments</p>
        ) : (
          <div className="appointments-table">
            <div className="table-header">
              <div className="col col-id">Appointment ID</div>
              <div className="col col-patient">Patient / Doctor</div>
              <div className="col col-machine">Equipment</div>
              <div className="col col-time">Scheduled Time</div>
              <div className="col col-type">Scan Type</div>
              <div className="col col-actions">Actions</div>
            </div>
            {upcomingAppointments.map((apt, idx) => (
              <div key={apt._id || `upcoming-${idx}`} className="table-row">
                <div className="col col-id">{apt._id}</div>
                <div className="col col-patient">
                  <div className="patient-name">{apt.patient?.name || 'N/A'}</div>
                  <div className="doctor">Dr. {apt.referring_doctor || 'N/A'}</div>
                </div>
                <div className="col col-machine">{apt.machine_id}</div>
                <div className="col col-time">
                  <strong>{new Date(apt.scheduled_time).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</strong>
                </div>
                <div className="col col-type">{apt.scan_type || 'N/A'}</div>
                <div className="col col-actions">
                  <button 
                    className="action-btn secondary"
                    onClick={() => handleReschedule(apt._id)}
                  >
                    Reschedule
                  </button>
                  <button 
                    className="action-btn danger"
                    onClick={() => handleCancel(apt._id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rescheduled Appointments */}
      {rescheduledAppointments.length > 0 && (
        <div className="appointments-section">
          <h3>Rescheduled Appointments</h3>
          <div className="appointments-table">
            <div className="table-header">
              <div className="col col-id">Appointment ID</div>
              <div className="col col-patient">Patient</div>
              <div className="col col-machine">Equipment</div>
              <div className="col col-time">New Time</div>
              <div className="col col-reason">Reason</div>
            </div>
            {rescheduledAppointments.map((apt, idx) => (
              <div key={apt._id || `rescheduled-${idx}`} className="table-row rescheduled">
                <div className="col col-id">{apt._id}</div>
                <div className="col col-patient">{apt.patient?.name || 'N/A'}</div>
                <div className="col col-machine">{apt.machine_id}</div>
                <div className="col col-time">
                  {new Date(apt.new_scheduled_time || apt.scheduled_time).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="col col-reason">{apt.reschedule_reason || 'N/A'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Appointments */}
      {cancelledAppointments.length > 0 && (
        <div className="appointments-section">
          <h3>Cancelled Appointments</h3>
          <div className="appointments-table">
            <div className="table-header">
              <div className="col col-id">Appointment ID</div>
              <div className="col col-patient">Patient</div>
              <div className="col col-machine">Equipment</div>
              <div className="col col-time">Was Scheduled</div>
              <div className="col col-reason">Cancellation Reason</div>
            </div>
            {cancelledAppointments.map((apt, idx) => (
              <div key={apt._id || `cancelled-${idx}`} className="table-row cancelled">
                <div className="col col-id">{apt._id}</div>
                <div className="col col-patient">{apt.patient?.name || 'N/A'}</div>
                <div className="col col-machine">{apt.machine_id}</div>
                <div className="col col-time">
                  {new Date(apt.scheduled_time).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="col col-reason">{apt.cancellation_reason || 'N/A'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Recommendations */}
      <div className="recommendations-section">
        <h3>📋 Appointment Management Tips</h3>
        <ul>
          <li>Reschedule appointments well in advance to notify patients</li>
          <li>Group maintenance windows to minimize total patient impact</li>
          <li>Prioritize critical equipment maintenance during low-volume periods</li>
          <li>Monitor appointment changes and ensure adequate patient notification</li>
        </ul>
      </div>
    </div>
  );
}
