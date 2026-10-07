const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

// Configure Nodemailer transporter (ensure to set EMAIL_USER and EMAIL_PASS in your .env)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your preferred service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtp = async (req, res) => {
  try {
    const { identifier, channel } = req.body;

    if (!identifier || !channel) {
      return res.status(400).json({ error: 'Identifier and channel are required' });
    }

    if (!['mobile', 'email'].includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel' });
    }

    // Rate Limiting: Check if there's an OTP sent within the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const recentOtp = await Otp.findOne({
      identifier,
      createdAt: { $gt: thirtySecondsAgo },
    });

    if (recentOtp) {
      return res.status(429).json({ error: 'Please wait 30 seconds before requesting another OTP' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP using bcrypt
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    // Expiry: 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to DB
    const newOtp = new Otp({
      identifier,
      channel,
      otpHash,
      purpose: 'registration',
      expiresAt,
    });
    await newOtp.save();

    // Send OTP via corresponding channel
    if (channel === 'email') {
      try {
        await transporter.sendMail({
          from: `"ODER" <${process.env.EMAIL_USER}>`,
          to: identifier,
          subject: 'Your Registration OTP',
          text: `Your OTP for registration is: ${otpCode}. It is valid for 5 minutes.`,
          html: `<p>Your OTP for registration is: <b>${otpCode}</b>. It is valid for 5 minutes.</p>`,
        });
      } catch (err) {
        console.error('Email send failed:', err);
        return res.status(500).json({ error: 'Failed to send email OTP' });
      }
    } else if (channel === 'mobile') {
      // NOTE: Replace this placeholder with your actual SMS API provider implementation (e.g., MSG91, Fast2SMS)
      // Read the API key from an environment variable, e.g., process.env.SMS_API_KEY
      
      const smsApiKey = process.env.SMS_API_KEY;
      if (!smsApiKey) {
         console.warn('SMS_API_KEY is not configured in .env. Skipping actual SMS sending.');
      } else {
        /*
        Example using Fast2SMS:
        try {
          const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'authorization': smsApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              route: 'v3',
              sender_id: 'TXTIND',
              message: `Your OTP is ${otpCode}`,
              language: 'english',
              flash: 0,
              numbers: identifier
            })
          });
          const result = await response.json();
          if (!result.return) {
             throw new Error(result.message);
          }
        } catch (err) {
          console.error('SMS send failed:', err);
          return res.status(500).json({ error: 'Failed to send mobile OTP' });
        }
        */
      }
      
      // For development/debugging
      console.log(`[SMS MOCK] To: ${identifier}, OTP: ${otpCode}`);
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('sendOtp Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and otp are required' });
    }

    // Find the latest non-expired OTP for this identifier
    const latestOtp = await Otp.findOne({
      identifier,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!latestOtp) {
      return res.status(400).json({ error: 'OTP is expired or invalid' });
    }

    // Compare hashed OTP
    const isMatch = await bcrypt.compare(otp.toString(), latestOtp.otpHash);

    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // Mark as verified
    latestOtp.verified = true;
    await latestOtp.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('verifyOtp Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
