const pool = require('../../db')
const queries = require('./queries')
const materiasQueries = require('../materias/queries')
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
                    req.session.userId = usuario.id; 
                    req.session.save();
                    console.log('userId after login validation:', req.session.userId);
                    // Aqui, vamos também definir loggedInUserId para garantir que esteja correto
                    const loggedInUserId = req.session.userId;
                    console.log('loggedInUserId:', loggedInUserId);

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
const isAuth = (req, res, next) => {
    console.log('Middleware isAuth chamado.');

    if (req.session.isAuth) {
        console.log('Usuário autenticado.');
        console.log('userId in isAuth middleware:', req.session.userId);
        const email = req.session.email;
        pool.query('SELECT id FROM usuario WHERE email = $1', [email], (err, result) => {
            if (err) {
                console.error('Erro ao obter ID do usuário:', err);
                res.status(500).send('Erro interno ao obter ID do usuário.');
            } else if (result.rows.length > 0) {
                const userId = result.rows[0].id;
                req.session.userId = userId;
                next();
            } else {
                res.status(404).send('Usuário não encontrado no banco de dados.');
            }
        });
    } else {
        console.log('Usuário não autenticado.');
        res.status(401).send('Usuário não autenticado. Faça login para acessar esta página.');
    }
};

const secret = (req, res) => {
    res.send("acesso autenticado")
}

const gerarCodigoSeguranca = () => {
    // Gere um código de segurança aleatório, por exemplo, um número de 6 dígitos
    const codigoSeguranca = Math.floor(100000 + Math.random() * 900000).toString();
    return codigoSeguranca;
};
  
  const enviarEmailRecuperacao = async (req, res) => {
    const { email } = req.body;
  
    try {
      // Gere um código de segurança
      const codigoSeguranca = gerarCodigoSeguranca();
  
      // Salve o código de segurança no banco de dados associado ao e-mail do usuário
      await queries.salvarCodigoSeguranca(email, codigoSeguranca);
  
      // Configuração do Nodemailer
      const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: 'utilidadesprog@outlook.com',
          pass: 'Prog123456@',
        },
      });
  
      // Corpo do e-mail
      const mailOptions = {
        from: 'Grade Acadêmica <utilidadesprog@outlook.com>',
        to: email,
        subject: 'Recuperação de Senha',
        text: `Olá! Você solicitou a recuperação de senha. Aqui está seu código de segurança: ${codigoSeguranca}`,
      };
  
      // Envie o e-mail
      const info = await transporter.sendMail(mailOptions);
      console.log('E-mail de recuperação enviado:', info.response);
  
      res.status(200).send('E-mail de recuperação enviado com sucesso.');
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      res.status(500).send('Erro ao enviar e-mail de recuperação.');
    }
  };
  const verificarCodigoSeguranca = async (req, res) => {
    const { email, codigoSeguranca } = req.body;
  
    try {
      // Obtenha o código de segurança do banco de dados associado ao e-mail do usuário
      const usuario = await pool.query(queries.getUsuarioByEmail(email));
  
      if (!usuario || usuario.rows.length === 0) {
        return res.status(404).send('E-mail não encontrado.');
      }
  
      const codigoSegurancaNoBanco = usuario.rows[0].codigo_seguranca;
  
      // Verifique se o código de segurança fornecido é igual ao código no banco de dados
      if (codigoSeguranca === codigoSegurancaNoBanco) {
        return res.status(200).send('Código de segurança correto.');
      } else {
        return res.status(400).send('Código de segurança incorreto.');
      }
    } catch (error) {
      console.error('Erro ao verificar o código de segurança:', error);
      return res.status(500).send('Erro ao verificar o código de segurança.');
    }
  };

  const alterarSenha = async (req, res) => {
    console.log('Recebendo solicitação para alterar senha:', req.body);
    const { novaSenha, confirmacaoSenha } = req.body;
    const email = req.session.email; // Certifique-se de que o e-mail está sendo armazenado corretamente na sessão
  
    try {
      // Adicione a lógica para validar as senhas aqui
      if (novaSenha !== confirmacaoSenha) {
        return res.status(400).send('A nova senha e a confirmação de senha não correspondem.');
        console.log('Email do usuário para atualizar senha:', req.session.email);
      }
  
      // Gere o hash da nova senha
      const hashNovaSenha = await bcrypt.hash(novaSenha, saltRounds);
  
      // Atualize a senha no banco de dados
      await pool.query(queries.atualizarSenha(email, hashNovaSenha));
  
      return res.status(200).send('Senha alterada com sucesso.');
    } catch (error) {
      console.error('Erro durante a alteração de senha:', error);
      return res.status(500).send('Erro ao alterar senha. Tente novamente mais tarde.');
    }
  };
  
  const updateCursadas = async (req, res) => {
    try {
      const { userId, materiasCursadas } = req.body;
      console.log('userId from request body:', userId);
  
      // Verificar se o usuário está autenticado e tem permissão
      const loggedInUserId = req.session.userId;
      console.log('loggedInUserId in updateCursadas:', loggedInUserId);
  
      if (loggedInUserId !== userId) {
        console.log('Permissão negada. loggedInUserId !== userId');
        return res.status(403).send('Permissão negada.');
      }
  
      // Atualizar a coluna materias_cursadas no banco de dados
      await pool.query('UPDATE usuario SET materias_cursadas = $1 WHERE id = $2', [materiasCursadas, userId]);
  
      console.log('Matérias Cursadas Atualizadas:', materiasCursadas);
      res.status(200).send('Matérias cursadas atualizadas com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar matérias cursadas:', error);
      res.status(500).send('Erro ao atualizar matérias cursadas.');
    }
  };


  const getUserId = (req, res) => {
    if (req.session.isAuth) {
      if (req.session.userId) {
        const userId = req.session.userId;
        const username = req.session.username;  // Adicione esta linha para recuperar o nome de usuário da sessão.
        console.log('UserId from session:', userId);
        console.log('Username from session:', username);  // Adicione esta linha para verificar o nome de usuário.
        res.status(200).json({ userId, username });
      } else if (req.session.email) {
        const email = req.session.email;
        pool.query('SELECT id, nome FROM usuario WHERE email = $1', [email], (err, result) => {
          if (err) {
            console.error('Erro ao obter ID do usuário:', err);
            res.status(500).send('Erro interno ao obter ID do usuário.');
          } else if (result.rows.length > 0) {
            const { id: userId, nome: username } = result.rows[0];
            req.session.userId = userId;
            req.session.username = username;  // Adicione esta linha para armazenar o nome de usuário na sessão.
            console.log('UserId from database:', userId);
            console.log('Username from database:', username);  // Adicione esta linha para verificar o nome de usuário.
            res.status(200).json({ userId, username });
          } else {
            res.status(404).send('Usuário não encontrado no banco de dados.');
          }
        });
      } else {
        res.status(500).send('Erro interno: A sessão não contém informações de autenticação.');
      }
    } else {
      res.status(401).send('Usuário não autenticado.');
    }
  };
  
  

  const getUsername = (req, res) => {
    console.log("Recebendo requisição para getUsername");
    console.log("Cookies recebidos:", req.cookies);

    if (req.session.isAuth && req.session.username) {
        const username = req.session.username;
        console.log("Nome de usuário autenticado:", username);
        res.status(200).json({ username });
    } else {
        console.error("Falha na autenticação ou nome de usuário não encontrado na sessão.");
        res.status(401).send('Usuário não autenticado ou nome de usuário não encontrado na sessão.');
    }
};



const updatePeriodo = async (req, res) => {
    const { userId, periodo } = req.body;
  
    try {
      // Verifique se o usuário existe
      const userExists = await pool.query('SELECT * FROM usuario WHERE id = $1', [userId]);
  
      if (userExists.rows.length === 0) {
        return res.status(404).send('Usuário não encontrado.');
      }
  
      // Atualize o período do usuário no banco de dados
      await pool.query('UPDATE usuario SET periodo = $1 WHERE id = $2', [periodo, userId]);
  
      console.log(`Período do usuário ${userId} atualizado para ${periodo}`);
      res.status(200).send('Período do usuário atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar o período do usuário:', error);
      res.status(500).send('Erro ao atualizar o período do usuário.');
    }
};

const adicionarMateriasCursadas = (req, res) => {
    console.log('Chamada para adicionarMateriasCursadas');
    console.log('req.body:', req.body);

    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }

    if (typeof req.body.materias === 'string') req.body.materias = [req.body.materias];

    console.log('Materias a serem adicionadas:', req.body.materias);

    pool.query(queries.adicionarMaterias(), [req.body.nome, req.body.materias], (err, resSql) => {
        if (err) {
            console.error('Erro no SQL:', err);
            res.send(error(err));
        } else {
            console.log('Matérias adicionadas com sucesso');
            res.status(200).send();
        }
    });
};

  




const deleteMateriasCursadas = (req, res) => {
 
    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }

    pool.query(queries.deleteMaterias(), [req.query.nome, req.query.materias], (err,resSql) =>{
        if(err) res.send(error(err))
        res.status(200).send()
    })

}

const adicionarMateriasCursando = (req, res) => {

    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }
    
    if(typeof(req.query.materias) === 'string') req.query.materias = [req.query.materias]

    pool.query(queries.adicionarMateriasCursando(), [req.query.nome, req.query.materias], (err,resSql) =>{
        if(err) res.send(error(err))
        res.status(200).send()
    })

}

const deleteMateriasCursando = (req, res) => {
 
    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }

    pool.query(queries.deleteMateriasCursando(), [req.query.nome, req.query.materias], (err,resSql) =>{
        if(err) res.send(error(err))
        res.status(200).send()
    })

}

const materiasDisponiveis = (req, res) => {

    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }

    var materiasDisponiveis = []

    pool.query(queries.getNome(req.query.nome), (err, resSql) => {
        if(err) res.send(error(err))
        if(!resSql.rows[0]) {   
            res.status(400).send()
            return
        }
        // console.log(resSql.rows[0]['materias_cursadas'])
        const materias_cursadas = resSql.rows[0]['materias_cursadas']

        pool.query(materiasQueries.getAll, (err2, resSql2) => {
            if(err) res.send(error(err))
            resSql2.rows.forEach(materia => {
                console.log(materia['pre_requisitos'])
                if(materia['pre_requisitos'].every(preRequisito => materias_cursadas.includes(preRequisito))){
                    materiasDisponiveis.push(materia)
                }
            })
            res.status(200).send(materiasDisponiveis)
        })
    })
}

module.exports = {
    getAll,
    post,
    deleteNome,
    validateLogin,
    secret,
    isAuth,
    confirmarCadastro,
    enviarEmailRecuperacao,
    gerarCodigoSeguranca,
    verificarCodigoSeguranca,
    alterarSenha,
    updateCursadas,
    getUserId,
    updatePeriodo,
    adicionarMateriasCursadas,
    deleteMateriasCursadas,
    adicionarMateriasCursando,
    deleteMateriasCursando,
    materiasDisponiveis,
}
