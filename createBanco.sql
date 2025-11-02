create database sistema_adocao;
use sistema_adocao;

create table Animais(
	animal_id INT PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255),
    sexo char(1),
    idade int,
	foto blob,
    tipo varchar(10)
);

create table Etapas(
	etapa_id INT PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255)
);

create table Template (
	template_id INT PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255)
);


create table Tipo_Usuario (
	tipo_id INT PRIMARY KEY AUTO_INCREMENT,
	categoria enum('Adotante', 'Administrador', 'voluntário')
);

create table Usuarios (
	usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255),
    idade int,
    email varchar(255),
    senha varchar(255),
    tipo_usuario int,
    FOREIGN KEY (tipo_usuario) REFERENCES Tipo_Usuario (tipo_id)
);


CREATE TABLE Etapa_Relacao (
	etapa_relacao_id INT PRIMARY KEY AUTO_INCREMENT,
    template INT NOT NULL,
    etapa INT NOT NULL,
    responsavel INT NOT NULL,
    proximo INT,
    alternativo INT,
    FOREIGN KEY (template) REFERENCES Template(template_id),
    FOREIGN KEY (etapa) REFERENCES Etapas(etapa_id),
    FOREIGN KEY (responsavel) REFERENCES Tipo_Usuario(tipo_id),
    FOREIGN KEY (proximo) REFERENCES Etapa_Relacao(etapa_relacao_id),
    FOREIGN KEY (alternativo) REFERENCES Etapa_Relacao(etapa_relacao_id)
);



create table Processo (
	processo_id int primary key auto_increment,
    template int NOT NULL,
    usuario int NOT NULL,
	status_ varchar(255) not null,
	FOREIGN KEY (template) REFERENCES Template(template_id),
	FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id)
);


create table Processo_Etapa(
	processo_etapa_id INT PRIMARY KEY AUTO_INCREMENT,
    processo int not null,
    etapa_relacao int not null,
    status_ varchar(255) not null,
    usuario int not null,
	FOREIGN KEY (processo) REFERENCES Processo(processo_id) ON DELETE CASCADE, 
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id),
	FOREIGN KEY (etapa_relacao) REFERENCES Etapa_Relacao (etapa_relacao_id)
);


create table solicitacao (
	solicitacao_id INT PRIMARY KEY AUTO_INCREMENT,
    processo_etapa int not null,
    cpf varchar(255) not null,
    animal int not null,
    comprovante_residencia blob,
    FOREIGN KEY (animal) REFERENCES Animais (animal_id),
    FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);

create table visitacao (
	visitacao_id INT PRIMARY KEY AUTO_INCREMENT,
    data_ DATE not null,
    endereco varchar(255) not null,
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);

create table entrevista (
	entrevista_id INT PRIMARY KEY AUTO_INCREMENT,
    data_ DATE not null,
    observacoes varchar(255),
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);

create table recusa (
	recusa_id INT PRIMARY KEY AUTO_INCREMENT,
    justificativa varchar(255),
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);


create table validacao (
	validacao_id INT PRIMARY KEY AUTO_INCREMENT,
    descricao varchar(255),
    etapa_relacao int not null,
	FOREIGN KEY (etapa_relacao) REFERENCES Etapa_Relacao (etapa_relacao_id)
);

