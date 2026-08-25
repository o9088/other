const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Incluir la URL de Realtime Database aquí
    databaseURL: "https://push-subs-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

const db = admin.database();

async function ejecutarProcesoPush() {
  try {
    // A. Leer todos los registros dentro del nodo 'tokens'
    const snapshot = await db.ref('tokens').once('value');
    const data = snapshot.val();

    if (!data) {
      console.log('No hay tokens registrados en la base de datos.');
      return;
    }

    // Extraer la lista de tokens originales
    const tokens = Object.values(data).map(item => item.token);
    console.log(`Procesando ${tokens.length} tokens...`);

    // B. Suscribir los tokens al topic "todos" en lotes de máximo 1,000
    const batchSize = 1000;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const chunk = tokens.slice(i, i + batchSize);
      await admin.messaging().subscribeToTopic(chunk, 'todos');
    }
    console.log('Tokens suscritos al topic "todos" con éxito.');

    // C. Enviar la notificación con imagen y enlace
    const message = {
      topic: 'todos',
      notification: {
        title: 'Halo, saya Indah',
        body: 'saya kembali untuk menunjukkan lebih banyak pornografi.',
        imageUrl: 'https://ads-nice.pages.dev/600x300.png'
      },
      webpush: {
        notification: {
          image: 'https://ads-nice.pages.dev/600x300.png',
          icon: 'https://ads-nice.pages.dev/192.png'
        },
        fcmOptions: {
          link: 'https://www.profitableratecpmnetwork.com/jjjp1mkj?key=7c0c9c5ced52acd07c339632196ab332' // Enlace al hacer tap
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Notificación enviada con éxito:', response);

  } catch (error) {
    console.error('Error durante la ejecución:', error);
    process.exit(1);
  }
}

ejecutarProcesoPush();

// Al final de tu archivo send-push.js, dentro de la función ejecutarProcesoPush():

    const response = await admin.messaging().send(message);
    console.log('Notificación enviada con éxito:', response);

    // 🔴 AÑADE ESTA LÍNEA AL FINAL DE LA FUNCIÓN:
    process.exit(0);

  } catch (error) {
    console.error('Error durante la ejecución:', error);
    process.exit(1);
  }
}
