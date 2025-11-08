import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Recebe 'onLogin' do App.jsx
function Login({ onLogin }) { 
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    //aqui ele conecta c a api de login
    try {
      const response = await axios.post(`${API_BASE_URL}/login/`, {
        email,
        senha,
      });

      // Chama a função do App.jsx para atualizar o estado global
      onLogin(response.data);
      // (O App.jsx vai cuidar do redirecionamento)
    } catch (err) {
      console.error("Erro no login:", err);
      const apiError = err.response?.data?.error || "Erro de conexão.";
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  // visualmente
  return (
    <div className="hero">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="text-center lg:text-left lg:pl-10">
          <h1 className="text-5xl font-bold">Login</h1>
          <p className="py-6">Acesse o sistema PetFlow para iniciar ou gerenciar processos de adoção.</p>
        </div>
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              {/*pega o email*/}
              <input
                type="email"
                placeholder="email@exemplo.com"
                className="input input-bordered"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Senha</span>
              </label>
              {/*pega a senha*/}
              <input
                type="password"
                placeholder="senha"
                className="input input-bordered"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="alert alert-error text-sm p-2">
                <span>{error}</span>
              </div>
            )}
            
            <div className="form-control mt-6">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="loading loading-spinner"></span> : "Entrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;