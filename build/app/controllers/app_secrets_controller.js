import db from '@adonisjs/lucid/services/db';
import AppSecret from '#models/app_secret';
export default class AppSecretsController {
    async createTable({ response }) {
        try {
            await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS app_secrets (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_app_secrets_key ON app_secrets(key);
      `);
            return response.status(200).json({
                success: true,
                message: 'Table app_secrets créée avec succès',
            });
        }
        catch (error) {
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la table',
                error: error.message,
            });
        }
    }
    async initFirebaseCredentials({ response }) {
        try {
            const firebaseCredentials = [
                {
                    key: 'FIREBASE_PROJECT_ID',
                    value: 'rapidos-21203',
                    description: 'Firebase Project ID',
                },
                {
                    key: 'FIREBASE_CLIENT_EMAIL',
                    value: 'firebase-adminsdk-fbsvc@rapidos-21203.iam.gserviceaccount.com',
                    description: 'Firebase Client Email',
                },
                {
                    key: 'FIREBASE_PRIVATE_KEY',
                    value: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDpf0fvnKcQjDxh\n2KSVCSJrb13iG65BfCrC8hPnKr8ypv/ABrBd/LUwLavZEYmU74uUwkoxB13/mQeA\nRx+ME0XpREpw+VgHM88bmyrCUnfVHXH/6AY23CvUHdNeBsZ9YBictm0EaLyF37vz\ndL3XhoBolXFKtC34NydFEPJ+78xm3aN5ZLSPPeHqxohC5mG2q23kMRSBSCJ4Pt0G\ntW7SNvdcJzcxdPEcoEzgCvlmS0qYQq1aJHjOxg2zmLzG/OumMCldBtAuWpvmjLXG\nSIfVyrQtiQIwD2p/7rADoZf4fEFMNtkdmlsBz1fPusXyb0sOjgmdlBjLDdK2f3WE\nHnT0XsbdAgMBAAECggEAEtalj6P0aKXf00ce1DVl9QQJr43rK7ZgXtUYHPz6axRF\nKxF/Fj4mwinVJRDAqGcBPHHGeZkuEMqga82RMoR1jgHn/aBoZUBdU81bkE0GBQg4\no9xs7+0ojhcP8BSc3A2uPqqLNiFbIHPyHozLKkHcR1PTTaMm2FFe1jgtUGd5ds0A\niR8j6tJcmmwjf6YJopRQrJpeWty06G8VDWL/YoF+SaCdaL8qUegsfWwYC55ssXZy\nqS+DtqjQn8MxKHKs/wXvHMJ9tfq+yo+bNkOKHqdRxCXAHJ+o3ZRvAdsMT/yFmmoZ\n4rBRRoJeTZ0UkZdOYsS5kRkNseDYTQf1MZVS9dbnYQKBgQD2WP6uYi8IrTxtrYox\nSPmMX2Dp5vFTEYwBvvurftjJaNQGOWFEIiPKWbSLBxSjuiLk7Y8sgWa+7HNtl4hj\nw4MnBVnTGnvLyABgW6pIvH10nKpsub/nCVE9kZq5FStkctAp99i/B1SPAUNlAFpk\nB9igzEaUujprQjhNcWd5WaRz8QKBgQDypWOTxUnxrT9zOChMMH/UpOMAlzzMMusL\nSUXE5iWp6fxCKdhQed6Osl40F8bqp9fIP4w5lLx4gkIxf+Hhlz84GWIpt/qRBLLu\nqN553dmJqxYB9/rbyXDBOoPfcWzRkkSb41gD/AvS5vI/90rdAB5iK0EI2aEp7GK+\nKTQD5lw9rQKBgAgyu/8Hq3MJeNpZjSDIwe1G+02tbtiJ2/Pu7Ccv6H0DbRLr8+21\niSVhyN1blfdA6Ype0YX0pHu0GL9L7LENP58b0XpyBi6o8EJEqq0TAMXRtOY7ZESH\nDdoTr2d7ad9E5uKOqfrpfonny9tfoKJ1lGL9iVfHvsv0/zSsknn6XruxAoGBAOzL\n1KrALVJqRXKXClSYPBf0Ngg8j7ujsVfZUPo/s9/nFiQnnA+lbzmI/oAN+DTGScIF\nqj4DVg6w6BJQf8rdBHgl5XNbNW9Sy6A3Mq5xf7tnOFoBfFIDe0NHbKyhj5XSDZyo\nOBvjXFKcySr9lZSpaf1ZwuT1Jd+47gAwS6/GnpwdAoGAaz7SnbzapMIu1RD56pv/\nNREeFFQYUvN6mHa1mWjYrNbLlRLNRH8B5Qi563JWJf+Ln6vIa4tYv5V0IphFGRHt\nKImhlsfn/XEKT6zndop8XRVG7k+bEuUcRKDtEdOUaIOnrw7gK/i9BJrxmGQfn88G\nHhOn9XUR17dg722Ii7k2OmI=\n-----END PRIVATE KEY-----\n',
                    description: 'Firebase Private Key',
                },
            ];
            for (const cred of firebaseCredentials) {
                await AppSecret.updateOrCreate({ key: cred.key }, cred);
            }
            return response.status(200).json({
                success: true,
                message: 'Credentials Firebase initialisés avec succès',
            });
        }
        catch (error) {
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de l\'initialisation des credentials',
                error: error.message,
            });
        }
    }
    async getSecret({ params, response }) {
        try {
            const secret = await AppSecret.findBy('key', params.key);
            if (!secret) {
                return response.status(404).json({
                    success: false,
                    message: 'Secret non trouvé',
                });
            }
            return response.status(200).json({
                success: true,
                secret: {
                    key: secret.key,
                    value: secret.value,
                    description: secret.description,
                },
            });
        }
        catch (error) {
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du secret',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=app_secrets_controller.js.map