
create database petflow;
use petflow;

create table Animais(
	animal_id int PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255),
    sexo char(1),
    idade int,
	foto blob,
    tipo varchar(10)
);

create table Etapas(
	etapa_id int PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255)
);

create table Template (
	template_id int PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255)
);


create table Tipo_Usuario (
	tipo_id int PRIMARY KEY AUTO_INCREMENT,
	categoria varchar(255)
);

create table Usuarios (
	usuario_id int PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255),
    idade int,
    email varchar(255),
    senha varchar(255),
    tipo_usuario int,
    FOREIGN KEY (tipo_usuario) REFERENCES Tipo_Usuario (tipo_id)
);


CREATE TABLE Etapa_Relacao (
	etapa_relacao_id int PRIMARY KEY AUTO_INCREMENT,
    template int not null,
    etapa int not null,
    responsavel int not null,
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
    template int not null,
    usuario int not null,
	status_ varchar(255) not null,
	FOREIGN KEY (template) REFERENCES Template(template_id),
	FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id)
);


create table Processo_Etapa(
	processo_etapa_id int PRIMARY KEY AUTO_INCREMENT,
    processo int not null,
    etapa_relacao int not null,
    status_ varchar(255) not null,
    usuario int not null,
	FOREIGN KEY (processo) REFERENCES Processo(processo_id) ON DELETE CASCADE, 
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id),
	FOREIGN KEY (etapa_relacao) REFERENCES Etapa_Relacao (etapa_relacao_id)
);


create table solicitacao (
	solicitacao_id int PRIMARY KEY AUTO_INCREMENT,
    processo_etapa int not null,
    cpf varchar(255) not null,
    animal int not null,
    comprovante_residencia blob,
    FOREIGN KEY (animal) REFERENCES Animais (animal_id),
    FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);

create table visitacao (
	visitacao_id int PRIMARY KEY AUTO_INCREMENT,
    data_ date not null,
    endereco varchar(255) not null,
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);

create table entrevista (
	entrevista_id int PRIMARY KEY AUTO_INCREMENT,
    data_ date not null,
    observacoes varchar(255),
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);

create table recusa (
	recusa_id int PRIMARY KEY AUTO_INCREMENT,
    justificativa varchar(255),
    processo_etapa int not null,
	FOREIGN KEY(processo_etapa) REFERENCES Processo_Etapa (processo_etapa_id) ON DELETE CASCADE
);


create table validacao (
	validacao_id int PRIMARY KEY AUTO_INCREMENT,
    descricao varchar(255),
    etapa_relacao int not null,
	FOREIGN KEY (etapa_relacao) REFERENCES Etapa_Relacao (etapa_relacao_id)
);

SET GLOBAL max_sp_recursion_depth = 255; 

