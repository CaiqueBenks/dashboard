import { db } from './firebase.js';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const cache = {};

// Captura os métodos ORIGINAIS antes de interceptar
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

// Carrega cache local
try {
  const raw = originalGetItem('__dashboard_cache__');
  if (raw) Object.assign(cache, JSON.parse(raw));
} catch (e) {}

// SALVA cache usando o método ORIGINAL (sem disparar a interceptação)
function persistCache() {
  try {
    originalSetItem('__dashboard_cache__', JSON.stringify(cache));
  } catch (e) {}
}

// Intercepta localStorage.setItem → salva no Firebase
localStorage.setItem = function(key, value) {
  if (key === '__dashboard_cache__') return; // evita loop
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  cache[key] = v;
  persistCache();
  setDoc(doc(db, 'dashboard_data', key), { value: v })
    .catch(err => console.error('Erro Firestore (setItem):', err));
  originalSetItem(key, value);
};

localStorage.removeItem = function(key) {
  if (key === '__dashboard_cache__') return;
  delete cache[key];
  persistCache();
  deleteDoc(doc(db, 'dashboard_data', key))
    .catch(err => console.error('Erro Firestore (removeItem):', err));
  originalRemoveItem(key);
};

// Cria window.storage com todos os nomes de método
window.storage = {
  set(key, value) {
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    cache[key] = v;
    persistCache();
    originalSetItem(key, v);
    setDoc(doc(db, 'dashboard_data', key), { value: v })
      .catch(err => console.error('Erro Firestore (set):', err));
  },

  get(key) {
    if (key in cache) return cache[key];
    const raw = originalGetItem(key);
    if (raw !== null) { cache[key] = raw; return raw; }
    return null;
  },

  delete(key) {
    delete cache[key];
    persistCache();
    originalRemoveItem(key);
    deleteDoc(doc(db, 'dashboard_data', key))
      .catch(err => console.error('Erro Firestore (delete):', err));
  },

  remove(key) { this.delete(key); },
  setItem(key, value) { this.set(key, value); },
  getItem(key) { return this.get(key); },
  removeItem(key) { this.delete(key); },
};

console.log('✅ Storage adaptado: localStorage → Firebase');

// Sincroniza dados da nuvem ao carregar
async function syncFromCloud() {
  try {
    const snapshot = await getDocs(collection(db, 'dashboard_data'));
    let dataChanged = false;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.value !== undefined) {
        const existing = originalGetItem(docSnap.id);
        if (existing !== data.value) dataChanged = true;
        cache[docSnap.id] = data.value;
        originalSetItem(docSnap.id, data.value);
      }
    });

    persistCache();
    console.log('✅ Sincronização com a nuvem concluída!');

    if (dataChanged && !sessionStorage.getItem('__synced__')) {
      sessionStorage.setItem('__synced__', 'true');
      window.location.reload();
    }
  } catch (err) {
    console.error('Erro ao sincronizar da nuvem:', err);
  }
}

syncFromCloud();
