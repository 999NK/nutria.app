// Aggressive cache clearing script
(function() {
  // Clear all possible caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
      });
    });
  }
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Force reload with cache bypass
  window.location.reload(true);
})();