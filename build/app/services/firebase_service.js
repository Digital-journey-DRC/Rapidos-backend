import admin from 'firebase-admin';
import AppSecret from '#models/app_secret';
let firebaseInitialized = false;
let firestoreDb = null;
async function initializeFirebase() {
    if (firebaseInitialized && admin.apps.length > 0) {
        return;
    }
    try {
        const projectIdSecret = await AppSecret.findBy('key', 'FIREBASE_PROJECT_ID');
        const clientEmailSecret = await AppSecret.findBy('key', 'FIREBASE_CLIENT_EMAIL');
        const privateKeySecret = await AppSecret.findBy('key', 'FIREBASE_PRIVATE_KEY');
        if (!projectIdSecret || !clientEmailSecret || !privateKeySecret) {
            console.error('Firebase credentials non trouvés dans la BD. Utilisez /app-secrets/init-firebase pour les initialiser.');
            return;
        }
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectIdSecret.value,
                    clientEmail: clientEmailSecret.value,
                    privateKey: privateKeySecret.value,
                }),
            });
        }
        firestoreDb = admin.firestore();
        firebaseInitialized = true;
        console.log('Firebase initialisé avec succès depuis la BD');
    }
    catch (error) {
        console.error('Erreur initialisation Firebase:', error);
    }
}
async function getFirestore() {
    if (!firebaseInitialized || !firestoreDb) {
        await initializeFirebase();
    }
    if (!firestoreDb) {
        throw new Error('Firebase non initialisé. Vérifiez les credentials dans la table app_secrets.');
    }
    return firestoreDb;
}
export async function saveOrderToFirestore(orderData) {
    const db = await getFirestore();
    const docRef = await db.collection('carts').add(orderData);
    return docRef.id;
}
export async function getVendorFcmToken(vendorId) {
    const db = await getFirestore();
    const doc = await db.collection('users').doc(vendorId).get();
    if (doc.exists) {
        const data = doc.data();
        return data?.fcmToken || null;
    }
    return null;
}
export async function sendPushNotification(fcmToken, title, body, data) {
    try {
        await admin.messaging().send({
            token: fcmToken,
            notification: {
                title,
                body,
            },
            data,
        });
        return true;
    }
    catch (error) {
        console.error('Erreur envoi notification push:', error);
        return false;
    }
}
export async function notifyVendors(items, clientName, orderId) {
    const uniqueVendorIds = [...new Set(items.map((item) => item.idVendeur))];
    for (const vendorId of uniqueVendorIds) {
        const fcmToken = await getVendorFcmToken(vendorId);
        if (fcmToken) {
            await sendPushNotification(fcmToken, 'Nouvelle commande', `Vous avez reçu une nouvelle commande de ${clientName}`, {
                orderId,
                type: 'new_order',
            });
        }
    }
}
export { admin, getFirestore, initializeFirebase };
//# sourceMappingURL=firebase_service.js.map