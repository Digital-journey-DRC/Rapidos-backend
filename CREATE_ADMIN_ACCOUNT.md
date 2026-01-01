# 👤 Créer un compte Admin avec curl

## 📋 Endpoint

**POST** `/register`

## 🔑 Body de la requête

```json
{
  "email": "admin@rapidos.com",
  "password": "Admin@123456",
  "firstName": "Admin",
  "lastName": "Rapidos",
  "phone": "+243900000000",
  "role": "admin",
  "termsAccepted": true
}
```

## 📝 Détails des champs

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `email` | string | Email unique (sera converti en minuscules) | `admin@rapidos.com` |
| `password` | string | Min 12 caractères, doit contenir: majuscule, minuscule, chiffre, caractère spécial | `Admin@123456` |
| `firstName` | string | Prénom (2-50 caractères) | `Admin` |
| `lastName` | string | Nom (2-50 caractères) | `Rapidos` |
| `phone` | string | Format international (+ suivi de 1-14 chiffres) | `+243900000000` |
| `role` | enum | Rôle: `admin`, `superadmin`, `vendeur`, `acheteur`, `livreur` | `admin` |
| `termsAccepted` | boolean | Acceptation des termes (obligatoire) | `true` |

## 🧪 Commande curl complète

```bash
curl -X POST http://localhost:3333/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rapidos.com",
    "password": "Admin@123456",
    "firstName": "Admin",
    "lastName": "Rapidos",
    "phone": "+243900000000",
    "role": "admin",
    "termsAccepted": true
  }'
```

## 📤 Réponse en cas de succès

```json
{
  "message": "saisir le opt pour continuer",
  "status": 201,
  "id": 123,
  "otp": 123456,
  "expiresAt": "2024-01-15T10:30:00.000Z"
}
```

## ⚠️ Notes importantes

1. **OTP requis** : Après la création, un code OTP sera envoyé par SMS au numéro de téléphone fourni
2. **Vérification OTP** : Vous devrez vérifier l'OTP avec l'endpoint `POST /verify-otp/:userId`
3. **Statut du compte** : Pour les admins, le compte est automatiquement activé (pas besoin d'attendre l'activation)
4. **Email et téléphone** : Doivent être uniques dans la base de données

## 🔄 Workflow complet

### Étape 1 : Créer le compte admin

```bash
curl -X POST http://localhost:3333/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rapidos.com",
    "password": "Admin@123456",
    "firstName": "Admin",
    "lastName": "Rapidos",
    "phone": "+243900000000",
    "role": "admin",
    "termsAccepted": true
  }'
```

**Réponse :**
```json
{
  "message": "saisir le opt pour continuer",
  "status": 201,
  "id": 123,
  "otp": 123456,
  "expiresAt": "2024-01-15T10:30:00.000Z"
}
```

### Étape 2 : Vérifier l'OTP

```bash
curl -X POST http://localhost:3333/verify-otp/123 \
  -H "Content-Type: application/json" \
  -d '{
    "otp": 123456
  }'
```

**Réponse :**
```json
{
  "type": "bearer",
  "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "30 days",
  "userId": 123
}
```

### Étape 3 : Se connecter (optionnel)

```bash
curl -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "admin@rapidos.com",
    "password": "Admin@123456"
  }'
```

## 🎯 Rôles disponibles

- `admin` : Administrateur standard
- `superadmin` : Super administrateur
- `vendeur` : Vendeur
- `acheteur` : Acheteur (par défaut)
- `livreur` : Livreur

## 🔐 Exigences du mot de passe

- Minimum 12 caractères
- Maximum 64 caractères
- Au moins une majuscule (A-Z)
- Au moins une minuscule (a-z)
- Au moins un chiffre (0-9)
- Au moins un caractère spécial (!@#$%^&*...)

## 📱 Format du téléphone

Format international : `+[code pays][numéro]`

Exemples valides :
- `+243900000000` (RDC)
- `+33612345678` (France)
- `+12125551234` (USA)

## ❌ Erreurs possibles

### Email déjà utilisé
```json
{
  "message": "Données invalides",
  "errors": {
    "email": ["The email has already been taken"]
  }
}
```

### Téléphone déjà utilisé
```json
{
  "message": "Données invalides",
  "errors": {
    "phone": ["The phone has already been taken"]
  }
}
```

### Mot de passe invalide
```json
{
  "message": "Données invalides",
  "errors": {
    "password": ["The password must be at least 12 characters"]
  }
}
```

