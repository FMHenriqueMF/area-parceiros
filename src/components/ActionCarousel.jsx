// src/components/ActionCarousel.jsx

import React from 'react';
import PageConfirmItems from './carousel/PageConfirmItems';
import PageServiceSummary from './carousel/PageServiceSummary';
import PagePhotos from './carousel/PagePhotos';
import PagePayment from './carousel/PagePayment';

const ActionCarousel = ({ step, clientData, onNext, onPrev, onFinish }) => {
  const commonProps = { clientData, onNext, onPrev, onFinish };

  return (
    <div className="overflow-hidden">
      <div
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${step * 100}%)` }}
      >
        {/* PÁGINA 1: Dropdown de edição */}
        <div className="w-full flex-shrink-0">
          <PageConfirmItems {...commonProps} />
        </div>

        {/* PÁGINA 2: Resumo dos itens */}
        <div className="w-full flex-shrink-0">
          <PageServiceSummary {...commonProps} />
        </div>

        {/* PÁGINA 3: Fotos */}
        <div className="w-full flex-shrink-0">
          <PagePhotos {...commonProps} />
        </div>

        {/* PÁGINA 4: Pagamento */}
        <div className="w-full flex-shrink-0">
          <PagePayment {...commonProps} />
        </div>
      </div>
    </div>
  );
};

export default ActionCarousel;