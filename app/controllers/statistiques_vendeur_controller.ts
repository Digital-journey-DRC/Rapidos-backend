import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'

export default class StatistiquesVendeurController {
  /**
   * GET /statistiques/vendeur/express
   * Statistiques des ventes commandes express du vendeur connecté
   */
  async statsCommandeExpress({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const vendorId = user.id

      // 1. Totaux par statut
      const parStatut = await db.rawQuery(
        `SELECT statut, COUNT(*)::int AS nombre, COALESCE(SUM(package_value), 0) AS montant_total
         FROM commande_express
         WHERE vendor_id = ?
         GROUP BY statut
         ORDER BY statut`,
        [vendorId]
      )

      // 2. Résumé global
      const resume = await db.rawQuery(
        `SELECT 
           COUNT(*)::int AS total_commandes,
           COALESCE(SUM(package_value), 0) AS chiffre_affaires_total,
           COALESCE(SUM(CASE WHEN statut = 'livre' THEN package_value ELSE 0 END), 0) AS chiffre_affaires_livre,
           COUNT(CASE WHEN statut = 'pending' THEN 1 END)::int AS en_attente,
           COUNT(CASE WHEN statut = 'en_cours' THEN 1 END)::int AS en_cours,
           COUNT(CASE WHEN statut = 'livre' THEN 1 END)::int AS livrees,
           COUNT(CASE WHEN statut = 'annule' THEN 1 END)::int AS annulees
         FROM commande_express
         WHERE vendor_id = ?`,
        [vendorId]
      )

      // 3. Stats par jour (30 derniers jours)
      const parJour = await db.rawQuery(
        `SELECT 
           DATE(created_at) AS date,
           COUNT(*)::int AS nombre,
           COALESCE(SUM(package_value), 0) AS montant_total
         FROM commande_express
         WHERE vendor_id = ?
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [vendorId]
      )

      // 4. Stats par mois (12 derniers mois)
      const parMois = await db.rawQuery(
        `SELECT 
           TO_CHAR(created_at, 'YYYY-MM') AS mois,
           COUNT(*)::int AS nombre,
           COALESCE(SUM(package_value), 0) AS montant_total,
           COUNT(CASE WHEN statut = 'livre' THEN 1 END)::int AS livrees
         FROM commande_express
         WHERE vendor_id = ?
           AND created_at >= NOW() - INTERVAL '12 months'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY mois DESC`,
        [vendorId]
      )

      // 5. Top clients
      const topClients = await db.rawQuery(
        `SELECT 
           client_name,
           client_phone,
           COUNT(*)::int AS nombre_commandes,
           COALESCE(SUM(package_value), 0) AS montant_total
         FROM commande_express
         WHERE vendor_id = ?
         GROUP BY client_name, client_phone
         ORDER BY nombre_commandes DESC
         LIMIT 10`,
        [vendorId]
      )

      return response.status(200).json({
        success: true,
        data: {
          resume: resume.rows[0] || {},
          parStatut: parStatut.rows,
          parJour: parJour.rows,
          parMois: parMois.rows,
          topClients: topClients.rows,
        },
      })
    } catch (error) {
      logger.error('Erreur statistiques commandes express vendeur', {
        vendorId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques express',
        error: error.message,
      })
    }
  }

  /**
   * GET /statistiques/vendeur/ecommerce
   * Statistiques des ventes commandes ecommerce (normales) du vendeur connecté
   */
  async statsCommandeEcommerce({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const vendorId = user.id

      // 1. Totaux par statut
      const parStatut = await db.rawQuery(
        `SELECT status, COUNT(*)::int AS nombre, COALESCE(SUM(total), 0) AS montant_total
         FROM ecommerce_orders
         WHERE vendor_id = ?
         GROUP BY status
         ORDER BY status`,
        [vendorId]
      )

      // 2. Résumé global
      const resume = await db.rawQuery(
        `SELECT 
           COUNT(*)::int AS total_commandes,
           COALESCE(SUM(total), 0) AS chiffre_affaires_total,
           COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS chiffre_affaires_livre,
           COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS en_attente,
           COUNT(CASE WHEN status = 'pending_payment' THEN 1 END)::int AS en_attente_paiement,
           COUNT(CASE WHEN status = 'en_preparation' THEN 1 END)::int AS en_preparation,
           COUNT(CASE WHEN status = 'pret_a_expedier' THEN 1 END)::int AS pret_a_expedier,
           COUNT(CASE WHEN status = 'accepte_livreur' THEN 1 END)::int AS accepte_livreur,
           COUNT(CASE WHEN status = 'en_route' THEN 1 END)::int AS en_route,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END)::int AS livrees,
           COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int AS annulees,
           COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int AS rejetees
         FROM ecommerce_orders
         WHERE vendor_id = ?`,
        [vendorId]
      )

      // 3. Stats par jour (30 derniers jours)
      const parJour = await db.rawQuery(
        `SELECT 
           DATE(created_at) AS date,
           COUNT(*)::int AS nombre,
           COALESCE(SUM(total), 0) AS montant_total
         FROM ecommerce_orders
         WHERE vendor_id = ?
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [vendorId]
      )

      // 4. Stats par mois (12 derniers mois)
      const parMois = await db.rawQuery(
        `SELECT 
           TO_CHAR(created_at, 'YYYY-MM') AS mois,
           COUNT(*)::int AS nombre,
           COALESCE(SUM(total), 0) AS montant_total,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END)::int AS livrees
         FROM ecommerce_orders
         WHERE vendor_id = ?
           AND created_at >= NOW() - INTERVAL '12 months'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY mois DESC`,
        [vendorId]
      )

      // 5. Top produits vendus (basé sur items JSONB)
      const topProduits = await db.rawQuery(
        `SELECT 
           item->>'name' AS produit,
           SUM((item->>'quantity')::int)::int AS quantite_vendue,
           SUM((item->>'price')::numeric * (item->>'quantity')::int) AS montant_total
         FROM ecommerce_orders,
              jsonb_array_elements(items) AS item
         WHERE vendor_id = ?
           AND status = 'delivered'
         GROUP BY item->>'name'
         ORDER BY quantite_vendue DESC
         LIMIT 10`,
        [vendorId]
      )

      // 6. Stats par moyen de paiement
      const parMoyenPaiement = await db.rawQuery(
        `SELECT 
           COALESCE(pm.type, 'non_defini') AS moyen_paiement,
           COUNT(*)::int AS nombre,
           COALESCE(SUM(eo.total), 0) AS montant_total,
           COUNT(CASE WHEN eo.status = 'delivered' THEN 1 END)::int AS livrees
         FROM ecommerce_orders eo
         LEFT JOIN payment_methods pm ON eo.payment_method_id = pm.id
         WHERE eo.vendor_id = ?
         GROUP BY pm.type
         ORDER BY nombre DESC`,
        [vendorId]
      )

      // 7. Stats par produit avec moyen de paiement imbriqué
      const produitsAvecPaiement = await db.rawQuery(
        `SELECT 
           (item->>'productId')::int AS product_id,
           item->>'name' AS produit,
           COALESCE(pm.type, 'non_defini') AS moyen_paiement,
           SUM((item->>'quantity')::int)::int AS quantite,
           SUM((item->>'price')::numeric * (item->>'quantity')::int) AS montant,
           COUNT(DISTINCT eo.id)::int AS nombre_commandes
         FROM ecommerce_orders eo
         LEFT JOIN payment_methods pm ON eo.payment_method_id = pm.id,
              jsonb_array_elements(eo.items) AS item
         WHERE eo.vendor_id = ?
         GROUP BY item->>'productId', item->>'name', pm.type
         ORDER BY quantite DESC`,
        [vendorId]
      )

      // Regrouper par produit avec sous-tableau parMoyenPaiement
      const produitsMap = new Map<string, any>()
      for (const row of produitsAvecPaiement.rows) {
        const key = `${row.product_id}_${row.produit}`
        if (!produitsMap.has(key)) {
          produitsMap.set(key, {
            productId: row.product_id,
            produit: row.produit,
            quantite_vendue: 0,
            montant_total: 0,
            nombre_commandes: 0,
            parMoyenPaiement: [],
          })
        }
        const entry = produitsMap.get(key)!
        entry.quantite_vendue += row.quantite
        entry.montant_total += Number(row.montant)
        entry.nombre_commandes += row.nombre_commandes
        entry.parMoyenPaiement.push({
          moyen_paiement: row.moyen_paiement,
          quantite: row.quantite,
          montant: row.montant,
        })
      }
      const parProduit = Array.from(produitsMap.values()).sort(
        (a: any, b: any) => b.quantite_vendue - a.quantite_vendue
      )

      return response.status(200).json({
        success: true,
        data: {
          resume: resume.rows[0] || {},
          parStatut: parStatut.rows,
          parJour: parJour.rows,
          parMois: parMois.rows,
          topProduits: topProduits.rows,
          parMoyenPaiement: parMoyenPaiement.rows,
          parProduit,
        },
      })
    } catch (error) {
      logger.error('Erreur statistiques commandes ecommerce vendeur', {
        vendorId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques ecommerce',
        error: error.message,
      })
    }
  }

  /**
   * GET /statistiques/vendeur/global
   * Résumé combiné des deux types de commandes du vendeur connecté
   */
  async statsGlobal({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const vendorId = user.id

      // Stats express
      const express = await db.rawQuery(
        `SELECT 
           COUNT(*)::int AS total_commandes,
           COALESCE(SUM(package_value), 0) AS chiffre_affaires_total,
           COALESCE(SUM(CASE WHEN statut = 'livre' THEN package_value ELSE 0 END), 0) AS chiffre_affaires_livre,
           COUNT(CASE WHEN statut = 'pending' THEN 1 END)::int AS en_attente,
           COUNT(CASE WHEN statut = 'en_cours' THEN 1 END)::int AS en_cours,
           COUNT(CASE WHEN statut = 'livre' THEN 1 END)::int AS livrees,
           COUNT(CASE WHEN statut = 'annule' THEN 1 END)::int AS annulees
         FROM commande_express
         WHERE vendor_id = ?`,
        [vendorId]
      )

      // Stats ecommerce
      const ecommerce = await db.rawQuery(
        `SELECT 
           COUNT(*)::int AS total_commandes,
           COALESCE(SUM(total), 0) AS chiffre_affaires_total,
           COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS chiffre_affaires_livre,
           COUNT(CASE WHEN status IN ('pending', 'pending_payment') THEN 1 END)::int AS en_attente,
           COUNT(CASE WHEN status IN ('en_preparation', 'pret_a_expedier', 'accepte_livreur', 'en_route') THEN 1 END)::int AS en_cours,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END)::int AS livrees,
           COUNT(CASE WHEN status IN ('cancelled', 'rejected') THEN 1 END)::int AS annulees
         FROM ecommerce_orders
         WHERE vendor_id = ?`,
        [vendorId]
      )

      const expressData = express.rows[0] || {}
      const ecommerceData = ecommerce.rows[0] || {}

      return response.status(200).json({
        success: true,
        data: {
          express: expressData,
          ecommerce: ecommerceData,
          combine: {
            total_commandes: (expressData.total_commandes || 0) + (ecommerceData.total_commandes || 0),
            chiffre_affaires_total: Number(expressData.chiffre_affaires_total || 0) + Number(ecommerceData.chiffre_affaires_total || 0),
            chiffre_affaires_livre: Number(expressData.chiffre_affaires_livre || 0) + Number(ecommerceData.chiffre_affaires_livre || 0),
            en_attente: (expressData.en_attente || 0) + (ecommerceData.en_attente || 0),
            en_cours: (expressData.en_cours || 0) + (ecommerceData.en_cours || 0),
            livrees: (expressData.livrees || 0) + (ecommerceData.livrees || 0),
            annulees: (expressData.annulees || 0) + (ecommerceData.annulees || 0),
          },
        },
      })
    } catch (error) {
      logger.error('Erreur statistiques globales vendeur', {
        vendorId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques globales',
        error: error.message,
      })
    }
  }
}
