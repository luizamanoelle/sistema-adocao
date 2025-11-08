import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import React, { useState } from 'react';

// importa as paginas
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Pets from "./pages/Pets";
import TemplateCreator from "./pages/TemplateCreator";
import Servicos from "./pages/Servicos"; 
import Login from "./pages/Login";     
import ProcessoEtapaPage from "./pages/ProcessoEtapaPage";
import MeusProcessosPage from "./pages/MeusProcessosPage"; 

//Componente "Protegido"
//Verifica se o usuário está logado. Se estiver, mostra a página.
// Se não, redireciona para a página de login.
function ProtectedRoute({ user, children }) {
  if (!user) {
    // Usuário não logado, redireciona para /login
    return <Navigate to="/login" replace />;
  }
  // Usuário logado, renderiza a página solicitada
  return children;
}

 //Adiciona o container (margens laterais e largura máxima)
 //para páginas que não são de "tela cheia".
function PageLayout({ children }) {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      {children}
    </div>
  );
}

// Conteúdo Principal do App
function AppContent() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate(); // Hook para redirecionar

  const handleLogin = (userData) => {
    setLoggedInUser(userData);
    // Redireciona para a página de serviços após o login
    navigate("/servicos"); 
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    // Redireciona para a home após o logout
    navigate("/"); 
  };

  return (
    <>
      <Navbar user={loggedInUser} onLogout={handleLogout} />
      <Routes>
        {/* --- Rotas Públicas Full-Width (Sem PageLayout) --- */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* --- Rotas Públicas "Contidas" (Com PageLayout) --- */}
        <Route 
          path="/pets" 
          element={<PageLayout><Pets /></PageLayout>} 
        />
        <Route
          path="/login"
          element={
            !loggedInUser ? (
              <PageLayout><Login onLogin={handleLogin} /></PageLayout>
            ) : (
              // Se já logado, não deixa ir para /login, vai para /servicos
              <Navigate to="/servicos" replace />
            )
          }
        />

        {/* --- Rotas Protegidas "Contidas" (Com PageLayout) --- */}
        <Route
          path="/servicos"
          element={
            <ProtectedRoute user={loggedInUser}>
              <PageLayout>
                <Servicos loggedInUser={loggedInUser} />
              </PageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-template"
          element={
            <ProtectedRoute user={loggedInUser}>
              {/* Verifica se o usuário é Admin (ID 1) */}
              {loggedInUser?.tipo_usuario === 1 ? (
                <PageLayout>
                  <TemplateCreator />
                </PageLayout>
              ) : (
                // Se não for admin, redireciona
                <Navigate to="/servicos" replace />
              )}
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/processo/etapa/:etapaId"
          element={
            <ProtectedRoute user={loggedInUser}>
              <PageLayout>
                {/* Passa o usuário para a página de etapa */}
                <ProcessoEtapaPage loggedInUser={loggedInUser} /> 
              </PageLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/meus-processos"
          element={
            <ProtectedRoute user={loggedInUser}>
              <PageLayout>
                <MeusProcessosPage loggedInUser={loggedInUser} />
              </PageLayout>
            </ProtectedRoute>
          }
          />
        
        {/* Rota "Não encontrada" */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}