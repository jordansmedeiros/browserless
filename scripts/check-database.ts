/**
 * Script para verificar o conteúdo do banco de dados
 * Verifica todas as tabelas relacionadas ao sistema de raspagem
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICAÇÃO DO BANCO DE DADOS');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Verificar Tribunais
    console.log('📋 TRIBUNAIS:');
    const tribunais = await prisma.tribunal.findMany({
      orderBy: { codigo: 'asc' },
      take: 5,
    });
    const totalTribunais = await prisma.tribunal.count();
    console.log(`   Total: ${totalTribunais} tribunais`);
    if (tribunais.length > 0) {
      console.log('   Primeiros 5:');
      tribunais.forEach(t => {
        console.log(`   - ${t.codigo}: ${t.nome} (${t.uf}) - Ativo: ${t.ativo}`);
      });
    } else {
      console.log('   ⚠️  VAZIO - Execute: npx prisma db seed');
    }

    // 2. Verificar TribunalConfig
    console.log('\n⚙️  TRIBUNAL CONFIGS:');
    const configs = await prisma.tribunalConfig.findMany({
      include: { tribunal: true },
      orderBy: { grau: 'asc' },
      take: 5,
    });
    const totalConfigs = await prisma.tribunalConfig.count();
    console.log(`   Total: ${totalConfigs} configurações`);
    if (configs.length > 0) {
      console.log('   Primeiras 5:');
      configs.forEach(c => {
        console.log(`   - ID: ${c.id}`);
        console.log(`     Tribunal: ${c.tribunal.codigo} - Grau: ${c.grau}`);
        console.log(`     URL Base: ${c.urlBase}`);
      });
    } else {
      console.log('   ⚠️  VAZIO - Execute: npx prisma db seed');
    }

    // 3. Verificar Escritórios
    console.log('\n🏢 ESCRITÓRIOS:');
    const escritorios = await prisma.escritorio.findMany({
      include: {
        advogados: true,
      },
    });
    console.log(`   Total: ${escritorios.length} escritórios`);
    if (escritorios.length > 0) {
      escritorios.forEach(e => {
        console.log(`   - ${e.nome} (${e.advogados.length} advogados)`);
      });
    } else {
      console.log('   ⚠️  VAZIO - Cadastre em /pje/credentials');
    }

    // 4. Verificar Advogados
    console.log('\n👨‍⚖️  ADVOGADOS:');
    const advogados = await prisma.advogado.findMany({
      include: {
        escritorio: true,
        credenciais: true,
      },
    });
    console.log(`   Total: ${advogados.length} advogados`);
    if (advogados.length > 0) {
      advogados.forEach(a => {
        console.log(`   - ${a.nome} (OAB: ${a.oabNumero}/${a.oabUf})`);
        console.log(`     CPF: ${a.cpf}`);
        console.log(`     Escritório: ${a.escritorio?.nome || 'Solo'}`);
        console.log(`     Credenciais: ${a.credenciais.length}`);
        console.log(`     ID Advogado PJE: ${a.idAdvogado || 'Não detectado'}`);
      });
    } else {
      console.log('   ⚠️  VAZIO - Cadastre em /pje/credentials');
    }

    // 5. Verificar Credenciais
    console.log('\n🔑 CREDENCIAIS:');
    const credenciais = await prisma.credencial.findMany({
      include: {
        advogado: true,
        tribunais: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
      },
    });
    console.log(`   Total: ${credenciais.length} credenciais`);
    if (credenciais.length > 0) {
      credenciais.forEach(c => {
        console.log(`   - Credencial ID: ${c.id}`);
        console.log(`     Advogado: ${c.advogado.nome}`);
        console.log(`     Descrição: ${c.descricao || 'Sem descrição'}`);
        console.log(`     Ativa: ${c.ativa}`);
        console.log(`     Tribunais associados: ${c.tribunais.length}`);
        if (c.tribunais.length > 0) {
          c.tribunais.forEach(ct => {
            console.log(`       • ${ct.tribunalConfig.tribunal.codigo}-${ct.tribunalConfig.grau} (Tipo: ${ct.tipoTribunal})`);
            console.log(`         Validado em: ${ct.validadoEm || 'Nunca'}`);
          });
        }
      });
    } else {
      console.log('   ⚠️  VAZIO - Cadastre em /pje/credentials');
    }

    // 6. Verificar Jobs de Raspagem
    console.log('\n📊 SCRAPE JOBS:');
    const jobs = await prisma.scrapeJob.findMany({
      include: {
        tribunals: {
          include: {
            tribunalConfig: {
              include: {
                tribunal: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const totalJobs = await prisma.scrapeJob.count();
    console.log(`   Total: ${totalJobs} jobs`);
    if (jobs.length > 0) {
      console.log('   Últimos 5:');
      jobs.forEach(j => {
        console.log(`   - Job ID: ${j.id}`);
        console.log(`     Status: ${j.status}`);
        console.log(`     Tipo: ${j.scrapeType} ${j.scrapeSubType ? `(${j.scrapeSubType})` : ''}`);
        console.log(`     Tribunais: ${j.tribunals.length}`);
        console.log(`     Criado em: ${j.createdAt}`);
      });
    } else {
      console.log('   📝 Nenhum job criado ainda');
    }

    // 7. Resumo e Diagnóstico
    console.log('\n' + '='.repeat(70));
    console.log('📝 DIAGNÓSTICO:');
    console.log('='.repeat(70));

    const problemas: string[] = [];

    if (totalTribunais === 0) {
      problemas.push('❌ Banco vazio - Execute: npx prisma db seed');
    } else {
      console.log('✅ Tribunais cadastrados');
    }

    if (totalConfigs === 0) {
      problemas.push('❌ Sem configurações de tribunal - Execute: npx prisma db seed');
    } else {
      console.log('✅ Configurações de tribunal cadastradas');
    }

    if (advogados.length === 0) {
      problemas.push('⚠️  Sem advogados cadastrados - Acesse /pje/credentials');
    } else {
      console.log('✅ Advogados cadastrados');
    }

    if (credenciais.length === 0) {
      problemas.push('⚠️  Sem credenciais cadastradas - Acesse /pje/credentials');
    } else {
      console.log('✅ Credenciais cadastradas');
    }

    const credenciaisComTribunais = credenciais.filter(c => c.tribunais.length > 0);
    if (credenciaisComTribunais.length === 0 && credenciais.length > 0) {
      problemas.push('⚠️  Credenciais existem mas não estão associadas a tribunais');
    } else if (credenciaisComTribunais.length > 0) {
      console.log('✅ Credenciais associadas a tribunais');
    }

    if (problemas.length > 0) {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS:');
      problemas.forEach(p => console.log(`   ${p}`));
    } else {
      console.log('\n🎉 Tudo certo! Sistema pronto para criar jobs de raspagem.');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
