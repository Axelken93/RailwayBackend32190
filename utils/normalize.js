import { normalize, denormalize, schema } from 'normalizr'
import fs from 'fs';


// Definimos schemas
const autores = new schema.Entity('autores')

const msj = new schema.Entity('mensaje', {
    mensajes: [{autor:autores}], 
    autores: [autores] 
})


//funcion Auxiliar
async function normalizacionSave(obj) {
    let readHistorial = JSON.parse(fs.readFileSync('./public/historialMensajes.txt', 'utf-8'))
    let historial = denormalize(readHistorial.result, msj, readHistorial.entities)

    let array = historial.autores
    let arrayMails = array.map((x) => {return x.id})

    let autor = {
        id: obj.id,
        nombre: obj.nombre,
        apellido: obj.apellido,
        edad: obj.edad,
        alias: obj.alias,
        avatar: obj.avatar
     }
    let mensaje = {
        texto: obj.texto,
        date: obj.date,
    }


    if (arrayMails.some((e) => {return e == obj.id})) {
        historial.mensajes.push({mensaje,autor})
        let historialNormalizado = normalize(historial, msj)
        let strHistorial = JSON.stringify(historialNormalizado, null, 2)
        fs.promises.writeFile('./public/historialMensajes.txt', strHistorial)

        return historial

    } else {
        historial.autores.push(autor)
        historial.mensajes.push({mensaje,autor})
        let historialNormalizado = normalize(historial, msj)
        let strHistorial = JSON.stringify(historialNormalizado, null, 2)
        fs.promises.writeFile('./public/historialMensajes.txt', strHistorial)

        return historial
    }
}

async function denormalizar(obj) {
    const objDenormalizado = denormalize(obj.result, msj, obj.entities)
    return objDenormalizado
}

async function porcentajeConversion() {
    const obj = JSON.parse(fs.readFileSync(`./public/historialMensajes.txt`, 'utf-8'))
    let tamanoOriginal = JSON.stringify(obj).length
    let objNormalizado = normalize(obj, msj)
    let tamanoNormalizado = JSON.stringify(objNormalizado).length
    let conversion = (tamanoOriginal / tamanoNormalizado) * 100
    return conversion.toString()
}


// utils

import util from 'util'

function print(objeto) {
  console.log(util.inspect(objeto, false, 12, true))
}


export {
    normalizacionSave,
    print,
    denormalizar,
    porcentajeConversion
};
