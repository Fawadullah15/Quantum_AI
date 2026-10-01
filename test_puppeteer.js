const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  const content = await page.content();
  if (content.includes('went wrong')) {
    console.log('FOUND ERROR UI');
  } else {
    console.log('NO ERROR UI');
  }
  await browser.close();
})();
