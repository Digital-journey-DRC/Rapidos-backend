#!/bin/bash

# Script de test pour l'upload de photo du colis
# ================================================

BASE_URL="${BASE_URL:-http://localhost:3333}"
VENDEUR_UID="+243826016607"
VENDEUR_PWD="0826016607Makengo@"

echo "=========================================="
echo "TEST UPLOAD PHOTO COLIS (CORRECTION)"
echo "=========================================="
echo ""

# Étape 1: Connexion du vendeur
echo "🔐 ÉTAPE 1: Connexion du vendeur..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$VENDEUR_UID\", \"password\": \"$VENDEUR_PWD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Impossible de se connecter"
  echo "Réponse: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:30}..."
echo ""

# Étape 2: Récupération des commandes
echo "📋 ÉTAPE 2: Récupération des commandes en préparation..."
ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer $TOKEN")

echo "$ORDERS_RESPONSE" | jq '.commandes[] | select(.status == "en_preparation") | {id, orderId, status, total}' || echo "Aucune commande en préparation trouvée"

COMMANDE_ID=$(echo "$ORDERS_RESPONSE" | jq -r '.commandes[] | select(.status == "en_preparation") | .id' | head -1)

if [ -z "$COMMANDE_ID" ] || [ "$COMMANDE_ID" = "null" ]; then
  echo ""
  echo "⚠️  Aucune commande en préparation trouvée"
  echo "Les commandes disponibles:"
  echo "$ORDERS_RESPONSE" | jq '.commandes[] | {id, orderId, status}' | head -30
  echo ""
  echo "❌ Test interrompu: aucune commande en préparation"
  exit 1
fi

echo ""
echo "✅ Commande trouvée - ID numérique: $COMMANDE_ID"
echo ""

# Étape 3: Créer une image de test
echo "📸 ÉTAPE 3: Création de l'image de test..."
TEMP_IMAGE="/tmp/test_package_$(date +%s).jpg"
printf '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x7f\x00\xff\xd9' > "$TEMP_IMAGE"
echo "✅ Image créée: $TEMP_IMAGE"
echo ""

# Étape 4: Test upload de la photo
echo "📤 ÉTAPE 4: Upload de la photo (avec ID numérique: $COMMANDE_ID)..."
UPLOAD_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/ecommerce/commandes/$COMMANDE_ID/upload-package-photo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "packagePhoto=@$TEMP_IMAGE")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$UPLOAD_RESPONSE" | sed '/HTTP_CODE:/d')

echo ""
echo "Réponse HTTP: $HTTP_CODE"
echo "Corps de la réponse:"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Vérifier le résultat
if echo "$RESPONSE_BODY" | jq -e '.success == true' > /dev/null 2>&1; then
  CODE=$(echo "$RESPONSE_BODY" | jq -r '.data.codeColis')
  echo "✅✅✅ TEST RÉUSSI! ✅✅✅"
  echo "✅ Photo uploadée avec succès"
  echo "✅ Code généré: $CODE"
  echo ""
  echo "🎉 La correction fonctionne! L'endpoint utilise maintenant l'ID numérique."
else
  ERROR_MSG=$(echo "$RESPONSE_BODY" | jq -r '.message // .error // "Erreur inconnue"')
  echo "❌ TEST ÉCHOUÉ"
  echo "❌ Erreur: $ERROR_MSG"
  exit 1
fi

# Nettoyer
rm -f "$TEMP_IMAGE"

echo ""
echo "=========================================="
echo "TEST TERMINÉ"
echo "=========================================="

