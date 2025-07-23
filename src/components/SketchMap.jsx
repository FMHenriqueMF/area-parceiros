// src/components/SketchMap.jsx

import React from 'react';

// Este componente é apenas a representação visual do mapa
function SketchMap({ cliente }) {
  const cidade = cliente?.cidade || 'Localização';

  return (
    <div
      className="w-full h-full bg-gray-700 rounded-lg overflow-hidden relative group"
      title="Mapa estilizado da região"
    >
      {/* Usamos um SVG para desenhar nosso mapa estilizado */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Fundo do mapa */}
        <rect width="100" height="100" fill="#374151" /> 

        {/* Limites da Cidade (em um cinza mais escuro) */}
        <path d="M 30,10 L 25,40 L 45,55 L 40,80 L 60,90 L 70,60 L 50,45 L 30,10 Z" stroke="#1F2937" strokeWidth="1.5" fill="#4B5563" />

        {/* Avenidas Principais (Vermelho Escuro) */}
        <path d="M 10,20 L 90,50" stroke="#7f1d1d" strokeWidth="0.8" fill="none" />
        <path d="M 30,5 L 40,95" stroke="#7f1d1d" strokeWidth="0.8" fill="none" />
        <path d="M 50,50 L 95,80" stroke="#7f1d1d" strokeWidth="0.8" fill="none" />
        <path d="M 60,20 C 70,40 80,40 95,35" stroke="#7f1d1d" strokeWidth="0.8" fill="none" />

        {/* Localização do CEP (Azul da Marca) */}
        <circle cx="40" cy="45" r="4" stroke="#004aad" strokeWidth="2" fill="none" />

        {/* Nome da Cidade */}
        <text x="35" y="70" fontFamily="sans-serif" fontSize="8" fill="rgba(255,255,255,0.4)">
          {cidade}
        </text>

        {/* Overlay com texto de ajuda no hover (apenas na página de detalhes) */}
        <rect 
          width="100" 
          height="100" 
          fill="rgba(0,0,0,0.5)" 
          className="opacity-0 group-hover:opacity-100 transition-opacity" 
        />
        <text 
          x="50" y="52" 
          textAnchor="middle" 
          fontFamily="sans-serif" 
          fontSize="10" 
          fill="white" 
          className="opacity-0 group-hover:opacity-100 transition-opacity font-bold"
        >
          Ver no Google Maps
        </text>
      </svg>
    </div>
  );
}

export default SketchMap;