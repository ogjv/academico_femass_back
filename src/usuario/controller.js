const pool = require('../../db')
const queries = require('./queries')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.query.email)) {
        res.status(400).send('E-mail inválido.');
        return;
    }
    bcrypt.genSalt(saltRounds, (err, salt) => {
        bcrypt.hash(req.query.senha, salt, (err, hash) => {
            if (!req.session.views) {
                req.session.views = 1;
            } else {
                req.session.views++;
            }
            pool.query(queries.post(req.query.nome, req.query.email, hash), (err, resSql) => {
                if (err) {
                    res.status(500).send(error(err));
                } else if (resSql.rows.length > 0) {
                    res.status(400).send('E-mail já cadastrado. Use um e-mail diferente.');
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
    var usuario;

    pool.query(queries.getNomeEmail(req.query.login), (err, resSql) => {
        if (!resSql) {
            res.status(400).send();
            return;
        }

        usuario = resSql.rows[0];

        if (err) {
            res.send(error(err));
            return;
        }

        // Verifica se a coluna 'confirmacao' é true
        if (usuario.confirmacao === true) {
            bcrypt.compare(req.query.senha, usuario.senha, (err, result) => {
                if (result) {
                    req.session.isAuth = true;
                    res.status(200).send();
                } else {
                    res.status(400).send();
                }
            });
        } else {
            res.status(401).send('Usuário não confirmado. Confirme seu cadastro para fazer login.');
        }
    });
};

const resetarSenha = (req, res) => {
    const { token } = req.params;
    const { novaSenha } = req.body;

    if (!token || !novaSenha) {
        res.status(400).send('Token ou nova senha não fornecidos.');
        return;
    }

    // Verifique e decodifique o token de recuperação
    jwt.verify(token, 'arquivo_confidencial', (err, decoded) => {
        if (err) {
            res.status(400).send('Token inválido.');
            return;
        }

        const { email } = decoded;

        // Atualiza a senha do usuário no banco de dados
        updateSenhaUsuario(email, novaSenha)
            .then(() => res.status(200).send('Senha redefinida com sucesso.'))
            .catch((error) => {
                console.error('Erro ao redefinir a senha:', error);
                res.status(500).send('Erro ao redefinir a senha.');
            });
    });
};
const recuperarSenha = (req, res) => {
    const { username } = req.body;
  
    if (!username) {
      res.status(400).send('Nome de usuário não fornecido.');
      return;
    }
  
    // Lógica para obter o e-mail associado ao nome de usuário
    pool.query(queries.getEmailFromUsername(username), (err, result) => {
      if (err) {
        console.error('Erro ao obter e-mail do usuário:', err);
        res.status(500).send('Erro ao solicitar recuperação de senha.');
        return;
      }
  
      if (result.rows.length === 0) {
        res.status(400).send('Nome de usuário não encontrado.');
        return;
      }
  
      const email = result.rows[0].email;
  
      // Gere um token de recuperação de senha
      const tokenRecuperacao = jwt.sign({ email }, 'arquivo_confidencial', { expiresIn: '1h' });
      const linkRecuperacao = `http://localhost:8080/api/v1/usuarios/resetar-senha/${tokenRecuperacao}`;
  
      // Envia e-mail para o usuário
      sendRecuperacaoEmail(email, linkRecuperacao)
        .then(() => res.status(200).send('E-mail de recuperação enviado com sucesso.'))
        .catch((error) => {
          console.error('Erro ao enviar e-mail de recuperação:', error);
          res.status(500).send('Erro ao enviar e-mail de recuperação.');
        });
    });
  };
  const sendRecuperacaoEmail = (to, linkRecuperacao) => {
    const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
            user: 'utilidadesprog@outlook.com',
            pass: 'Prog123456@',
        },
    });
  
    const mailOptions = {
      from: 'Grade Acadêmica <utilidadesprog@outlook.com    ',
      to: to,
      subject: 'Recuperação de senha',
      text: `Clique no link a seguir para redefinir sua senha: ${linkRecuperacao}`,
    };
  
    return transporter.sendMail(mailOptions);
  };
  
  module.exports = {
    sendRecuperacaoEmail,
  };


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
    recuperarSenha,
    resetarSenha,
    sendRecuperacaoEmail,
}
