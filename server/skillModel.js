// server/skillModel.js

// hardcoded skills dataset
const SKILL_DATASET = [
    'JavaScript', 'React', 'Node.js', 'Express', 'HTML', 'CSS', 'SQL',
    'Python', 'Java', 'C++', 'Go', 'Ruby', 'PHP', 'TypeScript',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Azure', 'Docker',
    'Kubernetes', 'Git', 'CI/CD', 'Agile', 'Scrum', 'Jira',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'NLP',
    'Project Management', 'Team Leadership', 'Communication'
];

/**
 * Analyzes text to find which skills from our dataset are present.
 * This function serves as our initial "model" for skill prediction.
 * @param {string} jobDescriptionText The scraped text from the job description.
 * @returns {string[]} A list of skills found in the text.
 */
function extractSkills(jobDescriptionText) {
    const foundSkills = new Set();
    const lowerCaseText = jobDescriptionText.toLowerCase();

    SKILL_DATASET.forEach(skill => {
        const skillRegex = new RegExp(`\\b${skill.toLowerCase()}\\b`);

        if (skillRegex.test(lowerCaseText)) {
            foundSkills.add(skill);
        }
    });

    console.log('Detected skills:', Array.from(foundSkills));
    return Array.from(foundSkills);
}

export default { extractSkills };