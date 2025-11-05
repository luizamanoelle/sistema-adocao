import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ---
// Icones simples (para os botões)
// ---
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

// ---
// O Cartão que representa um Passo do Workflow
// ---
function PassoCard({ passo, todosPassos, etapasApi, tiposUsuarioApi, onUpdate, onRemove }) {
    
    // Filtra os outros passos (não pode ser "próximo" de si mesmo)
    const outrosPassos = todosPassos.filter(p => p.tempId !== passo.tempId);

    return (
        <div className="card w-full bg-base-100 shadow-lg border border-base-300 relative">
            <div className="card-body p-6">
                
                {/* Botão de Remover */}
                <button
                    type="button"
                    className="btn btn-xs btn-circle btn-error btn-outline absolute top-2 right-2"
                    onClick={() => onRemove(passo.tempId)}
                >
                    <IconTrash />
                </button>

                {/* Nome do Passo (para o UI) */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-bold">Nome deste Passo (para identificar)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: Análise do Admin, Visita"
                        className="input input-bordered"
                        value={passo.nomePasso}
                        onChange={(e) => onUpdate(passo.tempId, 'nomePasso', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Escolha da Etapa */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Etapa (O que é?)</span></label>
                        <select
                            className="select select-bordered"
                            value={passo.etapaId}
                            onChange={(e) => onUpdate(passo.tempId, 'etapaId', e.target.value)}
                        >
                            <option value="" disabled>Selecione a etapa</option>
                            {etapasApi.map(etapa => (
                                <option key={etapa.etapa_id} value={etapa.etapa_id}>
                                    {etapa.nome} (ID: {etapa.etapa_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Escolha do Responsável */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Responsável (Quem faz?)</span></label>
                        <select
                            className="select select-bordered"
                            value={passo.responsavelId}
                            onChange={(e) => onUpdate(passo.tempId, 'responsavelId', e.target.value)}
                        >
                            <option value="" disabled>Selecione o responsável</option>
                            {tiposUsuarioApi.map(tipo => (
                                <option key={tipo.tipo_id} value={tipo.tipo_id}>
                                    {tipo.categoria} (ID: {tipo.tipo_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Escolha do Próximo Passo */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Próximo Passo (Sucesso)</span></label>
                        <select
                            className="select select-bordered"
                            value={passo.proxId || ''}
                            onChange={(e) => onUpdate(passo.tempId, 'proxId', e.target.value || null)}
                        >
                            <option value="">Nenhum (Fim do fluxo)</option>
                            {outrosPassos.map(p => (
                                <option key={p.tempId} value={p.tempId}>
                                    {p.nomePasso || 'Passo sem nome'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Escolha do Passo Alternativo */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Passo Alternativo (Ex: Recusa)</span></label>
                        <select
                            className="select select-bordered"
                            value={passo.alternativoId || ''}
                            onChange={(e) => onUpdate(passo.tempId, 'alternativoId', e.target.value || null)}
                        >
                            <option value="">Nenhum</option>
                            {outrosPassos.map(p => (
                                <option key={p.tempId} value={p.tempId}>
                                    {p.nomePasso || 'Passo sem nome'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ---
// O Componente Principal da Página
// ---
function TemplateCreator() {
    // Estado para o nome do template
    const [templateName, setTemplateName] = useState('');
    
    // Estado para a lista de passos (os cartões)
    const [passos, setPassos] = useState([]);

    // Estados para carregar dados de apoio (Etapas e Tipos de Usuário)
    const [etapasApi, setEtapasApi] = useState([]);
    const [tiposUsuarioApi, setTiposUsuarioApi] = useState([]);

    // Estados de UI (loading, erro, sucesso)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const API_BASE_URL = 'http://127.0.0.1:8000/api';

    // Efeito para buscar os dados de apoio ao carregar a página
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

    // ---
    // Funções de CRUD para os Passos
    // ---

    // Adiciona um novo cartão de passo vazio
    const handleAddPasso = () => {
        const newPasso = {
            tempId: crypto.randomUUID(), // ID temporário do React
            nomePasso: 'Novo Passo',
            etapaId: '',
            responsavelId: '',
            proxId: null,
            alternativoId: null,
        };
        // Se for o primeiro passo, define-o como etapa "Solicitação" e responsável "Adotante"
        if(passos.length === 0) {
            newPasso.nomePasso = 'Início (Solicitação)';
            newPasso.etapaId = '1'; // Presume que 1 é "Solicitação"
            newPasso.responsavelId = '2'; // Presume que 2 é "Adotante"
        }

        setPassos([...passos, newPasso]);
    };

    // Remove um cartão de passo
    const handleRemovePasso = (tempId) => {
        // Remove o passo
        const novosPassos = passos.filter(p => p.tempId !== tempId);
        
        // Limpa referências a este passo (prox/alternativo) noutros passos
        const passosAtualizados = novosPassos.map(p => {
            if (p.proxId === tempId) p.proxId = null;
            if (p.alternativoId === tempId) p.alternativoId = null;
            return p;
        });
        
        setPassos(passosAtualizados);
    };

    // Atualiza um campo num cartão de passo
    const handleUpdatePasso = (tempId, field, value) => {
        setPassos(passos.map(p => 
            p.tempId === tempId ? { ...p, [field]: value } : p
        ));
    };


    // ---
    // Função de Submissão (Magia Acontece Aqui)
    // ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // 1. Validação básica
        if (passos.length === 0) {
            setError("Adicione pelo menos um passo ao fluxo.");
            setLoading(false);
            return;
        }

        // 2. Transformação: Converte os passos (com UUIDs) para o JSON (com IDs 1, 2, 3...)
        // que a procedure do backend espera.
        
        let jsonParaBackend = [];
        // O `idMap` traduz o UUID do React para o ID inteiro da procedure
        const idMap = new Map(); // Key: uuid, Value: int (1, 2, 3...)

        // Primeira passagem: Criar o mapa e o JSON básico
        // A procedure exige que o primeiro passo tenha tempId = 1
        
        // Garante que o primeiro passo da lista é o ID 1
        const primeiroPasso = passos[0];
        const outrosPassos = passos.slice(1);

        // Adiciona o primeiro passo
        idMap.set(primeiroPasso.tempId, 1);
        jsonParaBackend.push({
            tempId: 1,
            etapa: parseInt(primeiroPasso.etapaId),
            responsavel: parseInt(primeiroPasso.responsavelId),
            // prox e alternativo serão preenchidos na segunda passagem
        });

        // Adiciona os outros passos
        outrosPassos.forEach((passo, index) => {
            const intTempId = index + 2; // Começa do 2
            idMap.set(passo.tempId, intTempId);
            jsonParaBackend.push({
                tempId: intTempId,
                etapa: parseInt(passo.etapaId),
                responsavel: parseInt(passo.responsavelId),
            });
        });

        // Segunda passagem: Preencher os campos 'prox' e 'alternativo'
        passos.forEach(passo => {
            const intTempId = idMap.get(passo.tempId);
            const intProx = idMap.get(passo.proxId) || null;
            const intAlt = idMap.get(passo.alternativoId) || null;

            // Encontra o objeto correspondente no JSON final
            const jsonPasso = jsonParaBackend.find(p => p.tempId === intTempId);
            if (jsonPasso) {
                jsonPasso.prox = intProx;
                jsonPasso.alternativo = intAlt;
            }
        });

        // 3. Enviar para a API
        try {
            const response = await axios.post(`${API_BASE_URL}/templates/create/`, {
                nome: templateName,
                fluxo_json: jsonParaBackend
            });
            
            setSuccess(`Template "${response.data.nome}" (ID: ${response.data.template_id}) criado com sucesso!`);
            setTemplateName('');
            setPassos([]); // Limpa o formulário

        } catch (err) {
            console.error("Erro ao criar template:", err);
            const apiError = err.response?.data?.error || "Ocorreu um erro desconhecido.";
            setError(`Falha ao criar template: ${apiError}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-6">Criar Novo Template</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Nome do Template */}
                <div className="card w-full bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body">
                        <h2 className="card-title">1. Nome do Template</h2>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Dê um nome para este fluxo de trabalho.</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Adoção Padrão, Adoção Gatos"
                                className="input input-bordered w-full"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Construtor de Fluxo */}
                <div className="card w-full bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body">
                        <h2 className="card-title">2. Fluxo de Etapas</h2>
                        <p className="text-sm text-base-content/70">
                            Adicione os passos do fluxo. O primeiro passo da lista (ID 1) será o início.
                        </p>
                        
                        {/* Lista de Cartões de Passos */}
                        <div className="space-y-6 mt-4">
                            {passos.length === 0 && (
                                <div className="text-center p-4 border border-dashed rounded-lg">
                                    Nenhum passo adicionado.
                                </div>
                            )}
                            {passos.map((passo, index) => (
                                <div key={passo.tempId}>
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-primary badge-lg font-bold">
                                            ID: {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            {/* O primeiro passo não pode ser removido */}
                                            <PassoCard
                                                passo={passo}
                                                todosPassos={passos}
                                                etapasApi={etapasApi}
                                                tiposUsuarioApi={tiposUsuarioApi}
                                                onUpdate={handleUpdatePasso}
                                                onRemove={index === 0 ? () => {} : handleRemovePasso}
                                            />
                                        </div>
                                    </div>
                                    {/* Linha conectora (visual) */}
                                    {index < passos.length - 1 && (
                                        <div className="h-8 w-1 bg-base-300 mx-auto"></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Botão de Adicionar Passo */}
                        <div className="card-actions justify-center mt-6">
                            <button
                                type="button"
                                className="btn btn-outline btn-primary"
                                onClick={handleAddPasso}
                            >
                                <IconPlus />
                                Adicionar Passo
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Submissão */}
                <div className="space-y-4">
                    {/* Mensagens de Sucesso e Erro */}
                    {success && (
                        <div role="alert" className="alert alert-success"><span>{success}</span></div>
                    )}
                    {error && (
                        <div role="alert" className="alert alert-error"><span>{error}</span></div>
                    )}

                    {/* Botão de Submissão */}
                    <div className="form-control">
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading || !templateName || passos.length === 0}
                        >
                            {loading ? <span className="loading loading-spinner"></span> : "Salvar Template Completo"}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}

export default TemplateCreator;