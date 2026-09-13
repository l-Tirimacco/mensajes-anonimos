// Cloudflare Worker con soporte de Assets estáticos y base de datos D1

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // =========================================================================
    // API: /api/messages
    // =========================================================================
    if (url.pathname === '/api/messages') {
      // POST: Envío anónimo
      if (request.method === 'POST') {
        try {
          const data = await request.json().catch(() => ({}));
          const content = (data.content || '').trim();

          if (!content) {
            return new Response(JSON.stringify({ error: 'El mensaje no puede estar vacío.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (content.length > 2000) {
            return new Response(JSON.stringify({ error: 'El mensaje excede el límite de 2000 caracteres.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (!env.DB) {
            return new Response(JSON.stringify({ 
              error: "Falta vincular la base D1 en Cloudflare (Settings > Bindings > D1 con el nombre 'DB')." 
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Inserción anónima
          await env.DB.prepare(
            'INSERT INTO messages (content) VALUES (?)'
          ).bind(content).run();

          return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // GET: Lista de mensajes para el administrador
      if (request.method === 'GET') {
        try {
          const authHeader = request.headers.get('Authorization') || '';
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();
          const adminPassword = env.ADMIN_PASSWORD || env.PASSWORD_KEY;

          if (!adminPassword || !token || token !== adminPassword) {
            return new Response(JSON.stringify({ error: 'No autorizado. Se requiere contraseña de administrador.' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (!env.DB) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const { results } = await env.DB.prepare(
            'SELECT id, content, created_at FROM messages ORDER BY id DESC'
          ).all();

          return new Response(JSON.stringify(results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message || 'Error al obtener mensajes' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // DELETE: Borrar mensaje
      if (request.method === 'DELETE') {
        try {
          const authHeader = request.headers.get('Authorization') || '';
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();
          const adminPassword = env.ADMIN_PASSWORD || env.PASSWORD_KEY;

          if (!adminPassword || !token || token !== adminPassword) {
            return new Response(JSON.stringify({ error: 'No autorizado.' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const id = url.searchParams.get('id');
          if (!id) {
            return new Response(JSON.stringify({ error: 'ID no proporcionado.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Base de datos no vinculada.' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message || 'Error al eliminar' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response('Method Not Allowed', { status: 405 });
    }

    // =========================================================================
    // API: /api/auth
    // =========================================================================
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const data = await request.json().catch(() => ({}));
        const password = (data.password || '').trim();
        const adminPassword = env.ADMIN_PASSWORD || env.PASSWORD_KEY;

        if (!adminPassword) {
          return new Response(JSON.stringify({ 
            error: 'Contraseña no configurada en las variables de entorno de Cloudflare (ADMIN_PASSWORD o PASSWORD_KEY).' 
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

        return new Response(JSON.stringify({ success: true, token: adminPassword }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Error de autenticación' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // =========================================================================
    // Servir Archivos Estáticos (index.html, admin.html, CSS, JS, etc.)
    // =========================================================================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
