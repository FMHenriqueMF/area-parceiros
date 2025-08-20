// src/pages/MapaClientesPage.jsx

import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, MarkerClusterer } from '@react-google-maps/api';
import { db } from '../firebase.js';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext.jsx';
import ClientInfoPanel from '../components/ClientInfoPanel.jsx';

const LIBRARIES = ['geocoding'];

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 10rem)',
};

const center = {
  lat: -23.55052,
  lng: -46.633308
};

// Função auxiliar para geocodificar endereços e atualizar o Firebase
const geocodeAddress = (geocoder, address, docRef) => {
  return new Promise((resolve) => {
    geocoder.geocode({ address }, async (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        if (docRef) {
          try {
            await updateDoc(docRef, { geolocation: location });
          } catch (e) {
            console.warn("Falha ao atualizar documento:", e.message);
          }
        }
        resolve(location);
      } else {
        console.warn(`Geocode falhou para o endereço "${address}" com o status: ${status}`);
        resolve(null);
      }
    });
  });
};

function MapaClientesPage() {
  const { currentUser } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries: LIBRARIES
  });

  useEffect(() => {
    if (!isLoaded || !currentUser?.estado) {
      if (!currentUser?.estado) setLoading(false);
      return;
    }

    setLoading(true);
    const geocoder = new window.google.maps.Geocoder();

    // Permite que parceiros de GO vejam também clientes de DF
    const estadosPermitidos = currentUser.estado === 'GO' ? ['GO', 'DF'] : [currentUser.estado];

    const q = query(
      collection(db, "clientes"),
      where("status", "==", "disponivel"),
      where("Estado", "in", estadosPermitidos)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const clientesPromises = querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;

        if (data.geolocation) {
          return { id, ...data };
        }

        const address = [data.endereco_cliente, data.bairro, data.cidade, data.Estado].filter(Boolean).join(', ');
        
        if (address) {
          const docRef = doc(db, 'clientes', id);
          const newLocation = await geocodeAddress(geocoder, address, docRef);
          
          if (newLocation) {
            data.geolocation = newLocation;
            return { id, ...data };
          }
        }
        return null;
      });

      const clientesResolvidos = await Promise.all(clientesPromises);
      setClientes(clientesResolvidos.filter(cliente => cliente && cliente.geolocation));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isLoaded, currentUser]);

  if (loadError) return <div className="text-white text-center p-10">Erro ao carregar o mapa.</div>;
  if (loading || !isLoaded) return <div className="text-white text-center p-10">Carregando mapa e localizando clientes...</div>;

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Mapa de Clientes Disponíveis</h1>
        <div className="relative rounded-lg overflow-hidden shadow-2xl">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={10}
            center={center}
            options={{
              gestureHandling: 'cooperative',
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            <MarkerClusterer>
              {(clusterer) =>
                clientes.map((cliente) => (
                  <Marker
                    key={cliente.id}
                    position={cliente.geolocation}
                    clusterer={clusterer}
                    onClick={() => setSelectedCliente(cliente)}
                    icon={{
                      url: '/pin-limpeza.png', // Lembre-se de colocar seu ícone na pasta /public
                      scaledSize: new window.google.maps.Size(40, 40),
                    }}
                  />
                ))
              }
            </MarkerClusterer>
          </GoogleMap>

          <ClientInfoPanel
            cliente={selectedCliente}
            onClose={() => setSelectedCliente(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default MapaClientesPage;