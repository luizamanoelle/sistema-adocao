import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- ÍCONES ---
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.54 0c.342.052.682.107 1.022.166m11.518 0a48.108 48.108 0 01-3.478-.397m-12.54 0a48.094 48.094 0 013.478-.397m9.064 0a48.1 48.1 0 00-3.478-.397M4.772 5.79L4.772 5.79m0 0a2.25 2.25 0 012.244-2.077H16.98a2.25 2.25 0 012.244 2.077L4.772 5.79z" />
  </svg>
);

// --- COMPONENTE DE CADA PASSO (ATUALIZADO) ---
function PassoCard({ passo, index, todosPassos, etapasApi, tiposUsuarioApi, onUpdate, onRemove }) {
  // Lista de todos os passos *exceto* o atual, para usar nos dropdowns
  const outrosPassos = todosPassos.filter(p => p.tempId !== passo.tempId);

  // Função para encontrar o ID de exibição (1, 2, 3...) de um passo
  const getDisplayId = (tempId) => {
    const passoIndex = todosPassos.findIndex(p => p.tempId === tempId);
    return passoIndex + 1;
  };

  return (
    <div className="card w-full bg-base-100 shadow-lg border border-base-300 relative">
      <div className="card-body p-6">
        <button
          type="button"
          className={`btn btn-xs btn-circle btn-error btn-outline absolute top-2 right-2 ${index === 0 ? 'hidden' : ''}`}
          onClick={() => onRemove(passo.tempId)}
        >
          <IconTrash />
        </button>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">Nome deste Passo</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Análise, Visita"
            className="input input-bordered"
            value={passo.nomePasso}
            onChange={(e) => onUpdate(passo.tempId, 'nomePasso', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Etapa */}
          <div className="form-control">
            <label className="label"><span className="label-text">Etapa</span></label>
            <select
              className={`select select-bordered ${!passo.etapaId ? 'select-error' : ''}`}
              value={passo.etapaId}
              onChange={(e) => onUpdate(passo.tempId, 'etapaId', e.target.value)}
              disabled={index === 0}
            >
              <option value="" disabled>Selecione</option>
              {etapasApi.map(etapa => (
                <option key={etapa.etapa_id} value={etapa.etapa_id}>{etapa.nome}</option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div className="form-control">
            <label className="label"><span className="label-text">Responsável</span></label>
            <select
              className={`select select-bordered ${!passo.responsavelId ? 'select-error' : ''}`}
              value={passo.responsavelId}
              onChange={(e) => onUpdate(passo.tempId, 'responsavelId', e.target.value)}
              disabled={index === 0}
            >
              <option value="" disabled>Selecione</option>
              {tiposUsuarioApi.map(tipo => (
                <option key={tipo.tipo_id} value={tipo.tipo_id}>{tipo.categoria}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- INÍCIO DA ATUALIZAÇÃO (FLUXO) --- */}
        <div className="divider">Fluxo</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Próximo Passo */}
          <div className="form-control">
            <label className="label"><span className="label-text">Próximo Passo</span></label>
            <select
              className="select select-bordered"
              value={passo.proxId || ''}
              onChange={(e) => onUpdate(passo.tempId, 'proxId', e.target.value || null)}
            >
              <option value="">Nenhum (Fim do Fluxo)</option>
              {outrosPassos.map(p => (
                <option key={p.tempId} value={p.tempId}>
                  Passo {getDisplayId(p.tempId)}: {p.nomePasso}
                </option>
              ))}
            </select>
          </div>

          {/* Passo Alternativo */}
          <div className="form-control">
            <label className="label"><span className="label-text">Passo Alternativo</span></label>
            <select
              className="select select-bordered"
              value={passo.alternativoId || ''}
              onChange={(e) => onUpdate(passo.tempId, 'alternativoId', e.target.value || null)}
            >
              <option value="">Nenhum (Sem Alternativa)</option>
              {outrosPassos.map(p => (
                <option key={p.tempId} value={p.tempId}>
                  Passo {getDisplayId(p.tempId)}: {p.nomePasso}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* --- FIM DA ATUALIZAÇÃO --- */}

      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
function TemplateCreator() {
  const [templateName, setTemplateName] = useState('');
  const [passos, setPassos] = useState([]);
  const [etapasApi, setEtapasApi] = useState([]);
  const [tiposUsuarioApi, setTiposUsuarioApi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [debugJson, setDebugJson] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [etapasRes, tiposRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/etapas/`),
          axios.get(`${API_BASE_URL}/tipos-usuario/`)
        ]);
        setEtapasApi(etapasRes.data);
        setTiposUsuarioApi(tiposRes.data);
      } catch (err) {
        console.error("Erro ao buscar dados de apoio:", err);
        setError("Não foi possível carregar os dados de apoio. Recarregue a página.");
      }
    };
    fetchData();
  }, []);

  // Adicionar e remover passos
  const handleAddPasso = () => {
    const newPasso = {
      tempId: crypto.randomUUID(),
      nomePasso: 'Novo Passo',
      etapaId: '',
      responsavelId: '',
      proxId: null, // Controlado pelo novo dropdown
      alternativoId: null, // Controlado pelo novo dropdown
    };
    if (passos.length === 0) {
      newPasso.nomePasso = 'Início (Solicitação)';
      newPasso.etapaId = '1'; // Ex: ID '1' é 'Solicitação'
      newPasso.responsavelId = '2'; // Ex: ID '2' é 'Solicitante'
    }
    setPassos([...passos, newPasso]);
  };

  const handleRemovePasso = (tempId) => {
    const novosPassos = passos.filter(p => p.tempId !== tempId);
    // Limpa referências a este passo que foi excluído
    const passosAtualizados = novosPassos.map(p => {
      if (p.proxId === tempId) p.proxId = null;
      if (p.alternativoId === tempId) p.alternativoId = null;
      return p;
    });
    setPassos(passosAtualizados);
  };

  const handleUpdatePasso = (tempId, field, value) => {
    setPassos(passos.map(p => p.tempId === tempId ? { ...p, [field]: value } : p));
  };

  // --- SUBMISSÃO (ATUALIZADA) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setDebugJson('');

    if (!templateName.trim()) {
      setError("O nome do template é obrigatório.");
      setLoading(false);
      return;
    }

    if (passos.length === 0) {
      setError("Adicione pelo menos um passo ao fluxo.");
      setLoading(false);
      return;
    }

    // Validação de campos
    for (const [index, passo] of passos.entries()) {
      if (!passo.etapaId || !passo.responsavelId) {
        setError(`O Passo ID ${index + 1} ("${passo.nomePasso}") está incompleto (falta Etapa ou Responsável).`);
        setLoading(false);
        return;
      }
    }

    // --- GERAÇÃO DO JSON CORRIGIDA ---

    // 1. O backend espera IDs sequenciais (1, 2, 3...), mas o frontend usa
    //    UUIDs (em passo.tempId) para gerenciar o estado.
    //    Este 'Map' faz a tradução de UUID -> ID Sequencial.
    const uuidParaTempId = new Map();
    passos.forEach((passo, index) => {
      uuidParaTempId.set(passo.tempId, index + 1);
    });

    // 2. Mapeamos os passos para o formato final
    const jsonParaBackend = passos.map((passo, index) => {
      // Usamos o 'Map' para encontrar o ID sequencial correspondente
      // ao UUID que está salvo em 'proxId' e 'alternativoId'
      const proxTempId = passo.proxId ? (uuidParaTempId.get(passo.proxId) || null) : null;
      const alternativoTempId = passo.alternativoId ? (uuidParaTempId.get(passo.alternativoId) || null) : null;

      // Retorna o objeto na ORDEM de chaves que você especificou
      return {
        tempId: index + 1, // O ID sequencial deste passo
        prox: proxTempId,
        alternativo: alternativoTempId,
        etapa: parseInt(passo.etapaId),
        responsavel: parseInt(passo.responsavelId)
      };
    });
    // --- FIM DA ALTERAÇÃO ---


    console.log("JSON Gerado para enviar:", jsonParaBackend);
    setDebugJson(JSON.stringify(jsonParaBackend, null, 2));

    try {
      const response = await axios.post(`${API_BASE_URL}/templates/create/`, {
        nome: templateName,
        fluxo_json: jsonParaBackend
      });

      setSuccess(`Template "${response.data.nome}" (ID: ${response.data.template_id}) criado com sucesso!`);
      setTemplateName('');
      setPassos([]);
    } catch (err) {
      console.error("Erro ao criar template:", err);
      const apiError = err.response?.data?.error || "Ocorreu um erro desconhecido.";
      setError(`Falha ao criar template: ${apiError}`);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Criar Novo Template</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Nome */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title">1. Nome do Template</h2>
            <input
              type="text"
              placeholder="Ex: Adoção Padrão"
              className={`input input-bordered w-full ${!templateName && error ? 'input-error' : ''}`}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
        </div>

        {/* Passos */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title">2. Fluxo de Etapas</h2>
            <div className="space-y-6 mt-4">
              {passos.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-lg">Nenhum passo adicionado.</div>
              )}
              {passos.map((passo, index) => (
                <div key={passo.tempId}>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary badge-lg font-bold">ID: {index + 1}</span>
                    <div className="flex-1">
                      <PassoCard
                        passo={passo}
                        index={index}
                        todosPassos={passos}
                        etapasApi={etapasApi}
                        tiposUsuarioApi={tiposUsuarioApi}
                        onUpdate={handleUpdatePasso}
                        onRemove={handleRemovePasso}
                      />
                    </div>
                  </div>
                  {index < passos.length - 1 && <div className="h-8 w-1 bg-base-300 mx-auto"></div>}
                </div>
              ))}
            </div>

            <div className="card-actions justify-center mt-6">
              <button type="button" className="btn btn-outline btn-primary" onClick={handleAddPasso}>
                <IconPlus /> Adicionar Passo
              </button>
            </div>
          </div>
        </div>

        {/* Mensagens e Envio */}
        <div className="space-y-4">
          {success && <div className="alert alert-success"><span>{success}</span></div>}
          {error && <div className="alert alert-error"><span>{error}</span></div>}

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner"></span> : "Salvar Template Completo"}
          </button>
        </div>
      </form>

      {/* Debug JSON */}
      {debugJson && (
        <div className="card bg-base-300 shadow-inner mt-8">
          <div className="card-body">
            <h3 className="card-title">JSON Gerado (Debug)</h3>
            <pre className="text-xs bg-base-100 p-4 rounded-lg overflow-x-auto mt-2">{debugJson}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateCreator;