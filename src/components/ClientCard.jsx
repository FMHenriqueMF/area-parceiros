// src/components/ClientCard.jsx
import { Link } from 'react-router-dom'; // 1. Importar o Link

function ClientCard({ cliente }) {
  // ... suas variáveis (tipoServico, localizacao, valor) ...
  const tipoServico = cliente.ultimos4 || 'Serviço não informado';
  const localizacao = cliente.cidade || 'Local não informado';
  const valor = cliente.percentualparceiro || 'A combinar';

  // 2. Envolver tudo com um Link que leva para a rota /cliente/ID_DO_CLIENTE
  return (
    <Link to={`/cliente/${cliente.id}`} className="block h-full">
      <div className="bg-gray-800 rounded-lg shadow-lg p-5 border border-gray-700 hover:border-brand-blue hover:scale-105 transition-all duration-300 h-full flex flex-col justify-between cursor-pointer">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{tipoServico}</h3>
          <p className="text-gray-400 mb-1">
            <span className="font-semibold">Local:</span> {localizacao}
          </p>
        </div>
   
        <p className="text-accent-amber text-lg font-bold mt-4">
          R$ {valor}
        </p>
      </div>
    </Link>
  );
}

export default ClientCard;