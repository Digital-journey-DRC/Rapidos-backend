import nodemailer from 'nodemailer';
import env from '#start/env';
export const Mailservice = {
    async configure() {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: true,
                auth: {
                    user: env.get('MAIL_USER'),
                    pass: env.get('MAIL_PASS'),
                },
            });
            return transporter;
        }
        catch (error) {
            throw new Error('Erreur de configuration du transporteur', error);
        }
    },
    async sendMail(userEmail, otp) {
        try {
            const transporter = await this.configure();
            const mailOptions = {
                from: env.get('MAIL_USER'),
                to: userEmail,
                subject: "Vérification de l'adresse e-mail",
                text: `Votre code de vérification est : ${otp}`,
            };
            return transporter.sendMail(mailOptions);
        }
        catch (error) {
            throw new Error("Erreur lors de l'envoi de l'email", error);
        }
    },
};
//# sourceMappingURL=mailservice.js.map