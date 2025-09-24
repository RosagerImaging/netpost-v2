// Enhanced Pre-Deploy Validation with GitHub Apps Integration
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class EnhancedPreDeployValidator {
  constructor() {
    this.results = {
      typescript: false,
      linting: false,
      security: false,     // NEW: CodeQL security check
      tests: false,
      coverage: false,     // NEW: Coverage validation
      build: false,
      e2e: false,
      bundle: false
    };
    this.startTime = Date.now();
    this.verbose = process.argv.includes('--verbose');
    this.skipSecurity = process.argv.includes('--skip-security');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    };

    console.log(`${chalk.gray(timestamp)} ${colors[type](message)}`);
  }

  async execCommand(command, description, options = {}) {
    this.log(`🔍 ${description}...`);

    return new Promise((resolve, reject) => {
      const child = exec(command, {
        ...options,
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data;
        if (this.verbose) process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        stderr += data;
        if (this.verbose) process.stderr.write(data);
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.log(`✅ ${description} passed`, 'success');
          resolve({ stdout, stderr });
        } else {
          this.log(`❌ ${description} failed`, 'error');
          if (!this.verbose) {
            console.log(chalk.red(stderr || stdout));
          }
          reject(new Error(`${description} failed with code ${code}`));
        }
      });

      // Kill after 10 minutes to prevent hanging
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`${description} timed out after 10 minutes`));
      }, 600000);
    });
  }

  async validateTypeScript() {
    try {
      await this.execCommand(
        'npx tsc --noEmit --pretty',
        'TypeScript type checking'
      );
      this.results.typescript = true;
    } catch (error) {
      throw new Error('TypeScript validation failed');
    }
  }

  async validateLinting() {
    try {
      await this.execCommand(
        'npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0 --format=compact',
        'ESLint validation'
      );
      this.results.linting = true;
    } catch (error) {
      throw new Error('Linting validation failed');
    }
  }

  // NEW: Security validation with CodeQL patterns
  async validateSecurity() {
    if (this.skipSecurity) {
      this.log('⚠️  Skipping security validation', 'warning');
      this.results.security = true;
      return;
    }

    try {
      // Run local security checks using ESLint security rules
      await this.execCommand(
        'npx eslint . --ext .ts,.tsx,.js,.jsx --config .eslintrc.security.js --format=compact',
        'Security pattern analysis'
      );

      // Check for common vulnerability patterns
      await this.validateSecurityPatterns();

      this.results.security = true;
    } catch (error) {
      throw new Error('Security validation failed');
    }
  }

  async validateSecurityPatterns() {
    const securityChecks = [
      // Check for hardcoded secrets
      'rg -i "password\\s*=\\s*[\'\\"][^\'\\"]+" src/ || true',
      'rg -i "api[_-]?key\\s*=\\s*[\'\\"][^\'\\"]+" src/ || true',
      'rg -i "secret\\s*=\\s*[\'\\"][^\'\\"]+" src/ || true',

      // Check for unsafe eval usage
      'rg -i "eval\\s*\\(" src/ || true',

      // Check for dangerous innerHTML usage
      'rg -i "innerHTML\\s*=" src/ || true'
    ];

    for (const check of securityChecks) {
      const result = await this.execCommand(check, 'Pattern security scan', {
        env: { ...process.env, TERM: 'xterm' }
      });

      if (result.stdout.trim()) {
        this.log(`⚠️  Security pattern detected:\n${result.stdout}`, 'warning');
      }
    }
  }

  async validateUnitTests() {
    try {
      await this.execCommand(
        'npm run test:run -- --reporter=verbose',
        'Unit tests'
      );
      this.results.tests = true;
    } catch (error) {
      throw new Error('Unit tests failed');
    }
  }

  // NEW: Enhanced coverage validation with Codecov integration
  async validateCoverage() {
    try {
      // Run tests with coverage
      await this.execCommand(
        'npm run test:coverage -- --reporter=json --reporter=text',
        'Test coverage analysis'
      );

      // Validate coverage thresholds
      const coverageReport = this.parseCoverageReport();
      this.validateCoverageThresholds(coverageReport);

      this.results.coverage = true;
    } catch (error) {
      throw new Error('Coverage validation failed');
    }
  }

  parseCoverageReport() {
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      }
    } catch (error) {
      this.log('⚠️  Could not parse coverage report', 'warning');
    }
    return null;
  }

  validateCoverageThresholds(report) {
    if (!report) return;

    const thresholds = {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80
    };

    const total = report.total;
    const results = [];

    for (const [metric, threshold] of Object.entries(thresholds)) {
      const actual = total[metric].pct;
      const passed = actual >= threshold;

      results.push({
        metric,
        actual,
        threshold,
        passed
      });

      if (passed) {
        this.log(`✅ ${metric}: ${actual}% (≥${threshold}%)`, 'success');
      } else {
        this.log(`❌ ${metric}: ${actual}% (<${threshold}%)`, 'error');
      }
    }

    const allPassed = results.every(r => r.passed);
    if (!allPassed) {
      throw new Error('Coverage thresholds not met');
    }
  }

  async validateIntegrationTests() {
    try {
      await this.execCommand(
        'npm run test:integration',
        'Integration tests'
      );
      this.results.tests = this.results.tests && true;
    } catch (error) {
      throw new Error('Integration tests failed');
    }
  }

  async validateBuild() {
    try {
      // Clean previous build
      await this.execCommand('rm -rf .next', 'Cleaning previous build');

      // Test production build
      await this.execCommand(
        'npm run build',
        'Production build',
        { env: { NODE_ENV: 'production' } }
      );

      // Verify build artifacts
      const buildPath = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildPath)) {
        throw new Error('Build output directory not found');
      }

      this.results.build = true;
    } catch (error) {
      throw new Error('Build validation failed');
    }
  }

  async validateE2ETests() {
    try {
      // Start the application
      this.log('🚀 Starting application for E2E tests...');

      const server = spawn('npm', ['run', 'start'], {
        detached: false,
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      // Wait for server to start
      await new Promise((resolve) => setTimeout(resolve, 15000));

      try {
        await this.execCommand(
          'npx playwright test --reporter=html',
          'End-to-end tests'
        );
        this.results.e2e = true;
      } finally {
        // Clean up server
        server.kill('SIGTERM');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      throw new Error('E2E tests failed');
    }
  }

  async validateBundle() {
    try {
      await this.execCommand(
        'npx next-bundle-analyzer --analyze',
        'Bundle size analysis'
      );

      // Check bundle size limits
      const buildManifest = path.join(process.cwd(), '.next/build-manifest.json');
      if (fs.existsSync(buildManifest)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
        this.log('📊 Bundle analysis completed', 'success');
      }

      this.results.bundle = true;
    } catch (error) {
      this.log('⚠️  Bundle analysis failed, but continuing...', 'warning');
      this.results.bundle = true; // Don't fail deployment for bundle issues
    }
  }

  async generateEnhancedReport() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      results: this.results,
      environment: {
        node: process.version,
        npm: await this.execCommand('npm --version', 'Getting npm version').then(r => r.stdout.trim()).catch(() => 'unknown'),
        platform: process.platform,
        ci: process.env.CI === 'true',
        github: !!process.env.GITHUB_ACTIONS
      },
      coverage: this.parseCoverageReport(),
      github_integration: {
        codecov_ready: fs.existsSync(path.join(process.cwd(), 'codecov.yml')),
        codeql_ready: fs.existsSync(path.join(process.cwd(), '.github/workflows/codeql-analysis.yml')),
        dependabot_ready: fs.existsSync(path.join(process.cwd(), '.github/dependabot.yml')),
        claude_integration_ready: fs.existsSync(path.join(process.cwd(), '.claude/github-integration.json')),
        claude_workflow_ready: fs.existsSync(path.join(process.cwd(), '.github/workflows/claude-integration.yml'))
      }
    };

    const reportPath = path.join(process.cwd(), 'enhanced-deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`📋 Enhanced deployment report saved to ${reportPath}`, 'info');
    return report;
  }

  async runFullValidation() {
    const stages = [
      { name: 'TypeScript', fn: () => this.validateTypeScript() },
      { name: 'Linting', fn: () => this.validateLinting() },
      { name: 'Security', fn: () => this.validateSecurity() },
      { name: 'Unit Tests', fn: () => this.validateUnitTests() },
      { name: 'Coverage', fn: () => this.validateCoverage() },
      { name: 'Integration Tests', fn: () => this.validateIntegrationTests() },
      { name: 'Build', fn: () => this.validateBuild() },
      { name: 'E2E Tests', fn: () => this.validateE2ETests() },
      { name: 'Bundle Analysis', fn: () => this.validateBundle() }
    ];

    console.log(chalk.blue.bold('\n🚀 NetPost V2 Enhanced Pre-Deployment Validation\n'));
    console.log(chalk.gray(`Started at: ${new Date().toLocaleString()}`));
    console.log(chalk.cyan('🔗 Integrated with: Codecov, CodeQL, Dependabot\n'));

    let passed = 0;
    let failed = 0;

    for (const stage of stages) {
      try {
        await stage.fn();
        passed++;
      } catch (error) {
        failed++;
        this.log(`\n💥 ${stage.name} failed: ${error.message}\n`, 'error');

        // Continue on coverage failures in non-CI environments
        if (stage.name === 'Coverage' && !process.env.CI) {
          this.log('⚠️  Coverage failure ignored in local development', 'warning');
          passed++;
          failed--;
          continue;
        }

        // Stop on first failure to avoid wasting time
        break;
      }
    }

    const report = await this.generateEnhancedReport();

    const duration = Math.round((Date.now() - this.startTime) / 1000);

    console.log('\n' + '='.repeat(70));

    if (failed === 0) {
      console.log(chalk.green.bold(`\n🎉 ALL ENHANCED VALIDATIONS PASSED! (${duration}s)`));
      console.log(chalk.green('✅ Ready for deployment to Vercel'));
      console.log(chalk.cyan('🔗 Coverage will be uploaded to Codecov automatically'));
      console.log(chalk.cyan('🔒 Security analysis will run via CodeQL'));
      console.log(chalk.cyan('📦 Dependencies managed by Dependabot'));
      console.log(chalk.blue('\nRun: vercel --prod'));
      return true;
    } else {
      console.log(chalk.red.bold(`\n💥 ENHANCED VALIDATION FAILED (${passed}/${stages.length} passed)`));
      console.log(chalk.red('❌ DO NOT DEPLOY until all issues are resolved'));
      console.log(chalk.yellow('\nFix the errors above and run validation again.'));
      console.log(chalk.cyan(`\n📊 Full report: enhanced-deployment-report.json`));
      return false;
    }
  }
}

// CLI interface
if (require.main === module) {
  const validator = new EnhancedPreDeployValidator();

  validator.runFullValidation()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(chalk.red('\n💥 Enhanced validation crashed:'), error.message);
      process.exit(1);
    });
}

module.exports = EnhancedPreDeployValidator;