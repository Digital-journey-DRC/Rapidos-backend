export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API RapidosApp',
      version: '1.0.0',
      description: 'Documentation de l’API RapidosApp avec Swagger',
    },
    servers: [
      {
        url: 'http://localhost:3333',
      },
    ],
  },
  apis: ['./start/routes.ts'], // ⚠️ Ton fichier de routes avec annotations Swagger
}
