const getAll = 'SELECT * FROM materias'
const getNome = (nome) => {
    `SELECT * FROM materias WHERE nome='${nome}'`
}
const post = (nome, curso, periodo) => {
    return(
        `INSERT INTO materias(nome,curso,periodo) VALUES('${nome}','${curso}','${periodo}')`
    )
}
const deleteNome = (nome) => {
    return(
        `DELETE FROM materias WHERE nome='${nome}'`
    )
}

module.exports = {
    getAll,
    getNome,
    post,
    deleteNome,
}