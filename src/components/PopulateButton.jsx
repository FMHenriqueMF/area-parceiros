// src/components/PopulateButton.jsx

import React from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../utils/logger';

const servicosParaUpload = [
  {
    "categoria": "Cadeiras",
    "item": "Cadeira A",
    "valor_desconto": 24.0,
    "valor_grande": 37.74
  },
  {
    "categoria": "Cadeiras",
    "item": "Cadeira B",
    "valor_desconto": 34.0,
    "valor_grande": 53.47
  },
  {
    "categoria": "Cadeiras",
    "item": "Cadeira C",
    "valor_desconto": 34.0,
    "valor_grande": 53.47
  },
  {
    "categoria": "Cadeiras",
    "item": "Cadeira D",
    "valor_desconto": 44.0,
    "valor_grande": 69.2
  },
  {
    "categoria": "Cadeiras",
    "item": "Cadeira E",
    "valor_desconto": 44.0,
    "valor_grande": 69.2
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona A",
    "valor_desconto": 129.0,
    "valor_grande": 202.87
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona B",
    "valor_desconto": 129.0,
    "valor_grande": 202.87
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona C",
    "valor_desconto": 69.0,
    "valor_grande": 108.51
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona D",
    "valor_desconto": 59.0,
    "valor_grande": 92.79
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona E",
    "valor_desconto": 79.0,
    "valor_grande": 124.24
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona F",
    "valor_desconto": 69.0,
    "valor_grande": 108.51
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona G",
    "valor_desconto": 89.0,
    "valor_grande": 139.97
  },
  {
    "categoria": "Poltronas",
    "item": "Poltrona H",
    "valor_desconto": 109.0,
    "valor_grande": 171.42
  },
  {
    "categoria": "Cabeceiras",
    "item": "Cabeceira P",
    "valor_desconto": 99.0,
    "valor_grande": 155.69
  },
  {
    "categoria": "Cabeceiras",
    "item": "Cabeceira M",
    "valor_desconto": 149.0,
    "valor_grande": 234.32
  },
  {
    "categoria": "Cabeceiras",
    "item": "Cabeceira G",
    "valor_desconto": 189.0,
    "valor_grande": 297.23
  },
  {
    "categoria": "Puff",
    "item": "Puff P",
    "valor_desconto": 39.0,
    "valor_grande": 61.33
  },
  {
    "categoria": "Puff",
    "item": "Puff M",
    "valor_desconto": 59.0,
    "valor_grande": 92.79
  },
  {
    "categoria": "Puff",
    "item": "Puff G",
    "valor_desconto": 89.0,
    "valor_grande": 139.97
  }
];

const PopulateButton = () => {
  const { currentUser } = useAuth();
  
  const handlePopulateDatabase = async () => {
    try {
      for (const servico of servicosParaUpload) {
        await addDoc(collection(db, 'orcamento'), servico);
      }
      alert('Serviços adicionados com sucesso!');
      if (currentUser) {
        logUserActivity(currentUser.uid, 'Populou a base de dados de orçamentos');
      }
    } catch (error) {
      console.error("Erro ao popular a base de dados:", error);
      alert('Erro ao adicionar os serviços. Verifique o console.');
    }
  };

  return (
    <div className="md:col-span-2 mt-8">
      <button
        onClick={handlePopulateDatabase}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
      >
        Adicionar Serviços de Orçamento (Temporário)
      </button>
    </div>
  );
};

export default PopulateButton;