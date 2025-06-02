import User from '#models/user';
import abilities from '#start/abilities';
export const generateAccessToken = async (user, _p0) => {
    try {
        const role = user.role;
        const accesToken = await User.accessTokens.create(user, abilities[role]);
        return accesToken;
    }
    catch (error) {
        console.error('Error generating access token:', error);
        throw new Error('Failed to generate access token');
    }
};
//# sourceMappingURL=generateaccesstoken.js.map