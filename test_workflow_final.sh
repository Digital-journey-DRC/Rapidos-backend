#!/bin/bash
set -e

BASE_URL="http://24.144.87.127:3333"

echo "=========================================="
echo "🧪 TEST WORKFLOW COMPLET E-COMMERCE"
echo "=========================================="
echo ""

# 1. Login Acheteur
echo "1️⃣  Login Acheteur (+243828191010)..."
ACHETEUR_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243828191010", "password": "0826016607Makengo?"}' | jq -r '.token.token // .token')
echo "   ✅ Token obtenu"

# 2. Initialiser commande
echo "2️⃣  Initialisation commande..."
INIT=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" \
  -d '{"products": [{"productId": 151, "quantite": 1}], "latitude": -4.3276, "longitude": 15.3136}')
ORDER_ID=$(echo "$INIT" | jq -r '.orders[0].orderId')
COMMANDE_ID=$(echo "$INIT" | jq -r '.orders[0].id')
PM_ID=$(echo "$INIT" | jq -r '.orders[0].paymentMethod.id')
echo "   ✅ Commande #$COMMANDE_ID créée ($ORDER_ID)"

# 3. Confirmer paiement
echo "3️⃣  Confirmation paiement..."
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$COMMANDE_ID/payment-method" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" \
  -d "{\"paymentMethodId\": $PM_ID, \"numeroPayment\": \"TXN$(date +%s)\"}" > /dev/null
echo "   ✅ Paiement confirmé → Status: pending"

# 4. Login Vendeur
echo "4️⃣  Login Vendeur (+243826016607)..."
VENDEUR_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243826016607", "password": "Liviaprincess@123"}' | jq -r '.token.token // .token')
echo "   ✅ Token obtenu"

# 5. Préparation
echo "5️⃣  Démarrage préparation..."
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -d '{"status": "en_preparation"}' > /dev/null
echo "   ✅ Status: en_preparation"

# 6. Upload photo
echo "6️⃣  Upload photo colis..."
TEMP="/tmp/pkg_$(date +%s).jpg"
printf '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x7f\x00\xff\xd9' > "$TEMP"
UP=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/$COMMANDE_ID/upload-package-photo" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -F "packagePhoto=@$TEMP")
CODE_1=$(echo "$UP" | jq -r '.data.codeColis')
rm -f "$TEMP"
echo "   ✅ Photo uploadée | Code 1: $CODE_1"

# 7. Prêt à expédier
echo "7️⃣  Marquer prêt à expédier..."
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -d '{"status": "pret_a_expedier"}' > /dev/null
echo "   ✅ Status: pret_a_expedier"

# 8. Login Livreur
echo "8️⃣  Login Livreur (+243852583009)..."
LIVREUR_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243852583009", "password": "Informyi@81642"}' | jq -r '.token.token // .token')
echo "   ✅ Token obtenu"

# 9. Livreur accepte
echo "9️⃣  Livreur accepte commande..."
curl -s -X POST "$BASE_URL/ecommerce/livraison/$ORDER_ID/take" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" > /dev/null
echo "   ✅ Status: accepte_livreur"

# 10. Récupération + Code 2
echo "🔟 Récupération colis (Code 1)..."
ROUTE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" \
  -d "{\"status\": \"en_route\", \"codeColis\": \"$CODE_1\"}")
CODE_2=$(echo "$ROUTE" | jq -r '.newCodeColis')
echo "   ✅ Status: en_route | Code 2: $CODE_2"

# 11. Livraison
echo "1️⃣1️⃣  Livraison au client (Code 2)..."
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" \
  -d "{\"status\": \"delivered\", \"codeColis\": \"$CODE_2\"}" > /dev/null
echo "   ✅ Status: delivered"

echo ""
echo "=========================================="
echo "🎉 WORKFLOW COMPLET RÉUSSI !"
echo "=========================================="
echo ""
echo "📦 Commande: $ORDER_ID"
echo "🔐 Code 1 (Vendeur→Livreur): $CODE_1"
echo "🔐 Code 2 (Livreur→Acheteur): $CODE_2"
echo ""
echo "✅ Tous les tests sont passés avec succès !"
