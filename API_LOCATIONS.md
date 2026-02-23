# 📍 API Locations - Documentation

Module de gestion des localisations géographiques (Pays, Provinces, Villes, Communes)

---

## 📋 Endpoints disponibles

### 1️⃣ Récupérer tous les pays
```http
GET /locations/pays
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    { "id": 1, "code": "CD", "nom": "RDC" },
    { "id": 2, "code": "CG", "nom": "Congo-Brazzaville" }
  ]
}
```

---

### 2️⃣ Récupérer les provinces d'un pays
```http
GET /locations/provinces?paysId={id}
```

**Paramètres :**
- `paysId` (optionnel) : ID du pays pour filtrer les provinces

**Exemples :**
```bash
# Toutes les provinces
curl http://localhost:3333/locations/provinces

# Provinces de la RDC (paysId=1)
curl http://localhost:3333/locations/provinces?paysId=1
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    { "id": 1, "nom": "Kinshasa", "paysId": 1 },
    { "id": 2, "nom": "Kongo Central", "paysId": 1 },
    { "id": 3, "nom": "Haut-Katanga", "paysId": 1 }
  ]
}
```

---

### 3️⃣ Récupérer les villes d'une province
```http
GET /locations/villes?provinceId={id}
```

**Paramètres :**
- `provinceId` (optionnel) : ID de la province pour filtrer les villes

**Exemples :**
```bash
# Toutes les villes
curl http://localhost:3333/locations/villes

# Villes de Kinshasa (provinceId=1)
curl http://localhost:3333/locations/villes?provinceId=1

# Villes du Kongo Central (provinceId=2)
curl http://localhost:3333/locations/villes?provinceId=2
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    { "id": 1, "nom": "Kinshasa", "provinceId": 1 }
  ]
}
```

---

### 4️⃣ Récupérer les communes d'une ville
```http
GET /locations/communes?villeId={id}
```

**Paramètres :**
- `villeId` (optionnel) : ID de la ville pour filtrer les communes

**Exemples :**
```bash
# Toutes les communes
curl http://localhost:3333/locations/communes

# Communes de Kinshasa (villeId=1)
curl http://localhost:3333/locations/communes?villeId=1

# Communes de Lubumbashi (villeId=5)
curl http://localhost:3333/locations/communes?villeId=5
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    { "id": 1, "nom": "Gombe", "villeId": 1 },
    { "id": 2, "nom": "Kalamu", "villeId": 1 },
    { "id": 3, "nom": "Limete", "villeId": 1 },
    { "id": 4, "nom": "Ngaliema", "villeId": 1 }
  ]
}
```

---

## 🔗 Relations hiérarchiques

```
Pays (id)
  ↓ paysId
Provinces (id, paysId)
  ↓ provinceId
Villes (id, provinceId)
  ↓ villeId
Communes (id, villeId)
```

**Exemple de chaîne de dépendance :**
```
RDC (pays id=1)
  → Kinshasa (province id=1, paysId=1)
    → Kinshasa ville (ville id=1, provinceId=1)
      → Gombe (commune id=1, villeId=1)
```

---

## 📊 Données disponibles

| Type | Quantité | Exemples |
|------|----------|----------|
| **Pays** | 2 | RDC, Congo-Brazzaville |
| **Provinces** | 10 | Kinshasa, Kongo Central, Haut-Katanga, Nord-Kivu, Sud-Kivu, etc. |
| **Villes** | 14 | Kinshasa, Matadi, Lubumbashi, Goma, Bukavu, etc. |
| **Communes** | 37 | Gombe, Kalamu, Limete, Ngaliema, Kasa-Vubu, etc. |

### Communes de Kinshasa (24)
Gombe, Kalamu, Limete, Ngaliema, Barumbu, Kasa-Vubu, Lemba, Matete, Ngiri-Ngiri, Kintambo, Kinshasa, Bandalungwa, Bumbu, Makala, Ngaba, Selembao, Kisenso, Mont-Ngafula, Masina, Ndjili, Kimbanseke, Nsele, Maluku

---

## 🎯 Utilisation dans un formulaire

### Exemple avec JavaScript (Frontend)

```javascript
// Configuration de base
const API_URL = 'http://localhost:3333';

// 1. Charger les pays au démarrage
async function loadPays() {
  const response = await fetch(`${API_URL}/locations/pays`);
  const result = await response.json();
  return result.data; // [{id: 1, code: "CD", nom: "RDC"}, ...]
}

// 2. Charger les provinces quand un pays est sélectionné
async function loadProvinces(paysId) {
  const response = await fetch(`${API_URL}/locations/provinces?paysId=${paysId}`);
  const result = await response.json();
  return result.data; // [{id: 1, nom: "Kinshasa", paysId: 1}, ...]
}

// 3. Charger les villes quand une province est sélectionnée
async function loadVilles(provinceId) {
  const response = await fetch(`${API_URL}/locations/villes?provinceId=${provinceId}`);
  const result = await response.json();
  return result.data; // [{id: 1, nom: "Kinshasa", provinceId: 1}, ...]
}

// 4. Charger les communes quand une ville est sélectionnée
async function loadCommunes(villeId) {
  const response = await fetch(`${API_URL}/locations/communes?villeId=${villeId}`);
  const result = await response.json();
  return result.data; // [{id: 1, nom: "Gombe", villeId: 1}, ...]
}

// Exemple d'utilisation
const pays = await loadPays();
console.log(pays); // Affiche tous les pays

const provinces = await loadProvinces(1); // Provinces de la RDC
console.log(provinces); // Affiche les provinces de la RDC

const villes = await loadVilles(1); // Villes de Kinshasa
console.log(villes); // Affiche les villes de Kinshasa

const communes = await loadCommunes(1); // Communes de Kinshasa ville
console.log(communes); // Affiche les communes de Kinshasa
```

---

## 🧪 Tests

Un script de test est disponible pour tester tous les endpoints :

```bash
# Rendre le script exécutable
chmod +x test_locations_endpoints.sh

# Exécuter les tests
./test_locations_endpoints.sh
```

---

## 🔒 Authentification

Tous les endpoints sont **publics** (pas d'authentification requise).

---

## ⚡ Performance

Les données sont **statiques** et stockées en mémoire, ce qui garantit :
- ✅ Temps de réponse < 10ms
- ✅ Pas de charge sur la base de données
- ✅ Disponibilité instantanée

---

## 🛠️ Modification des données

Les données sont définies dans le fichier :
```
app/controllers/locations_controller.ts
```

Pour ajouter de nouvelles villes ou communes, modifiez les tableaux `villes` et `communes` dans ce fichier, puis rebuilder :

```bash
pm2 stop rapidos-backend
npm run build
pm2 start rapidos-backend
```

---

## 📝 Exemple de formulaire HTML

```html
<form>
  <label>Pays:</label>
  <select id="pays" onchange="loadProvinces(this.value)">
    <option value="">Sélectionnez un pays</option>
  </select>

  <label>Province:</label>
  <select id="province" onchange="loadVilles(this.value)">
    <option value="">Sélectionnez une province</option>
  </select>

  <label>Ville:</label>
  <select id="ville" onchange="loadCommunes(this.value)">
    <option value="">Sélectionnez une ville</option>
  </select>

  <label>Commune:</label>
  <select id="commune">
    <option value="">Sélectionnez une commune</option>
  </select>
</form>

<script>
  // Charger les pays au démarrage
  fetch('/locations/pays')
    .then(r => r.json())
    .then(result => {
      const select = document.getElementById('pays');
      result.data.forEach(pays => {
        select.innerHTML += `<option value="${pays.id}">${pays.nom}</option>`;
      });
    });

  function loadProvinces(paysId) {
    fetch(`/locations/provinces?paysId=${paysId}`)
      .then(r => r.json())
      .then(result => {
        const select = document.getElementById('province');
        select.innerHTML = '<option value="">Sélectionnez une province</option>';
        result.data.forEach(province => {
          select.innerHTML += `<option value="${province.id}">${province.nom}</option>`;
        });
      });
  }

  function loadVilles(provinceId) {
    fetch(`/locations/villes?provinceId=${provinceId}`)
      .then(r => r.json())
      .then(result => {
        const select = document.getElementById('ville');
        select.innerHTML = '<option value="">Sélectionnez une ville</option>';
        result.data.forEach(ville => {
          select.innerHTML += `<option value="${ville.id}">${ville.nom}</option>`;
        });
      });
  }

  function loadCommunes(villeId) {
    fetch(`/locations/communes?villeId=${villeId}`)
      .then(r => r.json())
      .then(result => {
        const select = document.getElementById('commune');
        select.innerHTML = '<option value="">Sélectionnez une commune</option>';
        result.data.forEach(commune => {
          select.innerHTML += `<option value="${commune.id}">${commune.nom}</option>`;
        });
      });
  }
</script>
```

---

## 🎉 C'est tout !

Les endpoints sont simples et efficaces. N'hésite pas à les utiliser dans ton application ! 🚀
