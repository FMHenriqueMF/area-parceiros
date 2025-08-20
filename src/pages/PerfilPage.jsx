// src/pages/PerfilPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase'; // Importe 'auth' do firebase
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth'; // Importe funções de reautenticação
import { IMaskInput } from 'react-imask';
import { FiUser, FiMail, FiBriefcase, FiPhone, FiMapPin, FiKey, FiFileText, FiTruck, FiUsers, FiEdit2, FiCheckSquare, FiXSquare, FiTrash2, FiPlus, FiStar, FiLock } from 'react-icons/fi'; // Adicione FiLock
import LoadingSpinner from '../components/LoadingSpinner';
import PartnerScore from '../utils/PartnerScore.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

// --- Componente Interno para Campos Editáveis ---
const EditableField = ({ fieldName, label, value, mask, icon, onSave, requiresAuth = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || ''); // Use um nome diferente para evitar confusão
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authProvider, setAuthProvider] = useState('');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);


   const handleSave = async () => {
    console.log('🔧 DEBUG: handleSave clicado para campo:', fieldName, 'requiresAuth:', requiresAuth);
    console.log('🔧 DEBUG: inputValue atual:', inputValue);
    
    if (requiresAuth) {
      console.log('🔧 DEBUG: Campo requer autenticação, abrindo modal...');
      // Para campos que requerem autenticação (como chave PIX)
      const user = auth.currentUser;
      if (user && user.providerData.length > 0) {
        setAuthProvider(user.providerData[0].providerId);
        console.log('🔧 DEBUG: Provider encontrado:', user.providerData[0].providerId);
      }
      setShowAuthModal(true);
    } else {
      console.log('🔧 DEBUG: Campo não requer autenticação, salvando diretamente...');
      // Para campos normais
      await performSave();
    }
  };

  const performSave = async () => {
    console.log('🔧 DEBUG: performSave chamado para', fieldName, 'com valor:', inputValue);
    setIsLoading(true);
    try {
      // Validação específica para chave PIX
      if (fieldName === 'chave_pix') {
        console.log('🔧 DEBUG: Validando chave PIX:', inputValue);
        const validation = validateAndFormatRandomPixKey(inputValue);
        console.log('🔧 DEBUG: Resultado da validação:', validation);
        
        if (!validation.isValid) {
          console.log('🔧 DEBUG: Chave PIX inválida, mostrando erro:', validation.message);
          setAuthError(validation.message);
          setIsLoading(false);
          return;
        }
        console.log('🔧 DEBUG: Chave PIX válida, salvando...');
        await onSave(fieldName, validation.formattedKey);
        success('Chave PIX atualizada com sucesso!', 'Sucesso!');
      } else {
        const valueToSave = mask ? inputValue.replace(/\D/g, '') : inputValue;
        await onSave(fieldName, valueToSave);
        success(`${label} atualizado com sucesso!`, 'Sucesso!');
      }
      setIsLoading(false);
      setIsEditing(false);
      setShowAuthModal(false);
      setAuthPassword('');
      setAuthError('');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      error('Não foi possível salvar a alteração. Tente novamente.', 'Erro ao salvar');
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authPassword && authProvider === 'password') return;
    
    setIsLoading(true);
    setAuthError('');
    
    try {
      const user = auth.currentUser;
      
      if (authProvider === 'password') {
        const credential = EmailAuthProvider.credential(user.email, authPassword);
        await reauthenticateWithCredential(user, credential);
      } else if (authProvider === 'google.com') {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      } else {
        throw new Error('Método de autenticação não suportado');
      }
      
      // Se chegou até aqui, a autenticação foi bem-sucedida
      await performSave();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setAuthError('Senha incorreta. Tente novamente.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setAuthError('Janela de confirmação foi fechada. Tente novamente.');
      } else {
        setAuthError('Erro na autenticação. Tente novamente.');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const user = auth.currentUser;
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      await performSave();
    } catch (error) {
      console.error('Erro na autenticação Google:', error);
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setAuthError('Janela de confirmação foi fechada. Tente novamente.');
      } else {
        setAuthError('Erro na autenticação. Tente novamente.');
      }
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setInputValue(value || '');
    setIsEditing(false);
    setShowAuthModal(false);
    setAuthPassword('');
    setAuthError('');
  };

  if (isEditing) {
    return (
      <div>
        <label className="text-sm text-gray-400">{label}</label>
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2">
            <IMaskInput
              mask={mask || ''}
              value={inputValue}
              unmask={true} 
              onAccept={(unmaskedValue) => setInputValue(unmaskedValue)} // Garante que o estado seja atualizado
              onChange={(event) => setInputValue(event.target.value)} // Adicionei onChange por segurança
              placeholder={fieldName === 'chave_pix' ? 'Cole sua chave PIX aleatória aqui' : label}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-lg text-white"
            />
            <button onClick={handleSave} className="p-2 bg-green-600 rounded-md hover:bg-green-700" title="Salvar">
              {isLoading ? <LoadingSpinner /> : <FiCheckSquare />}
            </button>
            <button onClick={handleCancel} className="p-2 bg-red-600 rounded-md hover:bg-red-700" title="Cancelar">
              <FiXSquare />
            </button>
          </div>
          
          {/* Dica específica para chave PIX */}
          {fieldName === 'chave_pix' && (
            <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 p-3 rounded-lg text-xs">
              <p className="text-yellow-200 mb-2">
                <strong>💡 Dica:</strong> Use apenas a "Chave Aleatória" do PIX para sua segurança
              </p>
              <p className="text-green-400 mb-1">
                ✅ <strong>Aceito:</strong> a1b2c3d4-5678-9abc-def0-123456789012
              </p>
              <p className="text-red-400">
                ❌ <strong>NÃO aceito:</strong> CPF, email, telefone ou chave de conta
              </p>
            </div>
          )}
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
    <>
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

      {/* Modal de Autenticação */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              Confirme sua senha para alterar a chave PIX
            </h3>
            
            {/* Explicação sobre o que é chave aleatória */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-blue-600">💡</span>
                </div>
                <div className="ml-2">
                  <p className="text-blue-700 font-medium mb-1">Sobre a chave PIX aleatória:</p>
                  <p className="text-blue-600 text-xs leading-relaxed">
                    É uma chave de segurança com números e letras, como: <strong>a1b2c3d4-5678-9abc-def0-123456789012</strong>
                    <br />
                    Encontre ela no app do seu banco em: PIX → Minhas Chaves
                  </p>
                </div>
              </div>
            </div>
            
            {authProvider === 'password' && (
              <form onSubmit={handleAuthSubmit}>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">Senha atual</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Digite sua senha"
                    autoFocus
                  />
                </div>
                {authError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {authError}
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading || !authPassword}
                    className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Verificando...' : 'Confirmar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {authProvider === 'google.com' && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Confirme sua identidade através do Google</p>
                {authError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {authError}
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Verificando...' : 'Confirmar com Google'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {authProvider && !['password', 'google.com'].includes(authProvider) && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Não é possível alterar a chave PIX para este tipo de conta. Entre em contato com o suporte.
                </p>
                <button
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-400 w-full"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
  const { success, error, warning, info } = useNotification();
  const [activeTab, setActiveTab] = useState('reputacao'); // Inicia na aba de reputação
  const [ajudantes, setAjudantes] = useState([]);
  const [isSavingAjudantes, setIsSavingAjudantes] = useState(false);
  const [editingAjudanteIndex, setEditingAjudanteIndex] = useState(null);
  
  // Estados para trocar senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeStep, setPasswordChangeStep] = useState('confirm');
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  

  // Dados de exemplo para as notas (virão do currentUser no futuro)
  const nota_final_unificada = currentUser?.nota_final_unificada || 7.5;
  const nota_qualidade = currentUser?.nota_qualidade || 8.0;
  const nota_confiabilidade = currentUser?.nota_confiabilidade || 9.2;
  const nota_garantia = currentUser?.nota_garantia || 5.3;

  useEffect(() => {
    setAjudantes(currentUser?.ajudantes ? [...currentUser.ajudantes] : []);
  }, [currentUser]);

  const handleUpdateField = useCallback(async (fieldName, fieldValue) => {
    console.log('🔧 DEBUG: handleUpdateField chamado:', fieldName, '=', fieldValue);
    
    if (!currentUser) {
      console.log('🔧 DEBUG: Usuário não encontrado');
      return;
    }
    
    try {
      const userRef = doc(db, "usuarios", currentUser.uid);
      console.log('🔧 DEBUG: Salvando no Firestore...');
      await updateDoc(userRef, { [fieldName]: fieldValue });
      console.log('🔧 DEBUG: Salvo com sucesso no Firestore');
    } catch (error) {
      console.error(`🔧 DEBUG: Erro ao salvar ${fieldName}:`, error);
      error(`Não foi possível salvar a alteração: ${error.message}`, 'Erro ao salvar');
    }
  }, [currentUser, error]);

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
    success('Lista de ajudantes salva com sucesso!');
  };
  // --- FUNÇÃO MELHORADA PARA TROCAR SENHA ---
  const handleChangePassword = () => {
    if (!currentUser?.email) {
      setPasswordFeedback({ 
        type: 'error', 
        message: 'Seu e-mail não está disponível para redefinição de senha.' 
      });
      setShowPasswordModal(true);
      setPasswordChangeStep('error');
      return;
    }
    
    setPasswordFeedback({ type: '', message: '' });
    setPasswordChangeStep('confirm');
    setShowPasswordModal(true);
  };
  
  const confirmPasswordChange = async () => {
    if (!currentUser?.email) return;
    
    setIsChangingPassword(true);
    setPasswordFeedback({ type: '', message: '' });
    
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setPasswordChangeStep('success');
      setPasswordFeedback({ 
        type: 'success', 
        message: `E-mail enviado com sucesso! Verifique sua caixa de entrada e pasta de spam.` 
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail de redefinição:", error);
      
      let errorMessage = 'Não foi possível enviar o e-mail de redefinição.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado. Verifique seu e-mail.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido. Verifique se está correto.';
      }
      
      setPasswordChangeStep('error');
      setPasswordFeedback({ type: 'error', message: errorMessage });
    }
    
    setIsChangingPassword(false);
  };
  
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeStep('confirm');
    setPasswordFeedback({ type: '', message: '' });
    setIsChangingPassword(false);
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
              
              {/* Campo PIX com aviso sobre alteração */}
              <div>
                <label className="text-sm text-gray-400">Chave Pix</label>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="text-brand-blue"><FiKey size={22} /></div>
                  <div className="flex-1">
                    <p className="text-lg text-white font-semibold break-words">
                      {currentUser?.chave_pix || 'Não informado'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Para alterar sua chave PIX, acesse o menu "Saldos"
                    </p>
                  </div>
                </div>
              </div>

              {/* --- BOTÃO MELHORADO DE TROCA DE SENHA --- */}
              <div className="md:col-span-2"> {/* Garante que o botão ocupe a largura total em telas médias e maiores */}
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2 text-base mt-8"
                >
                  {isChangingPassword ? (
                    <LoadingSpinner />
                  ) : (
                    <FiLock size={20} />
                  )}
                  {isChangingPassword ? 'Enviando...' : 'Trocar Senha'}
                </button>
              </div>
              
              {/* Modal de Troca de Senha */}
              {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    {passwordChangeStep === 'confirm' && (
                      <>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                          Confirmar Troca de Senha
                        </h3>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                          <p className="text-blue-700 text-sm">
                            Um link de redefinição de senha será enviado para:
                          </p>
                          <p className="text-blue-800 font-semibold mt-1">
                            {currentUser?.email}
                          </p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={confirmPasswordChange}
                            disabled={isChangingPassword}
                            className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isChangingPassword ? 'Enviando...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={closePasswordModal}
                            className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}
                    
                    {passwordChangeStep === 'success' && (
                      <>
                        <h3 className="text-lg font-semibold text-green-800 mb-4 text-center flex items-center justify-center gap-2">
                          ✓ E-mail Enviado com Sucesso!
                        </h3>
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                          <p className="text-green-700 text-sm mb-2">
                            Um e-mail foi enviado para <strong>{currentUser?.email}</strong>
                          </p>
                          <p className="text-green-600 text-xs">
                            • Verifique sua caixa de entrada<br/>
                            • Não esqueça de verificar a pasta de spam<br/>
                            • O link expira em 1 hora
                          </p>
                        </div>
                        <button
                          onClick={closePasswordModal}
                          className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700"
                        >
                          Entendido
                        </button>
                      </>
                    )}
                    
                    {passwordChangeStep === 'error' && (
                      <>
                        <h3 className="text-lg font-semibold text-red-800 mb-4 text-center flex items-center justify-center gap-2">
                          ⚠ Erro ao Enviar E-mail
                        </h3>
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                          <p className="text-red-700 text-sm">
                            {passwordFeedback.message}
                          </p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setPasswordChangeStep('confirm')}
                            className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700"
                          >
                            Tentar Novamente
                          </button>
                          <button
                            onClick={closePasswordModal}
                            className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-400"
                          >
                            Fechar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
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