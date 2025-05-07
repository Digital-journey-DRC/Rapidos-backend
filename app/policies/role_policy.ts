import User from '#models/user'

import { BasePolicy } from '@adonisjs/bouncer'
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
