// abilities.js
const abilities = {
  acheteur: ['create:order', 'read:product', 'create:profil', 'update:profil', 'delete:order'],
  vendeur: [
    'create:product',
    'update:product',
    'delete:product',
    'read:order',
    'create:profil',
    'update:profil',
  ],
  livreur: ['read:order', 'update:order:status', 'read:profil', 'update:profil'],
  admin: ['*'], // accès total
  superadmin: ['*'], // accès total
}

export default abilities
