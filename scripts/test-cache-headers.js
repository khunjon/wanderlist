#!/usr/bin/env node

/**
 * Cache Headers Test Script
 * Tests various endpoints to verify cache headers are properly set
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const IS_HTTPS = BASE_URL.startsWith('https');

// Test endpoints
const TEST_ENDPOINTS = [
  // HTML pages (should have no-cache)
  { path: '/', expectedCache: 'no-cache', type: 'HTML' },
  { path: '/lists', expectedCache: 'no-cache', type: 'HTML' },
  
  // API routes (should have no-cache)
  { path: '/api/health/database', expectedCache: 'no-cache', type: 'API' },
  
  // Static assets (should have appropriate caching)
  { path: '/favicon.ico', expectedCache: 'public', type: 'Static' },
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = IS_HTTPS ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'HEAD', // Use HEAD to get headers without body
      headers: {
        'User-Agent': 'Cache-Test-Script/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = client.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        path: path
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function analyzeCacheHeaders(headers) {
  const cacheControl = headers['cache-control'] || '';
  const pragma = headers['pragma'] || '';
  const expires = headers['expires'] || '';
  const etag = headers['etag'] || '';
  
  return {
    cacheControl,
    pragma,
    expires,
    etag,
    hasNoCache: cacheControl.includes('no-cache'),
    hasNoStore: cacheControl.includes('no-store'),
    hasMustRevalidate: cacheControl.includes('must-revalidate'),
    hasPublic: cacheControl.includes('public'),
    hasPrivate: cacheControl.includes('private'),
    maxAge: cacheControl.match(/max-age=(\d+)/)?.[1] || null
  };
}

function validateCacheHeaders(endpoint, headers) {
  const analysis = analyzeCacheHeaders(headers);
  const issues = [];
  const successes = [];

  switch (endpoint.type) {
    case 'HTML':
    case 'API':
      // Should have aggressive no-cache headers
      if (!analysis.hasNoCache) {
        issues.push('Missing no-cache directive');
      } else {
        successes.push('✓ Has no-cache directive');
      }
      
      if (!analysis.hasNoStore) {
        issues.push('Missing no-store directive');
      } else {
        successes.push('✓ Has no-store directive');
      }
      
      if (!analysis.hasMustRevalidate) {
        issues.push('Missing must-revalidate directive');
      } else {
        successes.push('✓ Has must-revalidate directive');
      }
      
      if (analysis.maxAge !== '0') {
        issues.push(`max-age should be 0, got: ${analysis.maxAge}`);
      } else {
        successes.push('✓ Has max-age=0');
      }
      
      // Mobile compatibility headers
      if (headers['pragma'] !== 'no-cache') {
        issues.push('Missing Pragma: no-cache for mobile compatibility');
      } else {
        successes.push('✓ Has Pragma: no-cache');
      }
      
      if (headers['expires'] !== '0') {
        issues.push('Missing Expires: 0 for mobile compatibility');
      } else {
        successes.push('✓ Has Expires: 0');
      }
      break;
      
    case 'Static':
      // Should have public caching
      if (!analysis.hasPublic) {
        issues.push('Static assets should have public cache directive');
      } else {
        successes.push('✓ Has public cache directive');
      }
      
      if (!analysis.maxAge || parseInt(analysis.maxAge) < 3600) {
        issues.push('Static assets should have reasonable max-age (>= 1 hour)');
      } else {
        successes.push(`✓ Has appropriate max-age: ${analysis.maxAge}s`);
      }
      break;
  }

  // Security headers check
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options'
  ];
  
  securityHeaders.forEach(header => {
    if (headers[header]) {
      successes.push(`✓ Has security header: ${header}`);
    } else {
      issues.push(`Missing security header: ${header}`);
    }
  });

  return { issues, successes, analysis };
}

async function testEndpoint(endpoint) {
  log(`\n${colors.bold}Testing: ${endpoint.path} (${endpoint.type})${colors.reset}`);
  
  try {
    const response = await makeRequest(endpoint.path);
    
    if (response.statusCode >= 400) {
      log(`❌ HTTP ${response.statusCode} - Skipping cache header test`, 'red');
      return { success: false, endpoint: endpoint.path, error: `HTTP ${response.statusCode}` };
    }
    
    log(`Status: ${response.statusCode}`, 'blue');
    
    const validation = validateCacheHeaders(endpoint, response.headers);
    
    // Show cache control analysis
    log(`Cache-Control: ${validation.analysis.cacheControl || 'Not set'}`, 'blue');
    if (validation.analysis.pragma) {
      log(`Pragma: ${validation.analysis.pragma}`, 'blue');
    }
    if (validation.analysis.expires) {
      log(`Expires: ${validation.analysis.expires}`, 'blue');
    }
    
    // Show successes
    validation.successes.forEach(success => {
      log(success, 'green');
    });
    
    // Show issues
    validation.issues.forEach(issue => {
      log(`❌ ${issue}`, 'red');
    });
    
    const hasIssues = validation.issues.length > 0;
    const status = hasIssues ? '❌ FAILED' : '✅ PASSED';
    const color = hasIssues ? 'red' : 'green';
    
    log(`Result: ${status}`, color);
    
    return {
      success: !hasIssues,
      endpoint: endpoint.path,
      issues: validation.issues,
      successes: validation.successes
    };
    
  } catch (error) {
    log(`❌ Error testing ${endpoint.path}: ${error.message}`, 'red');
    return { success: false, endpoint: endpoint.path, error: error.message };
  }
}

async function runTests() {
  log(`${colors.bold}🧪 Cache Headers Test Suite${colors.reset}`);
  log(`Testing URL: ${BASE_URL}`);
  log(`${colors.yellow}${'='.repeat(50)}${colors.reset}`);
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  // Summary
  log(`\n${colors.bold}📊 Test Summary${colors.reset}`);
  log(`${colors.yellow}${'='.repeat(50)}${colors.reset}`);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log(`Total tests: ${results.length}`);
  log(`Passed: ${passed}`, passed > 0 ? 'green' : 'reset');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  
  if (failed > 0) {
    log('\n❌ Failed tests:', 'red');
    results.filter(r => !r.success).forEach(result => {
      log(`  • ${result.endpoint}: ${result.error || result.issues?.join(', ')}`, 'red');
    });
  }
  
  const overallStatus = failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
  const overallColor = failed === 0 ? 'green' : 'red';
  
  log(`\n${colors.bold}${overallStatus}${colors.reset}`, overallColor);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Cache Headers Test Script

Usage:
  node scripts/test-cache-headers.js [options]

Options:
  --help, -h    Show this help message

Environment Variables:
  TEST_URL      Base URL to test (default: http://localhost:3000)

Examples:
  # Test local development server
  node scripts/test-cache-headers.js

  # Test production deployment
  TEST_URL=https://your-app.vercel.app node scripts/test-cache-headers.js
  `);
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  log(`❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
}); 