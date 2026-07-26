
const path = require('node:path');

process.env.HOSTNAME = '0.0.0.0';
process.env.PORT = process.env.PORT || '8080';

console.log(`Starting Nythera Dashboard on ${process.env.HOSTNAME}:${process.env.PORT}`);

const serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');

try {
  require(serverPath);
} catch (error) {
  console.error('Dashboard startup failed:', error);
  process.exit(1);
}
