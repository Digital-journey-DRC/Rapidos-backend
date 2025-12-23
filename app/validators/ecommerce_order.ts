import vine from '@vinejs/vine'

export const createOrderValidator = vine.compile(
  vine.object({
    produits: vine.array(
      vine.object({
        id: vine.number(),
        nom: vine.string(),
        prix: vine.number(),
        quantite: vine.number().min(1),
        idVendeur: vine.number(),
      })
    ),
    ville: vine.string().trim().minLength(2),
    commune: vine.string().trim().minLength(2),
    quartier: vine.string().trim().minLength(2),
    avenue: vine.string().trim(),
    numero: vine.string().trim(),
    pays: vine.string().trim().minLength(2),
    codePostale: vine.string().trim(),
    paymentMethodId: vine.number().optional(),
  })
)

export const updateStatusValidator = vine.compile(
  vine.object({
    status: vine.enum([
      'pending',
      'colis en cours de préparation',
      'prêt à expédier',
      'en route pour livraison',
      'delivered',
      'cancelled',
      'rejected',
    ]),
    reason: vine.string().trim().optional(),
  })
)
