// src/components/LegalModal.jsx

import React, { useState, useRef, useEffect } from 'react';

// Conteúdo dos Termos de Serviço
const TERMOS_DE_SERVICO = `
### Termos de Parceria para Empresas Parceiras da Premier Clean
Última atualização: 02 de agosto de 2025

#### 1. Vínculo Contratual
A parceria estabelecida com a Premier Clean não gera qualquer tipo de vínculo empregatício. O parceiro atua de forma autônoma e independente, sendo obrigatório que possua formalização como MEI (Microempreendedor Individual) ou CNPJ ativo. A solicitação de parceria está sujeita a uma avaliação interna antes da aprovação para acesso ao sistema.

#### 2. Responsabilidade Técnica e Qualidade do Serviço
O parceiro é integralmente responsável pela excelência na execução do serviço de higienização e pela qualidade final do trabalho. Em caso de reclamação do cliente, serviço mal executado, ou qualquer tipo de dano causado durante o atendimento, o parceiro será diretamente responsável pela resolução, incluindo reparações, reexecuções ou reembolsos.

#### 3. Reputação e Níveis de Acesso
A reputação do parceiro é crucial e é avaliada por meio de um sistema de pontuação baseado nas seguintes métricas:
* Nota de Qualidade: Reflete a satisfação do cliente com o serviço.
* Nota de Confiabilidade: Mede o compromisso do parceiro com os serviços agendados.
* Nota de Garantia: Avalia a durabilidade e qualidade do trabalho, baseada na necessidade de retornos.
A nota final do parceiro determinará seu nível de acesso na plataforma, que influencia o número de serviços que podem ser aceitos por dia e por turno. A Premier Clean reserva-se o direito de suspender ou excluir parceiros com base na sua nota de reputação.

#### 4. Estado Probatório
Parceiros com menos de 20 notas de confiabilidade são considerados em Estado Probatório. Durante este período, a nota final unificada será a menor pontuação dentre as três métricas (Qualidade, Confiabilidade e Garantia). Além disso, a acumulação de duas ou mais notas 1 no histórico de confiabilidade resultará no banimento imediato da plataforma. Este período tem como objetivo garantir o comprometimento e a qualidade dos serviços desde o início da parceria.

#### 5. Conta do Usuário e Privacidade
Para acessar o aplicativo, o parceiro deve criar uma conta. É de sua responsabilidade manter a confidencialidade das credenciais de acesso. O parceiro é responsável por todas as atividades que ocorrem em sua conta. A Premier Clean coleta dados para otimizar o uso do aplicativo e pode capturar a localização do parceiro durante o uso para fins operacionais, conforme detalhado na Política de Privacidade.

#### 6. Conteúdo do Usuário
O parceiro pode publicar, vincular, armazenar e compartilhar conteúdo (texto, gráficos, vídeos ou outros materiais) no aplicativo. O parceiro é legalmente responsável pelo conteúdo que publica, incluindo sua legalidade, confiabilidade e adequação.

#### 7. Propriedade Intelectual
O aplicativo e seu conteúdo original, recursos e funcionalidades são de propriedade exclusiva da Premier Clean. O aplicativo é protegido por direitos autorais, marcas registradas e outras leis.

#### 8. Limitação de Responsabilidade
Em nenhuma circunstância, a Premier Clean, seus diretores, funcionários, parceiros, agentes ou fornecedores, será responsável por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, mas não se limitando a, perda de lucros, dados ou outras perdas intangíveis.

#### 9. Pontualidade e Compromisso
A pontualidade é essencial. Cancelamentos de serviços com menos de 6 horas de antecedência ou não comparecimentos resultarão em uma nota 1 no histórico de confiabilidade do parceiro. Caso o parceiro acumule duas notas 1, seu acesso será imediatamente suspenso da plataforma.

#### 10. Modificações e Vigência dos Termos
A Premier Clean reserva o direito de modificar estes termos a qualquer momento. Em caso de atualização, o parceiro será notificado e deverá aceitar os novos termos para continuar utilizando a plataforma. A continuidade do uso do aplicativo após a notificação será considerada como aceitação integral dos novos termos.

Ao utilizar o aplicativo, o parceiro declara ter lido, compreendido e concordado com todos os termos e condições aqui presentes.
`;

// Conteúdo da Política de Privacidade
const POLITICA_DE_PRIVACIDADE = `
### Política de Privacidade da Premier Clean
Última atualização: 02 de agosto de 2025

#### 1. Introdução
Esta Política de Privacidade descreve como a Premier Clean, proprietária do aplicativo para parceiros, coleta, usa, armazena e protege as informações de nossos usuários. Ao utilizar nosso aplicativo, você concorda com esta política e com a coleta e uso de suas informações conforme descrito aqui.

#### 2. Informações que Coletamos
Coletamos as seguintes informações para fornecer e melhorar nossos serviços:
* Dados de Cadastro: Nome da empresa, nome do representante, CNPJ, CPF/RG, e-mail, telefone e chave PIX. Esses dados são usados para a gestão da parceria e para processar pagamentos.
* Dados de Localização: O aplicativo pode capturar sua localização em tempo real durante o uso para fins operacionais, como rastreamento de deslocamento e agendamento de serviços.
* Informações de Desempenho: Coletamos dados sobre o seu desempenho, incluindo notas de qualidade, confiabilidade e garantia, além de um histórico de serviços realizados. Essas informações são usadas para calcular a sua pontuação e determinar seu nível de acesso na plataforma.
* Dados do Dispositivo: Coletamos o token de notificação push (fcmTokens) para enviar alertas importantes sobre serviços e pagamentos.
* Atividade no Aplicativo: Registramos suas ações no aplicativo (logs de auditoria) para fins de segurança e rastreamento, como acesso ao dashboard, visualização de clientes e atualizações de status.
* Conteúdo do Usuário: Armazenamos fotos de "antes e depois" dos serviços que você faz o upload.

#### 3. Como Usamos Suas Informações
Utilizamos as informações coletadas para:
* Gerenciar sua conta de parceiro.
* Conectar você a clientes na sua região.
* Processar seus pagamentos e saques.
* Avaliar seu desempenho e reputação, o que pode afetar suas permissões no aplicativo.
* Melhorar a experiência de usuário e as funcionalidades do app.
* Cumprir com obrigações legais e regulatórias.

#### 4. Compartilhamento de Informações
Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing sem o seu consentimento. Podemos, no entanto, compartilhar dados com:
* Clientes: Para facilitar o serviço, compartilhamos seu nome e localização aproximada com o cliente.
* Prestadores de Serviços: Podemos usar terceiros para processar pagamentos, enviar mensagens (via webhook) ou armazenar dados, que estarão vinculados às suas próprias políticas de privacidade.
* Autoridades Legais: Podemos divulgar suas informações se exigido por lei ou em resposta a processos judiciais válidos.

#### 5. Segurança dos Dados
Empregamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado. No entanto, nenhum sistema de segurança é impenetrável. Você é responsável por manter a confidencialidade de sua senha.

#### 6. Seus Direitos
Você tem o direito de acessar, corrigir e solicitar a exclusão de suas informações pessoais. Para exercer esses direitos, entre em contato conosco através do nosso canal de suporte.

#### 7. Modificações na Política de Privacidade
Podemos atualizar esta política de tempos em tempos. Quando o fizermos, a data no topo da página será revisada. A sua aceitação da Política de Privacidade será solicitada novamente caso haja atualizações significativas.
`;

// Helper function to render markdown-like text
const renderMarkdown = (text) => {
  return text.split('\n').map((paragrafo, index) => {
    const trimmedParagrafo = paragrafo.trim();
    if (trimmedParagrafo.startsWith('###')) {
      return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{trimmedParagrafo.substring(4)}</h3>;
    }
    if (trimmedParagrafo.startsWith('####')) {
      return <h4 key={index} className="text-md font-bold mt-3 mb-1">{trimmedParagrafo.substring(5)}</h4>;
    }
    if (trimmedParagrafo.startsWith('')) {
      return <p key={index} className="text-sm font-bold mt-2 mb-2">{trimmedParagrafo.substring(2, trimmedParagrafo.length - 2)}</p>;
    }
    if (trimmedParagrafo.startsWith('*')) {
      return <li key={index} className="ml-4 list-disc text-sm">{trimmedParagrafo.substring(1).trim()}</li>;
    }
    return <p key={index} className="mb-3">{trimmedParagrafo}</p>;
  });
};

const LegalModal = ({ onAccept }) => {
  const [readTerms, setReadTerms] = useState(false);
  const [readPrivacy, setReadPrivacy] = useState(false);
  const termsRef = useRef(null);
  const privacyRef = useRef(null);

  const handleScroll = () => {
    if (termsRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 1) {
        setReadTerms(true);
      }
    }
    if (privacyRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = privacyRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 1) {
        setReadPrivacy(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 sm:p-8 text-white max-h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-center">Termos e Política de Privacidade</h2>
        
        <div className="flex flex-col flex-grow overflow-hidden gap-6">
          {/* Seção de Termos de Serviço */}
          <div className="flex flex-col flex-grow min-h-0">
            <h3 className="text-xl font-bold mb-2">Termos de Serviço</h3>
            <div 
              ref={termsRef}
              onScroll={handleScroll}
              className="overflow-y-auto pr-2 text-gray-300 text-sm border border-gray-700 rounded p-4 flex-grow"
            >
              {renderMarkdown(TERMOS_DE_SERVICO)}
            </div>
          </div>
          
          {/* Seção da Política de Privacidade */}
          <div className="flex flex-col flex-grow min-h-0">
            <h3 className="text-xl font-bold mb-2">Política de Privacidade</h3>
            <div
              ref={privacyRef}
              onScroll={handleScroll}
              className="overflow-y-auto pr-2 text-gray-300 text-sm border border-gray-700 rounded p-4 flex-grow"
            >
              {renderMarkdown(POLITICA_DE_PRIVACIDADE)}
            </div>
          </div>
        </div>

        <button
          onClick={onAccept}
          className={`w-full mt-6 font-bold py-3 px-4 rounded-lg transition duration-300 ${!readTerms || !readPrivacy ? 'bg-brand-blue hover:opacity-90 text-white' : 'bg-brand-blue hover:opacity-90 text-white'}`}
        >
          Aceitar e Continuar
        </button>
      </div>
    </div>
  );
};

export default LegalModal;