const fs = require('fs');
const content = fs.readFileSync('src/components/SmartCityBackground.tsx', 'utf8');
console.log(content.includes('Easing.cubic'));
