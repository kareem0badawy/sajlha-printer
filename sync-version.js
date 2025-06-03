const fs = require('fs');

const version = require('./version.json').version;
const packageJson = require('./package.json');

packageJson.version = version;

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ package.json updated to version:', version);
