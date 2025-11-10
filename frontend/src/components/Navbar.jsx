import { Link } from "react-router-dom";

//recebe 'user' e 'onLogout' vindos do App.jsx
export default function Navbar({ user, onLogout }) {
  
  //verificar se o usuário é Admin (ID 1)
  const isAdmin = user?.tipo_usuario === 1;
  
  const linkStyle = "px-4 py-2 !rounded-lg hover:!bg-primary hover:!text-white transition-colors";

  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <a>
          <img src="/logo.png" alt="Logo" className="w-15 h-15" />
        </a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          
          {/* links c botao custom bonitinho*/}
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
          
          {/* só aparece quando logado */}
          {user && (
            <li>
              <Link to="/servicos" className={linkStyle}>
                Serviços
              </Link>
            </li>
          )}
          {/* só aparece quando logado */}
          {user && (
            <li>
              <Link to="/meus-processos" className={linkStyle}>
                Meus Processos
              </Link>
            </li>
          )}
          {/* só aparece pra admin*/}
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