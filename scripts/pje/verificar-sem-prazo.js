import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/pje/trt3/1g/pendentes/pend-I-20251024-183501.json', 'utf8'));

const comPDF = data.filter(p => p.pdfLocal);
const comAssoc = data.filter(p => p.processosAssociados && p.processosAssociados.length > 0);

console.log('=== RASPAGEM SEM PRAZO ===\n');
console.log('Total de processos:', data.length);
console.log('Com PDF baixado:', comPDF.length);
console.log('Com processos associados:', comAssoc.length);

if (data.length > 0) {
  console.log('\nPrimeiro processo:');
  console.log('  Numero:', data[0].numeroProcesso);
  console.log('  Parte Autora:', data[0].nomeParteAutora);
  console.log('  PDF Local:', data[0].pdfLocal);
  console.log('  URL Doc:', data[0].urlDocumento);

  if (data[0].documentoMetadados) {
    console.log('  Documento:', data[0].documentoMetadados.titulo);
  }
}
