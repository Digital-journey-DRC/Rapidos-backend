import vine from '@vinejs/vine'

export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().escape().minLength(2).maxLength(50),
    description: vine.string().trim().escape().minLength(2).maxLength(500),
    price: vine.number().positive(),
    stock: vine.number().positive(),
    category: vine.string().trim().minLength(2).maxLength(50),
  })
)
