const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup Multer (Temporarily store files in memory before uploading to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Setup Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Setup MongoDB Connection
const connectDB = async () => {
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<username>')) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
      });
      console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
      console.error('❌ MongoDB Connection Error:', err.message);
      console.log('Tip: Check your IP Whitelist in MongoDB Atlas.');
    }
  } else {
    console.log('⚠️ MongoDB connection skipped: Please update MONGODB_URI in .env');
  }
};

connectDB();

// Middleware to check Database Connectivity for API routes
const checkDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      message: 'Database not connected. Please check server logs and MongoDB Atlas IP Whitelist.'
    });
  }
  next();
};

// Define Mongoose Schema for Users
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Define Mongoose Schema for Saving Analyses
const HistorySchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'prescription' or 'lab_report'
  fileUrl: String, // Cloudinary URL
  analysisData: Object, // The AI json response
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to user
  createdAt: { type: Date, default: Date.now }
});

const History = mongoose.model('History', HistorySchema);

// --- Authentication Routes ---

// Register Endpoint
app.post('/api/auth/register', checkDB, async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user: { name: newUser.name, email: newUser.email }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Error during registration' });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Create Token (Optional but good practice)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });

    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: { name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error during login. ' + (error.name === 'MongooseError' ? 'Database issue.' : 'Internal server error.')
    });
  }
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(
      { folder: 'medical_analyzer' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Health check endpoint
app.get('/', (req, res) => {
  res.send('AI Medical Analyzer Backend is running!');
});

// Document Analysis Endpoint
app.post('/api/analyze-document', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { type } = req.body; // 'prescription' or 'lab_report'

    if (!file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    console.log(`Processing ${type} document...`);

    // 1. Upload to Cloudinary
    let fileUrl = null;
    try {
      console.log('Uploading to Cloudinary...');
      const uploadResult = await uploadToCloudinary(file.buffer);
      fileUrl = uploadResult.secure_url;
      console.log('Uploaded successfully:', fileUrl);
    } catch (cloudinaryErr) {
      console.error('Cloudinary upload failed (skipping for this demo if credentials are bad):', cloudinaryErr);
    }

    // 2. Call Gemini API
    console.log("Analyzing document with Gemini AI...");

    // Prepare the document part for Gemini
    const documentPart = {
      inlineData: {
        data: file.buffer.toString("base64"),
        mimeType: file.mimetype
      }
    };

    let prompt = "";
    if (type === 'prescription') {
      prompt = `Extract medical information from this prescription image. 
      Return ONLY a JSON object with this exact structure, no markdown formatting around it:
      {
        "status": "success",
        "data": {
          "medications": [
            { "name": "medicine name", "dosage": "e.g. 500mg", "duration": "e.g. 5 Days", "instructions": "how to take" }
          ],
          "advice": "General doctor advice from prescription",
          "followUp": "When to follow up"
        }
      }`;
    } else {
      prompt = `Extract medical information from this lab report image.
      Return ONLY a JSON object with this exact structure, no markdown formatting around it:
      {
        "status": "success",
        "data": {
          "overview": "A brief, easy to understand overview of the report.",
          "highlights": ["Important positive/negative finding 1", "Important finding 2"],
          "advice": "General health advice based on results.",
          "results": [
            { "testName": "Name of test", "result": "Test value", "normalRange": "Normal reference range", "status": "low / high / normal" }
          ]
        }
      }`;
    }

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const aiResponse = await model.generateContent([prompt, documentPart]);
    const response = await aiResponse.response;
    let rawJsonText = response.text();

    // Clean potential markdown blocks from AI response
    if (rawJsonText.startsWith("```json")) {
      rawJsonText = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (rawJsonText.startsWith("```")) {
      rawJsonText = rawJsonText.replace(/```/g, '').trim();
    }

    const aiData = JSON.parse(rawJsonText);

    // 3. Save to MongoDB History (If connected)
    if (mongoose.connection.readyState === 1 && fileUrl) {
      try {
        let userId = null;
        const { email } = req.body;
        if (email) {
          const user = await User.findOne({ email });
          if (user) userId = user._id;
        }

        const historyRecord = new History({
          type: type,
          fileUrl: fileUrl,
          analysisData: aiData.data,
          userId: userId
        });
        await historyRecord.save();
        console.log('Saved to history collection');
      } catch (dbErr) {
        console.error('Failed to save history to MongoDB:', dbErr);
      }
    }

    // Send final response
    res.json(aiData);

  } catch (error) {
    console.error("Error in analysis:", error);
    res.status(500).json({ status: 'error', message: error.message || 'Error processing document' });
  }
});

app.get('/api/history', checkDB, async (req, res) => {
  try {

    const { email } = req.query;
    let query = {};

    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        query = { userId: user._id };
      } else {
        // If email provided but user not found, return empty or handle error
        return res.json({ status: 'success', data: [] });
      }
    }

    const records = await History.find(query).sort({ createdAt: -1 }).limit(20);
    res.json({
      status: 'success',
      data: records
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching history data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
