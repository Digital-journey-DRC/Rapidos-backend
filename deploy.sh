#!/bin/bash

echo "🚀 Déploiement de l'application Rapidos en production..."
echo "=================================================="

# Vérifier que Node.js 20 est utilisé
echo "📋 Vérification de l'environnement..."
node --version
npm --version

# Compiler le projet
echo "🔨 Compilation du projet..."
npx tsc
if [ $? -eq 0 ]; then
    echo "✅ Compilation réussie"
else
    echo "❌ Erreur de compilation"
    exit 1
fi

# Copier les fichiers nécessaires
echo "📁 Copie des fichiers..."
cp -r docs build/
cp -r resources build/
echo "✅ Fichiers copiés"

# Vérifier que le dossier build existe
if [ -d "build" ]; then
    echo "✅ Dossier build créé avec succès"
    echo "📊 Contenu du dossier build:"
    ls -la build/
else
    echo "❌ Erreur: dossier build non trouvé"
    exit 1
fi

echo ""
echo "🎉 RHÉPLOIEMENT PRÊT !"
echo "=================================================="
echo "📝 Prochaines étapes:"
echo "   1. Copier le dossier 'build' sur votre serveur de production"
echo "   2. Configurer les variables d'environnement sur le serveur"
echo "   3. Installer les dépendances: npm install --production"
echo "   4. Démarrer l'application: node build/bin/server.js"
echo ""
echo "🔧 Variables d'environnement requises:"
echo "   - NODE_ENV=production"
echo "   - PORT=3333"
echo "   - DB_HOST=db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com"
echo "   - DB_PORT=25060"
echo "   - DB_USER=doadmin"
echo "   - DB_PASSWORD=AVNS_RMJIxzQS_DOFSdl1K3s"
echo "   - DB_DATABASE=defaultdb"
echo ""
echo "✨ Vos modifications de catégories personnalisées sont prêtes pour la production !"
