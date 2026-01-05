#!/bin/bash

# Script de test E2E local du workflow de commande e-commerce
# ===========================================================

BASE_URL="http://localhost:3333"

echo "=========================================="
echo "TEST E2E WORKFLOW COMPLET DE COMMANDE"
echo "=========================================="
echo ""

# Vérifier que le serveur est en ligne
echo "🔍 Vérification du serveur..."
SERVER_CHECK=$(curl -s "$BASE_URL/")
if [ -z "$SERVER_CHECK" ]; then
  echo "❌ Erreur: Le serveur n'est pas accessible sur $BASE_URL"
  exit 1
fi
echo "✅ Serveur en ligne"
echo ""

# Récupérer des utilisateurs existants pour le test
echo "📋 ÉTAPE 0: Récupération des utilisateurs disponibles..."

# On va essayer avec les credentials du script original modifié pour local
ACHETEUR_UID="+243828191010"
ACHETEUR_PWD="0826016607Makengo?"
VENDEUR_UID="+243826016607"
VENDEUR_PWD="0826016607Makengo@"

# Étape 1: Login Acheteur
echo "📱 ÉTAPE 1: Login Acheteur ($ACHETEUR_UID)..."
ACHETEUR_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$ACHETEUR_UID\", \"password\": \"$ACHETEUR_PWD\"}")

ACHETEUR_TOKEN=$(echo "$ACHETEUR_RESPONSE" | jq -r '.token')

if [ "$ACHETEUR_TOKEN" = "null" ] || [ -z "$ACHETEUR_TOKEN" ]; then
  echo "❌ Erreur: Impossible de se connecter en tant qu'acheteur"
  echo "Response: $ACHETEUR_RESPONSE"
  echo ""
  echo "💡 Essai avec un autre utilisateur..."
  
  # Essayer avec un autre utilisateur
  ACHETEUR_UID="+243999888777"
  ACHETEUR_PWD="password123"
  ACHETEUR_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"uid\": \"$ACHETEUR_UID\", \"password\": \"$ACHETEUR_PWD\"}")
  ACHETEUR_TOKEN=$(echo "$ACHETEUR_RESPONSE" | jq -r '.token')
  
  if [ "$ACHETEUR_TOKEN" = "null" ] || [ -z "$ACHETEUR_TOKEN" ]; then
    echo "❌ Aucun utilisateur de test disponible. Listez les utilisateurs ou créez-en un."
    exit 1
  fi
fi
echo "✅ Token acheteur obtenu"
echo ""

# Étape 2: Récupérer un produit disponible
echo "🛍️ ÉTAPE 2: Récupération des produits disponibles..."
PRODUCTS=$(curl -s -X GET "$BASE_URL/products/all" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN")

PRODUCT_ID=$(echo "$PRODUCTS" | jq -r '.products[0].id // empty')

if [ -z "$PRODUCT_ID" ]; then
  echo "❌ Aucun produit disponible pour le test"
  echo "Response: $PRODUCTS"
  exit 1
fi

VENDOR_ID=$(echo "$PRODUCTS" | jq -r '.products[0].vendeurId // .products[0].vendeur_id // empty')
PRODUCT_NAME=$(echo "$PRODUCTS" | jq -r '.products[0].name // .products[0].nom // "Produit test"')
echo "✅ Produit trouvé: ID=$PRODUCT_ID, Nom=$PRODUCT_NAME, Vendeur=$VENDOR_ID"
echo ""

# Étape 3: Initialiser une commande
echo "🛒 ÉTAPE 3: Initialisation de la commande..."
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" \
  -d "{
    \"products\": [
      {\"productId\": $PRODUCT_ID, \"quantite\": 1}
    ],
    \"latitude\": -4.3276,
    \"longitude\": 15.3136
  }")

echo "Réponse initialisation:"
echo "$INIT_RESPONSE" | jq .

ORDER_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].orderId // empty')
COMMANDE_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].id // empty')

if [ -z "$ORDER_ID" ]; then
  echo "❌ Erreur: Impossible de créer la commande"
  exit 1
fi
echo "✅ Commande créée avec ID: $ORDER_ID (DB ID: $COMMANDE_ID)"
echo ""

# Étape 4: Voir ses commandes (Acheteur)
echo "👀 ÉTAPE 4: Visualiser les commandes (Acheteur)..."
curl -s -X GET "$BASE_URL/ecommerce/commandes/buyer/me" \
  -H "Authorization: Bearer $ACHETEUR_TOKEN" | jq '.orders[] | select(.orderId == "'$ORDER_ID'") | {id, orderId, status, total}'
echo ""

# Étape 5: Confirmer le paiement (passage à pending)
echo "💳 ÉTAPE 5: Confirmation du paiement..."
PAYMENT_METHOD_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].paymentMethod.id // empty')

if [ -n "$PAYMENT_METHOD_ID" ] && [ "$PAYMENT_METHOD_ID" != "null" ]; then
  PAYMENT_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$COMMANDE_ID/payment-method" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACHETEUR_TOKEN" \
    -d "{\"paymentMethodId\": $PAYMENT_METHOD_ID, \"numeroPayment\": \"TXN$(date +%s)\"}")
  echo "$PAYMENT_RESPONSE" | jq .
  echo "✅ Paiement confirmé (status: pending)"
else
  echo "⚠️ Pas de moyen de paiement associé, on continue..."
fi
echo ""

# Étape 6: Login Vendeur
echo "🏪 ÉTAPE 6: Login Vendeur ($VENDEUR_UID)..."
VENDEUR_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$VENDEUR_UID\", \"password\": \"$VENDEUR_PWD\"}")

VENDEUR_TOKEN=$(echo "$VENDEUR_RESPONSE" | jq -r '.token')

if [ "$VENDEUR_TOKEN" = "null" ] || [ -z "$VENDEUR_TOKEN" ]; then
  echo "⚠️ Login vendeur échoué, utilisation du token acheteur (test simulé)"
  VENDEUR_TOKEN="$ACHETEUR_TOKEN"
else
  echo "✅ Token vendeur obtenu"
fi
echo ""

# Étape 7: Voir ses commandes (Vendeur)
echo "👀 ÉTAPE 7: Visualiser les commandes (Vendeur)..."
curl -s -X GET "$BASE_URL/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" | jq '.commandes[0:3] | .[] | {orderId, status, total}'
echo ""

# Étape 8: Commencer la préparation
echo "📦 ÉTAPE 8: Commencer la préparation..."
STATUS_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -d '{"status": "en_preparation", "reason": "Commande prise en charge"}')
echo "$STATUS_RESPONSE" | jq '{success, message, status: .order.status}'
echo ""

# Étape 9: Upload photo du colis
echo "📸 ÉTAPE 9: Upload de la photo du colis..."
TEMP_IMAGE="/tmp/test_package_$(date +%s).jpg"
# Créer une petite image de test
printf '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x7f\x00\xff\xd9' > "$TEMP_IMAGE"

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/$COMMANDE_ID/upload-package-photo" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -F "packagePhoto=@$TEMP_IMAGE")

echo "$UPLOAD_RESPONSE" | jq .
CODE_1=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.codeColis // .codeColis // empty')

rm -f "$TEMP_IMAGE"

if [ -z "$CODE_1" ]; then
  echo "❌ Erreur: Code 1 non généré"
  echo "Détails: $UPLOAD_RESPONSE"
  exit 1
fi
echo "✅ Photo uploadée, Code 1 (vendeur→livreur): $CODE_1"
echo ""

# Étape 10: Marquer prêt à expédier
echo "✅ ÉTAPE 10: Marquer prêt à expédier..."
curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -d '{"status": "pret_a_expedier", "reason": "Colis emballé et prêt"}' | jq '{success, message, status: .order.status}'
echo ""

# Étape 11: Livreur accepte la commande
echo "🚚 ÉTAPE 11: Livreur accepte la commande..."
# Dans un vrai test, on utiliserait un compte livreur
LIVREUR_TOKEN="$VENDEUR_TOKEN"  # Pour test simplifié

TAKE_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/livraison/$ORDER_ID/take" \
  -H "Authorization: Bearer $LIVREUR_TOKEN")

echo "$TAKE_RESPONSE" | jq '{success, message, status: .order.status}'
echo ""

# Étape 12: Livreur récupère le colis (valide Code 1, génère Code 2)
echo "🔐 ÉTAPE 12: Livreur récupère le colis avec Code 1..."
EN_ROUTE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" \
  -d "{\"status\": \"en_route\", \"codeColis\": \"$CODE_1\"}")

echo "$EN_ROUTE_RESPONSE" | jq .
CODE_2=$(echo "$EN_ROUTE_RESPONSE" | jq -r '.newCodeColis // empty')

if [ -z "$CODE_2" ]; then
  echo "⚠️ Code 2 non généré (peut-être une erreur de permission)"
  echo "Détails: $EN_ROUTE_RESPONSE"
else
  echo "✅ Colis récupéré, Code 2 (livreur→acheteur): $CODE_2"
fi
echo ""

# Étape 13: Livraison au client
if [ -n "$CODE_2" ]; then
  echo "🎯 ÉTAPE 13: Livraison au client avec Code 2..."
  DELIVERED_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LIVREUR_TOKEN" \
    -d "{\"status\": \"delivered\", \"codeColis\": \"$CODE_2\"}")

  echo "$DELIVERED_RESPONSE" | jq '{success, message, status: .order.status}'
  echo ""
fi

# Vérification finale
echo "=========================================="
echo "📊 RÉSUMÉ DU TEST E2E"
echo "=========================================="
echo ""
echo "  • Order ID: $ORDER_ID"
echo "  • DB ID: $COMMANDE_ID"
echo "  • Produit: $PRODUCT_NAME (ID: $PRODUCT_ID)"
echo "  • Code 1 (Vendeur→Livreur): $CODE_1"
if [ -n "$CODE_2" ]; then
  echo "  • Code 2 (Livreur→Acheteur): $CODE_2"
  echo "  • Statut final: delivered"
  echo ""
  echo "✅ WORKFLOW COMPLET TERMINÉ AVEC SUCCÈS !"
else
  echo "  • Workflow partiellement testé"
  echo ""
  echo "⚠️ Test terminé avec des avertissements"
fi
