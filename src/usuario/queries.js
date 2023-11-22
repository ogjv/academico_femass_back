const getAll = "SELECT * FROM usuario"
const pool = require('../../db');
const post = (nome, email, senha) => {
    return(
        `INSERT INTO usuario(nome,email,senha) VALUES('${nome}', '${email}', '${senha}')`
    )
}
const getNome = (nome) => {
    return(
        `SELECT * FROM usuario WHERE nome='${nome}'`
    )
}
const getEmail = (email) => {
    return(
        `SELECT * FROM usuario WHERE email='${email}'`
    )
}
const getNomeEmail = (login) => {
    return(
        `SELECT * FROM usuario WHERE email='${login}' OR nome='${login}'`
    )
}
const deleteNome = (nome) => {
    return(
        `DELETE FROM usuario WHERE nome='${nome}'`
    )
}
const salvarCodigoSeguranca = (email, codigoSeguranca) => {
    const query = 'UPDATE usuario SET codigo_seguranca = $1 WHERE email = $2';
    const values = [codigoSeguranca, email];
  
    return pool.query(query, values);
};
const getUsuarioByEmail = (email) => {
    return (
      `SELECT * FROM usuario WHERE email='${email}'`
    );
};
const atualizarSenha = (email, novaSenha) => {
    return {
      text: 'UPDATE usuario SET senha = $1 WHERE email = $2',
      values: [novaSenha, email],
    };
};  

const updateCursadas = (materiasCursadas, userId) => {
    return {
      text: 'UPDATE usuario SET materias_cursadas = $1 WHERE id = $2',
      values: [materiasCursadas, userId],
    };
};

const adicionarMaterias = () => {
    return (
        `UPDATE usuario SET materias_cursadas = materias_cursadas || $2 WHERE nome=$1`
    );
}


const deleteMaterias = () => {
    return(
        `UPDATE usuario SET materias_cursadas = array_remove(materias_cursadas, $2) WHERE nome=$1`
    )
}

const adicionarMateriasCursando = () => {
    return(
        `UPDATE usuario SET materias_atuais = materias_atuais || $2 WHERE nome=$1`
    )
}


const deleteMateriasCursando = () => {
    return(
        `UPDATE usuario SET materias_atuais = array_remove(materias_atuais, $2) WHERE nome=$1`
    )
}
const getMateriasCursadas = () => {
    return(
    'SELECT materias_cursadas FROM usuario WHERE nome = $1'
    )
}
const getMateriasAtuaisComHorarios = () => {
    return 'SELECT u.materias_atuais, m.nome AS materia, m.horario FROM usuario u INNER JOIN materias m ON m.nome = ANY(u.materias_atuais) WHERE u.id = $1';
  };

  const getHistorico = () => {
    return `
        SELECT
            periodo,
            array_agg(materia) as materias_cursadas
        FROM (
            SELECT
                periodo,
                unnest(materias_cursadas) as materia
            FROM usuario
            WHERE id = $1
        ) AS historico
        GROUP BY periodo
        ORDER BY periodo;
    `;
};


module.exports = {
    getAll,
    getNome,
    getEmail,
    getNomeEmail,
    post,
    deleteNome,
    salvarCodigoSeguranca,
    getUsuarioByEmail,
    atualizarSenha,
    updateCursadas,
    adicionarMaterias,
    deleteMaterias,
    adicionarMateriasCursando,
    deleteMateriasCursando,
    getMateriasCursadas,
    getMateriasAtuaisComHorarios,
    getHistorico,
}