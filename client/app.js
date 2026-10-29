const API = 'http://localhost:4000/api/v1';

const el = (id) => document.getElementById(id);

const authView = el('auth-view');
const appView = el('app-view');
const account = el('account');
const accountName = el('account-name');
const authForm = el('auth-form');
const authMessage = el('auth-message');
const authSubmit = el('auth-submit');
const usernameField = el('username-field');
const notesList = el('notes-list');
const notesEmpty = el('notes-empty');
const editorPlaceholder = el('editor-placeholder');
const editorFields = el('editor-fields');
const editorForm = el('editor-form');
const noteTitle = el('note-title');
const noteContent = el('note-content');
const editorStatus = el('editor-status');
const deleteBtn = el('delete-btn');
const toast = el('toast');

const state = {
  user: null,
  notes: [],
  activeId: null,
  isNew: false,
  dirty: false,
  authMode: 'login',
};

let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the API. Is the server running on port 4000?');
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (res.status === 401 && !path.startsWith('/auth/')) {
    showAuth('Your session expired. Please sign in again.');
    throw new Error('Not signed in');
  }

  if (!res.ok) {
    const error = new Error(data?.error?.message || 'Something went wrong');
    error.status = res.status;
    throw error;
  }

  return data;
}

/* ---------- auth ---------- */

function setAuthMode(mode) {
  state.authMode = mode;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  usernameField.classList.toggle('hidden', mode !== 'register');
  authForm.password.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  authSubmit.textContent = mode === 'register' ? 'Create account' : 'Sign in';
  authMessage.classList.add('hidden');
}

function showAuth(message) {
  state.user = null;
  state.notes = [];
  state.activeId = null;
  state.isNew = false;
  state.dirty = false;
  clearEditor();
  renderList();
  renderEditor();
  appView.classList.add('hidden');
  authView.classList.remove('hidden');
  account.classList.add('hidden');
  if (message) {
    authMessage.textContent = message;
    authMessage.classList.remove('hidden');
  }
}

async function showApp(message) {
  authView.classList.add('hidden');
  appView.classList.remove('hidden');
  account.classList.remove('hidden');
  accountName.textContent = state.user.name || state.user.email;
  await loadNotes();
  if (message) showToast(message);
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => setAuthMode(tab.dataset.mode));
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(authForm);
  const payload = { password: form.get('password') };

  if (state.authMode === 'register') {
    payload.email = form.get('email');
    payload.username = form.get('username');
  } else {
    payload.email = form.get('email');
  }

  try {
    authSubmit.disabled = true;
    const data = await api(`/auth/${state.authMode}`, { method: 'POST', body: payload });
    state.user = data.user;
    authForm.reset();
    await showApp(state.authMode === 'register' ? 'Account created' : 'Welcome back');
  } catch (error) {
    authMessage.textContent = error.message;
    authMessage.classList.remove('hidden');
  } finally {
    authSubmit.disabled = false;
  }
});

el('logout-btn').addEventListener('click', async () => {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch {
    /* the cookies are gone either way */
  }
  setAuthMode('login');
  showAuth();
});

/* ---------- notes ---------- */

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

function renderList() {
  notesList.innerHTML = '';
  notesEmpty.classList.toggle('hidden', state.notes.length > 0);

  for (const note of state.notes) {
    const item = document.createElement('li');
    item.classList.toggle('active', note.id === state.activeId);

    const title = document.createElement('span');
    title.className = 'note-title';
    title.textContent = note.title || 'Untitled';

    const meta = document.createElement('span');
    meta.className = 'note-meta';
    meta.textContent = formatDate(note.updatedAt);

    item.append(title, meta);
    item.addEventListener('click', () => selectNote(note.id));
    notesList.appendChild(item);
  }
}

function renderEditor() {
  const hasNote = Boolean(state.activeId) || state.isNew;
  editorPlaceholder.classList.toggle('hidden', hasNote);
  editorFields.classList.toggle('hidden', !hasNote);
  deleteBtn.classList.toggle('hidden', state.isNew);
  if (!hasNote) {
    editorStatus.textContent = '';
    return;
  }
  editorStatus.textContent = state.isNew ? 'New note' : state.dirty ? 'Unsaved changes' : '';
}

function clearEditor() {
  noteTitle.value = '';
  noteContent.value = '';
  state.dirty = false;
}

async function loadNotes() {
  const data = await api('/notes');
  state.notes = data.notes || [];
  if (state.activeId && !state.notes.some((note) => note.id === state.activeId)) {
    state.activeId = null;
    state.isNew = false;
    clearEditor();
  }
  renderList();
  renderEditor();
}

function confirmDiscard() {
  if (!state.dirty) return true;
  return window.confirm('You have unsaved changes. Discard them?');
}

function newNote() {
  if (!confirmDiscard()) return;
  state.activeId = null;
  state.isNew = true;
  clearEditor();
  renderList();
  renderEditor();
  noteTitle.focus();
}

function selectNote(id) {
  if (id === state.activeId) return;
  if (!confirmDiscard()) return;
  const note = state.notes.find((item) => item.id === id);
  if (!note) return;
  state.activeId = id;
  state.isNew = false;
  clearEditor();
  noteTitle.value = note.title;
  noteContent.value = note.content;
  renderList();
  renderEditor();
}

editorForm.addEventListener('input', () => {
  state.dirty = true;
  renderEditor();
});

editorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = noteTitle.value.trim();
  if (!title) {
    showToast('A note needs a title');
    noteTitle.focus();
    return;
  }

  const payload = { title, content: noteContent.value };
  const saveBtn = el('save-btn');
  saveBtn.disabled = true;

  try {
    if (state.isNew) {
      const data = await api('/notes', { method: 'POST', body: payload });
      state.notes.unshift(data.note);
      state.activeId = data.note.id;
      state.isNew = false;
    } else {
      const data = await api(`/notes/${state.activeId}`, { method: 'PATCH', body: payload });
      const index = state.notes.findIndex((note) => note.id === state.activeId);
      if (index !== -1) state.notes.splice(index, 1);
      state.notes.unshift(data.note);
    }
    state.dirty = false;
    state.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    renderList();
    renderEditor();
    showToast('Saved');
  } catch (error) {
    showToast(error.message);
  } finally {
    saveBtn.disabled = false;
  }
});

deleteBtn.addEventListener('click', async () => {
  if (!state.activeId || state.isNew) return;
  if (!window.confirm('Delete this note?')) return;

  try {
    await api(`/notes/${state.activeId}`, { method: 'DELETE' });
    state.notes = state.notes.filter((note) => note.id !== state.activeId);
    state.activeId = null;
    state.isNew = false;
    clearEditor();
    renderList();
    renderEditor();
    showToast('Note deleted');
  } catch (error) {
    showToast(error.message);
  }
});

el('new-note-btn').addEventListener('click', newNote);

/* ---------- boot ---------- */

(async function boot() {
  try {
    const data = await api('/auth/me');
    state.user = data.user;
    await showApp();
  } catch (error) {
    showAuth(error.status ? '' : error.message);
  }
})();
