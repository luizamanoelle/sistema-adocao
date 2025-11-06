import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Ícone de exemplo
const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);


function Servicos() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    // Função para buscar os templates
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        // Chama a nova URL
        const response = await axios.get(`${API_BASE_URL}/templates/`);
        setTemplates(response.data);
      } catch (err) {
        console.error("Erro ao buscar templates:", err);
        setError("Não foi possível carregar os serviços. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []); // O array vazio [] faz isso rodar apenas uma vez, quando o componente monta

  // Renderiza um spinner de loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Renderiza uma mensagem de erro
  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2.12V7.88A2 2 0 0019.03 6h-1.14a2 2 0 01-1.96-1.61L14.83 2.5A2 2 0 0013.03 1H10.97a2 2 0 00-1.8 1.5L8.07 4.39A2 2 0 016.11 6H5.03A2 2 0 003 7.88v4.24a2 2 0 001.03 1.75l2.83 1.64a2 2 0 011.1 1.73V19c0 .53.21 1.04.59 1.41l1.38 1.38A2 2 0 0010.97 23h2.06a2 2 0 001.41-.59l1.38-1.38c.38-.37.59-.88.59-1.41v-1.78c0-.64.4-1.23 1.03-1.73l2.83-1.64A2 2 0 0021 12.12z" /></svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Renderiza a lista de templates
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Serviços Disponíveis</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {templates.length === 0 && (
          <p className="col-span-full text-center">Nenhum serviço (template) cadastrado no momento.</p>
        )}

        {templates.map((template) => (
          <div key={template.template_id} className="card bg-base-100 shadow-xl border border-base-300 transition-all hover:shadow-2xl hover:border-primary">
            <div className="card-body">
              <h2 className="card-title text-lg font-bold">
                {template.nome}
              </h2>
              <p className="text-sm text-base-content/70">
                Inicie um novo processo de {template.nome.toLowerCase()}.
              </p>
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-primary"
                  onClick={() => alert(`Iniciar processo para: ${template.nome} (ID: ${template.template_id})`)}
                >
                  Iniciar Processo
                  <IconArrowRight />
                </button>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

export default Servicos;