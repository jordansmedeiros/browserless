/**
 * Script de Importação em Massa de Credenciais
 * Importa credenciais de advogados para múltiplos tribunais
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dados extraídos da tabela fornecida
interface CredentialData {
  tribunal: string;
  instancia: string; // "1º Grau", "2º Grau", "Acesso Único"
  advogado: string;
  cpf: string;
  senha: string;
  obs?: string;
}

const CREDENTIALS_DATA: CredentialData[] = [
  // TJDFT
  { tribunal: 'TJDFT', instancia: '1º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@' },
  { tribunal: 'TJDFT', instancia: '2º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@' },
  { tribunal: 'TJDFT', instancia: '1º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678aA@' },

  // TJRO
  { tribunal: 'TJRO', instancia: '1º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: 'Pz12345678A@' },
  { tribunal: 'TJRO', instancia: '2º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '05234885640', senha: 'Pz12345678A@' },

  // TJMA
  { tribunal: 'TJMA', instancia: '1º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: 'Pz12345678A@' },
  { tribunal: 'TJMA', instancia: '2º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: 'Pz12345678A@' },
  { tribunal: 'TJMA', instancia: '1º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: 'Pz12345678A@' },

  // TJMS
  { tribunal: 'TJMS', instancia: 'Acesso Único', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@', obs: 'Duplo Fator por e-mail' },
  { tribunal: 'TJMS', instancia: 'Acesso Único', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678aA@' },

  // TJSP
  { tribunal: 'TJSP', instancia: 'Acesso Único', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678A@' },
  { tribunal: 'TJSP', instancia: 'Acesso Único', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: 'Pz12345678A@' },

  // TJPA
  { tribunal: 'TJPA', instancia: '1º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@' },
  { tribunal: 'TJPA', instancia: '2º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@' },
  { tribunal: 'TJPA', instancia: '1º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678aA@' },
  { tribunal: 'TJPA', instancia: '2º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678aA@' },

  // TJRJ
  { tribunal: 'TJRJ', instancia: 'Acesso Único', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: 'Pz12345678A@' },

  // TJPI
  { tribunal: 'TJPI', instancia: '1º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: 'Pz12345678A@' },
  { tribunal: 'TJPI', instancia: '2º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: 'Pz12345678A@' },

  // TJRN
  { tribunal: 'TJRN', instancia: '1º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678a@' },
  { tribunal: 'TJRN', instancia: '2º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678a@' },
  { tribunal: 'TJRN', instancia: '1º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678Aa@' },

  // TJMT
  { tribunal: 'TJMT', instancia: '1º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678a@' },
  { tribunal: 'TJMT', instancia: '2º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678a@' },
  { tribunal: 'TJMT', instancia: '1º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678a@' },
  { tribunal: 'TJMT', instancia: '2º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678a@' },

  // TJAL
  { tribunal: 'TJAL', instancia: 'Acesso Único', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@' },
  { tribunal: 'TJAL', instancia: 'Acesso Único', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678aA@' },

  // TJES
  { tribunal: 'TJES', instancia: '1º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@' },
  { tribunal: 'TJES', instancia: '2º Grau', advogado: 'Pedro Zattar Eugenio', cpf: '07529294610', senha: '12345678aA@' },
  { tribunal: 'TJES', instancia: '1º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678aA@' },
  { tribunal: 'TJES', instancia: '2º Grau', advogado: 'Pedro Polastri Lima', cpf: '05234885640', senha: '12345678aA@' },
];

// Informações dos advogados
const ADVOGADOS_INFO = {
  '07529294610': {
    nome: 'Pedro Zattar Eugenio',
    oabNumero: '12345',
    oabUf: 'MG',
  },
  '05234885640': {
    nome: 'Pedro Polastri Lima',
    oabNumero: '67890',
    oabUf: 'MG',
  },
};

// Mapeia instância para grau
function mapInstanciaToGrau(instancia: string): string {
  if (instancia === '1º Grau') return '1g';
  if (instancia === '2º Grau') return '2g';
  if (instancia === 'Acesso Único') return 'unico';
  throw new Error(`Instância desconhecida: ${instancia}`);
}

async function main() {
  console.log('🌱 Iniciando importação de credenciais...\n');

  // 1. Criar escritório padrão
  console.log('📋 Criando escritório...');
  let escritorio = await prisma.escritorio.findFirst({
    where: { nome: 'Escritório Padrão' },
  });

  if (!escritorio) {
    escritorio = await prisma.escritorio.create({
      data: {
        nome: 'Escritório Padrão',
      },
    });
    console.log(`  ✓ Escritório criado: ${escritorio.nome} (ID: ${escritorio.id})`);
  } else {
    console.log(`  ✓ Escritório já existe: ${escritorio.nome} (ID: ${escritorio.id})`);
  }
  console.log();

  // 2. Criar advogados
  console.log('👨‍⚖️ Criando advogados...');
  const advogadosCreated: Record<string, any> = {};

  for (const [cpf, info] of Object.entries(ADVOGADOS_INFO)) {
    const advogado = await prisma.advogado.upsert({
      where: {
        oabNumero_oabUf: {
          oabNumero: info.oabNumero,
          oabUf: info.oabUf,
        },
      },
      update: {},
      create: {
        cpf,
        nome: info.nome,
        oabNumero: info.oabNumero,
        oabUf: info.oabUf,
        escritorioId: escritorio.id,
      },
    });
    advogadosCreated[cpf] = advogado;
    console.log(`  ✓ Advogado: ${info.nome} (CPF: ${cpf}, OAB: ${info.oabNumero}/${info.oabUf})`);
  }
  console.log();

  // 3. Agrupar credenciais por advogado + senha
  console.log('🔑 Processando credenciais...');
  const credentialsGrouped = new Map<string, CredentialData[]>();

  CREDENTIALS_DATA.forEach((cred) => {
    const key = `${cred.cpf}|${cred.senha}`;
    if (!credentialsGrouped.has(key)) {
      credentialsGrouped.set(key, []);
    }
    credentialsGrouped.get(key)!.push(cred);
  });

  console.log(`  ℹ️  Total de ${credentialsGrouped.size} credenciais únicas (mesma senha agrupa múltiplos tribunais)\n`);

  // 4. Criar credenciais
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [key, credData] of credentialsGrouped.entries()) {
    const [cpf, senha] = key.split('|');
    const advogado = advogadosCreated[cpf];
    const primeiroRegistro = credData[0];

    console.log(`\n📝 Processando credencial para ${ADVOGADOS_INFO[cpf as keyof typeof ADVOGADOS_INFO].nome}:`);
    console.log(`   Senha: ${senha.substring(0, 3)}***`);
    console.log(`   Tribunais: ${credData.length}`);

    // Buscar TribunalConfigs para todos os tribunais desta credencial
    const tribunalConfigIds: string[] = [];

    for (const cred of credData) {
      const grau = mapInstanciaToGrau(cred.instancia);

      try {
        // Buscar tribunal pelo código
        const tribunal = await prisma.tribunal.findUnique({
          where: { codigo: cred.tribunal },
        });

        if (!tribunal) {
          console.log(`   ⚠️  Tribunal ${cred.tribunal} não encontrado no banco`);
          totalErrors++;
          continue;
        }

        // Buscar TribunalConfig pelo tribunal + grau
        const tribunalConfig = await prisma.tribunalConfig.findFirst({
          where: {
            tribunalId: tribunal.id,
            grau: grau,
          },
        });

        if (!tribunalConfig) {
          console.log(`   ⚠️  TribunalConfig não encontrado: ${cred.tribunal} ${grau}`);
          totalErrors++;
          continue;
        }

        tribunalConfigIds.push(tribunalConfig.id);
        console.log(`   ✓ ${cred.tribunal} - ${cred.instancia} (${tribunalConfig.sistema})`);
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${cred.tribunal}:`, error);
        totalErrors++;
      }
    }

    if (tribunalConfigIds.length === 0) {
      console.log(`   ⚠️  Nenhum tribunal válido encontrado, pulando credencial`);
      totalSkipped++;
      continue;
    }

    // Verificar se já existe credencial com essa senha
    const existingCred = await prisma.credencial.findUnique({
      where: {
        advogadoId_senha: {
          advogadoId: advogado.id,
          senha: senha,
        },
      },
    });

    if (existingCred) {
      console.log(`   ⚠️  Credencial já existe, pulando...`);
      totalSkipped++;
      continue;
    }

    // Criar credencial
    try {
      const descricao = primeiroRegistro.obs
        ? `Credencial - ${primeiroRegistro.obs}`
        : `Credencial para ${credData.length} tribunal(is)`;

      const credencial = await prisma.credencial.create({
        data: {
          advogadoId: advogado.id,
          senha: senha,
          descricao: descricao,
          ativa: true,
          tribunais: {
            create: tribunalConfigIds.map((tcId) => ({
              tribunalConfigId: tcId,
              tipoTribunal: credData[0].tribunal.startsWith('TRT')
                ? 'TRT'
                : credData[0].tribunal.startsWith('TRF')
                ? 'TRF'
                : credData[0].tribunal.startsWith('TJ')
                ? 'TJ'
                : 'Superior',
            })),
          },
        },
      });

      console.log(`   ✅ Credencial criada com sucesso! ID: ${credencial.id}`);
      totalCreated++;
    } catch (error) {
      console.error(`   ❌ Erro ao criar credencial:`, error);
      totalErrors++;
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('✅ Importação concluída!');
  console.log('='.repeat(60));
  console.log(`📊 Resumo:`);
  console.log(`   - Credenciais criadas: ${totalCreated}`);
  console.log(`   - Credenciais puladas (já existiam): ${totalSkipped}`);
  console.log(`   - Erros: ${totalErrors}`);
  console.log(`   - Total processado: ${credentialsGrouped.size}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar importação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
