// src/components/PhotoUploader.jsx

import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FiXCircle } from 'react-icons/fi';

// Props:
// - clienteId: ID do cliente para organizar as fotos no Storage
// - onUploadComplete: Função a ser chamada quando o upload terminar, devolvendo as URLs
function PhotoUploader({ clienteId, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Efeito para criar e limpar as URLs de pré-visualização
  useEffect(() => {
    if (files.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);

    // Função de limpeza para revogar as URLs
    return () => newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      // Pega os arquivos selecionados e os coloca no estado
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };
  
  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const storage = getStorage();
    const urls = [];

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

    onUploadComplete(urls);
    setIsUploading(false);
    setFiles([]);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Adicionar Fotos (Antes/Depois)
      </label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
      />
      
      {/* Seção de Pré-visualização */}
      {previewUrls.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-300 font-semibold mb-2">Pré-visualização ({files.length} foto(s)):</p>
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative w-full h-24 rounded-lg overflow-hidden group">
                <img src={url} alt={`Pré-visualização ${index + 1}`} className="object-cover w-full h-full" />
                <button 
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover foto"
                >
                  <FiXCircle size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && !isUploading && (
        <div className="mt-4">
          <button 
            onClick={handleUpload} 
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
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