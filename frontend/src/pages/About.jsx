import { Link } from "react-router-dom"; 

export default function About() {
  return (
    // imagem de background
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center p-4 relative"
      style={{ backgroundImage: "url(/about.png)" }}
    >
      {/** textos em card separados pra conseguir deixar mais bonito na tela**/}
      <div className="card w-full max-w-2xl p-6 absolute bottom-60 right-250">
        <div className="card-body text-center">

          <p className="text-sxl text-gray-700 mb-4">
            O <strong>Petflow</strong> é o sistema desenvolvido como trabalho final da disciplina de 
            <strong> Projeto e Gerência de Banco de Dados</strong>, ministrada pelo professor 
            <strong> Sérgio Mergen</strong> na <strong>UFSM</strong>.
          </p>

          <p className="text-sm text-gray-700 mb-4">
            No caso do Petflow, o tema escolhido foi <strong>adoção de animais</strong>, onde o sistema 
            simula o fluxo de etapas de um processo de adoção, desde a solicitação até a aprovação.
          </p>

          <p className="text-sm text-gray-700 mb-4">
            O objetivo deste projeto é aplicar os conceitos de <strong>modelagem e arquitetura de banco de dados</strong> 
             no desenvolvimento de um sistema de <strong>workflow</strong>, que permita o controle de etapas e fluxos de um processo.
          </p>

          <p className="text-sm text-gray-700 mb-4">
            Durante o desenvolvimento, foram utilizados:
          </p>

          <ul className="text-sm text-gray-700 text-left mb-4 list-disc list-inside">
            <li><strong>Frontend:</strong> React com Vite, TailwindCSS e DaisyUI</li>
            <li><strong>Backend:</strong> (a definir)</li>
            <li><strong>Banco de Dados:</strong> MySQL</li>
          </ul>

          <p className="text-sm text-gray-700">
            O projeto tem como foco principal a <strong>integração entre o sistema e o banco de dados</strong>,
            incluindo operações de consulta, inserção e atualização, bem como o 
            <strong> projeto lógico e físico das tabelas</strong> que sustentam o funcionamento do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
