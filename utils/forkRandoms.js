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

process.on('exit', () => {
    console.log('Fork Finalizado: ' + process.pid)
})

process.on('message', msgPadre => {
    const msgHijo = numSalidos(msgPadre)
    process.send(msgHijo)
    process.exit()
})

process.send('Comencemos')