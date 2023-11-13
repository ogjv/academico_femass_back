const express = require('express')
const app = express()
const port = 8080
const pool = require('./db')
var session = require('express-session')
const pgSession = require('connect-pg-simple')(session);
const usuarioRoutes = require('./src/usuario/routes')
const materiaRoutes = require('./src/materias/routes')
var cors = require('cors');



app.use(express.json())
app.use(cors());
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
    }),
    secret: 'trsut cookie',
    resave: false,
    saveUninitialized: false,
}))

app.get("/", (req,res) => {
    // req.session.isAuth = true
    req.session.test = true
    console.log(req.session.id)
    res.send("Api Grade Femass")
})

app.use('/api/v1/usuarios', usuarioRoutes)
app.use('/api/v1/materias', materiaRoutes)
// app.use('/api/v1/pesquisadores', pesquisadorRoutes)
// app.use('/api/v1/obras', obrasRoute)

app.listen(port, () => console.log(`running on port ${port}`))