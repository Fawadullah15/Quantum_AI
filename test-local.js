const http = require('http');

http.get('http://localhost:3000/work/youth-development-program-website', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
  });
}).on('error', (err) => {
  console.log("Error:", err.message);
});
