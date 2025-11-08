import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Ícone para o status
const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-success">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-info">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconXCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-error">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

//recebe o usuario logado
export default function MeusProcessosPage({ loggedInUser }) {
  const [processos, setProcessos] = useState([]); //lista de processos retornados pela api
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const navigate = useNavigate(); //redireciona p outras pages

  //busca de processos
  useEffect(() => {
    if (!loggedInUser) return;

    const fetchProcessos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Chama a api que controla os processos, passando o ID do usuário logado
        const response = await axios.get(`${API_BASE_URL}/processos/meus/`, {
          params: {
            usuario_id: loggedInUser.usuario_id
          }
        });
        //armazena o resultado
        setProcessos(response.data);
      } catch (err) {
        console.error("Erro ao buscar processos:", err);
        setError("Não foi possível carregar seus processos.");
      } finally {
        setLoading(false);
      }
    };

    fetchProcessos();
  }, [loggedInUser]); // roda sempre que o usuário mudar


  //pega um processo e retorna o icone, texto e desc de acordo com seu status
  const getStatusInfo = (processo) => {
    const status = processo.status_field;
    //se tiver em andamento mostra o icon de relogio, qual a prox etapa e responsavel
    if (status === 'Em Andamento') {
      return { 
        icon: <IconClock />, 
        text: `Em Andamento`,
        details: `Próxima Etapa: ${processo.etapa_atual.etapa_nome} (com ${processo.etapa_atual.usuario_nome || 'N/A'})`
      };
    }
    //se concluido icon de check e descrição de concluido
    if (status === 'Concluído') {
      return { icon: <IconCheckCircle />, text: 'Concluído', details: 'O processo foi finalizado com sucesso.' };
    }
    // assumindo que 'Cancelado' ou 'Recusado' são os outros status
    return { icon: <IconXCircle />, text: status, details: 'O processo foi encerrado.' };
  };

  const handleVerEtapa = (processo) => {
    // Se a etapa atual não estiver atribuída a mim, não posso fazer nada
    if (processo.etapa_atual.usuario_nome !== loggedInUser.nome) {
      alert("Aguarde. Esta etapa está sendo executada por outro usuário.");
      return;
    }
    // se ele for o responsavel redireciona pra etapa 
    navigate(`/processo/etapa/${processo.etapa_atual.processo_etapa_id}`);
  };


  if (loading) {
    return <div className="text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  if (error) {
    return <div className="alert alert-error"><span>{error}</span></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meus Processos</h1>
      <p>Aqui estão todos os processos que você iniciou ou que estão aguardando sua ação.</p>
      
      {processos.length === 0 && (
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body items-center text-center">
            <h2 className="card-title">Nenhum processo encontrado</h2>
            <p>Você ainda não iniciou nenhum processo ou nenhuma tarefa está atribuída a você.</p>
            <div className="card-actions">
              <Link to="/servicos" className="btn btn-primary">
                Iniciar um novo processo
              </Link>
            </div>
          </div>
        </div>
      )}

{/*tabela de demonstração de processos*/}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full bg-base-100 shadow-lg rounded-lg">
          <thead>
            <tr>
              <th>Processo (Template)</th>
              <th>Iniciado Por</th>
              <th>Status</th>
              <th>Detalhes da Etapa Atual</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {processos.map(processo => {
              const statusInfo = getStatusInfo(processo);
              const isEtapaAtribuidaAMim = processo.etapa_atual?.usuario_nome === loggedInUser.nome;
              
              return (
                <tr key={processo.processo_id} className="hover">
                  {/*pega o nome do processo*/}
                  <td>
                    <div className="font-bold">{processo.template_nome}</div>
                    <div className="text-sm opacity-50">ID: {processo.processo_id}</div>
                  </td>
                  {/*pega o nome da pessoa que iniciou*/}
                  <td>{processo.usuario.nome}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {statusInfo.icon}
                      <span className="font-semibold">{statusInfo.text}</span>
                    </div>
                  </td>
                  {/*pega o status do processo*/}
                  <td>{statusInfo.details}</td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      // Só pode ver/executar se o processo estiver "Em Andamento"
                      // E a etapa atual estiver atribuída a mim
                      disabled={!isEtapaAtribuidaAMim}
                      onClick={() => handleVerEtapa(processo)}
                    >
                      Ver/Executar Etapa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}