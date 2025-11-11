
create database petflow;
use petflow;

create table Animais(
	animal_id int PRIMARY KEY AUTO_INCREMENT,
    nome varchar(255),
    sexo char(1),
    idade int,
	foto longblob,
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
    usuario int null,
	FOREIGN KEY (processo) REFERENCES Processo(processo_id) ON DELETE CASCADE, 
    FOREIGN KEY (usuario) REFERENCES Usuarios(usuario_id),
	FOREIGN KEY (etapa_relacao) REFERENCES Etapa_Relacao (etapa_relacao_id)
);


create table solicitacao (
	solicitacao_id int PRIMARY KEY AUTO_INCREMENT,
    processo_etapa int not null,
    cpf varchar(255) not null,
    animal int not null,
    comprovante_residencia longblob,
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

set session max_sp_recursion_depth = 255; 

insert into Etapas(nome) values ("Solicitação"), ("Análise"), ("Entrevista"), ("Visitação"), ("Aprovação"), ("Recusa"), ("Cancelamento"), ("Conclusão");
insert into Tipo_Usuario(categoria) values ("Administrador"), ("Adotante"), ("Voluntário");

insert into Usuarios (nome, idade, email, senha, tipo_usuario) values
('Admin', 35, 'admin@petflow.com', 'admin123', 1),
('Leo Adotante', 28, 'leo@email.com', 'leo123', 2),
('Isa Voluntaria', 40, 'isa@petflow.com', 'isa123', 3),
('Luma Voluntario', 30, 'luma@petflow.com', 'luma123', 3);

show variables like 'secure_file_priv';
-- importante alterar aq o arquivo de imagem!!!
insert into Animais (nome, sexo, idade, foto, tipo) values
('Max', 'M', 3, LOAD_FILE('C://ProgramData//MySQL//MySQL Server 8.0//Uploads//77fe5dacff00a4f7481272e29e63d737.jpg'), 'Cachorro'),
('Mimi', 'F', 1, LOAD_FILE('C://ProgramData//MySQL//MySQL Server 8.0//Uploads//8623521.jpg'), 'Gato'),
('Bella', 'F', 5, LOAD_FILE('C://ProgramData//MySQL//MySQL Server 8.0//Uploads//77fe5dacff00a4f7481272e29e63d737.jpg'), 'Cachorro'),
('Félix', 'M', 2, LOAD_FILE('C://ProgramData//MySQL//MySQL Server 8.0//Uploads//8623079.jpg'), 'Gato');
