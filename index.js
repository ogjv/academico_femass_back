const express = require('express');
const app = express();
const port = 8080;
const pool = require('./db');
var session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const usuarioRoutes = require('./src/usuario/routes');
const materiaRoutes = require('./src/materias/routes');
var cors = require('cors');

app.use(express.json());

app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
    }),
    secret: 'trust cookie',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Defina como false se estiver usando HTTP, true se estiver usando HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000, // Expira em 30 dias, ajuste conforme necessário
    },
}));

// Configuração do CORS
const corsOptions = {
    origin: 'http://localhost:19006',
    credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
    req.session.test = true;
    console.log(req.session.id);
    res.send("Api Grade Femass");
});

app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/materias', materiaRoutes);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:your_frontend_port');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

app.listen(port, () => console.log(`running on port ${port}`));
