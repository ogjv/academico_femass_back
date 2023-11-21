const { Router } = require('express')
const controller = require('./controller')
const express = require('express');
const pool = require('../../db');

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
router.post('/enviar-email-recuperacao', controller.enviarEmailRecuperacao);
router.post('/gerar-codigo-seguranca', controller.gerarCodigoSeguranca);
router.post('/verificar-codigo', controller.verificarCodigoSeguranca);
router.post('/alterar-senha', controller.alterarSenha);
router.post('/update-cursadas', isAuth, controller.updateCursadas);
router.get('/user-id', isAuth, controller.getUserId);
router.post('/update-periodo', controller.updatePeriodo);
router.post('/adicionar-materias-cursadas', controller.adicionarMateriasCursadas);
router.delete('/delete-materias-cursadas', controller.deleteMateriasCursadas);
router.post('/adicionar-materias-cursando', controller.adicionarMateriasCursando);
router.delete('/delete-materias-cursando', controller.deleteMateriasCursando);
router.get('/username', controller.getUsername);
router.get('/materias-disponiveis', controller.materiasDisponiveis);
router.get('/username/:userId', controller.getUsernameById);
router.get('/grade/:id', controller.getGradeDoUsuario);
router.get('/usuarios/materias-atuais/:id', controller.getMateriasAtuaisDoUsuario);

// No arquivo controller.js
const getMateriasAtuaisDoUsuario = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query('SELECT materias_atuais FROM usuario WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const materiasAtuais = result.rows[0].materias_atuais || [];
    res.status(200).json(materiasAtuais);
  } catch (error) {
    console.error('Erro ao obter as matérias atuais do usuário:', error);
    res.status(500).json({ error: 'Erro interno ao obter as matérias atuais do usuário.' });
  }
};



module.exports = router