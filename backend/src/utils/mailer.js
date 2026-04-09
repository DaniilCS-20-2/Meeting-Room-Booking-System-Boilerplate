const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

async function sendVerificationCode(toEmail, code) {
  const mailOptions = {
    from: `"Møteromsbooking" <${env.smtpUser}>`,
    to: toEmail,
    subject: "Din stadfestingskode",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1f2937">Stadfestingskode</h2>
        <p style="color:#374151;font-size:15px">Bruk denne koden for å stadfeste handlinga di:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
          <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#111827">${code}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">Koden er gyldig i 15 minutt. Ikkje del han med nokon.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Verification code sent to ${toEmail}`);
  } catch (err) {
    console.error(`[MAIL] Failed to send to ${toEmail}:`, err.message);
    throw err;
  }
}

module.exports = { sendVerificationCode };
