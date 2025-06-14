// backend/server.js
const express = require('express');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 OTP requests per windowMs
  message: {
    error: 'Too many OTP requests, please try again later.'
  }
});

// In-memory storage for OTPs (use Redis or database in production)
const otpStorage = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send OTP using SendGrid
const sendOtpEmail = async (email, otp) => {
  const msg = {
    to: email,
    from: {
      email: process.env.FROM_EMAIL, // Must be verified in SendGrid
      name: 'MediCare Clinic'
    },
    subject: 'MediCare Clinic - Login Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <div style="color: white; font-size: 36px;">🏥</div>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">MediCare Clinic</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Patient Management System</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; background-color: white; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">Verification Required</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
              Hello Doctor,<br>
              Please use the verification code below to securely access your account.
            </p>
          </div>
          
          <!-- OTP Box -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
            <p style="color: rgba(255,255,255,0.9); margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">Your Verification Code</p>
            <div style="background: rgba(255,255,255,0.15); border: 2px dashed rgba(255,255,255,0.5); border-radius: 10px; padding: 20px; margin: 0 auto; max-width: 250px;">
              <h1 style="color: white; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace; font-weight: bold;">${otp}</h1>
            </div>
          </div>
          
          <!-- Instructions -->
          <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 5px; margin: 30px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Security Instructions:</h3>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>This code will expire in <strong>10 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
              <li>For security, this code can only be used once</li>
            </ul>
          </div>
          
          <!-- Support -->
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 14px; margin: 0;">
              Need help? Contact our support team<br>
              <strong>support@medicareclinic.com</strong>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            This is an automated message from MediCare Clinic.<br>
            Please do not reply to this email.
          </p>
          <p style="margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} MediCare Clinic. All rights reserved.
          </p>
        </div>
      </div>
    `,
    // Plain text version for email clients that don't support HTML
    text: `
      MediCare Clinic - Login Verification
      
      Hello Doctor,
      
      Your verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      If you didn't request this code, please ignore this email.
      
      Best regards,
      MediCare Clinic Team
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error);
    throw new Error('Failed to send email');
  }
};

// Send OTP endpoint
app.post('/api/auth/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    // Optional: Validate if email exists in your user database
    // const user = await User.findOne({ email, userType });
    // if (!user) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Email not registered'
    //   });
    // }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP with expiry
    otpStorage.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      userType: userType || 'user'
    });

    // Send OTP via SendGrid
    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code. Please try again.'
    });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, userType } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedData = otpStorage.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email'
      });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts (prevent brute force)
    if (storedData.attempts >= 3) {
      otpStorage.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStorage.set(email, storedData);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // OTP is valid, remove from storage
    otpStorage.delete(email);

    // Generate JWT token for authenticated session
    const token = jwt.sign(
      { 
        email, 
        userType: userType || 'doctor',
        loginTime: Date.now()
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        email,
        userType: userType || 'doctor'
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// Test email endpoint (for development)
app.post('/api/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await sendOtpEmail(email, '123456');
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully' 
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Cleanup expired OTPs (run every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(email);
    }
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('SendGrid configured:', !!process.env.SENDGRID_API_KEY);
});

module.exports = app;