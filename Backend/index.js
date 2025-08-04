// backend/server.js
const express = require("express");
const sgMail = require("@sendgrid/mail");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Import models
const User = require("./models/User");
const Patient = require("./models/Patient");

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
    error: "Too many OTP requests, please try again later.",
  },
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: "Invalid or expired token" });
      }

      req.user = decoded;
      next();
    }
  );
};

// Send OTP using SendGrid
const sendOtpEmail = async (email, otp) => {
  console.log(`Attempting to send email to: ${email}`);
  console.log(
    `Using SendGrid API key: ${
      process.env.SENDGRID_API_KEY ? "Set" : "Not set"
    }`
  );
  console.log(`From email: ${process.env.FROM_EMAIL}`);
  const msg = {
    to: email,
    from: {
      email: process.env.FROM_EMAIL, // Must be verified in SendGrid
      name: "MediCare Clinic",
    },
    subject: "MediCare Clinic - Login Verification Code",
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
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    throw new Error("Failed to send email");
  }
};

// Simple GET route
app.get("/", (req, res) => {
  res.send("Welcome to the backend of MediCare Clinic!");
});

// Send OTP endpoint
app.post("/api/auth/send-otp", otpLimiter, async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required",
      });
    }

    // Check if email exists in database
    const user = await User.findOne({ email });

    // If user doesn't exist, create one (you might want to change this behavior)
    if (!user) {
      await User.create({
        email,
        userType: userType || "doctor",
      });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store OTP with expiry
    otpStorage.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      userType: userType || "doctor",
    });

    // Send OTP via SendGrid
    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
    });
  }
});

// Verify OTP endpoint
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp, userType } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const storedData = otpStorage.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this email",
      });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Check attempts (prevent brute force)
    if (storedData.attempts >= 3) {
      otpStorage.delete(email);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStorage.set(email, storedData);

      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // OTP is valid, remove from storage
    otpStorage.delete(email);

    // Find or create user in database
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        userType: userType || "doctor",
      });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token for authenticated session
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userType: user.userType,
        loginTime: Date.now(),
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});

// PATIENT ROUTES

// Get all patients for a doctor
app.get("/api/patients", authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find({ doctor: req.user.id });

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
});

// Create a new patient
app.post("/api/patients", authenticateToken, async (req, res) => {
  try {
    const {
      prefix,
      patientName,
      age,
      gender,
      weight,
      bp,
      rbs,
      address,
      referenceNumber,
      referencePerson,
      contactNumber,
      patientProblem,
      medicinePrescriptions,
      advisories,
    } = req.body;

    // Generate reference number if not provided
    const refNumber =
      referenceNumber ||
      `ID-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;

    // Create initial treatment entry if prescriptions or advisories are provided
    const treatmentEntries = [];
    if (medicinePrescriptions || advisories) {
      treatmentEntries.push({
        date: new Date(),
        medicinePrescriptions,
        advisories,
      });
    }

    const newPatient = await Patient.create({
      prefix,
      patientName,
      age,
      gender,
      weight,
      bp,
      rbs,
      address,
      referenceNumber: refNumber,
      referencePerson,
      contactNumber,
      patientProblem,
      doctor: req.user.id,
      treatmentEntries,
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: newPatient,
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create patient",
      error: error.message,
    });
  }
});

// Get a single patient by ID
app.get("/api/patients/:id", authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
    });
  }
});

// Update a patient
app.put("/api/patients/:id", authenticateToken, async (req, res) => {
  try {
    const {
      prefix,
      patientName,
      age,
      gender,
      weight,
      bp,
      rbs,
      address,
      referenceNumber,
      referencePerson,
      contactNumber,
      patientProblem,
      treatmentEntries,
    } = req.body;

    // Find patient and verify ownership
    const patient = await Patient.findOne({
      _id: req.params.id,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or you do not have permission to update",
      });
    }

    // Update patient
    patient.prefix = prefix !== undefined ? prefix : patient.prefix;
    patient.patientName = patientName || patient.patientName;
    patient.age = age || patient.age;
    patient.gender = gender !== undefined ? gender : patient.gender;
    patient.weight = weight !== undefined ? weight : patient.weight;
    patient.bp = bp !== undefined ? bp : patient.bp;
    patient.rbs = rbs !== undefined ? rbs : patient.rbs;
    patient.address = address !== undefined ? address : patient.address;
    patient.referenceNumber = referenceNumber || patient.referenceNumber;
    patient.referencePerson =
      referencePerson !== undefined ? referencePerson : patient.referencePerson;
    patient.contactNumber = contactNumber || patient.contactNumber;
    patient.patientProblem =
      patientProblem !== undefined ? patientProblem : patient.patientProblem;

    // Handle treatment entries update if provided
    if (treatmentEntries) {
      patient.treatmentEntries = treatmentEntries;
    }

    await patient.save();

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update patient",
      error: error.message,
    });
  }
});

// Delete a patient
app.delete("/api/patients/:id", authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({
      _id: req.params.id,
      doctor: req.user.id,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or you do not have permission to delete",
      });
    }

    res.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient",
    });
  }
});

// Add new treatment entry to a patient
app.post(
  "/api/patients/:id/treatments",
  authenticateToken,
  async (req, res) => {
    try {
      const { medicinePrescriptions, advisories, notes, weight, bp, rbs } =
        req.body;

      // Find patient and verify ownership
      const patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.user.id,
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message:
            "Patient not found or you do not have permission to add treatment",
        });
      }

      // Create new treatment entry
      const newTreatment = {
        date: new Date(),
        medicinePrescriptions: medicinePrescriptions || "",
        advisories: advisories || "",
        notes: notes || "",
      };

      // Update vital signs if provided
      if (weight !== undefined) patient.weight = weight;
      if (bp !== undefined) patient.bp = bp;
      if (rbs !== undefined) patient.rbs = rbs;

      // Add treatment entry
      patient.treatmentEntries.push(newTreatment);
      await patient.save();

      res.status(201).json({
        success: true,
        message: "Treatment entry added successfully",
        data: patient,
      });
    } catch (error) {
      console.error("Error adding treatment entry:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add treatment entry",
        error: error.message,
      });
    }
  }
);

// Update a specific treatment entry
app.put(
  "/api/patients/:id/treatments/:treatmentId",
  authenticateToken,
  async (req, res) => {
    try {
      const { medicinePrescriptions, advisories, notes } = req.body;

      // Find patient and verify ownership
      const patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.user.id,
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message:
            "Patient not found or you do not have permission to update treatment",
        });
      }

      // Find the specific treatment entry
      const treatmentEntry = patient.treatmentEntries.id(
        req.params.treatmentId
      );

      if (!treatmentEntry) {
        return res.status(404).json({
          success: false,
          message: "Treatment entry not found",
        });
      }

      // Update treatment entry
      if (medicinePrescriptions !== undefined)
        treatmentEntry.medicinePrescriptions = medicinePrescriptions;
      if (advisories !== undefined) treatmentEntry.advisories = advisories;
      if (notes !== undefined) treatmentEntry.notes = notes;

      await patient.save();

      res.json({
        success: true,
        message: "Treatment entry updated successfully",
        data: patient,
      });
    } catch (error) {
      console.error("Error updating treatment entry:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update treatment entry",
        error: error.message,
      });
    }
  }
);

// Delete a specific treatment entry
app.delete(
  "/api/patients/:id/treatments/:treatmentId",
  authenticateToken,
  async (req, res) => {
    try {
      // Find patient and verify ownership
      const patient = await Patient.findOne({
        _id: req.params.id,
        doctor: req.user.id,
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message:
            "Patient not found or you do not have permission to delete treatment",
        });
      }

      // Remove the specific treatment entry
      const treatmentEntry = patient.treatmentEntries.id(
        req.params.treatmentId
      );

      if (!treatmentEntry) {
        return res.status(404).json({
          success: false,
          message: "Treatment entry not found",
        });
      }

      patient.treatmentEntries.pull(req.params.treatmentId);
      await patient.save();

      res.json({
        success: true,
        message: "Treatment entry deleted successfully",
        data: patient,
      });
    } catch (error) {
      console.error("Error deleting treatment entry:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete treatment entry",
        error: error.message,
      });
    }
  }
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
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
  console.log("SendGrid configured:", !!process.env.SENDGRID_API_KEY);
  console.log("MongoDB configured:", !!process.env.MONGODB_URI);
});

module.exports = app;
