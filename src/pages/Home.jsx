// src/pages/Home.jsx
import { Link } from "react-router-dom"; 

export default function Home() {
  return (
    //imagem de background
    <div
      className="min-h-screen flex justify-end items-end bg-cover bg-center p-4"
      style={{ backgroundImage: "url(/home2.png)" }}
    >
      {/* card */}
      <div className="card w-full max-w-md bg-opacity-100 
                   absolute bottom-40 right-40">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-2xl font-bold text-primary">
            Bem-vindo ao PetFlow
          </h1>
          <p className="text-sm text-gray-700 py-4">
            Somos um sistema focado em gerenciar e
            simplificar o processo de adoção, acompanhando você desde a
            solicitação até a aprovação.
          </p>

          {/* Botão */}
          <Link to="/pets" className="btn btn-primary my">
            Pets
          </Link>
        </div>
      </div>
    </div>
  );
}