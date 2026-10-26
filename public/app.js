const MAX_SIZE = 10 * 1024 * 1024;
const accepted = ['pdf', 'jpg', 'jpeg', 'png', 'txt'];
const input = document.querySelector('#fileInput');
const dropzone = document.querySelector('#dropzone');
const details = document.querySelector('#fileDetails');
const send = document.querySelector('#sendButton');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
let currentFile;

const formatSize = (bytes) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
function setStatus(message = '', kind = '') { status.textContent = message; status.className = `status ${kind}`; }
function validate(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!accepted.includes(ext)) return 'Escolha um arquivo PDF, JPG, PNG ou TXT.';
  if (!file.size) return 'Este arquivo está vazio.';
  if (file.size > MAX_SIZE) return 'O arquivo deve ter no máximo 10 MB.';
  return null;
}
function selectFile(file) {
  const error = validate(file);
  if (error) { setStatus(error, 'error'); return; }
  currentFile = file;
  document.querySelector('#fileName').textContent = file.name;
  document.querySelector('#fileMeta').textContent = `${file.name.split('.').pop().toUpperCase()} · ${formatSize(file.size)}`;
  details.hidden = false; send.hidden = false; dropzone.classList.add('has-file'); setStatus();
}
function clearFile() { currentFile = undefined; input.value = ''; details.hidden = true; send.hidden = true; dropzone.classList.remove('has-file'); setStatus(); }
document.querySelector('#browseButton').addEventListener('click', () => input.click());
dropzone.addEventListener('click', (event) => { if (event.target.id !== 'browseButton') input.click(); });
dropzone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') input.click(); });
input.addEventListener('change', () => input.files[0] && selectFile(input.files[0]));
['dragenter', 'dragover'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.remove('dragging'); }));
dropzone.addEventListener('drop', e => e.dataTransfer.files[0] && selectFile(e.dataTransfer.files[0]));
document.querySelector('#removeButton').addEventListener('click', clearFile);
send.addEventListener('click', async () => {
  if (!currentFile) return;
  send.disabled = true; progress.hidden = false; setStatus();
  const form = new FormData(); form.append('file', currentFile);
  try {
    const response = await fetch('/api/print', { method: 'POST', body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'O envio falhou.');
    setStatus(result.message, 'success'); clearFile(); setStatus(result.message, 'success');
  } catch (error) { setStatus(error.message || 'Não foi possível enviar o arquivo.', 'error'); }
  finally { send.disabled = false; progress.hidden = true; }
});
