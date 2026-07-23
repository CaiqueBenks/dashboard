import { db } from './firebase.js';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

// ── Cache local síncrono (espelha o localStorage) ─────────
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

// ── Cria window.storage (compatível com o código original) ─
window.storage = {
  get(key) {
    return cache[key] ?? null;
  },

  set(key, value) {
    cache[key] = value;
    persistCache();
    setDoc(doc(db, 'dashboard_data', key), { value })
      .catch(err => console.error('Erro Firestore (set):', err));
  },

  delete(key) {
    delete cache[key];
    persistCache();
    deleteDoc(doc(db, 'dashboard_data', key))
      .catch(err => console.error('Erro Firestore (delete):', err));
  },

  remove(key) {
    this.delete(key);
  }
};

// ── Sincroniza dados da nuvem ao carregar a página ─────────
async function syncFromCloud() {
  try {
    const snapshot = await getDocs(collection(db, 'dashboard_data'));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.value !== undefined) {
        cache[docSnap.id] = data.value;
      }
    });
    persistCache();
    console.log('✅ Sincronização com a nuvem concluída!');
  } catch (err) {
    console.error('Erro ao sincronizar da nuvem:', err);
  }
}

syncFromCloud();
