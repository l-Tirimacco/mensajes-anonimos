document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('loginView');
  const adminView = document.getElementById('adminView');
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');
  const messagesCount = document.getElementById('messagesCount');
  const refreshBtn = document.getElementById('refreshBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const messagesList = document.getElementById('messagesList');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  let adminToken = sessionStorage.getItem('admin_token') || '';

  // Escapar HTML para evitar problemas de seguridad al renderizar contenido
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Formatear fecha legible
  function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    try {
      const date = new Date(dateString.includes('Z') ? dateString : dateString + 'Z');
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // Comprobar si ya hay una sesión guardada
  if (adminToken) {
    showAdminDashboard();
    fetchMessages();
  }

  // Manejar Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('show');
    const password = passwordInput.value.trim();
    if (!password) return;

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        throw new Error('Contraseña incorrecta');
      }

      const data = await response.json();
      adminToken = data.token || password;
      sessionStorage.setItem('admin_token', adminToken);
      passwordInput.value = '';
      showAdminDashboard();
      fetchMessages();
    } catch (err) {
      loginError.textContent = err.message || 'Contraseña incorrecta';
      loginError.classList.add('show');
    }
  });

  // Mostrar el Dashboard
  function showAdminDashboard() {
    loginView.style.display = 'none';
    adminView.style.display = 'flex';
  }

  // Mostrar el Login
  function showLogin() {
    sessionStorage.removeItem('admin_token');
    adminToken = '';
    adminView.style.display = 'none';
    loginView.style.display = 'block';
    messagesList.innerHTML = '';
  }

  // Cerrar Sesión
  logoutBtn.addEventListener('click', showLogin);

  // Recargar Mensajes
  refreshBtn.addEventListener('click', () => {
    fetchMessages();
    showToast('Lista actualizada');
  });

  // Obtener mensajes de Cloudflare D1
  async function fetchMessages() {
    messagesList.innerHTML = '<div class="empty-state">Cargando mensajes...</div>';

    try {
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.status === 401) {
        showLogin();
        loginError.textContent = 'Tu sesión expiró o la contraseña cambió.';
        loginError.classList.add('show');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al obtener mensajes');
      }

      const messages = await response.json();
      renderMessages(messages);
    } catch (err) {
      messagesList.innerHTML = `<div class="empty-state">Error: ${escapeHTML(err.message)}</div>`;
    }
  }

  // Renderizar la lista de mensajes
  function renderMessages(messages) {
    messagesCount.textContent = `${messages.length} ${messages.length === 1 ? 'mensaje' : 'mensajes'}`;

    if (!messages || messages.length === 0) {
      messagesList.innerHTML = '<div class="empty-state">No hay mensajes recibidos todavía.</div>';
      return;
    }

    messagesList.innerHTML = messages.map(msg => `
      <article class="message-card" id="msg-${msg.id}">
        <header class="message-card-header">
          <span class="message-date">${formatDate(msg.created_at)}</span>
          <button class="delete-btn" data-id="${msg.id}" title="Eliminar mensaje">Eliminar</button>
        </header>
        <div class="message-content">${escapeHTML(msg.content)}</div>
      </article>
    `).join('');

    // Asignar listeners a los botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        deleteMessage(id);
      });
    });
  }

  // Eliminar mensaje individual
  async function deleteMessage(id) {
    if (!confirm('¿Deseas eliminar este mensaje permanentemente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el mensaje');
      }

      // Eliminar de la interfaz
      const card = document.getElementById(`msg-${id}`);
      if (card) {
        card.remove();
      }

      // Actualizar contador
      const remaining = document.querySelectorAll('.message-card').length;
      messagesCount.textContent = `${remaining} ${remaining === 1 ? 'mensaje' : 'mensajes'}`;
      if (remaining === 0) {
        messagesList.innerHTML = '<div class="empty-state">No hay mensajes recibidos todavía.</div>';
      }

      showToast('Mensaje eliminado');
    } catch (err) {
      showToast(err.message || 'Error al eliminar', true);
    }
  }

  // Notificación Toast
  function showToast(text, isError = false) {
    toastMessage.textContent = text;
    if (isError) {
      toast.style.borderColor = 'var(--text-secondary)';
    } else {
      toast.style.borderColor = 'var(--border-focus)';
    }
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
