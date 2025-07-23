// src/components/StaticMap.jsx

import React from 'react';

function StaticMap({ cliente }) {
  // Seus campos no Firebase são 'lat' e 'long'
  const lat = cliente?.lat;
  const lon = cliente?.long;

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-b-lg">
        <p className="text-xs text-gray-400">Mapa indisponível</p>
      </div>
    );
  }

  // Nível de zoom panorâmico
  const zoom = 12;

  // URL do serviço de mapas
  const mapImageUrl = `https://tile.openstreetmap.org/${zoom}/${Math.floor(lonToTileX(lon, zoom))}/${Math.floor(latToTileY(lat, zoom))}.png`;

  // Funções auxiliares para converter coordenadas em "tiles" do mapa
  function lonToTileX(lon, zoom) {
    return (lon + 180) / 360 * Math.pow(2, zoom);
  }
  function latToTileY(lat, zoom) {
    return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
  }

  return (
    // O contêiner principal precisa ser 'relative' para posicionar o pino dentro dele
    <div
      className="relative w-full h-full bg-cover bg-center"
      style={{ backgroundImage: `url(${mapImageUrl})` }}
      title="Mapa da região do cliente"
    >
      {/* Marcador Vermelho de Localização Aproximada */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg"
        title="Localização aproximada do serviço"
      />
    </div>
  );
}

export default StaticMap;