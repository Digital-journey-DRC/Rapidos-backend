# Documentation Swagger - Mises à jour effectuées

## Date: 2025
## Application: Rapidos Backend API

---

## 📋 Résumé des changements

La documentation Swagger a été mise à jour pour refléter la nouvelle implémentation de la gestion des images produits avec Cloudinary.

---

## ✅ Changements effectués

### 1. Endpoint `/products/store` (POST)
**Avant:**
- Un seul champ `medias` de type array pour toutes les images
- Documentation non conforme avec l'implémentation réelle

**Après:**
- **`image`** (obligatoire): Image principale du produit
- **`image1`** (optionnel): Première image secondaire
- **`image2`** (optionnel): Deuxième image secondaire
- **`image3`** (optionnel): Troisième image secondaire
- **`image4`** (optionnel): Quatrième image secondaire
- Description ajoutée: "Crée un nouveau produit avec une image principale et jusqu'à 4 images secondaires. Les images sont uploadées sur Cloudinary."
- Chaque champ peut accepter un fichier (multipart/form-data) ou une URL

**Exemple de requête curl:**
```bash
curl -X POST http://localhost:3333/products/store \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Chasubles de sport" \
  -F "description=Chasubles colorées pour équipes" \
  -F "price=5.99" \
  -F "stock=100" \
  -F "category=Sports" \
  -F "image=@/path/to/main_image.jpg" \
  -F "image1=@/path/to/secondary1.jpg" \
  -F "image2=@/path/to/secondary2.jpg"
```

---

### 2. Endpoint `/products/update/:productId` (POST)
**Avant:**
- Champ `medias` de type array

**Après:**
- Mêmes champs individuels que /products/store
- Tous les champs image sont optionnels lors de la mise à jour
- Possibilité de mettre à jour seulement certaines images

---

### 3. Schéma `Product` (components/schemas)
**Avant:**
```yaml
media:
  type: array
  items:
    $ref: '#/components/schemas/Media'
```

**Après:**
```yaml
image:
  type: string
  format: uri
  description: URL Cloudinary de l'image principale
  example: https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/products/main_image.jpg

images:
  type: array
  description: URLs Cloudinary des images secondaires
  items:
    type: string
    format: uri
  example:
    - https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/products/image1.jpg
    - https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/products/image2.jpg

vendeur:
  type: object
  description: Informations du vendeur
  properties:
    firstName:
      type: string
      example: Judah
    lastName:
      type: string
      example: Mvi
```

**Bénéfices:**
- Structure cohérente avec les endpoints GET (/products/all, /products/boutique/:userId, /products/get-products/:id)
- Affichage du nom complet du vendeur (firstName + lastName)
- Images directement accessibles via URLs Cloudinary

---

### 4. Nouveau schéma `ProductResponse`
Un nouveau schéma a été ajouté pour documenter la réponse complète des endpoints produits:

```yaml
ProductResponse:
  type: object
  description: Réponse complète lors de la création ou récupération d'un produit
  properties:
    id: integer
    name: string
    description: string
    price: number
    stock: integer
    categoryId: integer
    vendeurId: integer
    image: string (URI Cloudinary)
    images: array of strings (URIs Cloudinary)
    vendeur:
      firstName: string
      lastName: string
    category: Category schema
    createdAt: date-time
    updatedAt: date-time
```

---

## 🔄 Endpoints concernés

Tous les endpoints produits retournent maintenant la structure cohérente:

1. **GET /products/all-products** - Liste tous les produits avec images et vendeurs
2. **GET /products/boutique/:userId** - Produits d'un vendeur spécifique
3. **GET /products/get-products/:productId** - Détails d'un produit
4. **POST /products/store** - Création d'un produit
5. **POST /products/update/:productId** - Mise à jour d'un produit
6. **GET /products/recommended** - Produits recommandés
7. **GET /products/promotions** - Produits en promotion

---

## 🛠️ Implémentation technique

### Upload d'images
- Les images sont uploadées sur **Cloudinary** (compte: dnn2ght5x)
- Format accepté: multipart/form-data ou URL
- Service utilisé: `manageUploadProductImages` dans products_controller.ts

### Base de données
- Table `medias` stocke les URLs Cloudinary
- Relation: `Product` ➡️ `hasMany` ➡️ `Media`
- Colonne: `product_id` (mappée via `productId` dans le modèle)

### Réponse des endpoints GET
Tous les endpoints GET retournent:
```json
{
  "id": 176,
  "name": "Chasubles de sport",
  "price": 5.99,
  "image": "https://res.cloudinary.com/dnn2ght5x/image/upload/...",
  "images": [
    "https://res.cloudinary.com/dnn2ght5x/image/upload/...",
    "https://res.cloudinary.com/dnn2ght5x/image/upload/..."
  ],
  "vendeur": {
    "firstName": "Judah",
    "lastName": "Mvi"
  },
  "category": { ... }
}
```

---

## ✅ Tests effectués

### Produit test #176
- 1 image principale ✅
- 2 images secondaires ✅
- URLs Cloudinary fonctionnelles ✅

### Produit test #178
- 1 image principale ✅
- 3 images secondaires ✅
- URLs Cloudinary fonctionnelles ✅

---

## 📦 Fichiers modifiés

1. **docs/swagger.yaml** - Documentation Swagger mise à jour
2. **build/docs/swagger.yaml** - Version compilée automatiquement copiée
3. **app/controllers/products_controller.ts** - Déjà mis à jour lors des développements précédents
4. **app/models/media.ts** - Déjà mis à jour avec mapping `productId` ➡️ `product_id`

---

## 🚀 Déploiement

```bash
# 1. Build l'application
npm run build

# 2. Redémarrer PM2
pm2 restart rapidos-api

# 3. Vérifier les logs
pm2 logs rapidos-api
```

---

## 📝 Notes importantes

- **Backup créé**: `docs/swagger.yaml.backup` contient la version précédente
- **Compatibilité**: Le code backend supporte toujours les anciennes URLs de médias
- **Migration**: Aucune migration base de données nécessaire
- **Tests**: Tous les tests curl existants continuent de fonctionner

---

## 🔗 Accès à la documentation

- **Swagger UI**: http://localhost:3333/docs
- **Fichier YAML**: /docs/swagger.yaml
- **Build**: /build/docs/swagger.yaml

---

## 👨‍💻 Auteur des modifications

- Script Python: `update_swagger.py`
- Ajustements manuels via sed pour le summary
- Ajout du schéma ProductResponse
- Tests et validation des endpoints

---

**Documentation mise à jour le:** $(date)
**Version API:** 1.0.0
**Framework:** AdonisJS v7 avec Node 20.19.2
