import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREDICT_SCRIPT_PATH = path.resolve(__dirname, '../train/predict_tfjs_knn.js');
const MODEL_ARTIFACTS_PATH = path.resolve(__dirname, '../train/model');
const EMBEDDINGS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'embeddings.json');
const LABELS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'labels.json');

// hardcoded skills dataset
const SKILL_DATASET = [
    'JavaScript', 'React', 'Node.js', 'Express', 'HTML', 'CSS', 'SQL',
    'Python', 'Java', 'C++', 'Go', 'Ruby', 'PHP', 'TypeScript',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Azure', 'Docker',
    'Kubernetes', 'Git', 'CI/CD', 'Agile', 'Scrum', 'Jira',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'NLP',
    'Project Management', 'Team Leadership', 'Communication'
];


async function extractSkills(jobDescriptionText) {
    // Check if the model is trained and ready
    if (fs.existsSync(EMBEDDINGS_PATH) && fs.existsSync(LABELS_PATH)) {
        try {
            console.log('Using ML model to extract skills...');
            const { stdout } = await execFileAsync('node', [PREDICT_SCRIPT_PATH, jobDescriptionText]);
            const predictions = JSON.parse(stdout);
            const skills = predictions.map(p => p.skill);
            console.log('Detected skills (ML):', skills);
            return skills;
        } catch (error) {
            console.error('ML prediction failed, falling back to regex:', error);
            // Fallback to regex if the script fails
        }
    }

    // Fallback to regex hard coded method
    console.log('ML model not found or failed. Using fallback regex method...');
    const foundSkills = new Set();
    const lowerCaseText = jobDescriptionText.toLowerCase();

    SKILL_DATASET.forEach(skill => {
        const skillRegex = new RegExp(`\\b${skill.toLowerCase()}\\b`);

        if (skillRegex.test(lowerCaseText)) {
            foundSkills.add(skill);
        }
    });

    console.log('Detected skills (Regex):', Array.from(foundSkills));
    return Array.from(foundSkills);
}

export { extractSkills };