import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TEMPLATE_HTML_PL, TEMPLATE_HTML_FR } from './templateHtml.gen';

/*
 * Eksport / druk szablonu listy zaopatrzenia.
 *
 * HTML pochodzi z src/services/templateHtml.gen.ts — pliku generowanego przez
 * scripts/generate_template.js z tej samej geometrii, której używa analizator
 * OMR (omrGeometry.gen.ts). Wszystkie elementy istotne dla skanowania są
 * pozycjonowane absolutnie w mm, więc wydruk z iOS, Androida i Chrome ma
 * IDENTYCZNĄ geometrię niezależnie od fontów systemowych.
 *
 * NIE wracaj do składania HTML w tym pliku — to była przyczyna rozjazdu
 * geometrii i ~37% błędnych odczytów (patrz omr-diagnosis.md).
 */
export async function exportListTemplatePdf(lang: 'pl' | 'fr' = 'pl'): Promise<void> {
  const html = lang === 'fr' ? TEMPLATE_HTML_FR : TEMPLATE_HTML_PL;

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle:
        lang === 'fr' ? 'Feuille de Ravitaillement (PDF)' : 'Lista Zaopatrzenia (PDF)',
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function printListTemplate(lang: 'pl' | 'fr' = 'pl'): Promise<void> {
  const html = lang === 'fr' ? TEMPLATE_HTML_FR : TEMPLATE_HTML_PL;
  await Print.printAsync({ html });
}
