import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Pets() {
    // estado para guardar a lista de pets vinda da API
    const [pets, setPets] = useState([]);
    
    // estado para controlar o spinner de carregamento
    const [loading, setLoading] = useState(true);
    
    // estado para guardar qualquer erro da API
    const [error, setError] = useState(null);

    // useEffect é usado para buscar os dados assim que o componente é montado
    useEffect(() => {
        // URL da sua API Django 
        const API_URL = 'http://127.0.0.1:8000/api/animais/';

        const fetchPets = async () => {
            try {
                // tenta buscar os dados da API
                const response = await axios.get(API_URL);
                // salva os dados no estado 'pets'
                setPets(response.data);
            } catch (err) {
                // em caso de erro, salva a mensagem no estado 'error'
                console.error("Erro ao buscar os pets:", err);
                setError("Não foi possível carregar os pets. Tente novamente mais tarde.");
            } finally {
                // independentemente de sucesso ou erro, para de carregar
                setLoading(false);
            }
        };

        //chama a função de busca
        fetchPets();

    }, []); // o array vazio [] significa que este efeito roda apenas uma vez

    // renderização do estado de carregamento (a bolinha na tela)
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    // renderização do estado de erro
    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div role="alert" className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2.618A2.99 2.99 0 0116 15.118V19.5a3 3 0 11-6 0v-4.382a2.99 2.99 0 01-1.171-5.223L6.5 8.118a3 3 0 115.196-3.042l1.131 2.262a2.99 2.99 0 015.172 0l1.131-2.262a3 3 0 115.196 3.042l-1.329 2.659a2.99 2.99 0 01-1.171 5.223z" /></svg>
                    <span>{error}</span>
                </div>
            </div>
        );
    }
    
    // renderização de estado vazio (quando ta sem animais cadastrados no banco)
    if (pets.length === 0) {
        return (
             <div className="container mx-auto p-4">
                <div role="alert" className="alert alert-info">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Nenhum pet encontrado para adoção no momento.</span>
                </div>
            </div>
        );
    }

    // renderização com os pets cadastrados
    return (
        <div className="bg-base-100 min-h-screen p-8">
            <div className="container mx-auto">
                <h1 className="text-4xl font-bold text-center mb-10 text-primary">
                    Conheça nossos amigos
                </h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    
                    {/* Faz um loop em cada pet e cria um card */}
                    {pets.map((pet) => (
                        <div key={pet.animal_id} className="card w-full bg-base-100 shadow-xl transition-transform duration-300 hover:scale-105">
                            <figure className="h-60">
                                <img 
                                    // usa o campo 'foto' do seu modelo
                                    src={pet.foto} 
                                    alt={pet.nome}
                                    className="h-full w-full object-cover" 
                                    // adiciona um fallback simples em caso de erro na imagem
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x300/F0F0F0/AAA?text=Pet'; }}
                                />
                            </figure>
                            <div className="card-body">
                                <h2 className="card-title">
                                    {pet.nome || "Sem nome"}
                                    {/* Usa o campo 'tipo' (Cachorro/Gato) */}
                                    <div className="badge badge-primary">{pet.tipo}</div>
                                </h2>
                                
                                <div className="card-actions justify-start mt-2">
                                    {/* Usa o campo 'idade' */}
                                    <div className="badge badge-outline">
                                        {pet.idade ? `${pet.idade} anos` : 'Idade desconhecida'}
                                    </div>
                                    
                                    {/* Usa o campo 'sexo' com uma formatação amigável */}
                                    <div className="badge badge-outline">
                                        {pet.sexo === 'M' ? 'Macho' : (pet.sexo === 'F' ? 'Fêmea' : 'Sexo desconhecido')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))} 
                </div>
            </div>
        </div>
    );
}

export default Pets;
