const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const serverJsContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
const packageJsonContent = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');

const envContent = `PORT=3108
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=std6730251468
DB_PASSWORD=H7^b0Ami
DB_NAME=ip_std6730251468
JWT_SECRET=digital_watch_jwt_secret_std6730251468_2026
`;

const serverB64 = Buffer.from(serverJsContent).toString('base64');
const pkgB64 = Buffer.from(packageJsonContent).toString('base64');
const envB64 = Buffer.from(envContent).toString('base64');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to SSH shell. Writing files...');
  conn.shell((err, stream) => {
    if (err) throw err;
    let step = 0;
    stream.on('data', (d) => {
      const str = d.toString();
      process.stdout.write(str);
      if (str.includes('$ ') && step === 0) {
        step = 1;
        stream.write(`echo "${pkgB64}" | base64 -d > /app/package.json\n`);
        stream.write(`echo "${envB64}" | base64 -d > /app/.env\n`);
        stream.write(`echo "${serverB64}" | base64 -d > /app/server.js\n`);
        setTimeout(() => {
          step = 2;
          console.log('\nRunning npm install...');
          stream.write("cd /app && rm -rf package-lock.json && npm install\n");
        }, 1500);
      }
      if (str.includes('packages') && step === 2) {
        step = 3;
        console.log('\nNPM install completed! Starting node server.js with nohup...');
        stream.write("pkill -f 'node server.js' || true\n");
        stream.write("nohup node server.js > /app/server.log 2>&1 &\n");
        setTimeout(() => {
          stream.write("cat /app/server.log\n");
          stream.write("curl -s http://127.0.0.1:3108/api\n");
          setTimeout(() => {
            conn.end();
            process.exit(0);
          }, 4000);
        }, 3000);
      }
    });
  });
}).connect({
  host: '119.59.102.161',
  port: 2222,
  username: 'std6730251468',
  password: 'H7^b0Ami'
});
