import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();
let transporter;
let usingEthereal = false;

// Create reusable transporter based on environment
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  console.log('✅ SMTP configuration loaded for sending emails');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Fallback: create an Ethereal account for development/testing
  // This will not send real emails but provides preview URLs
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  usingEthereal = true;
}

export const sendBookingConfirmationEmail = async (booking) => {
  const formattedDate = format(new Date(booking.date), 'MMMM d, yyyy');
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@salonbliss.local',
    to: booking.email,
    subject: 'Booking Confirmation - Salon Bliss',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5c4033;">Your Booking is Confirmed!</h2>
        
        <div style="background-color: #f7f3e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #5c4033; margin-top: 0;">Booking Details</h3>
          <p><strong>Service:</strong> ${booking.service.name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${booking.timeSlot}</p>
          <p><strong>Booking ID:</strong> ${booking._id}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #5c4033;">
          <h4 style="color: #5c4033; margin-top: 0;">Important Information</h4>
          <ul style="padding-left: 20px;">
            <li>Please arrive 10 minutes before your appointment</li>
            <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
            <li>Our address: 123 Salon Street, Beauty City</li>
          </ul>
        </div>

        <p style="margin-top: 20px;">
          If you have any questions, please don't hesitate to contact us at ${process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@salonbliss.local'}
        </p>

        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>Thank you for choosing Salon Bliss!</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully:', info.messageId || 'no-id');
    if (usingEthereal) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error - email failure shouldn't break the booking process
  }
};

export const sendBookingReminder = async (booking) => {
  const formattedDate = format(new Date(booking.date), 'MMMM d, yyyy');
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@salonbliss.local',
    to: booking.email,
    subject: 'Upcoming Appointment Reminder - Salon Bliss',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5c4033;">Appointment Reminder</h2>
        
        <div style="background-color: #f7f3e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>This is a friendly reminder about your upcoming appointment:</p>
          
          <div style="margin: 20px 0;">
            <p><strong>Service:</strong> ${booking.service.name}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
          </div>

          <p>We're looking forward to seeing you!</p>
        </div>

        <p style="color: #666;">
          Need to reschedule? Please contact us at least 24 hours before your appointment.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Reminder email sent successfully');
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
};

// Schedule reminders for upcoming bookings
export const scheduleBookingReminder = async (booking) => {
  const appointmentTime = new Date(booking.date + ' ' + booking.timeSlot);
  const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
  
  const now = new Date();
  if (reminderTime > now) {
    const delay = reminderTime.getTime() - now.getTime();
    setTimeout(() => sendBookingReminder(booking), delay);
  }
};