// src/components/PhotoUploader.jsx

import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FiXCircle } from 'react-icons/fi';

// Função para comprimir imagem
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular novas dimensões mantendo aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Converter para blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Props:
// - clienteId: ID do cliente para organizar as fotos no Storage
// - onUploadComplete: Função a ser chamada quando o upload terminar, devolvendo as URLs
function PhotoUploader({ clienteId, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);

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
      const newFiles = Array.from(e.target.files);
      const validFiles = [];
      const errors = [];

      newFiles.forEach((file, index) => {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          errors.push(`Arquivo ${file.name} não é uma imagem válida`);
          return;
        }

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`Arquivo ${file.name} é muito grande (máx. 10MB)`);
          return;
        }

        validFiles.push(file);
      });

      if (validFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...validFiles]);
      }

      if (errors.length > 0) {
        setUploadErrors(errors);
      }

      // Limpar o input para permitir selecionar os mesmos arquivos novamente
      e.target.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };
  
  const uploadSingleFile = async (file, index) => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Comprimir imagem antes do upload
        const compressedFile = await compressImage(file);
        const finalFile = new File([compressedFile], file.name, { type: 'image/jpeg' });
        
        const storage = getStorage();
        const storageRef = ref(storage, `clientes/${clienteId}/${Date.now()}_${index}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, finalFile);

        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              // Atualizar progresso individual se necessário
            },
            (error) => {
              console.error(`Erro no upload da foto ${index + 1}, tentativa ${attempt + 1}:`, error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      } catch (error) {
        attempt++;
        console.error(`Tentativa ${attempt} falhou para foto ${index + 1}:`, error);
        if (attempt >= maxRetries) {
          throw error;
        }
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadErrors([]);
    setUploadProgress(0);

    const uploadPromises = files.map((file, index) => 
      uploadSingleFile(file, index).catch(error => ({ error: true, index, message: error.message }))
    );

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = [];
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value?.error) {
          successfulUploads.push(result.value);
          // Atualizar progresso
          setUploadProgress(((index + 1) / files.length) * 100);
        } else {
          const errorMsg = result.value?.message || result.reason?.message || 'Erro desconhecido';
          errors.push(`Foto ${index + 1}: ${errorMsg}`);
        }
      });

      if (successfulUploads.length > 0) {
        onUploadComplete(successfulUploads);
        setFiles([]);
      }

      if (errors.length > 0) {
        setUploadErrors(errors);
        console.error('Alguns uploads falharam:', errors);
      }

    } catch (error) {
      console.error("Erro geral no upload:", error);
      setUploadErrors(['Erro geral no upload. Tente novamente.']);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Adicionar Fotos
        <span className="block text-xs text-gray-400 mt-1">
          ⚡ Upload rápido com compressão automática | Máx: 10MB por foto
        </span>
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
          <p className="text-sm text-white">Enviando fotos em paralelo... {Math.round(uploadProgress)}%</p>
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Exibir erros se houver */}
      {uploadErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm font-semibold mb-2">Algumas fotos falharam:</p>
          <ul className="text-red-200 text-xs space-y-1">
            {uploadErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
          <button 
            onClick={() => setUploadErrors([])}
            className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
          >
            Ocultar erros
          </button>
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;