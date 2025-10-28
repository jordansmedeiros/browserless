/**
 * Script para popular credenciais dos TJs/TRFs/Superiores no banco de dados
 * Baseado na tabela em docs/TJS_TRFS_TRIBUNAIS_SUPERIORES.md
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de Tribunal → Sistema (baseado na documentação)
const TRIBUNAL_SISTEMA_MAP: Record<string, string> = {
  // TJs que usam PJE
  'TJDFT': 'PJE',
  'TJRO': 'PJE',
  'TJMA': 'PJE',
  'TJPA': 'PJE',
  'TJPI': 'PJE',
  'TJRN': 'PJE',
  'TJMT': 'PJE',
  'TJES': 'PJE',
  // TJs que usam ESAJ
  'TJSP': 'ESAJ',
  'TJMS': 'ESAJ',
  'TJAL': 'ESAJ',
  'TJRJ': 'ESAJ',
};

// Conversão de Instância para Grau
function instanciaToGrau(instancia: string): string {
  if (instancia.includes('1º')) return '1g';
  if (instancia.includes('2º')) return '2g';
  if (instancia.toLowerCase().includes('único') || instancia.toLowerCase().includes('unico')) return 'unico';
  throw new Error(`Instância desconhecida: ${instancia}`);
}

// Dados das credenciais (parseados da tabela)
const credenciais = [
  { tribunal: 'TJDFT', instancia: '1º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJDFT', instancia: '2º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJDFT', instancia: '1º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJRO', instancia: '1º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJRO', instancia: '2º Grau', advogado: 'Pedro Zattar', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJMA', instancia: '1º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJMA', instancia: '2º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJMS', instancia: 'Acesso Único', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678aA@', obs: 'Duplo Fator por e-mail' },
  { tribunal: 'TJMS', instancia: 'Acesso Único', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJSP', instancia: 'Acesso Único', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678A@', obs: '' },
  { tribunal: 'TJSP', instancia: 'Acesso Único', advogado: 'Pedro Polastri', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJPA', instancia: '1º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJPA', instancia: '2º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJPA', instancia: '1º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJPA', instancia: '2º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJMA', instancia: '1º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJRJ', instancia: 'Acesso Único', advogado: 'Pedro Polastri', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJPI', instancia: '1º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJPI', instancia: '2º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJRO', instancia: '1º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJRO', instancia: '2º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: 'Pz12345678A@', obs: '' },
  { tribunal: 'TJRN', instancia: '1º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678a@', obs: '' },
  { tribunal: 'TJRN', instancia: '2º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678a@', obs: '' },
  { tribunal: 'TJRN', instancia: '1º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678Aa@', obs: '' },
  { tribunal: 'TJMT', instancia: '1º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678a@', obs: '' },
  { tribunal: 'TJMT', instancia: '2º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678a@', obs: '' },
  { tribunal: 'TJMT', instancia: '1º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678a@', obs: '' },
  { tribunal: 'TJMT', instancia: '2º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678a@', obs: '' },
  { tribunal: 'TJAL', instancia: 'Acesso Único', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJAL', instancia: 'Acesso Único', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJES', instancia: '1º Grau', advogado: 'Pedro Zattar', cpf: '07529294610', senha: '12345678aA@', obs: '' },
  { tribunal: 'TJES', instancia: '2º Grau', advogado: 'Pedro Polastri', cpf: '05234885640', senha: '12345678aA@', obs: '' },
];

async function main() {
  console.log('🔐 Iniciando seed de credenciais...\n');

  // 1. Buscar ou criar advogados
  const advogados = new Map<string, string>(); // CPF -> ID

  const cpfs = ['07529294610', '05234885640'];
  for (const cpf of cpfs) {
    let advogado = await prisma.advogado.findFirst({
      where: { cpf },
    });

    if (!advogado) {
      const nome = cpf === '07529294610' ? 'Pedro Zattar' : 'Pedro Polastri';
      console.log(`⚠️  Advogado ${nome} (CPF: ${cpf}) não encontrado. Criando...`);
      advogado = await prisma.advogado.create({
        data: {
          nome,
          cpf,
          oabNumero: cpf === '07529294610' ? '123456' : '654321',
          oabUf: 'DF',
          escritorioId: null,
        },
      });
      console.log(`   ✅ Advogado ${nome} criado com sucesso\n`);
    }

    advogados.set(cpf, advogado.id);
  }

  // 2. Processar credenciais
  let criadas = 0;
  let duplicadas = 0;
  let erros = 0;

  for (const cred of credenciais) {
    try {
      const advogadoId = advogados.get(cred.cpf);
      if (!advogadoId) {
        console.error(`❌ Advogado não encontrado para CPF: ${cred.cpf}`);
        erros++;
        continue;
      }

      // Gerar ID do TribunalConfig
      const sistema = TRIBUNAL_SISTEMA_MAP[cred.tribunal];
      if (!sistema) {
        console.error(`❌ Sistema desconhecido para tribunal: ${cred.tribunal}`);
        erros++;
        continue;
      }

      const grau = instanciaToGrau(cred.instancia);
      const tribunalConfigId = `${cred.tribunal}-${sistema}-${grau}`;

      // Buscar TribunalConfig
      const tribunalConfig = await prisma.tribunalConfig.findFirst({
        where: {
          tribunal: {
            codigo: cred.tribunal,
          },
          sistema,
          grau,
        },
        include: {
          tribunal: true,
        },
      });

      if (!tribunalConfig) {
        console.error(`❌ TribunalConfig não encontrado: ${tribunalConfigId}`);
        erros++;
        continue;
      }

      // Verificar duplicata
      const existente = await prisma.credencial.findUnique({
        where: {
          advogadoId_senha: {
            advogadoId,
            senha: cred.senha,
          },
        },
      });

      if (existente) {
        console.log(`⏭️  Credencial já existe: ${cred.advogado} - ${tribunalConfigId}`);
        duplicadas++;
        continue;
      }

      // Determinar tipoTribunal
      let tipoTribunal = 'TRT';
      if (cred.tribunal.startsWith('TJ')) tipoTribunal = 'TJ';
      else if (cred.tribunal.startsWith('TRF')) tipoTribunal = 'TRF';
      else if (['TST', 'STJ', 'STF'].includes(cred.tribunal)) tipoTribunal = 'Superior';

      // Criar credencial
      await prisma.credencial.create({
        data: {
          senha: cred.senha,
          descricao: cred.obs || `Credencial ${cred.tribunal}`,
          advogadoId,
          tribunais: {
            create: {
              tribunalConfigId: tribunalConfig.id,
              tipoTribunal,
            },
          },
        },
      });

      console.log(`✅ Credencial criada: ${cred.advogado} - ${tribunalConfigId}`);
      criadas++;
    } catch (error) {
      console.error(`❌ Erro ao processar: ${cred.tribunal} - ${cred.advogado}`, error);
      erros++;
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Criadas: ${criadas}`);
  console.log(`   ⏭️  Duplicadas: ${duplicadas}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`   📝 Total processado: ${credenciais.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
