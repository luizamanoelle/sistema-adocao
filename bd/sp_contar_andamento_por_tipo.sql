drop procedure if exists sp_contar_andamento_por_tipo;

delimiter $$

create procedure sp_contar_andamento_por_tipo(in p_tipo_id int)
begin
    select
        u.usuario_id,
        u.nome,
        COUNT(pe.processo_etapa_id) as total_em_andamento
    from
        Usuarios as u
    left join
        Processo_Etapa as pe on u.usuario_id = pe.usuario
                           and pe.status_ = 'Em andamento'
    where
        u.tipo_usuario = p_tipo_id
    group by
        u.usuario_id, u.nome;
end$$
delimiter ;