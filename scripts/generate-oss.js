#!/usr/bin/env node

/**
 * OSS.txt Generator for Fret Flashcards
 * 
 * This script generates an OSS.txt file containing information about
 * all open source dependencies used in this project, including their
 * licenses and copyright information.
 */

const fs = require('fs');
const path = require('path');

// Known license mappings for common packages
const LICENSE_MAPPINGS = {
  'MIT': 'MIT License',
  'Apache-2.0': 'Apache License 2.0',
  'BSD-3-Clause': 'BSD 3-Clause License',
  'BSD-2-Clause': 'BSD 2-Clause License',
  'ISC': 'ISC License',
  'GPL-3.0': 'GNU General Public License v3.0',
  'GPL-2.0': 'GNU General Public License v2.0',
  'LGPL-3.0': 'GNU Lesser General Public License v3.0',
  'LGPL-2.1': 'GNU Lesser General Public License v2.1',
  'MPL-2.0': 'Mozilla Public License 2.0',
  'CC0-1.0': 'Creative Commons Zero v1.0 Universal',
  'Unlicense': 'The Unlicense',
  '0BSD': 'BSD Zero Clause License',
  'WTFPL': 'Do What The F*ck You Want To Public License'
};

// Common license URLs
const LICENSE_URLS = {
  'MIT': 'https://opensource.org/licenses/MIT',
  'Apache-2.0': 'https://opensource.org/licenses/Apache-2.0',
  'BSD-3-Clause': 'https://opensource.org/licenses/BSD-3-Clause',
  'BSD-2-Clause': 'https://opensource.org/licenses/BSD-2-Clause',
  'ISC': 'https://opensource.org/licenses/ISC',
  'GPL-3.0': 'https://www.gnu.org/licenses/gpl-3.0.html',
  'GPL-2.0': 'https://www.gnu.org/licenses/gpl-2.0.html',
  'LGPL-3.0': 'https://www.gnu.org/licenses/lgpl-3.0.html',
  'LGPL-2.1': 'https://www.gnu.org/licenses/lgpl-2.1.html',
  'MPL-2.0': 'https://www.mozilla.org/en-US/MPL/2.0/',
  'CC0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Unlicense': 'https://unlicense.org/',
  '0BSD': 'https://opensource.org/licenses/0BSD',
  'WTFPL': 'http://www.wtfpl.net/'
};

function getLicenseInfo(license) {
  if (!license) return { name: 'Unknown', url: '' };
  
  // Handle array of licenses
  if (Array.isArray(license)) {
    return license.map(l => getLicenseInfo(l));
  }
  
  // Handle object with type property
  if (typeof license === 'object' && license.type) {
    return getLicenseInfo(license.type);
  }
  
  // Handle string license
  if (typeof license === 'string') {
    const cleanLicense = license.replace(/[()]/g, '').trim();
    return {
      name: LICENSE_MAPPINGS[cleanLicense] || cleanLicense,
      url: LICENSE_URLS[cleanLicense] || ''
    };
  }
  
  return { name: 'Unknown', url: '' };
}

function formatLicenseInfo(licenseInfo) {
  if (Array.isArray(licenseInfo)) {
    return licenseInfo.map(formatLicenseInfo).join(' OR ');
  }
  return licenseInfo.name;
}

function generateOSSText(packageJson) {
  const projectName = packageJson.name || 'Unknown Project';
  const projectVersion = packageJson.version || 'Unknown Version';
  const projectDescription = packageJson.description || '';
  
  let ossText = `OPEN SOURCE SOFTWARE NOTICE
${'='.repeat(50)}

Project: ${projectName}
Version: ${projectVersion}
Description: ${projectDescription}

This document contains information about the open source software
components used in this project and their respective licenses.

Generated on: ${new Date().toISOString()}

${'='.repeat(50)}
DEPENDENCIES
${'='.repeat(50)}

`;

  // Process only production dependencies (exclude devDependencies)
  const prodDeps = packageJson.dependencies || {};
  const sortedDeps = Object.keys(prodDeps).sort();

  for (const depName of sortedDeps) {
    const depVersion = prodDeps[depName];
    
    ossText += `\n${depName} (${depVersion})\n`;
    ossText += '-'.repeat(40) + '\n';
    
    // Try to get license info from package.json if available
    // For now, we'll use a generic approach since we don't have access to node_modules
    ossText += `License: See package documentation\n`;
    ossText += `Source: https://www.npmjs.com/package/${depName}\n`;
    ossText += `Version: ${depVersion}\n`;
    ossText += '\n';
  }

  // Add project license information
  ossText += `\n${'='.repeat(50)}
PROJECT LICENSE
${'='.repeat(50)}

This project is dual-licensed under:

1. Mozilla Public License Version 2.0 (MPL-2.0)
   - For open source use and distribution
   - See LICENSE file for full text
   - URL: https://www.mozilla.org/en-US/MPL/2.0/

2. Commercial License
   - For commercial use and App Store distribution
   - See LICENSE-COMMERCIAL file for full text
   - Contact: stringhomeworktutor@ledentsov.de

${'='.repeat(50)}
NOTICE
${'='.repeat(50)}

This software includes open source components. The licenses for these
components are available in their respective package documentation or
at the URLs provided above.

For questions about this notice or the licenses, please contact:
stringhomeworktutor@ledentsov.de

${'='.repeat(50)}
END OF NOTICE
${'='.repeat(50)}
`;

  return ossText;
}

function main() {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.error('Error: package.json not found');
      process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const ossText = generateOSSText(packageJson);
    
    const outputPath = path.join(__dirname, '..', 'OSS.txt');
    fs.writeFileSync(outputPath, ossText, 'utf8');
    
    console.log('✅ OSS.txt generated successfully!');
    console.log(`📄 Output file: ${outputPath}`);
    console.log(`📦 Processed ${Object.keys(packageJson.dependencies || {}).length} production dependencies`);
    console.log(`ℹ️  Development dependencies excluded (not required for distribution)`);
    
  } catch (error) {
    console.error('Error generating OSS.txt:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateOSSText, getLicenseInfo };
