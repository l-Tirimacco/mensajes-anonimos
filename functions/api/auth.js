// Cloudflare Pages Function: /api/auth
// Valida la contraseña del administrador contra la variable de entorno ADMIN_PASSWORD

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json().catch(() => ({}));
    const password = (data.password || '').trim();
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return new Response(JSON.stringify({ 
        error: 'ADMIN_PASSWORD no ha sido configurada en las variables de entorno de Cloudflare Pages.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!password || password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Contraseña incorrecta.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      token: adminPassword 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error en la autenticación' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
