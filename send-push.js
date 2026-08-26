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

    // Mapear claves y tokens para poder eliminar luego por ID de Firebase
    const entries = Object.entries(data); // Array de [key, value]
    const tokens = entries.map(([key, item]) => item.token);
    console.log(`Procesando ${tokens.length} tokens...`);

    // 2. Suscribir los tokens al topic "todos" y LIMPIAR los desinstalados/inválidos
    const batchSize = 1000;
    for (let i = 0; i < entries.length; i += batchSize) {
      const chunkEntries = entries.slice(i, i + batchSize);
      const chunkTokens = chunkEntries.map(([key, item]) => item.token);
      
      const response = await admin.messaging().subscribeToTopic(chunkTokens, 'todos');
      
      // Si Firebase detecta tokens caducados o desinstalados, los borramos
      if (response.failureCount > 0) {
        console.log(`Detectados ${response.failureCount} tokens inválidos en el lote. Limpiando...`);
        
        const deletePromises = [];
        response.errors.forEach((error, index) => {
          const errorCode = error.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            const firebaseKey = chunkEntries[index][0];
            deletePromises.push(db.ref(`tokens/${firebaseKey}`).remove());
          }
        });

        await Promise.all(deletePromises);
        console.log('Tokens caducados eliminados de Realtime Database.');
      }
    }
    console.log('Proceso de suscripción y verificación completado.');

    // 3. Configuración enviando solo datos (Evita la duplicación por completo)
 // Configuración optimizada para MÁXIMO CTR
    const message = {
      topic: 'todos',
      data: {
        title: 'Kami punya sesuatu yang istimewa untuk Anda.',
        body: 'Ini foto-foto baru, silakan lihat. Kami adalah iklan."',
        image: 'https://independencelove.site/600x300.png',
        icon: 'https://independencelove.site/192.png',
        url: 'https://independencelove.site/?cl=4944&subid=4944'
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
