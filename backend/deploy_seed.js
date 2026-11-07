const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'database.sql');
const sqlB64 = fs.readFileSync(sqlPath).toString('base64');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to SSH shell. Writing database.sql via base64...');
  conn.shell((err, stream) => {
    if (err) throw err;
    let stage = 0;
    stream.on('data', (d) => {
      const str = d.toString();
      process.stdout.write(str);
      if (str.includes('$ ') && stage === 0) {
        stage = 1;
        // Write base64 to file and decode
        stream.write(`echo "${sqlB64}" | base64 -d > /app/database.sql\n`);
        setTimeout(() => {
          stage = 2;
          console.log('\nExecuting database.sql into MySQL...');
          stream.write("mysql -h 127.0.0.1 -u std6730251468 -p'H7^b0Ami' ip_std6730251468 < /app/database.sql\n");
          setTimeout(() => {
            stream.write("mysql -h 127.0.0.1 -u std6730251468 -p'H7^b0Ami' ip_std6730251468 -e 'SELECT COUNT(*) as ProductsCount FROM Products; SELECT user_id, username, email FROM user;'\n");
            setTimeout(() => {
              conn.end();
              process.exit(0);
            }, 3000);
          }, 2000);
        }, 1500);
      }
    });
  });
}).connect({
  host: '119.59.102.161',
  port: 2222,
  username: 'std6730251468',
  password: 'H7^b0Ami'
});
