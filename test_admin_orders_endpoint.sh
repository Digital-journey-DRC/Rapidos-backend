#!/bin/bash

echo "🧪 TEST DE L'ENDPOINT GET /ecommerce/commandes/admin/all"
echo "====================================================="
echo ""

# Configuration
BASE_URL="${1:-http://24.144.87.127:3333}"
ADMIN_UID="+243900000000"
ADMIN_PASSWORD="Admin@123456"

echo "📋 ÉTAPE 1: Connexion en tant qu'admin..."
echo "URL: $BASE_URL/login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\":\"$ADMIN_UID\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '{message, status, has_token: (.token != null)}'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Impossible d'obtenir le token"
  exit 1
fi

echo ""
echo "✅ Token obtenu avec succès"
echo ""

echo "📋 ÉTAPE 2: Test GET /ecommerce/commandes/admin/all (page 1, limit 10)..."
echo "----------------------------------------------------------------"
curl -s -X GET "$BASE_URL/ecommerce/commandes/admin/all?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    success,
    message,
    data_count: (.data | length),
    meta: {
      total: .meta.total,
      perPage: .meta.perPage,
      currentPage: .meta.currentPage,
      lastPage: .meta.lastPage,
      hasMorePages: .meta.hasMorePages
    },
    first_order: .data[0] | {orderId, status, total, client, vendor_id}
  }'

echo ""
echo "📋 ÉTAPE 3: Test avec filtre par statut (pending)..."
echo "---------------------------------------------------"
curl -s -X GET "$BASE_URL/ecommerce/commandes/admin/all?page=1&limit=5&status=pending" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    success,
    message,
    data_count: (.data | length),
    meta,
    all_statuses: [.data[] | .status] | unique
  }'

echo ""
echo "📋 ÉTAPE 4: Test avec pagination (page 2, limit 5)..."
echo "----------------------------------------------------"
curl -s -X GET "$BASE_URL/ecommerce/commandes/admin/all?page=2&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '{
    success,
    message,
    data_count: (.data | length),
    meta: {
      total: .meta.total,
      currentPage: .meta.currentPage,
      lastPage: .meta.lastPage
    }
  }'

echo ""
echo "✅ Tests terminés !"
