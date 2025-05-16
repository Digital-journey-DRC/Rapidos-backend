import express from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { createServer } from 'http'

const app = express()
const swaggerDocument = YAML.load('docs/swagger.yaml') // ou JSON

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const PORT = 3334
createServer(app).listen(PORT, () => {
  console.log(`Swagger running at http://localhost:${PORT}/docs`)
})
