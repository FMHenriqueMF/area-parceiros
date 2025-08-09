// src/pages/PerfilPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase'; // Importe 'auth' do firebase
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth'; // Importe sendPasswordResetEmail
import { IMaskInput } from 'react-imask';
import { FiUser, FiMail, FiBriefcase, FiPhone, FiMapPin, FiKey, FiFileText, FiTruck, FiUsers, FiEdit2, FiCheckSquare, FiXSquare, FiTrash2, FiPlus, FiStar, FiLock } from 'react-icons/fi'; // Adicione FiLock
import LoadingSpinner from '../components/LoadingSpinner';
import PartnerScore from '../utils/PartnerScore.jsx'; 




// --- Componente Interno para Campos Editáveis ---
const EditableField = ({ fieldName, label, value, mask, icon, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || ''); // Use um nome diferente para evitar confusão
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);


   const handleSave = async () => {
    setIsLoading(true);
    // Aqui usamos o inputValue, que deve estar com o valor mais recente
    const valueToSave = mask ? inputValue.replace(/\D/g, '') : inputValue;
    await onSave(fieldName, valueToSave);
    setIsLoading(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        <label className="text-sm text-gray-400">{label}</label>
        <div className="flex items-center gap-2 mt-1">
          <IMaskInput
            mask={mask || ''}
            value={inputValue}
            unmask={true} 
            onAccept={(unmaskedValue) => setInputValue(unmaskedValue)} // Garante que o estado seja atualizado
            onChange={(event) => setInputValue(event.target.value)} // Adicionei onChange por segurança
            placeholder={label}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-lg text-white"
          />
          <button onClick={handleSave} className="p-2 bg-green-600 rounded-md hover:bg-green-700" title="Salvar">
            {isLoading ? <LoadingSpinner /> : <FiCheckSquare />}
          </button>
          <button onClick={handleCancel} className="p-2 bg-red-600 rounded-md hover:bg-red-700" title="Cancelar">
            <FiXSquare />
          </button>
        </div>
      </div>
    );
  }

  const formatString = (value = '', pattern) => { 
    if (!value) return '';
    let i = 0;
    const v = value.toString().replace(/\D/g, '');
    if (v.length === 0) return '';
    const formatted = pattern.replace(/[09#]/g, () => v[i++] || '');
    return formatted.slice(0, formatted.search(/undefined|\[object Object\]/));
  };

  const displayValue = mask ? formatString(value, mask) : (value || 'Não informado');

  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex items-center space-x-3 mt-1 group">
        <div className="text-brand-blue">{icon}</div>
        <p className="text-lg text-white font-semibold break-words">{displayValue}</p>
        <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition" title={`Editar ${label}`}>
          <FiEdit2 />
        </button>
      </div>
    </div>
  );
};

// --- Componente para Itens Não-Editáveis ---
const ProfileItem = ({ icon, label, value }) => (
  <div>
    <label className="text-sm text-gray-400">{label}</label>
    <div className="flex items-center space-x-3 mt-1">
      <div className="text-brand-blue">{icon}</div>
      <p className="text-lg text-white font-semibold break-words">{value || 'Não informado'}</p>
    </div>
  </div>
);

// --- Componente Principal ---
function PerfilPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('reputacao'); // Inicia na aba de reputação
  const [ajudantes, setAjudantes] = useState([]);
  const [isSavingAjudantes, setIsSavingAjudantes] = useState(false);
  const [editingAjudanteIndex, setEditingAjudanteIndex] = useState(null);

  // Dados de exemplo para as notas (virão do currentUser no futuro)
  const nota_final_unificada = currentUser?.nota_final_unificada || 7.5;
  const nota_qualidade = currentUser?.nota_qualidade || 8.0;
  const nota_confiabilidade = currentUser?.nota_confiabilidade || 9.2;
  const nota_garantia = currentUser?.nota_garantia || 5.3;

  useEffect(() => {
    setAjudantes(currentUser?.ajudantes ? [...currentUser.ajudantes] : []);
  }, [currentUser]);

  const handleUpdateField = useCallback(async (fieldName, fieldValue) => {
  if (!currentUser) {
    return;
  }
  try {
    const userRef = doc(db, "usuarios", currentUser.uid);
    await updateDoc(userRef, { [fieldName]: fieldValue });
  } catch (error) {
    console.error(`Erro ao salvar ${fieldName}:`, error);
    alert(`Não foi possível salvar a alteração.`);
  }
}, [currentUser]);

  const handleAjudanteChange = (index, event) => {
    const newAjudantes = [...ajudantes];
    newAjudantes[index][event.target.name] = event.target.value;
    setAjudantes(newAjudantes);
  };

  const handleAddAjudante = () => {
    setAjudantes([{ nome: '', documento: '' }, ...ajudantes]);
    setEditingAjudanteIndex(0);
  };

  const handleRemoveAjudante = async (index) => {
    if (window.confirm("Tem certeza que deseja remover este ajudante?")) {
      const newAjudantes = ajudantes.filter((_, i) => i !== index);
      setAjudantes(newAjudantes);
      await handleUpdateField('ajudantes', newAjudantes);
    }
  };

  const handleSaveAjudantes = async () => {
    setIsSavingAjudantes(true);
    
    await handleUpdateField('ajudantes', ajudantes);
    setIsSavingAjudantes(false);
    setEditingAjudanteIndex(null);
    alert('Lista de ajudantes salva com sucesso!');
  };
  // --- NOVA FUNÇÃO PARA TROCAR SENHA ---
  const handleChangePassword = async () => {
    if (!currentUser?.email) {
      alert("Seu e-mail não está disponível para redefinição de senha.");
      return;
    }

    if (window.confirm(`Um link de redefinição de senha será enviado para ${currentUser.email}. Deseja continuar?`)) {
      try {
        await sendPasswordResetEmail(auth, currentUser.email);
        alert(`Um e-mail de redefinição de senha foi enviado para ${currentUser.email}. Verifique sua caixa de entrada e spam.`);
      } catch (error) {
        console.error("Erro ao enviar e-mail de redefinição:", error);
        alert("Não foi possível enviar o e-mail de redefinição. Por favor, tente novamente mais tarde.");
      }
    }
  };

  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tabName
        ? 'border-brand-blue text-white'
        : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'
        }`}
    >
      {React.cloneElement(icon, { size: 18 })}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
  const RatingDetail = ({ label, rating }) => (
    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">{rating.toFixed(1)}</p>
    </div>
  );


  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">

        {/* --- NOVO CABEÇALHO COM REPUTAÇÃO --- */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-4xl font-bold text-white">{currentUser?.nome_empresa}</h1>
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
              </div>
            </div>
          </div>
        </div>
        {/* --- FIM DO CABEÇALHO --- */}

        <div className="flex space-x-1 sm:space-x-4 border-b border-gray-700">
          <TabButton tabName="reputacao" label="Minha Reputação" icon={<FiStar />} />
          <TabButton tabName="empresa" label="Dados da Empresa" icon={<FiBriefcase />} />
          <TabButton tabName="representante" label="Representante" icon={<FiUser />} />

          <TabButton tabName="veiculos" label="Veículos" icon={<FiTruck />} />
          <TabButton tabName="ajudantes" label="Ajudantes" icon={<FiUsers />} />
        </div>

        <div className="bg-gray-800 p-2 rounded-b-lg shadow-lg border border-gray-700 border-t-0 min-h-[300px]">

          {/* --- NOVA ABA "MINHA REPUTAÇÃO" --- */}
          {activeTab === 'reputacao' && (
    <div>
                <PartnerScore partnerData={currentUser} />


    </div>
          )}
          {activeTab === 'empresa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <ProfileItem icon={<FiBriefcase size={22} />} label="Nome da Empresa" value={currentUser?.nome_empresa} />
              <ProfileItem icon={<FiFileText size={22} />} label="CNPJ" value={currentUser?.cnpj} />
              <ProfileItem icon={<FiMail size={22} />} label="Email de Contato" value={currentUser?.email} />
              <ProfileItem icon={<FiMapPin size={22} />} label="Localização" value={`${currentUser?.cidade} - ${currentUser?.estado}`} />
              <EditableField label="Telefone" value={currentUser?.telefone} onSave={handleUpdateField} fieldName="telefone" icon={<FiPhone size={22} />} />
              <EditableField label="Chave Pix" value={currentUser?.chave_pix} onSave={handleUpdateField} fieldName="chave_pix" icon={<FiKey size={22} />} />

              {/* --- NOVO BOTÃO DE TROCA DE SENHA --- */}
              <div className="md:col-span-2"> {/* Garante que o botão ocupe a largura total em telas médias e maiores */}
                <button
                  onClick={handleChangePassword}
                  className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2 text-base mt-8"
                >
                  <FiLock size={20} />
                  Trocar Senha
                </button>
              </div>
            </div>
          )}

          {activeTab === 'representante' && (
            <div className="animate-fade-in space-y-6">

              <ProfileItem icon={<FiUser size={22} />} label="Nome da Empresa" value={currentUser?.nome_empresa} />
              <ProfileItem icon={<FiFileText size={22} />} label="CPF/RG" value={currentUser?.cnpj} />

            </div>
          )}

          {activeTab === 'veiculos' && (
            <div className="animate-fade-in space-y-6">
              <h3 className="text-xl font-semibold text-white">Veículos Cadastrados</h3>
              <EditableField label="Modelo do Carro" value={currentUser?.modelo_carro} onSave={handleUpdateField} fieldName="modelo_carro" icon={<FiTruck size={22} />} />
              <EditableField label="Placa do Carro" value={currentUser?.placa_carro} onSave={handleUpdateField} fieldName="placa_carro" icon={<FiFileText size={22} />} />
            </div>
          )}

          {activeTab === 'ajudantes' && (
            <div className="animate-fade-in space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Ajudantes Cadastrados</h3>
                <button onClick={handleAddAjudante} className="bg-brand-blue hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm">
                  <FiPlus /> Adicionar Novo
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto pr-2 space-y-4 mt-4">
                {ajudantes.length > 0 ? (
                  ajudantes.map((ajudante, index) => (
                    <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                      {editingAjudanteIndex === index ? (
                        <div className="space-y-2">
                          <input type="text" placeholder="Nome do Ajudante" name="nome" value={ajudante.nome} onChange={(e) => handleAjudanteChange(index, e)} className="w-full p-2 rounded bg-gray-700 border border-gray-600 font-semibold" />
                          <input type="text" placeholder="Documento" name="documento" value={ajudante.documento} onChange={(e) => handleAjudanteChange(index, e)} className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-sm" />
                          <div className="flex justify-end pt-2">
                            <button onClick={handleSaveAjudantes} disabled={isSavingAjudantes} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded-lg text-sm flex items-center gap-2">
                              {isSavingAjudantes ? <LoadingSpinner /> : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-white">{ajudante.nome || 'Nome não preenchido'}</p>
                            <p className="text-sm text-gray-400">{ajudante.documento || 'Documento não preenchido'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingAjudanteIndex(index)} className="text-gray-400 hover:text-white"><FiEdit2 /></button>
                            <button onClick={() => handleRemoveAjudante(index)} className="text-gray-400 hover:text-red-500"><FiTrash2 /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">Nenhum ajudante cadastrado.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerfilPage;