document.addEventListener('DOMContentLoaded', () => {
  const messageInput = document.getElementById('messageInput');
  const messageForm = document.getElementById('messageForm');
  const sendBtn = document.getElementById('sendBtn');
  const charCounter = document.getElementById('charCounter');
  const confirmModal = document.getElementById('confirmModal');
  const modalPreview = document.getElementById('modalPreview');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const confirmSendBtn = document.getElementById('confirmSendBtn');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  let pendingMessage = '';

  // Auto-ajustar altura del textarea según el contenido
  function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 160)}px`;
  }

  // Validación en tiempo real y contador de caracteres
  messageInput.addEventListener('input', () => {
    adjustTextareaHeight();
    const text = messageInput.value.trim();
    charCounter.textContent = `${messageInput.value.length} / 2000`;
    sendBtn.disabled = text.length === 0;
  });

  // Permitir enviar con la tecla Enter (Shift + Enter para salto de línea)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        openConfirmationModal();
      }
    }
  });

  // Manejar submit del formulario
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!sendBtn.disabled) {
      openConfirmationModal();
    }
  });

  // Abrir ventana modal de confirmación
  function openConfirmationModal() {
    const text = messageInput.value.trim();
    if (!text) return;

    pendingMessage = text;
    modalPreview.textContent = pendingMessage;
    confirmModal.classList.add('active');
    confirmModal.setAttribute('aria-hidden', 'false');
    confirmSendBtn.focus();
  }

  // Cerrar ventana modal
  function closeModal() {
    confirmModal.classList.remove('active');
    confirmModal.setAttribute('aria-hidden', 'true');
    pendingMessage = '';
    messageInput.focus();
  }

  cancelModalBtn.addEventListener('click', closeModal);

  // Cerrar modal al hacer clic en el fondo oscuro
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      closeModal();
    }
  });

  // Cerrar modal con tecla Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmModal.classList.contains('active')) {
      closeModal();
    }
  });

  // Confirmar y Enviar a la base de datos
  confirmSendBtn.addEventListener('click', async () => {
    if (!pendingMessage) return;

    confirmSendBtn.disabled = true;
    confirmSendBtn.textContent = 'Enviando...';

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: pendingMessage })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al enviar el mensaje');
      }

      // Éxito: limpiar caja de texto y restablecer estado
      messageInput.value = '';
      adjustTextareaHeight();
      charCounter.textContent = '0 / 2000';
      sendBtn.disabled = true;
      closeModal();

      showToast('Mensaje enviado de forma anónima');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'No se pudo enviar el mensaje', true);
    } finally {
      confirmSendBtn.disabled = false;
      confirmSendBtn.textContent = 'Confirmar y Enviar';
    }
  });

  // Mostrar mensaje toast
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
    }, 3500);
  }
});
