/* theme-init.js (v0.2.0) – beží v <head> ešte pred vykreslením, aby nebliklo zlé pozadie.
   Použije uloženú voľbu vzhľadu (svetlý/tmavý); inak platí nastavenie systému. */
(function () {
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {
    /* úložisko môže byť zablokované – vzhľad sa potom riadi systémom */
  }
})();
