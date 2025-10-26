/**
 * Script para criar o banco de dados PostgreSQL dedicado
 */

import pkg from 'pg';
const { Client } = pkg;

async function createDatabase() {
  // Conectar ao banco "postgres" padrão primeiro
  const client = new Client({
    host: 'postgres.platform.sinesys.app',
    port: 15432,
    user: 'postgres',
    password: '4c6c4d5fb548a9cb',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL');

    // Verificar se o banco já existe
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'jusbrowserless'"
    );

    if (checkDb.rows.length > 0) {
      console.log('✓ Banco de dados "jusbrowserless" já existe');
    } else {
      // Criar o banco de dados usando template0 para evitar problemas de collation
      await client.query('CREATE DATABASE jusbrowserless TEMPLATE template0');
      console.log('✓ Banco de dados "jusbrowserless" criado com sucesso!');
    }
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✓ Banco de dados "jusbrowserless" já existe');
    } else {
      console.error('✗ Erro ao criar banco de dados:', error.message);
      throw error;
    }
  } finally {
    await client.end();
  }
}

createDatabase().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
