DROP FUNCTION IF EXISTS fn_contar_andamento_usuario;

DELIMITER $$
CREATE FUNCTION fn_contar_andamento_usuario(
    p_usuario_id INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT;

    SELECT COUNT(*)
    INTO v_total
    FROM Processo_Etapa
    WHERE usuario = p_usuario_id
      AND status_ = 'Em andamento';

    RETURN v_total;
END$$
DELIMITER ;

