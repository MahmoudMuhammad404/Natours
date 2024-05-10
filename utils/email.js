const { Resend } = require('resend');

const resend = new Resend(process.env.EMAIL_API_KEY);

const sendEmail = async (email,msg) => {
  try {
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email], // Assuming 'email' is the recipient's email address. Note the array format for the 'to' field.
      subject: 'Your password reset token (valid for 10 min)',
      html: msg,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error('There was an error sending the email. Try again later!');
    }

   // console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error encountered:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

module.exports = sendEmail;

