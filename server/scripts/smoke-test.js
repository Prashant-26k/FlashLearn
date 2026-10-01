import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

console.log('🔍 Starting Server ESM Import & Module Integrity Smoke Test...\n');

// Recursively find all .js files in server/
function findJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // Skip node_modules or scripts dirs
            if (file !== 'node_modules' && file !== 'scripts') {
                results = results.concat(findJsFiles(fullPath));
            }
        } else if (file.endsWith('.js') && !file.endsWith('.test.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

const serverFiles = findJsFiles(serverDir);
console.log(`📦 Found ${serverFiles.length} server modules to verify.`);

let errorCount = 0;

for (const filePath of serverFiles) {
    // Avoid re-running this smoke test script itself
    if (filePath === __filename) continue;

    const relativePath = path.relative(serverDir, filePath);
    try {
        const fileUrl = pathToFileURL(filePath).href;
        await import(fileUrl);
    } catch (err) {
        console.error(`❌ Module failed to load: server/${relativePath}`);
        console.error(`   Error [${err.code || 'UNKNOWN'}]: ${err.message}\n`);
        errorCount++;
    }
}

// Verify main application instance
try {
    const { default: app } = await import(pathToFileURL(path.join(serverDir, 'index.js')).href);
    if (!app || typeof app.listen !== 'function') {
        throw new Error('server/index.js does not export a valid Express application.');
    }
} catch (err) {
    console.error('❌ Failed to verify server/index.js Express instance:', err.message);
    errorCount++;
}

if (errorCount > 0) {
    console.error(`\n🚨 Smoke test FAILED: ${errorCount} module(s) had errors.`);
    process.exit(1);
} else {
    console.log(`\n✅ All ${serverFiles.length} server modules resolved cleanly with 0 ESM errors.`);
    process.exit(0);
}
