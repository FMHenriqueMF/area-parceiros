import React, { useState, useMemo } from 'react';

// ============================================================================
// 🏛️ COMPONENTE MODAL: O Oráculo de Informações
// ============================================================================
const InfoModal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                <div className="text-gray-300 space-y-3 text-sm">{children}</div>
                <button onClick={onClose} className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Entendi!
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// 🚗 O COMPONENTE VISUAL (A LATARIA E O PAINEL)
// ============================================================================
const InfoButton = ({ onClick }) => (<button onClick={onClick} className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/20 rounded-full text-white text-[10px] font-bold flex items-center justify-center hover:bg-white/40 transition-colors z-10">i</button>);
const StarIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>);
const ShieldCheckIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>);
const ZapIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>);
const AlertTriangleIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>);
const ArrowUpCircleIcon = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4-4-4 4"></path><path d="M12 16V8"></path></svg>);

const MetricCard = ({ title, value, icon, color, onInfoClick }) => (
    <div className="relative bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center gap-3 shadow-lg">
        <InfoButton onClick={onInfoClick} />
        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-xs text-gray-300 font-medium">{title}</p>
            <p className="text-lg font-bold text-white">{value != null ? value.toFixed(2) : '0.00'}</p>
        </div>
    </div>
);

const NextLevelInfo = ({ score }) => {
    let content = null;
    if (score < 3.1) {
        content = <div className="flex items-center gap-3 text-red-400"><AlertTriangleIcon className="w-8 h-8 flex-shrink-0" /><p className="text-sm">Sua conta foi suspensa por baixo desempenho.</p></div>
    } else if (score < 4.0) {
        content = <div className="flex items-center gap-3 text-orange-400"><AlertTriangleIcon className="w-8 h-8 flex-shrink-0" /><p className="text-sm"><strong>Atenção:</strong> Sua nota está perigosamente próxima ao nível de banimento. Melhore sua performance para evitar a suspensão.</p></div>
    } else if (score < 6.0) {
        content = <div className="flex items-center gap-3 text-cyan-300"><ArrowUpCircleIcon className="w-8 h-8 flex-shrink-0" /><p className="text-sm">Alcance a nota <strong>6.0</strong> para virar <strong>Acesso Preferencial</strong> e poder aceitar até 6 clientes por dia (1 por turno).</p></div>
    } else if (score < 7.0) {
        content = <div className="flex items-center gap-3 text-cyan-300"><ArrowUpCircleIcon className="w-8 h-8 flex-shrink-0" /><p className="text-sm">Alcance a nota <strong>7.0</strong> para virar <strong>Top Parceiro</strong> e não ter mais limites para aceitar clientes!</p></div>
    }
    if (!content) return null;
    return <div className="bg-gray-900/50 p-3 rounded-lg mt-3">{content}</div>;
};

function PartnerScore({ partnerData }) { // Agora recebe 'partnerData' direto
    const [modalContent, setModalContent] = useState(null);
    const isProbationary = partnerData?.historico_confiabilidade?.length < 20;

    if (!partnerData) {
        return null;
    }


    const infoContent = {
        final: { title: "Nota Final", content: <><p>Esta é a sua nota principal na plataforma. Ela define seu nível e acesso a benefícios.</p><p><strong>Como melhorar:</strong> Foque em melhorar suas notas de Qualidade, Confiabilidade e Garantia, pois a nota final é um reflexo direto delas.</p></> },
        qualidade: { title: "Nota de Qualidade", content: <><p>Reflete a satisfação dos clientes com seu serviço, baseada nas avaliações que eles deixam (de 1 a 10).</p><p><strong>Como melhorar:</strong> Preste um serviço impecável, seja cordial e sempre supere as expectativas do cliente para receber notas altas.</p></> },
        confiabilidade: { title: "Nota de Confiabilidade", content: <><p>Mede o seu compromisso com os serviços aceitos. É impactada por finalizações, cancelamentos e não comparecimentos.</p><p><strong>Como melhorar:</strong> Sempre finalize os serviços que aceitar. Evite cancelar, principalmente perto do horário. Jamais falte um serviço.</p></> },
        garantia: { title: "Nota de Garantia", content: <><p>Avalia a qualidade e durabilidade do seu trabalho, baseada na necessidade de retornos para refazer um serviço.</p><p><strong>Como melhorar:</strong> Faça o serviço com atenção aos detalhes para evitar retornos. Se um retorno for necessário, resolva o problema de forma definitiva.</p></> },
        probatorio: { title: "Estágio Probatório", content: <><p>Você está em período de avaliação. Suas primeiras 20 notas de confiabilidade são cruciais e contabilizarão mais para sua nota final.</p></> }
    };

    const partnerStatus = useMemo(() => {
        if (!partnerData) return { label: '...', color: 'bg-gray-500' };
        const score = partnerData.nota_final_unificada;
        if (score >= 9.0) return { label: 'Parceiro Elite', color: 'bg-purple-500' };
        if (score >= 8.0) return { label: 'Top Parceiro Nível 2', color: 'bg-blue-500' };
        if (score >= 7.0) return { label: 'Top Parceiro Nível 1', color: 'bg-cyan-500' };
        if (score >= 6.0) return { label: 'Acesso Preferencial', color: 'bg-green-500' };
        if (score >= 4.0) return { label: 'Acesso Normal', color: 'bg-yellow-500' };
        if (score >= 3.1) return { label: 'Acesso Limitado', color: 'bg-orange-500' };
        return { label: 'SUSPENSO', color: 'bg-red-600' };
    }, [partnerData]);

    if (!partnerData) return null;

    return (
        <>
            <InfoModal show={!!modalContent} onClose={() => setModalContent(null)} title={modalContent?.title}>
                {modalContent?.content}
            </InfoModal>

            <div className="max-w-2xl mx-auto p-3 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-semibold mb-2 text-white">Meu Desempenho</h2>
                <div className="relative bg-white/10 backdrop-blur-sm p-3 rounded-xl shadow-2xl flex flex-col items-center justify-center text-center">
                    <InfoButton onClick={() => setModalContent(infoContent.final)} />
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${partnerStatus.color} text-white`}>{partnerStatus.label}</span>
                        {isProbationary && (
                            <button onClick={() => setModalContent(infoContent.probatorio)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white hover:bg-orange-600">
                                Em Probatório
                                <span className="w-3.5 h-3.5 bg-white/20 rounded-full text-white text-[9px] font-bold flex items-center justify-center">i</span>
                            </button>
                        )}
                    </div>
                    <h3 className="text-xs text-gray-300 font-medium mt-2">Nota Final</h3>
                    <p className="text-5xl font-bold tracking-tighter text-white">
                        {partnerData.nota_final_unificada != null ? partnerData.nota_final_unificada.toFixed(2) : '0.00'}
                    </p>
                    <NextLevelInfo score={partnerData.nota_final_unificada} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <MetricCard title="Qualidade" value={partnerData.nota_qualidade} color="bg-green-500/80" icon={<StarIcon className="w-4 h-4 text-white" />} onInfoClick={() => setModalContent(infoContent.qualidade)} />
                    <MetricCard title="Confiabilidade" value={partnerData.nota_confiabilidade} color="bg-blue-500/80" icon={<ShieldCheckIcon className="w-4 h-4 text-white" />} onInfoClick={() => setModalContent(infoContent.confiabilidade)} />
                    <MetricCard title="Garantia" value={partnerData.nota_garantia} color="bg-orange-500/80" icon={<ZapIcon className="w-4 h-4 text-white" />} onInfoClick={() => setModalContent(infoContent.garantia)} />
                </div>
            </div>
        </>
    );
}

export default PartnerScore;
