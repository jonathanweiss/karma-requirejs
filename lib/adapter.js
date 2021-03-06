(function(karma, requirejs, locationPathname) {

/* eslint-disable no-unused-vars */

// monkey patch requirejs, to use append timestamps to sources
// to take advantage of karma's heavy caching
// it would work even without this hack, but with reloading all the files all the time

var normalizePath = function (path) {
  var normalized = []
  var parts = path
    .split('?')[0] // cut off GET params, used by noext requirejs plugin
    .split('/')

  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '.') {
      continue
    }

    if (parts[i] === '..' && normalized.length && normalized[normalized.length - 1] !== '..') {
      normalized.pop()
      continue
    }

    normalized.push(parts[i])
  }

  var file = normalized.pop()
  file += file.indexOf('.js') === -1 ? '.js' : ''
  normalized.push(file)

  return normalized.join('/')
}

var createPatchedLoad = function (karma, originalLoadFn, locationPathname) {
  var files = karma.files
  var config = karma.config
  var IS_DEBUG = /debug\.html$/.test(locationPathname)

  return function (context, moduleName, url) {
    url = normalizePath(url)

    if (files.hasOwnProperty(url)) {
      if (!IS_DEBUG) {
        url = url + '?' + files[url]
      }
    } else {
      var shouldShowNoTimestampError =
          typeof config.requireJsShowNoTimestampsError === 'string'
          ? new RegExp(config.requireJsShowNoTimestampsError).test(url)
          : config.hasOwnProperty('requireJsShowNoTimestampsError')
          ? config.requireJsShowNoTimestampsError
          : true
      if (shouldShowNoTimestampError && !/https?:\/\/\S+\.\S+/i.test(url)) {
        console.error('There is no timestamp for ' + url + '!')
      }
    }

    return originalLoadFn.call(this, context, moduleName, url)
  }
}

// make it async
karma.loaded = function() {};

// patch require.js
requirejs.load = createPatchedLoad(karma, requirejs.load, locationPathname);

})(window.__karma__, window.requirejs, window.location.pathname);
