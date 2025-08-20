// src/utils/pixValidator.js

/**
 * Valida se uma chave PIX é do tipo aleatória (formato UUID)
 * @param {string} chavePix - A chave PIX a ser validada
 * @returns {boolean} - true se for uma chave aleatória válida
 */
export const isRandomPixKey = (chavePix) => {
  if (!chavePix || typeof chavePix !== 'string') {
    return false;
  }

  // Remove espaços e converte para minúsculas
  const cleanKey = chavePix.trim().toLowerCase();
  
  // Padrão UUID: 8-4-4-4-12 caracteres hexadecimais separados por hífens
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  
  return uuidPattern.test(cleanKey);
};

/**
 * Valida e formata uma chave PIX aleatória
 * @param {string} chavePix - A chave PIX a ser validada
 * @returns {{isValid: boolean, message: string, formattedKey: string}} - Resultado da validação
 */
export const validateAndFormatRandomPixKey = (chavePix) => {
  if (!chavePix || typeof chavePix !== 'string') {
    return {
      isValid: false,
      message: 'Chave PIX é obrigatória',
      formattedKey: ''
    };
  }

  const cleanKey = chavePix.trim().toLowerCase();
  
  if (cleanKey.length === 0) {
    return {
      isValid: false,
      message: 'Chave PIX não pode estar vazia',
      formattedKey: ''
    };
  }

  // Verifica se é uma chave aleatória válida
  if (!isRandomPixKey(cleanKey)) {
    return {
      isValid: false,
      message: 'Por segurança, aceitamos apenas a "Chave Aleatória" do PIX. Ela tem números e letras separados por traços, como: 12345678-1234-1234-1234-123456789abc',
      formattedKey: ''
    };
  }

  return {
    isValid: true,
    message: 'Chave PIX aleatória válida',
    formattedKey: cleanKey
  };
};

// 🔧 DEBUG: Teste rápido da função (remover depois)
if (typeof window !== 'undefined') {
  window.testPixValidator = validateAndFormatRandomPixKey;
  console.log('🔧 DEBUG: Função testPixValidator disponível no console');
  console.log('🔧 DEBUG: Teste com chave válida:', validateAndFormatRandomPixKey('12345678-1234-1234-1234-123456789abc'));
  console.log('🔧 DEBUG: Teste com chave inválida:', validateAndFormatRandomPixKey('123.456.789-00'));
}