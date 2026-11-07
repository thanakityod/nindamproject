const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.shell((err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => {
      const str = d.toString();
      process.stdout.write(str);
      if (str.includes('$ ') && !out.includes('CMD')) {
        out += 'CMD';
        console.log('\nRunning npm install in /app...');
        stream.write("cd /app && rm -rf package-lock.json .course-* node_modules && npm install\n");
      }
      if (str.includes('Backend node_modules is ready')) {
        console.log('\nSUCCESS! Node modules installed! Testing node server.js...');
        stream.write("node server.js\n");
      }
    });
  });
}).connect({
  host: '119.59.102.161',
  port: 2222,
  username: 'std6730251468',
  password: 'H7^b0Ami'
});
