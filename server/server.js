// server/server.js
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import multer, { diskStorage } from 'multer';
import { scrapeJobDescription } from './scraper';
import { extractSkills } from './skillModel';

const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors()); // Allow cross-origin requests
app.use(json()); // Parse JSON bodies
app.use(urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Multer Setup for File Uploads ---
// store files in a uploads/ directory
const storage = diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Add a timestamp to the filename
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage: storage });

// --- API Endpoint ---
// This endpoint will handle the resume and job URL submission
app.post('/api/enhance', upload.single('resume'), async (req, res) => {
    if (!req.file || !req.body.jobUrl) {
        return res.status(400).json({ error: 'Resume file and job URL are required.' });
    }

    const { path: resumePath } = req.file;
    const { jobUrl } = req.body;

    console.log(`Received resume: ${resumePath}`);
    console.log(`Received URL: ${jobUrl}`);

    try {
        //scrape the job description
        const jobText = await scrapeJobDescription(jobUrl);
        if (!jobText) {
            return res.status(500).json({ error: 'Could not scrape job description.' });
        }

        // analyze the job description to extract skills
        const skills = extractSkills(jobText);

        //temporarily return the detected skills and resume path
        res.status(200).json({
            message: 'Data received and processed successfully!',
            detectedSkills: skills,
            resumePath: resumePath,
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});