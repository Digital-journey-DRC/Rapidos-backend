import { LabelToProductCategory, ProductCategory } from '../Enum/product_category.js'
import { DataCategory } from '../types/products.js'

export const LabelParseCategoryFromFrenchInEnglish = (data: DataCategory) => {
  // 3. Traduction : français → anglais (si applicable)
  const nameLower = data.name.toLowerCase()
  const translated = LabelToProductCategory[nameLower]

  // On remplace par la version anglaise traduite si elle existe
  if (translated) {
    data.name = translated
  }

  // 4. Vérifie que la catégorie est bien dans l'enum
  if (!Object.values(ProductCategory).includes(data.name)) {
    return {
      error: 'Catégorie invalide. Utilisez une valeur reconnue.',
    }
  }
  return data
}
