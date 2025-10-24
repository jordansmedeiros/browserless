import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/pje/trt3/1g/pendentes/pend-N-C-20251024-182427.json', 'utf8'));

const comPDF = data.filter(p => p.pdfLocal);
const semPDF = data.filter(p => !p.pdfLocal);

console.log('Total processos:', data.length);
console.log('Com PDF baixado:', comPDF.length);
console.log('Sem PDF:', semPDF.length);

if (comPDF.length > 0) {
  console.log('\nPrimeiro processo COM PDF:');
  console.log('  Numero:', comPDF[0].numeroProcesso);
  console.log('  PDF Local:', comPDF[0].pdfLocal);
  console.log('  URL Doc:', comPDF[0].urlDocumento);
}
