// src/components/carousel/PageConfirmItems.jsx

import React, { useState, useEffect } from 'react';
import { FiEdit, FiXCircle, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

// Mapeamento de ícones para as categorias para um visual mais lúdico
const categoryIcons = {
  Sofá: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 20H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7L11 20zM11 20V6m-7 0h16v12H4z" /><line x1="8" y1="10" x2="8" y2="16" /><line x1="16" y1="10" x2="16" y2="16" /></svg>,
  Colchão: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2zM6 10v4m6-4v4m6-4v4" /><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></svg>,
  Cadeiras: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2H10V4a2 2 0 0 1 2-2zM4 14v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6H4zM22 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2h-4V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2H22z" /></svg>,
  Poltronas: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v6zM4 10a2 2 0 0 0-2 2h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v6zM22 17H2v-4h20v4zM22 22H2v-2h20v2z" /></svg>,
  Cabeceiras: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a10 10 0 0 1 10-10zM12 2v20M2 12h20" /></svg>,
  Puff: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 12v6m0-6V6m0 6H6m6 0h6" /></svg>,
};


const PageConfirmItems = ({ clientData, onNext }) => {
  const { currentUser } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesByCategory, setServicesByCategory] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, 'orcamento'));
      const allServices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const groupedServices = allServices.reduce((acc, service) => {
        acc[service.categoria] = acc[service.categoria] || [];
        acc[service.categoria].push(service);
        return acc;
      }, {});
      setServices(allServices);
      setServicesByCategory(groupedServices);
      
      const initialItemsArray = typeof clientData.itens_cliente === 'string' 
        ? clientData.itens_cliente.split(',').map(item => item.trim())
        : clientData.itens_cliente;

      const initialItemsObject = initialItemsArray.reduce((acc, itemName) => {
        const service = allServices.find(s => s.item === itemName);
        if (service) {
          acc[itemName] = { ...service, quantidade: (acc[itemName]?.quantidade || 0) + 1 };
        }
        return acc;
      }, {});
      setSelectedItems(initialItemsObject);
    };
    fetchServices();
  }, [clientData.itens_cliente]);

  const handleSelectItem = (service) => {
    setSelectedItems(prevItems => {
      const existingItem = prevItems[service.item];
      return {
        ...prevItems,
        [service.item]: {
          ...service,
          quantidade: (existingItem?.quantidade || 0) + 1,
        },
      };
    });
  };

  const handleRemoveItem = (itemToRemove) => {
    setSelectedItems(prevItems => {
      const newItems = { ...prevItems };
      if (newItems[itemToRemove.item].quantidade > 1) {
        newItems[itemToRemove.item].quantidade -= 1;
      } else {
        delete newItems[itemToRemove.item];
      }
      return newItems;
    });
  };
  
  const handleConfirmService = async () => {
    const newItemsArray = Object.values(selectedItems).flatMap(item => 
      Array(item.quantidade).fill(item.item)
    );
    const newTotalPrice = Object.values(selectedItems).reduce((total, item) => 
      total + (item.valor_desconto * item.quantidade || 0), 0
    );

    if (newTotalPrice < clientData.parceiropercentual) {
      toast.error('O novo valor não pode ser menor que o original. Alterações com orçamento menor precisam ser comunicadas ao suporte.');
      return;
    }
    setActionLoading(true);
    try {
      const clientRef = doc(db, 'clientes', clientData.id);
      const updatePayload = {
        servico_confirmado: true,
        itens_cliente: newItemsArray,
        parceiropercentual: newTotalPrice,
      };
      await updateDoc(clientRef, updatePayload);
      logUserActivity(currentUser.uid, 'Confirmou os itens do serviço', { clienteId: clientData.id, newItems: newItemsArray, newPrice: newTotalPrice });
      toast.success('Itens atualizados com sucesso!');
      onNext();
    } catch (error) {
      console.error("Erro ao atualizar o serviço:", error);
      toast.error('Não foi possível atualizar o serviço.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4">
      <h4 className="text-3xl font-bold text-white text-center">Alterar itens do serviço</h4>
      <p className="text-gray-400 text-center">Ajuste o orçamento selecionando as categorias e itens abaixo.</p>

      {/* Seção do Pedido (Visual novo e limpo) */}
      <div className="bg-gray-800 p-4 rounded-lg min-h-[80px]">
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.values(selectedItems).length > 0 ? (
            Object.values(selectedItems).map((item, index) => (
              <span key={index} className="flex items-center space-x-2 bg-go-green/20 text-go-green rounded-full px-3 py-1 font-medium transition-all duration-300">
                <span>{item.item}</span>
                <span className="font-bold">{item.quantidade}x</span>
                <button onClick={() => handleRemoveItem(item)} className="p-1 hover:text-red-500 transition-colors">
                  <FiXCircle size={14} />
                </button>
              </span>
            ))
          ) : (
            <p className="text-gray-500">Nenhum item selecionado.</p>
          )}
        </div>
      </div>

      {/* Row 1: Categorias com ícones */}
      <div className="flex overflow-x-auto space-x-2 pb-2 -mx-4 px-4">
        {Object.keys(servicesByCategory).map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-20 rounded-lg font-semibold transition duration-300 ${activeCategory === category ? 'bg-brand-blue text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {categoryIcons[category] || <FiEdit size={24} />}
            <span className="mt-2 text-xs">{category}</span>
          </button>
        ))}
      </div>

      {/* Row 2: Itens da Categoria Selecionada */}
      {activeCategory && (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {servicesByCategory[activeCategory].map(service => (
            <button
              key={service.id}
              onClick={() => handleSelectItem(service)}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${selectedItems[service.item] ? 'bg-go-green text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {service.item}
            </button>
          ))}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-between space-x-4 mt-8">
        <button
          onClick={() => onNext()}
          className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 hover:bg-red-500"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmService}
          disabled={actionLoading || Object.values(selectedItems).length === 0}
          className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {actionLoading ? <LoadingSpinner /> : 'Concluir Edição'}
        </button>
      </div>
    </div>
  );
};

export default PageConfirmItems;