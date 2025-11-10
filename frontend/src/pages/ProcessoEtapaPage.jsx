import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// hook generico q faz post e lida c carregamento, erros e navigate.
function useApi() {
  //centraliza a logica de requisições de cada forms
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); 
  const [error, setError] = useState(null);

  //faz a requisição de post se der certo msg de alert e redireciona
  const post = async (url, payload, tipo = 'submit', onSuccessRedirect = "/meus-processos") => {
    setLoading(tipo);
    setError(null);
    try {
      const { data } = await axios.post(url, payload);
      alert(data.message);
      navigate(onSuccessRedirect);
    } catch (err) {
      console.error("Erro na requisição:", err);
      const errorMsg = err.response?.data?.error || "Ocorreu um erro na requisição.";
      setError(errorMsg);
      setLoading(null);
    }
  };
  return { post, loading, error, setError }; 
}

// Componente reutilizável para botões de decisão (Encaminhar / Alternativo)
function ActionButtons({ 
  etapaDetalhes, 
  onEncaminhar, 
  loading, 
  //normalmente eh o de recusa então ta vermelho
  btnAlternativoClass = "btn-error btn-outline",
  labelProximo = null, 
  labelAlternativo = null 
}) {
  //recebe as relações de etapas e exibe
  const { proximo, alternativo } = etapaDetalhes.etapa_relacao; 

  return (
    <div className="card-actions justify-end pt-4 space-x-2">
      {/*pega o nome de cada prox etapa sendo ela alternativa ou nao*/}
      {alternativo && (
        <button
          className={`btn ${btnAlternativoClass}`}
          disabled={!!loading}
          //quando clica chama encaminhar c dois parametros o id das prox etapa e o tipo
          onClick={() => onEncaminhar(alternativo.etapa_relacao_id, "alternativo")}
        >
          {loading === "alternativo"
            ? <span className="loading loading-spinner-xs"></span>
            : labelAlternativo || `Encaminhar para ${alternativo.etapa.nome}`}
        </button>
      )}
      {proximo && (
        <button
          className="btn btn-success"
          disabled={!!loading}
          onClick={() => onEncaminhar(proximo.etapa_relacao_id, "proximo")}
        >
          {loading === "proximo"
            ? <span className="loading loading-spinner-xs"></span>
            : labelProximo || `Encaminhar para ${proximo.etapa.nome}`}
        </button>
      )}
    </div>
  );
}


//componente genérico para etapas finais (Conclusão, Cancelamento)
function FormPassoFinal({ processoEtapaId, apiUrl, titulo, descricao, titleClass = '', btnClass = 'btn-primary' }) {
  //post simples (não tem nada a acrescentar)
  const { post, loading, error } = useApi(); 

  //ao clicar, chama a api e finaliza o processo
  const handleFinalizar = async () => {

    // A API /etapa/encaminhar/ espera 'processo_etapa_id_atual' e 'proxima_etapa_relacao_id'
    await post(apiUrl, {
      processo_etapa_id_atual: processoEtapaId,
      proxima_etapa_relacao_id: null // Envia 'null' para indicar que é um passo final
    }, 'submit');
  }

  return (
    <div className="space-y-4 text-center">
      <h2 className={`card-title justify-center ${titleClass}`}>{titulo}</h2>
      <p>{descricao}</p>

      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="card-actions justify-center pt-4">
         <button className={`btn ${btnClass}`} onClick={handleFinalizar} disabled={loading === 'submit'}>
           {loading === 'submit' ? <span className="loading loading-spinner-xs"></span> : "Finalizar e Voltar"}
         </button>
      </div>
    </div>
  );
}


//Componente genérico para formulários de submissão (Recusa, Entrevista, Visitação)
 
function FormSubmissao({
  etapaDetalhes, //dados da etapa atual
  apiUrl, //endpoint
  titulo, 
  descricao,
  titleClass = '',
  initialState,
  validate, //vê se o form ta completo
  getPayload, //tranforma pro back
  children, //muda em cada etapa
  btnLabel, //texto pro botao
  btnClass = 'btn-primary'  //botão
}) {
  //form data pra armazanar os dados e atualiza
  const [formData, setFormData] = useState(initialState);
  const { post, loading, error, setError } = useApi();

  //padrão de submit
  const handleSubmit = async (e) => {
    e.preventDefault(); //impede reload da pagina
    setError(null);

    //validação de dados preenchidos
    const validationError = validate(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    //transforma pro back
    const payload = getPayload(formData);
    
    //usa o useapi pra fazer o post submit envia o id, proxima relação e dados preenchidos
    await post(apiUrl, {
      ...payload,
      processo_etapa_id: etapaDetalhes.processo_etapa_id,
      proximo_etapa_relacao_id: etapaDetalhes.etapa_relacao.proximo.etapa_relacao_id
    }, 'submit');
  };

  //pega o nome da proxima etapa
  const proximoNome = etapaDetalhes.etapa_relacao.proximo.etapa.nome;

  return (
    //mostra o titulo e descrição do forms q ta
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className={`card-title ${titleClass}`}>{titulo}</h2>
      <p>{descricao}</p>
      
      {/* Renderiza os campos do formulário via children prop, cada etapa tem suas coisas mas usa a msm logica*/}
      {children(formData, setFormData)}

      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}
 {/*se tiver carregando a bolinha se nao mostra o texto padrão de submit e entrevista/visitação*/}
      <div className="card-actions justify-end pt-4">
        <button 
          type="submit" 
          className={`btn ${btnClass}`}
          disabled={loading === 'submit'}
        >
          {loading === 'submit' 
            ? <span className="loading loading-spinner-xs"></span> 
            : (btnLabel || `Agendar e Encaminhar para ${proximoNome}`)
          }
        </button>
      </div>
    </form>
  );
}

// Gerencia tudo 

export default function ProcessoEtapaPage({ loggedInUser }) {
  //busca o id da etapa q ta via api
  const { etapaId } = useParams();
  const [etapaDetalhes, setEtapaDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //ao abrir chama o back e guarda os dados
  useEffect(() => {
    const fetchEtapaDetalhes = async () => {
      if (!etapaId) return;
      setLoading(true);
      setError(null);
      try {
        //pge ao id da etapa do processo
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
  }, [etapaId]); //muda sempre q troca de etapa

  const renderEtapaForm = () => {
    if (!etapaDetalhes) return null;
    //pega o nome da etapa que ta
    const nomeEtapa = etapaDetalhes.etapa_relacao.etapa.nome;
    const isOwner = etapaDetalhes.usuario.usuario_id === loggedInUser.usuario_id;

    if (!isOwner) {
       return (
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <p>Você não pode executar esta ação.</p>
          </div>
        );
    }

    //caso separado pois renderiza mais de um forms
    if (nomeEtapa === "Análise") {
      return <FormAnalise etapaDetalhes={etapaDetalhes} />;
    }

    //decide qual forms vai mostrar com base no nome
    switch (nomeEtapa) {
      case "Solicitação":
        return <FormSolicitacao etapaDetalhes={etapaDetalhes} loggedInUser={loggedInUser} />;
      case "Aprovação":
        return <FormAprovacao etapaDetalhes={etapaDetalhes} />;
      case "Recusa":
        return <FormRecusa etapaDetalhes={etapaDetalhes} />;
      case "Entrevista":
        return <FormEntrevista etapaDetalhes={etapaDetalhes} />;
      case "Visitação":
        return <FormVisitacao etapaDetalhes={etapaDetalhes} />;
      case "Cancelamento":
        return <FormCancelamento etapaDetalhes={etapaDetalhes} />;
      case "Conclusão":
      default:
        return <FormEtapaGenerica etapaDetalhes={etapaDetalhes} />;
    }
  };

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
  
  //tela padrão de toda etapa, mostra qual etapa ta, o status dela e a opção de voltar pra tela de meus processos
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Execução do Processo</h1>
          <p className="text-lg opacity-70">
            Etapa: <span className="font-bold text-primary">{etapaDetalhes.etapa_relacao.etapa.nome}</span>
             (Status: <span className="font-semibold">{etapaDetalhes.status_field}</span>)
          </p>
        </div>
        <Link to="/meus-processos" className="btn btn-outline">
          Voltar para Meus Processos
        </Link>
      </div>
      {/*renderiza o forms que ta*/}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          {renderEtapaForm()}
        </div>
      </div>
    </div>
  );
}

//converte o pdf pra base64 e assim conseguir salvar no banco
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
});

//SOLICITAÇÃO
function FormSolicitacao({ etapaDetalhes, loggedInUser }) {
  const [animais, setAnimais] = useState([]);
  const [animalId, setAnimalId] = useState('');
  const [cpf, setCpf] = useState('');
  const [comprovante, setComprovante] = useState(null);
  const { post, loading, error, setError } = useApi();
  const [apiError, setApiError] = useState(null);

  //faz um get dos animais
  useEffect(() => {
    const fetchAnimais = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/animais/`);
        setAnimais(response.data);
      } catch (err) {
        console.error("Erro ao buscar animais:", err);
        setApiError("Não foi possível carregar a lista de animais.");
      }
    };
    fetchAnimais();
  }, []);

  //impede reload 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    //obriga preenchimento dos campos
    if (!animalId || !cpf || !comprovante) {
      setError("Todos os campos são obrigatórios.");
      return;
    }
    try {
      //indica pra onde vai depois
      const proximoEtapaRelacaoId = etapaDetalhes.etapa_relacao.proximo.etapa_relacao_id;
      //converte o comprovante pra base64
      const comprovanteBase64 = await toBase64(comprovante);
      //usa o usepai e envia via post os dados 
      await post(`${API_BASE_URL}/etapa/solicitacao/submit/`, {
        cpf: cpf,
        animal_id: animalId,
        comprovante: comprovanteBase64,
        processo_etapa_id: etapaDetalhes.processo_etapa_id,
        proximo_etapa_relacao_id: proximoEtapaRelacaoId
      }, 'submit');
    } catch (err) {
      console.error("Erro ao preparar solicitação:", err);
      setError("Erro ao processar o arquivo.");
    }
  };

  if (apiError) {
    return <div className="alert alert-warning text-sm"><span>{apiError}</span></div>
  }

  return (
    //estrutura visual
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="card-title">Formulário de Solicitação de Adoção</h2>
      <p>Você está solicitando este processo como <strong>{loggedInUser.nome}</strong>. Por favor, preencha os dados abaixo.</p>
      
      <div className="form-control">
        <label className="label"><span className="label-text">CPF</span></label>
        <input type="text" placeholder="000.000.000-00" className="input input-bordered" value={cpf} onChange={(e) => setCpf(e.target.value)} />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Animal de Interesse</span></label>
        <select className="select select-bordered" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
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
        <input type="file" className="file-input file-input-bordered file-input-primary w-full" onChange={(e) => setComprovante(e.target.files[0])} accept="image/png, image/jpeg, application/pdf" />
      </div>

      {error && (<div className="alert alert-warning text-sm"><span>{error}</span></div>)}

      <div className="card-actions justify-end pt-4">
        <button type="submit" className="btn btn-primary" disabled={loading === 'submit'}>
          {loading === 'submit' ? <span className="loading loading-spinner loading-xs"></span> : `Enviar e encaminhar para ${etapaDetalhes.etapa_relacao.proximo.etapa.nome}`}
        </button>
      </div>
    </form>
  );
}

//ANALISE

function FormAnalise({ etapaDetalhes }) {
  const { post, loading, error } = useApi();
  const solicitante = etapaDetalhes.solicitante; 

  const handleEncaminhar = (proximaEtapaRelacaoId, tipo) => {
    post(`${API_BASE_URL}/etapa/encaminhar/`, {
      processo_etapa_id_atual: etapaDetalhes.processo_etapa_id,
      proxima_etapa_relacao_id: proximaEtapaRelacaoId
    }, tipo);
  };

  return (
    //usa renderdadosanteriores pra exibir os dados da etapa a ser analisada e actionbuttons pra aprovar/recusar
    <div className="space-y-4">
      <h2 className="card-title">Formulário de {etapaDetalhes.etapa_relacao.etapa.nome}</h2>
      <p>Você está analisando a etapa anterior de <strong>{solicitante?.nome || '...'}</strong>. Por favor, revise os dados e tome uma decisão.</p>
      <RenderDadosAnteriores etapa={etapaDetalhes} />
      {error && (<div className="alert alert-error text-sm"><span>{error}</span></div>)}
      <ActionButtons
        etapaDetalhes={etapaDetalhes}
        onEncaminhar={handleEncaminhar}
        loading={loading}
      />
    </div>
  );
}

//auxiliar de analise pra mostrar as infos das etapas anteriores
function RenderDadosAnteriores({ etapa }) {
  const { dados_solicitacao, dados_entrevista, dados_visitacao, solicitante } = etapa;

  //se for visitação data e endereço
  if (dados_visitacao) {
    return (
      <div className="p-4 bg-base-200 rounded-lg space-y-2">
        <h3 className="font-bold">Dados da Visitação</h3>
        <p><strong>Data Agendada:</strong> {new Date(dados_visitacao.data_field).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
        <p><strong>Endereço:</strong> {dados_visitacao.endereco}</p>
      </div>
    );
  }
  //entrevista data e observações
  if (dados_entrevista) {
    return (
      <div className="p-4 bg-base-200 rounded-lg space-y-2">
        <h3 className="font-bold">Dados da Entrevista</h3>
        <p><strong>Data Agendada:</strong> {new Date(dados_entrevista.data_field).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
        <p><strong>Observações:</strong> {dados_entrevista.observacoes || '(Nenhuma observação)'}</p>
      </div>
    );
  }
  //solicitação cpf, animal e comprovante de residencia
  if (dados_solicitacao) {
    return (
      <div className="p-4 bg-base-200 rounded-lg space-y-2">
        <h3 className="font-bold">Dados da Solicitação:</h3>
        <p><strong>Solicitante:</strong> {solicitante?.nome || 'N/A'}</p>
        <p><strong>Email:</strong> {solicitante?.email || 'N/A'}</p>
        <p><strong>CPF:</strong> {dados_solicitacao.cpf}</p>
        <p><strong>Animal:</strong> {dados_solicitacao.animal.nome} ({dados_solicitacao.animal.tipo})</p>
        {/*gambiarra pra conseguir abrir o comprovante*/}
        <button
          onClick={() => {
            const base64Full = dados_solicitacao?.comprovante_residencia;
            if (!base64Full) return alert("Nenhum comprovante encontrado.");
            const base64 = base64Full.split(',')[1] || base64Full;
            try {
              const byteCharacters = atob(base64);
              const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0));
              const byteArray = new Uint8Array(byteNumbers);
              const mimeType = base64Full.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg';
              const blob = new Blob([byteArray], { type: mimeType });
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank");
            } catch (error) {
              console.error("Erro ao abrir comprovante:", error);
              alert("Não foi possível abrir o comprovante.");
            }
          }}
          className="btn btn-sm btn-outline btn-secondary"
        >
          Abrir Comprovante
        </button>
      </div>
    );
  }
  return (
    <div className="p-4 bg-base-200 rounded-lg">
      <p>Nenhum dado da etapa anterior foi encontrado para esta análise.</p>
    </div>
  );
}

//APROVAÇÃO
function FormAprovacao({ etapaDetalhes }) {
  const { post, loading, error } = useApi();
  //vai pra prox ou pode até retornar pra anterior e ter um repreenchimento de algo
  const proximoPasso = etapaDetalhes.etapa_relacao.proximo;
  const passoAlternativo = etapaDetalhes.etapa_relacao.alternativo;


  //chama a api de encaminhar pra prox etapa
  const handleEncaminhar = (proximaEtapaRelacaoId, tipo) => {
    post(`${API_BASE_URL}/etapa/encaminhar/`, {
      processo_etapa_id_atual: etapaDetalhes.processo_etapa_id,
      proxima_etapa_relacao_id: proximaEtapaRelacaoId
    }, tipo);
  };

  return (
    //parte visual
    <div className="space-y-4">
      <h2 className="card-title">Formulário de Aprovação</h2>
      <p> Esta etapa é destinada à <strong>confirmação administrativa da aprovação</strong> do processo. 
        Aqui o administrador valida oficialmente se a aprovação foi favorável. 
        Ao confirmar, o processo será encaminhado para a <strong>a próxima etapa</strong>.</p>
      {error && (<div className="alert alert-error text-sm"><span>{error}</span></div>)}
      <ActionButtons
        etapaDetalhes={etapaDetalhes}
        onEncaminhar={handleEncaminhar}
        loading={loading}
        btnAlternativoClass="btn-warning btn-outline"
        labelAlternativo={passoAlternativo ? `Voltar para ${passoAlternativo.etapa.nome}` : null}
        labelProximo={proximoPasso ? `Confirmar e Encaminhar para ${proximoPasso.etapa.nome}` : null}
      />
    </div>
  );
}

//RECUSA
function FormRecusa({ etapaDetalhes }) {
  return (
    //usa o generico de submit
    <FormSubmissao
    //todas as infos da etapa desse processo
      etapaDetalhes={etapaDetalhes}
      //muda a api
      apiUrl={`${API_BASE_URL}/etapa/recusa/submit/`}
      titulo="Formulário de Recusa"
      titleClass="text-error"
      descricao="Você está recusando este processo. Por favor, insira a justificativa abaixo."
      //inicia o form unico dessa etapa
      initialState={{ justificativa: '' }}
      validate={(formData) => {
        if (!formData.justificativa) return "A justificativa é obrigatória para recusar o processo.";
        return null;
      }}
      //trnaforma e manda
      getPayload={(formData) => ({
        justificativa: formData.justificativa
      })}
      btnClass="btn-error"
      btnLabel={`Confirmar Recusa e Encaminhar para ${etapaDetalhes.etapa_relacao.proximo.etapa.nome}`}
    >
      {(formData, setFormData) => (
        <div className="form-control">
          <label className="label"><span className="label-text">Justificativa da Recusa</span></label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="Ex: O solicitante não atende aos pré-requisitos..."
            value={formData.justificativa}
            onChange={(e) => setFormData(f => ({ ...f, justificativa: e.target.value }))}
          ></textarea>
        </div>
      )}
    </FormSubmissao>
  );
}

//CONCLUSÃO (etapa genérica que não tem nada, pode ser reutilzada p criar outras etapas)
function FormEtapaGenerica({ etapaDetalhes }) {
  // Caso 1: É uma etapa de Conclusão (fim do fluxo)
  if (!etapaDetalhes.etapa_relacao.proximo) {
    //chama o form de ultimo passo
    return (
      <FormPassoFinal
        processoEtapaId={etapaDetalhes.processo_etapa_id}
        apiUrl={`${API_BASE_URL}/etapa/encaminhar/`}
        titulo="Processo Concluído!"
        descricao="Este processo foi finalizado."
        titleClass="text-success"
        btnClass="btn-success"
      />
    );
  }

  // Caso 2: É uma etapa genérica que não tem formulário (fallback)
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

//CANCELAMENTO
function FormCancelamento({ etapaDetalhes }) {
  return (
    <FormPassoFinal
      processoEtapaId={etapaDetalhes.processo_etapa_id}
      apiUrl={`${API_BASE_URL}/etapa/encaminhar/`}
      titulo="Processo Cancelado"
      descricao="Este processo foi movido para a etapa de cancelamento e está encerrado."
      titleClass="text-error"
      btnClass="btn-error"
    />
  );
}

//ENTREVISTA
function FormEntrevista({ etapaDetalhes }) {
  return (
    <FormSubmissao
      etapaDetalhes={etapaDetalhes}
      apiUrl={`${API_BASE_URL}/etapa/entrevista/submit/`}
      titulo="Formulário de Entrevista"
      descricao="Por favor, agende a data da entrevista. As observações são opcionais."
      //unico da etapa de entrevista
      initialState={{ data: '', observacoes: '' }}
      validate={(formData) => {
        if (!formData.data) return "A data é obrigatória.";
        return null;
      }}
      getPayload={(formData) => ({
        data_: formData.data,
        observacoes: formData.observacoes || null
      })}
    >
      {(formData, setFormData) => (
        <>
          <div className="form-control">
            <label className="label"><span className="label-text">Data da Entrevista</span></label>
            <input
              type="date"
              className="input input-bordered"
              value={formData.data}
              onChange={(e) => setFormData(f => ({ ...f, data: e.target.value }))}
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Observações (Opcional)</span></label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder="Ex: Entrevista online, restrição de horários..."
              value={formData.observacoes}
              onChange={(e) => setFormData(f => ({ ...f, observacoes: e.target.value }))}
            ></textarea>
          </div>
        </>
      )}
    </FormSubmissao>
  );
}

//VISITAÇÃO
function FormVisitacao({ etapaDetalhes }) {
  return (
    <FormSubmissao
      etapaDetalhes={etapaDetalhes}
      apiUrl={`${API_BASE_URL}/etapa/visitacao/submit/`}
      titulo="Formulário de Visitação"
      descricao="Por favor, agende a data e o endereço da visitação."
      //unico da etapa de visitação
      initialState={{ data: '', endereco: '' }}
      validate={(formData) => {
        if (!formData.data || !formData.endereco) return "Data e Endereço são obrigatórios.";
        return null;
      }}
      getPayload={(formData) => ({
        data_: formData.data,
        endereco: formData.endereco
      })}
    >
      {(formData, setFormData) => (
        <>
          <div className="form-control">
            <label className="label"><span className="label-text">Data da Visitação</span></label>
            <input
              type="date"
              className="input input-bordered"
              value={formData.data}
              onChange={(e) => setFormData(f => ({ ...f, data: e.target.value }))}
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Endereço da Visitação</span></label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Ex: Rua dos Bobos, 0"
              value={formData.endereco}
              onChange={(e) => setFormData(f => ({ ...f, endereco: e.target.value }))}
            />
          </div>
        </>
      )}
    </FormSubmissao>
  );
}