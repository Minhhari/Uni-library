const nodemailer = require('nodemailer');

/**
 * Tạo transporter SMTP (Gmail)
 * Yêu cầu bật "App Password" trong Google Account nếu dùng Gmail.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Gửi OTP xác thực email
 */
const sendVerificationOTP = async (email, name, otp) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Uni Library" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '📚 Verify Your Email - Uni Library',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2d6a9f); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📚 Uni Library</h1>
          <p style="color: #b3d1f0; margin: 5px 0 0;">Email Verification</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
          <h2 style="color: #1e3a5f;">Hello, ${name}!</h2>
          <p style="color: #555; font-size: 16px;">
            Thank you for registering. Please use the OTP below to verify your email address:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="
              background: #1e3a5f;
              color: white;
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 15px 30px;
              border-radius: 8px;
              display: inline-block;
            ">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">
            This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            If you did not register for Uni Library, please ignore this email.
          </p>
        </div>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Gửi OTP reset password
 */
const sendPasswordResetOTP = async (email, name, otp) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Uni Library" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Reset Your Password - Uni Library',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7b2d8b, #c0392b); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📚 Uni Library</h1>
          <p style="color: #f0b3d1; margin: 5px 0 0;">Password Reset</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
          <h2 style="color: #7b2d8b;">Hello, ${name}!</h2>
          <p style="color: #555; font-size: 16px;">
            You requested a password reset. Use the OTP below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="
              background: #7b2d8b;
              color: white;
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 15px 30px;
              border-radius: 8px;
              display: inline-block;
            ">${otp}</span>
          </div>
          <p style="color: #888; font-size: 14px; text-align: center;">
            This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            If you did not request a password reset, please ignore this email and secure your account.
          </p>
        </div>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationOTP, sendPasswordResetOTP };
