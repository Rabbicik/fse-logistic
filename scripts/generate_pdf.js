/*
 * Renderuje szablony HTML (wygenerowane przez generate_template.js)
 * do PDF przez Puppeteer. Uruchom najpierw: node scripts/generate_template.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TARGETS = [
  ['lista_zaopatrzenia.html', 'lista_zaopatrzenia.pdf'],
  ['lista_zaopatrzenia_fr.html', 'lista_zaopatrzenia_fr.pdf'],
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const [htmlName, pdfName] of TARGETS) {
    const htmlPath = path.resolve(__dirname, '..', htmlName);
    const pdfPath = path.resolve(__dirname, '..', pdfName);
    const content = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(content, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    console.log('PDF generated at ' + pdfPath);
  }

  await browser.close();
})();
