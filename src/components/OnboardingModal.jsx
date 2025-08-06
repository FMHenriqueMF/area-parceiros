// src/components/OnboardingModal.jsx

import React, { useState } from 'react';
import { FiGrid, FiClipboard, FiStar, FiChevronRight, FiChevronLeft, FiCheckCircle, FiDollarSign, FiTruck, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LoadingSpinner from './LoadingSpinner';

const OnboardingModal = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    await onComplete();
    setIsLoading(false);
  };

  const stepsContent = [
    {
      title: "Boas-vindas ao nosso app! 👋",
      icon: <FiCheckCircle size={80} className="text-green-500 mx-auto" />,
      text: (
        <>
          <p>Oi, {currentUser?.nome_empresa || 'Parceiro'}! Vamos aprender a usar o app em 10 passos bem rápidos e fáceis.</p>
        </>
      ),
    },
    {
      title: "Passo 1: Encontre trabalhos",
      icon: <FiGrid size={80} className="text-brand-blue mx-auto" />,
      text: (
        <>
          <p>A tela principal se chama Lista de Clientes.</p>
          <p>É aqui que você vê os trabalhos que pode pegar. Cada quadradinho é um trabalho.</p>
        </>
      ),
    },
    {
      title: "Passo 2: Pegue um trabalho",
      icon: <FiClipboard size={80} className="text-green-500 mx-auto" />,
      text: (
        <>
          <p>Quando você achar um trabalho que quer fazer, clique nele e depois no botão "Aceitar este Serviço".</p>
          <p>O trabalho será seu e sairá da Lista de Clientes.</p>
        </>
      ),
    },
    {
      title: "Passo 3: Seus trabalhos aceitos",
      icon: <FiClipboard size={80} className="text-gray-400 mx-auto" />,
      text: (
        <>
          <p>Depois de aceitar, o trabalho vai para a tela Meus Serviços.</p>
          <p>É como a sua agenda. Lá você vê os trabalhos que já são seus.</p>
        </>
      ),
    },
    {
      title: "Passo 4: Siga a lista de tarefas",
      icon: <FiTruck size={80} className="text-teal-500 mx-auto" />,
      text: (
        <>
          <p>Ao chegar no local, use a lista de tarefas para não esquecer nada.</p>
          <p>A lista vai te guiar para tirar as fotos e terminar o trabalho certinho.</p>
        </>
      ),
    },
    {
      title: "Passo 5: Sua nota de trabalho",
      icon: <FiStar size={80} className="text-brand-yellow mx-auto" />,
      text: (
        <>
          <p>Sua nota mostra o quão bom é o seu trabalho.</p>
          <p>Nota alta significa mais trabalhos e mais dinheiro para você!</p>
        </>
      ),
    },
    {
      title: "Passo 6: O período de teste",
      icon: <FiStar size={80} className="text-red-500 mx-auto" />,
      text: (
        <>
          <p>Nos seus primeiros trabalhos, você estará em um período de teste.</p>
          <p>Se você falhar em 2 trabalhos (cancelar ou não aparecer), você não poderá mais usar o app. Cuidado!</p>
        </>
      ),
    },
    {
      title: "Passo 7: Receba seu dinheiro",
      icon: <FiDollarSign size={80} className="text-go-green mx-auto" />,
      text: (
        <>
          <p>Na tela Ganhos, você vê o dinheiro que já pode pegar.</p>
          <p>É só apertar e o dinheiro vai para a sua chave PIX.</p>
        </>
      ),
    },
    {
      title: "Passo 8: Peça ajuda",
      icon: <FiHelpCircle size={80} className="text-gray-400 mx-auto" />,
      text: (
        <>
          <p>Se tiver qualquer dúvida, aperte no botão verde de WhatsApp que fica no canto da tela.</p>
          <p>Nossa equipe vai te ajudar na hora.</p>
        </>
      ),
    },
    {
      title: "Pronto para começar! 💪",
      icon: <FiCheckCircle size={80} className="text-green-500 mx-auto" />,
      text: (
        <>
          <p>Você já sabe tudo o que precisa!</p>
          <p>Agora é só começar a trabalhar e ganhar dinheiro.</p>
        </>
      ),
    },
  ];

  const currentContent = stepsContent[step - 1];
  const totalSteps = stepsContent.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 sm:p-8 text-white">
        <div className="text-center">
          {currentContent.icon}
          <h2 className="text-2xl font-bold mt-4 mb-2">{currentContent.title}</h2>
          <div className="text-gray-300 text-sm">{currentContent.text}</div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={step === 1 || isLoading}
            className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <FiChevronLeft size={20} />
            Voltar
          </button>
          
          <p className="text-sm text-gray-400">
            Passo {step} de {totalSteps}
          </p>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 text-brand-blue hover:text-blue-400"
            >
              Próximo
              <FiChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="bg-brand-blue hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-300 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : 'Começar!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;