const form = document.getElementById('band-request-form');

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const band = String(data.get('band') || '').trim();
    const members = String(data.get('members') || '').trim();
    const message = String(data.get('message') || '').trim();

    const body = [
      'Hello,',
      '',
      'I would like to request a NoteLink band.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Band or school: ${band}`,
      `Approximate member count: ${members || 'Not sure'}`,
      '',
      'Use case:',
      message || 'Not provided',
      '',
      'Thank you.'
    ].join('\n');

    const subject = encodeURIComponent(`NoteLink band request: ${band || name}`);
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:bcliu09@gmail.com?subject=${subject}&body=${encodedBody}`;
  });
}
