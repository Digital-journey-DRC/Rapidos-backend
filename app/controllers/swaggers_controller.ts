import type { HttpContext } from '@adonisjs/core/http'
import path from 'node:path'
import YAML from 'yamljs'
import swaggerUi from 'swagger-ui-express'
import express from 'express'

// Charger Swagger document
const swaggerDocument = YAML.load(path.join(import.meta.dirname, '../docs/swagger.yaml'))

// Créer une mini app express uniquement pour Swagger
const expressApp = express()
expressApp.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

export default class SwaggerController {
  async show({ response }: HttpContext) {
    // Redirige vers l'URL complète Swagger
    response.redirect('http://localhost:3334')
  }
}
