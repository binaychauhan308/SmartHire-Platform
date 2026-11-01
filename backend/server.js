const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
const AI_SERVICE_HOST = process.env.AI_SERVICE_HOST || '127.0.0.1';
const AI_SERVICE_PORT = Number(process.env.AI_SERVICE_PORT || 8001);
const AI_SERVICE_SCRIPT = path.join(__dirname, '..', 'ai-service', 'main.py');
let aiProcess;

async function isAiServiceReady() {
    try {
        await axios.get(`${AI_SERVICE_URL}/docs`, { timeout: 1000 });
        return true;
    } catch {
        return false;
    }
}

function startAiService() {
    if (aiProcess && !aiProcess.killed) return;

    const pythonCommand = process.env.PYTHON_COMMAND || (process.platform === 'win32' ? 'py' : 'python3');
    const pythonArgs = process.platform === 'win32' ? ['-3', AI_SERVICE_SCRIPT] : [AI_SERVICE_SCRIPT];

    aiProcess = spawn(pythonCommand, pythonArgs, {
        env: { ...process.env, AI_SERVICE_HOST, AI_SERVICE_PORT: String(AI_SERVICE_PORT) },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
    });

    aiProcess.stdout.on('data', (data) => console.log(`[AI service] ${data.toString().trim()}`));
    aiProcess.stderr.on('data', (data) => console.error(`[AI service] ${data.toString().trim()}`));
    aiProcess.on('error', (error) => console.error(`Unable to start AI service: ${error.message}`));
    aiProcess.on('exit', (code, signal) => {
        aiProcess = undefined;
        if (code !== 0 && signal !== 'SIGTERM') {
            console.error(`AI service stopped unexpectedly (code ${code}, signal ${signal || 'none'}).`);
        }
    });
}

async function ensureAiService() {
    if (await isAiServiceReady()) return;

    startAiService();
    for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (await isAiServiceReady()) return;
    }

    throw new Error('The AI service could not be started. Check that Python and the AI service dependencies are installed.');
}

async function requestAiService(request) {
    await ensureAiService();
    try {
        return await request();
    } catch (error) {
        if (error.code !== 'ECONNREFUSED' && error.code !== 'ECONNRESET') throw error;
        aiProcess = undefined;
        await ensureAiService();
        return request();
    }
}

async function stopAiService() {
    if (!aiProcess || aiProcess.killed) return;
    aiProcess.kill();
    aiProcess = undefined;
}

// Connect to MongoDB (Local or Atlas)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smarthire';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Database Schema
const applicationSchema = new mongoose.Schema({
    candidateName: { type: String, required: true },
    resumeText: { type: String, required: true },
    jobRole: { type: String, default: 'Unspecified role' },
    jobDescription: { type: String, required: true },
    matchScore: { type: Number, required: true },
    requiredSkills: { type: [String], default: [] },
    matchedSkills: { type: [String], default: [] },
    status: {
        type: String,
        enum: ['Shortlisted', 'Under Review', 'Rejected'],
        default: 'Under Review'
    },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.model('Application', applicationSchema);

// Apply endpoint (Calculates AI score & saves to MongoDB)
app.post('/api/apply', async (req, res) => {
    try {
        const { candidateName, resumeText, jobDescription } = req.body;

        // Request AI Match Score from Python service
        const aiResponse = await requestAiService(() => axios.post(`${AI_SERVICE_URL}/match`, {
            resume_text: resumeText,
            job_description: jobDescription
        }));

        const matchScore = aiResponse.data.matchScore;

        const newApp = new Application({
            candidateName,
            resumeText,
            jobDescription,
            matchScore
        });

        await newApp.save();
        res.status(201).json({ message: 'Application submitted & saved', application: newApp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// A screening request can handle far more than 50 resumes (up to 200).
app.post('/api/applications/bulk', async (req, res) => {
    try {
        const { jobRole, jobDescription, candidates, roleSkills = [] } = req.body;
        if (!jobDescription || !Array.isArray(candidates) || !candidates.length)
            return res.status(400).json({ error: 'A job description and candidates are required.' });
        if (candidates.length > 200)
            return res.status(400).json({ error: 'A batch may contain no more than 200 resumes.' });
        if (candidates.some(c => !c.candidateName || !c.resumeText))
            return res.status(400).json({ error: 'Each candidate needs a name and resume text.' });
        if (!Array.isArray(roleSkills) || roleSkills.some(skill => typeof skill !== 'string'))
            return res.status(400).json({ error: 'Role skills must be a list of skill names.' });

        const aiResponse = await requestAiService(() => axios.post(`${AI_SERVICE_URL}/match/bulk`, {
            resumes: candidates.map(c => c.resumeText), job_description: jobDescription
        }));
        const applications = await Application.insertMany(candidates.map((c, index) => {
            const resumeText = c.resumeText.toLowerCase();
            const matchedSkills = roleSkills.filter(skill =>
                resumeText.includes(skill.toLowerCase())
            );

            return {
                candidateName: c.candidateName, resumeText: c.resumeText,
                jobRole: jobRole || 'Unspecified role', jobDescription,
                matchScore: aiResponse.data.matchScores[index],
                requiredSkills: roleSkills, matchedSkills, status: 'Under Review'
            };
        }));
        res.status(201).json({ message: 'Candidates screened and saved', applications });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Save recruiter review details after screening.
app.patch('/api/applications/:id/review', async (req, res) => {
    try {
        const { status, comment } = req.body;
        const allowedStatuses = ['Shortlisted', 'Under Review', 'Rejected'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status must be Shortlisted, Under Review, or Rejected.' });
        }
        if (typeof comment !== 'string') {
            return res.status(400).json({ error: 'Comment must be text.' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid candidate application id.' });
        }

        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ error: 'Candidate application not found.' });
        }

        application.status = status;
        application.comment = comment.trim();
        await application.save();

        res.json({ message: 'Recruiter review saved', application });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch all applications sorted by best match score (Recruiter feed)
app.get('/api/applications', async (req, res) => {
    try {
        const applications = await Application.find().sort({ matchScore: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const server = app.listen(5000, async () => {
    console.log('Backend running on port 5000');
    try {
        await ensureAiService();
        console.log(`AI service ready on port ${AI_SERVICE_PORT}`);
    } catch (error) {
        console.error(error.message);
    }
});

async function shutdown() {
    await stopAiService();
    server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
