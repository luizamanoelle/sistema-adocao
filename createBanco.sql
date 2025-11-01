create database sistema_adocao;
use sistema_adocao;

create table Animais(
	animal_id INT PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255),
    sexo char(1),
    idade int,
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
    template_id INT NOT NULL,
    etapa_id INT NOT NULL,
    ordem INT NOT NULL,
    responsavel INT NOT NULL,
    PRIMARY KEY (template_id, etapa_id, ordem), 
    FOREIGN KEY (template_id) REFERENCES Template(template_id),
    FOREIGN KEY (etapa_id) REFERENCES Etapas(etapa_id),
    FOREIGN KEY (responsavel) REFERENCES Tipo_Usuario(tipo_id)
);



create table Processo (
	processo_id int primary key auto_increment,
    template int NOT NULL,
    usuario int NOT NULL,
	FOREIGN KEY (template) REFERENCES Template(template_id),
	FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id)
);


create table Processo_Etapa(
	processo_etapa_id INT PRIMARY KEY AUTO_INCREMENT,
    processo int not null,
    template int not null,
    etapa int not null,
    ordem int not null,
    status_ varchar(255) not null,
    usuario int not null,
	FOREIGN KEY (processo) REFERENCES Processo(processo_id), 
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id),
	FOREIGN KEY (template, etapa, ordem) 
    REFERENCES Etapa_Relacao (template_id, etapa_id, ordem)
);


create table solicitacao (
	solicitacao_id INT PRIMARY KEY AUTO_INCREMENT,
    processo_etapa int not null,
    cpf varchar(255) not null,
    animal int not null,
    comprovante_residencia blob,
    FOREIGN KEY (animal) REFERENCES Animais (animal_id),
    FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id)
);

create table visitacao (
	visitacao_id INT PRIMARY KEY AUTO_INCREMENT,
    data_ DATE not null,
    endereco varchar(255) not null,
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id)
);

create table entrevista (
	entrevista_id INT PRIMARY KEY AUTO_INCREMENT,
    data_ DATE not null,
    observacoes varchar(255),
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id)
);

create table recusa (
	recusa_id INT PRIMARY KEY AUTO_INCREMENT,
    justificativa varchar(255),
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id)
);


create table validacao (
	validacao_id INT PRIMARY KEY AUTO_INCREMENT,
    descricao varchar(255),
    template int not null,
    etapa int not null,
    ordem int not null,
	FOREIGN KEY (template, etapa, ordem) 
    REFERENCES Etapa_Relacao (template_id, etapa_id, ordem)
);


