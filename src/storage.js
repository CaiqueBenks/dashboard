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

localStorage.setItem = function(key, value) {
  if (key === '__dashboard_cache__') return;
  var v = typeof value === 'string' ? value : JSON.stringify(value);
  cache[key] = v;
  locallyModified.add(key);
  persistCache();
  setDoc(doc(db, 'dashboard_data', key), { value: v }).catch(function(err) {
    console.error('Erro Firestore (setItem):', err);
  });
  originalSetItem(key, v);
};

localStorage.removeItem = function(key) {
  if (key === '__dashboard_cache__') return;
  delete cache[key];
  persistCache();
  deleteDoc(doc(db, 'dashboard_data', key)).catch(function(err) {
    console.error('Erro Firestore (removeItem):', err);
  });
  originalRemoveItem(key);
};

window.storage = {
  set: function(key, value) {
    var v = typeof value ===
