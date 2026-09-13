// Cloudflare Pages Function: /api/messages
// Conecta directamente con Cloudflare D1 a través del binding 'DB'

export async function onRequestPost({ request, env }) {
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
      return new Response(JSON.stringify({ error: 'La base de datos D1 no está vinculada. Verifica la configuración en Cloudflare.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Inserción 100% anónima: solo contenido y fecha generada por SQLite
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

export async function onRequestGet({ request, env }) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminPassword || !token || token !== adminPassword) {
      return new Response(JSON.stringify({ error: 'No autorizado. Se requiere contraseña de administrador válida.' }), {
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
    return new Response(JSON.stringify({ error: error.message || 'Error al obtener los mensajes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminPassword || !token || token !== adminPassword) {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de mensaje no proporcionado.' }), {
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
    return new Response(JSON.stringify({ error: error.message || 'Error al eliminar el mensaje' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
