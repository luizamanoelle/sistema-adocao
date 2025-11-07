import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Componente principal da página de execução da etapa
 */
export default function ProcessoEtapaPage({ loggedInUser }) {
  const { etapaId } = useParams(); // Pega o ID da URL
  const navigate = useNavigate();

  // Estados
  const [etapaDetalhes, setEtapaDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook para buscar os dados da API
  useEffect(() => {
    const fetchEtapaDetalhes = async () => {
      if (!etapaId) return;
      
      setLoading(true);
      setError(null);

      try {
        // Chama a API GET /api/processo/etapa/<id>/
        const response = await axios.get(`${API_BASE_URL}/processo/etapa/${etapaId}/`);
        setEtapaDetalhes(response.data);
      } catch (err) {
        console.error("Erro ao buscar detalhes da etapa:", err);
        setError("Não foi possível carregar os dados da etapa. Verifique suas permissões.");
      } finally {
        setLoading(false);
      }
    };

    fetchEtapaDetalhes();
  }, [etapaId]); // Roda sempre que o ID da etapa na URL mudar

  /**
   * Função helper para decidir qual formulário renderizar
   */
  const renderEtapaForm = () => {
    if (!etapaDetalhes) return null;

    const nomeEtapa = etapaDetalhes.etapa_relacao.etapa.nome;

    // --- Verificação de Permissão ---
    const isOwner = etapaDetalhes.usuario.usuario_id === loggedInUser.usuario_id;

    if (!isOwner) {
       return (
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <h3 className="font-bold text-lg text-warning">Aguardando Responsável</h3>
            <p>Esta etapa está atualmente atribuída a <strong>{etapaDetalhes.usuario.nome}</strong>.</p>
            <p>Você não pode executar esta ação.</p>
          </div>
        );
    }
    // --- Fim da Verificação ---

    // --- LÓGICA ATUALIZADA ---
    // Se o nome da etapa for "Análise", use o FormAnalise
    // (Isso já estava correto no seu arquivo)
    if (nomeEtapa === "Análise") {
      return <FormAnalise etapaDetalhes={etapaDetalhes} />;
    }
    // --- FIM DA ATUALIZAÇÃO ---

    switch (nomeEtapa) {
      case "Solicitação":
        return <FormSolicitacao etapaDetalhes={etapaDetalhes} loggedInUser={loggedInUser} />;
      
      // O "case "Análise":" foi tratado acima

      case "Aprovação":
        return <FormAprovacao etapaDetalhes={etapaDetalhes} />;

      case "Recusa":
        return <FormRecusa etapaDetalhes={etapaDetalhes} />;

      case "Entrevista":
        return <FormEntrevista etapaDetalhes={etapaDetalhes} />;

      case "Visitação":
        return <FormVisitacao etapaDetalhes={etapaDetalhes} />;

      default:
        // Formulário para "Conclusão" ou outras etapas
        return <FormEtapaGenerica etapaDetalhes={etapaDetalhes} />;
    }
  };

  // --- Renderização ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
        <Link to="/servicos" className="btn btn-sm">Voltar</Link>
      </div>
    );
  }

  if (!etapaDetalhes) {
    return null; 
  }
  
  // --- UI Principal ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Execução do Processo
          </h1>
          <p className="text-lg opacity-70">
            Etapa: <span className="font-bold text-primary">{etapaDetalhes.etapa_relacao.etapa.nome}</span>
             (Status: <span className="font-semibold">{etapaDetalhes.status_field}</span>)
          </p>
        </div>
        <Link to="/meus-processos" className="btn btn-outline">
          Voltar para Meus Processos
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          {renderEtapaForm()}
        </div>
      </div>
    </div>
  );
}


// ---
// COMPONENTES DOS FORMULÁRIOS
// ---

/**
 * Função helper para converter um arquivo para Base64
 */
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove o prefixo (ex: "data:image/png;base64,")
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
});


/**
 * Formulário específico para a etapa de "Solicitação"
 */
function FormSolicitacao({ etapaDetalhes, loggedInUser }) {
  const navigate = useNavigate();
  
  // Estados do formulário
  const [animais, setAnimais] = useState([]);
  const [animalId, setAnimalId] = useState('');
  const [cpf, setCpf] = useState('');
  const [comprovante, setComprovante] = useState(null); // Armazena o objeto File
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Busca a lista de animais para o dropdown
  useEffect(() => {
    const fetchAnimais = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/animais/`);
        setAnimais(response.data);
      } catch (err) {
        console.error("Erro ao buscar animais:", err);
        setFormError("Não foi possível carregar a lista de animais.");
      }
    };
    fetchAnimais();
  }, []);

  const handleFileChange = (e) => {
    setComprovante(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    if (!animalId || !cpf || !comprovante) {
      setFormError("Todos os campos são obrigatórios.");
      setFormLoading(false);
      return;
    }

    try {
      // Pega o ID do próximo passo (Análise)
      const proximoEtapaRelacaoId = etapaDetalhes.etapa_relacao.proximo.etapa_relacao_id;
      
      // Converte o arquivo para Base64 (para o BLOB)
      const comprovanteBase64 = await toBase64(comprovante);

      // Chama a API de submissão
      const response = await axios.post(`${API_BASE_URL}/etapa/solicitacao/submit/`, {
        // Dados do formulário (para tabela 'solicitacao')
        cpf: cpf,
        animal_id: animalId,
        comprovante: comprovanteBase64, // Envia como string Base64
        
        // Dados de controle (para avançar o fluxo)
        processo_etapa_id: etapaDetalhes.processo_etapa_id,
        proximo_etapa_relacao_id: proximoEtapaRelacaoId
      });
      
      setFormLoading(false);
      alert(response.data.message); // Ex: "Solicitação enviada com sucesso!"
      
      // Redireciona para a lista de processos
      navigate('/meus-processos'); 

    } catch (err) {
      console.error("Erro ao enviar solicitação:", err);
      setFormError(err.response?.data?.error || "Ocorreu um erro ao enviar seu formulário.");
      setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="card-title">Formulário de Solicitação de Adoção</h2>
      <p>Você está solicitando este processo como <strong>{loggedInUser.nome}</strong>. Por favor, preencha os dados abaixo.</p>
      
      <div className="form-control">
        <label className="label"><span className="label-text">CPF</span></label>
        <input 
          type="text" 
          placeholder="000.000.000-00" 
          className="input input-bordered"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Animal de Interesse</span></label>
        <select 
          className="select select-bordered"
          value={animalId}
          onChange={(e) => setAnimalId(e.target.value)}
        >
          <option value="" disabled>Selecione um animal</option>
          {animais.map(animal => (
            <option key={animal.animal_id} value={animal.animal_id}>
              {animal.nome} ({animal.tipo})
            </option>
          ))}
        </select>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Comprovante de Residência (PDF, PNG, JPG)</span></label>
        <input 
          type="file" 
          className="file-input file-input-bordered file-input-primary w-full"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, application/pdf" // Define tipos de arquivo
        />
      </div>

      {formError && (
        <div className="alert alert-warning text-sm">
          <span>{formError}</span>
        </div>
      )}

      <div className="card-actions justify-end pt-4">
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={formLoading}
        >
          {formLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            // O botão mostra o nome do próximo passo (ex: "Análise")
            `Enviar e encaminhar para ${etapaDetalhes.etapa_relacao.proximo.etapa.nome}`
          )}
        </button>
      </div>
    </form>
  );
}


/**
 * Formulário específico para a etapa de "Análise"
 * (VERSÃO ATUALIZADA - AGORA É GENÉRICO)
 */
function FormAnalise({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // Armazena 'proximo' or 'alternativo'
  const [error, setError] = useState(null);

  // Pega os detalhes dos botões "Próximo" e "Alternativo"
  const proximoPasso = etapaDetalhes.etapa_relacao.proximo;
  const passoAlternativo = etapaDetalhes.etapa_relacao.alternativo;
  
  // Pega os dados do solicitante (que a API agora envia)
  const solicitante = etapaDetalhes.solicitante; 

  /**
   * Função genérica para encaminhar o processo (inalterada)
   */
  const handleEncaminhar = async (proximaEtapaRelacaoId, tipo) => {
    setLoading(tipo); // Trava o botão clicado
    setError(null);

    try {
      // Chama a API genérica 'EncaminharEtapaView'
      const response = await axios.post(`${API_BASE_URL}/etapa/encaminhar/`, {
        processo_etapa_id_atual: etapaDetalhes.processo_etapa_id,
        proxima_etapa_relacao_id: proximaEtapaRelacaoId
      });

      alert(response.data.message); // "Etapa encaminhada com sucesso!"
      navigate('/meus-processos');
      
    } catch (err) {
      console.error("Erro ao encaminhar etapa:", err);
      setError(err.response?.data?.error || "Ocorreu um erro ao encaminhar a etapa.");
      setLoading(null); // Libera o botão em caso de erro
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="card-title">Formulário de {etapaDetalhes.etapa_relacao.etapa.nome}</h2>
      <p>Você está analisando a etapa anterior de <strong>{solicitante?.nome || '...'}</strong>. Por favor, revise os dados e tome uma decisão.</p>
      
      {/* --- Exibe os dados da Etapa Anterior (LÓGICA CORRIGIDA) --- */}
      <RenderDadosAnteriores 
        etapa={etapaDetalhes} 
      />


      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      {/* Ações (Botões de Decisão) - (inalterado) */}
      <div className="card-actions justify-end pt-4 space-x-2">
        
        {/* Botão Alternativo (ex: Recusar) */}
        {passoAlternativo && (
          <button 
            className="btn btn-error btn-outline"
            disabled={loading}
            onClick={() => handleEncaminhar(passoAlternativo.etapa_relacao_id, 'alternativo')}
          >
            {loading === 'alternativo' ? <span className="loading loading-spinner-xs"></span> : `Encaminhar para ${passoAlternativo.etapa.nome}`}
          </button>
        )}

        {/* Botão Próximo (ex: Aprovar) */}
        {proximoPasso && (
          <button 
            className="btn btn-success"
            disabled={loading}
            onClick={() => handleEncaminhar(proximoPasso.etapa_relacao_id, 'proximo')}
          >
            {loading === 'proximo' ? <span className="loading loading-spinner-xs"></span> : `Encaminhar para ${proximoPasso.etapa.nome}`}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Componente Helper ATUALIZADO
 * Renderiza os dados da etapa anterior com a LÓGICA INVERTIDA
 */
function RenderDadosAnteriores({ etapa }) {
  const { dados_solicitacao, dados_entrevista, dados_visitacao, solicitante } = etapa;

  // LÓGICA INVERTIDA: Checa os dados mais recentes primeiro

  // 1. Se houver dados da VISITAÇÃO (etapa mais avançada)
  if (dados_visitacao) {
    return (
      <div className="p-4 bg-base-200 rounded-lg space-y-2">
        <h3 className="font-bold">Dados da Visitação:</h3>
        <p><strong>Data Agendada:</strong> {new Date(dados_visitacao.data_field).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
        <p><strong>Endereço:</strong> {dados_visitacao.endereco}</p>
      </div>
    );
  }

  // 2. Se houver dados da ENTREVISTA
  if (dados_entrevista) {
    return (
      <div className="p-4 bg-base-200 rounded-lg space-y-2">
        <h3 className="font-bold">Dados da Entrevista:</h3>
        <p><strong>Data Agendada:</strong> {new Date(dados_entrevista.data_field).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
        <p><strong>Observações:</strong> {dados_entrevista.observacoes || '(Nenhuma observação)'}</p>
      </div>
    );
  }
  
  // 3. Se houver dados da SOLICITAÇÃO (fallback para "Análise" padrão)
  if (dados_solicitacao) {
    return (
      <div className="p-4 bg-base-200 rounded-lg space-y-2">
        <h3 className="font-bold">Dados da Solicitação:</h3>
        <p><strong>Solicitante:</strong> {solicitante?.nome || 'N/A'}</p>
        <p><strong>Email:</strong> {solicitante?.email || 'N/A'}</p>
        <p><strong>CPF:</strong> {dados_solicitacao.cpf}</p>
        <p><strong>Animal:</strong> {dados_solicitacao.animal.nome} ({dados_solicitacao.animal.tipo})</p>
        <a 
          href={dados_solicitacao.comprovante_residencia} 
          download={`comprovante_${solicitante?.nome.split(' ')[0]}_${dados_solicitacao.cpf}.png`}
          className="btn btn-sm btn-outline btn-secondary"
          target="_blank" 
          rel="noopener noreferrer"
        >
          Ver/Baixar Comprovante
        </a>
      </div>
    );
  }

  // 4. Fallback 
  return (
    <div className="p-4 bg-base-200 rounded-lg">
      <p>Nenhum dado da etapa anterior foi encontrado para esta análise.</p>
    </div>
  );
}


/**
 * Formulário específico para a etapa de "Aprovação"
 */
function FormAprovacao({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  // Pega os detalhes dos botões
  const proximoPasso = etapaDetalhes.etapa_relacao.proximo;
  const passoAlternativo = etapaDetalhes.etapa_relacao.alternativo;

  const handleEncaminhar = async (proximaEtapaRelacaoId, tipo) => {
    setLoading(tipo);
    setError(null);

    try {
      // Chama a MESMA API genérica 'EncaminharEtapaView'
      const response = await axios.post(`${API_BASE_URL}/etapa/encaminhar/`, {
        processo_etapa_id_atual: etapaDetalhes.processo_etapa_id,
        proxima_etapa_relacao_id: proximaEtapaRelacaoId
      });

      alert(response.data.message);
      navigate('/meus-processos');
      
    } catch (err) {
      console.error("Erro ao encaminhar etapa:", err);
      setError(err.response?.data?.error || "Ocorreu um erro ao encaminhar a etapa.");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="card-title">Formulário de Aprovação</h2>
      <p>Esta é a etapa final de aprovação. Ao confirmar, o processo será encaminhado para a conclusão.</p>

      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="card-actions justify-end pt-4 space-x-2">
        {/* Botão Alternativo (ex: "Voltar para Análise", se existir no template) */}
        {passoAlternativo && (
          <button 
            className="btn btn-warning btn-outline"
            disabled={loading}
            onClick={() => handleEncaminhar(passoAlternativo.etapa_relacao_id, 'alternativo')}
          >
            {loading === 'alternativo' ? <span className="loading loading-spinner-xs"></span> : `Voltar para ${passoAlternativo.etapa.nome}`}
          </button>
        )}

        {/* Botão Próximo (ex: "Concluir") */}
        {proximoPasso && (
          <button 
            className="btn btn-success"
            disabled={loading}
            onClick={() => handleEncaminhar(proximoPasso.etapa_relacao_id, 'proximo')}
          >
            {loading === 'proximo' ? <span className="loading loading-spinner-xs"></span> : `Confirmar e Encaminhar para ${proximoPasso.etapa.nome}`}
          </button>
        )}
      </div>
    </div>
  );
}


/**
 * Formulário específico para a etapa de "Recusa"
 */
function FormRecusa({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [justificativa, setJustificativa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!justificativa) {
      setError("A justificativa é obrigatória para recusar o processo.");
      setLoading(false);
      return;
    }

    try {
      // Chama a nova API 'RecusaSubmitView'
      const response = await axios.post(`${API_BASE_URL}/etapa/recusa/submit/`, {
        processo_etapa_id: etapaDetalhes.processo_etapa_id,
        justificativa: justificativa,
        proximo_etapa_relacao_id: etapaDetalhes.etapa_relacao.proximo.etapa_relacao_id
      });
      
      setLoading(false);
      alert(response.data.message);
      navigate('/meus-processos');

    } catch (err) {
      console.error("Erro ao submeter recusa:", err);
      setError(err.response?.data?.error || "Erro ao submeter recusa.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="card-title text-error">Formulário de Recusa</h2>
      <p>Você está recusando este processo. Por favor, insira a justificativa abaixo. Isso será salvo na tabela `recusa`.</p>
      
      <div className="form-control">
        <label className="label"><span className="label-text">Justificativa da Recusa</span></label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Ex: O solicitante não atende aos pré-requisitos..."
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
        ></textarea>
      </div>

      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      {/* Ações */}
      <div className="card-actions justify-end pt-4">
        <button 
          type="submit" 
          className="btn btn-error"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner-xs"></span> : `Confirmar Recusa e Encaminhar para ${etapaDetalhes.etapa_relacao.proximo.etapa.nome}`}
        </button>
      </div>
    </form>
  );
}

/**
 * Componente genérico para etapas sem formulário (ex: Conclusão)
 */
function FormEtapaGenerica({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Adicionado estado de erro

  const handleConcluir = async () => {
    setLoading(true);
    setError(null); // Limpa erros antigos

    try {
      // Chama a nova API que criamos no backend
      const response = await axios.post(`${API_BASE_URL}/processo/concluir/`, {
        processo_etapa_id: etapaDetalhes.processo_etapa_id
      });
      
      setLoading(false);
      alert(response.data.message); // Ex: "Processo concluído com sucesso!"
      navigate("/meus-processos");

    } catch (err) {
      console.error("Erro ao concluir processo:", err);
      setError(err.response?.data?.error || "Ocorreu um erro ao finalizar o processo.");
      setLoading(false);
    }
  }

  // Se não houver próximo passo, é o FIM do fluxo
  if (!etapaDetalhes.etapa_relacao.proximo) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="card-title justify-center text-success">Processo Concluído!</h2>
        <p>Este processo foi finalizado.</p>

        {/* Exibe o erro, se houver */}
        {error && (
          <div className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        <div className="card-actions justify-center pt-4">
           <button className="btn btn-success" onClick={handleConcluir} disabled={loading}>
             {loading ? <span className="loading loading-spinner-xs"></span> : "Finalizar e Voltar"}
           </button>
        </div>
      </div>
    );
  }

  // (O resto da sua lógica para etapas genéricas que TÊM um próximo passo)
  return (
    <div className="space-y-4">
      <h2 className="card-title">Etapa: {etapaDetalhes.etapa_relacao.etapa.nome}</h2>
      <p>Esta é uma etapa genérica. Clique para avançar.</p>
       <div className="card-actions justify-end pt-4">
        <button className="btn btn-primary" disabled>
          Encaminhar para {etapaDetalhes.etapa_relacao.proximo.etapa.nome}
        </button>
      </div>
    </div>
  )
}


// ---
// NOVOS FORMULÁRIOS DE ETAPA
// ---

/**
 * Formulário específico para a etapa de "Entrevista"
 */
function FormEntrevista({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!data) {
      setError("A data é obrigatória.");
      setLoading(false);
      return;
    }

    try {
      // Chama a nova API 'EntrevistaSubmitView'
      const response = await axios.post(`${API_BASE_URL}/etapa/entrevista/submit/`, {
        processo_etapa_id: etapaDetalhes.processo_etapa_id,
        data_: data,
        observacoes: observacoes || null, // Permite observações nulas
        proximo_etapa_relacao_id: etapaDetalhes.etapa_relacao.proximo.etapa_relacao_id
      });
      
      setLoading(false);
      alert(response.data.message);
      navigate('/meus-processos');

    } catch (err) {
      console.error("Erro ao submeter entrevista:", err);
      // Aqui captura o erro do trigger (ex: "Data já reservada")
      setError(err.response?.data?.error || "Erro ao submeter entrevista.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="card-title">Formulário de Entrevista</h2>
      <p>Por favor, agende a data da entrevista. As observações são opcionais.</p>
      
      <div className="form-control">
        <label className="label"><span className="label-text">Data da Entrevista</span></label>
        <input
          type="date"
          className="input input-bordered"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Observações (Opcional)</span></label>
        <textarea
          className="textarea textarea-bordered h-24"
          placeholder="Ex: Entrevista realizada online, candidato parece apto..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        ></textarea>
      </div>

      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="card-actions justify-end pt-4">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner-xs"></span> : `Agendar e Encaminhar para ${etapaDetalhes.etapa_relacao.proximo.etapa.nome}`}
        </button>
      </div>
    </form>
  );
}

/**
 * Formulário específico para a etapa de "Visitação"
 */
function FormVisitacao({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [data, setData] = useState('');
  const [endereco, setEndereco] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!data || !endereco) {
      setError("Data e Endereço são obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      // Chama a nova API 'VisitacaoSubmitView'
      const response = await axios.post(`${API_BASE_URL}/etapa/visitacao/submit/`, {
        processo_etapa_id: etapaDetalhes.processo_etapa_id,
        data_: data,
        endereco: endereco,
        proximo_etapa_relacao_id: etapaDetalhes.etapa_relacao.proximo.etapa_relacao_id
      });
      
      setLoading(false);
      alert(response.data.message);
      navigate('/meus-processos');

    } catch (err) {
      console.error("Erro ao submeter visitação:", err);
      // Aqui captura o erro do trigger (ex: "Data já reservada")
      setError(err.response?.data?.error || "Erro ao submeter visitação.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="card-title">Formulário de Visitação</h2>
      <p>Por favor, agende a data e o endereço da visitação.</p>
      
      <div className="form-control">
        <label className="label"><span className="label-text">Data da Visitação</span></label>
        <input
          type="date"
          className="input input-bordered"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Endereço da Visitação</span></label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="Ex: Rua dos Bobos, 0"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />
      </div>

      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="card-actions justify-end pt-4">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner-xs"></span> : `Agendar e Encaminhar para ${etapaDetalhes.etapa_relacao.proximo.etapa.nome}`}
        </button>
      </div>
    </form>
  );
}