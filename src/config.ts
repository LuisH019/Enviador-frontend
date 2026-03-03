/**
 * Configuração centralizada da aplicação
 * Utiliza variáveis de ambiente do Vite
 */

export const config = {
  /**
   * URL base da API do backend
   * Em desenvolvimento: http://localhost:8000
   * Em produção: use VITE_API_URL no .env.production
   */
  API_URL: 'http://localhost:8000',

  /**
   * Endpoint base para requisições da API
   */
  API_BASE: 'http://localhost:8000/api',
};

export default config;
