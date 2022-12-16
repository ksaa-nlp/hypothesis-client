(function () {
  'use strict';

  /**
   * Return a parsed `js-hypothesis-config` object from the document, or `{}`.
   *
   * Find all `<script class="js-hypothesis-config">` tags in the given document,
   * parse them as JSON, and return the parsed object.
   *
   * If there are no `js-hypothesis-config` tags in the document then return
   * `{}`.
   *
   * If there are multiple `js-hypothesis-config` tags in the document then merge
   * them into a single returned object (when multiple scripts contain the same
   * setting names, scripts further down in the document override those further
   * up).
   *
   * @param {Document|Element} document - The root element to search.
   */
  function parseJsonConfig(document) {
    /** @type {Record<string, unknown>} */
    var config = {};
    var settingsElements = document.querySelectorAll('script.js-hypothesis-config');
    for (var i = 0; i < settingsElements.length; i++) {
      var settings = void 0;
      try {
        settings = JSON.parse(settingsElements[i].textContent || '');
      } catch (err) {
        console.warn('Could not parse settings from js-hypothesis-config tags', err);
        settings = {};
      }
      Object.assign(config, settings);
    }
    return config;
  }

  /**
   * @typedef SidebarAppConfig
   * @prop {string} assetRoot - The root URL to which URLs in `manifest` are relative
   * @prop {Record<string,string>} manifest -
   *   A mapping from canonical asset path to cache-busted asset path
   * @prop {string} apiUrl
   */

  /**
   * @typedef AnnotatorConfig
   * @prop {string} assetRoot - The root URL to which URLs in `manifest` are relative
   * @prop {string} notebookAppUrl - The URL of the sidebar's notebook
   * @prop {string} sidebarAppUrl - The URL of the sidebar's HTML page
   * @prop {Record<string,string>} manifest -
   *   A mapping from canonical asset path to cache-busted asset path
   */

  /**
   * @typedef {Window & { PDFViewerApplication?: object }} MaybePDFWindow
   */

  /**
   * Mark an element as having been added by the boot script.
   *
   * This marker is later used to know which elements to remove when unloading
   * the client.
   *
   * @param {HTMLElement} el
   */
  function tagElement(el) {
    el.setAttribute('data-hypothesis-asset', '');
  }

  /**
   * @param {Document} doc
   * @param {string} href
   */
  function injectStylesheet(doc, href) {
    var link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    tagElement(link);
    doc.head.appendChild(link);
  }

  /**
   * @param {Document} doc
   * @param {string} src - The script URL
   * @param {object} options
   *   @param {boolean} [options.esModule] - Whether to load the script as an ES module
   *   @param {boolean} [options.forceReload] - Whether to force re-evaluation of an ES module script
   */
  function injectScript(doc, src) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$esModule = _ref.esModule,
      esModule = _ref$esModule === void 0 ? true : _ref$esModule,
      _ref$forceReload = _ref.forceReload,
      forceReload = _ref$forceReload === void 0 ? false : _ref$forceReload;
    var script = doc.createElement('script');
    if (esModule) {
      script.type = 'module';
    }
    if (forceReload) {
      // Module scripts are only evaluated once per URL in a document. Adding
      // a dynamic fragment forces re-evaluation without breaking browser or CDN
      // caching of the script, as a query string would do.
      //
      // See examples in https://html.spec.whatwg.org/multipage/webappapis.html#integration-with-the-javascript-module-system
      src += "#ts=".concat(Date.now());
    }
    script.src = src;

    // Set 'async' to false to maintain execution order of scripts.
    // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
    script.async = false;
    tagElement(script);
    doc.head.appendChild(script);
  }

  /**
   * @param {Document} doc
   * @param {string} rel
   * @param {'html'|'javascript'} type
   * @param {string} url
   */
  function injectLink(doc, rel, type, url) {
    var link = doc.createElement('link');
    link.rel = rel;
    link.href = url;
    link.type = "application/annotator+".concat(type);
    tagElement(link);
    doc.head.appendChild(link);
  }

  /**
   * Preload a URL using a `<link rel="preload" as="<type>" ...>` element
   *
   * This can be used to preload an API request or other resource which we know
   * that the client will load.
   *
   * @param {Document} doc
   * @param {string} type - Type of resource
   * @param {string} url
   */
  function preloadURL(doc, type, url) {
    var link = doc.createElement('link');
    link.rel = 'preload';
    link.as = type;
    link.href = url;

    // If this is a resource that we are going to read the contents of, then we
    // need to make a cross-origin request. For other types, use a non cross-origin
    // request which returns a response that is opaque.
    if (type === 'fetch') {
      link.crossOrigin = 'anonymous';
    }
    tagElement(link);
    doc.head.appendChild(link);
  }

  /**
   * @param {SidebarAppConfig|AnnotatorConfig} config
   * @param {string} path
   */
  function assetURL(config, path) {
    return config.assetRoot + 'build/' + config.manifest[path];
  }

  /**
   * Bootstrap the Hypothesis client.
   *
   * This triggers loading of the necessary resources for the client
   *
   * @param {Document} doc
   * @param {AnnotatorConfig} config
   */
  function bootHypothesisClient(doc, config) {
    // Detect presence of Hypothesis in the page
    var appLinkEl = doc.querySelector('link[type="application/annotator+html"]');
    if (appLinkEl) {
      return;
    }

    // Register the URL of the sidebar app which the Hypothesis client should load.
    // The <link> tag is also used by browser extensions etc. to detect the
    // presence of the Hypothesis client on the page.
    injectLink(doc, 'sidebar', 'html', config.sidebarAppUrl);

    // Register the URL of the notebook app which the Hypothesis client should load.
    injectLink(doc, 'notebook', 'html', config.notebookAppUrl);

    // Preload the styles used by the shadow roots of annotator UI elements.
    preloadURL(doc, 'style', assetURL(config, 'styles/annotator.css'));

    // Register the URL of the annotation client which is currently being used to drive
    // annotation interactions.
    injectLink(doc, 'hypothesis-client', 'javascript', config.assetRoot + 'build/boot.js');
    var scripts = ['scripts/annotator.bundle.js'];
    for (var _i = 0, _scripts = scripts; _i < _scripts.length; _i++) {
      var path = _scripts[_i];
      var url = assetURL(config, path);
      injectScript(doc, url, {
        esModule: false
      });
    }
    var styles = [];
    if ( /** @type {MaybePDFWindow} */window.PDFViewerApplication !== undefined) {
      styles.push('styles/pdfjs-overrides.css');
    }
    styles.push('styles/highlights.css');
    for (var _i2 = 0, _styles = styles; _i2 < _styles.length; _i2++) {
      var _path = _styles[_i2];
      var _url = assetURL(config, _path);
      injectStylesheet(doc, _url);
    }
  }

  /**
   * Bootstrap the sidebar application which displays annotations.
   *
   * @param {Document} doc
   * @param {SidebarAppConfig} config
   */
  function bootSidebarApp(doc, config) {
    // Preload `/api/` and `/api/links` API responses.
    preloadURL(doc, 'fetch', config.apiUrl);
    preloadURL(doc, 'fetch', config.apiUrl + 'links');
    var scripts = ['scripts/sidebar.bundle.js'];
    for (var _i3 = 0, _scripts2 = scripts; _i3 < _scripts2.length; _i3++) {
      var path = _scripts2[_i3];
      var url = assetURL(config, path);
      injectScript(doc, url, {
        esModule: true
      });
    }
    var styles = ['styles/katex.min.css', 'styles/sidebar.css'];
    for (var _i4 = 0, _styles2 = styles; _i4 < _styles2.length; _i4++) {
      var _path2 = _styles2[_i4];
      var _url2 = assetURL(config, _path2);
      injectStylesheet(doc, _url2);
    }
  }

  /**
   * Extract the protocol and hostname (ie. host without port) from the URL.
   *
   * We don't use the URL constructor here because IE and early versions of Edge
   * do not support it and this code runs early in the life of the app before any
   * polyfills can be loaded.
   *
   * @param {string} url
   */
  function extractOrigin(url) {
    var match = url.match(/(https?):\/\/([^:/]+)/);
    if (!match) {
      return null;
    }
    return {
      protocol: match[1],
      hostname: match[2]
    };
  }
  function currentScriptOrigin() {
    var document_ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
    var scriptEl = /** @type {HTMLScriptElement|null} */
    document_.currentScript;
    if (!scriptEl) {
      // Function was called outside of initial script execution.
      return null;
    }
    return extractOrigin(scriptEl.src);
  }

  /**
   * Replace references to `current_host` and `current_scheme` URL template
   * parameters with the corresponding elements of the current script URL.
   *
   * During local development, there are cases when the client/h needs to be accessed
   * from a device or VM that is not the system where the development server is
   * running. In that case, all references to `localhost` need to be replaced
   * with the IP/hostname of the dev server.
   *
   * @param {string} url
   * @param {Document} document_
   */
  function processUrlTemplate(url) {
    var document_ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
    if (url.indexOf('{') === -1) {
      // Not a template. This should always be the case in production.
      return url;
    }
    var origin = currentScriptOrigin(document_);
    if (origin) {
      url = url.replace('{current_host}', origin.hostname);
      url = url.replace('{current_scheme}', origin.protocol);
    } else {
      throw new Error('Could not process URL template because script origin is unknown');
    }
    return url;
  }

  /**
   * Run a series of representative feature tests to see if the browser is new
   * enough to support Hypothesis.
   *
   * We use feature tests to try to avoid false negatives, accepting some risk of
   * false positives due to the host page having loaded polyfills for APIs in order
   * to support older browsers.
   *
   * @return {boolean}
   */
  function isBrowserSupported() {
    // Checks that return a truthy value if they succeed and throw or return
    // a falsey value if they fail.
    var checks = [
    // ES APIs.
    function () {
      return Promise.resolve();
    }, function () {
      return new Map();
    },
    // DOM API checks for frequently-used APIs.
    function () {
      return new URL(document.location.href);
    },
    // URL constructor.
    function () {
      return new Request('https://hypothes.is');
    },
    // Part of the `fetch` API.
    function () {
      return Element.prototype.attachShadow;
    },
    // CSS feature checks
    function () {
      return CSS.supports('display: grid');
    },
    // DOM API checks for less frequently-used APIs.
    // These are less likely to have been polyfilled by the host page.
    function () {
      document.evaluate('/html/body', document,
      // These arguments are optional in the spec but required in Edge Legacy.
      null /* namespaceResolver */, XPathResult.ANY_TYPE, null /* result */);

      return true;
    }];
    try {
      return checks.every(function (check) {
        return check();
      });
    } catch (err) {
      return false;
    }
  }

  var manifest = {
  	"scripts/annotator.bundle.js": "scripts/annotator.bundle.js?dc0892",
  	"styles/annotator.css": "styles/annotator.css?c10c10",
  	"styles/annotator.css.map": "styles/annotator.css.map?b4d472",
  	"styles/highlights.css": "styles/highlights.css?288112",
  	"styles/katex.min.css": "styles/katex.min.css?776307",
  	"styles/highlights.css.map": "styles/highlights.css.map?f6fbd4",
  	"styles/katex.min.css.map": "styles/katex.min.css.map?fed30c",
  	"styles/pdfjs-overrides.css": "styles/pdfjs-overrides.css?c95edf",
  	"styles/sidebar.css": "styles/sidebar.css?95c934",
  	"styles/sidebar.css.map": "styles/sidebar.css.map?bc81e1",
  	"styles/pdfjs-overrides.css.map": "styles/pdfjs-overrides.css.map?c5ebce",
  	"styles/ui-playground.css.map": "styles/ui-playground.css.map?b9af06",
  	"styles/ui-playground.css": "styles/ui-playground.css?becd14",
  	"scripts/annotator.bundle.js.map": "scripts/annotator.bundle.js.map?7b05b1",
  	"scripts/sidebar.bundle.js": "scripts/sidebar.bundle.js?9044c9",
  	"scripts/ui-playground.bundle.js": "scripts/ui-playground.bundle.js?8b6a33",
  	"scripts/ui-playground.bundle.js.map": "scripts/ui-playground.bundle.js.map?be410e",
  	"scripts/sidebar.bundle.js.map": "scripts/sidebar.bundle.js.map?9ed46b"
  };

  // This is the main entry point for the Hypothesis client in the host page

  /**
   * @typedef {import('./boot').AnnotatorConfig} AnnotatorConfig
   * @typedef {import('./boot').SidebarAppConfig} SidebarAppConfig
   */

  if (isBrowserSupported()) {
    var config = /** @type {AnnotatorConfig|SidebarAppConfig} */
    parseJsonConfig(document);
    var assetRoot = processUrlTemplate(config.assetRoot || '{current_scheme}://{current_host}:3001/hypothesis/1.0.0-dummy-version/');

    // Check whether this is the sidebar app (indicated by the presence of a
    // `<hypothesis-app>` element) and load the appropriate part of the client.
    if (document.querySelector('hypothesis-app')) {
      var sidebarConfig = /** @type {SidebarAppConfig} */config;
      bootSidebarApp(document, {
        assetRoot: assetRoot,
        manifest: manifest,
        apiUrl: sidebarConfig.apiUrl
      });
    } else {
      var annotatorConfig = /** @type {AnnotatorConfig} */config;
      var notebookAppUrl = processUrlTemplate(annotatorConfig.notebookAppUrl || '{current_scheme}://{current_host}:5000/notebook');
      var sidebarAppUrl = processUrlTemplate(annotatorConfig.sidebarAppUrl || '{current_scheme}://{current_host}:5000/app.html');
      bootHypothesisClient(document, {
        assetRoot: assetRoot,
        manifest: manifest,
        notebookAppUrl: notebookAppUrl,
        sidebarAppUrl: sidebarAppUrl
      });
    }
  } else {
    // Show a "quiet" warning to avoid being disruptive on non-Hypothesis sites
    // that embed the client.
    //
    // In Via or when using the bookmarklet we could show something louder.
    console.warn('The Hypothesis annotation tool is not supported in this browser. See https://web.hypothes.is/help/which-browsers-are-supported-by-hypothesis/.');
  }

})();
