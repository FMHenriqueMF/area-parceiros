// src/utils/permissions.js

/**
 * Retorna as permissões de um parceiro com base na sua nota.
 * @param {number} score - A nota_final_unificada do parceiro.
 * @returns {object} Um objeto com as permissões.
 */
export function getPartnerPermissions(score) {
    if (score >= 7.0) {
        return { level: 'Top Parceiro/Elite', dailyLimit: Infinity, turnLimit: Infinity, canAccept: true };
    }
    if (score >= 6.0) {
        return { level: 'Acesso Preferencial', dailyLimit: 6, turnLimit: 1, canAccept: true };
    }
    if (score >= 4.0) {
        return { level: 'Acesso Normal', dailyLimit: 4, turnLimit: 1, canAccept: true };
    }
    if (score >= 3.1) {
        return { level: 'Acesso Limitado', dailyLimit: 1, turnLimit: 1, canAccept: true };
    }
    // Nível de Banimento
    return { level: 'Banido', dailyLimit: 0, turnLimit: 0, canAccept: false };
}