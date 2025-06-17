import axios from 'axios'

async function envoyerSms(phone: string, otp: number): Promise<void> {
  const url = 'https://nmlygy.api.infobip.com/sms/2/text/advanced'

  const headers = {
    'Authorization': 'App d5819848b9e86ee925a9ec584c4d1d91-9ed8758c-2081-4ac2-9192-b2d136e782dd',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  const body = {
    messages: [
      {
        destinations: [{ to: phone }],
        from: '447491163443',
        text: `Votre code de vérification est : ${otp}. Il est valide pour 5 minutes.`,
      },
    ],
  }

  try {
    const response = await axios.post(url, body, { headers })
    console.log('SMS envoyé avec succès:', response.data)
  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS:", error.response?.data || error.message)
  }
}

export default {
  envoyerSms,
}
