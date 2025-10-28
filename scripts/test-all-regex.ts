// Testa o regex para todos os tipos de tribunal

const regex = /^[A-Z0-9]{3,6}-(PJE|EPROC|ESAJ|PROJUDI|THEMIS)-(1g|2g|unico)$/;

const exemplos = [
  // TRTs
  'TRT1-PJE-1g',
  'TRT10-PJE-2g',
  'TRT24-PJE-1g',

  // TJs
  'TJCE-PJE-1g',
  'TJSP-ESAJ-unico',
  'TJDFT-PJE-2g',
  'TJMS-ESAJ-unico',

  // TRFs
  'TRF1-PJE-1g',
  'TRF5-PJE-2g',

  // Superiores
  'TST-PJE-unico',
  'STJ-PJE-unico',
  'STF-PJE-unico',

  // Casos inválidos
  'TRT1-INVALID-1g',
  'TRT1-PJE-3g',
  'trt1-PJE-1g',
];

console.log('Testando regex para todos os tipos de tribunal:\n');
console.log(`Regex: ${regex}\n`);

exemplos.forEach((id) => {
  const match = regex.test(id);
  const status = match ? '✅' : '❌';
  console.log(`${status} ${id}`);
});
