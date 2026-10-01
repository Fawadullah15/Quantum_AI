const https = require('https');

https.get('https://quantumai-snowy.vercel.app/work/youth-development-program-website', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // Extract the diagnostic div
    const match = data.match(/DIAGNOSTIC: SERVER DB GALLERY CONTENT([\s\S]*?)<\/div>/);
    if (match) {
      console.log("Diagnostic Found:");
      console.log(match[1]);
    } else {
      console.log("Diagnostic not found in HTML. Maybe it hasn't deployed yet?");
    }
  });
}).on('error', (err) => {
  console.log("Error:", err.message);
});
