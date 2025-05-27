import vine, { SimpleMessagesProvider } from '@vinejs/vine';
vine.messagesProvider = new SimpleMessagesProvider({
    'required': 'Le champ {{field}} est obligatoire.',
    'email': 'Le champ {{field}} doit être une adresse e-mail valide.',
    'minLength': 'Le champ {{field}} doit contenir au moins {{min}} caractères.',
    'maxLength': 'Le champ {{field}} ne doit pas dépasser {{max}} caractères.',
    'regex': 'Le format du champ {{field}} est invalide.',
    'enum': 'La valeur du champ {{field}} est invalide.',
    'boolean': 'Le champ {{field}} doit être un booléen.',
    'escape': 'Le champ {{field}} contient des caractères non autorisés.',
    'trim': 'Le champ {{field}} ne doit pas contenir d’espaces superflus.',
    'toLowerCase': 'Le champ {{field}} doit être en minuscules.',
    'strict': 'Le champ {{field}} doit être strictement un booléen.',
    'unique': 'La valeur du champ {{field}} doit être unique.',
    'database.unique': 'Le champ {{field}} existe déjà.',
    'phone.regex': 'Le numéro de téléphone doit être au format international (ex: +243xxxxxxxxxx).',
    'password.minLength': 'Le mot de passe doit contenir au moins {{min}} caractères.',
    'password.maxLength': 'Le mot de passe ne doit pas dépasser {{max}} caractères.',
    'password.regex': 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.',
    'termsAccepted.boolean': 'Vous devez accepter les conditions générales.',
    'termsAccepted.required': 'Vous devez accepter les conditions générales.',
});
//# sourceMappingURL=validator.js.map