import path from 'node:path';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import express from 'express';
const swaggerDocument = YAML.load(path.join(import.meta.dirname, '../docs/swagger.yaml'));
const expressApp = express();
expressApp.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
export default class SwaggerController {
    async show({ response }) {
        response.redirect('http://localhost:3334');
    }
}
//# sourceMappingURL=swaggers_controller.js.map