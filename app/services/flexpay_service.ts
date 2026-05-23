import axios from 'axios'

type InitiatePaymentInput = {
  phone: string
  reference: string
  amount: string
  currency: string
}

type InitiatePaymentResponse = {
  code?: string | number
  message?: string
  orderNumber?: string
}

const FLEXPAY_BASE_URL = 'https://backend.flexpay.cd/api/rest/v1/paymentService'
const FLEXPAY_BEARER_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIvbG9naW4iLCJyb2xlcyI6WyJNRVJDSEFOVCJdLCJleHAiOjE4NDE5MTI3NjQsInN1YiI6IjJmYTc4ZGVkOTM0NmI0MGY4YTQ0ZTk4ZjYwMjRiMjk0In0.m6YaY-6Ni9catYnB4NjXSoHQoqSIFlP_WxXbk-Vq0aw'
const FLEXPAY_MERCHANT = 'RPD'
const FLEXPAY_CALLBACK_URL = 'https://webhook.site/4a416adf-2bf5-4071-bf3b-d184799c54e1'
const FLEXPAY_PAYMENT_TYPE = '1'

function formatPhoneForFlexpay(rawPhone: string): string {
  const digits = String(rawPhone || '').replace(/\D/g, '')

  // Déjà au format attendu: 243XXXXXXXXX
  if (digits.startsWith('243') && digits.length === 12) {
    return digits
  }

  // Entrée locale 0XXXXXXXXX -> 243XXXXXXXXX
  if (digits.startsWith('0') && digits.length >= 10) {
    return `243${digits.slice(1)}`
  }

  // Entrée locale sans 0: XXXXXXXXX -> 243XXXXXXXXX
  if (digits.length === 9) {
    return `243${digits}`
  }

  // Fallback: retirer simplement le +
  return digits
}

export const FlexpayService = {
  async initiateMobilePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResponse> {
    const formattedPhone = formatPhoneForFlexpay(input.phone)

    const { data } = await axios.post(
      FLEXPAY_BASE_URL,
      {
        merchant: FLEXPAY_MERCHANT,
        type: FLEXPAY_PAYMENT_TYPE,
        phone: formattedPhone,
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
        callbackUrl: FLEXPAY_CALLBACK_URL,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FLEXPAY_BEARER_TOKEN}`,
        },
        timeout: 15000,
      }
    )

    return data
  },
}
