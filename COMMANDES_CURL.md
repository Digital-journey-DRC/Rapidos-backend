# Commandes curl pour créer la table promotions et tester GET /promotions

## ⚠️ IMPORTANT : Redémarrer le serveur d'abord !

Le serveur doit être redémarré pour charger la nouvelle route de création de table.

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer:
npm run dev
```

## 1. Créer la table promotions

Une fois le serveur redémarré, exécutez:

```bash
curl -X GET "http://localhost:3333/create-promotions-table" \
  -H "Content-Type: application/json"
```

Ou avec authentification si nécessaire:

```bash
# Obtenir le token
LOGIN=$(curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"uid":"+243828191010","password":"0826016607Makengo?"}')

TOKEN=$(echo "$LOGIN" | jq -r '.token.token // .token.value // empty')

# Créer la table
curl -X GET "http://localhost:3333/create-promotions-table" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

## 2. Tester GET /promotions

```bash
# Se connecter pour obtenir le token
LOGIN=$(curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"uid":"+243828191010","password":"0826016607Makengo?"}')

TOKEN=$(echo "$LOGIN" | jq -r '.token.token // .token.value // empty')

# Tester GET /promotions
curl -X GET http://localhost:3333/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## Script complet

```bash
#!/bin/bash

# 1. Connexion
echo "Connexion..."
LOGIN=$(curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"uid":"+243828191010","password":"0826016607Makengo?"}')

TOKEN=$(echo "$LOGIN" | jq -r '.token.token // empty')

# 2. Créer la table
echo "Création de la table..."
curl -X GET "http://localhost:3333/create-promotions-table" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Tester GET /promotions
echo "Test GET /promotions..."
curl -X GET http://localhost:3333/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```





