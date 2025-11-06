import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <-- 1. IMPORTAR useNavigate

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
  
  // 2. ESTADO DE LOADING PARA O BOTÃO (evita clique duplo)
  const [processLoading, setProcessLoading] = useState(null); // Armazena o ID do template sendo criado
  const navigate = useNavigate(); // <-- 3. INICIAR O HOOK

  useEffect(() => {
    // (O useEffect continua o mesmo)
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
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

  // --- 4. ATUALIZAR A FUNÇÃO handleStartProcess ---
  const handleStartProcess = async (templateId) => {
    setProcessLoading(templateId); // Trava este botão
    setError(null); // Limpa erros antigos

    try {
      // Chama a API que criamos no backend (core/views.py)
      const response = await axios.post(`${API_BASE_URL}/processos/start/`, {
        template_id: templateId,
        // (O backend vai pegar o usuario_id do request, mas vamos enviar)
        usuario_id: loggedInUser.usuario_id 
      });

      // Pega o ID da primeira etapa (ex: 123) que o backend retornou
      const { processo_etapa_id } = response.data;
      
      // Redireciona o usuário para a nova página de execução
      navigate(`/processo/etapa/${processo_etapa_id}`);

    } catch (err) {
      console.error("Erro ao iniciar processo:", err);
      // Mostra o erro (ex: "Você não tem permissão")
      const apiError = err.response?.data?.error || "Não foi possível iniciar o processo.";
      setError(apiError); 
      setProcessLoading(null); // Libera o botão se der erro
    }
    // Não precisamos de 'finally' aqui, pois o 'navigate' já desmonta a página
  };

  if (loading) {
    return <div className="text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Serviços Disponíveis</h1>
      <p className="mb-8">Selecione um processo para iniciar. Você só pode iniciar processos compatíveis com seu tipo de usuário ({loggedInUser.tipo_usuario_detalhes.categoria}).</p>

      {/* 5. Mostra o erro da API de processo aqui */}
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* ESTA É A LINHA CORRIGIDA (sem o comentário quebrado) */}
        {templates.length === 0 && (
          <p className="col-span-full text-center">Nenhum serviço (template) cadastrado.</p>
        )}

        {templates.map((template) => {
          
          const podeIniciar = template.primeira_etapa_responsavel_id === loggedInUser.tipo_usuario;
          // Verifica se ESTE botão específico está carregando
          const isLoading = processLoading === template.template_id; 

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
                    // Desabilita se não pode iniciar OU se já está carregando
                    disabled={!podeIniciar || isLoading}
                    onClick={() => handleStartProcess(template.template_id)}
                  >
                    {/* 6. Mostra o spinner de loading no botão */}
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
        })}

      </div>
    </div>
  );
}

export default ServicosPage;