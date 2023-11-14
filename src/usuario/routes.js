const { Router } = require('express')
const controller = require('./controller')
const express = require('express');

const router = Router()

const isAuth = (req, res, next) => {
    if (req.session.isAuth){
        next()
    }else{
        res.redirect('/api/v1/usuarios/')
    }
}

router.get('/', controller.getAll)
router.get('/login', controller.validateLogin)
router.get('/secret', isAuth, controller.secret)
router.get('/isAuth', controller.isAuth)
router.post('/post', controller.post)
router.delete('/deleteNome', controller.deleteNome)
router.get('/confirmar/:email', controller.confirmarCadastro);
router.post('/recuperar-senha', controller.recuperarSenha);


module.exports = router