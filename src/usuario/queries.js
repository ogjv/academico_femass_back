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

// const adicionarMaterias = `UPDATE usuario SET materias_cursadas = materias_cursadas || $2 WHERE nome=$1`

const adicionarMaterias = () => {
    return(
        `UPDATE usuario SET materias_cursadas = materias_cursadas || $2 WHERE nome=$1`
    )
}

const deleteMaterias = () => {
    return(
        `UPDATE usuario SET materias_cursadas = array_remove(materias_cursadas, $2) WHERE nome=$1`
    )
}

// const deleteMaterias = `UPDATE usuario SET materias_cursadas = array_remove(materias_cursadas, ALL($2)) WHERE nome=$1`

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
}