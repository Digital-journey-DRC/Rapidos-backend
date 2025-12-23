import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import PaymentMethod from './payment_method.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export enum EcommerceOrderStatus {
  PENDING = 'pending',
  EN_PREPARATION = 'colis en cours de préparation',
  PRET_A_EXPEDIER = 'prêt à expédier',
  EN_ROUTE = 'en route pour livraison',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export default class EcommerceOrder extends BaseModel {
  static table = 'ecommerce_orders'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: string

  @column()
  declare status: EcommerceOrderStatus

  @column()
  declare clientId: number

  @column()
  declare client: string

  @column()
  declare phone: string

  @column()
  declare vendorId: number

  @column()
  declare deliveryPersonId: number | null

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare items: Array<{
    productId: number
    name: string
    price: number
    quantity: number
    idVendeur: number
  }>

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare address: {
    ville: string
    commune: string
    quartier: string
    avenue: string
    numero: string
    pays: string
    codePostale: string
  }

  @column()
  declare total: number

  @column()
  declare packagePhoto: string | null

  @column()
  declare packagePhotoPublicId: string | null

  @column()
  declare paymentMethodId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => PaymentMethod, {
    foreignKey: 'paymentMethodId',
  })
  declare paymentMethod: BelongsTo<typeof PaymentMethod>
}
