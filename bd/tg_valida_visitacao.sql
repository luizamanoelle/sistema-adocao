drop trigger if exists tg_valida_visitacao

delimiter &&

create trigger tg_valida_visitacao
before insert on visitacao
for each row
begin
	declare v_usuario_id int;
    declare v_conflito_usuario int default 0;
    declare v_conflito_geral int default 0;
    
    -- seleciona o usuário que quer marcar uma visita
    select usuario into v_usuario_id
    from Processo_Etapa
    where processo_etapa_id = new.processo_etapa;
    
     select count(*) into v_conflito_usuario
     from (
		-- seleciona possível visitação ja marcada nesse dia
        select 1
		from visitacao v
		join Processo_Etapa pe on v.processo_etapa = pe.processo_etapa_id
		where pe.usuario = v_usuario_id and v.data_ = new.data_
        
        union all
        
        -- seleciona possível entrevista nesse dia ja marcada
        select 1
        from entrevista e
        join Processo_Etapa pe on e.processo_etapa = pe.processo_etapa_id
        where pe.usuario = v_usuario_id and e.data_ = new.data_
     ) as conflitos_datas_usuarios;
     
     if v_conflito_usuario > 0 THEN 
		signal sqlstate '45000'
        set message_text = 'Erro: Usuário já possui outro evento marcado para essa data';
	 end if;
     
     select count(*) into v_conflito_geral
     from (
		select 1
        from visitacao
        where data_ = new.data_
        
        union all
        
        select 1
        from entrevista
        where data_ = new.data_
     ) as conflitos_datas_gerais;
     
     if v_conflito_geral > 0 THEN 
		signal sqlstate '45000'
        set message_text = 'Erro: Já existe outro evento marcado para essa data';
	 end if;
    
end&&

delimiter ; 
  
    
