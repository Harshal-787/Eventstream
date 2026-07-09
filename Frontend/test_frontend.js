const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login');
  
  await page.type('input[type="email"]', 'agent@test.com');
  await page.type('input[type="password"]', 'Password123!');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 3000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  console.log("HTML START\n" + content + "\nHTML END");
  
  await browser.close();
})();
