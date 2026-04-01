# Système SMS & OTP — Rapidos Backend

## Vue d'ensemble

Le système d'envoi de SMS et de vérification OTP est utilisé pour :

- **Inscription** : envoi d'un code OTP après création du compte
- **Mot de passe oublié** : envoi d'un code de réinitialisation
- **Changement de numéro de téléphone** : vérification du nouveau numéro

---

## Services

### 1. `smsservice` — Envoi de SMS via Infobip

**Fichier :** `app/services/smsservice.ts`

#### `envoyerSms(phone, otp)`

Envoie un SMS contenant le code OTP au numéro fourni.

| Paramètre | Type     | Description                          |
|-----------|----------|--------------------------------------|
| `phone`   | `string` | Numéro de téléphone du destinataire  |
| `otp`     | `number` | Code OTP à 6 chiffres               |

- **API** : Infobip (`/sms/2/text/advanced`)
- **Expéditeur** : `InfoSMS`
- **Message** : `Votre code de vérification est : XXXXXX. Il est valide pour 5 minutes.`

#### `envoyerSmsPersonnalise(phone, message)`

Envoie un SMS avec un message personnalisé (pas forcément un OTP).

#### `formatPhoneNumber(phone)`

Formate le numéro au format international RDC (`243...`) :

| Entrée          | Sortie          |
|-----------------|-----------------|
| `+243826016607` | `243826016607`  |
| `0826016607`    | `243826016607`  |
| `243826016607`  | `243826016607`  |

---

### 2. `WhatsappService` — Fallback WhatsApp

**Fichier :** `app/exceptions/whatssapotpservice.ts`

Utilisé en cas d'échec de l'envoi SMS. Envoie l'OTP via l'API WhatsApp Business (Meta Graph API) avec le template `otp_3` en français.

```
SMS échoue → tentative WhatsApp → si WhatsApp échoue aussi, erreur loggée
```

---

### 3. `generateOtp` — Génération du code OTP

**Fichier :** `app/services/generateotp.ts`

Génère un code OTP à **6 chiffres** (100000–999999) avec une expiration de **50 minutes**.

```typescript
const { otpCode, otpExpiredAt } = generateOtp()
// otpCode: 483921
// otpExpiredAt: Date (now + 50 min)
```

---

## Flux d'utilisation

### Inscription (`register`)

```
1. Création utilisateur
2. generateOtp() → { otpCode, otpExpiredAt }
3. setUserOtp(user, otpCode, otpExpiredAt)  → stocke l'OTP en base
4. smsservice.envoyerSms(phone, otp)        → envoie le SMS
5. Réponse avec id utilisateur + otp + expiresAt
```

### Mot de passe oublié (`forgotPassWord`)

```
1. Recherche utilisateur par numéro de téléphone
2. generateOtp()
3. setUserOtp()
4. smsservice.envoyerSms()
5. Réponse succès
```

### Changement de numéro (`updatePhone` + `verifyPhoneOtp`)

```
1. Génération OTP
2. Tentative SMS au nouveau numéro
   └─ En cas d'échec : fallback WhatsApp
3. L'utilisateur soumet l'OTP reçu + nouveau numéro
4. Vérification OTP (validité + expiration)
5. Mise à jour du numéro de téléphone
```

---

## Endpoints concernés

| Méthode | Route                     | Action                              |
|---------|---------------------------|-------------------------------------|
| POST    | `/register`               | Inscription + envoi OTP             |
| POST    | `/verify-otp/:userId`     | Vérification OTP après inscription  |
| POST    | `/forgot-password`        | Envoi OTP pour reset mot de passe   |
| POST    | `/reset-password`         | Réinitialisation avec OTP           |
| POST    | `/users/update-phone`     | Demande changement de numéro        |
| POST    | `/users/verify-phone-otp` | Confirmation changement de numéro   |

---

## ⚠️ Notes importantes

- L'API key Infobip est actuellement **en dur** dans le code source. Il est recommandé de la déplacer dans les variables d'environnement.
- Le commentaire dans `generateOtp` indique 10 minutes, mais le code génère une expiration de **50 minutes** (`50 * 60 * 1000`).
- Le token WhatsApp est correctement lu depuis `env.get('WHATSAPP_TOKEN')`.
