import { BasePolicy, Bouncer } from '@adonisjs/bouncer';
import abilities from '#start/abilities';
export default class RolePolicy extends BasePolicy {
    async accessByRole(user, permisssion) {
        if (!user) {
            return false;
        }
        const rolePolicy = abilities[user.role];
        if (!rolePolicy) {
            return false;
        }
        return rolePolicy.includes('**') || rolePolicy.includes(permisssion);
    }
}
export const policies = Bouncer.define('updateUser', (user, targetUser, fields) => {
    if (user.role === 'admin' || user.role === 'superadmin') {
        return true;
    }
    const allowFields = ['firstName', 'lastName', 'phone', 'password'];
    const isTryingToEditOnlyAllowedFields = fields.every((field) => allowFields.includes(field));
    if (user.id === targetUser.id && isTryingToEditOnlyAllowedFields) {
        return true;
    }
    return false;
});
//# sourceMappingURL=role_policy.js.map