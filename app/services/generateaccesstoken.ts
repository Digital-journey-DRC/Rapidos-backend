import User from '#models/user'
import abilities from '#start/abilities'

export const generateAccessToken = async (user: User, _p0: { abilities: string[] }) => {
  try {
    const role = user.role as keyof typeof abilities

    const accesToken = await User.accessTokens.create(user, abilities[role])

    return accesToken
  } catch (error) {
    console.error('Error generating access token:', error)
    throw new Error('Failed to generate access token')
  }
}
