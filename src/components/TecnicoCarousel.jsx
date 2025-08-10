// src/components/TecnicoCarousel.jsx

import React from 'react';
import TecServiceSummary from './carousel/TecServiceSummary';
import TecPhotos from './carousel/TecPhotos';
import TecPayment from './carousel/TecPayment';

const TecnicoCarousel = ({ step, clientData, onNext, onPrev }) => {
  const commonProps = { clientData, onNext, onPrev };

  return (
    <div className="overflow-hidden">
      <div
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${step * 100}%)` }}
      >


        {/* PÁGINA 2: Resumo dos itens (Índice 1) */}
        <div className="w-full flex-shrink-0">
          <TecServiceSummary {...commonProps} />
        </div>

        {/* PÁGINA 3: Fotos (Índice 2) */}
        <div className="w-full flex-shrink-0">
          <TecPhotos {...commonProps} />
        </div>

        {/* PÁGINA 4: Pagamento (Índice 3) */}
        <div className="w-full flex-shrink-0">
          <TecPayment {...commonProps} />
        </div>
      </div>
    </div>
  );
};

export default TecnicoCarousel;