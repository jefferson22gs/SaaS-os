import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DailyReport } from '../types';
import { Modal, Button, MicrophoneIcon, SparklesIcon } from './UI';
import { getConversationalAnalysis } from '../services/geminiService';

// Add SpeechRecognition to the window interface
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const AiAssistant: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  report: DailyReport;
}> = ({ isOpen, onClose, report }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the messages list
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }
  }, []);

  const handleQuery = useCallback(async (queryText: string) => {
      if (!queryText.trim()) return;

      setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
      setIsLoading(true);

      const aiResponse = await getConversationalAnalysis(queryText, report);

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsLoading(false);
  }, [report]);

  const toggleListen = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const query = formData.get('query') as string;
      handleQuery(query);
      event.currentTarget.reset();
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assistente de IA" size="lg">
      <div className="flex flex-col h-[60vh]">
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-base-200 rounded-lg">
          {messages.length === 0 && (
            <div className="text-center text-text-secondary h-full flex flex-col justify-center items-center">
                <SparklesIcon className="w-12 h-12 text-primary/50 mx-auto mb-4" />
                <p className="font-semibold">Olá! Como posso ajudar?</p>
                <p className="text-sm">Pergunte-me sobre os dados do dia.</p>
                <p className="text-xs mt-2">Ex: "Qual foi o produto mais vendido?"</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-base-100 text-text-primary'}`}>
                {msg.text}
              </div>
            </div>
          ))}
           {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-base-100 text-text-primary flex items-center gap-2">
                 <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span> 
                 Analisando...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-4 pt-4 border-t border-base-300">
           <form className="flex items-center gap-2" onSubmit={handleManualSubmit}>
                <input
                    type="text"
                    name="query"
                    className="w-full px-4 py-2 bg-base-100 border border-base-300 rounded-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="Ou digite sua pergunta..."
                    disabled={isLoading}
                />
                <Button type="button" onClick={toggleListen} disabled={!recognitionRef.current || isLoading} className={`!p-3 rounded-full ${isListening ? 'bg-red-500' : 'bg-primary'}`}>
                    <MicrophoneIcon className="w-6 h-6 text-white"/>
                </Button>
           </form>
        </div>
      </div>
    </Modal>
  );
};
