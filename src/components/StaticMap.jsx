// src/components/StaticMap.jsx

import React from 'react';

function StaticMap({ cliente ,qual_zoom}) {
  // --- LEITURA SEGURA DA CHAVE DA API ---
  // Lembre-se de configurar o arquivo .env.local na raiz do projeto
  // com a variável: REACT_APP_Maps_API_KEY=SUA_CHAVE_AQUI
const apiKey = import.meta.env.VITE_Maps_API_KEY;
  // --- PREPARAÇÃO DA LOCALIZAÇÃO ---
  // Prioriza latitude e longitude para maior precisão.
  // Se não tiver, usa o endereço completo.
  const lat = cliente?.lat;
  const lon = cliente?.long;
  const enderecoCompleto = `${cliente?.endereco_cliente}, ${cliente?.bairro}, ${cliente?.cidade} - ${cliente?.Estado}`;

  // Define o ponto central do mapa
  const centerLocation = (typeof lat === 'number' && typeof lon === 'number')
    ? `${lat},${lon}`
    : encodeURIComponent(enderecoCompleto);

  // --- VERIFICAÇÃO DE DADOS MÍNIMOS ---
  // Se não tiver nem coordenadas, nem endereço, ou a chave da API, mostra o aviso.
  if (!apiKey || (!lat && !lon && !cliente?.endereco_cliente)) {
    return (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-b-lg">
        <p className="text-xs text-gray-400">Mapa indisponível</p>
      </div>
    );
  }

  // --- CONFIGURAÇÕES DO MAPA ---
  const zoom = qual_zoom; // Um zoom um pouco mais próximo que o anterior
  const size = "400x400"; // Define um tamanho para a imagem do mapa

  // --- CONSTRUÇÃO DA URL DA IMAGEM DO GOOGLE MAPS ---
  // A URL agora usa a API do Google Static Maps.
  // O marcador (marker) já é centralizado por padrão se for o único.
  const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLocation}&zoom=${zoom}&size=${size}&maptype=roadmap&markers=color:red%7C${centerLocation}&key=${apiKey}`;

  return (
    // Não precisamos mais do pino em HTML, o Google Maps já coloca ele na imagem.
    <div
      className="w-full h-full bg-cover bg-center"
      style={{ backgroundImage: `url(${mapImageUrl})` }}
      title="Mapa da região do cliente (aproximado)"
    >
      {/* O marcador agora é parte da imagem do mapa, então este div pode ser removido */}
    </div>
  );
}

export default StaticMap;