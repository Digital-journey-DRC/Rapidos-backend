import User from '#models/user'

import { BasePolicy, Bouncer } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import abilities from '#start/abilities'

export default class RolePolicy extends BasePolicy {
  public async accessByRole(user: User, permisssion: string): Promise<AuthorizerResponse> {
    if (!user) {
      return false
    }
    const rolePolicy = abilities[user.role]
    if (!rolePolicy) {
      return false
    }

    return rolePolicy.includes('**') || rolePolicy.includes(permisssion)
  }
}

export const policies = Bouncer.define(
  'updateUser',
  (user: User, targetUser: User, fields: string[]) => {
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
  }
)
