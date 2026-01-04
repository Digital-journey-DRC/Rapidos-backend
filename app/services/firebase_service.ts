import admin from 'firebase-admin'
import AppSecret from '#models/app_secret'

let firebaseInitialized = false
let firestoreDb: admin.firestore.Firestore | null = null

/**
 * Initialise Firebase avec les credentials depuis la BD
 */
async function initializeFirebase(): Promise<void> {
  if (firebaseInitialized && admin.apps.length > 0) {
    return
  }

  try {
    // Récupérer les credentials depuis la BD
    const projectIdSecret = await AppSecret.findBy('key', 'FIREBASE_PROJECT_ID')
    const clientEmailSecret = await AppSecret.findBy('key', 'FIREBASE_CLIENT_EMAIL')
    const privateKeySecret = await AppSecret.findBy('key', 'FIREBASE_PRIVATE_KEY')

    if (!projectIdSecret || !clientEmailSecret || !privateKeySecret) {
      console.error('Firebase credentials non trouvés dans la BD. Utilisez /app-secrets/init-firebase pour les initialiser.')
      return
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectIdSecret.value,
          clientEmail: clientEmailSecret.value,
          privateKey: privateKeySecret.value,
        }),
      })
    }

    firestoreDb = admin.firestore()
    firebaseInitialized = true
    console.log('Firebase initialisé avec succès depuis la BD')
  } catch (error) {
    console.error('Erreur initialisation Firebase:', error)
  }
}

/**
 * Récupère l'instance Firestore (initialise si nécessaire)
 */
async function getFirestore(): Promise<admin.firestore.Firestore> {
  if (!firebaseInitialized || !firestoreDb) {
    await initializeFirebase()
  }
  if (!firestoreDb) {
    throw new Error('Firebase non initialisé. Vérifiez les credentials dans la table app_secrets.')
  }
  return firestoreDb
}

interface CartItem {
  id: number
  name: string
  category: string
  price: number
  imagePath: string
  quantity: number
  stock: number
  idVendeur: string
  description: string | null
}

interface CartOrder {
  timestamp: admin.firestore.FieldValue
  status: string
  phone: string
  client: string
  idClient: string
  adresse: string
  ville: string
  commune: string
  quartier: string
  avenue: string
  numero: string
  pays: string
  longitude: number
  latitude: number
  total: number
  items: CartItem[]
}

/**
 * Enregistre une commande dans la collection "carts" de Firestore
 */
export async function saveOrderToFirestore(orderData: CartOrder): Promise<string> {
  const db = await getFirestore()
  const docRef = await db.collection('carts').add(orderData)
  return docRef.id
}

/**
 * Met à jour un document dans la collection "carts" de Firestore
 */
export async function updateOrderInFirestore(
  docId: string,
  updateData: Record<string, any>
): Promise<boolean> {
  try {
    const db = await getFirestore()
    await db.collection('carts').doc(docId).update({
      ...updateData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('Erreur mise à jour Firestore:', error)
    return false
  }
}

/**
 * Récupère le FCM token d'un vendeur depuis Firestore
 */
export async function getVendorFcmToken(vendorId: string): Promise<string | null> {
  const db = await getFirestore()
  const doc = await db.collection('users').doc(vendorId).get()
  if (doc.exists) {
    const data = doc.data()
    return data?.fcmToken || null
  }
  return null
}

/**
 * Envoie une notification push à un vendeur
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<boolean> {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
    })
    return true
  } catch (error) {
    console.error('Erreur envoi notification push:', error)
    return false
  }
}

/**
 * Notifie tous les vendeurs concernés par une commande
 */
export async function notifyVendors(
  items: CartItem[],
  clientName: string,
  orderId: string
): Promise<void> {
  // Extraire les idVendeur uniques
  const uniqueVendorIds = [...new Set(items.map((item) => item.idVendeur))]

  for (const vendorId of uniqueVendorIds) {
    const fcmToken = await getVendorFcmToken(vendorId)
    if (fcmToken) {
      await sendPushNotification(
        fcmToken,
        'Nouvelle commande',
        `Vous avez reçu une nouvelle commande de ${clientName}`,
        {
          orderId,
          type: 'new_order',
        }
      )
    }
  }
}

export { admin, getFirestore, initializeFirebase }
