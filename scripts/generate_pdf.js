const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, '../lista_zaopatrzenia.html');
  const pdfPath = path.resolve(__dirname, '../lista_zaopatrzenia.pdf');
  
  const content = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(content, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    }
  });

  await browser.close();
  console.log('PDF generated at ' + pdfPath);
})();
