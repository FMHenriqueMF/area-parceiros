// src/components/AppOutdatedModal.jsx

import React from 'react';

const AppOutdatedModal = ({ onUpdate }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', textAlign: 'center', zIndex: 9999
    }}>
      <h1>Atualização Crítica!</h1>
      <p>Uma nova versão do app está disponível. Para continuar, por favor, recarregue a página.</p>
      <button
        onClick={onUpdate}
        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1em', cursor: 'pointer' }}
      >
        Atualizar Agora
      </button>
    </div>
  );
};

export default AppOutdatedModal;