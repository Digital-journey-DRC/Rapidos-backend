import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'

export default class StatistiquesLivreurController {
  /**
   * GET /statistiques/livreur/global
   * Statistiques de livraison complètes du livreur connecté
   *
   * Query params optionnels :
   *   ?filtre=journalier|mensuel|semestriel|annuel  (défaut: tout)
   *   ?type=express|ecommerce|tous                  (défaut: tous)
   *   ?limit=10                                      (max 50)
   */
  async statsGlobal({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const livreurId = user.id

      // ── Parsing des query params ──
      const filtreParam = request.input('filtre')
      const validFiltres = ['journalier', 'mensuel', 'semestriel', 'annuel']
      const filtre: string | null = validFiltres.includes(filtreParam) ? filtreParam : null

      const typeParam = request.input('type')
      const validTypes = ['express', 'ecommerce', 'tous']
      const type: string = validTypes.includes(typeParam) ? typeParam : 'tous'

      const limit = Math.min(Math.max(Number(request.input('limit')) || 10, 1), 50)

      // ── Clause de date dynamique ──
      const dateSql = (alias?: string): string => {
        const col = alias ? `${alias}.created_at` : 'created_at'
        if (!filtre) return '1=1'
        switch (filtre) {
          case 'journalier':
            return `${col} >= CURRENT_DATE`
          case 'mensuel':
            return `${col} >= DATE_TRUNC('month', CURRENT_DATE)`
          case 'semestriel':
            return `${col} >= CURRENT_DATE - INTERVAL '6 months'`
          case 'annuel':
            return `${col} >= DATE_TRUNC('year', CURRENT_DATE)`
          default:
            return '1=1'
        }
      }

      const filtreLabels: Record<string, string> = {
        journalier: "Aujourd'hui",
        mensuel: 'Ce mois',
        semestriel: 'Les 6 derniers mois',
        annuel: 'Cette année',
      }

      const includeExpress = type === 'express' || type === 'tous'
      const includeEcommerce = type === 'ecommerce' || type === 'tous'

      // ═══════════════════════════════════════════════════════
      // 1. RÉSUMÉ par statut
      // ═══════════════════════════════════════════════════════
      let expressResume: any = { total_livraisons_effectuees: 0, montant_total: 0 }
      let ecommerceResume: any = { total_livraisons_effectuees: 0, montant_total: 0 }

      if (includeExpress) {
        const r = await db.rawQuery(
          `SELECT
             COUNT(*)::int AS total_livraisons_effectuees,
             COALESCE(SUM(delivery_fee), 0) AS montant_total
           FROM commande_express
           WHERE delivery_person_id = ? AND statut = 'delivered' AND ${dateSql()}`,
          [livreurId]
        )
        expressResume = r.rows[0] || expressResume
      }

      if (includeEcommerce) {
        const r = await db.rawQuery(
          `SELECT
             COUNT(*)::int AS total_livraisons_effectuees,
             COALESCE(SUM(delivery_fee), 0) AS montant_total
           FROM ecommerce_orders
           WHERE delivery_person_id = ? AND status = 'delivered' AND ${dateSql()}`,
          [livreurId]
        )
        ecommerceResume = r.rows[0] || ecommerceResume
      }

      // ═══════════════════════════════════════════════════════
      // 2. LIVRAISONS DÉTAILLÉES (infos client, produits, quantité, total partiel)
      // ═══════════════════════════════════════════════════════
      let livraisons: any[] = []

      if (includeExpress) {
        const expressOrders = await db.rawQuery(
          `SELECT
             ce.id, ce.order_id, ce.client_name, ce.client_phone, ce.client_id,
             u.first_name, u.last_name, u.email AS client_email,
             v.first_name AS vendeur_first_name, v.last_name AS vendeur_last_name,
             v.phone AS vendeur_phone,
             ce.package_description, ce.package_value, ce.items, ce.statut,
             ce.pickup_address, ce.delivery_address, ce.created_at
           FROM commande_express ce
           LEFT JOIN users u ON ce.client_id = u.id
           LEFT JOIN users v ON ce.vendor_id = v.id
           WHERE ce.delivery_person_id = ? AND ce.statut = 'delivered' AND ${dateSql('ce')}
           ORDER BY ce.created_at DESC`,
          [livreurId]
        )

        for (const row of expressOrders.rows) {
          let produits: any[] = []
          let quantiteTotale = 0
          try {
            const items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
            if (Array.isArray(items)) {
              produits = items.map((it: any) => ({
                nom: it.name || it.nom || 'N/A',
                description: it.description || '',
                quantite: Number(it.quantity) || 1,
                prix_unitaire: Number(it.price) || 0,
                sous_total: (Number(it.price) || 0) * (Number(it.quantity) || 1),
              }))
              quantiteTotale = produits.reduce((s: number, p: any) => s + p.quantite, 0)
            }
          } catch { /* items invalide */ }

          livraisons.push({
            id: row.id,
            order_id: row.order_id,
            type_commande: 'express',
            informations_client: {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
            },
            informations_vendeur: {
              nom: `${row.vendeur_first_name || ''} ${row.vendeur_last_name || ''}`.trim(),
              telephone: row.vendeur_phone || null,
            },
            produits_commandes: produits,
            quantite: quantiteTotale,
            total_partiel: Number(row.package_value) || 0,
            statut: row.statut,
            adresse_pickup: row.pickup_address,
            adresse_livraison: row.delivery_address,
            date: row.created_at,
          })
        }
      }

      if (includeEcommerce) {
        const ecommerceOrders = await db.rawQuery(
          `SELECT
             eo.id, eo.order_id, eo.client AS client_name, eo.phone AS client_phone,
             eo.client_id, u.first_name, u.last_name, u.email AS client_email,
             v.first_name AS vendeur_first_name, v.last_name AS vendeur_last_name,
             v.phone AS vendeur_phone,
             eo.items, eo.total, eo.status, eo.address, eo.delivery_fee,
             COALESCE(pm.type, 'non_defini') AS moyen_paiement,
             eo.created_at
           FROM ecommerce_orders eo
           LEFT JOIN users u ON eo.client_id = u.id
           LEFT JOIN users v ON eo.vendor_id = v.id
           LEFT JOIN payment_methods pm ON eo.payment_method_id = pm.id
           WHERE eo.delivery_person_id = ? AND eo.status = 'delivered' AND ${dateSql('eo')}
           ORDER BY eo.created_at DESC`,
          [livreurId]
        )

        for (const row of ecommerceOrders.rows) {
          let produits: any[] = []
          let quantiteTotale = 0
          try {
            const items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || [])
            if (Array.isArray(items)) {
              produits = items.map((it: any) => ({
                product_id: it.productId || null,
                nom: it.name || 'N/A',
                quantite: Number(it.quantity) || 1,
                prix_unitaire: Number(it.price) || 0,
                sous_total: (Number(it.price) || 0) * (Number(it.quantity) || 1),
              }))
              quantiteTotale = produits.reduce((s: number, p: any) => s + p.quantite, 0)
            }
          } catch { /* items invalide */ }

          let adresseLivraison: string | null = null
          try {
            const addr = typeof row.address === 'string' ? JSON.parse(row.address) : row.address
            if (addr) {
              adresseLivraison = [addr.avenue, addr.numero, addr.quartier, addr.commune, addr.ville]
                .filter(Boolean)
                .join(', ')
            }
          } catch { /* address invalide */ }

          livraisons.push({
            id: row.id,
            order_id: row.order_id,
            type_commande: 'ecommerce',
            informations_client: {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
            },
            informations_vendeur: {
              nom: `${row.vendeur_first_name || ''} ${row.vendeur_last_name || ''}`.trim(),
              telephone: row.vendeur_phone || null,
            },
            produits_commandes: produits,
            quantite: quantiteTotale,
            total_partiel: Number(row.total) || 0,
            frais_livraison: Number(row.delivery_fee) || 0,
            moyen_paiement: row.moyen_paiement,
            statut: row.status,
            adresse_livraison: adresseLivraison,
            date: row.created_at,
          })
        }
      }

      // Tri par date décroissante
      livraisons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const totalGeneral = livraisons.reduce((s: number, c: any) => s + c.total_partiel, 0)

      // ═══════════════════════════════════════════════════════
      // 3. PRODUITS LES PLUS LIVRÉS
      // ═══════════════════════════════════════════════════════
      const produitsMap = new Map<string, any>()

      if (includeExpress) {
        const ep = await db.rawQuery(
          `SELECT
             item->>'name' AS nom_produit,
             COALESCE((item->>'productId')::text, item->>'name') AS product_key,
             SUM(COALESCE((item->>'quantity')::int, 1))::int AS quantite_livree,
             SUM(COALESCE((item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::int, 1)) AS montant_total,
             COUNT(DISTINCT ce.id)::int AS nombre_livraisons
           FROM commande_express ce,
                jsonb_array_elements(ce.items) AS item
           WHERE ce.delivery_person_id = ? AND ce.statut = 'delivered' AND ${dateSql('ce')}
           GROUP BY item->>'name', item->>'productId'`,
          [livreurId]
        )
        for (const row of ep.rows) {
          const key = row.product_key || row.nom_produit
          if (!produitsMap.has(key)) {
            produitsMap.set(key, { nom_produit: row.nom_produit, quantite_livree: 0, montant_total: 0, nombre_livraisons: 0 })
          }
          const e = produitsMap.get(key)!
          e.quantite_livree += row.quantite_livree
          e.montant_total += Number(row.montant_total)
          e.nombre_livraisons += row.nombre_livraisons
        }
      }

      if (includeEcommerce) {
        const ep = await db.rawQuery(
          `SELECT
             item->>'name' AS nom_produit,
             COALESCE((item->>'productId')::text, item->>'name') AS product_key,
             SUM((item->>'quantity')::int)::int AS quantite_livree,
             SUM((item->>'price')::numeric * (item->>'quantity')::int) AS montant_total,
             COUNT(DISTINCT eo.id)::int AS nombre_livraisons
           FROM ecommerce_orders eo,
                jsonb_array_elements(eo.items) AS item
           WHERE eo.delivery_person_id = ? AND eo.status = 'delivered' AND ${dateSql('eo')}
           GROUP BY item->>'name', item->>'productId'`,
          [livreurId]
        )
        for (const row of ep.rows) {
          const key = row.product_key || row.nom_produit
          if (!produitsMap.has(key)) {
            produitsMap.set(key, { nom_produit: row.nom_produit, quantite_livree: 0, montant_total: 0, nombre_livraisons: 0 })
          }
          const e = produitsMap.get(key)!
          e.quantite_livree += row.quantite_livree
          e.montant_total += Number(row.montant_total)
          e.nombre_livraisons += row.nombre_livraisons
        }
      }

      const produitsLesPlusLivres = Array.from(produitsMap.values())
        .sort((a, b) => b.quantite_livree - a.quantite_livree)
        .slice(0, limit)
        .map((p, i) => ({ rang: i + 1, ...p }))

      // ═══════════════════════════════════════════════════════
      // 4. CLIENTS LES PLUS LIVRÉS
      // ═══════════════════════════════════════════════════════
      const clientsMap = new Map<string, any>()

      if (includeExpress) {
        const ec = await db.rawQuery(
          `SELECT
             ce.client_id, ce.client_name, ce.client_phone,
             u.email AS client_email, u.first_name, u.last_name,
             COUNT(*)::int AS nombre_livraisons,
             COALESCE(SUM(ce.package_value), 0) AS montant_total,
             MAX(ce.created_at) AS derniere_livraison
           FROM commande_express ce
           LEFT JOIN users u ON ce.client_id = u.id
           WHERE ce.delivery_person_id = ? AND ce.statut = 'delivered' AND ${dateSql('ce')}
           GROUP BY ce.client_id, ce.client_name, ce.client_phone, u.email, u.first_name, u.last_name`,
          [livreurId]
        )
        for (const row of ec.rows) {
          const key = `${row.client_id}`
          if (!clientsMap.has(key)) {
            clientsMap.set(key, {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
              nombre_livraisons: 0,
              montant_total: 0,
              derniere_livraison: null,
            })
          }
          const e = clientsMap.get(key)!
          e.nombre_livraisons += row.nombre_livraisons
          e.montant_total += Number(row.montant_total)
          if (!e.derniere_livraison || new Date(row.derniere_livraison) > new Date(e.derniere_livraison)) {
            e.derniere_livraison = row.derniere_livraison
          }
        }
      }

      if (includeEcommerce) {
        const ec = await db.rawQuery(
          `SELECT
             eo.client_id, eo.client AS client_name, eo.phone AS client_phone,
             u.email AS client_email, u.first_name, u.last_name,
             COUNT(*)::int AS nombre_livraisons,
             COALESCE(SUM(eo.total), 0) AS montant_total,
             MAX(eo.created_at) AS derniere_livraison
           FROM ecommerce_orders eo
           LEFT JOIN users u ON eo.client_id = u.id
           WHERE eo.delivery_person_id = ? AND eo.status = 'delivered' AND ${dateSql('eo')}
           GROUP BY eo.client_id, eo.client, eo.phone, u.email, u.first_name, u.last_name`,
          [livreurId]
        )
        for (const row of ec.rows) {
          const key = `${row.client_id}`
          if (!clientsMap.has(key)) {
            clientsMap.set(key, {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
              nombre_livraisons: 0,
              montant_total: 0,
              derniere_livraison: null,
            })
          }
          const e = clientsMap.get(key)!
          e.nombre_livraisons += row.nombre_livraisons
          e.montant_total += Number(row.montant_total)
          if (!e.derniere_livraison || new Date(row.derniere_livraison) > new Date(e.derniere_livraison)) {
            e.derniere_livraison = row.derniere_livraison
          }
        }
      }

      const clientsLesPlusLivres = Array.from(clientsMap.values())
        .sort((a, b) => b.nombre_livraisons - a.nombre_livraisons)
        .slice(0, limit)
        .map((c, i) => ({
          rang: i + 1,
          ...c,
          frequence: c.nombre_livraisons >= 5 ? 'régulier' : c.nombre_livraisons >= 3 ? 'occasionnel' : 'nouveau',
        }))

      // ═══════════════════════════════════════════════════════
      // RÉPONSE FINALE
      // ═══════════════════════════════════════════════════════
      return response.status(200).json({
        success: true,
        filtre: filtre || 'tout',
        filtre_label: filtre ? filtreLabels[filtre] : 'Toutes les périodes',
        type,
        data: {
          resume: {
            express: includeExpress ? expressResume : undefined,
            ecommerce: includeEcommerce ? ecommerceResume : undefined,
            combine: {
              total_livraisons_effectuees: (expressResume.total_livraisons_effectuees || 0) + (ecommerceResume.total_livraisons_effectuees || 0),
              montant_total: Number(expressResume.montant_total || 0) + Number(ecommerceResume.montant_total || 0),
            },
          },
          total_general: totalGeneral,
          nombre_livraisons: livraisons.length,
          livraisons,
          produits_les_plus_livres: produitsLesPlusLivres,
          clients_les_plus_livres: clientsLesPlusLivres,
        },
      })
    } catch (error) {
      logger.error('Erreur statistiques globales livreur', {
        livreurId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques livreur',
        error: error.message,
      })
    }
  }
}
