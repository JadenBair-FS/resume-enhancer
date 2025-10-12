import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import '@tensorflow/tfjs-backend-cpu';
import * as use from '@tensorflow-models/universal-sentence-encoder';

const tf = require('@tensorflow/tfjs-node');

// config
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_ARTIFACTS_PATH = path.resolve(__dirname, 'model');
const EMBEDDINGS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'embeddings.json');
const LABELS_PATH = path.resolve(MODEL_ARTIFACTS_PATH, 'labels.json');
const TOP_K = 5; // Number of top skills to return

function cosineSimilarity(a, b) {
    const dotProduct = a.dot(b.transpose());
    const aNorm = a.norm();
    const bNorm = b.norm();
    const similarity = dotProduct.div(aNorm.mul(bNorm));
    return similarity.dataSync()[0];
}
async function predict(text) {
    // load model artifacts
    if (!fs.existsSync(LABELS_PATH) || !fs.existsSync(EMBEDDINGS_PATH)) {
        throw new Error('Model artifacts not found. Please run the training script first.');
    }
    const labels = JSON.parse(fs.readFileSync(LABELS_PATH, 'utf8'));
    const embeddingsData = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf8'));
    const skillEmbeddings = tf.tensor2d(embeddingsData);

    // load the Universal Sentence Encoder model
    const model = await use.load();

    //g enerate embedding for the input text
    const textEmbedding = await model.embed([text]);

    // calculate cosine similarity with all skill embeddings
    const similarities = [];
    for (let i = 0; i < labels.length; i++) {
        const skillEmbedding = skillEmbeddings.slice([i, 0], [1, 512]);
        const score = cosineSimilarity(textEmbedding, skillEmbedding);
        similarities.push({ skill: labels[i], score });
        tf.dispose(skillEmbedding);
    }

    // sort by similarity and return top K
    similarities.sort((a, b) => b.score - a.score);

    tf.dispose([skillEmbeddings, textEmbedding]);

    return similarities.slice(0, TOP_K);
}

(async () => {
    try {
        const inputText = process.argv[2];
        if (!inputText) {
            console.error('Usage: node predict_tfjs_knn.js "your job description text here"');
            process.exit(1);
        }

        const predictions = await predict(inputText);
        console.log(JSON.stringify(predictions));
    } catch (error) {
        console.error('Prediction failed:', error.message);
        process.exit(1);
    }
})();
