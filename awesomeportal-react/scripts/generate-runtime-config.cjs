#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate runtime configuration from environment variables
 * This script:
 * 1. Loads environment variables from various sources
 * 2. Checks for runtime env vars (VITE_*)
 * 3. Falls back to .env files if runtime vars don't exist
 * 4. Generates config.js in dist/ folder
 *
 * Strict mode (default): exits non-zero if VITE_ADOBE_CLIENT_ID or VITE_BUCKET is missing.
 * CI / packaging: set SKIP_RUNTIME_CONFIG_VALIDATION=1 to write empty placeholders and still exit 0.
 * Deployment copy under ../../tools/assets-browser/ is skipped if that directory does not exist.
 */

// Helper function to load .env files
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
                envVars[key.trim()] = value;
            }
        }
    });

    return envVars;
}

// Determine NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';

// Load environment variables in order of precedence (highest to lowest)
const envSources = [
    // Runtime environment variables (highest precedence)
    process.env,

    // .env.local (local overrides)
    loadEnvFile('.env.local'),

    // Environment-specific files
    loadEnvFile(`.env.${nodeEnv}`),

    // Base .env file (lowest precedence)
    loadEnvFile('.env')
];

// Function to get environment variable with precedence
function getEnvVar(key) {
    for (const source of envSources) {
        if (source[key] !== undefined && source[key] !== '') {
            return source[key];
        }
    }
    return '';
}

// Get configuration values
const config = {
    ADOBE_CLIENT_ID: getEnvVar('VITE_ADOBE_CLIENT_ID'),
    BUCKET: getEnvVar('VITE_BUCKET'),
    // Add other environment variables as needed
};

// Validate required configuration (strict by default; relax for CI / artifact-only builds)
const requiredVars = ['ADOBE_CLIENT_ID', 'BUCKET'];
const missingVars = requiredVars.filter(key => !config[key]);
const skipStrict =
    process.env.SKIP_RUNTIME_CONFIG_VALIDATION === '1' ||
    process.env.SKIP_RUNTIME_CONFIG_VALIDATION === 'true';

if (missingVars.length > 0) {
    if (skipStrict) {
        console.warn('⚠️  Missing environment variables (writing empty placeholders):');
        missingVars.forEach((varName) => console.warn(`   - VITE_${varName}`));
        console.warn(
            '\n💡 Set SKIP_RUNTIME_CONFIG_VALIDATION only for packaging/CI. Runtime features need real VITE_ADOBE_CLIENT_ID and VITE_BUCKET.'
        );
    } else {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach((varName) => {
            console.error(`   - VITE_${varName}`);
        });
        console.error(
            '\n💡 Set these in .env or the shell. For a build without secrets (e.g. CI), run with SKIP_RUNTIME_CONFIG_VALIDATION=1'
        );
        process.exit(1);
    }
}

// Generate the config.js content
const configContent = `// Runtime configuration generated from environment variables
// Generated at: ${new Date().toISOString()}
// Environment: ${nodeEnv}
window.APP_CONFIG = {
  ADOBE_CLIENT_ID: '${config.ADOBE_CLIENT_ID}',
  BUCKET: '${config.BUCKET}',
  // Add other environment variables as needed
};
`;

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Write the config file to dist/
const configPath = path.join(distDir, 'config.js');
fs.writeFileSync(configPath, configContent);

// Also write to tools/assets-browser/ for deployment (optional — dir may not exist in CI clones)
const toolsConfigPath = path.join(__dirname, '..', '..', 'tools', 'assets-browser', 'config.js');
const toolsConfigDir = path.dirname(toolsConfigPath);
if (fs.existsSync(toolsConfigDir)) {
    fs.writeFileSync(toolsConfigPath, configContent);
} else {
    console.warn('⚠️  Skipped writing tools config (directory missing):', toolsConfigDir);
}

// Log the results
console.log('✅ Generated runtime config at:', configPath);
if (fs.existsSync(toolsConfigDir)) {
    console.log('✅ Generated deployment config at:', toolsConfigPath);
}
console.log('📋 Configuration:');
console.log(`   Environment: ${nodeEnv}`);
console.log(`   ADOBE_CLIENT_ID: ${config.ADOBE_CLIENT_ID || '(not set)'}`);
console.log(`   BUCKET: ${config.BUCKET || '(not set)'}`);

// Show sources that were checked
console.log('\n🔍 Environment sources checked (in order of precedence):');
console.log('   1. Runtime environment variables');
console.log('   2. .env.local');
console.log(`   3. .env.${nodeEnv}`);
console.log('   4. .env');