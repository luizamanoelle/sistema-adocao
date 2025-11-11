DROP PROCEDURE IF EXISTS sp_concluir_etapa;

DELIMITER $$

CREATE PROCEDURE sp_concluir_etapa(
    IN p_processo_etapa_id INT,
    IN p_proximo_etapa_relacao_id_escolhido INT -- Pode ser o 'proximo' ou o 'alternativo'
)
BEGIN
    
    DECLARE v_current_processo_id INT;
    DECLARE v_current_usuario_id INT;
    DECLARE v_current_etapa_relacao_id INT;
    DECLARE v_proximo_etapa_relacao_id INT; 
    DECLARE v_current_responsavel_tipo_id INT;
    DECLARE v_proximo_responsavel_tipo_id INT;
    DECLARE v_current_responsavel_nome VARCHAR(255);
    DECLARE v_proximo_responsavel_nome VARCHAR(255);
    DECLARE v_proximo_pe_id INT;
    DECLARE v_proximo_usuario_id INT;
    DECLARE v_nome_etapa_final VARCHAR(255);
    DECLARE v_novo_status_processo VARCHAR(255);
    DECLARE v_old_status VARCHAR(255);
    DECLARE v_processo_owner_id INT;


    SELECT 
        processo, usuario, etapa_relacao, status_
    INTO 
        v_current_processo_id, v_current_usuario_id, v_current_etapa_relacao_id, v_old_status
    FROM 
        Processo_Etapa
    WHERE 
        processo_etapa_id = p_processo_etapa_id;
        
 
    IF v_old_status != 'Concluído' THEN
    
        UPDATE Processo_Etapa
        SET status_ = 'Concluído'
        WHERE processo_etapa_id = p_processo_etapa_id;

 
        --  Obter o responsável ATUAL e usar o parâmetro para o PRÓXIMO
        SELECT responsavel
        INTO v_current_responsavel_tipo_id
        FROM Etapa_Relacao 
        WHERE etapa_relacao_id = v_current_etapa_relacao_id;
        
        SET v_proximo_etapa_relacao_id = p_proximo_etapa_relacao_id_escolhido;
            
        IF v_proximo_etapa_relacao_id IS NULL THEN
            
            SELECT e.nome INTO v_nome_etapa_final
            FROM Etapas e
            JOIN Etapa_Relacao er ON e.etapa_id = er.etapa
            WHERE er.etapa_relacao_id = v_current_etapa_relacao_id;

            IF v_nome_etapa_final = 'Cancelamento' THEN
                SET v_novo_status_processo = 'Cancelado';
            ELSEIF v_nome_etapa_final = 'Conclusão' THEN
                SET v_novo_status_processo = 'Concluído';
            ELSE
                SET v_novo_status_processo = 'Encerrado';
            END IF;
            
            UPDATE Processo 
            SET status_ = v_novo_status_processo 
            WHERE processo_id = v_current_processo_id;

        ELSE
            
            
            SELECT processo_etapa_id INTO v_proximo_pe_id
            FROM Processo_Etapa
            WHERE processo = v_current_processo_id 
              AND etapa_relacao = v_proximo_etapa_relacao_id;
            
            SELECT responsavel INTO v_proximo_responsavel_tipo_id
            FROM Etapa_Relacao 
            WHERE etapa_relacao_id = v_proximo_etapa_relacao_id;
            
            SELECT categoria INTO v_current_responsavel_nome
            FROM Tipo_Usuario WHERE tipo_id = v_current_responsavel_tipo_id;
            
            SELECT categoria INTO v_proximo_responsavel_nome
            FROM Tipo_Usuario WHERE tipo_id = v_proximo_responsavel_tipo_id;

            SET v_proximo_usuario_id = NULL; 
            
            -- ---  Pega o Adotante original do Processo
            SELECT usuario INTO v_processo_owner_id
            FROM Processo
            WHERE processo_id = v_current_processo_id;

            
            --  Se a próxima etapa for do Adotante, atribui ao dono do processo.
            IF v_proximo_responsavel_nome = 'Adotante' THEN
                SET v_proximo_usuario_id = v_processo_owner_id;

            -- Se for transição entre Admin/Voluntário, faz balanceamento.
            ELSEIF (v_current_responsavel_nome = 'Adotante' AND (v_proximo_responsavel_nome = 'Administrador' OR v_proximo_responsavel_nome = 'Voluntário')) OR
                   (v_current_responsavel_nome = 'Administrador' AND v_proximo_responsavel_nome = 'Voluntário') OR
                   (v_current_responsavel_nome = 'Voluntário' AND v_proximo_responsavel_nome = 'Administrador')
            THEN
                SELECT u.usuario_id INTO v_proximo_usuario_id
                FROM Usuarios u
                WHERE u.tipo_usuario = v_proximo_responsavel_tipo_id
               
                ORDER BY fn_contar_andamento_usuario(u.usuario_id) ASC
                LIMIT 1;

            -- Se for o mesmo tipo (Admin->Admin), mantém o usuário.
            ELSEIF v_current_responsavel_nome = v_proximo_responsavel_nome
            THEN
                SET v_proximo_usuario_id = v_current_usuario_id;
            
            
            END IF;
        
            UPDATE Processo_Etapa
            SET 
                status_ = 'Em andamento',
                usuario = v_proximo_usuario_id
            WHERE 
                processo_etapa_id = v_proximo_pe_id;
        END IF; 
        
    END IF; 
END$$

DELIMITER ;
