#!/bin/bash

# 🧪 Script de test - Workflow Livreur complet
# De pret_a_expedier à delivered

BASE_URL="http://localhost:3333"

echo "🧪 TEST WORKFLOW COMPLET LIVREUR"
echo "================================="
echo ""

# ⚠️ REMPLACER PAR UN TOKEN DE LIVREUR
LIVREUR_TOKEN="TOKEN_LIVREUR_ICI"

if [ "$LIVREUR_TOKEN" == "TOKEN_LIVREUR_ICI" ]; then
  echo "⚠️  Veuillez remplacer LIVREUR_TOKEN par un token de livreur valide"
  exit 1
fi

echo "📋 ÉTAPE 1: Voir les livraisons disponibles (pret_a_expedier)"
echo "--------------------------------------------------------------"
RESPONSE=$(curl -s -X GET "$BASE_URL/ecommerce/livraison/disponibles" \
  -H "Authorization: Bearer $LIVREUR_TOKEN")

ORDER_ID=$(echo "$RESPONSE" | jq -r '.livraisons[0].orderId // empty')
CODE_COLIS_VENDEUR=$(echo "$RESPONSE" | jq -r ".livraisons[] | select(.orderId == \"$ORDER_ID\") | .codeColis // empty")

if [ -z "$ORDER_ID" ]; then
  echo "❌ Aucune livraison disponible"
  exit 1
fi

echo "✅ Livraisons disponibles:"
echo "$RESPONSE" | jq '{success, total: (.livraisons | length), first_order: .livraisons[0] | {orderId, status, codeColis, client}}'
echo ""
echo "📦 Commande sélectionnée: $ORDER_ID"
echo "🔑 Code colis vendeur: $CODE_COLIS_VENDEUR"
echo ""

echo "📋 ÉTAPE 2: Accepter la livraison (pret_a_expedier → accepte_livreur)"
echo "----------------------------------------------------------------------"
TAKE_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/livraison/$ORDER_ID/take" \
  -H "Authorization: Bearer $LIVREUR_TOKEN")

echo "$TAKE_RESPONSE" | jq '{success, message, status: .order.status, deliveryPersonId: .order.deliveryPersonId}'

if [ "$(echo "$TAKE_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Erreur lors de l'acceptation de la livraison"
  exit 1
fi

echo ""
echo "✅ Livraison acceptée - Statut: accepte_livreur"
echo ""

echo "📋 ÉTAPE 3: Récupérer le colis (accepte_livreur → en_route)"
echo "----------------------------------------------------------"
echo "🔑 Code colis vendeur requis: $CODE_COLIS_VENDEUR"
echo ""

EN_ROUTE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"en_route\", \"codeColis\": \"$CODE_COLIS_VENDEUR\"}")

NEW_CODE=$(echo "$EN_ROUTE_RESPONSE" | jq -r '.newCodeColis // .order.codeColis // empty')

echo "$EN_ROUTE_RESPONSE" | jq '{success, message, status: .order.status, newCodeColis}'

if [ "$(echo "$EN_ROUTE_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Erreur lors du passage en route"
  exit 1
fi

echo ""
echo "✅ Colis récupéré - Statut: en_route"
echo "🔑 Nouveau code de livraison généré: $NEW_CODE"
echo ""

echo "📋 ÉTAPE 4: Livrer la commande (en_route → delivered)"
echo "-----------------------------------------------------"
echo "🔑 Code de livraison requis: $NEW_CODE"
echo ""

DELIVERED_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/status" \
  -H "Authorization: Bearer $LIVREUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"delivered\", \"codeColis\": \"$NEW_CODE\"}")

echo "$DELIVERED_RESPONSE" | jq '{success, message, status: .order.status}'

if [ "$(echo "$DELIVERED_RESPONSE" | jq -r '.success')" != "true" ]; then
  echo "❌ Erreur lors de la livraison"
  exit 1
fi

echo ""
echo "✅ Commande livrée - Statut: delivered"
echo ""
echo "🎉 WORKFLOW COMPLET RÉUSSI!"
echo "==========================="
echo ""
echo "Résumé des transitions:"
echo "  pret_a_expedier → accepte_livreur → en_route → delivered"


