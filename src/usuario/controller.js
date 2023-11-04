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
        if (!req.session.views) {
            req.session.views = 1;
        } else {
            req.session.views++;
        }
        res.status(200).json(resSql.rows)
    })
}

const post = (req, res) => {

    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(req.query.senha, salt, (err, hash) => {
            if (!req.session.views) {
                req.session.views = 1;
            } else {
                req.session.views++;
            }
            pool.query(queries.post(req.query.nome, req.query.email, hash), (err, resSql) => {
                if(err) res.send(error(err))
                res.status(200).send()
            })
        })
    })

}

const deleteNome = (req, res) => {

    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }
    pool.query(queries.deleteNome(req.query.nome), (err,resSql) =>{
        if(err) res.send(error(err))
        res.status(200).send()
    })
}

const validateLogin = (req, res) => {

    var usuario 

    pool.query(queries.getNomeEmail(req.query.login), (err, resSql) => {
        if(!resSql) {
            res.status(400).send()
            return
        }
        usuario = resSql.rows
        if(err) res.send(error(err))
        
        if (!req.session.views) {
            req.session.views = 1;
        } else {
            req.session.views++;
        }

        bcrypt.compare(req.query.senha, usuario[0]['senha'], (err, result) => {
            if(result){
                req.session.isAuth = true
                res.status(200).send()
            }else{
                res.status(400).send()
                return
            }
        })

    })

}

const isAuth = (req, res) => {
    if(req.session.isAuth) res.status(200).send({
        autenticado: true
    })

    res.send({
        autenticado: false
    })
}

const secret = (req, res) => {
    res.send("acesso autenticado")
}

module.exports = {
    getAll,
    post,
    deleteNome,
    validateLogin,
    secret,
    isAuth,
}
