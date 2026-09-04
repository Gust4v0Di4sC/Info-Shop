const { execFileSync } = require('node:child_process');
const { existsSync, readdirSync, rmSync } = require('node:fs');
const { join } = require('node:path');

const distPath = join(__dirname, '..', 'dist', 'info-shop-angular', 'browser');
const sentryCli = join(__dirname, '..', 'node_modules', '@sentry', 'cli', 'bin', 'sentry-cli');

const release = process.env.SENTRY_RELEASE || process.env.COMMIT_REF || '';
const requiredEnv = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'];
const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (process.env.SKIP_SENTRY_SOURCEMAPS === 'true') {
  console.warn('Skipping Sentry sourcemap upload. SKIP_SENTRY_SOURCEMAPS=true.');
  process.exit(0);
}

if (!release) {
  missingEnv.push('SENTRY_RELEASE or COMMIT_REF');
}

if (missingEnv.length > 0) {
  console.warn(`Skipping Sentry sourcemap upload. Missing: ${missingEnv.join(', ')}.`);
  process.exit(0);
}

if (!existsSync(distPath)) {
  throw new Error(`Build output not found at ${distPath}. Run npm run build first.`);
}

run(['releases', 'new', release, '--org', process.env.SENTRY_ORG, '--project', process.env.SENTRY_PROJECT, '--auth-token', process.env.SENTRY_AUTH_TOKEN], { optional: true });
run(['sourcemaps', 'inject', distPath]);
run([
  'sourcemaps',
  'upload',
  distPath,
  '--release',
  release,
  '--org',
  process.env.SENTRY_ORG,
  '--project',
  process.env.SENTRY_PROJECT,
  '--auth-token',
  process.env.SENTRY_AUTH_TOKEN,
  '--url-prefix',
  '~/',
  '--validate',
  '--wait',
]);
run(['releases', 'finalize', release, '--org', process.env.SENTRY_ORG, '--project', process.env.SENTRY_PROJECT, '--auth-token', process.env.SENTRY_AUTH_TOKEN], { optional: true });

if (process.env.KEEP_SOURCEMAPS !== 'true') {
  removeSourceMaps(distPath);
}

function run(args, options = {}) {
  try {
    execFileSync(process.execPath, [sentryCli, ...args], { stdio: 'inherit' });
  } catch (error) {
    if (options.optional) {
      console.warn(`Optional sentry-cli command failed: ${args.join(' ')}`);
      return;
    }

    throw error;
  }
}

function removeSourceMaps(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      removeSourceMaps(path);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.map')) {
      rmSync(path);
    }
  }
}
