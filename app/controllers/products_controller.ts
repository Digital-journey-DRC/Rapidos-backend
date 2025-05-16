import Media from '#models/media'
import Product from '#models/product'
import { createProductValidator } from '#validators/products'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async index({ request, response, auth,params }: HttpContext) {
      const user = auth.user!
      const idVendeur = params.userId
    if (!user) {
      return response
        .status(401)
        .json({ message: "Vous n'etes pas authoriser à faire cette actions" })
    }
    try {
        const payload = await request.validateUsing(createProductValidator)
        const isProductExist = await Product.findBy('name', payload.name)
        if(isProductExist?.vendeurId !== idVendeur){
            return response.status(401).json({ message: "Ce produit existe déjà" })
        }
        const product = await Product.create({ ...payload, vendeurId: idVendeur })
        const productMedia = request.input('media')
        if (productMedia) {
            await Media.createMany({})
            await product.related('media').attach(productMedia.map((media: any) => media.id))
        return response.status(201).json({ message: 'Produit créé avec succès', product })
       
    } catch (error) {
        
    }
  }
}
