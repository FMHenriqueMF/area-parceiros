// src/pages/ClientDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, runTransaction, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    setLoading(true);
    if (!id) return;
    const docRef = doc(db, 'clientes', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCliente({ id: docSnap.id, ...docSnap.data() });
      } else {
        setCliente(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao escutar o cliente:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const handleClaimJob = async () => {
    setIsClaiming(true);
    setClaimError('');

    // Verificação de segurança: o usuário tem o nome da empresa no perfil?
    if (!currentUser?.nome_empresa) {
      setClaimError("Não foi possível encontrar o nome da sua empresa. Verifique seu perfil.");
      setIsClaiming(false);
      return;
    }

    try {
      const clientRef = doc(db, "clientes", id);
      await runTransaction(db, async (transaction) => {
        const clientDoc = await transaction.get(clientRef);
        if (!clientDoc.exists()) {
          throw new Error("Este cliente não está mais disponível!");
        }
        if (clientDoc.data().status !== 'disponivel') {
          throw new Error("Este cliente já foi pego por outro parceiro.");
        }
        
        // --- LÓGICA ATUALIZADA CONFORME SUA ESPECIFICAÇÃO ---
        transaction.update(clientRef, { 
          status: 'aceito', 
          aceito_por: currentUser.nome_empresa
        });
        // --- FIM DA ATUALIZAÇÃO ---
      });
      alert('Cliente pego com sucesso! Bom trabalho!');
      navigate('/');
    } catch (error) {
      console.error("Erro ao pegar cliente: ", error);
      setClaimError(error.message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) return <div className="text-white text-center p-10">Carregando detalhes do cliente...</div>;
  if (!cliente) return <div className="text-white text-center p-10">Cliente não encontrado.</div>;
  
  // O JSX visual continua o mesmo
  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            &larr; Voltar para o Mural
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">{cliente.nomeCompleto || 'Nome não informado'}</h1>
        <p className="text-lg text-gray-400 mb-6">{cliente.enderecoCompleto || 'Endereço não informado'}</p>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">Detalhes do Serviço</h2>
          {/* ... resto dos detalhes ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-bold">Serviço Contratado:</p>
              <p className="text-gray-300">{cliente.servicoContratado || 'Não especificado'}</p>
            </div>
            <div>
              <p className="font-bold">Telefone:</p>
              <p className="text-gray-300">{cliente.telefone || 'Não informado'}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-bold">Observações:</p>
            <p className="text-gray-300 whitespace-pre-wrap">{cliente.observacoes || 'Nenhuma'}</p>
          </div>
          <div className="mt-6 border-t border-gray-700 pt-4">
            <p className="text-2xl font-bold text-green-400">
              Valor a Receber: R$ {cliente.valorServico || 'A combinar'}
            </p>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={handleClaimJob}
            disabled={isClaiming || cliente.status !== 'disponivel'}
            className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isClaiming ? <LoadingSpinner /> : (cliente.status === 'disponivel' ? 'Pegar este Cliente' : 'Cliente Indisponível')}
          </button>
          {claimError && <p className="text-red-500 mt-4">{claimError}</p>}
        </div>
      </div>
    </div>
  );
}

export default ClientDetailPage;