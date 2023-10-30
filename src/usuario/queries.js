const getAll = "SELECT * FROM usuario"
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
// const validateLogin =  (nome, email, senha){

// }

module.exports = {
    getAll,
    getNome,
    getEmail,
    getNomeEmail,
    post,
}