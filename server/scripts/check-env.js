import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const envPath = path.join(rootDir, '.env');

console.log('🔒 Running Environment & Secret Configuration Audit...\n');

let warnings = [];
let errors = [];

// 1. Secret Leak Prevention: Verify .env is NOT staged in Git
try {
    const stagedFiles = execSync('git diff --name-only --cached', { cwd: rootDir, encoding: 'utf8' }).trim().split('\n');
    if (stagedFiles.includes('.env') || stagedFiles.some(f => f.endsWith('.env') || f.includes('.env.local'))) {
        errors.push('CRITICAL: .env or local environment file is STAGED for Git commit! Unstage it immediately.');
    } else {
        console.log('✅ Git check: .env is safe and not staged for commit.');
    }
} catch {
    // If git isn't available or fails, continue
}

// 2. Local .env existence
if (!fs.existsSync(envPath)) {
    warnings.push('.env file not found in root directory. Make sure environment variables are provided via shell or hosting provider.');
} else {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    // 3. Essential variables
    if (!envConfig.MONGODB_URI && !envConfig.MONGO_URI) {
        warnings.push('MONGODB_URI is missing in .env (MongoDB connection will fail).');
    }

    if (!envConfig.JWT_SECRET) {
        errors.push('JWT_SECRET is missing in .env (Authentication tokens cannot be signed).');
    } else if (envConfig.JWT_SECRET.length < 16) {
        warnings.push('JWT_SECRET should be at least 16 characters long for cryptographic security.');
    }

    // 4. Client URL / SSL mismatch check
    const clientUrl = envConfig.CLIENT_URL || '';
    const nodeEnv = envConfig.NODE_ENV || 'development';

    if (clientUrl.startsWith('https://localhost') || clientUrl.startsWith('https://127.0.0.1')) {
        errors.push('CLIENT_URL is set to "https://localhost...". Vite runs plain HTTP locally without SSL. Change CLIENT_URL to "http://localhost:5173" to avoid ERR_SSL_PROTOCOL_ERROR.');
    }

    if (nodeEnv === 'production' && (clientUrl.startsWith('http://localhost') || clientUrl.startsWith('http://127.0.0.1'))) {
        warnings.push('NODE_ENV is set to "production" while CLIENT_URL is localhost HTTP. Cookies with secure: true will be blocked by browsers on HTTP!');
    }

    // 5. Google OAuth check
    const hasGoogleId = Boolean(envConfig.GOOGLE_CLIENT_ID);
    const hasGoogleSecret = Boolean(envConfig.GOOGLE_CLIENT_SECRET);
    if (!hasGoogleId || !hasGoogleSecret) {
        warnings.push('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google OAuth sign-in will not work until configured.');
    }

    // 6. AI Provider check
    const hasGemini = Boolean(envConfig.GEMINI_API_KEY);
    const hasGroq = Boolean(envConfig.GROQ_API_KEY);
    const hasOpenAI = Boolean(envConfig.OPENAI_API_KEY);
    const hasOpenRouter = Boolean(envConfig.OPENROUTER_API_KEY);
    if (!hasGemini && !hasGroq && !hasOpenAI && !hasOpenRouter) {
        warnings.push('No AI API key found (GEMINI_API_KEY, GROQ_API_KEY, etc.). AI flashcard generation will be unavailable.');
    }

    console.log('✅ Local .env file structure inspected.');
}

if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
}

if (errors.length > 0) {
    console.error('\n❌ Environment Audit FAILED:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
} else {
    console.log('\n✅ Environment audit passed with 0 blocking errors.\n');
    process.exit(0);
}
