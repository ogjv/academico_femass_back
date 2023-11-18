const pool = require('../../db')
const queries = require('./queries')

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

    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }

    pool.query(queries.post(), [req.query.nome, req.query.curso, req.query.periodo, req.query.horario, req.query.pre_requisitos], (err, resSql) => {
        if(err) res.send(error(err))
        res.status(200).send()
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

module.exports = {
    getAll,
    post,
    deleteNome,
}
