import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export enum CommandeExpressStatus {
  PENDING = 'pending',
  EN_COURS = 'en_cours',
  LIVRE = 'livre',
  ANNULE = 'annule',
}

export default class CommandeExpress extends BaseModel {
  static table = 'commande_express'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: string

  @column()
  declare clientId: number

  @column()
  declare clientName: string

  @column()
  declare clientPhone: string

  @column()
  declare vendorId: number

  @column()
  declare packageValue: number

  @column()
  declare packageDescription: string

  @column()
  declare pickupAddress: string

  @column()
  declare deliveryAddress: string

  @column()
  declare pickupReference: string | null

  @column()
  declare deliveryReference: string | null

  @column()
  declare createdBy: number

  @column()
  declare statut: CommandeExpressStatus

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
    productId?: number
    name: string
    description?: string
    price?: number
    quantity: number
    weight?: string
    urlProduct?: string
  }>

  @column()
  declare deliveryPersonId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
