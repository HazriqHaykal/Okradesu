/* Loads the compiled _ds_bundle.js; until it exists, compiles components/ from source so previews work. Requires React + Babel loaded first. */
(function () {
  var base = (document.currentScript.getAttribute('src') || '').replace(/ds-loader\.js.*$/, '');
  function get(url) { var x = new XMLHttpRequest(); x.open('GET', base + url, false); x.send(); return x.status >= 200 && x.status < 300 ? x.responseText : null; }
  function find() { var ks = Object.keys(window); for (var i = 0; i < ks.length; i++) { try { var v = window[ks[i]]; if (v && typeof v === 'object' && v.FoodCard && v.Button && v !== window.__DSFallback) return v; } catch (e) {} } return null; }
  var bundle = get('_ds_bundle.js');
  if (bundle) { (0, eval)(bundle); }
  if (!find()) {
    var files = ['icons/Icon', 'actions/Button', 'actions/IconButton', 'forms/SearchField', 'content/SectionHeader', 'content/CategoryTile', 'content/FoodCard', 'content/InfoStat', 'content/Badge', 'content/AvatarStack', 'navigation/BottomNav'];
    var NS = {};
    files.forEach(function (p) {
      var src = get('components/' + p + '.jsx');
      if (!src) return;
      src = src.replace(/^import .*$/gm, '').replace(/export function /g, 'function ');
      var name = p.split('/')[1];
      var code = Babel.transform(src, { presets: ['react'] }).code;
      var keys = Object.keys(NS);
      NS[name] = new Function('React', 'useState', keys.join(','), code + '\nreturn ' + name + ';').apply(null, [React, React.useState].concat(keys.map(function (k) { return NS[k]; })));
    });
    window.__DSFallback = NS;
  }
  window.__DS = function () { return find() || window.__DSFallback || {}; };
})();
