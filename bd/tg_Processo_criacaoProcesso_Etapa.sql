drop trigger if exists tg_Processo_criacaoProcesso_Etapa;

delimiter &&
create trigger tg_Processo_criacaoProcesso_Etapa
after insert on Processo
for each row
begin
	-- Primeiro insere todos os Processo_Etapa exceto o que corresponde a etapa inicial
	insert into Processo_Etapa (processo, etapa_relacao, status_)
	select new.processo_id, etapa_relacao_id, "Não Iniciado"
	from Etapa_Relacao er
	where er.template = new.template
    and er.etapa_relacao_id not in
		(select max(e.etapa_relacao_id)
			from Etapa_Relacao e
            where e.template = new.template);
    
    -- Insere o Processo_Etapa correspondente a etapa inicial, com status diferente e mesmo usuário que criou o processo
    insert into Processo_Etapa (processo, etapa_relacao, status_, usuario)
    select new.processo_id, etapa_relacao_id, "Em Andamento", new.usuario
    from Etapa_Relacao er
    where er.etapa_relacao_id in (
				select max(e.etapa_relacao_id)
                from Etapa_Relacao e
                where e.template = new.template);
    
end&&

delimiter ;