const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function startCloudService() {
  const conn = new Client();
  console.log('Connecting to Cloud Server (119.59.102.161:2222)...');

  // Load latest server.js and database.sql content to upload
  const serverJsPath = path.join(__dirname, 'server.js');
  const dbSqlPath = path.join(__dirname, 'database.sql');
  const serverB64 = Buffer.from(fs.readFileSync(serverJsPath, 'utf8')).toString('base64');
  const dbSqlB64 = Buffer.from(fs.readFileSync(dbSqlPath, 'utf8')).toString('base64');

  conn.on('ready', () => {
    console.log('✅ SSH Connection established.');
    conn.shell((err, stream) => {
      if (err) {
        console.error('Shell error:', err);
        return;
      }

      let isStepDone = false;

      stream.on('data', (d) => {
        const text = d.toString();
        process.stdout.write(text);

        // When shell prompt is ready
        if (text.includes('$ ') && !isStepDone) {
          isStepDone = true;
          console.log('\n🚀 Uploading updated server.js and database.sql...');
          stream.write(`echo "${serverB64}" | base64 -d > /app/server.js\n`);
          stream.write(`echo "${dbSqlB64}" | base64 -d > /app/database.sql\n`);

          setTimeout(() => {
            console.log('\n📥 Applying database updates into MySQL ip_std6730251468...');
            stream.write("mysql -h 127.0.0.1 -u std6730251468 -p'H7^b0Ami' ip_std6730251468 < /app/database.sql\n");
          }, 2000);

          setTimeout(() => {
            console.log('\n📊 Verifying MySQL database records in ip_std6730251468...');
            stream.write("mysql -h 127.0.0.1 -u std6730251468 -p'H7^b0Ami' ip_std6730251468 -e 'SELECT COUNT(*) as Products_Count FROM Products; SELECT user_id, username, email FROM user;'\n");
          }, 4000);

          setTimeout(() => {
            console.log('\n🔄 Starting updated server.js on port 3108...');
            stream.write("pkill -f 'node server.js' || true\n");
            stream.write("cd /app && node server.js\n");
          }, 6000);
        }
      });

      stream.on('close', () => {
        console.log('Cloud shell closed. Reconnecting in 5s...');
        setTimeout(startCloudService, 5000);
      });
    });
  }).on('error', (err) => {
    console.error('SSH Error:', err.message);
    setTimeout(startCloudService, 5000);
  }).connect({
    host: '119.59.102.161',
    port: 2222,
    username: 'std6730251468',
    password: 'H7^b0Ami',
    readyTimeout: 15000,
    keepaliveInterval: 10000
  });
}

startCloudService();
