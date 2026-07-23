const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

// Removed bcrypt and jwt for Guest Mode

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

// Setup DeepSeek AI
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

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

// Define Mongoose Schema for Saving Analyses
const HistorySchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'prescription' or 'lab_report'
  fileUrl: String, // Cloudinary URL
  analysisData: Object, // The AI json response
  deviceId: { type: String, required: true }, // Reference to the anonymous device
  createdAt: { type: Date, default: Date.now }
});

const History = mongoose.model('History', HistorySchema);

// --- OCR Helper Functions ---
const performWindowsOCR = (buffer) => {
  return new Promise((resolve, reject) => {
    const tempFileName = `temp_${Date.now()}.png`;
    const tempFilePath = path.join(__dirname, tempFileName);
    
    fs.writeFileSync(tempFilePath, buffer);
    
    const psScript = `
[void][Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType=WindowsRuntime]
$file = Get-Item "${tempFilePath.replace(/\\/g, '\\\\')}"
$stream = [Windows.Storage.Streams.FileRandomAccessStream]::OpenAsync($file.FullName, [Windows.Storage.FileAccessMode]::Read).GetResults()
$decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetResults()
$softwareBitmap = $decoder.GetSoftwareBitmapAsync().GetResults()
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($engine) {
  $ocrResult = $engine.RecognizeAsync($softwareBitmap).GetResults()
  Write-Output $ocrResult.Text
} else {
  Write-Error "OCR Engine could not be created"
}
    `;
    
    const tempPs1Path = path.join(__dirname, `temp_ocr_${Date.now()}.ps1`);
    fs.writeFileSync(tempPs1Path, psScript);
    
    exec(`powershell -ExecutionPolicy Bypass -File "${tempPs1Path}"`, (err, stdout, stderr) => {
      // Cleanup temp files
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
      try { fs.unlinkSync(tempPs1Path); } catch (e) {}
      
      if (err) {
        console.error('PowerShell OCR Error:', stderr);
        return reject(err);
      }
      resolve(stdout.trim());
    });
  });
};

const extractTextFromPdf = (buffer) => {
  try {
    const text = buffer.toString('binary');
    const streamMatches = text.match(/stream[\s\S]*?endstream/g) || [];
    let extracted = "";
    for (const stream of streamMatches) {
      const parenMatches = stream.match(/\(([^)]+)\)/g);
      if (parenMatches) {
        extracted += parenMatches.map(m => m.slice(1, -1)).join(" ") + "\n";
      }
    }
    const cleaned = extracted.replace(/\\([0-7]{3})/g, (m, oct) => String.fromCharCode(parseInt(oct, 8)));
    return cleaned.trim() || "Could not extract plain text stream from PDF. Please upload a clear image instead.";
  } catch (e) {
    return "Error parsing PDF structure.";
  }
};

// --- Authentication Routes ---
// Removed Registration and Login for Guest Mode
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
    
    // 2. Prepare Prompts & Payload
    let prompt = "";
    if (type === 'prescription') {
      prompt = `Extract medical information from this prescription image. 
      IMPORTANT INSTRUCTIONS RULE: Convert ALL medical abbreviations into simple everyday language a non-doctor can understand.
      Examples of how to convert:
      - "BID" or "BD" = "1 tablet in morning, 1 tablet at night"
      - "TID" or "TDS" = "1 tablet in morning, 1 tablet at noon, 1 tablet at night"
      - "QID" = "1 tablet 4 times a day (morning, noon, evening, night)"
      - "OD" or "QD" = "1 tablet once daily"
      - "HS" = "1 tablet at bedtime (before sleep)"
      - "AC" = "take before meals"
      - "PC" = "take after meals"
      - If something says "2 tabs BID" write "2 tablets in morning, 2 tablets at night"
      Always write instructions in simple plain English that anyone can understand.
      
      Return ONLY a JSON object with this exact structure, no markdown formatting around it:
      {
        "status": "success",
        "data": {
          "medications": [
            { "name": "medicine name", "dosage": "e.g. 500mg", "duration": "e.g. 5 Days", "instructions": "simple plain English instructions like: 1 tablet in morning, 1 tablet at night" }
          ],
          "advice": "General doctor advice from prescription in simple language",
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

    // 3. Call Groq Vision API
    console.log("Analyzing document with Groq Vision AI...");
    const isPdf = file.mimetype === 'application/pdf';
    let content = [];

    if (isPdf) {
      console.log('Extracting text from PDF (fallback for Groq)...');
      const extractedText = extractTextFromPdf(file.buffer);
      content = [
        { type: 'text', text: `${prompt}\n\nHere is the raw text extracted from the PDF:\n${extractedText}` }
      ];
    } else {
      const base64Data = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      content = [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`
          }
        }
      ];
    }

    const groqPayload = {
      model: 'qwen/qwen3.6-27b',
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    };

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(groqPayload)
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      throw new Error(`Groq API Error ${groqResponse.status}: ${errText}`);
    }

    const groqResult = await groqResponse.json();
    let rawJsonText = groqResult.choices?.[0]?.message?.content || '{}';
    console.log('Groq AI analysis successful!');

    // Clean potential markdown blocks from AI response
    if (rawJsonText.startsWith('```json')) {
      rawJsonText = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (rawJsonText.startsWith('```')) {
      rawJsonText = rawJsonText.replace(/```/g, '').trim();
    }

    const aiData = JSON.parse(rawJsonText);

    // 3. Save to MongoDB History (If connected)
    if (mongoose.connection.readyState === 1) {
      try {
        const { deviceId } = req.body;

        const historyRecord = new History({
          type: type,
          fileUrl: fileUrl || '', // Save empty string if Cloudinary failed
          analysisData: aiData.data,
          deviceId: deviceId || 'anonymous'
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

    const { deviceId } = req.query;
    let query = {};

    if (deviceId) {
      query = { deviceId };
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
