const nodemailer = require('nodemailer');

const sendCandidateEmail = async (req, res) => {
  try {
    const { to, subject, body, sendMeCopy } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'to, subject, and body are required.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const senderEmail = process.env.EMAIL_USERNAME;

    const mailOptions = {
      from: `"iTalentConnect CRM" <${senderEmail}>`,
      to,
      subject,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8eaf6;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#3f51b5,#5c6bc0);padding:24px 32px;">
            <h2 style="margin:0;color:#fff;font-size:20px;">iTalentConnect CRM</h2>
          </div>
          <div style="padding:32px;color:#1e293b;font-size:14px;line-height:1.7;">
            ${body.replace(/\n/g, '<br/>')}
          </div>
          <div style="background:#f8fafc;border-top:1px solid #e8eaf6;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">This email was sent via iTalentConnect CRM</p>
          </div>
        </div>
      `,
    };

    // Send to candidate
    await transporter.sendMail(mailOptions);

    // Optionally send copy to sender
    if (sendMeCopy && senderEmail) {
      await transporter.sendMail({
        ...mailOptions,
        to: senderEmail,
        subject: `[Copy] ${subject}`,
      });
    }

    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Send candidate email error:', error);
    res.status(500).json({ message: 'Failed to send email.', error: error.message });
  }
};

module.exports = { sendCandidateEmail };
