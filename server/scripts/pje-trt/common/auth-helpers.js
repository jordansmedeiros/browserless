/**
 * Auth Helpers - Funções compartilhadas de autenticação PJE
 *
 * Este módulo fornece funções utilitárias para:
 * - Descoberta automática do ID do advogado via JWT
 * - Validação de credenciais
 */

/**
 * Extrai o ID do advogado do token JWT (cookie access_token)
 *
 * @param {Page} page - Página do Puppeteer (já autenticada)
 * @param {number} fallbackId - ID do advogado para usar como fallback se não encontrar no JWT
 * @returns {Promise<{idAdvogado: number, advogadoInfo: object|null}>}
 */
export async function obterIdAdvogado(page, fallbackId = null) {
  console.error('👤 Buscando ID do advogado do token JWT...\n');

  // Extrai ID do advogado do token JWT (cookie access_token)
  const advogadoInfo = await page.evaluate(async () => {
    try {
      // Função para decodificar JWT
      const decodeJWT = (token) => {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          return JSON.parse(jsonPayload);
        } catch (e) {
          return null;
        }
      };

      // Obtém o cookie access_token
      const cookies = document.cookie.split(';');
      let accessToken = null;

      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
          accessToken = value;
          break;
        }
      }

      if (!accessToken) {
        return { error: 'Token access_token não encontrado nos cookies' };
      }

      // Decodifica o JWT
      const decodedToken = decodeJWT(accessToken);

      if (!decodedToken) {
        return { error: 'Falha ao decodificar token JWT' };
      }

      // Extrai informações do token
      // O campo "id" contém o ID do advogado (não confundir com "perfil")
      return {
        idAdvogado: decodedToken.id,  // ← ID correto do advogado
        cpf: decodedToken.login,
        nome: decodedToken.nome,
        perfil: decodedToken.perfil,  // Para referência (mas não é usado na API)
        tokenCompleto: decodedToken,  // Para debug
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  let idAdvogado;
  let discoveredInfo = null;

  if (advogadoInfo.error) {
    console.error(`⚠️  Erro ao extrair ID do advogado do JWT: ${advogadoInfo.error}`);
    if (fallbackId) {
      console.error('   Usando ID_ADVOGADO fornecido como fallback...\n');
      idAdvogado = fallbackId;
    } else {
      throw new Error(`Não foi possível obter ID do advogado: ${advogadoInfo.error}`);
    }
  } else if (advogadoInfo.idAdvogado) {
    idAdvogado = advogadoInfo.idAdvogado;
    discoveredInfo = {
      idAdvogado: String(advogadoInfo.idAdvogado), // Converte para string
      cpf: advogadoInfo.cpf,
      nome: advogadoInfo.nome,
    };
    console.error(`✅ ID do advogado extraído do JWT: ${idAdvogado}`);
    console.error(`   Nome: ${advogadoInfo.nome}`);
    console.error(`   CPF: ${advogadoInfo.cpf}`);
    console.error(`   Perfil ID: ${advogadoInfo.perfil}\n`);
  } else {
    console.error('⚠️  ID do advogado não encontrado no token JWT');
    if (fallbackId) {
      console.error('   Usando ID_ADVOGADO fornecido como fallback...\n');
      idAdvogado = fallbackId;
    } else {
      throw new Error('ID do advogado não encontrado no token JWT e nenhum fallback fornecido');
    }
  }

  console.error(`✅ ID do advogado configurado: ${idAdvogado}\n`);

  return {
    idAdvogado,
    advogadoInfo: discoveredInfo,
  };
}

/**
 * Valida se as credenciais básicas (CPF e SENHA) estão presentes
 * PJE_ID_ADVOGADO é opcional pois pode ser descoberto automaticamente via JWT
 *
 * @param {boolean} requireIdAdvogado - Se true, exige PJE_ID_ADVOGADO (padrão: false)
 */
export function validarCredenciais(requireIdAdvogado = false) {
  const credenciaisFaltando = [];

  if (!process.env.PJE_CPF) credenciaisFaltando.push('PJE_CPF');
  if (!process.env.PJE_SENHA) credenciaisFaltando.push('PJE_SENHA');
  if (requireIdAdvogado && !process.env.PJE_ID_ADVOGADO) {
    credenciaisFaltando.push('PJE_ID_ADVOGADO');
  }

  if (credenciaisFaltando.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO: Credenciais PJE não configuradas');
    console.error('='.repeat(70));
    console.error('\nVariáveis de ambiente faltando:');
    credenciaisFaltando.forEach(v => console.error(`  - ${v}`));
    console.error('\n💡 Como configurar:');
    console.error('  1. Copie o arquivo .env.example para .env');
    console.error('  2. Preencha as variáveis PJE_CPF e PJE_SENHA');
    if (!requireIdAdvogado) {
      console.error('  3. PJE_ID_ADVOGADO é opcional (descoberto automaticamente via JWT)');
    } else {
      console.error('  3. Preencha PJE_ID_ADVOGADO');
    }
    console.error('\n📖 Consulte o README para mais informações.\n');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
}
