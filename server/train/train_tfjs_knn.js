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


// --- CONFIGURATION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// **NEW**: Update paths to your downloaded Kaggle CSVs
const SUMMARY_CSV_PATH = path.resolve(__dirname, 'job_summary.csv');
const SKILLS_CSV_PATH = path.resolve(__dirname, 'job_skills.csv');

// **NEW**: Make sure your model artifacts path is correct
const MODEL_ARTIFACTS_PATH = path.resolve(__dirname, 'model');
const EMBEDDINGS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'embeddings.json');
const LABELS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'labels.json');

// **REMOVED**: The hardcoded SKILL_DATASET is no longer needed.

// --- TRAINING CONFIG ---
// Set to -1 to use all data.
const SAMPLE_LIMIT = -1;
const BATCH_SIZE = 100;
const DRY_RUN = false;
const DRY_RUN_SKILLS = ['javascript', 'python', 'react'];

// **REMOVED**: escapeRegExp function is no longer needed.

async function main() {
    console.log('Starting training process...');

    // **NEW**: Check for both CSV files
    if (!fs.existsSync(SUMMARY_CSV_PATH)) {
        console.error(`Error: job_summary.csv not found at ${SUMMARY_CSV_PATH}`);
        process.exit(1);
    }
    if (!fs.existsSync(SKILLS_CSV_PATH)) {
        console.error(`Error: job_skills.csv not found at ${SKILLS_CSV_PATH}`);
        process.exit(1);
    }

    // --- 1. Load Summaries into a Map ---
    console.log(`Loading and parsing ${SUMMARY_CSV_PATH}...`);
    const summaryCsvData = fs.readFileSync(SUMMARY_CSV_PATH, 'utf8');
    const summaryRecords = parse(summaryCsvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Loaded ${summaryRecords.length} summary records.`);
    console.log('Creating job_link -> summary map...');
    const jobLinkToSummaryMap = new Map();
    for (const record of summaryRecords) {
        if (record.job_link && record.job_summary) {
            jobLinkToSummaryMap.set(record.job_link, record.job_summary);
        }
    }
    console.log(`Map created with ${jobLinkToSummaryMap.size} valid summaries.`);


    // --- 2. Load Skills and Group Summaries ---
    console.log(`Loading and parsing ${SKILLS_CSV_PATH}...`);
    const skillsCsvData = fs.readFileSync(SKILLS_CSV_PATH, 'utf8');
    const skillRecords = parse(skillsCsvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Loaded ${skillRecords.length} skill records.`);
    console.log('Grouping job summaries by skill...');

    // **MODIFIED**: This map now holds summaries, not descriptions
    const skillsToSummaries = new Map();
    
    // **MODIFIED**: This loop replaces the old regex logic
    for (const record of skillRecords) {
        if (!record.job_link || !record.job_skill) continue;

        const skillKey = record.job_skill.toLowerCase();
        const jobLink = record.job_link;
        
        // Find the matching summary using the job_link
        const summary = jobLinkToSummaryMap.get(jobLink);

        // Only proceed if we found a summary
        if (summary) {
            if (DRY_RUN && !DRY_RUN_SKILLS.includes(skillKey)) continue;

            if (!skillsToSummaries.has(skillKey)) {
                skillsToSummaries.set(skillKey, []);
            }
            skillsToSummaries.get(skillKey).push(summary);
        }
    }
    
    // Apply sample limit if set (mainly for skills, not summaries)
    const finalSkillsToSummaries = new Map(
        SAMPLE_LIMIT > 0 
            ? Array.from(skillsToSummaries.entries()).slice(0, SAMPLE_LIMIT) 
            : skillsToSummaries.entries()
    );

    console.log(`Found ${finalSkillsToSummaries.size} unique skills linked to summaries.`);

    // --- 3. Load Model (Unchanged) ---
    console.log('Loading Universal Sentence Encoder model...');
    const model = await use.load();
    console.log('Model loaded.');

    // --- 4. Generate & Average Embeddings (Logic Unchanged) ---
    console.log('Generating and averaging embeddings for each skill...');
    const skillEmbeddings = new Map();
    const labels = [];
    const embeddings = [];

    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    // **MODIFIED**: Use the new map size
    progressBar.start(finalSkillsToSummaries.size, 0);

    // **MODIFIED**: Use the new map
    for (const [skill, summaries] of finalSkillsToSummaries.entries()) {
        // 'summaries' is the new 'descriptions'
        const descriptionCount = summaries.length; 
        let accumulatedEmbedding = tf.zeros([1, 512]);

        for (let i = 0; i < descriptionCount; i += BATCH_SIZE) {
            const batch = summaries.slice(i, i + BATCH_SIZE);
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

    // --- 5. Save Artifacts (Unchanged) ---
    console.log('Saving model artifacts...');
    if (!fs.existsSync(MODEL_ARTIFACTS_PATH)) {
        fs.mkdirSync(MODEL_ARTIFACTS_PATH, { recursive: true });
    }
    fs.writeFileSync(LABELS_PATH, JSON.stringify(labels, null, 2));
    fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(embeddings, null, 2));

    console.log(`Training complete! Model artifacts saved to ${MODEL_ARTIFACTS_PATH}`);
}

main().catch(err => {
    console.error('An error occurred during training:', err);
    process.exit(1);
});