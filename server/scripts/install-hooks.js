import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const hookDir = path.join(rootDir, '.git', 'hooks');
const hookTarget = path.join(hookDir, 'pre-push');

const hookContent = `#!/bin/sh
# Git pre-push hook: Runs the comprehensive FlashLearn preflight checks before allowing push

echo "🚀 Running FlashLearn pre-push preflight checks..."
npm run preflight

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Push blocked! Preflight checks failed."
    echo "   Please fix the errors above before pushing to remote repository."
    echo "   (To bypass in an emergency, use: git push --no-verify)"
    exit 1
fi

echo "✅ Preflight checks passed! Proceeding with push."
exit 0
`;

try {
    if (!fs.existsSync(hookDir)) {
        console.log('ℹ️  .git/hooks directory not found. Skipping hook installation.');
        process.exit(0);
    }

    fs.writeFileSync(hookTarget, hookContent, { mode: 0o755 });
    console.log('✅ Git pre-push hook installed successfully at .git/hooks/pre-push');
} catch (err) {
    console.error('⚠️  Failed to install git pre-push hook:', err.message);
}
