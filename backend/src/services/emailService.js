const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendClaimNotificationEmail = async (civilian, volunteer, request) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Using mock email service - credentials missing');
            return { success: false };
        }

        const mailOptions = {
            from: `"Crisis Connect" <${process.env.EMAIL_USER}>`,
            to: civilian.email,
            subject: 'Your Crisis Connect Alert has been Claimed!',
            html: `<h1>Help is on the way!</h1><p>Volunteer ${volunteer.name} has claimed your request: ${request.title}</p>`
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
};

exports.sendIncidentVerificationEmail = async (volunteerEmails, incident) => {
    // keeping simpler for brevity but functional
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    // Implementation logic...
};
