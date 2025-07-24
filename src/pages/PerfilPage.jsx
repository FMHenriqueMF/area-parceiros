// src/pages/PerfilPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { FiUser, FiMail, FiBriefcase, FiPhone, FiMapPin, FiKey, FiFileText, FiTruck, FiUsers, FiEdit2, FiCheckSquare, FiXSquare, FiTrash2, FiPlus } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

// --- Componente Interno para Campos Editáveis (SIMPLIFICADO) ---
const EditableField = ({ fieldName, label, value, icon, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentValue(value || '');
  }, [value]);

  const handleSave = async () => {
    setIsLoading(true);
    await onSave(fieldName, currentValue);
    setIsLoading(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        <label className="text-sm text-gray-400">{label}</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
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

  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex items-center space-x-3 mt-1 group">
        <div className="text-brand-blue">{icon}</div>
        <p className="text-lg text-white font-semibold break-words">{value || 'Não informado'}</p>
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
  const [activeTab, setActiveTab] = useState('empresa');
  const [ajudantes, setAjudantes] = useState([]);
  const [isSavingAjudantes, setIsSavingAjudantes] = useState(false);
  const [editingAjudanteIndex, setEditingAjudanteIndex] = useState(null);

  useEffect(() => {
    setAjudantes(currentUser?.ajudantes ? [...currentUser.ajudantes] : []);
  }, [currentUser]);

  const handleUpdateField = useCallback(async (fieldName, fieldValue) => {
    if (!currentUser) return;
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
  
  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
        activeTab === tabName
          ? 'border-brand-blue text-white'
          : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'
      }`}
    >
      {React.cloneElement(icon, { size: 18 })}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">{currentUser?.nome_empresa}</h1>
          <p className="text-gray-400">Status da Conta: <span className="font-semibold text-green-400">{currentUser?.status || 'Indefinido'}</span></p>
        </div>

        <div className="flex space-x-1 sm:space-x-4 border-b border-gray-700">
          <TabButton tabName="empresa" label="Empresa" icon={<FiBriefcase />} />
          <TabButton tabName="representante" label="Representante" icon={<FiUser />} />
          <TabButton tabName="veiculos" label="Veículos" icon={<FiTruck />} />
          <TabButton tabName="ajudantes" label="Ajudantes" icon={<FiUsers />} />
        </div>

        <div className="bg-gray-800 p-8 rounded-b-lg shadow-lg border border-gray-700 border-t-0 min-h-[300px]">
          
          {activeTab === 'empresa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <ProfileItem icon={<FiBriefcase size={22} />} label="Nome da Empresa" value={currentUser?.nome_empresa} />
              <ProfileItem icon={<FiFileText size={22} />} label="CNPJ" value={currentUser?.cnpj} />
              <ProfileItem icon={<FiMail size={22} />} label="Email de Contato" value={currentUser?.email} />
              <ProfileItem icon={<FiMapPin size={22} />} label="Localização" value={`${currentUser?.cidade} - ${currentUser?.estado}`} />
              <EditableField label="Telefone" value={currentUser?.telefone} onSave={handleUpdateField} fieldName="telefone" icon={<FiPhone size={22} />} />
              <EditableField label="Chave Pix" value={currentUser?.chave_pix} onSave={handleUpdateField} fieldName="chave_pix" icon={<FiKey size={22} />} />
            </div>
          )}

          {activeTab === 'representante' && (
            <div className="animate-fade-in space-y-6">
              <h3 className="text-xl font-semibold text-white">Dados do Responsável</h3>
               <p className="text-gray-400">Funcionalidade em breve.</p>
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