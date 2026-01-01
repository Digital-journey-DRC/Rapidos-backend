import vine from '@vinejs/vine'

export const categoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(50),
    description: vine.string().trim().minLength(2).maxLength(500).optional(),
  })
)
