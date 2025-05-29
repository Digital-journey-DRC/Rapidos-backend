export const getUpdatableFields = (user, target) => {
    if (!(user.id === target.id || user.role === 'admin')) {
        return {
            error: {
                message: 'You are not authorized to update this user',
            },
        };
    }
    if (user.role === 'admin') {
        const dataToUpdate = {
            email: target.email,
            password: target.password,
            firstName: target.firstName,
            lastName: target.lastName,
            phone: target.phone,
            role: target.role,
            termsAccepted: target.termsAccepted,
        };
        return dataToUpdate;
    }
    const dataToUpdate = {
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
    };
    return dataToUpdate;
};
//# sourceMappingURL=datatoupdate.js.map