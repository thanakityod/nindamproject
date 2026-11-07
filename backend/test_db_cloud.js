const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.shell((err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => {
      const str = d.toString();
      process.stdout.write(str);
      if (str.includes('$ ') && !out.includes('CMD_SENT')) {
        out += 'CMD_SENT';
        stream.write("mysql -h 127.0.0.1 -u std6730251468 -p'H7^b0Ami' ip_std6730251468 -e 'DESCRIBE Products; DESCRIBE user;'\n");
        setTimeout(() => {
          conn.end();
          process.exit(0);
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
