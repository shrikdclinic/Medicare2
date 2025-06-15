import { useState } from "react";
import { Stethoscope, Mail, Shield, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

interface DoctorLoginProps {
  onLogin: () => void;
}

const DoctorLogin = ({ onLogin }: DoctorLoginProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // API Configuration - Replace with your backend URL
  // const API_BASE_URL = 'https://medicare-th2c.onrender.com/api';
  const API_BASE_URL = 'https://medicare-th2c.onrender.com/api';

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const sendOtpToEmail = async (emailAddress: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: emailAddress,
          userType: 'doctor'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const verifyOtpWithBackend = async (emailAddress: string, otpCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: emailAddress,
          otp: otpCode,
          userType: 'doctor'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      return { 
        success: true, 
        message: data.message,
        token: data.token,
        user: data.user
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address", 'error');
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await sendOtpToEmail(email);
      setStep('otp');
      showToast(`Verification code has been sent to ${email}`, 'success');
    } catch (error) {
      showToast(error.message || "Failed to send verification code. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      showToast("Please enter the complete 6-digit verification code", 'error');
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await verifyOtpWithBackend(email, otp);
      
      // Store authentication token
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        if (result.user) {
          localStorage.setItem('userData', JSON.stringify(result.user));
        }
      }

      showToast("Login successful! Welcome back, Doctor!", 'success');
      
      // Delay to show success message
      setTimeout(() => {
        onLogin();
      }, 1500);
    } catch (error) {
      showToast(error.message || "Invalid verification code. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setOtp("");
    setError("");
    setSuccess("");
    
    try {
      await sendOtpToEmail(email);
      showToast(`New verification code has been sent to ${email}`, 'success');
    } catch (error) {
      showToast(error.message || "Failed to resend verification code. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = otp.split('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center p-8 pb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl w-fit mx-auto mb-4 shadow-lg">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            MediCare Clinic
          </h1>
          <p className="text-gray-600 mt-2">
            Secure access to Patient Management System
          </p>
        </div>
        
        {/* Toast Messages */}
        {(error || success) && (
          <div className={`mx-6 mb-4 p-4 rounded-lg flex items-center space-x-3 ${
            success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {success ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <p className={`text-sm ${success ? 'text-green-800' : 'text-red-800'}`}>
              {success || error}
            </p>
          </div>
        )}
        
        <div className="px-8 pb-8">
          {step === 'email' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center space-x-2 text-gray-700 font-medium">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Email Address</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@mediclinic.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEmailSubmit(e);
                    }
                  }}
                />
              </div>

              <button 
                onClick={handleEmailSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send Verification Code"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => setStep('email')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to email</span>
              </button>

              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 text-lg">Verify Your Identity</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-sm font-medium text-blue-600">{email}</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-center text-gray-700 font-medium">Verification Code</label>
                  <div className="flex justify-center space-x-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        placeholder="0"
                        value={otp[index] || ''}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={(e) => handleOtpSubmit(e)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>

                <button
                  onClick={handleResendOtp}
                  className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Resend Code"}
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-1">🔒 Secure Authentication</p>
            <p>OTP expires in 10 minutes • Maximum 3 attempts allowed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;