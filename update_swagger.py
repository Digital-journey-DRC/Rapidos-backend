#!/usr/bin/env python3
"""
Script pour mettre à jour la documentation Swagger avec les nouveaux champs d'images
"""
import re

def update_swagger():
    with open('docs/swagger.yaml', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update /products/store endpoint - remplacer medias par image, image1, image2, image3, image4
    products_store_old = """                medias:
                  type: array
                  items:
                    type: string
                    format: binary"""
    
    products_store_new = """                image:
                  type: string
                  format: binary
                  description: Image principale du produit (obligatoire, fichier ou URL)
                image1:
                  type: string
                  format: binary
                  description: Première image secondaire (optionnel, fichier ou URL)
                image2:
                  type: string
                  format: binary
                  description: Deuxième image secondaire (optionnel, fichier ou URL)
                image3:
                  type: string
                  format: binary
                  description: Troisième image secondaire (optionnel, fichier ou URL)
                image4:
                  type: string
                  format: binary
                  description: Quatrième image secondaire (optionnel, fichier ou URL)"""
    
    content = content.replace(products_store_old, products_store_new)
    
    # 2. Remove medias from required fields in /products/store
    content = re.sub(
        r'(\s+- category\n)\s+- medias',
        r'\1',
        content
    )
    
    # 3. Update Product schema to include image, images[], and vendeur
    product_schema_old = """    Product:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        description:
          type: string
        price:
          type: number
          format: float
        stock:
          type: integer
        categoryId:
          type: integer
        vendeurId:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        category:
          $ref: '#/components/schemas/Category'
        media:
          type: array
          items:
            $ref: '#/components/schemas/Media'"""
    
    product_schema_new = """    Product:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        description:
          type: string
        price:
          type: number
          format: float
        stock:
          type: integer
        categoryId:
          type: integer
        vendeurId:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        category:
          $ref: '#/components/schemas/Category'
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
              example: Mvi"""
    
    content = content.replace(product_schema_old, product_schema_new)
    
    # 4. Add ProductResponse schema for store responses
    if 'ProductResponse:' not in content:
        product_response_schema = """
    ProductResponse:
      type: object
      properties:
        id:
          type: integer
          example: 176
        name:
          type: string
          example: Chasubles de sport
        description:
          type: string
        price:
          type: number
          format: float
          example: 5.99
        stock:
          type: integer
          example: 100
        categoryId:
          type: integer
        vendeurId:
          type: integer
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
        category:
          $ref: '#/components/schemas/Category'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
"""
        # Insérer après le schéma Product
        content = content.replace(
            "    Media:\n      type: object",
            product_response_schema + "\n    Media:\n      type: object"
        )
    
    # 5. Update /products/update endpoint with individual image fields
    update_medias_old = """                medias:
                  type: array
                  items:
                    type: string
                    format: binary
      responses:
        '200':"""
    
    update_medias_new = """                image:
                  type: string
                  format: binary
                  description: Nouvelle image principale (optionnel)
                image1:
                  type: string
                  format: binary
                  description: Première image secondaire (optionnel)
                image2:
                  type: string
                  format: binary
                  description: Deuxième image secondaire (optionnel)
                image3:
                  type: string
                  format: binary
                  description: Troisième image secondaire (optionnel)
                image4:
                  type: string
                  format: binary
                  description: Quatrième image secondaire (optionnel)
      responses:
        '200':"""
    
    content = content.replace(update_medias_old, update_medias_new)
    
    # 6. Update summary and description for /products/store
    content = re.sub(
        r"(\s+/products/store:\n\s+post:\n\s+)summary: Création d'un produit avec médias",
        r"\1summary: Création d'un produit avec images\n      description: Crée un nouveau produit avec une image principale et jusqu'à 4 images secondaires. Les images sont uploadées sur Cloudinary.",
        content
    )
    
    # Write updated content
    with open('docs/swagger.yaml', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Documentation Swagger mise à jour avec succès!")
    print("\nChangements effectués:")
    print("- /products/store: Remplacé 'medias' par 'image', 'image1', 'image2', 'image3', 'image4'")
    print("- /products/update: Mis à jour avec les nouveaux champs image")
    print("- Schéma Product: Ajouté 'image', 'images[]', et 'vendeur'")
    print("- Ajouté schéma ProductResponse pour les réponses complètes")

if __name__ == '__main__':
    update_swagger()
