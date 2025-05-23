import { Bouncer } from '@adonisjs/bouncer';
export const editUser = Bouncer.ability((user, targetUser, fields) => {
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
export const deleteUser = Bouncer.ability((user) => {
    if (user.role === 'admin') {
        return true;
    }
    return false;
});
export const createProduct = Bouncer.ability((user) => {
    if (user.role === 'admin' || user.role === 'vendeur') {
        return true;
    }
    return false;
});
export const canUpdateOrDeleteProduct = Bouncer.ability((user, productUserId) => {
    if (user.role === 'admin') {
        return true;
    }
    if (user.id === productUserId) {
        return true;
    }
    return false;
});
export const canCreateOrDeleteCategory = Bouncer.ability((user) => {
    if (user.role === 'admin' || user.role === 'superadmin') {
        return true;
    }
    return false;
});
export const showProductToAdmin = Bouncer.ability((user) => {
    if (user.role === 'admin') {
        return true;
    }
    return false;
});
//# sourceMappingURL=main.js.map