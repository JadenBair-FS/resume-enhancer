import express, { json, urlencoded } from 'express';
import cors from 'cors';
import multer, { diskStorage } from 'multer';
import { scrapeJobDescription } from './lib/scraper.js';
import { extractSkills } from './lib/skillModel.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors()); // Allow cross-origin requests
app.use(json()); // Parse JSON bodies
app.use(urlencoded({ extended: true })); // Parse URL-encoded bodies

// multer to handle file uploads
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

// api endpoint
app.post('/api/enhance', upload.single('resume'), async (req, res) => {
    if (!req.file || !req.body.jobUrl) {
        return res.status(400).json({ error: 'Resume file and job URL are required.' });
    }

    const { path: resumePath } = req.file;
    const { jobUrl } = req.body;

    try {
        // 1. Scrape the job description
        const jobText = await scrapeJobDescription(jobUrl);
        if (!jobText) {
            return res.status(500).json({ error: 'Could not scrape job description.' });
        }
        // 2. Extract skills using the skill model
        const skillData = await extractSkills(jobText);

        // 3. Prepare skill names for resume enhancement
        const skillNames = skillData.map((s) => s.skill);

        // 4. Send resume + skill NAMES to Python to get the new .docx
        await addSkillsToResume(
            resumePath,
            skillNames,
            'responses/' + resumePath.replace('uploads/', 'enhanced-')
        );

        // 5. Respond with detected skills and path to enhanced resume
        res.status(200).json({
            message: 'Data received and processed successfully!',
            detectedSkills: skillData, // Send the full object!
            resumePath: resumePath,
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});
app.get('/responses/enhanced-:filename', (req, res) => {
    const { filename } = req.params;
    const enhancedFilename = `enhanced-${filename}`;

    const filePath = path.join(__dirname, 'responses', enhancedFilename);

    res.download(filePath, (err) => {
        if (err) {
            console.error("Error downloading file:", err);
            if (err.code === 'ENOENT') {
                return res.status(404).send({ message: "File not found." });
            }
            return res.status(500).send({ message: "Could not download the file." });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


async function addSkillsToResume(resumeFilePath, skillsToAdd, outputFilePath) {

    const microserviceUrl = 'http://127.0.0.1:5000/add-skills';
    const formData = new FormData();

    formData.append('resume', fs.createReadStream(resumeFilePath));

    for (const skill of skillsToAdd) {
        formData.append('skills', skill);
    }

    console.log('Sending data to Python service...');

    try {
        const response = await axios.post(
            microserviceUrl,
            formData,
            {
                headers: formData.getHeaders(),
                responseType: 'stream',
            }
        );
        const writer = fs.createWriteStream(outputFilePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`Successfully saved updated resume to ${outputFilePath}`);
                resolve();
            });
            writer.on('error', (err) => {
                console.error('Error writing file:', err);
                reject(err);
            });
        });

    } catch (error) {
        if (error.response) {
            console.error(`Error from service: ${error.response.status}`);
            const errorData = await streamToString(error.response.data);
            console.error('Error details:', errorData);
        } else {
            console.error('Error connecting to Python service:', error.message);
        }
        throw new Error('Failed to update resume.');
    }
}

function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}