import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import PaymentMethod from './payment_method.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export enum EcommerceOrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING = 'pending',
  EN_PREPARATION = 'en_preparation',
  PRET_A_EXPEDIER = 'pret_a_expedier',
  ACCEPTE_LIVREUR = 'accepte_livreur',
  EN_ROUTE = 'en_route',
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
    prepare: (value: any) => {
      if (typeof value === 'string') return value
      return JSON.stringify(value)
    },
    consume: (value: any) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return value || []
    },
  })
  declare items: Array<{
    productId: number
    name: string
    price: number
    quantity: number
    idVendeur: number
  }>

  @column({
    prepare: (value: any) => {
      if (typeof value === 'string') return value
      return JSON.stringify(value)
    },
    consume: (value: any) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      }
      return value || {}
    },
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
  declare codeColis: string | null

  @column()
  declare paymentMethodId: number | null

  @column()
  declare numeroPayment: string | null

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column()
  declare distanceKm: number | null

  @column()
  declare deliveryFee: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => PaymentMethod, {
    foreignKey: 'paymentMethodId',
  })
  declare paymentMethod: BelongsTo<typeof PaymentMethod>
}
