import { db } from './firebase.js'
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'

const cache = {}
const modified = new Set()
const oSet = localStorage.setItem.bind(localStorage)
const oGet = localStorage.getItem.bind(localStorage)
const oDel = localStorage.removeItem.bind(localStorage)

try { const r = oGet('__dc__'); if (r) Object.assign(cache, JSON.parse(r)) } catch (e) {}

function save() { try { oSet('__dc__', JSON.stringify(cache)) } catch (e) {} }

localStorage.setItem = function(k, v) {
  if (k === '__dc__') return
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  cache[k] = s; modified.add(k); save()
  setDoc(doc(db, 'dashboard_data', k), { value: s }).catch(e => console.error(e))
  oSet(k, s)
}

localStorage.removeItem = function(k) {
  if (k === '__dc__') return
  delete cache[k]; save()
  deleteDoc(doc(db, 'dashboard_data', k)).catch(e => console.error(e))
  oDel(k)
}

window.storage = {
  set(k, v) {
    const s = typeof v === 'string' ? v : JSON.stringify(v)
    cache[k] = s; modified.add(k); save(); oSet(k, s)
    setDoc(doc(db, 'dashboard_data', k), { value: s }).catch(e => console.error(e))
  },
  get(k) {
    let r = k in cache ? cache[k] : oGet(k)
    if (r === null || r === undefined) return null
    return r
  },
  delete(k) {
    delete cache[k]; save(); oDel(k)
    deleteDoc(doc(db, 'dashboard_data', k)).catch(e => console.error(e))
  },
  remove(k) { this.delete(k) },
  setItem(k, v) { this.set(k, v) },
  getItem(k) { return this.get(k) },
  removeItem(k) { this.delete(k) }
}

console.log('Storage adaptado: localStorage + Firebase')

async function sync() {
  try {
    const s = await getDocs(collection(db, 'dashboard_data'))
    let changed = false
    s.forEach(d => {
      const v = d.data().value
      if (v === undefined || modified.has(d.id)) return
      if (cache[d.id] !== v) changed = true
      cache[d.id] = v; oSet(d.id, v)
    })
    save()
    if (changed && !sessionStorage.getItem('__s__')) {
      sessionStorage.setItem('__s__', '1')
      location.reload()
    }
  } catch (e) { console.error(e) }
}

sync()
