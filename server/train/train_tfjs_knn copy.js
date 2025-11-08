import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import '@tensorflow/tfjs-backend-cpu';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { parse } from 'csv-parse/sync';
import cliProgress from 'cli-progress';

const require = createRequire(import.meta.url);
const tf = require('@tensorflow/tfjs-node');


// config
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, 'postings.csv');
const MODEL_ARTIFACTS_PATH = path.resolve(__dirname, 'model');
const EMBEDDINGS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'embeddings.json');
const LABELS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'labels.json');

// Sill Dataset (hardcoded)
const SKILL_DATASET = [
    // Technical & IT Skills
    // Software & Web Development
    'HTML5', 'CSS3', 'JavaScript', 'ES6+', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Svelte', 'jQuery',
    'Webpack', 'Babel', 'Bootstrap', 'Tailwind CSS', 'Sass', 'LESS', 'Node.js', 'Python', 'Django', 'Flask',
    'Java', 'Spring', 'C#', '.NET', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel', 'Go', 'Express.js', 'REST APIs',
    'GraphQL', 'Swift', 'iOS Development', 'Kotlin', 'Android Development', 'React Native', 'Flutter',
    'SQL', 'PostgreSQL', 'MySQL', 'Microsoft SQL Server', 'Oracle', 'NoSQL', 'MongoDB', 'Redis', 'Cassandra',
    'Firebase', 'DynamoDB', 'AWS', 'Microsoft Azure', 'Google Cloud Platform (GCP)', 'Docker', 'Kubernetes',
    'CI/CD', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Terraform', 'Ansible', 'Chef', 'Puppet',
    'WordPress', 'Drupal', 'Joomla', 'Shopify', 'Magento', 'Jest', 'Mocha', 'Cypress', 'Selenium', 'JUnit', 'PyTest',
    'Git', 'GitHub', 'GitLab', 'Bitbucket',

    // Data Science & Analytics
    'Pandas', 'NumPy', 'Scikit-learn', 'R', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Keras',
    'Natural Language Processing (NLP)', 'Computer Vision', 'Data Visualization', 'Tableau', 'Power BI',
    'D3.js', 'Matplotlib', 'Seaborn', 'Big Data', 'Hadoop', 'Spark', 'Kafka', 'Data Warehousing',
    'Snowflake', 'Redshift', 'BigQuery', 'Data Analysis',

    // IT & Cybersecurity
    'Network Administration', 'TCP/IP', 'DNS', 'DHCP', 'System Administration', 'Linux', 'Windows Server',
    'Cybersecurity', 'Penetration Testing', 'SIEM', 'Firewalls', 'Ethical Hacking', 'Cloud Security',
    'IT Support', 'Help Desk',

    // Business & Professional Skills
    // Management & Operations
    'Project Management', 'Agile', 'Scrum', 'Waterfall', 'Product Management', 'Business Development',
    'Operations Management', 'Supply Chain Management', 'Logistics', 'Risk Management', 'Quality Assurance (QA)',
    'Human Resources (HR)', 'Recruiting', 'Talent Acquisition', 'Jira',

    // Finance & Accounting
    'Financial Analysis', 'Financial Modeling', 'Accounting', 'GAAP', 'IFRS', 'Bookkeeping', 'QuickBooks',
    'Xero', 'Auditing', 'Tax Preparation', 'Payroll Management', 'Forecasting', 'Budgeting',
    'Investment Management',

    // Sales & Marketing
    'Digital Marketing', 'Search Engine Optimization (SEO)', 'Search Engine Marketing (SEM)', 'Pay-Per-Click (PPC)',
    'Content Marketing', 'Social Media Marketing (SMM)', 'Email Marketing', 'Google Analytics', 'Adobe Analytics',
    'Sales', 'Lead Generation', 'CRM', 'Salesforce', 'HubSpot', 'Negotiation', 'B2B Sales', 'B2C Sales',
    'Market Research', 'Brand Management', 'Public Relations (PR)',

    // Creative & Design Skills
    'Graphic Design', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Figma', 'Sketch', 'Canva',
    'UI/UX Design', 'User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Copywriting',
    'Editing', 'Blogging', 'Podcasting', 'Grant Writing', 'Video Editing', 'Adobe Premiere Pro', 'Final Cut Pro',
    'Motion Graphics', 'Adobe After Effects', 'Photography', 'Digital Photography', 'Lighting', 'Photo Editing',

    // Industry-Specific & Trade Skills
    // Retail & Customer Service
    'Point of Sale (POS) Systems', 'Customer Relationship Management (CRM)', 'Inventory Management',
    'Visual Merchandising', 'Loss Prevention', 'Conflict Resolution', 'Clienteling', 'Customer Service',

    // Real Estate
    'Real Estate Law', 'Real Estate License', 'Property Management', 'Real Estate Appraisal',
    'Leasing', 'Contract Negotiation', 'MLS (Multiple Listing Service)',

    // Healthcare
    'Electronic Health Records (EHR)', 'EMR', 'Medical Billing', 'Medical Coding', 'Patient Care',
    'Patient Scheduling', 'HIPAA Compliance', 'Phlebotomy', 'Pharmacology',

    // Trades & Manual Labor
    'Carpentry', 'Plumbing', 'Electrical Work', 'Wiring', 'Welding', 'HVAC Systems', 'Automotive Repair',
    'Forklift Operation', 'Food Safety', 'Food Handling',

    // Universal Soft Skills
    'Communication', 'Verbal Communication', 'Written Communication', 'Public Speaking', 'Active Listening',
    'Leadership', 'Team Leadership', 'Mentoring', 'Decision Making', 'Strategic Planning', 'Teamwork',
    'Collaboration', 'Interpersonal Skills', 'Empathy', 'Problem-Solving', 'Critical Thinking',
    'Analytical Skills', 'Creativity', 'Time Management', 'Organization', 'Adaptability', 'Reliability',
    'Attention to Detail', 'Work Ethic'
];

// training config
// Set to -1 to use all data.
const SAMPLE_LIMIT = -1;
const BATCH_SIZE = 100;
const DRY_RUN = false;
const DRY_RUN_SKILLS = ['javascript', 'python', 'react'];

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

async function main() {
    console.log('Starting training process...');

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`Error: postings.csv not found at ${CSV_PATH}`);
        process.exit(1);
    }

    // load and parse CSV
    console.log(`Loading and parsing ${CSV_PATH}...`);
    const csvData = fs.readFileSync(CSV_PATH, 'utf8');
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    const trainingData = (SAMPLE_LIMIT > 0 ? records.slice(0, SAMPLE_LIMIT) : records)
        .filter(r => r.description);

    console.log(`Loaded ${trainingData.length} valid records.`);

    // load the Universal Sentence Encoder model
    console.log('Loading Universal Sentence Encoder model...');
    const model = await use.load();
    console.log('Model loaded.');

    // group descriptions by skill using regex matching
    console.log('Grouping job descriptions by skill...');
    const skillsToDescriptions = new Map();
    for (const record of trainingData) {
        const lowerCaseDescription = record.description.toLowerCase();
        for (const skill of SKILL_DATASET) {
            const skillRegex = new RegExp(`\\b${escapeRegExp(skill.toLowerCase())}\\b`);
            if (skillRegex.test(lowerCaseDescription)) {
                const skillKey = skill.toLowerCase();
                if (DRY_RUN && !DRY_RUN_SKILLS.includes(skillKey)) continue;

                if (!skillsToDescriptions.has(skillKey)) {
                    skillsToDescriptions.set(skillKey, []);
                }
                skillsToDescriptions.get(skillKey).push(record.description);
            }
        }
    }
    console.log(`Found ${skillsToDescriptions.size} unique skills.`);

    // generate and average embeddings for each skill
    console.log('Generating and averaging embeddings for each skill...');
    const skillEmbeddings = new Map();
    const labels = [];
    const embeddings = [];

    //progress bar so I know its working
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(skillsToDescriptions.size, 0);

    for (const [skill, descriptions] of skillsToDescriptions.entries()) {
        const descriptionCount = descriptions.length;
        let accumulatedEmbedding = tf.zeros([1, 512]);

        for (let i = 0; i < descriptionCount; i += BATCH_SIZE) {
            const batch = descriptions.slice(i, i + BATCH_SIZE);
            const batchEmbeddings = await model.embed(batch);
            const batchSum = tf.sum(batchEmbeddings, 0, true);
            accumulatedEmbedding = tf.add(accumulatedEmbedding, batchSum);
            tf.dispose([batchEmbeddings, batchSum]);
        }

        const averageEmbedding = tf.div(accumulatedEmbedding, tf.scalar(descriptionCount));

        labels.push(skill);
        embeddings.push(averageEmbedding.arraySync()[0]);

        tf.dispose([accumulatedEmbedding, averageEmbedding]);
        progressBar.increment();
    }

    progressBar.stop();
    console.log('Embeddings generated.');

    // save artifacts
    console.log('Saving model artifacts...');
    if (!fs.existsSync(MODEL_ARTIFACTS_PATH)) {
        fs.mkdirSync(MODEL_ARTIFACTS_PATH);
    }
    fs.writeFileSync(LABELS_PATH, JSON.stringify(labels, null, 2));
    fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(embeddings, null, 2));

    console.log(`Training complete! Model artifacts saved to ${MODEL_ARTIFACTS_PATH}`);
}

main().catch(err => {
    console.error('An error occurred during training:', err);
    process.exit(1);
});
