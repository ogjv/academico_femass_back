const pool = require('../../db')
const queries = require('./queries')
const { Materia, Usuario, Sequelize } = require('../../db');


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

const getMateriasMontagemGrade = async (req, res) => {
    try {
      const { nome } = req.query;
  
      // Obtenha as matérias cursadas pelo usuário
      const usuario = await Usuario.findOne({ where: { nome } });
      const materiasCursadas = usuario.materias_cursadas || [];
  
      // Consulte as matérias que não são pré-requisitos de outras matérias já cursadas
      const materias = await Materia.findAll({
        where: {
          nome: { [Op.notIn]: materiasCursadas },
          pre_requisitos: { [Op.notLike]: { [Op.any]: materiasCursadas } },
        },
        limit: 6, // Limita a 6 matérias
      });
  
      // Verifica conflitos de horários
      const horariosSelecionados = new Set();
      const materiasFiltradas = materias.filter((materia) => {
        if (!horariosSelecionados.has(materia.horario)) {
          horariosSelecionados.add(materia.horario);
          return true;
        }
        return false;
      });
  
      res.status(200).json(materiasFiltradas);
    } catch (error) {
      console.error('Erro ao obter matérias para MontagemGrade:', error);
      res.status(500).json(error(error));
    }
  };
  

module.exports = {
    getAll,
    post,
    deleteNome,
    getMateriasMontagemGrade,
}
