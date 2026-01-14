const nodemailer = require('nodemailer');

// Create a transporter using Ethereal Email (for testing)
// In production, you would use SendGrid, Gmail, AWS SES, etc.
const createTransporter = async () => {
  // Check if we have production credentials
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    const port = process.env.EMAIL_PORT || 587;
    const isSecure = process.env.EMAIL_SECURE === 'true' || port == 465;

    console.log(`Using Production Email (${process.env.EMAIL_HOST})`);
    
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
      console.log('Production email credentials not found, falling back to Ethereal');
  }

  // Fallback to Ethereal for development
  const testAccount = await nodemailer.createTestAccount();

  console.log('Using Ethereal Email for testing');
  console.log('User:', testAccount.user);
  console.log('Pass:', testAccount.pass);

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendBookingConfirmation = async (booking, user, flight) => {
  try {
    const transporter = await createTransporter();

    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP Connection Verified');

    const info = await transporter.sendMail({
      from: `"SkyBook Airlines" <${process.env.EMAIL_USER}>`,
      to: user.email, // In production this goes to the real user
      subject: `Booking Confirmation - ${flight.flightNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Booking Confirmed! ✈️</h1>
          <p>Hi ${user.name},</p>
          <p>Thank you for booking with SkyBook. Your flight details are below:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">${flight.airline} (${flight.flightNumber})</h2>
            <p><strong>From:</strong> ${flight.source}</p>
            <p><strong>To:</strong> ${flight.destination}</p>
            <p><strong>Date:</strong> ${new Date(flight.departureTime).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(flight.departureTime).toLocaleTimeString()}</p>
            <hr style="border: 1px solid #e5e7eb; margin: 15px 0;">
            <p><strong>Seats:</strong> ${booking.seatNumbers.join(', ')}</p>
            <p><strong>Total Paid:</strong> ₹${booking.totalPrice}</p>
            <p><strong>Booking ID:</strong> ${booking._id}</p>
          </div>

          <p>Have a safe flight!</p>
          <p style="color: #6b7280; font-size: 12px;">SkyBook Team</p>
        </div>
      `,
    });

    console.log('Message sent: %s', info.messageId);
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Email Config:', {
      host: process.env.EMAIL_HOST,
      user: process.env.EMAIL_USER,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE
    });
  }
};

module.exports = {
  sendBookingConfirmation,
};
