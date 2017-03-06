(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("facility.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (channel) {
  var intFromFindClass = function intFromFindClass(parent, className) {
    return parseInt(parent.find(className).html(), 10);
  };
  var getAvailable = function getAvailable(row) {
    return intFromFindClass(row, '.js-available-quantity');
  };
  var getQuantity = function getQuantity(row) {
    return intFromFindClass(row, '.js-current-quantity');
  };
  var getCost = function getCost(row) {
    return intFromFindClass(row, '.js-credit-cost');
  };
  var getCredits = function getCredits(row) {
    return intFromFindClass(row.parents('.js-stock-type'), '.js-credit-count');
  };
  var getType = function getType(row) {
    return row.parents('.js-stock-type').find('.js-credit-count').data('credit-type');
  };
  var setUserQuantity = function setUserQuantity(row, newQuantity) {
    return row.find('.js-current-quantity').html(newQuantity);
  };
  var setTotalQuantity = function setTotalQuantity(row, newQuantity) {
    return row.find('.js-available-quantity').html(newQuantity);
  };
  var setCredits = function setCredits(row, newQuantity) {
    return row.parents('.js-stock-type').find('.js-credit-count').html(newQuantity);
  };
  var fn;
  var handlers = {
    "js-add-stock": function jsAddStock(row) {
      var credits = getCredits(row);
      var cost = getCost(row);
      if (getAvailable(row) > 0 && credits >= cost) {
        channel.push('request_stock', { id: row.data('stock-id'), quantity: 1, type: getType(row) });
        setUserQuantity(row, getQuantity(row) + 1);
        setCredits(row, credits - cost);
      }
    },
    "js-remove-stock": function jsRemoveStock(row) {
      var currentQuantity = getQuantity(row);
      if (currentQuantity > 0) {
        var credits = getCredits(row);
        var cost = getCost(row);
        channel.push('release_stock', { id: row.data('stock-id'), quantity: 1, type: getType(row) });
        setUserQuantity(row, currentQuantity - 1);
        setCredits(row, credits + cost);
      }
    },
    "js-clear-stock": function jsClearStock(row) {
      var currentQuantity = getQuantity(row);
      if (currentQuantity > 0) {
        var credits = getCredits(row);
        var cost = getCost(row);
        channel.push('release_stock', { id: row.data('stock-id'), quantity: getQuantity(row), type: getType(row) });
        setUserQuantity(row, 0);
        setCredits(row, credits + cost * currentQuantity);
      }
    }
  };

  $('.js-stock-row').on('click', function (el) {
    if (fn = handlers[el.target.className]) {
      fn($(el.currentTarget));
    };
  });

  channel.on('set_stock', function (payload) {
    var id = payload.id,
        quantity = payload.quantity;

    setTotalQuantity($('*[data-stock-id="' + id + '"]'), quantity);
  });

  channel.on('current_credits', function (payload) {
    $.each(payload, function (type, credits) {
      return $('#' + type).find('.js-credit-count').html(credits);
    });
  });

  channel.on('update_distribution', function (payload) {
    var id = payload.id,
        html = payload.html;

    var $html = $(html);
    var existing = $('.js-cart').find('*[data-stock-distribution-id="' + id + '"]').first();
    var quantity = intFromFindClass($html, '.js-quantity-requested');

    if (existing.length && quantity > 0) {
      $(existing).html($html.html());
    } else if (existing.length && quantity == 0) {
      $(existing).remove();
    } else {
      $('.js-cart').find('tbody').append(html);
    }
  });
};
});

;require.alias("phoenix_html/priv/static/phoenix_html.js", "phoenix_html");
require.alias("phoenix/priv/static/phoenix.js", "phoenix");require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=facility.js.map