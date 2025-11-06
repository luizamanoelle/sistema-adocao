import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Ícone de exemplo
const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function ServicosPage({ loggedInUser }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        // Chama a API de templates que AGORA retorna o 'responsavel_primeira_etapa'
        const response = await axios.get(`${API_BASE_URL}/templates/`);
        setTemplates(response.data);
      } catch (err) {
        console.error("Erro ao buscar templates:", err);
        setError("Não foi possível carregar os serviços.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []); 

  // --- FUNÇÃO PARA INICIAR PROCESSO (ainda não implementada) ---
  const handleStartProcess = (templateId, templateName) => {
    alert(`Iniciando processo para: ${templateName} (ID: ${templateId})
Usuário: ${loggedInUser.nome} (Tipo: ${loggedInUser.tipo_usuario})`);
    
    // PRÓXIMO PASSO:
    // Aqui você chamaria uma nova API (ex: POST /api/processos/start/)
    // enviando o 'templateId' e o 'loggedInUser.usuario_id'
  };

  if (loading) {
    return <div className="text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  if (error) {
    return <div className="alert alert-error"><span>{error}</span></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Serviços Disponíveis</h1>
      <p className="mb-8">Selecione um processo para iniciar. Você só pode iniciar processos compatíveis com seu tipo de usuário ({loggedInUser.tipo_usuario_detalhes.categoria}).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {templates.length === 0 && (
          <p className="col-span-full text-center">Nenhum serviço (template) cadastrado.</p>
        )}

        {templates.map((template) => {
          
          // --- ESTA É A REGRA DE NEGÓCIO ---
          const podeIniciar = template.responsavel_primeira_etapa === loggedInUser.tipo_usuario;
          // ---------------------------------

          return (
            <div 
              key={template.template_id} 
              className={`card bg-base-100 shadow-xl border border-base-300 ${!podeIniciar ? 'opacity-50' : 'transition-all hover:shadow-2xl hover:border-primary'}`}
            >
              <div className="card-body">
                <h2 className="card-title text-lg font-bold">
                  {template.nome}
                </h2>
                
                {!podeIniciar && (
                  <div className="badge badge-warning badge-sm">Requer outro tipo de usuário</div>
                )}
                
                <p className="text-sm text-base-content/70 mt-2">
                  Inicie um novo processo de {template.nome.toLowerCase()}.
                </p>
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-primary"
                    // Desabilita o botão se o usuário não for do tipo correto
                    disabled={!podeIniciar}
                    onClick={() => handleStartProcess(template.template_id, template.nome)}
                  >
                    Iniciar Processo
                    <IconArrowRight />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}

export default ServicosPage;