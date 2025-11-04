drop trigger if exists tg_Processo_apagarSequencia;

delimiter &&

create trigger tg_Processo_apagarSequencia
after update on Processo
for each row
begin
	-- se o update for na coluna de status e o status novo for algum de encerramento/conclusão
	if (new.status_ != old.status_ and new.status_ != "Em Andamento") then
		-- apaga todos os Processo_Etapa que não tenham sido realizados, ou seja, aqueles pertencentes à bifurcações que não foram selecionadas
		delete from Processo_Etapa pe where
        pe.processo = new.processo_id and
        pe.status_ = "Não Iniciado";
    end if;
end&&

delimiter ;