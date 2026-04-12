import vine from '@vinejs/vine'

export const createPromotionValidator = vine.compile(
  vine.object({
    productId: vine.number().positive(),
    libelle: vine.string().trim().escape().minLength(2).maxLength(200),
    likes: vine.number().min(0).optional(),
    dateDebutPromotion: vine.string().transform((value) => {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error('Le format de la date de début est invalide (ex: 2026-04-12T08:00:00)')
      }
      return date
    }).optional(),
    delaiPromotion: vine.string().transform((value) => {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error('Le format de la date de fin est invalide (ex: 2026-05-12T08:00:00)')
      }
      return date
    }),
    nouveauPrix: vine.number().positive(),
    ancienPrix: vine.number().positive(),
  })
)

export const updatePromotionValidator = vine.compile(
  vine.object({
    // productId ne devrait JAMAIS être modifié pour une promotion existante
    libelle: vine.string().trim().escape().minLength(2).maxLength(200).optional(),
    likes: vine.number().min(0).optional(),
    dateDebutPromotion: vine.string().transform((value) => {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format')
      }
      return date
    }).optional(),
    delaiPromotion: vine.string().transform((value) => {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format')
      }
      return date
    }).optional(),
    nouveauPrix: vine.number().positive().optional(),
    ancienPrix: vine.number().positive().optional(),
  })
)


