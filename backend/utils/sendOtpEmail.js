const nodemailer = require('nodemailer');

const sendOtpEmail = async (to, otp, userName, userRole) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const roleColor = {
      admin:      '#667eea',
      hr:         '#3f51b5',
      sales:      '#10b981',
      teamleader: '#f59e0b',
    }[userRole?.toLowerCase()] || '#3f51b5';

    const roleLabel = userRole
      ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
      : 'User';

    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const mailOptions = {
      from: `"iTalentConnect CRM" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject: `🔐 Login OTP — ${userName} (${roleLabel})`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Login</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f8;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(63,81,181,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3f51b5 0%,#5c6bc0 60%,#7986cb 100%);padding:36px 40px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                      <span style="font-size:32px;line-height:64px;">🔐</span>
                    </div>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                      Login Verification
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                      iTalentConnect CRM
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 40px;">
              <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
                ⚠️ A login attempt was made for <strong>${userName}</strong> with role <strong>${roleLabel}</strong> at ${now}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 8px;font-size:15px;color:#334155;">
                Hello <strong style="color:#3f51b5;">${userName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
                Someone is trying to log in to your CRM account. Use the OTP below to complete the login. 
                This code is valid for <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="background:linear-gradient(135deg,#e8eaf6,#f3f4fd);border:2px solid #c5cae9;border-radius:16px;padding:28px 40px;display:inline-block;">
                      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9fa8da;text-transform:uppercase;letter-spacing:0.1em;">
                        Your One-Time Password
                      </p>
                      <div style="display:flex;gap:12px;justify-content:center;">
                        ${otp.split('').map(digit => `
                        <span style="
                          display:inline-block;
                          width:52px;height:64px;
                          background:#ffffff;
                          border:2px solid #c5cae9;
                          border-radius:12px;
                          font-size:32px;font-weight:900;
                          color:#3f51b5;
                          text-align:center;line-height:64px;
                          box-shadow:0 4px 12px rgba(63,81,181,0.12);
                        ">${digit}</span>`).join('')}
                      </div>
                      <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">
                        ⏱ Expires in 10 minutes
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48%" style="background:#f8fafc;border:1px solid #e8eaf6;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9fa8da;text-transform:uppercase;letter-spacing:0.08em;">User</p>
                    <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">${userName}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#f8fafc;border:1px solid #e8eaf6;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9fa8da;text-transform:uppercase;letter-spacing:0.08em;">Role</p>
                    <p style="margin:0;">
                      <span style="background:${roleColor}20;color:${roleColor};font-size:13px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid ${roleColor}40;">
                        ${roleLabel}
                      </span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;">
                <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
                  🚫 <strong>Not you?</strong> If you did not attempt to log in, please contact your administrator immediately. 
                  Do not share this OTP with anyone.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e8eaf6;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#3f51b5;">iTalentConnect CRM</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                This is an automated security email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

module.exports = sendOtpEmail;
