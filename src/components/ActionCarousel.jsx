// src/components/ActionCarousel.jsx

import React from 'react';
import PageConfirmItems from './carousel/PageConfirmItems';
import PageServiceSummary from './carousel/PageServiceSummary';
import PagePhotos from './carousel/PagePhotos';
import PagePayment from './carousel/PagePayment';

const ActionCarousel = ({ step, clientData, onNext, onPrev }) => {
  const commonProps = { clientData, onNext, onPrev };

  return (
    <div className="overflow-hidden">
      <div
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${step * 100}%)` }}
      >
        {/* PÁGINA 1: Confirmação de Itens (Índice 0) */}
        <div className="w-full flex-shrink-0">
          <PageConfirmItems {...commonProps} />
        </div>

        {/* PÁGINA 2: Resumo dos itens (Índice 1) */}
        <div className="w-full flex-shrink-0">
          <PageServiceSummary {...commonProps} />
        </div>

        {/* PÁGINA 3: Fotos (Índice 2) */}
        <div className="w-full flex-shrink-0">
          <PagePhotos {...commonProps} />
        </div>

        {/* PÁGINA 4: Pagamento (Índice 3) */}
        <div className="w-full flex-shrink-0">
          <PagePayment {...commonProps} />
        </div>
      </div>
    </div>
  );
};

export default ActionCarousel;