const admin = require('firebase-admin');

// Parsear credenciales de las variables de entorno
const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : process.env.FIREBASE_SERVICE_ACCOUNT;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://push-subs-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const db = admin.database();

// Declaración ASÍNCRONA de la función principal
async function ejecutarProcesoPush() {
  try {
    // 1. Leer todos los registros dentro del nodo 'tokens'
    const snapshot = await db.ref('tokens').once('value');
    const data = snapshot.val();

    if (!data) {
      console.log('No hay tokens registrados en la base de datos.');
      process.exit(0);
    }

    // Extraer la lista de tokens
    const tokens = Object.values(data).map(item => item.token);
    console.log(`Procesando ${tokens.length} tokens...`);

    // 2. Suscribir los tokens al topic "todos" en lotes de máximo 1,000
    const batchSize = 1000;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const chunk = tokens.slice(i, i + batchSize);
      await admin.messaging().subscribeToTopic(chunk, 'todos');
    }
    console.log('Tokens suscritos al topic "todos" con éxito.');

    // 3. Configuración y envío de la notificación Push
 // 3. Configuración y envío de la notificación Push limpia (sin duplicación)
// 3. Configuración enviando solo datos (Evita la duplicación por completo)
    const message = {
      topic: 'todos',
      data: {
        title: 'Halo, saya Indah',
        body: 'Anda dapat menonton lebih banyak konten porno dan konten lainnya lagi.',
        image: 'https://ads-nice.pages.dev/600x300.png',
        icon: 'https://ads-nice.pages.dev/192.png',
        url: 'https://www.profitableratecpmnetwork.com/jjjp1mkj?key=7c0c9c5ced52acd07c339632196ab332'
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Notificación enviada con éxito:', response);

    // Cierre limpio del proceso para evitar que GitHub Actions se quede colgado
    process.exit(0);

  } catch (error) {
    console.error('Error durante la ejecución:', error);
    process.exit(1);
  }
}

// Invocar la función asíncrona
ejecutarProcesoPush();
