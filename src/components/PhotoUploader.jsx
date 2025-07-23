// src/components/PhotoUploader.jsx

import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Props:
// - clienteId: ID do cliente para organizar as fotos no Storage
// - onUploadComplete: Função a ser chamada quando o upload terminar, devolvendo as URLs
function PhotoUploader({ clienteId, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    // Pega os arquivos selecionados e os coloca no estado
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const storage = getStorage();
    const urls = [];

    // Faz o upload de cada arquivo, um por um
    for (const file of files) {
      const storageRef = ref(storage, `clientes/${clienteId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Erro no upload:", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push(downloadURL);
            resolve();
          }
        );
      });
    }

    // Chama a função do componente pai com as URLs
    onUploadComplete(urls);
    setIsUploading(false);
    setFiles([]); // Limpa os arquivos selecionados
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Adicionar Fotos (Antes/Depois)
      </label>
      <input
        type="file"
        multiple // Permite selecionar múltiplos arquivos
        accept="image/*" // Aceita apenas imagens
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
      />
      {files.length > 0 && !isUploading && (
        <div className="mt-4">
          <p className="text-sm text-gray-400">{files.length} foto(s) selecionada(s).</p>
          <button onClick={handleUpload} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Enviar Fotos
          </button>
        </div>
      )}
      {isUploading && (
        <div className="mt-4">
          <p className="text-sm text-white">Enviando... {Math.round(uploadProgress)}%</p>
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;