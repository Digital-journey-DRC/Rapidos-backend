import vine from '@vinejs/vine'

export const createHoraireOuvertureValidator = vine.compile(
  vine.object({
    jour: vine.string().in(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']),
    heureOuverture: vine.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    heureFermeture: vine.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    estOuvert: vine.boolean().optional(),
  })
)

export const updateHoraireOuvertureValidator = vine.compile(
  vine.object({
    heureOuverture: vine.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    heureFermeture: vine.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    estOuvert: vine.boolean().optional(),
  })
)

