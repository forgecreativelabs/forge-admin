const firebaseConfig = {
    apiKey: "AIzaSyBzIhO7VIz13_g_PoAz4mSioPdZrOeeKCQ",
    authDomain: "forge-3ab31.firebaseapp.com",
    databaseURL: "https://forge-3ab31-default-rtdb.firebaseio.com",
    projectId: "forge-3ab31",
    storageBucket: "forge-3ab31.firebasestorage.app",
    messagingSenderId: "146704952008",
    appId: "1:146704952008:web:8db8d8f1819b6785ad93fd",
    measurementId: "G-MTJQE35BE2"
  };
  
  // Initialize Firebase using the compat CDN loaded in the HTML
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  // Proxy localStorage methods to intercept state changes
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  
  localStorage.setItem = function(key, value) {
      // 1. Immediately apply locally to guarantee zero-latency UI updates
      originalSetItem(key, value);
      
      // 2. Broadcast securely via Firebase Realtime Database
      if (key.startsWith('forge_')) {
          db.ref('sync/' + key).set(value);
      }
  };
  
  localStorage.removeItem = function(key) {
      originalRemoveItem(key);
      if (key.startsWith('forge_')) {
          db.ref('sync/' + key).remove();
      }
  };
  
  // Create a handler to receive global incoming network states and spoof a local 'StorageEvent'
  function handleRemoteState(snapshot) {
      const key = snapshot.key;
      const value = snapshot.val();
      const oldValue = localStorage.getItem(key);
      
      // Only process if the remote value differs from local (prevents infinite loop echo)
      if (oldValue !== value) {
          originalSetItem(key, value);
          
          const event = new StorageEvent('storage', {
              key: key,
              newValue: value,
              oldValue: oldValue,
              storageArea: localStorage,
              url: window.location.href
          });
          window.dispatchEvent(event);
      }
  }
  
  function handleRemoteRemove(snapshot) {
      const key = snapshot.key;
      const oldValue = localStorage.getItem(key);
      if (oldValue !== null) {
          originalRemoveItem(key);
          const event = new StorageEvent('storage', {
              key: key,
              newValue: null,
              oldValue: oldValue,
              storageArea: localStorage,
              url: window.location.href
          });
          window.dispatchEvent(event);
      }
  }
  
  // Bind Firebase Listeners
  db.ref('sync').on('child_added', handleRemoteState);
  db.ref('sync').on('child_changed', handleRemoteState);
  db.ref('sync').on('child_removed', handleRemoteRemove);
