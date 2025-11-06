import { Link } from "react-router-dom";

// 1. Recebe 'user' e 'onLogout' vindos do App.jsx
export default function Navbar({ user, onLogout }) {
  
  // Helper para verificar se o usuário é Admin (ID 1)
  const isAdmin = user?.tipo_usuario === 1;

  // Sua classe de estilo customizada
  const linkStyle = "px-4 py-2 !rounded-lg hover:!bg-primary hover:!text-white transition-colors";

  return (
    // 2. Removido 'rounded-box' e 'bg-base-300', voltando para 'bg-base-100 shadow-sm'
    // Mantive 'sticky' para uma boa experiência de usuário
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
          </label>
          {/* Menu Dropdown (Mobile) - com links condicionais */}
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/pets">Pets</Link></li>
            {user && <li><Link to="/servicos">Serviços</Link></li>}
            {isAdmin && (
              <li><Link to="/create-template" className="text-primary">Criar Template</Link></li>
            )}
          </ul>
        </div>
        
        {/* 1. Logo não clicável (tag 'a' sem href) e com suas classes originais */}
        <a>
          <img src="/logo.png" alt="Logo" className="w-15 h-15" />
        </a>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          
          {/* 3. Links com seu estilo customizado */}
          <li>
            <Link to="/" className={linkStyle}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className={linkStyle}>
              About
            </Link>
          </li>
          <li>
            <Link to="/pets" className={linkStyle}>
              Pets
            </Link>
          </li>
          
          {/* Links condicionais com seu estilo customizado */}
          {user && (
            <li>
              <Link to="/servicos" className={linkStyle}>
                Serviços
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link to="/create-template" className={linkStyle}>
                Criar Template
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="navbar-end">
        {/* 4. Lógica de Login/Logout (inalterada) */}
        {user ? (
          // Se está LOGADO: Mostra info do usuário e botão "Sair"
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="font-bold">{user.nome}</div>
              <div className="text-xs opacity-70">{user.tipo_usuario_detalhes.categoria}</div>
            </div>
            <button className="btn btn-outline btn-error btn-sm" onClick={onLogout}>
              Sair
            </button>
          </div>
        ) : (
          // Se está DESLOGADO: Mostra botão "Login"
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}