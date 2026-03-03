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
  API_URL: (import.meta.env.VITE_API_URL || 'https://enviador-backend-ca2c88a2ae88.herokuapp.com').replace(/\/$/, ''),

  /**
   * Endpoint base para requisições da API
   */
  API_BASE: `${(import.meta.env.VITE_API_URL || 'https://enviador-backend-ca2c88a2ae88.herokuapp.com').replace(/\/$/, '')}/api`,
};

export default config;
