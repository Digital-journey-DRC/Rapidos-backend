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
    admin: ['*'],
    superadmin: ['*'],
};
export default abilities;
//# sourceMappingURL=abilities.js.map