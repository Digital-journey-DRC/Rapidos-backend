import axios from 'axios'

/**
 * Formate un numéro de téléphone au format international 243...
 * Exemples:
 *   +243826016607 → 243826016607
 *   0826016607 → 243826016607
 *   243826016607 → 243826016607 (déjà bon)
 */
function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  let cleaned = phone.replace(/\s+/g, '').trim()
  
  if (cleaned.startsWith('+243')) {
    return cleaned.substring(1)
  }
  
  if (cleaned.startsWith('243')) {
    return cleaned
  }
  
  if (cleaned.startsWith('0')) {
    return '243' + cleaned.substring(1)
  }
  
  return '243' + cleaned
}

async function envoyerSms(phone: string, otp: number): Promise<void> {
  const url = 'https://ee5nnq.api.infobip.com/sms/2/text/advanced'

  const headers = {
    'Authorization': 'App cdd6c07eb4ce70c02d63cb8b10c79cc6-742707c8-3a18-4428-b576-3683fee598e1',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  const formattedPhone = formatPhoneNumber(phone)

  const body = {
    messages: [
      {
        destinations: [{ to: formattedPhone }],
        from: 'InfoSMS',
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

async function envoyerSmsPersonnalise(phone: string, message: string): Promise<void> {
  const url = 'https://ee5nnq.api.infobip.com/sms/2/text/advanced'

  const headers = {
    'Authorization': 'App cdd6c07eb4ce70c02d63cb8b10c79cc6-742707c8-3a18-4428-b576-3683fee598e1',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  const formattedPhone = formatPhoneNumber(phone)

  const body = {
    messages: [
      {
        destinations: [{ to: formattedPhone }],
        from: 'InfoSMS',
        text: message,
      },
    ],
  }

  try {
    const response = await axios.post(url, body, { headers })
    console.log('SMS envoyé avec succès:', response.data)
    return response.data
  } catch (error) {
    console.error("Erreur lors de l'envoi du SMS:", error.response?.data || error.message)
    throw error
  }
}

export default {
  envoyerSms,
  envoyerSmsPersonnalise,
  formatPhoneNumber,
}
