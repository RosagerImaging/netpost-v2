#!/usr/bin/env node

/**
 * Deployment Setup Verification Script
 *
 * This script verifies that all deployment solutions are properly configured.
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Verifying Deployment Setup...\n');

const checks = [];

// Check 1: Next.js config has dynamic rendering settings
const nextConfigPath = path.join(projectRoot, 'apps', 'web', 'next.config.ts');
if (existsSync(nextConfigPath)) {
  const nextConfig = readFileSync(nextConfigPath, 'utf8');
  const hasDynamicConfig = nextConfig.includes('dynamic: \'force-dynamic\'') &&
                          nextConfig.includes('output: "standalone"') &&
                          nextConfig.includes('generateStaticParams: false');

  checks.push({
    name: 'Next.js Dynamic Configuration',
    status: hasDynamicConfig ? '✅ PASS' : '❌ FAIL',
    details: hasDynamicConfig ? 'All dynamic rendering settings found' : 'Missing dynamic rendering settings'
  });
} else {
  checks.push({
    name: 'Next.js Configuration File',
    status: '❌ FAIL',
    details: 'next.config.ts not found'
  });
}

// Check 2: Error pages have force-dynamic exports
const errorPagesChecks = [
  { file: 'src/app/layout.tsx', name: 'Root Layout' },
  { file: 'src/app/error.tsx', name: 'Error Page' },
  { file: 'src/app/not-found.tsx', name: 'Not Found Page' }
];

errorPagesChecks.forEach(({ file, name }) => {
  const filePath = path.join(projectRoot, 'apps', 'web', file);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf8');
    const hasForceDynamic = content.includes('export const dynamic = \'force-dynamic\'');

    checks.push({
      name: `${name} Force Dynamic`,
      status: hasForceDynamic ? '✅ PASS' : '❌ FAIL',
      details: hasForceDynamic ? 'Has force-dynamic export' : 'Missing force-dynamic export'
    });
  } else {
    checks.push({
      name: `${name} File`,
      status: '❌ FAIL',
      details: `${file} not found`
    });
  }
});

// Check 3: Vercel configuration
const vercelConfigPath = path.join(projectRoot, 'vercel.json');
if (existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
  const hasCustomBuild = vercelConfig.buildCommand && vercelConfig.buildCommand.includes('build:dynamic');
  const hasForceEnv = vercelConfig.env && vercelConfig.env.FORCE_DYNAMIC === '1';

  checks.push({
    name: 'Vercel Configuration',
    status: hasCustomBuild && hasForceEnv ? '✅ PASS' : '⚠️ PARTIAL',
    details: `Custom build: ${hasCustomBuild ? '✓' : '✗'}, Force env: ${hasForceEnv ? '✓' : '✗'}`
  });
} else {
  checks.push({
    name: 'Vercel Configuration',
    status: '❌ FAIL',
    details: 'vercel.json not found'
  });
}

// Check 4: Build scripts
const packageJsonPath = path.join(projectRoot, 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const hasDynamicBuild = packageJson.scripts && packageJson.scripts['build:dynamic'];
  const hasServerlessBuild = packageJson.scripts && packageJson.scripts['build:serverless'];

  checks.push({
    name: 'Build Scripts',
    status: hasDynamicBuild && hasServerlessBuild ? '✅ PASS' : '⚠️ PARTIAL',
    details: `Dynamic: ${hasDynamicBuild ? '✓' : '✗'}, Serverless: ${hasServerlessBuild ? '✓' : '✗'}`
  });
}

// Check 5: Build script files
const scriptFiles = [
  'scripts/dynamic-build.js',
  'scripts/serverless-build.js'
];

scriptFiles.forEach(scriptFile => {
  const scriptPath = path.join(projectRoot, scriptFile);
  const exists = existsSync(scriptPath);

  checks.push({
    name: `${scriptFile}`,
    status: exists ? '✅ PASS' : '❌ FAIL',
    details: exists ? 'Script file exists' : 'Script file missing'
  });
});

// Check 6: Fallback configuration
const fallbackConfigPath = path.join(projectRoot, 'vercel-fallback.json');
checks.push({
  name: 'Fallback Configuration',
  status: existsSync(fallbackConfigPath) ? '✅ PASS' : '❌ FAIL',
  details: existsSync(fallbackConfigPath) ? 'Fallback config available' : 'Fallback config missing'
});

// Display results
console.log('📋 Deployment Setup Verification Results:\n');

checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
  console.log(`   ${check.details}\n`);
});

// Summary
const passed = checks.filter(c => c.status === '✅ PASS').length;
const partial = checks.filter(c => c.status === '⚠️ PARTIAL').length;
const failed = checks.filter(c => c.status === '❌ FAIL').length;
const total = checks.length;

console.log('📊 Summary:');
console.log(`   ✅ Passed: ${passed}/${total}`);
if (partial > 0) console.log(`   ⚠️ Partial: ${partial}/${total}`);
if (failed > 0) console.log(`   ❌ Failed: ${failed}/${total}`);

console.log('\n🚀 Deployment Readiness:');
if (failed === 0 && partial === 0) {
  console.log('   ✅ READY TO DEPLOY with primary solution');
  console.log('   📝 Run: vercel --prod');
} else if (failed === 0) {
  console.log('   ⚠️ READY TO DEPLOY with some warnings');
  console.log('   📝 Run: vercel --prod');
} else {
  console.log('   ❌ NOT READY - Fix failed checks first');
  console.log('   📝 See DEPLOYMENT_SOLUTIONS.md for guidance');
}

console.log('\n📚 For detailed deployment instructions, see:');
console.log('   📄 DEPLOYMENT_SOLUTIONS.md');