/**
 * Auth Helpers para PJE TJMG
 * Funções auxiliares para validação e obtenção de credenciais
 */

/**
 * Valida se as credenciais necessárias estão presentes
 * @param {boolean} requireIdAdvogado - Se true, ID_ADVOGADO é obrigatório
 */
export function validarCredenciais(requireIdAdvogado = false) {
  const errors = [];

  if (!process.env.PJE_CPF) {
    errors.push('❌ PJE_CPF não configurado');
  }

  if (!process.env.PJE_SENHA) {
    errors.push('❌ PJE_SENHA não configurado');
  }

  if (requireIdAdvogado && !process.env.PJE_ID_ADVOGADO) {
    errors.push('❌ PJE_ID_ADVOGADO não configurado');
  }

  if (errors.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO: Credenciais PJE não configuradas');
    console.error('='.repeat(70));
    errors.forEach(err => console.error(err));
    console.error('\n💡 Configure as variáveis de ambiente no arquivo .env:');
    console.error('   PJE_CPF=seu_cpf');
    console.error('   PJE_SENHA=sua_senha');
    if (requireIdAdvogado) {
      console.error('   PJE_ID_ADVOGADO=seu_id');
    }
    console.error('\n⚠️  Ou configure através do sistema em:');
    console.error('   http://localhost:3000/pje/credentials\n');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
}

/**
 * Obtém o ID do advogado das variáveis de ambiente
 * @returns {number|null} ID do advogado ou null se não configurado
 */
export function obterIdAdvogado() {
  const id = process.env.PJE_ID_ADVOGADO;
  if (!id) return null;

  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    console.error('⚠️  Aviso: PJE_ID_ADVOGADO não é um número válido');
    return null;
  }

  return parsed;
}
