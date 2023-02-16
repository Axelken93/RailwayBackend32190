import express from 'express'

import { createServer, METHODS } from "http";
import { Server } from "socket.io";

const router = express.Router()
const test = express.Router()
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer)

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use('/productos', router)
app.use('/api/productos-test', test)

app.use(express.static('./public'))
app.set('view engine', 'ejs')

import bcrypt from 'bcryptjs'
import { generarProducto } from './utils/productosFaker.js'
import { assignedNewId, Productos } from './controllers/productos.js'
import { normalizacionSave, denormalizar, porcentajeConversion } from './utils/normalize.js'
import {getUser, usersMongodb, getExpires, cantSesiones, destroySession} from "./utils/connection.js";

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//----------------------------------------------------//
//DESAFIO 13
const PORT = process.env.PORT || 8080
let modo = process.argv[3] || "FORK"
const modoCluster = modo == 'CLUSTER'

//----------------------------------------------------//
import dotenv from 'dotenv'
dotenv.config({
    path: '.env'
})

const mongoAtlasKey = process.env.MAKEY
const mongoAtlasUrl = process.env.MAURL

//----------------------------------------------------//


//Persistencia en Mongo Atlas
import cookieParser from 'cookie-parser'
import session from 'express-session'
import MongoStore from 'connect-mongo'
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }
app.use(cookieParser())
app.use(session({
    store: MongoStore.create({
        mongoUrl: mongoAtlasUrl,
        mongoOptions: advancedOptions
    }),
    secret: mongoAtlasKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000
    }
}))

//Passport Local
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
//----------------------------------------------------//
passport.use('register', new LocalStrategy({
    passReqToCallback: true    
}, async (req, username, password, done) => {

    let usuarios = await usersMongodb.getAll()
    let usuario = await usuarios.find(usuario => usuario.username == username)

    if (usuario) {
        console.log('ERROR: el nombre de usuario ya esta registrado')
        return done(null,false)
    }

    let hashPassword = await bcrypt.hash(req.body.password, 8)
    let newUser = {username: username, password: hashPassword }
    usersMongodb.save(newUser)

    done(null, newUser)
}))

passport.use('login', new LocalStrategy(async (username, password, done) => {
    
    let usuarios = await usersMongodb.getAll()
    let usuario = await usuarios.find(usuario => usuario.username == username)
    if (!usuario) {
        console.log("ERROR: Usuario Inexistente")
        return done(null, false)
    }

    let compare = await bcrypt.compare(password, usuario.password)
    if(compare) {
        return done(null, usuario)
    } else {
        console.log("ERROR: Password Incorrecto")
        return done(null, false)
    }

}))

passport.serializeUser((user, done) => {
    done(null, user.username)
})

passport.deserializeUser(async (username, done) => {
    let usuarios = await usersMongodb.getAll()
    let usuario = await usuarios.find(usuario => usuario.username == username)
    done(null, usuario)
})



///Declaración de constantes
const productos = new Productos('productos.txt');
const mensajes = new Productos('historialMensajes.txt')

//----------------------------------------------------//
//DESAFIO 14
import compression from 'compression'
import logger from './utils/winston-config.js'
app.use(compression())




//----------------------------------------------------//
//DESAFIO 13
import os from 'os'
let numCPUs = os.cpus().length

app.get('/info', (req, res) => {
    const info = {
        Puerto: PORT,
        argEntrada: process.argv.slice(2),
        pathEjecucion: process.execPath,
        sistema: process.platform,
        idProceso: process.pid,
        version: process.version, 
        carpetaProyecto: process.cwd(),
        memoria: process.memoryUsage().rss,
        numProcesadores: os.cpus().length
    }

    res.render('info', {info})

    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)

})
//----------------------------------------------------//
import { fork } from 'child_process'
const randoms = express.Router()
app.use('/api', randoms)

//---------------------------------------------------- FORK MODE VS CLUSTER MODE//
// Puedo ingresar como parametro ingresar en -s CLUSTER y de esta forma voy a ejecutar los 8 nucleos
//de mi procesador de PC, si no ejecuto en modo cluster se me va a ejecutar por defecto en modo FORK
//Para que esto funcione el http listen lo tengo que poner en el condicional del mode de inicio. 
//---------------------------------------------------- FORK MODE//
if (!modoCluster) {
    randoms.get('/randoms', (req, res) => {
        console.log("Puerto Nro:" + PORT)
        let canti = parseInt(req.query.cant) || 100000000
        const numRandoms = fork('./utils/forkRandoms.js')
        
        numRandoms.on('message', msgHijo => {
            if (msgHijo == 'Comencemos') {
                numRandoms.send(canti)
            } else {
                res.json(msgHijo)
                console.log("Puerto Nro:" + PORT)
            }

        const { url, method } = req
        logger.info(`Metodo: ${method}, Ruta: ${url}`)
        })
    })

httpServer.listen(PORT, (err) => {
    if(err) throw new Error(`Error en el servidor ${err}`)
    logger.info('Servidor escuchando en el ' + PORT)
})
}

//---------------------------------------------------- CLUSTER MODE//
import cluster from 'cluster'
import { url } from 'inspector';

if (modoCluster) {
    if (cluster.isMaster) {
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork()
        }
    
        cluster.on('exit', worker => {
            console.log(`Worker ${worker.process.pid} died: ${new Date().toString()}`)
        })
    } else {
        randoms.get('/randoms', (req, res) => {
            let canti = parseInt(req.query.cant) || 100000000
            let msj = numSalidos(canti)
            res.json(msj)

            const { url, method } = req
            logger.info(`Metodo: ${method}, Ruta: ${url}`)
        })
    
        httpServer.listen(PORT, (err) => {
            if(err) throw new Error(`Error en el servidor ${err}`)
            logger.info('Servidor escuchando en el ' + PORT)
        })
    }    
}

function generarNumeroAleatorio() {
    return parseInt(Math.random() * 1000) + 1
}

function numSalidos(canti) {
    const numerosSalidos = {}
    let cantidad = canti || 100000000
    for (let i = 1; i <= cantidad; i++) {
        const numero = generarNumeroAleatorio()
        if (!numerosSalidos[numero]) {
            numerosSalidos[numero] = 0
        }
        numerosSalidos[numero]++
    }
    return numerosSalidos
}

//----------------------------------------------------//

app.get('/login', (req, res) => {
    destroySession()
    cantSesiones().then((cantidad) => {
        if (cantidad == 0) {
            res.sendFile('/public/login.html', {root: __dirname})
        } else {
            res.redirect("/productos")    
        }
    })
    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

function postLogin (req, res) {
        const username = req.body.username
        req.session.user = username
        res.redirect("/productos")
}

app.post('/login', passport.authenticate('login', {failureRedirect: '/faillogin'}), postLogin)


app.get('/register', (req, res) => {
    res.sendFile('/public/register.html', {root: __dirname})
    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

app.post('/register', passport.authenticate('register', { 
    failureRedirect: '/failregister', 
    successRedirect: '/login'
}))

app.get('/failregister', (req, res) => {
    res.sendFile('/public/failregister.html', {root: __dirname})
    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

app.get('/faillogin', (req, res) => {
    res.sendFile('/public/faillogin.html', {root: __dirname})
    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

app.get('/logout', (req, res) => {

    cantSesiones().then((cantidad) => {
        if (cantidad == 0) {
            res.redirect("/login")
        } else {
            res.sendFile('/public/logout.html', {root: __dirname})
        }
    })

    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})


app.get('/', (req, res) => {
    cantSesiones().then((cantidad) => {
        if (cantidad == 0) {
            res.redirect("/login")
        } else {
            res.redirect('/productos')
        }
    })

    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

router.get('/', (req, res) => {
    cantSesiones().then((cantidad) => {
        if (cantidad == 0) {
            res.redirect("/login")

            const { url, method } = req
            logger.error(`Usuario no logueado para visualizar ruta ${method} ${url}`)
        } else {
            res.sendFile('/public/index.html', {root: __dirname})
            getExpires(60000).then((data) => {
                req.session = data
            })
        }
    })

    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

router.get('/index', (req, res) => {
    cantSesiones().then((cantidad) => {
        if (cantidad == 0) {
            res.redirect("/login")
            const { url, method } = req
            logger.error(`Usuario no logueado para visualizar ruta ${method} ${url}`)
        } else {
            productos.getAll()
            .then( (products) => {
                res.render('index', {products})
            })
            getExpires(60000).then((data) => {
                req.session = data
            })
        }
    })

    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

// Test de 5 productos fakers.
test.get('/', (req, res) => {
    let products = []
    let cantidadProductos = 5 //modificable
    for (let i = 0; i < cantidadProductos; i++) {
        const newProduct = generarProducto()
        products.push(newProduct)
    }
    console.log(products)
    getExpires(60000).then((data) => {
        req.session = data
    })
    res.render('index', {products})

    const { url, method } = req
    logger.info(`Metodo: ${method}, Ruta: ${url}`)
})

router.post('/', (req, res) => {
    cantSesiones().then((cantidad) => {
        if (cantidad == 0) {
            res.redirect("/login")

            const { url, method } = req
            logger.error(`Usuario no logueado para visualizar ruta ${method} ${url}`)
        } else {
            getExpires(60000).then((data) => {
                req.session = data
            })
            let newProduct = req.body
            newProduct.id = assignedNewId()
            console.log(newProduct)
            productos.save(newProduct)
                .then(() => {
                    logger.info("Articulo insertado con exito")
                    res.redirect('/productos') 
                })
        }
    })
})


app.get('*', (req, res) => {
    const { url, method } = req

    logger.warn(`Ruta ${method} ${url} no esta implementada`)
    res.send(`Ruta ${method} ${url} no esta implementada`)
})


io.on('connection', socket =>{

    productos.getAll()
        .then( (pproducto) => {
            socket.emit('prueba', pproducto)
        })
    socket.on('new-product', data => {
        logger.error(data)
    })
    productos.getAll()
        .then( (pproducto) => {
            io.sockets.emit('prueba', pproducto)
        })

    porcentajeConversion().then((data) =>{
        socket.emit('conver', data)
    })

    mensajes.getAll()
        .then( (m) => {
            denormalizar(m).then((message) => {
                socket.emit('message', message.mensajes)
            })
        })

    socket.on('new-message', data => {
        normalizacionSave(data)
        .then((message) => {
            io.sockets.emit('message', message.mensajes)
        })

    });

    /// DESAFIO 10
    socket.on('new-user', userName => {
        logger.error(userName)
    })

    cantSesiones().then((cantidad) => {
        if (cantidad !==0){
            getUser().then((data) => {
                socket.emit('login', data)
            })
            getUser().then((data) => {
                socket.emit('logout', data)
            })
        } else {
            let data = `<h2 style="color:white;" class="m-3 p-3 text-capitalize fw-bold">INICIE SESION</h2>
            <button onclick="location.href= '/login'" class="btn btn-warning m-2 text-light">SignIn</button>`
            socket.emit('signin', data)
        }
    })

})

