import { faker } from '@faker-js/faker'

faker.locale = 'es'

function generarProducto() {
    return {
        title: faker.hacker.noun(),
        price: faker.finance.amount(),
        thumbnail: faker.image.image()
    }
}

export { generarProducto }