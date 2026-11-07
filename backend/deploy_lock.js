const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const lockPath = path.join(__dirname, 'package-lock.json');
const lockB64 = fs.readFileSync(lockPath).toString('base64');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to SSH shell. Writing package-lock.json...');
  conn.shell((err, stream) => {
    if (err) throw err;
    let step = 0;
    stream.on('data', (d) => {
      const str = d.toString();
      process.stdout.write(str);
      if (str.includes('$ ') && step === 0) {
        step = 1;
        stream.write(`echo "${lockB64}" | base64 -d > /app/package-lock.json\n`);
        setTimeout(() => {
          console.log('\nRunning npm ci in /app...');
          stream.write("cd /app && npm ci\n");
        }, 1500);
      }
      if (str.includes('audited') || str.includes('added ')) {
        console.log('\nDependencies installed! Starting node server.js...');
        stream.write("cd /app && node server.js\n");
      }
    });
  });
}).connect({
  host: '119.59.102.161',
  port: 2222,
  username: 'std6730251468',
  password: 'H7^b0Ami'
});
