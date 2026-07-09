const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173/login');
  await new Promise(r => setTimeout(r, 1000));
  
  const content = await page.evaluate(() => document.body.innerText);
  console.log(content.includes('Email address') ? "SUCCESS: Page rendered" : "FAIL: Page didn't render. Content: " + content);
  
  await browser.close();
})();
