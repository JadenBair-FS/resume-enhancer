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
app.use(cors()); 
app.use(json());
app.use(urlencoded({ extended: true })); 

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

async function callPythonSkillService(resumePath, skillNames) {
  const form = new FormData();
  
  form.append('resume', fs.createReadStream(resumePath));
  skillNames.forEach(skill => {
    form.append('skills', skill);
  });

  try {
    const response = await axios.post('http://127.0.0.1:5000/add-skills', form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    return response.data;

  } catch (error) {
    console.error('Error calling Python service:', error.message);
    if (error.response) {
      console.error('Python service responded with:', error.response.data);
      throw new Error(error.response.data.error || 'Python service failed');
    }
    throw new Error('Could not connect to Python skill service.');
  }
}

// api endpoint
app.post('/api/enhance', upload.single('resume'), async (req, res) => {
  if (!req.file || !req.body.jobUrl) {
    return res.status(400).json({ error: 'Resume file and job URL are required.' });
  }

  const { path: resumePath } = req.file;
  const { jobUrl } = req.body;

  try {
    //Scrape the job description
    const jobText = await scrapeJobDescription(jobUrl);
    if (!jobText) {
      return res.status(500).json({ error: 'Could not scrape job description.' });
    }

    const aiRecommendedSkills = await extractSkills(jobText);
    const skillNames = aiRecommendedSkills.map((s) => s.skill);
    const pythonResponse = await callPythonSkillService(resumePath, skillNames);

    res.status(200).json({
      message: 'Resume enhanced successfully!',
      
      aiRecommendedSkills: aiRecommendedSkills,
      userExistingSkills: pythonResponse.existing_skills,
      fileData: pythonResponse.file_data,
      addedSkills: pythonResponse.added_skills 
    });

  } catch (error) {
    console.error('Error in /api/enhance route:', error.message);
    res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  } finally {
    fs.unlink(resumePath, (err) => {
      if (err) console.error(`Failed to delete temp file: ${resumePath}`, err);
    });
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