import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import readline from 'readline';
import open from 'open';
// =======================================================
// ⚠️ 1. REEMPLAZA TUS CREDENCIALES AQUÍ ⚠️
//
// NOTA: Estos valores DEBEN coincidir con los de tu Google Cloud Console.
// =======================================================
// Client ID de tu aplicación OAuth 2.0.
const CLIENT_ID = 'TU_CLIENT_ID_DE_GOOGLE_AQUÍ'; 

// Client Secret de tu aplicación OAuth 2.0. ¡Mantenlo SEGURO!
const CLIENT_SECRET = 'TU_CLIENT_SECRET_DE_GOOGLE_AQUÍ'; 

// URI de redirección que usarás para el TRUCO.
// Este valor DEBE estar registrado en la Consola de Google Cloud.
const REDIRECT_URI = 'http://localhost/success';  
// =======================================================

// El Scope que necesitas para Google Drive.
// 'https://www.googleapis.com/auth/drive' da acceso completo a Drive.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// =======================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * 🚀 Flujo para obtener el Refresh Token
 */
async function getRefreshToken() {
  const oauth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Genera la URL de autenticación
  // * 'access_type: offline' es CRUCIAL para obtener el Refresh Token.
  // * 'prompt: consent' fuerza al usuario a dar consentimiento y garantiza un nuevo Refresh Token.
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('----------------------------------------------------');
  console.log('PASO 1: Abre el siguiente enlace en tu navegador:');
  console.log('----------------------------------------------------');
  console.log(authUrl);
  console.log('\n(Intentando abrir automáticamente...)');
  
  // Abre automáticamente el enlace en el navegador
  await open(authUrl);

  // Solicita al usuario que pegue el código de autorización
  rl.question('\n\nPASO 2: Después de aprobar, pega el "código" (code) de la URL de redirección aquí y presiona Enter:\n> ', async (code) => {
    rl.close();
    
    try {
        // Intercambia el código de autorización por tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n\n====================================================');
        console.log('✅ ÉXITO: NUEVOS TOKENS OBTENIDOS');
        console.log('====================================================');
        
        if (tokens.refresh_token) {
            console.log('🔑 Nuevo REFRESH TOKEN (¡Cópialo en tu .env!):');
            console.log(`\n    ${tokens.refresh_token}\n`);
            
            // Puedes usar este token inmediatamente para subir un archivo
            oauth2Client.setCredentials(tokens);
            
            // Opcional: Verifica el token con una llamada a la API
            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            const res = await drive.about.get({ fields: 'user' });
            console.log(`Usuario autenticado (verificación): ${res.data.user.emailAddress}`);

        } else {
            console.error('❌ ERROR: El servidor de Google NO devolvió un Refresh Token.');
            console.error('Asegúrate de haber incluido "access_type: offline" y "prompt: consent" en la URL.');
            console.error('Respuesta de tokens:', tokens);
        }

    } catch (error) {
        console.error('\n\n❌ ERROR al intercambiar el código por tokens. El código puede ser inválido o haber expirado.');
        console.error(error.message);
    }
  });
}

getRefreshToken().catch(console.error);