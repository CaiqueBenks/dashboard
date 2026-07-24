import { db } from './firebase.js';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const cache = {};
const locallyModified = new Set();

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

// Carrega cache do localStorage
try {
  const raw = originalGetItem('__dashboard_cache__');
  if (raw) Object.assign(cache, JSON.parse(raw));
} catch (e) {}

function persistCache() {
  try {
    originalSetItem('__dashboard_cache__', JSON.stringify(cache));
  } catch (e) {}
}

// Intercepta localStorage.setItem → sincroniza com Firebase
localStorage.setItem = function(key, value) {
  if (key === '__dashboard_cache__') return;
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  cache[key] = v;
  locallyModified.add(key);
  persistCache();
  setDoc(doc(db, 'dashboard_data', key), { value: v })
    .catch(err => console.error('Erro Firestore (setItem):', err));
  originalSetItem(key, v);
};

localStorage.removeItem = function(key) {
  if (key === '__dashboard_cache__')
