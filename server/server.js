// server/server.js
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import multer, { diskStorage } from 'multer';
import { scrapeJobDescription } from './lib/scraper.js';
import { extractSkills } from './lib/skillModel.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const app = express();
const PORT = 3001;

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

    console.log(`Received resume: ${resumePath}`);
    console.log(`Received URL: ${jobUrl}`);

    try {
        //scrape the job description
        const jobText = await scrapeJobDescription(jobUrl);
        if (!jobText) {
            return res.status(500).json({ error: 'Could not scrape job description.' });
        }

        // analyze the job description to extract skills
        const skills = await extractSkills(jobText);

        await addSkillsToResume(resumePath, skills, 'responses/' + resumePath.replace('uploads/', 'enhanced-'));

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


/**
 * Sends a resume and skill list to the Python microservice to add the skills.
 *
 * @param {string} resumeFilePath Path to the user's uploaded .docx resume.
 * @param {string[]} skillsToAdd Array of skill strings to add (e.g., ["Node.js", "React"]).
 * @param {string} outputFilePath Where to save the modified resume.
 * @returns {Promise<void>}
 */
async function addSkillsToResume(resumeFilePath, skillsToAdd, outputFilePath) {

    // The URL of your running Python microservice
    const microserviceUrl = 'http://127.0.0.1:5000/add-skills';

    // 1. Create a new FormData object
    const formData = new FormData();

    // 2. Append the resume file
    // We use createReadStream to handle the file
    formData.append('resume', fs.createReadStream(resumeFilePath));

    // 3. Append each skill
    // It's important to append each skill with the *same key* ('skills')
    for (const skill of skillsToAdd) {
        formData.append('skills', skill);
    }

    console.log('Sending data to Python service...');

    try {
        // 4. Make the POST request
        const response = await axios.post(
            microserviceUrl,
            formData,
            {
                // This is crucial: Set the headers from the form-data library
                headers: formData.getHeaders(),
                // This is also crucial: Tell axios to expect a file stream back
                responseType: 'stream',
            }
        );

        // 5. Save the returned file
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
        // Handle errors (e.g., Python service is down, or it returned a 400/500)
        if (error.response) {
            console.error(`Error from service: ${error.response.status}`);
            // If the service sent a JSON error, we need to read the stream
            const errorData = await streamToString(error.response.data);
            console.error('Error details:', errorData);
        } else {
            console.error('Error connecting to Python service:', error.message);
        }
        throw new Error('Failed to update resume.');
    }
}

// Helper function to read an error stream
function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}