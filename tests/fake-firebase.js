/* Test uchun SOXTA Firebase (xotirada + localStorage). Haqiqiy Firebase EMAS va Security Rules'ni tekshirmaydi.
   Faqat sayt mantiqini (UI, oqimlar, til, filtr, admin paneli) sinash uchun. */
(function () {
  const KEY = "fk_db", AKEY = "fk_auth", ADMIN = ["esalimniyazov@gmail.com"];
  const ts = (ms) => ({ __ts: ms, toMillis() { return this.__ts; }, toDate() { return new Date(this.__ts); }, get seconds() { return Math.floor(this.__ts / 1000); } });
  const revive = (o) => { if (o && typeof o === "object") { if ("__ts" in o && Object.keys(o).length === 1) return ts(o.__ts); for (const k in o) o[k] = revive(o[k]); } return o; };
  const ser = (o) => JSON.stringify(o, (k, v) => (v && v.__ts !== undefined && typeof v.toMillis === "function") ? { __ts: v.__ts } : v);
  let DB = {}; try { DB = revive(JSON.parse(localStorage.getItem(KEY) || "null")) || (window.__SEED ? revive(JSON.parse(JSON.stringify(window.__SEED))) : {}); } catch (e) { DB = {}; }
  const save = () => { try { localStorage.setItem(KEY, ser(DB)); } catch (e) {} };
  let uidn = Object.keys(DB).reduce((a, c) => a + Object.keys(DB[c]).length, 0) + 100;
  const nid = () => "id" + (++uidn);
  const clone = (o) => revive(JSON.parse(ser(o)));
  const SV = { t: "serverTimestamp" }, DEL = { t: "delete" };
  const FieldValue = { serverTimestamp: () => ({ t: "serverTimestamp" }), increment: (n) => ({ t: "inc", n }), delete: () => ({ t: "delete" }) };
  const setDeep = (obj, path, val) => { const a = path.split("."); let x = obj; a.slice(0, -1).forEach(k => { x = x[k] = x[k] || {}; }); x[a[a.length - 1]] = val; };
  function apply(cur, data, merge) {
    const out = merge ? clone(cur || {}) : {};
    for (const k in data) {
      const v = data[k];
      if (v && v.t === "serverTimestamp") out[k] = ts(Date.now());
      else if (v && v.t === "inc") out[k] = ((cur && cur[k]) || 0) + v.n;
      else if (v && v.t === "delete") delete out[k];
      else if (k.indexOf(".") > 0) setDeep(out, k, v);
      else out[k] = v;
    }
    return out;
  }
  const me = () => { try { return JSON.parse(localStorage.getItem(AKEY) || "null"); } catch (e) { return null; } };
  const isAdmin = () => { const u = me(); return !!(u && u.verified && ADMIN.indexOf(u.email) >= 0); };
  const denied = () => { const e = new Error("denied"); e.code = "permission-denied"; return e; };
  const readOK = (col, filters) => {
    if (["contacts", "activity", "stats"].indexOf(col) >= 0) return isAdmin();
    if (col === "feedback") return isAdmin() || (me() && filters.some(f => f[0] === "uid" && f[2] === me().uid));
    if (col === "users") return isAdmin() || !!me();
    return true;
  };
  const snap = (col, id, data) => ({ id, exists: data !== undefined, data: () => (data === undefined ? undefined : clone(data)), ref: docRef(col, id) });
  function docRef(col, id) {
    return {
      id,
      get: async () => { if (col === "stats" && !isAdmin()) throw denied(); return snap(col, id, DB[col] && DB[col][id]); },
      set: async (d, o) => { (DB[col] = DB[col] || {})[id] = apply(DB[col][id], d, o && o.merge); save(); },
      update: async (d) => { if (!DB[col] || !DB[col][id]) { const e = new Error("not found"); e.code = "not-found"; throw e; } DB[col][id] = apply(DB[col][id], d, true); save(); },
      delete: async () => { if (DB[col]) delete DB[col][id]; save(); },
    };
  }
  function query(col, filters, order, lim, cursor) {
    const q = {
      where: (f, op, v) => query(col, filters.concat([[f, op, v]]), order, lim, cursor),
      orderBy: (f, dir) => query(col, filters, [f, dir || "asc"], lim, cursor),
      limit: (n) => query(col, filters, order, n, cursor),
      startAfter: (doc) => query(col, filters, order, lim, doc),
      get: async () => {
        if (!readOK(col, filters)) throw denied();
        let rows = Object.keys(DB[col] || {}).map(id => ({ id, d: DB[col][id] }));
        filters.forEach(([f, op, v]) => { rows = rows.filter(r => r.d[f] === v); });
        if (order) {
          if (order[0] !== "__name__") rows = rows.filter(r => r.d[order[0]] !== undefined);
          rows.sort((a, b) => {
            const x = order[0] === "__name__" ? a.id : a.d[order[0]], y = order[0] === "__name__" ? b.id : b.d[order[0]];
            const xv = x && x.toMillis ? x.toMillis() : x, yv = y && y.toMillis ? y.toMillis() : y;
            return (xv > yv ? 1 : xv < yv ? -1 : 0) * (order[1] === "desc" ? -1 : 1);
          });
        }
        if (cursor) {
          const direction = order && order[1] === "desc" ? -1 : 1;
          rows = rows.filter(r => (r.id > cursor.id ? 1 : r.id < cursor.id ? -1 : 0) * direction > 0);
        }
        if (lim) rows = rows.slice(0, lim);
        const docs = rows.map(r => snap(col, r.id, r.d));
        return { docs, size: docs.length, empty: !docs.length, forEach: (f) => docs.forEach(f) };
      },
    };
    return q;
  }
  const firestore = () => ({
    collection: (col) => Object.assign(query(col, [], null, 0), {
      doc: (id) => docRef(col, id || nid()),
      add: async (d) => { const id = nid(); (DB[col] = DB[col] || {})[id] = apply(null, d, false); save(); return { id }; },
    }),
    batch: () => { const ops = []; return { set: (r, d) => ops.push(() => r.set(d)), update: (r, d) => ops.push(() => r.update(d)), delete: (r) => ops.push(() => r.delete()), commit: async () => { for (const o of ops) await o(); } }; },
  });
  firestore.FieldValue = FieldValue;
  firestore.FieldPath = { documentId: () => "__name__" };
  /* ---- auth ---- */
  let cbs = [];
  const mkUser = (m) => m && ({
    uid: m.uid, email: m.email, displayName: m.displayName || null, emailVerified: !!m.verified,
    updateProfile: async (p) => { const x = me(); Object.assign(x, p); localStorage.setItem(AKEY, JSON.stringify(x)); },
    sendEmailVerification: async () => { window.__verifySent = (window.__verifySent || 0) + 1; },
    reload: async () => {}, getIdToken: async () => "t", getIdTokenResult: async () => ({ claims: { auth_time: Math.floor(Date.now() / 1000) } }),
    delete: async () => { const x = me(); const all = JSON.parse(localStorage.getItem("fk_accounts") || "{}"); delete all[x.email]; localStorage.setItem("fk_accounts", JSON.stringify(all)); localStorage.removeItem(AKEY); fire(); },
  });
  const fire = () => { const u = mkUser(me()); cbs.forEach(cb => setTimeout(() => cb(u), 0)); };
  const accounts = () => JSON.parse(localStorage.getItem("fk_accounts") || "{}");
  const err = (code) => { const e = new Error(code); e.code = code; return e; };
  const auth = () => ({
    get currentUser() { return mkUser(me()); },
    onAuthStateChanged: (cb) => { cbs.push(cb); setTimeout(() => cb(mkUser(me())), 0); return () => {}; },
    signInWithEmailAndPassword: async (e, p) => { const a = accounts()[e]; if (!a || a.pass !== p) throw err("auth/invalid-credential"); localStorage.setItem(AKEY, JSON.stringify(a.user)); fire(); return { user: mkUser(a.user) }; },
    createUserWithEmailAndPassword: async (e, p) => { const all = accounts(); if (all[e]) throw err("auth/email-already-in-use"); const user = { uid: "u_" + e.split("@")[0], email: e, verified: !!(window.__AUTOVERIFY && window.__AUTOVERIFY.indexOf(e) >= 0) }; all[e] = { pass: p, user }; localStorage.setItem("fk_accounts", JSON.stringify(all)); localStorage.setItem(AKEY, JSON.stringify(user)); fire(); return { user: mkUser(user) }; },
    signOut: async () => { localStorage.removeItem(AKEY); fire(); },
    sendPasswordResetEmail: async (e) => { window.__resetTo = e; },
  });
  window.firebase = { initializeApp() {}, auth, firestore };
  window.__fkDump = () => JSON.parse(ser(DB));
})();
