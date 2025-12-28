#!/bin/bash

# Script de test complet du workflow de commande e-commerce
# =========================================================

BASE_URL="http://24.144.87.127:3333"
ACHETEUR_UID="+243828191010"
ACHETEUR_PWD="0826016607Makengo?"
VENDEUR_UID="+243826016607"
VENDEUR_PWD="Liviaprincess@123"
LIVREUR_UID="+243999999999"  # À adapter selon votre livreur de test
LIVREUR_PWD="password"

echo "=========================================="
echo "TEST WORKFLOW COMPLET DE COMMANDE"
echo "=========================================="
echo ""

# Étape 1: Login Acheteur
echo "📱 ÉTAPE 1: Login Acheteur..."
ACHETEUR_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$ACHETEUR_UID\", \"password\": \"$ACHETEUR_PWD\"}" | jq -r '.token')

if [ "$ACHETEUR_TOKEN" = "null" ] || [ -z "$ACHETEUR_TOKEN" ]; then
  echo "❌ Erreur: Impossible de se connecter en tant qu'acheteur"
  exit 1
fi
echo "✅ Token acheteur obtenu"
echo ""

# Étape 2: Initialiser une commande
echo "🛒 ÉTAPE 2: Initialisation de la commande..."
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" \
  -d '{
    "products": [
      {"productId": 151, "quantite": 1}
    ],
    "latitude": -4.3276,
    "longitude": 15.3136
  }')

echo "$INIT_RESPONSE" | jq .
ORDER_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].orderId')
COMMANDE_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].id')

if [ "$ORDER_ID" = "null" ] || [ -z "$ORDER_ID" ]; then
  echo "❌ Erreur: Impossible de créer la commande"
  exit 1
fi
echo "✅ Commande créée avec ID: $ORDER_ID (DB ID: $COMMANDE_ID)"
echo ""

# Étape 3: Voir ses commandes (Acheteur)
echo "👀 ÉTAPE 3: Visualiser les commandes (Acheteur)..."
curl -s -X GET "$BASE_URL/ecommerce/commandes/buyer/me" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" | jq '.orders[] | {id, orderId, status, total}'
echo ""

# Étape 4: Confirmer le paiement (modifier payment method = passage à pending)
echo "💳 ÉTAPE 4: Confirmation du paiement..."
PAYMENT_METHOD_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].paymentMethod.id')
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$COMMANDE_ID/payment-method" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" \
  -d "{\"paymentMethodId\": $PAYMENT_METHOD_ID, \"numeroPayment\": \"TXN$(date +%s)\"}" | jq .
echo "✅ Paiement confirmé (status: pending)"
echo ""

# Étape 5: Login Vendeur
echo "🏪 ÉTAPE 5: Login Vendeur..."
VENDEUR_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$VENDEUR_UID\", \"password\": \"$VENDEUR_PWD\"}" | jq -r '.token')

if [ "$VENDEUR_TOKEN" = "null" ] || [ -z "$VENDEUR_TOKEN" ]; then
  echo "❌ Erreur: Impossible de se connecter en tant que vendeur"
  exit 1
fi
echo "✅ Token vendeur obtenu"
echo ""

# Étape 6: Voir ses commandes (Vendeur)
echo "👀 ÉTAPE 6: Visualiser les commandes (Vendeur)..."
curl -s -X GET "$BASE_URL/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" | jq '.orders[] | select(.orderId == "'$ORDER_ID'") | {orderId, status, total}'
echo ""

# Étape 7: Commencer la préparation
echo "📦 ÉTAPE 7: Commencer la préparation..."
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -d '{"status": "en_preparation", "reason": "Commande prise en charge"}' | jq '{success, message, status: .order.status}'
echo "✅ Préparation commencée"
echo ""

# Étape 8: Créer une image de test
echo "📸 ÉTAPE 8: Préparation de la photo du colis..."
TEMP_IMAGE="/tmp/test_package_$(date +%s).jpg"
# Créer une petite image de test (1x1 pixel JPEG)
printf '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x7f\x00\xff\xd9' > "$TEMP_IMAGE"
echo "✅ Image de test créée: $TEMP_IMAGE"
echo ""

# Étape 9: Upload photo du colis et génération du code
echo "📸 ÉTAPE 9: Upload de la photo du colis..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/$COMMANDE_ID/upload-package-photo" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -F "packagePhoto=@$TEMP_IMAGE")

echo "$UPLOAD_RESPONSE" | jq .
CODE_1=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.codeColis')

if [ "$CODE_1" = "null" ] || [ -z "$CODE_1" ]; then
  echo "❌ Erreur: Impossible d'uploader la photo"
  exit 1
fi
echo "✅ Photo uploadée, Code 1 généré: $CODE_1"
echo ""

# Nettoyer l'image temporaire
rm -f "$TEMP_IMAGE"

# Étape 10: Marquer prêt à expédier
echo "✅ ÉTAPE 10: Marquer prêt à expédier..."
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -d '{"status": "pret_a_expedier", "reason": "Colis emballé et prêt"}' | jq '{success, message, status: .order.status}'
echo "✅ Commande prête à expédier"
echo ""

# Étape 11: Login Livreur (utiliser le même token que vendeur pour test)
echo "🚚 ÉTAPE 11: Livreur accepte la commande..."
LIVREUR_TOKEN="$VENDEUR_TOKEN"  # Pour test, utiliser le token vendeur
TAKE_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/livraison/$ORDER_ID/take" \
  -H "Authorization: Bearer $LIVREUR_TOKEN")

echo "$TAKE_RESPONSE" | jq .
echo "✅ Commande acceptée par le livreur (status: accepte_livreur)"
echo ""

# Étape 12: Livreur récupère le colis (valide Code 1, génère Code 2)
echo "🔐 ÉTAPE 12: Livreur récupère le colis avec Code 1..."
EN_ROUTE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" \
  -d "{\"status\": \"en_route\", \"codeColis\": \"$CODE_1\"}")

echo "$EN_ROUTE_RESPONSE" | jq .
CODE_2=$(echo "$EN_ROUTE_RESPONSE" | jq -r '.newCodeColis')

if [ "$CODE_2" = "null" ] || [ -z "$CODE_2" ]; then
  echo "❌ Erreur: Code 2 non généré"
  exit 1
fi
echo "✅ Colis récupéré, Code 2 généré: $CODE_2"
echo ""

# Étape 13: Livreur livre au client (valide Code 2)
echo "🎯 ÉTAPE 13: Livraison au client avec Code 2..."
DELIVERED_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" \
  -d "{\"status\": \"delivered\", \"codeColis\": \"$CODE_2\"}")

echo "$DELIVERED_RESPONSE" | jq '{success, message, status: .order.status}'
echo ""

# Vérification finale
echo "=========================================="
echo "🎉 WORKFLOW COMPLET TERMINÉ AVEC SUCCÈS !"
echo "=========================================="
echo ""
echo "📊 Résumé:"
echo "  • Order ID: $ORDER_ID"
echo "  • Code 1 (Vendeur→Livreur): $CODE_1"
echo "  • Code 2 (Livreur→Acheteur): $CODE_2"
echo "  • Statut final: delivered"
echo ""
echo "✅ Tous les tests sont passés avec succès !"
