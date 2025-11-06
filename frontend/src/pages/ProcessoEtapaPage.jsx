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
    // Verifica se o usuário logado é o responsável por esta etapa
    // (etapaDetalhes.usuario é o dono atual da etapa, ex: Admin)
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

    switch (nomeEtapa) {
      case "Solicitação":
        return <FormSolicitacao etapaDetalhes={etapaDetalhes} loggedInUser={loggedInUser} />;
      
      case "Análise":
        return <FormAnalise etapaDetalhes={etapaDetalhes} />;

      case "Recusa":
        return <FormRecusa etapaDetalhes={etapaDetalhes} />;

      default:
        return (
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <h3 className="font-bold text-lg">Etapa: {nomeEtapa}</h3>
            <p>Formulário para esta etapa ({nomeEtapa}) ainda não foi construído.</p>
          </div>
        );
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
 * (Inalterado)
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
 * (Este formulário foi CORRIGIDO)
 */
function FormAnalise({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // Armazena 'proximo' or 'alternativo'
  const [error, setError] = useState(null);

  // Pega os detalhes dos botões "Próximo" e "Alternativo"
  const proximoPasso = etapaDetalhes.etapa_relacao.proximo;
  const passoAlternativo = etapaDetalhes.etapa_relacao.alternativo;
  
  // Pega os dados da solicitação (que a API agora envia)
  const dadosSolicitacao = etapaDetalhes.dados_solicitacao;
  // Pega os dados do solicitante (que a API agora envia)
  const solicitante = etapaDetalhes.solicitante; 

  /**
   * Função genérica para encaminhar o processo
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
      <h2 className="card-title">Formulário de Análise</h2>
      <p>Você está analisando a solicitação de <strong>{solicitante?.nome || '...'}</strong>. Por favor, revise os dados e tome uma decisão.</p>
      
      {/* --- Exibe os dados da Solicitação --- */}
      {dadosSolicitacao ? (
        <div className="p-4 bg-base-200 rounded-lg space-y-2">
          <h3 className="font-bold">Dados da Solicitação:</h3>
          
          {/* --- CORREÇÃO DO BUG DE DIGITAÇÃO --- */}
          <p><strong>Solicitante:</strong> {solicitante?.nome || 'N/A'}</p>
          <p><strong>Email:</strong> {solicitante?.email || 'N/A'}</p>
          <p><strong>CPF:</strong> {dadosSolicitacao.cpf}</p>
          <p><strong>Animal:</strong> {dadosSolicitacao.animal.nome} ({dadosSolicitacao.animal.tipo})</p>
          
          <a 
            href={dadosSolicitacao.comprovante_residencia} 
            download={`comprovante_${solicitante?.nome.split(' ')[0]}_${dadosSolicitacao.cpf}.png`}
            className="btn btn-sm btn-outline btn-secondary"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Ver/Baixar Comprovante
          </a>
        </div>
      ) : (
        <div className="p-4 bg-base-200 rounded-lg">
           <span className="loading loading-spinner loading-xs"></span> Carregando dados da solicitação...
        </div>
      )}


      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      {/* Ações (Botões de Decisão) */}
      <div className="card-actions justify-end pt-4 space-x-2">
        
        {/* Botão Alternativo (ex: Recusar) */}
        {passoAlternativo && (
          <button 
            className="btn btn-error btn-outline"
            disabled={loading || !dadosSolicitacao} // Desabilita se estiver carregando
            onClick={() => handleEncaminhar(passoAlternativo.etapa_relacao_id, 'alternativo')}
          >
            {loading === 'alternativo' ? <span className="loading loading-spinner-xs"></span> : `Encaminhar para ${passoAlternativo.etapa.nome}`}
          </button>
        )}

        {/* Botão Próximo (ex: Aprovar) */}
        {proximoPasso && (
          <button 
            className="btn btn-success"
            disabled={loading || !dadosSolicitacao} // Desabilita se estiver carregando
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
 * Formulário específico para a etapa de "Recusa"
 * (Inalterado)
 */
function FormRecusa({ etapaDetalhes }) {
  const navigate = useNavigate();
  const [justificativa, setJustificativa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // TODO: Criar a API 'RecusaSubmitView'
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
      // (Simulação - A API para isso ainda não foi criada)
      alert(`API (não criada) chamada com:
        - processo_etapa_id: ${etapaDetalhes.processo_etapa_id}
        - justificativa: ${justificativa}
        - proximo_passo_id: ${etapaDetalhes.etapa_relacao.proximo.etapa_relacao_id}
      `);
      
      // Simula a chamada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Criar a API POST /api/etapa/recusa/submit/
      // 1. Salvar na tabela 'recusa'
      // 2. Encaminhar para o próximo passo ('Conclusão')
      
      setLoading(false);
      navigate('/meus-processos');

    } catch (err) {
      setError("Erro ao submeter recusa.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="card-title text-error">Formulário de Recusa</h2>
      <p>Você está recusando este processo. Por favor, insira a justificativa abaixo. Isso será salvo no banco de dados.</p>
      
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