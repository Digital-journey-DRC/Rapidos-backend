import express from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'node:path'

const app = express()
const swaggerDocument = YAML.load(path.join(import.meta.dirname, 'swagger.yaml'))

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const PORT = 3334
app.listen(PORT, () => {
  console.log(`✅ Swagger UI dispo sur http://localhost:${PORT}`)
})
