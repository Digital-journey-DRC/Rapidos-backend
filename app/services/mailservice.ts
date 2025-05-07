import nodemailer from 'nodemailer'
import env from '#start/env'

export const Mailservice = {
  async configure() {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.get('MAIL_USER'),
        pass: env.get('MAIL_PASS'),
      },
    })
    return transporter
  },

  async sendMail(userEmail: string, otp: number) {
    const transporter = await this.configure()
    const mailOptions = {
      from: env.get('MAIL_USER'),
      to: userEmail,
      subject: "Vérification de l'adresse e-mail",
      text: `Votre code de vérification est : ${otp}`,
      html: `<h1>Votre code de vérification est : ${otp}</h1>`,
    }
    return transporter.sendMail(mailOptions)
  },
}
