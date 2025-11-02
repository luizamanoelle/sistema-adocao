import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        <a>
          <img src="/logo.png" alt="Logo" className="w-15 h-15" />
        </a>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          
          {/* Adicione o '!' para forçar seus estilos a 
            sobrescrever os padrões do .menu 
          */}
          
          <li>
            <Link
              to="/"
              className="px-4 py-2 !rounded-lg hover:!bg-primary hover:!text-white transition-colors"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="px-4 py-2 !rounded-lg hover:!bg-primary hover:!text-white transition-colors"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/pets"
              className="px-4 py-2 !rounded-lg hover:!bg-primary hover:!text-white transition-colors"
            >
              Pets
            </Link>
          </li>
          <li>
            <details>
              <summary
                className="px-4 py-2 !rounded-lg hover:!bg-primary hover:!text-white transition-colors"
              >
                Serviços
              </summary>
              <ul className="p-2 bg-base-100 rounded-box">
                {/* Aqui dentro não precisa do '!', pois 
                  eles não estão *diretamente* dentro do .menu 
                */}
                <li><a className="hover:bg-primary hover:text-white rounded-lg">Adotar Cão</a></li>
                <li><a className="hover:bg-primary hover:text-white rounded-lg">Adotar Gato</a></li>
                <li><a className="hover:bg-primary hover:text-white rounded-lg">Lar Temporário</a></li>
              </ul>
            </details>
          </li>
        </ul>
      </div>

      <div className="navbar-end">
        <a className="btn btn-primary">Login</a>
      </div>
    </div>
  );
}