const { Router } = require('express')
const controller = require('./controller')

const router = Router()

router.get('/', controller.getAll)
router.post('/post', controller.post)
router.delete('/deleteNome', controller.deleteNome)
router.get('/montagem-grade', controller.getMateriasMontagemGrade)

module.exports = router