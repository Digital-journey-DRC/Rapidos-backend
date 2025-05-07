import User from '#models/user'
import abilities from '#start/abilities'

export const generateAccessToken = async (user: User) => {
  try {
    const accesToken = await User.accessTokens.create(user, abilities[user.role])
    return accesToken
  } catch (error) {}
}
