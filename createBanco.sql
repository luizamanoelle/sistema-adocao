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
    responsavel INT,
    PRIMARY KEY (template_id, etapa_id, ordem), 
    FOREIGN KEY (template_id) REFERENCES Template(template_id),
    FOREIGN KEY (etapa_id) REFERENCES Etapas(etapa_id),
    FOREIGN KEY (responsavel) REFERENCES Tipo_Usuario(tipo_id)
);



create table Processo (
	processo_id int primary key auto_increment,
    template int references Template(template_id),
    usuario int references Usuarios(usuario_id)
);


create table Processo_Etapa(
	processo_etapa_id INT PRIMARY KEY AUTO_INCREMENT,
    processo int references Processo(processo_id),
    template int not null,
    etapa int not null,
    ordem int not null,
    status_ varchar(255),
    usuario int,
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id),
	FOREIGN KEY (template, etapa, ordem) 
    REFERENCES Etapa_Relacao (template_id, etapa_id, ordem)
);


create table solicitacao (
	solicitacao_id INT PRIMARY KEY AUTO_INCREMENT,
    processo_etapa int,
    cpf varchar(255),
    animal int,
    comprovante_residencia blob,
    FOREIGN KEY (animal) REFERENCES Animais (animal_id),
    FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id)
);

create table visitacao (
	visitacao_id INT PRIMARY KEY AUTO_INCREMENT,
    data_ DATE,
    endereco varchar(255),
    processo_etapa int,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id)
);

create table entrevista (
	entrevista_id INT PRIMARY KEY AUTO_INCREMENT,
    data_ DATE,
    observacoes varchar(255),
    processo_etapa int,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id)
);

create table recusa (
	recusa_id INT PRIMARY KEY AUTO_INCREMENT,
    justificativa varchar(255),
    processo_etapa int,
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


