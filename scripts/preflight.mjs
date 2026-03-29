#!/usr/bin/env node

const MIN_NODE = { major: 20, minor: 19, patch: 0 };

function parseVersion(version) {
  const clean = String(version || '').replace(/^v/, '');
  const [major = '0', minor = '0', patch = '0'] = clean.split('.');
  return {
    major: Number.parseInt(major, 10) || 0,
    minor: Number.parseInt(minor, 10) || 0,
    patch: Number.parseInt(patch, 10) || 0,
  };
}

function isAtLeast(current, min) {
  if (current.major !== min.major) return current.major > min.major;
  if (current.minor !== min.minor) return current.minor >= min.minor;
  return current.patch >= min.patch;
}

function fail(message) {
  console.error(`[preflight] ${message}`);
  process.exit(1);
}

const nodeVersion = parseVersion(process.versions.node);
if (!isAtLeast(nodeVersion, MIN_NODE)) {
  fail(
    `Node.js ${MIN_NODE.major}.${MIN_NODE.minor}.${MIN_NODE.patch}+ is required. ` +
      `Current: ${process.versions.node}`
  );
}

if (process.env.NODE_ENV === 'production') {
  const requiredVars = ['JWT_SECRET', 'ETHERSCAN_API_KEY', 'CORS_ORIGIN'];
  const missing = requiredVars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    fail(`Missing required environment variables for production: ${missing.join(', ')}`);
  }
}

console.log(`[preflight] OK (node ${process.versions.node}, env ${process.env.NODE_ENV || 'unset'})`);
