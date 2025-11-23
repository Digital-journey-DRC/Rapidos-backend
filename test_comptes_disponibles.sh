#!/bin/bash

echo "========================================="
echo "🔍 TEST DES COMPTES DISPONIBLES"
echo "========================================="
echo ""

BASE_URL="http://localhost:3333"

# Liste des comptes à tester (trouvés dans le code)
declare -a ACCOUNTS=(
  "admin2@rapidos.com:Rapidos@1234"
  "+243825287451:Rapidos@1234"
  "+243828191010:0826016607Makengo?"
  "+243828191010:0826016607Makengo@"
)

echo "📋 Comptes trouvés dans le code:"
echo "1. Email: admin2@rapidos.com / Téléphone: +243825287451 / Mot de passe: Rapidos@1234 (Admin - ID: 116)"
echo "2. Téléphone: +243828191010 / Mot de passe: 0826016607Makengo? (Acheteur)"
echo ""

# Vérifier si le serveur est accessible
echo "1️⃣ Vérification du serveur..."
if ! curl -s -f "$BASE_URL/" > /dev/null 2>&1; then
  echo "❌ Erreur: Le serveur n'est pas accessible sur $BASE_URL"
  echo "   Démarrez le serveur avec: npm run dev"
  exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Tester chaque compte
for i in "${!ACCOUNTS[@]}"; do
  IFS=':' read -r uid password <<< "${ACCOUNTS[$i]}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "2️⃣ Test du compte $((i+1)): ${uid}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"uid\":\"$uid\",\"password\":\"$password\"}")
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"uid\":\"$uid\",\"password\":\"$password\"}")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Connexion réussie!"
    echo "$LOGIN_RESPONSE" | jq '{message, user: {id, email, phone, role, userStatus}, token: {type: .token.type}}' 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    # Extraire le token
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.token // .token.value // empty' 2>/dev/null)
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
      echo ""
      echo "🔑 Token obtenu: ${TOKEN:0:40}..."
      echo ""
      
      # Tester GET /promotions avec ce compte
      echo "3️⃣ Test GET /promotions avec ce compte..."
      PROMO_RESPONSE=$(curl -s -X GET "$BASE_URL/promotions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN")
      
      HTTP_CODE_PROMO=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/promotions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN")
      
      echo "Code HTTP: $HTTP_CODE_PROMO"
      
      if [ "$HTTP_CODE_PROMO" = "200" ]; then
        echo "✅ GET /promotions fonctionne!"
        COUNT=$(echo "$PROMO_RESPONSE" | jq '.promotions | length' 2>/dev/null || echo "0")
        echo "   Nombre de promotions: $COUNT"
      elif [ "$HTTP_CODE_PROMO" = "404" ]; then
        echo "ℹ️  Aucune promotion trouvée (normal si la table est vide)"
      elif [ "$HTTP_CODE_PROMO" = "500" ]; then
        ERROR=$(echo "$PROMO_RESPONSE" | jq -r '.error // .message' 2>/dev/null)
        if [[ "$ERROR" == *"does not exist"* ]]; then
          echo "⚠️  La table promotions n'existe pas encore"
        else
          echo "⚠️  Erreur: $ERROR"
        fi
      else
        echo "⚠️  Code HTTP: $HTTP_CODE_PROMO"
      fi
      
      echo ""
      echo "✅ Ce compte fonctionne! Utilisation:"
      echo "   UID: $uid"
      echo "   Password: $password"
      exit 0
    fi
  else
    echo "❌ Connexion échouée (HTTP $HTTP_CODE)"
    ERROR_MSG=$(echo "$LOGIN_RESPONSE" | jq -r '.message // .error // "Erreur inconnue"' 2>/dev/null)
    echo "   $ERROR_MSG"
  fi
  echo ""
done

echo "❌ Aucun compte n'a fonctionné"
exit 1




