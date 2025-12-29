#!/bin/bash

echo "🔄 Restauration des données de test..."
echo ""

BASE_URL="http://localhost:3333"

# 1. Créer le compte VENDEUR
echo "👤 1. Création du compte vendeur..."
VENDEUR_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Stanislas",
    "lastName": "Makengo",
    "phone": "+243826016607",
    "email": "vendeur@test.com",
    "password": "0826016607Makengo@",
    "role": "vendeur",
    "latitude": -4.3276,
    "longitude": 15.3136
  }')

echo "$VENDEUR_RESPONSE" | jq '{success: .success, message: .message, userId: .user.id}'
VENDEUR_TOKEN=$(echo "$VENDEUR_RESPONSE" | jq -r '.token.token // empty')

if [ -z "$VENDEUR_TOKEN" ]; then
  echo "❌ Erreur lors de la création du vendeur"
  exit 1
fi

echo "✅ Vendeur créé - Token: ${VENDEUR_TOKEN:0:30}..."
echo ""

# 2. Créer le compte ACHETEUR
echo "👤 2. Création du compte acheteur..."
ACHETEUR_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Client",
    "lastName": "Test",
    "phone": "+243828191010",
    "email": "acheteur@test.com",
    "password": "0826016607Makengo?",
    "role": "client",
    "latitude": -4.3500,
    "longitude": 15.3500
  }')

echo "$ACHETEUR_RESPONSE" | jq '{success: .success, message: .message, userId: .user.id}'
ACHETEUR_TOKEN=$(echo "$ACHETEUR_RESPONSE" | jq -r '.token.token // empty')

if [ -z "$ACHETEUR_TOKEN" ]; then
  echo "❌ Erreur lors de la création de l'acheteur"
  exit 1
fi

echo "✅ Acheteur créé - Token: ${ACHETEUR_TOKEN:0:30}..."
echo ""

# 3. Créer un moyen de paiement par défaut pour le vendeur
echo "💳 3. Création du moyen de paiement vendeur..."
PAYMENT_METHOD=$(curl -s -X POST "$BASE_URL/payment-methods" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "orange_money",
    "numeroCompte": "0826016607",
    "nomTitulaire": "Stanislas Makengo",
    "isDefault": true
  }')

PAYMENT_METHOD_ID=$(echo "$PAYMENT_METHOD" | jq -r '.paymentMethod.id // empty')
echo "$PAYMENT_METHOD" | jq '{success: .success, paymentMethodId: .paymentMethod.id}'
echo ""

# 4. Créer des produits
echo "📦 4. Création des produits..."

PRODUCT1=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smartphone Samsung A54",
    "price": 450000,
    "description": "Smartphone 5G 128GB",
    "stock": 10,
    "categoryId": 1,
    "images": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"]
  }')

PRODUCT1_ID=$(echo "$PRODUCT1" | jq -r '.product.id // empty')
echo "  - Produit 1: $(echo "$PRODUCT1" | jq -r '.product.name // "Erreur"') (ID: $PRODUCT1_ID)"

PRODUCT2=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell Inspiron",
    "price": 850000,
    "description": "Ordinateur portable i5, 8GB RAM",
    "stock": 5,
    "categoryId": 1,
    "images": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853"]
  }')

PRODUCT2_ID=$(echo "$PRODUCT2" | jq -r '.product.id // empty')
echo "  - Produit 2: $(echo "$PRODUCT2" | jq -r '.product.name // "Erreur"') (ID: $PRODUCT2_ID)"

PRODUCT3=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Casque Bluetooth Sony",
    "price": 95000,
    "description": "Casque sans fil à réduction de bruit",
    "stock": 15,
    "categoryId": 1,
    "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"]
  }')

PRODUCT3_ID=$(echo "$PRODUCT3" | jq -r '.product.id // empty')
echo "  - Produit 3: $(echo "$PRODUCT3" | jq -r '.product.name // "Erreur"') (ID: $PRODUCT3_ID)"
echo ""

# 5. Créer des commandes (avec l'acheteur)
echo "🛒 5. Création des commandes..."

if [ -n "$PRODUCT1_ID" ] && [ -n "$PRODUCT2_ID" ]; then
  # Commande 1: pending_payment
  ORDER1=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/initialize" \
    -H "Authorization: Bearer $ACHETEUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"products\": [
        {\"productId\": $PRODUCT1_ID, \"quantite\": 1}
      ],
      \"latitude\": -4.3500,
      \"longitude\": 15.3500,
      \"address\": {
        \"pays\": \"RDC\",
        \"ville\": \"Kinshasa\",
        \"commune\": \"Gombe\",
        \"quartier\": \"Centre-ville\",
        \"avenue\": \"Avenue Kasa-Vubu\",
        \"numero\": \"45\"
      }
    }")
  
  echo "  - Commande 1: $(echo "$ORDER1" | jq -r '.orders[0].orderId // "Erreur"') (Status: pending_payment)"
  
  # Récupérer l'ID de la commande pour la mettre à jour
  ORDER1_ID=$(echo "$ORDER1" | jq -r '.orders[0].id')
  
  # Mettre à jour le moyen de paiement pour passer à "pending"
  if [ -n "$ORDER1_ID" ] && [ -n "$PAYMENT_METHOD_ID" ]; then
    curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER1_ID/payment-method" \
      -H "Authorization: Bearer $ACHETEUR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"paymentMethodId\": $PAYMENT_METHOD_ID}" > /dev/null
    echo "  - Commande 1 mise à jour: pending"
  fi
  
  # Commande 2: en_preparation
  ORDER2=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/initialize" \
    -H "Authorization: Bearer $ACHETEUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"products\": [
        {\"productId\": $PRODUCT2_ID, \"quantite\": 1},
        {\"productId\": $PRODUCT3_ID, \"quantite\": 2}
      ],
      \"latitude\": -4.3500,
      \"longitude\": 15.3500
    }")
  
  ORDER2_ID=$(echo "$ORDER2" | jq -r '.orders[0].id')
  ORDER2_ORDER_ID=$(echo "$ORDER2" | jq -r '.orders[0].orderId')
  echo "  - Commande 2: $ORDER2_ORDER_ID (Status: pending_payment)"
  
  # Mettre à jour et changer le statut
  if [ -n "$ORDER2_ID" ] && [ -n "$PAYMENT_METHOD_ID" ]; then
    curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER2_ID/payment-method" \
      -H "Authorization: Bearer $ACHETEUR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"paymentMethodId\": $PAYMENT_METHOD_ID}" > /dev/null
    
    # Passer en en_preparation (en tant que vendeur)
    curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER2_ORDER_ID/status" \
      -H "Authorization: Bearer $VENDEUR_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "en_preparation"}' > /dev/null
    
    echo "  - Commande 2 mise à jour: en_preparation"
  fi
fi

echo ""
echo "✅ Restauration terminée !"
echo ""
echo "📋 Récapitulatif:"
echo "  Vendeur: +243826016607 / 0826016607Makengo@"
echo "  Acheteur: +243828191010 / 0826016607Makengo?"
echo "  Produits: 3 créés"
echo "  Commandes: 2 créées (1 pending, 1 en_preparation)"
