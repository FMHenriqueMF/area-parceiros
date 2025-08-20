// src/components/NewsletterBadge.jsx

import React, { useState, useEffect } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  CURRENT_NEWSLETTER_VERSION, 
  NEWS_UPDATES, 
  getTypeBadge,
  logNewsletterView 
} from '../utils/newsUpdates';

const NewsletterBadge = () => {
  const { currentUser } = useAuth();
  const [showBadge, setShowBadge] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkNewsletterStatus = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'usuarios', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastSeenVersion = userData.newsletter_version || 0;
          
          // Se há atualizações não vistas, mostra o badge
          if (lastSeenVersion < CURRENT_NEWSLETTER_VERSION) {
            setShowBadge(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar newsletter:', error);
      } finally {
        setLoading(false);
      }
    };

    checkNewsletterStatus();
  }, [currentUser]);

  const handleMarkAsRead = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'usuarios', currentUser.uid);
      await updateDoc(userRef, {
        newsletter_version: CURRENT_NEWSLETTER_VERSION,
        newsletter_last_seen: new Date().toISOString()
      });
      
      logNewsletterView(currentUser.uid, CURRENT_NEWSLETTER_VERSION);
      setShowBadge(false);
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao marcar newsletter como lida:', error);
    }
  };

  const handleBadgeClick = () => {
    setShowModal(true);
  };

  if (loading || !showBadge) return null;

  const latestUpdate = NEWS_UPDATES[0];
  const typeBadge = getTypeBadge(latestUpdate?.type);

  return (
    <>
      {/* Badge discreto no canto */}
      <div 
        onClick={handleBadgeClick}
        className="fixed top-20 right-4 z-50 cursor-pointer group animate-gentle-bounce"
      >
        <div className="relative">
          {/* Badge principal */}
          <div className="bg-brand-blue text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
            <FiBell size={20} />
          </div>
          
          {/* Indicador de notificação */}
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            !
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              Novidades do sistema!
              <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal quando clica no badge */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Header */}
            <div className={`${typeBadge.color} p-6 text-white relative`}>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
              >
                <FiX size={20} />
              </button>
              
              <div className="flex items-center space-x-3">
                <FiBell size={28} className="text-yellow-300" />
                <div>
                  <h2 className="text-2xl font-bold">Novidades do Sistema</h2>
                  <p className="text-white text-opacity-90 text-sm">
                    Confira as últimas melhorias que fizemos para você!
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {NEWS_UPDATES.map((update) => (
                <div key={update.id} className="mb-8 last:mb-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{update.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                        {getTypeBadge(update.type).label}
                      </span>
                      <span>{update.date}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {update.items.map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                          <div className="flex-shrink-0 mt-1">
                            <IconComponent className={item.iconColor} size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  💡 <strong>Dica:</strong> Sempre que houver novidades, você será notificado!
                </p>
                <button
                  onClick={handleMarkAsRead}
                  className="bg-brand-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <FiBell size={16} />
                  <span>Entendi!</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsletterBadge;