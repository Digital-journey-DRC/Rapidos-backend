import { scrypt, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

const password = '1234'
const salt = randomBytes(16).toString('hex')
const keyLength = 64

const derivedKey = await scryptAsync(password, salt, keyLength, { N: 16384, r: 8, p: 1 })
const hash = `$scrypt$n=16384,r=8,p=1$${salt}$${derivedKey.toString('hex')}`

console.log('\n=== Hash généré pour le mot de passe "1234" ===\n')
console.log(hash)
console.log('\n=== Requête SQL à exécuter ===\n')
console.log(`UPDATE users SET password = '${hash}' WHERE phone = '+243999999999';`)
console.log('')
