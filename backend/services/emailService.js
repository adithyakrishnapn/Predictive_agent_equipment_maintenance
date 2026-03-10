const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send email to vendor for service scheduling
   */
  async contactServiceVendor(machine_id, fault_summary, urgency, preferred_window) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.VENDOR_EMAIL,
        subject: `[${urgency.toUpperCase()}] Service Request - ${machine_id}`,
        html: `
          <h2>Equipment Service Request</h2>
          <p><strong>Machine ID:</strong> ${machine_id}</p>
          <p><strong>Urgency Level:</strong> <span style="color: ${urgency === 'critical' ? 'red' : 'orange'};">${urgency.toUpperCase()}</span></p>
          <p><strong>Fault Summary:</strong> ${fault_summary}</p>
          <p><strong>Preferred Service Window:</strong> ${preferred_window}</p>
          <hr>
          <p>Please schedule a technician at the earliest convenience.</p>
          <p><em>Sent from Hospital Predictive Maintenance System</em></p>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Vendor email sent for ${machine_id}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        vendor_email: process.env.VENDOR_EMAIL,
        scheduled_window: preferred_window
      };
    } catch (error) {
      logger.error('Error sending vendor email:', error);
      throw error;
    }
  }

  /**
   * Send alert to engineering team with detailed risk report
   */
  async notifyEngineeringTeam(machine_id, risk_report, recommended_action) {
    try {
      const {
        predicted_failure_type,
        confidence_level,
        estimated_cost_prevention,
        estimated_cost_breakdown,
        impact_on_patients,
        health_score,
        risk_level
      } = risk_report;

      const costSavings = estimated_cost_breakdown - estimated_cost_prevention;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ENGINEERING_TEAM_EMAIL,
        cc: process.env.ADMIN_EMAIL,
        subject: `⚠️ [${risk_level}] Alert - ${machine_id} Requires Attention`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #d32f2f;">Predictive Maintenance Alert</h2>
            
            <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <h3 style="margin-top: 0;">Machine: ${machine_id}</h3>
              <p><strong>Risk Level:</strong> <span style="color: red; font-size: 18px;">${risk_level}</span></p>
              <p><strong>Health Score:</strong> ${health_score}/100</p>
            </div>

            <h3>Failure Prediction</h3>
            <ul>
              <li><strong>Predicted Failure Type:</strong> ${predicted_failure_type}</li>
              <li><strong>Confidence Level:</strong> ${confidence_level}%</li>
              <li><strong>Recommended Action:</strong> ${recommended_action}</li>
            </ul>

            <h3>Cost Analysis</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Preventive Maintenance Cost</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">₹${estimated_cost_prevention.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Full Breakdown Cost</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">₹${estimated_cost_breakdown.toLocaleString()}</td>
              </tr>
              <tr style="background-color: #e8f5e9;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Potential Savings</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; color: green; font-weight: bold;">₹${costSavings.toLocaleString()}</td>
              </tr>
            </table>

            <h3>Patient Impact</h3>
            <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
              <p><strong>Affected Appointments:</strong> ${impact_on_patients.affected_appointments}</p>
              <p><strong>Patients to Reschedule:</strong> ${impact_on_patients.patients_count}</p>
              <p><strong>Time Period:</strong> ${impact_on_patients.time_period}</p>
            </div>

            <h3>Immediate Actions Required</h3>
            <ol>
              <li>${recommended_action}</li>
              <li>Contact service vendor immediately</li>
              <li>Reschedule affected patient appointments</li>
              <li>Prepare alternate equipment backup plan</li>
            </ol>

            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              <em>This is an automated alert from the Hospital Predictive Maintenance System.<br>
              Generated on: ${new Date().toLocaleString()}</em>
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Engineering team notified for ${machine_id}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        recipients: [process.env.ENGINEERING_TEAM_EMAIL, process.env.ADMIN_EMAIL],
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error sending engineering team notification:', error);
      throw error;
    }
  }

  /**
   * Send appointment rescheduling notification to patient
   */
  async notifyPatientReschedule(patient_email, appointment_details, reason) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: patient_email,
        subject: 'Appointment Rescheduling Notification',
        html: `
          <h2>Appointment Rescheduling Notice</h2>
          <p>Dear ${appointment_details.patient_name},</p>
          <p>We need to reschedule your appointment due to equipment maintenance.</p>
          
          <h3>Original Appointment:</h3>
          <ul>
            <li><strong>Date & Time:</strong> ${appointment_details.original_time}</li>
            <li><strong>Scan Type:</strong> ${appointment_details.scan_type}</li>
            <li><strong>Machine:</strong> ${appointment_details.machine_id}</li>
          </ul>

          <h3>Rescheduled To:</h3>
          <ul>
            <li><strong>New Date & Time:</strong> ${appointment_details.new_time}</li>
            <li><strong>Machine:</strong> ${appointment_details.new_machine || appointment_details.machine_id}</li>
          </ul>

          <p><strong>Reason:</strong> ${reason}</p>
          
          <p>We apologize for any inconvenience. If you have any questions, please contact us.</p>
          <p><em>Hospital Radiology Department</em></p>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Patient rescheduling notification sent: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Error sending patient notification:', error);
      throw error;
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
