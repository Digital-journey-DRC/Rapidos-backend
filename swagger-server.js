// swagger-server.js
import { swaggerOptions } from '#config/swaggerOptions'
import express from 'express'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const app = express()
const swaggerSpec = swaggerJSDoc(swaggerOptions)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/swagger.json', (_req, res) => res.json(swaggerSpec))

app.listen(4000, () => {
  console.log('Swagger dispo sur http://localhost:4000/docs')
})
