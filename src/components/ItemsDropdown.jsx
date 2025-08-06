// src/components/ItemsDropdown.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { FiXCircle, FiPlusCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ItemsDropdown({ initialItems, onItemsChange, onCancelEdit }) {
  const [services, setServices] = useState([]);
  const [servicesByCategory, setServicesByCategory] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, 'orcamento'));
      const allServices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedServices = allServices.sort((a, b) => a.item.localeCompare(b.item, undefined, { numeric: true }));
      const groupedServices = sortedServices.reduce((acc, service) => {
        acc[service.categoria] = acc[service.categoria] || [];
        acc[service.categoria].push(service);
        return acc;
      }, {});

      setServices(allServices);
      setServicesByCategory(groupedServices);
      
      let itemsToInitialize = [];
      if (Array.isArray(initialItems)) {
          itemsToInitialize = initialItems;
      } else if (typeof initialItems === 'string') {
          itemsToInitialize = initialItems.split(',').map(item => item.trim());
      }
      
      const mappedInitialItems = itemsToInitialize.map(itemName => {
          const service = allServices.find(s => s.item === itemName);
          return service ? { categoria: service.categoria, item: itemName } : { categoria: '', item: itemName };
      });
      setSelectedItems(mappedInitialItems.length > 0 ? mappedInitialItems : [{ categoria: '', item: '' }]);
    };

    fetchServices();
  }, [initialItems]);

  const handleItemsChange = useCallback((items, price) => {
    onItemsChange(items, price);
  }, [onItemsChange]);

  const handleCategoryChange = (index, newCategory) => {
    const newItems = [...selectedItems];
    newItems[index] = { categoria: newCategory, item: '' };
    setSelectedItems(newItems);
  };
  
  const handleItemChange = (index, newItem) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], item: newItem };
    setSelectedItems(newItems);
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { categoria: '', item: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (selectedItems.length <= 1) {
      toast.error('O serviço precisa ter ao menos um item.');
      return;
    }
    const newItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(newItems);
  };

  return (
    <div className="w-full space-y-3">
      {selectedItems.map((selected, index) => (
        <div key={index} className="flex items-center space-x-2">
          <select
            value={selected.categoria}
            onChange={(e) => handleCategoryChange(index, e.target.value)}
            className="w-1/3 p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
          >
            <option value="" disabled>Categoria...</option>
            {Object.keys(servicesByCategory).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={selected.item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            className="w-1/2 p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
            disabled={!selected.categoria}
          >
            <option value="" disabled>Selecione o item...</option>
            {selected.categoria && servicesByCategory?.[selected.categoria]?.map(service => (
              <option key={service.id} value={service.item}>{service.item}</option>
            ))}
          </select>
          <button
            onClick={() => handleRemoveItem(index)}
            className="p-2 text-red-500 hover:text-red-400"
          >
            <FiXCircle size={20} />
          </button>
        </div>
      ))}
      <button
        onClick={handleAddItem}
        className="flex items-center text-brand-blue hover:text-blue-300 font-semibold text-sm"
      >
        <FiPlusCircle size={20} className="mr-2" /> Adicionar Item
      </button>
      <div className="flex justify-between mt-4 space-x-2">
        <button
          onClick={onCancelEdit}
          className="w-1/2 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500"
        >
          Cancelar
        </button>
        <button
          onClick={() => onItemsChange(selectedItems.map(item => item.item), selectedItems.reduce((total, selected) => total + (services.find(s => s.item === selected.item)?.valor_desconto || 0), 0))}
          className="w-1/2 bg-brand-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

export default ItemsDropdown;