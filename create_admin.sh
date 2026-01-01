#!/bin/bash

# 🧪 Script pour créer un compte admin
# Usage: ./create_admin.sh [email] [password] [phone]

BASE_URL="http://localhost:3333"

# Valeurs par défaut ou arguments
EMAIL="${1:-admin@rapidos.com}"
PASSWORD="${2:-Admin@123456}"
PHONE="${3:-+243900000000}"

echo "👤 Création d'un compte admin"
echo "=============================="
echo ""
echo "📧 Email: $EMAIL"
echo "📱 Téléphone: $PHONE"
echo "🔑 Mot de passe: $PASSWORD"
echo ""

# Étape 1 : Créer le compte
echo "📋 ÉTAPE 1: Création du compte..."
RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"Rapidos\",
    \"phone\": \"$PHONE\",
    \"role\": \"admin\",
    \"termsAccepted\": true
  }")

echo "$RESPONSE" | jq .

# Extraire l'ID et l'OTP
USER_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
OTP=$(echo "$RESPONSE" | jq -r '.otp // empty')

if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
  echo ""
  echo "❌ Erreur lors de la création du compte"
  exit 1
fi

echo ""
echo "✅ Compte créé avec succès !"
echo "🆔 User ID: $USER_ID"
echo "🔢 OTP: $OTP"
echo ""

# Étape 2 : Vérifier l'OTP
if [ -n "$OTP" ] && [ "$OTP" != "null" ]; then
  echo "📋 ÉTAPE 2: Vérification de l'OTP..."
  TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/verify-otp/$USER_ID" \
    -H "Content-Type: application/json" \
    -d "{\"otp\": $OTP}")
  
  echo "$TOKEN_RESPONSE" | jq .
  
  TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.value // empty')
  
  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo ""
    echo "✅ Compte activé avec succès !"
    echo "🔑 Token: $TOKEN"
    echo ""
    echo "📝 Vous pouvez maintenant vous connecter avec:"
    echo "   Email/Téléphone: $EMAIL"
    echo "   Mot de passe: $PASSWORD"
  else
    echo ""
    echo "⚠️  OTP non vérifié automatiquement. Vérifiez manuellement avec:"
    echo "   curl -X POST $BASE_URL/verify-otp/$USER_ID -H \"Content-Type: application/json\" -d '{\"otp\": $OTP}'"
  fi
fi

echo ""
echo "🎉 Processus terminé !"

