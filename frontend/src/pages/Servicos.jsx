import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

//icon da setinha
const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const API_BASE_URL = 'http://127.0.0.1:8000/api';

//cartões de serviço
const ServiceCard = ({ template, podeIniciar, isLoading, onStart }) => (
  <div 
    className={`card bg-base-100 shadow-xl border border-base-300 ${
      !podeIniciar ? 'opacity-50' : 'transition-all hover:shadow-2xl hover:border-primary'
    }`}
  >
    <div className="card-body">
      <h2 className="card-title text-lg font-bold">{template.nome}</h2>
      
      {!podeIniciar && (
        <div className="badge badge-warning badge-sm">Requer outro tipo de usuário</div>
      )}

      <p className="text-sm text-base-content/70 mt-2">
        Inicie um novo processo de {template.nome.toLowerCase()}.
      </p>

      <div className="card-actions justify-end mt-4">
        <button 
          className="btn btn-primary"
          disabled={!podeIniciar || isLoading}
          onClick={() => onStart(template.template_id)}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <>
              Iniciar Processo
              <IconArrowRight />
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

function ServicosPage({ loggedInUser }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processLoading, setProcessLoading] = useState(null);
  const navigate = useNavigate();

  // busca templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setError(null);
        const { data } = await axios.get(`${API_BASE_URL}/templates/`);
        setTemplates(data);
      } catch (err) {
        console.error("Erro ao buscar templates:", err);
        setError("Não foi possível carregar os serviços.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // inicia um processo
  const handleStartProcess = useCallback(async (templateId) => {
    setProcessLoading(templateId);
    setError(null);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/processos/start/`, {
        template_id: templateId,
        usuario_id: loggedInUser.usuario_id
      });

      navigate(`/processo/etapa/${data.processo_etapa_id}`);
    } catch (err) {
      console.error("Erro ao iniciar processo:", err);
      setError(err.response?.data?.error || "Não foi possível iniciar o processo.");
      setProcessLoading(null);
    }
  }, [loggedInUser, navigate]);

  if (loading) {
    return (
      <div className="text-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Serviços Disponíveis</h1>
      <p className="mb-8">
        Selecione um processo para iniciar. Você só pode iniciar processos compatíveis 
        com seu tipo de usuário (<strong>{loggedInUser.tipo_usuario_detalhes.categoria}</strong>).
      </p>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <p className="col-span-full text-center">Nenhum serviço disponível no momento.</p>
        ) : (
          templates.map(template => {
            const podeIniciar = template.primeira_etapa_responsavel_id === loggedInUser.tipo_usuario;
            const isLoading = processLoading === template.template_id;
            return (
              <ServiceCard
                key={template.template_id}
                template={template}
                podeIniciar={podeIniciar}
                isLoading={isLoading}
                onStart={handleStartProcess}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default ServicosPage;
