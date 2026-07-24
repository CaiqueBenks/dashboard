import { db } from './firebase.js';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const cache = {};

try {
  const raw = localStorage.getItem('__dashboard_cache__');
  if (raw) Object.assign(cache, JSON.parse(raw));
} catch (e) {
  console.warn('Cache local não pôde ser carregado:', e);
}

function persistCache() {
  try {
    localStorage.setItem('__dashboard_cache__', JSON.stringify(cache));
  } catch (e) {
    console.warn('Cache local não pôde ser salvo:', e);
  }
}

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

localStorage.setItem = function(key, value) {
  cache[key] = typeof value === 'string' ? value : JSON.stringify(value);
  persistCache();
  setDoc(doc(db, 'dashboard_data', key), { value: cache[key] })
    .catch(err => console.error('Erro Firestore (setItem):', err));
  originalSetItem(key, value);
};

localStorage.removeItem = function(key) {
  delete cache[key];
  persistCache();
  deleteDoc(doc(db, 'dashboard_data', key))
    .catch(err => console.error('Erro Firestore (removeItem):', err));
  originalRemoveItem(key);
};

window.storage = {
  set(key, value) {
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    cache[key] = v;
    persistCache();
    setDoc(doc(db, 'dashboard_data', key), { value: v })
      .catch(err => console.error('Erro Firestore (set):', err));
  },

  get(key) {
    if (key in cache) return cache[key];
    const raw = localStorage.getItem(key);
    if (raw !== null) { cache[key] = raw; return raw; }
    return null;
  },

  delete(key) {
    delete cache[key];
    persistCache();
    deleteDoc(doc(db, 'dashboard_data', key))
      .catch(err => console.error('Erro Firestore (delete):', err));
  },

  remove(key) { this.delete(key); },

  setItem(key, value) { this.set(key, value); },
  getItem(key) { return this.get(key); },
  removeItem(key) { this.delete(key); },
};

// ── Sincroniza dados da nuvem ANTES do React renderizar ────
let syncResolve;
export const syncPromise = new Promise(resolve => { syncResolve = resolve; });

async function syncFromCloud() {
  try {
    const snapshot = await getDocs(collection(db, 'dashboard_data'));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.value !== undefined) {
        cache[docSnap.id] = data.value;
        try { originalSetItem(docSnap.id, data.value); } catch(e) {}
      }
    });
    persistCache();
    console.log('✅ Sincronização com a nuvem concluída!');
  } catch (err) {
    console.error('Erro ao sincronizar da nuvem:', err);
  } finally {
    syncResolve();
  }
}

syncFromCloud();
