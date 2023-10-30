const pool = require('../../db')
const queries = require('./queries')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const error = (err) => {
    return({
        error: err
    })
}

const getAll = (req, res) => {
    pool.query(queries.getAll, (err, resSql) => {
        if(err) res.send(error(err))
        res.status(200).json(resSql.rows)
    })
}

const post = (req, res) => {

    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(req.query.senha, salt, (err, hash) => {
            pool.query(queries.post(req.query.nome, req.query.email, hash), (err, resSql) => {
                if(err) res.send(error(err))
                res.status(200).send()
            })
        })
    })

}

const validateLogin = (req, res) => {

    var usuario 

    pool.query(queries.getNomeEmail(req.query.login), (err, resSql) => {
        usuario = resSql.rows
        console.log(usuario)
        if(err) res.send(error(err))
            
        bcrypt.compare(req.query.senha, usuario[0]['senha'], (err, result) => {
            console.log(result)
        })

        res.status(200).send()
    })

}

module.exports = {
    getAll,
    post,
    validateLogin,
}
