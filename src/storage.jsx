import { db } from './firebase.js';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const cache = {};
const locallyModified = new Set();

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

try {
  const raw = originalGetItem('__dashboard_cache__');
  if (raw) Object.assign(cache, JSON.parse(raw));
} catch (e) {}

function persistCache() {
  try {
    originalSetItem('__dashboard_cache__', JSON.stringify(cache));
  } catch (e) {}
}

localStorage.setItem = function (key, value) {
  if (key === '__dashboard_cache__') return;
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  cache[key] = v;
  locallyModified.add(key);
  persistCache();
  setDoc(doc(db, 'dashboard_data', key), { value: v }).catch(function (err) {
    console.error('Erro Firestore (setItem):', err);
  });
  originalSetItem(key, v);
};

localStorage.removeItem = function (key) {
  if (key === '__dashboard_cache__') return;
  delete cache[key];
  persistCache();
  deleteDoc(doc(db, 'dashboard_data', key)).catch(function (err) {
    console.error('Erro Firestore (removeItem):', err);
  });
  originalRemoveItem(key);
};

window.storage = {
  set: function (key, value) {
    const v = typeof value === 'string' ? value : JSON.stringify(value);
    cache[key] = v;
    locallyModified.add(key);
    persistCache();
    originalSetItem(key, v);
    setDoc(doc(db, 'dashboard_data', key), { value: v }).catch(function (err) {
      console.error('Erro Firestore (set):', err);
    });
  },

  get: function (key) {
    let raw;
    if (key in cache) {
      raw = cache[key];
    } else {
      raw = originalGetItem(key);
      if (raw !== null) cache[key] = raw;
    }
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  },

  delete: function (key) {
    delete cache[key];
    persistCache();
    originalRemoveItem(key);
    deleteDoc(doc(db, 'dashboard_data', key)).catch(function (err) {
      console.error('Erro Firestore (delete):', err);
    });
  },

  remove: function (key) {
    this.delete(key);
  },
  
