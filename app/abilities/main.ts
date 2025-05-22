/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import User from '#models/user'
import { Bouncer } from '@adonisjs/bouncer'

/**
 * Delete the following ability to start from
 * scratch
 */
export const editUser = Bouncer.ability((user: User, targetUser: User, fields: string[]) => {
  if (user.role === 'admin' || user.role === 'superadmin') {
    return true
  }

  // Allow user to edit their own profile with certain fields

  const allowFields = ['firstName', 'lastName', 'phone', 'password']
  const isTryingToEditOnlyAllowedFields = fields.every((field: string) =>
    allowFields.includes(field)
  )

  // Allow user to edit their own profile
  if (user.id === targetUser.id && isTryingToEditOnlyAllowedFields) {
    return true
  }

  return false
})

export const deleteUser = Bouncer.ability((user: User) => {
  if (user.role === 'admin') {
    return true
  }
  return false
})

export const createProduct = Bouncer.ability((user: User) => {
  if (user.role === 'admin' || user.role === 'vendeur') {
    return true
  }
  return false
})

export const canUpdateOrDeleteProduct = Bouncer.ability((user: User, productUserId: number) => {
  if (user.role === 'admin') {
    return true
  }

  // Allow user to edit their own product
  if (user.id === productUserId) {
    return true
  }

  return false
})

export const showProductToAdmin = Bouncer.ability((user: User) => {
  if (user.role === 'admin') {
    return true
  }
  return false
})
