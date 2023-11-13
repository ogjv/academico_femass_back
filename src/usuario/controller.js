const pool = require('../../db')
const queries = require('./queries')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require('nodemailer');


const error = (err) => {
    return({
        error: err
    })
}



const getAll = (req, res) => {
    pool.query(queries.getAll, (err, resSql) => {
        if (err) {
            res.send(error(err));
        } else if (resSql && resSql.rows) {
            if (!req.session.views) {
                req.session.views = 1;
            } else {
                req.session.views++;
            }
            res.status(200).json(resSql.rows);
        } else {
            res.status(500).send("Erro na consulta.");
        }
    });
}

const sendConfirmationEmail = (toEmail, res) => {
    const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
            user: 'utilidadesprog@outlook.com',
            pass: 'Prog123456@',
        },
    });

    const confirmationLink = `http://localhost:8080/api/v1/usuarios/confirmar/${encodeURIComponent(toEmail)}`;
    const mailOptions = {
    from: 'Grade Acadêmica <utilidadesprog@outlook.com>',
    to: toEmail,
    subject: 'Confirmação de Cadastro',
    text: `Obrigado por se cadastrar na grade acadêmica FeMASS! Para confirmar seu cadastro, clique no seguinte link: ${confirmationLink}`,
};

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail de confirmação:', error);
            res.status(500).send('Erro ao enviar e-mail de confirmação');
        } else {
            console.log('E-mail de confirmação enviado:', info.response);
            res.status(200).send('E-mail de confirmação enviado com sucesso');
        }
    });
};

const post = (req, res) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(req.query.senha, salt, (err, hash) => {
            if (!req.session.views) {
                req.session.views = 1;
            } else {
                req.session.views++;
            }
            pool.query(queries.post(req.query.nome, req.query.email, hash), (err, resSql) => {
                if (err) {
                    res.send(error(err));
                } else {
                    sendConfirmationEmail(req.query.email, res); //enviar o e-mail de confirmação
                }
            });
        });
    });
};

const confirmarCadastro = (req, res) => {
    const email = decodeURIComponent(req.params.email);
    console.log('Email a ser confirmado:', email);
    
    pool.query('UPDATE usuario SET confirmacao = true WHERE email = $1', [email], (err, result) => {
        console.log('Resultado da query de atualização:', result);
        if (err) {
            console.error('Erro ao confirmar cadastro:', err);
            res.status(500).send('Erro ao confirmar cadastro.');
        } else if (result.rowCount === 0) {
            res.status(404).send('E-mail não encontrado.');
        } else {
            // Redirecione o usuário para uma página de confirmação bem-sucedida.
            res.redirect('/cadastro-confirmado');
        }
    });
};

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
    confirmarCadastro,
}
