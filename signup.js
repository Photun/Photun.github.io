const form = document.getElementById('band-request-form');
const statusEl = document.getElementById('request-status');

const endpoint = 'https://us-central1-band2-d72ec.cloudfunctions.net/submitBandRequest';

function setStatus(message, kind = 'neutral') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      band: String(data.get('band') || '').trim(),
      members: String(data.get('members') || '').trim(),
      message: String(data.get('message') || '').trim(),
    };

    setStatus('Sending request...', 'neutral');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'Unable to submit request.');
      }

      form.reset();
      setStatus('Request sent. We will follow up by email soon.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit request.';
      setStatus(`${message} You can still email support at cpark0814@gmail.com.`, 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
