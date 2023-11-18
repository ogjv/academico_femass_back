const getAll = 'SELECT * FROM materias'
const getNome = (nome) => {
    `SELECT * FROM materias WHERE nome='${nome}'`
}
const post = (nome, curso, periodo, horario, pre_requisitos) => {

    return(
        `INSERT INTO materias(nome,curso,periodo,horario,pre_requisitos) VALUES($1, $2, $3, $4, $5)`
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