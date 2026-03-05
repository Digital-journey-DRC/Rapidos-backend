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
   *
   * Query params optionnels :
   *   ?filtre=journalier|mensuel|semestriel|annuel  (défaut: pas de filtre → tout)
   *   ?type=express|ecommerce|tous                  (défaut: tous)
   *   ?limit=10                                      (limite top produits / top clients, max 50)
   */
  async statsGlobal({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const vendorId = user.id

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
      // 1. RÉSUMÉ par statut (express + ecommerce)
      // ═══════════════════════════════════════════════════════
      let expressResume: any = { total_commandes_livrees: 0, chiffre_affaires: 0 }
      let ecommerceResume: any = { total_commandes_livrees: 0, chiffre_affaires: 0 }

      if (includeExpress) {
        const r = await db.rawQuery(
          `SELECT 
             COUNT(*)::int AS total_commandes_livrees,
             COALESCE(SUM(package_value), 0) AS chiffre_affaires
           FROM commande_express
           WHERE vendor_id = ? AND statut = 'livre' AND ${dateSql()}`,
          [vendorId]
        )
        expressResume = r.rows[0] || expressResume
      }

      if (includeEcommerce) {
        const r = await db.rawQuery(
          `SELECT 
             COUNT(*)::int AS total_commandes_livrees,
             COALESCE(SUM(total), 0) AS chiffre_affaires
           FROM ecommerce_orders
           WHERE vendor_id = ? AND status = 'delivered' AND ${dateSql()}`,
          [vendorId]
        )
        ecommerceResume = r.rows[0] || ecommerceResume
      }

      // ═══════════════════════════════════════════════════════
      // 2. COMMANDES DÉTAILLÉES (infos client, produits, quantité, total partiel)
      // ═══════════════════════════════════════════════════════
      let commandes: any[] = []

      if (includeExpress) {
        const expressOrders = await db.rawQuery(
          `SELECT
             ce.id, ce.order_id, ce.client_name, ce.client_phone, ce.client_id,
             u.first_name, u.last_name, u.email AS client_email,
             ce.package_description, ce.package_value, ce.items, ce.statut,
             ce.pickup_address, ce.delivery_address, ce.created_at
           FROM commande_express ce
           LEFT JOIN users u ON ce.client_id = u.id
           WHERE ce.vendor_id = ? AND ce.statut = 'livre' AND ${dateSql('ce')}
           ORDER BY ce.created_at DESC`,
          [vendorId]
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
          } catch { /* items invalide, on continue */ }

          commandes.push({
            id: row.id,
            order_id: row.order_id,
            type_commande: 'express',
            informations_client: {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
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
             eo.items, eo.total, eo.status, eo.address, eo.delivery_fee,
             COALESCE(pm.type, 'non_defini') AS moyen_paiement,
             eo.created_at
           FROM ecommerce_orders eo
           LEFT JOIN users u ON eo.client_id = u.id
           LEFT JOIN payment_methods pm ON eo.payment_method_id = pm.id
           WHERE eo.vendor_id = ? AND eo.status = 'delivered' AND ${dateSql('eo')}
           ORDER BY eo.created_at DESC`,
          [vendorId]
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

          commandes.push({
            id: row.id,
            order_id: row.order_id,
            type_commande: 'ecommerce',
            informations_client: {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
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

      // Tri final par date décroissante
      commandes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const totalGeneral = commandes.reduce((s: number, c: any) => s + c.total_partiel, 0)

      // ═══════════════════════════════════════════════════════
      // 3. PRODUITS LES PLUS VENDUS
      // ═══════════════════════════════════════════════════════
      const produitsMap = new Map<string, any>()

      if (includeExpress) {
        const ep = await db.rawQuery(
          `SELECT
             item->>'name' AS nom_produit,
             COALESCE((item->>'productId')::text, item->>'name') AS product_key,
             SUM(COALESCE((item->>'quantity')::int, 1))::int AS quantite_vendue,
             SUM(COALESCE((item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::int, 1)) AS montant_total,
             COUNT(DISTINCT ce.id)::int AS nombre_commandes
           FROM commande_express ce,
                jsonb_array_elements(ce.items) AS item
           WHERE ce.vendor_id = ? AND ce.statut = 'livre' AND ${dateSql('ce')}
           GROUP BY item->>'name', item->>'productId'`,
          [vendorId]
        )
        for (const row of ep.rows) {
          const key = row.product_key || row.nom_produit
          if (!produitsMap.has(key)) {
            produitsMap.set(key, { nom_produit: row.nom_produit, quantite_vendue: 0, montant_total: 0, nombre_commandes: 0 })
          }
          const e = produitsMap.get(key)!
          e.quantite_vendue += row.quantite_vendue
          e.montant_total += Number(row.montant_total)
          e.nombre_commandes += row.nombre_commandes
        }
      }

      if (includeEcommerce) {
        const ep = await db.rawQuery(
          `SELECT
             item->>'name' AS nom_produit,
             COALESCE((item->>'productId')::text, item->>'name') AS product_key,
             SUM((item->>'quantity')::int)::int AS quantite_vendue,
             SUM((item->>'price')::numeric * (item->>'quantity')::int) AS montant_total,
             COUNT(DISTINCT eo.id)::int AS nombre_commandes
           FROM ecommerce_orders eo,
                jsonb_array_elements(eo.items) AS item
           WHERE eo.vendor_id = ? AND eo.status = 'delivered' AND ${dateSql('eo')}
           GROUP BY item->>'name', item->>'productId'`,
          [vendorId]
        )
        for (const row of ep.rows) {
          const key = row.product_key || row.nom_produit
          if (!produitsMap.has(key)) {
            produitsMap.set(key, { nom_produit: row.nom_produit, quantite_vendue: 0, montant_total: 0, nombre_commandes: 0 })
          }
          const e = produitsMap.get(key)!
          e.quantite_vendue += row.quantite_vendue
          e.montant_total += Number(row.montant_total)
          e.nombre_commandes += row.nombre_commandes
        }
      }

      const produitsLesPlusVendus = Array.from(produitsMap.values())
        .sort((a, b) => b.quantite_vendue - a.quantite_vendue)
        .slice(0, limit)
        .map((p, i) => ({ rang: i + 1, ...p }))

      // ═══════════════════════════════════════════════════════
      // 4. CLIENTS LES PLUS COMMANDÉS (fidélisation)
      // ═══════════════════════════════════════════════════════
      const clientsMap = new Map<string, any>()

      if (includeExpress) {
        const ec = await db.rawQuery(
          `SELECT
             ce.client_id, ce.client_name, ce.client_phone,
             u.email AS client_email, u.first_name, u.last_name,
             COUNT(*)::int AS nombre_commandes,
             COALESCE(SUM(ce.package_value), 0) AS montant_total,
             MAX(ce.created_at) AS derniere_commande
           FROM commande_express ce
           LEFT JOIN users u ON ce.client_id = u.id
           WHERE ce.vendor_id = ? AND ce.statut = 'livre' AND ${dateSql('ce')}
           GROUP BY ce.client_id, ce.client_name, ce.client_phone, u.email, u.first_name, u.last_name`,
          [vendorId]
        )
        for (const row of ec.rows) {
          const key = `${row.client_id}`
          if (!clientsMap.has(key)) {
            clientsMap.set(key, {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
              nombre_commandes: 0,
              montant_total: 0,
              derniere_commande: null,
            })
          }
          const e = clientsMap.get(key)!
          e.nombre_commandes += row.nombre_commandes
          e.montant_total += Number(row.montant_total)
          if (!e.derniere_commande || new Date(row.derniere_commande) > new Date(e.derniere_commande)) {
            e.derniere_commande = row.derniere_commande
          }
        }
      }

      if (includeEcommerce) {
        const ec = await db.rawQuery(
          `SELECT
             eo.client_id, eo.client AS client_name, eo.phone AS client_phone,
             u.email AS client_email, u.first_name, u.last_name,
             COUNT(*)::int AS nombre_commandes,
             COALESCE(SUM(eo.total), 0) AS montant_total,
             MAX(eo.created_at) AS derniere_commande
           FROM ecommerce_orders eo
           LEFT JOIN users u ON eo.client_id = u.id
           WHERE eo.vendor_id = ? AND eo.status = 'delivered' AND ${dateSql('eo')}
           GROUP BY eo.client_id, eo.client, eo.phone, u.email, u.first_name, u.last_name`,
          [vendorId]
        )
        for (const row of ec.rows) {
          const key = `${row.client_id}`
          if (!clientsMap.has(key)) {
            clientsMap.set(key, {
              client_id: row.client_id,
              nom: row.client_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
              telephone: row.client_phone,
              email: row.client_email || null,
              nombre_commandes: 0,
              montant_total: 0,
              derniere_commande: null,
            })
          }
          const e = clientsMap.get(key)!
          e.nombre_commandes += row.nombre_commandes
          e.montant_total += Number(row.montant_total)
          if (!e.derniere_commande || new Date(row.derniere_commande) > new Date(e.derniere_commande)) {
            e.derniere_commande = row.derniere_commande
          }
        }
      }

      const clientsLesPlusCommandes = Array.from(clientsMap.values())
        .sort((a, b) => b.nombre_commandes - a.nombre_commandes)
        .slice(0, limit)
        .map((c, i) => ({
          rang: i + 1,
          ...c,
          potentiel_fidelisation: c.nombre_commandes >= 5 ? 'élevé' : c.nombre_commandes >= 3 ? 'moyen' : 'faible',
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
              total_commandes_livrees: (expressResume.total_commandes_livrees || 0) + (ecommerceResume.total_commandes_livrees || 0),
              chiffre_affaires: Number(expressResume.chiffre_affaires || 0) + Number(ecommerceResume.chiffre_affaires || 0),
            },
          },
          total_general: totalGeneral,
          nombre_commandes: commandes.length,
          commandes,
          produits_les_plus_vendus: produitsLesPlusVendus,
          clients_les_plus_commandes: clientsLesPlusCommandes,
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
