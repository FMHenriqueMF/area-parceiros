// src/components/carousel/PageConfirmItems.jsx

import React, { useState, useEffect } from 'react';
import { FiEdit, FiMinus, FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { logUserActivity } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import ActionConfirmationModal from '../ActionConfirmationModal';
import LoadingSpinner from '../LoadingSpinner';
import Almofadas from '../../icones/Almofadas.png';
import BebeConforto from '../../icones/BebeConforto.png';
import Box from '../../icones/Box.png';
import Cadeiras from '../../icones/Cadeiras.png';
import CantoAlemão from '../../icones/CantoAlemão.png';
import CarrinhoDeBebê from '../../icones/CarrinhoDeBebê.png';
import Carro from '../../icones/Carro.png';
import Colchão from '../../icones/Colchão.png';
import Divã from '../../icones/Divã.png';
import Namoradeiras from '../../icones/Namoradeiras.png';
import Onibus from '../../icones/Onibus.png';
import Poltronas from '../../icones/Poltronas.png';
import Puff from '../../icones/Puff.png';
import Recamier from '../../icones/Recamier.png';
import Sofá from '../../icones/Sofá.png';
import Cabeceiras from '../../icones/Cabeceiras.png';

const categoryIcons = {
  Sofá: <img src={Sofá} className="h-14 w-15" alt="Sofá" />,
  Almofadas: <img src={Almofadas} className="h-14 w-15" alt="Almofadas" />,
  Cadeiras: <img src={Cadeiras} className="h-14 w-15" alt="Cadeiras" />,
  Puff: <img src={Puff} className="h-14 w-15" alt="Puff" />,
  Poltronas: <img src={Poltronas} className="h-14 w-15" alt="Poltronas" />,
  Divã: <img src={Divã} className="h-14 w-  15" alt="Divã" />,
  Recamier: <img src={Recamier} className="h-14 w-15" alt="Recamier" />,
  CantoAlemão: <img src={CantoAlemão} className="h-14 w-15" alt="Canto Alemão" />,
  BebeConforto: <img src={BebeConforto} className="h-14 w-15" alt="Bebê Conforto" />,
  CarrinhoDeBebê: <img src={CarrinhoDeBebê} className="h-14 w-15" alt="Carrinho de Bebê" />,
  Carro: <img src={Carro} className="h-14 w-15" alt="Carro" />,
  Colchão: <img src={Colchão} className="h-14 w-15" alt="Colchão" />,
  Box: <img src={Box} className="h-14 w-15" alt="Box" />,
  Namoradeiras: <img src={Namoradeiras} className="h-14 w-15" alt="Namoradeiras" />,
  Onibus: <img src={Onibus} className="h-14 w-15" alt="Ônibus" />,
  default: <FiEdit size={24} className="text-gray-400" />,  
  Cabeceiras: <img src={Cabeceiras} className="h-14 w-15" alt="Cabeceiras" />, // Ícone para Cabeceiras

  // Ícone padrão para categorias não especificadas


};


const PageConfirmItems = ({ clientData, onNext, onPrev }) => {
  const { currentUser } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesByCategory, setServicesByCategory] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [showItemModal, setShowItemModal] = useState(false);

  const originalValorParceiro = clientData.valor_totalNUM * (clientData.parceiropercentual / 100);

  const newTotalPrice = Object.values(selectedItems).reduce((total, item) => 
    total + (item.valor_desconto * item.quantidade || 0), 0
  );
  const newValorParceiro = newTotalPrice * (clientData.parceiropercentual / 100);


useEffect(() => {
  const fetchServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orcamento'));
      const allServices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const groupedServices = allServices.reduce((acc, service) => {
        acc[service.categoria] = acc[service.categoria] || [];
        acc[service.categoria].push(service);
        return acc;
      }, {});
      setServices(allServices);
      setServicesByCategory(groupedServices);

      // Verificação adicionada aqui
      let initialItemsObject = {};
      if (Array.isArray(clientData.itens_cliente)) {
        initialItemsObject = clientData.itens_cliente.reduce((acc, itemName) => {
          const service = allServices.find(s => s.item === itemName);
          if (service) {
            acc[itemName] = { ...service, quantidade: (acc[itemName]?.quantidade || 0) + 1 };
          }
          return acc;
        }, {});
      } else if (typeof clientData.itens_cliente === 'string' && clientData.itens_cliente.length > 0) {
        // Se for uma string, você pode querer adicionar como um único item,
        // mas a lógica abaixo assume que é um array para ser reduzido.
        // Se a string não for uma lista de itens, essa lógica precisa ser ajustada.
        // Por exemplo, pode-se apenas adicionar a string como item único:
        const service = allServices.find(s => s.item === clientData.itens_cliente);
        if (service) {
          initialItemsObject[service.item] = { ...service, quantidade: 1 };
        }
      }

      setSelectedItems(initialItemsObject);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };
  fetchServices();
}, [clientData.itens_cliente]);

  const handleSelectItem = (service) => {
    setSelectedItems(prevItems => {
      const existingItem = prevItems[service.item];
      const newItems = { ...prevItems };
      if (existingItem) {
        // Se o item já existe, incrementa em 1.
        newItems[service.item] = { ...existingItem, quantidade: existingItem.quantidade + 1 };
      } else {
        // Se o item não existe, adiciona ele com quantidade 1.
        newItems[service.item] = { ...service, quantidade: 1 };
      }
      return newItems;
    });
  };

  const handleQuantityChange = (item, action) => {
    setSelectedItems(prevItems => {
        const newItems = { ...prevItems };
        const currentItem = newItems[item.item];

        if (!currentItem) return prevItems;

        if (action === 'increase') {
            currentItem.quantidade += 1;
        } else if (action === 'decrease') {
            if (currentItem.quantidade > 1) {
                currentItem.quantidade -= 1;
            } else {
                delete newItems[item.item];
            }
        }
        return newItems;
    });
};
  
  const handleConfirmService = async () => {
    if (newValorParceiro < originalValorParceiro) {
      alert('O novo valor para você não pode ser menor que o original. Alterações com orçamento menor precisam ser comunicadas ao suporte.')
      toast.error('O novo valor para você não pode ser menor que o original. Alterações com orçamento menor precisam ser comunicadas ao suporte.');
      return;
    }
    
    setActionLoading(true);
    try {
      const clientRef = doc(db, 'clientes', clientData.id);
      const updatePayload = {
        servico_confirmado: true,
        itens_cliente: Object.values(selectedItems).flatMap(item => 
          Array(item.quantidade).fill(item.item)
        ),
        valor_totalNUM: newTotalPrice,
      };
      await updateDoc(clientRef, updatePayload);
      logUserActivity(currentUser.uid, 'Confirmou os itens do serviço', { clienteId: clientData.id, newItems: updatePayload.itens_cliente, newPrice: newTotalPrice });
      toast.success('Itens atualizados com sucesso!');
      onNext();
    } catch (error) {
      console.error("handleConfirmService: Erro ao atualizar o serviço:", error);
      toast.error('Não foi possível atualizar o serviço.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* CABEÇALHO FIXO E LIMPO */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h4 className="text-3xl font-bold text-center">Ajustar Orçamento</h4>
        <p className="text-gray-400 text-center text-sm">Adicione ou remova itens do serviço.</p>
      </div>

      {/* CONTEÚDO PRINCIPAL (COM SCROLL) */}
      <div className="flex-1 overflow-y-auto p-4 pb-20"> {/* Padding bottom para não esconder os botões fixos */}

        {/* PAINEL DE ITENS SELECIONADOS */}
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-gray-300 mb-2">Itens Selecionados:</h5>
          <div className="space-y-2">
            {Object.values(selectedItems).length > 0 ? (
              Object.values(selectedItems).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-lg py-1">
                  <span className="text-gray-200">
                    <span className="font-bold mr-2">{item.quantidade}x</span>
                    {item.item}
                  </span>
                  <div className="flex space-x-2">
                    <button onClick={() => handleQuantityChange(item, 'decrease')} className="p-1 rounded-full text-white hover:bg-slate-600 transition-colors">
                      <FiMinus size={20} />
                    </button>
                    <button onClick={() => handleQuantityChange(item, 'increase')} className="p-1 rounded-full text-white hover:bg-slate-600 transition-colors">
                      <FiPlus size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-md">Nenhum item selecionado.</p>
            )}
          </div>
        </div>

        {/* PAINEL DE SELEÇÃO DE ITENS COM MODAL */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h5 className="text-lg font-semibold text-gray-300 mb-4">Adicionar Itens:</h5>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Object.keys(servicesByCategory).map(category => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setShowItemModal(true);
                }}
                className={`flex-shrink-0 flex flex-col items-center justify-center h-28 rounded-xl font-semibold transition-all duration-300 ${
                  activeCategory === category 
                    ? 'bg-sky-600 text-white shadow-xl transform scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className={`transition-colors mb-2 ${activeCategory === category ? 'text-white' : 'text-sky-400'}`}>
                  {categoryIcons[category] || <FiEdit size={24} />}
                </div>
                <span className="text-sm">{category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE SELEÇÃO DE ITENS */}
      {showItemModal && activeCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowItemModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <FiX size={24} />
            </button>
            <h5 className="text-xl font-bold text-white text-center mb-6">
              Itens de <span className="text-sky-400">{activeCategory}</span>
            </h5>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              {servicesByCategory[activeCategory]?.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleSelectItem(service)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl font-semibold text-sm text-center transition duration-300 transform hover:scale-105 ${
                    selectedItems[service.item] 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } break-words`}
                >
                  <span className="block">{service.item}</span>
                  {selectedItems[service.item]?.quantidade > 0 && (
                    <span className="mt-1 px-2 py-1 bg-white/20 text-xs rounded-full">
                      {selectedItems[service.item].quantidade}x
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
                onClick={() => setShowItemModal(false)}
                className="mt-6 w-full bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-500 transition-colors"
            >
                Concluir
            </button>
          </div>
        </div>
      )}

      {/* RODAPÉ FIXO COM OS BOTÕES DE AÇÃO */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-800 flex justify-between space-x-4">
        <button
          onClick={() => {
            onNext();
            setActiveCategory(null);
          }}
          className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 hover:bg-red-500"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmService}
          disabled={actionLoading}
          className="w-full bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {actionLoading ? <LoadingSpinner /> : 'Concluir Edição'}
        </button>
      </div>
    </div>
  );
};

export default PageConfirmItems;