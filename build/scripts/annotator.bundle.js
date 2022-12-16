(function () {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getDefaultExportFromNamespaceIfPresent (n) {
		return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
	}

	function getDefaultExportFromNamespaceIfNotNamed (n) {
		return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
	}

	function getAugmentedNamespace(n) {
	  var f = n.default;
		if (typeof f == "function") {
			var a = function () {
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var focusVisible$1 = {exports: {}};

	(function (module, exports) {
		(function (global, factory) {
		  'object' === 'object' && 'object' !== 'undefined' ? factory() :
		  typeof undefined === 'function' && undefined.amd ? undefined(factory) :
		  (factory());
		}(commonjsGlobal, (function () { 'use strict';

		  /**
		   * Applies the :focus-visible polyfill at the given scope.
		   * A scope in this case is either the top-level Document or a Shadow Root.
		   *
		   * @param {(Document|ShadowRoot)} scope
		   * @see https://github.com/WICG/focus-visible
		   */
		  function applyFocusVisiblePolyfill(scope) {
		    var hadKeyboardEvent = true;
		    var hadFocusVisibleRecently = false;
		    var hadFocusVisibleRecentlyTimeout = null;

		    var inputTypesAllowlist = {
		      text: true,
		      search: true,
		      url: true,
		      tel: true,
		      email: true,
		      password: true,
		      number: true,
		      date: true,
		      month: true,
		      week: true,
		      time: true,
		      datetime: true,
		      'datetime-local': true
		    };

		    /**
		     * Helper function for legacy browsers and iframes which sometimes focus
		     * elements like document, body, and non-interactive SVG.
		     * @param {Element} el
		     */
		    function isValidFocusTarget(el) {
		      if (
		        el &&
		        el !== document &&
		        el.nodeName !== 'HTML' &&
		        el.nodeName !== 'BODY' &&
		        'classList' in el &&
		        'contains' in el.classList
		      ) {
		        return true;
		      }
		      return false;
		    }

		    /**
		     * Computes whether the given element should automatically trigger the
		     * `focus-visible` class being added, i.e. whether it should always match
		     * `:focus-visible` when focused.
		     * @param {Element} el
		     * @return {boolean}
		     */
		    function focusTriggersKeyboardModality(el) {
		      var type = el.type;
		      var tagName = el.tagName;

		      if (tagName === 'INPUT' && inputTypesAllowlist[type] && !el.readOnly) {
		        return true;
		      }

		      if (tagName === 'TEXTAREA' && !el.readOnly) {
		        return true;
		      }

		      if (el.isContentEditable) {
		        return true;
		      }

		      return false;
		    }

		    /**
		     * Add the `focus-visible` class to the given element if it was not added by
		     * the author.
		     * @param {Element} el
		     */
		    function addFocusVisibleClass(el) {
		      if (el.classList.contains('focus-visible')) {
		        return;
		      }
		      el.classList.add('focus-visible');
		      el.setAttribute('data-focus-visible-added', '');
		    }

		    /**
		     * Remove the `focus-visible` class from the given element if it was not
		     * originally added by the author.
		     * @param {Element} el
		     */
		    function removeFocusVisibleClass(el) {
		      if (!el.hasAttribute('data-focus-visible-added')) {
		        return;
		      }
		      el.classList.remove('focus-visible');
		      el.removeAttribute('data-focus-visible-added');
		    }

		    /**
		     * If the most recent user interaction was via the keyboard;
		     * and the key press did not include a meta, alt/option, or control key;
		     * then the modality is keyboard. Otherwise, the modality is not keyboard.
		     * Apply `focus-visible` to any current active element and keep track
		     * of our keyboard modality state with `hadKeyboardEvent`.
		     * @param {KeyboardEvent} e
		     */
		    function onKeyDown(e) {
		      if (e.metaKey || e.altKey || e.ctrlKey) {
		        return;
		      }

		      if (isValidFocusTarget(scope.activeElement)) {
		        addFocusVisibleClass(scope.activeElement);
		      }

		      hadKeyboardEvent = true;
		    }

		    /**
		     * If at any point a user clicks with a pointing device, ensure that we change
		     * the modality away from keyboard.
		     * This avoids the situation where a user presses a key on an already focused
		     * element, and then clicks on a different element, focusing it with a
		     * pointing device, while we still think we're in keyboard modality.
		     * @param {Event} e
		     */
		    function onPointerDown(e) {
		      hadKeyboardEvent = false;
		    }

		    /**
		     * On `focus`, add the `focus-visible` class to the target if:
		     * - the target received focus as a result of keyboard navigation, or
		     * - the event target is an element that will likely require interaction
		     *   via the keyboard (e.g. a text box)
		     * @param {Event} e
		     */
		    function onFocus(e) {
		      // Prevent IE from focusing the document or HTML element.
		      if (!isValidFocusTarget(e.target)) {
		        return;
		      }

		      if (hadKeyboardEvent || focusTriggersKeyboardModality(e.target)) {
		        addFocusVisibleClass(e.target);
		      }
		    }

		    /**
		     * On `blur`, remove the `focus-visible` class from the target.
		     * @param {Event} e
		     */
		    function onBlur(e) {
		      if (!isValidFocusTarget(e.target)) {
		        return;
		      }

		      if (
		        e.target.classList.contains('focus-visible') ||
		        e.target.hasAttribute('data-focus-visible-added')
		      ) {
		        // To detect a tab/window switch, we look for a blur event followed
		        // rapidly by a visibility change.
		        // If we don't see a visibility change within 100ms, it's probably a
		        // regular focus change.
		        hadFocusVisibleRecently = true;
		        window.clearTimeout(hadFocusVisibleRecentlyTimeout);
		        hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
		          hadFocusVisibleRecently = false;
		        }, 100);
		        removeFocusVisibleClass(e.target);
		      }
		    }

		    /**
		     * If the user changes tabs, keep track of whether or not the previously
		     * focused element had .focus-visible.
		     * @param {Event} e
		     */
		    function onVisibilityChange(e) {
		      if (document.visibilityState === 'hidden') {
		        // If the tab becomes active again, the browser will handle calling focus
		        // on the element (Safari actually calls it twice).
		        // If this tab change caused a blur on an element with focus-visible,
		        // re-apply the class when the user switches back to the tab.
		        if (hadFocusVisibleRecently) {
		          hadKeyboardEvent = true;
		        }
		        addInitialPointerMoveListeners();
		      }
		    }

		    /**
		     * Add a group of listeners to detect usage of any pointing devices.
		     * These listeners will be added when the polyfill first loads, and anytime
		     * the window is blurred, so that they are active when the window regains
		     * focus.
		     */
		    function addInitialPointerMoveListeners() {
		      document.addEventListener('mousemove', onInitialPointerMove);
		      document.addEventListener('mousedown', onInitialPointerMove);
		      document.addEventListener('mouseup', onInitialPointerMove);
		      document.addEventListener('pointermove', onInitialPointerMove);
		      document.addEventListener('pointerdown', onInitialPointerMove);
		      document.addEventListener('pointerup', onInitialPointerMove);
		      document.addEventListener('touchmove', onInitialPointerMove);
		      document.addEventListener('touchstart', onInitialPointerMove);
		      document.addEventListener('touchend', onInitialPointerMove);
		    }

		    function removeInitialPointerMoveListeners() {
		      document.removeEventListener('mousemove', onInitialPointerMove);
		      document.removeEventListener('mousedown', onInitialPointerMove);
		      document.removeEventListener('mouseup', onInitialPointerMove);
		      document.removeEventListener('pointermove', onInitialPointerMove);
		      document.removeEventListener('pointerdown', onInitialPointerMove);
		      document.removeEventListener('pointerup', onInitialPointerMove);
		      document.removeEventListener('touchmove', onInitialPointerMove);
		      document.removeEventListener('touchstart', onInitialPointerMove);
		      document.removeEventListener('touchend', onInitialPointerMove);
		    }

		    /**
		     * When the polfyill first loads, assume the user is in keyboard modality.
		     * If any event is received from a pointing device (e.g. mouse, pointer,
		     * touch), turn off keyboard modality.
		     * This accounts for situations where focus enters the page from the URL bar.
		     * @param {Event} e
		     */
		    function onInitialPointerMove(e) {
		      // Work around a Safari quirk that fires a mousemove on <html> whenever the
		      // window blurs, even if you're tabbing out of the page. ¯\_(ツ)_/¯
		      if (e.target.nodeName && e.target.nodeName.toLowerCase() === 'html') {
		        return;
		      }

		      hadKeyboardEvent = false;
		      removeInitialPointerMoveListeners();
		    }

		    // For some kinds of state, we are interested in changes at the global scope
		    // only. For example, global pointer input, global key presses and global
		    // visibility change should affect the state at every scope:
		    document.addEventListener('keydown', onKeyDown, true);
		    document.addEventListener('mousedown', onPointerDown, true);
		    document.addEventListener('pointerdown', onPointerDown, true);
		    document.addEventListener('touchstart', onPointerDown, true);
		    document.addEventListener('visibilitychange', onVisibilityChange, true);

		    addInitialPointerMoveListeners();

		    // For focus and blur, we specifically care about state changes in the local
		    // scope. This is because focus / blur events that originate from within a
		    // shadow root are not re-dispatched from the host element if it was already
		    // the active element in its own scope:
		    scope.addEventListener('focus', onFocus, true);
		    scope.addEventListener('blur', onBlur, true);

		    // We detect that a node is a ShadowRoot by ensuring that it is a
		    // DocumentFragment and also has a host property. This check covers native
		    // implementation and polyfill implementation transparently. If we only cared
		    // about the native implementation, we could just check if the scope was
		    // an instance of a ShadowRoot.
		    if (scope.nodeType === Node.DOCUMENT_FRAGMENT_NODE && scope.host) {
		      // Since a ShadowRoot is a special kind of DocumentFragment, it does not
		      // have a root element to add a class to. So, we add this attribute to the
		      // host element instead:
		      scope.host.setAttribute('data-js-focus-visible', '');
		    } else if (scope.nodeType === Node.DOCUMENT_NODE) {
		      document.documentElement.classList.add('js-focus-visible');
		      document.documentElement.setAttribute('data-js-focus-visible', '');
		    }
		  }

		  // It is important to wrap all references to global window and document in
		  // these checks to support server-side rendering use cases
		  // @see https://github.com/WICG/focus-visible/issues/199
		  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		    // Make the polyfill helper globally available. This can be used as a signal
		    // to interested libraries that wish to coordinate with the polyfill for e.g.,
		    // applying the polyfill to a shadow root:
		    window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;

		    // Notify interested libraries of the polyfill's presence, in case the
		    // polyfill was loaded lazily:
		    var event;

		    try {
		      event = new CustomEvent('focus-visible-polyfill-ready');
		    } catch (error) {
		      // IE11 does not support using CustomEvent as a constructor directly:
		      event = document.createEvent('CustomEvent');
		      event.initCustomEvent('focus-visible-polyfill-ready', false, false, {});
		    }

		    window.dispatchEvent(event);
		  }

		  if (typeof document !== 'undefined') {
		    // Apply the polyfill to the global document, so that no JavaScript
		    // coordination is required to use the polyfill in the top-level document:
		    applyFocusVisiblePolyfill(document);
		  }

		})));
	} (focusVisible$1, focusVisible$1.exports));

	var focusVisible = focusVisible$1.exports;

	var n,l$2,u$2,i$2,t$2,o$3,r$2,f$2={},e$1=[],c$2=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function s$2(n,l){for(var u in l)n[u]=l[u];return n}function a$2(n){var l=n.parentNode;l&&l.removeChild(n);}function h$2(l,u,i){var t,o,r,f={};for(r in u)"key"==r?t=u[r]:"ref"==r?o=u[r]:f[r]=u[r];if(arguments.length>2&&(f.children=arguments.length>3?n.call(arguments,2):i),"function"==typeof l&&null!=l.defaultProps)for(r in l.defaultProps)void 0===f[r]&&(f[r]=l.defaultProps[r]);return v$2(l,f,t,o,null)}function v$2(n,i,t,o,r){var f={type:n,props:i,key:t,ref:o,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:null==r?++u$2:r};return null==r&&null!=l$2.vnode&&l$2.vnode(f),f}function y$2(){return {current:null}}function p$2(n){return n.children}function d$2(n,l){this.props=n,this.context=l;}function _$2(n,l){if(null==l)return n.__?_$2(n.__,n.__.__k.indexOf(n)+1):null;for(var u;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e)return u.__e;return "function"==typeof n.type?_$2(n):null}function k$1(n){var l,u;if(null!=(n=n.__)&&null!=n.__c){for(n.__e=n.__c.base=null,l=0;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e){n.__e=n.__c.base=u.__e;break}return k$1(n)}}function b$1(n){(!n.__d&&(n.__d=!0)&&t$2.push(n)&&!g$1.__r++||o$3!==l$2.debounceRendering)&&((o$3=l$2.debounceRendering)||setTimeout)(g$1);}function g$1(){for(var n;g$1.__r=t$2.length;)n=t$2.sort(function(n,l){return n.__v.__b-l.__v.__b}),t$2=[],n.some(function(n){var l,u,i,t,o,r;n.__d&&(o=(t=(l=n).__v).__e,(r=l.__P)&&(u=[],(i=s$2({},t)).__v=t.__v+1,j$1(r,t,i,l.__n,void 0!==r.ownerSVGElement,null!=t.__h?[o]:null,u,null==o?_$2(t):o,t.__h),z$1(u,t),t.__e!=o&&k$1(t)));});}function w$1(n,l,u,i,t,o,r,c,s,a){var h,y,d,k,b,g,w,x=i&&i.__k||e$1,C=x.length;for(u.__k=[],h=0;h<l.length;h++)if(null!=(k=u.__k[h]=null==(k=l[h])||"boolean"==typeof k?null:"string"==typeof k||"number"==typeof k||"bigint"==typeof k?v$2(null,k,null,null,k):Array.isArray(k)?v$2(p$2,{children:k},null,null,null):k.__b>0?v$2(k.type,k.props,k.key,k.ref?k.ref:null,k.__v):k)){if(k.__=u,k.__b=u.__b+1,null===(d=x[h])||d&&k.key==d.key&&k.type===d.type)x[h]=void 0;else for(y=0;y<C;y++){if((d=x[y])&&k.key==d.key&&k.type===d.type){x[y]=void 0;break}d=null;}j$1(n,k,d=d||f$2,t,o,r,c,s,a),b=k.__e,(y=k.ref)&&d.ref!=y&&(w||(w=[]),d.ref&&w.push(d.ref,null,k),w.push(y,k.__c||b,k)),null!=b?(null==g&&(g=b),"function"==typeof k.type&&k.__k===d.__k?k.__d=s=m$1(k,s,n):s=A$1(n,k,d,x,b,s),"function"==typeof u.type&&(u.__d=s)):s&&d.__e==s&&s.parentNode!=n&&(s=_$2(d));}for(u.__e=g,h=C;h--;)null!=x[h]&&N(x[h],x[h]);if(w)for(h=0;h<w.length;h++)M(w[h],w[++h],w[++h]);}function m$1(n,l,u){for(var i,t=n.__k,o=0;t&&o<t.length;o++)(i=t[o])&&(i.__=n,l="function"==typeof i.type?m$1(i,l,u):A$1(u,i,i,t,i.__e,l));return l}function x$1(n,l){return l=l||[],null==n||"boolean"==typeof n||(Array.isArray(n)?n.some(function(n){x$1(n,l);}):l.push(n)),l}function A$1(n,l,u,i,t,o){var r,f,e;if(void 0!==l.__d)r=l.__d,l.__d=void 0;else if(null==u||t!=o||null==t.parentNode)n:if(null==o||o.parentNode!==n)n.appendChild(t),r=null;else {for(f=o,e=0;(f=f.nextSibling)&&e<i.length;e+=1)if(f==t)break n;n.insertBefore(t,o),r=o;}return void 0!==r?r:t.nextSibling}function C(n,l,u,i,t){var o;for(o in u)"children"===o||"key"===o||o in l||H(n,o,null,u[o],i);for(o in l)t&&"function"!=typeof l[o]||"children"===o||"key"===o||"value"===o||"checked"===o||u[o]===l[o]||H(n,o,l[o],u[o],i);}function $(n,l,u){"-"===l[0]?n.setProperty(l,u):n[l]=null==u?"":"number"!=typeof u||c$2.test(l)?u:u+"px";}function H(n,l,u,i,t){var o;n:if("style"===l)if("string"==typeof u)n.style.cssText=u;else {if("string"==typeof i&&(n.style.cssText=i=""),i)for(l in i)u&&l in u||$(n.style,l,"");if(u)for(l in u)i&&u[l]===i[l]||$(n.style,l,u[l]);}else if("o"===l[0]&&"n"===l[1])o=l!==(l=l.replace(/Capture$/,"")),l=l.toLowerCase()in n?l.toLowerCase().slice(2):l.slice(2),n.l||(n.l={}),n.l[l+o]=u,u?i||n.addEventListener(l,o?T$1:I,o):n.removeEventListener(l,o?T$1:I,o);else if("dangerouslySetInnerHTML"!==l){if(t)l=l.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if("href"!==l&&"list"!==l&&"form"!==l&&"tabIndex"!==l&&"download"!==l&&l in n)try{n[l]=null==u?"":u;break n}catch(n){}"function"==typeof u||(null==u||!1===u&&-1==l.indexOf("-")?n.removeAttribute(l):n.setAttribute(l,u));}}function I(n){this.l[n.type+!1](l$2.event?l$2.event(n):n);}function T$1(n){this.l[n.type+!0](l$2.event?l$2.event(n):n);}function j$1(n,u,i,t,o,r,f,e,c){var a,h,v,y,_,k,b,g,m,x,A,C,$,H,I,T=u.type;if(void 0!==u.constructor)return null;null!=i.__h&&(c=i.__h,e=u.__e=i.__e,u.__h=null,r=[e]),(a=l$2.__b)&&a(u);try{n:if("function"==typeof T){if(g=u.props,m=(a=T.contextType)&&t[a.__c],x=a?m?m.props.value:a.__:t,i.__c?b=(h=u.__c=i.__c).__=h.__E:("prototype"in T&&T.prototype.render?u.__c=h=new T(g,x):(u.__c=h=new d$2(g,x),h.constructor=T,h.render=O),m&&m.sub(h),h.props=g,h.state||(h.state={}),h.context=x,h.__n=t,v=h.__d=!0,h.__h=[],h._sb=[]),null==h.__s&&(h.__s=h.state),null!=T.getDerivedStateFromProps&&(h.__s==h.state&&(h.__s=s$2({},h.__s)),s$2(h.__s,T.getDerivedStateFromProps(g,h.__s))),y=h.props,_=h.state,v)null==T.getDerivedStateFromProps&&null!=h.componentWillMount&&h.componentWillMount(),null!=h.componentDidMount&&h.__h.push(h.componentDidMount);else {if(null==T.getDerivedStateFromProps&&g!==y&&null!=h.componentWillReceiveProps&&h.componentWillReceiveProps(g,x),!h.__e&&null!=h.shouldComponentUpdate&&!1===h.shouldComponentUpdate(g,h.__s,x)||u.__v===i.__v){for(h.props=g,h.state=h.__s,u.__v!==i.__v&&(h.__d=!1),h.__v=u,u.__e=i.__e,u.__k=i.__k,u.__k.forEach(function(n){n&&(n.__=u);}),A=0;A<h._sb.length;A++)h.__h.push(h._sb[A]);h._sb=[],h.__h.length&&f.push(h);break n}null!=h.componentWillUpdate&&h.componentWillUpdate(g,h.__s,x),null!=h.componentDidUpdate&&h.__h.push(function(){h.componentDidUpdate(y,_,k);});}if(h.context=x,h.props=g,h.__v=u,h.__P=n,C=l$2.__r,$=0,"prototype"in T&&T.prototype.render){for(h.state=h.__s,h.__d=!1,C&&C(u),a=h.render(h.props,h.state,h.context),H=0;H<h._sb.length;H++)h.__h.push(h._sb[H]);h._sb=[];}else do{h.__d=!1,C&&C(u),a=h.render(h.props,h.state,h.context),h.state=h.__s;}while(h.__d&&++$<25);h.state=h.__s,null!=h.getChildContext&&(t=s$2(s$2({},t),h.getChildContext())),v||null==h.getSnapshotBeforeUpdate||(k=h.getSnapshotBeforeUpdate(y,_)),I=null!=a&&a.type===p$2&&null==a.key?a.props.children:a,w$1(n,Array.isArray(I)?I:[I],u,i,t,o,r,f,e,c),h.base=u.__e,u.__h=null,h.__h.length&&f.push(h),b&&(h.__E=h.__=null),h.__e=!1;}else null==r&&u.__v===i.__v?(u.__k=i.__k,u.__e=i.__e):u.__e=L(i.__e,u,i,t,o,r,f,c);(a=l$2.diffed)&&a(u);}catch(n){u.__v=null,(c||null!=r)&&(u.__e=e,u.__h=!!c,r[r.indexOf(e)]=null),l$2.__e(n,u,i);}}function z$1(n,u){l$2.__c&&l$2.__c(u,n),n.some(function(u){try{n=u.__h,u.__h=[],n.some(function(n){n.call(u);});}catch(n){l$2.__e(n,u.__v);}});}function L(l,u,i,t,o,r,e,c){var s,h,v,y=i.props,p=u.props,d=u.type,k=0;if("svg"===d&&(o=!0),null!=r)for(;k<r.length;k++)if((s=r[k])&&"setAttribute"in s==!!d&&(d?s.localName===d:3===s.nodeType)){l=s,r[k]=null;break}if(null==l){if(null===d)return document.createTextNode(p);l=o?document.createElementNS("http://www.w3.org/2000/svg",d):document.createElement(d,p.is&&p),r=null,c=!1;}if(null===d)y===p||c&&l.data===p||(l.data=p);else {if(r=r&&n.call(l.childNodes),h=(y=i.props||f$2).dangerouslySetInnerHTML,v=p.dangerouslySetInnerHTML,!c){if(null!=r)for(y={},k=0;k<l.attributes.length;k++)y[l.attributes[k].name]=l.attributes[k].value;(v||h)&&(v&&(h&&v.__html==h.__html||v.__html===l.innerHTML)||(l.innerHTML=v&&v.__html||""));}if(C(l,p,y,o,c),v)u.__k=[];else if(k=u.props.children,w$1(l,Array.isArray(k)?k:[k],u,i,t,o&&"foreignObject"!==d,r,e,r?r[0]:i.__k&&_$2(i,0),c),null!=r)for(k=r.length;k--;)null!=r[k]&&a$2(r[k]);c||("value"in p&&void 0!==(k=p.value)&&(k!==l.value||"progress"===d&&!k||"option"===d&&k!==y.value)&&H(l,"value",k,y.value,!1),"checked"in p&&void 0!==(k=p.checked)&&k!==l.checked&&H(l,"checked",k,y.checked,!1));}return l}function M(n,u,i){try{"function"==typeof n?n(u):n.current=u;}catch(n){l$2.__e(n,i);}}function N(n,u,i){var t,o;if(l$2.unmount&&l$2.unmount(n),(t=n.ref)&&(t.current&&t.current!==n.__e||M(t,null,u)),null!=(t=n.__c)){if(t.componentWillUnmount)try{t.componentWillUnmount();}catch(n){l$2.__e(n,u);}t.base=t.__P=null,n.__c=void 0;}if(t=n.__k)for(o=0;o<t.length;o++)t[o]&&N(t[o],u,i||"function"!=typeof n.type);i||null==n.__e||a$2(n.__e),n.__=n.__e=n.__d=void 0;}function O(n,l,u){return this.constructor(n,u)}function P$1(u,i,t){var o,r,e;l$2.__&&l$2.__(u,i),r=(o="function"==typeof t)?null:t&&t.__k||i.__k,e=[],j$1(i,u=(!o&&t||i).__k=h$2(p$2,null,[u]),r||f$2,f$2,void 0!==i.ownerSVGElement,!o&&t?[t]:r?null:i.firstChild?n.call(i.childNodes):null,e,!o&&t?t:r?r.__e:i.firstChild,o),z$1(e,u);}function S(n,l){P$1(n,l,S);}function q$1(l,u,i){var t,o,r,f=s$2({},l.props);for(r in u)"key"==r?t=u[r]:"ref"==r?o=u[r]:f[r]=u[r];return arguments.length>2&&(f.children=arguments.length>3?n.call(arguments,2):i),v$2(l.type,f,t||l.key,o||l.ref,null)}function B$1(n,l){var u={__c:l="__cC"+r$2++,__:n,Consumer:function(n,l){return n.children(l)},Provider:function(n){var u,i;return this.getChildContext||(u=[],(i={})[l]=this,this.getChildContext=function(){return i},this.shouldComponentUpdate=function(n){this.props.value!==n.value&&u.some(b$1);},this.sub=function(n){u.push(n);var l=n.componentWillUnmount;n.componentWillUnmount=function(){u.splice(u.indexOf(n),1),l&&l.call(n);};}),n.children}};return u.Provider.__=u.Consumer.contextType=u}n=e$1.slice,l$2={__e:function(n,l,u,i){for(var t,o,r;l=l.__;)if((t=l.__c)&&!t.__)try{if((o=t.constructor)&&null!=o.getDerivedStateFromError&&(t.setState(o.getDerivedStateFromError(n)),r=t.__d),null!=t.componentDidCatch&&(t.componentDidCatch(n,i||{}),r=t.__d),r)return t.__E=t}catch(l){n=l;}throw n}},u$2=0,i$2=function(n){return null!=n&&void 0===n.constructor},d$2.prototype.setState=function(n,l){var u;u=null!=this.__s&&this.__s!==this.state?this.__s:this.__s=s$2({},this.state),"function"==typeof n&&(n=n(s$2({},u),this.props)),n&&s$2(u,n),null!=n&&this.__v&&(l&&this._sb.push(l),b$1(this));},d$2.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),b$1(this));},d$2.prototype.render=p$2,t$2=[],g$1.__r=0,r$2=0;

	function t$1(o,e){return l$2.__a&&l$2.__a(e),o}"undefined"!=typeof window&&window.__PREACT_DEVTOOLS__&&window.__PREACT_DEVTOOLS__.attachPreact("10.11.3",l$2,{Fragment:p$2,Component:d$2});

	var o$2={};function r$1(){o$2={};}function a$1(e){return e.type===p$2?"Fragment":"function"==typeof e.type?e.type.displayName||e.type.name:"string"==typeof e.type?e.type:"#text"}var i$1=[],c$1=[];function s$1(){return i$1.length>0?i$1[i$1.length-1]:null}var u$1=!1;function l$1(e){return "function"==typeof e.type&&e.type!=p$2}function f$1(n){for(var e=[n],t=n;null!=t.__o;)e.push(t.__o),t=t.__o;return e.reduce(function(n,e){n+="  in "+a$1(e);var t=e.__source;return t?n+=" (at "+t.fileName+":"+t.lineNumber+")":u$1||(u$1=!0,console.warn("Add @babel/plugin-transform-react-jsx-source to get a more detailed component stack. Note that you should not add it to production builds of your App for bundle size reasons.")),n+"\n"},"")}var p$1="function"==typeof WeakMap;function d$1(n){return n?"function"==typeof n.type?d$1(n.__):n:{}}var h$1=d$2.prototype.setState;d$2.prototype.setState=function(n,e){return null==this.__v&&null==this.state&&console.warn('Calling "this.setState" inside the constructor of a component is a no-op and might be a bug in your application. Instead, set "this.state = {}" directly.\n\n'+f$1(s$1())),h$1.call(this,n,e)};var v$1=d$2.prototype.forceUpdate;function y$1(n){var e=n.props,t=a$1(n),o="";for(var r in e)if(e.hasOwnProperty(r)&&"children"!==r){var i=e[r];"function"==typeof i&&(i="function "+(i.displayName||i.name)+"() {}"),i=Object(i)!==i||i.toString?i+"":Object.prototype.toString.call(i),o+=" "+r+"="+JSON.stringify(i);}var c=e.children;return "<"+t+o+(c&&c.length?">..</"+t+">":" />")}d$2.prototype.forceUpdate=function(n){return null==this.__v?console.warn('Calling "this.forceUpdate" inside the constructor of a component is a no-op and might be a bug in your application.\n\n'+f$1(s$1())):null==this.__P&&console.warn('Can\'t call "this.forceUpdate" on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in the componentWillUnmount method.\n\n'+f$1(this.__v)),v$1.call(this,n)},function(){!function(){var n=l$2.__b,t=l$2.diffed,o=l$2.__,r=l$2.vnode,a=l$2.__r;l$2.diffed=function(n){l$1(n)&&c$1.pop(),i$1.pop(),t&&t(n);},l$2.__b=function(e){l$1(e)&&i$1.push(e),n&&n(e);},l$2.__=function(n,e){c$1=[],o&&o(n,e);},l$2.vnode=function(n){n.__o=c$1.length>0?c$1[c$1.length-1]:null,r&&r(n);},l$2.__r=function(n){l$1(n)&&c$1.push(n),a&&a(n);};}();var n=!1,t=l$2.__b,r=l$2.diffed,s=l$2.vnode,u=l$2.__e,h=l$2.__,v=l$2.__h,m=p$1?{useEffect:new WeakMap,useLayoutEffect:new WeakMap,lazyPropTypes:new WeakMap}:null,b=[];l$2.__e=function(n,e,t,o){if(e&&e.__c&&"function"==typeof n.then){var r=n;n=new Error("Missing Suspense. The throwing component was: "+a$1(e));for(var i=e;i;i=i.__)if(i.__c&&i.__c.__c){n=r;break}if(n instanceof Error)throw n}try{(o=o||{}).componentStack=f$1(e),u(n,e,t,o),"function"!=typeof n.then&&setTimeout(function(){throw n});}catch(n){throw n}},l$2.__=function(n,e){if(!e)throw new Error("Undefined parent passed to render(), this is the second argument.\nCheck if the element is available in the DOM/has the correct id.");var t;switch(e.nodeType){case 1:case 11:case 9:t=!0;break;default:t=!1;}if(!t){var o=a$1(n);throw new Error("Expected a valid HTML node as a second argument to render.\tReceived "+e+" instead: render(<"+o+" />, "+e+");")}h&&h(n,e);},l$2.__b=function(e){var r=e.type,i=d$1(e.__);if(n=!0,void 0===r)throw new Error("Undefined component passed to createElement()\n\nYou likely forgot to export your component or might have mixed up default and named imports"+y$1(e)+"\n\n"+f$1(e));if(null!=r&&"object"==typeof r){if(void 0!==r.__k&&void 0!==r.__e)throw new Error("Invalid type passed to createElement(): "+r+"\n\nDid you accidentally pass a JSX literal as JSX twice?\n\n  let My"+a$1(e)+" = "+y$1(r)+";\n  let vnode = <My"+a$1(e)+" />;\n\nThis usually happens when you export a JSX literal and not the component.\n\n"+f$1(e));throw new Error("Invalid type passed to createElement(): "+(Array.isArray(r)?"array":r))}if("thead"!==r&&"tfoot"!==r&&"tbody"!==r||"table"===i.type?"tr"===r&&"thead"!==i.type&&"tfoot"!==i.type&&"tbody"!==i.type&&"table"!==i.type?console.error("Improper nesting of table. Your <tr> should have a <thead/tbody/tfoot/table> parent."+y$1(e)+"\n\n"+f$1(e)):"td"===r&&"tr"!==i.type?console.error("Improper nesting of table. Your <td> should have a <tr> parent."+y$1(e)+"\n\n"+f$1(e)):"th"===r&&"tr"!==i.type&&console.error("Improper nesting of table. Your <th> should have a <tr>."+y$1(e)+"\n\n"+f$1(e)):console.error("Improper nesting of table. Your <thead/tbody/tfoot> should have a <table> parent."+y$1(e)+"\n\n"+f$1(e)),void 0!==e.ref&&"function"!=typeof e.ref&&"object"!=typeof e.ref&&!("$$typeof"in e))throw new Error('Component\'s "ref" property should be a function, or an object created by createRef(), but got ['+typeof e.ref+"] instead\n"+y$1(e)+"\n\n"+f$1(e));if("string"==typeof e.type)for(var c in e.props)if("o"===c[0]&&"n"===c[1]&&"function"!=typeof e.props[c]&&null!=e.props[c])throw new Error("Component's \""+c+'" property should be a function, but got ['+typeof e.props[c]+"] instead\n"+y$1(e)+"\n\n"+f$1(e));if("function"==typeof e.type&&e.type.propTypes){if("Lazy"===e.type.displayName&&m&&!m.lazyPropTypes.has(e.type)){var s="PropTypes are not supported on lazy(). Use propTypes on the wrapped component itself. ";try{var u=e.type();m.lazyPropTypes.set(e.type,!0),console.warn(s+"Component wrapped in lazy() is "+a$1(u));}catch(n){console.warn(s+"We will log the wrapped component's name once it is loaded.");}}var l=e.props;e.type.__f&&delete(l=function(n,e){for(var t in e)n[t]=e[t];return n}({},l)).ref,function(n,e,t,r,a){Object.keys(n).forEach(function(t){var i;try{i=n[t](e,t,r,"prop",null,"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");}catch(n){i=n;}i&&!(i.message in o$2)&&(o$2[i.message]=!0,console.error("Failed prop type: "+i.message+(a&&"\n"+a()||"")));});}(e.type.propTypes,l,0,a$1(e),function(){return f$1(e)});}t&&t(e);},l$2.__h=function(e,t,o){if(!e||!n)throw new Error("Hook can only be invoked from render methods.");v&&v(e,t,o);};var w=function(n,e){return {get:function(){var t="get"+n+e;b&&b.indexOf(t)<0&&(b.push(t),console.warn("getting vnode."+n+" is deprecated, "+e));},set:function(){var t="set"+n+e;b&&b.indexOf(t)<0&&(b.push(t),console.warn("setting vnode."+n+" is not allowed, "+e));}}},g={nodeName:w("nodeName","use vnode.type"),attributes:w("attributes","use vnode.props"),children:w("children","use vnode.props.children")},E=Object.create({},g);l$2.vnode=function(n){var e=n.props;if(null!==n.type&&null!=e&&("__source"in e||"__self"in e)){var t=n.props={};for(var o in e){var r=e[o];"__source"===o?n.__source=r:"__self"===o?n.__self=r:t[o]=r;}}n.__proto__=E,s&&s(n);},l$2.diffed=function(e){if(e.__k&&e.__k.forEach(function(n){if(n&&void 0===n.type){delete n.__,delete n.__b;var t=Object.keys(n).join(",");throw new Error("Objects are not valid as a child. Encountered an object with the keys {"+t+"}.\n\n"+f$1(e))}}),n=!1,r&&r(e),null!=e.__k)for(var t=[],o=0;o<e.__k.length;o++){var a=e.__k[o];if(a&&null!=a.key){var i=a.key;if(-1!==t.indexOf(i)){console.error('Following component has two or more children with the same key attribute: "'+i+'". This may cause glitches and misbehavior in rendering process. Component: \n\n'+y$1(e)+"\n\n"+f$1(e));break}t.push(i);}}};}();

	var classnames$1 = {exports: {}};

	/*!
		Copyright (c) 2018 Jed Watson.
		Licensed under the MIT License (MIT), see
		http://jedwatson.github.io/classnames
	*/

	(function (module) {
		/* global define */

		(function () {
			'use strict';

			var hasOwn = {}.hasOwnProperty;
			var nativeCodeString = '[native code]';

			function classNames() {
				var classes = [];

				for (var i = 0; i < arguments.length; i++) {
					var arg = arguments[i];
					if (!arg) continue;

					var argType = typeof arg;

					if (argType === 'string' || argType === 'number') {
						classes.push(arg);
					} else if (Array.isArray(arg)) {
						if (arg.length) {
							var inner = classNames.apply(null, arg);
							if (inner) {
								classes.push(inner);
							}
						}
					} else if (argType === 'object') {
						if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
							classes.push(arg.toString());
							continue;
						}

						for (var key in arg) {
							if (hasOwn.call(arg, key) && arg[key]) {
								classes.push(key);
							}
						}
					}
				}

				return classes.join(' ');
			}

			if ('object' !== 'undefined' && module.exports) {
				classNames.default = classNames;
				module.exports = classNames;
			} else if (typeof undefined === 'function' && typeof undefined.amd === 'object' && undefined.amd) {
				// register as 'classnames', consistent with npm package name
				undefined('classnames', [], function () {
					return classNames;
				});
			} else {
				window.classNames = classNames;
			}
		}());
	} (classnames$1));

	var classnames = classnames$1.exports;

	var t,r,u,i,o$1=0,f=[],c=[],e=l$2.__b,a=l$2.__r,v=l$2.diffed,l=l$2.__c,m=l$2.unmount;function d(t,u){l$2.__h&&l$2.__h(r,t,o$1||u),o$1=0;var i=r.__H||(r.__H={__:[],__h:[]});return t>=i.__.length&&i.__.push({__V:c}),i.__[t]}function p(n){return o$1=1,y(B,n)}function y(n,u,i){var o=d(t++,2);if(o.t=n,!o.__c&&(o.__=[i?i(u):B(void 0,u),function(n){var t=o.__N?o.__N[0]:o.__[0],r=o.t(t,n);t!==r&&(o.__N=[r,o.__[1]],o.__c.setState({}));}],o.__c=r,!r.u)){r.u=!0;var f=r.shouldComponentUpdate;r.shouldComponentUpdate=function(n,t,r){if(!o.__c.__H)return !0;var u=o.__c.__H.__.filter(function(n){return n.__c});if(u.every(function(n){return !n.__N}))return !f||f.call(this,n,t,r);var i=!1;return u.forEach(function(n){if(n.__N){var t=n.__[0];n.__=n.__N,n.__N=void 0,t!==n.__[0]&&(i=!0);}}),!(!i&&o.__c.props===n)&&(!f||f.call(this,n,t,r))};}return o.__N||o.__}function h(u,i){var o=d(t++,3);!l$2.__s&&z(o.__H,i)&&(o.__=u,o.i=i,r.__H.__h.push(o));}function s(u,i){var o=d(t++,4);!l$2.__s&&z(o.__H,i)&&(o.__=u,o.i=i,r.__h.push(o));}function _$1(n){return o$1=5,F(function(){return {current:n}},[])}function A(n,t,r){o$1=6,s(function(){return "function"==typeof n?(n(t()),function(){return n(null)}):n?(n.current=t(),function(){return n.current=null}):void 0},null==r?r:r.concat(n));}function F(n,r){var u=d(t++,7);return z(u.__H,r)?(u.__V=n(),u.i=r,u.__h=n,u.__V):u.__}function T(n,t){return o$1=8,F(function(){return n},t)}function q(n){var u=r.context[n.__c],i=d(t++,9);return i.c=n,u?(null==i.__&&(i.__=!0,u.sub(r)),u.props.value):n.__}function x(t,r){l$2.useDebugValue&&l$2.useDebugValue(r?r(t):t);}function P(n){var u=d(t++,10),i=p();return u.__=n,r.componentDidCatch||(r.componentDidCatch=function(n,t){u.__&&u.__(n,t),i[1](n);}),[i[0],function(){i[1](void 0);}]}function V(){var n=d(t++,11);if(!n.__){for(var u=r.__v;null!==u&&!u.__m&&null!==u.__;)u=u.__;var i=u.__m||(u.__m=[0,0]);n.__="P"+i[0]+"-"+i[1]++;}return n.__}function b(){for(var t;t=f.shift();)if(t.__P&&t.__H)try{t.__H.__h.forEach(k),t.__H.__h.forEach(w),t.__H.__h=[];}catch(r){t.__H.__h=[],l$2.__e(r,t.__v);}}l$2.__b=function(n){r=null,e&&e(n);},l$2.__r=function(n){a&&a(n),t=0;var i=(r=n.__c).__H;i&&(u===r?(i.__h=[],r.__h=[],i.__.forEach(function(n){n.__N&&(n.__=n.__N),n.__V=c,n.__N=n.i=void 0;})):(i.__h.forEach(k),i.__h.forEach(w),i.__h=[])),u=r;},l$2.diffed=function(t){v&&v(t);var o=t.__c;o&&o.__H&&(o.__H.__h.length&&(1!==f.push(o)&&i===l$2.requestAnimationFrame||((i=l$2.requestAnimationFrame)||j)(b)),o.__H.__.forEach(function(n){n.i&&(n.__H=n.i),n.__V!==c&&(n.__=n.__V),n.i=void 0,n.__V=c;})),u=r=null;},l$2.__c=function(t,r){r.some(function(t){try{t.__h.forEach(k),t.__h=t.__h.filter(function(n){return !n.__||w(n)});}catch(u){r.some(function(n){n.__h&&(n.__h=[]);}),r=[],l$2.__e(u,t.__v);}}),l&&l(t,r);},l$2.unmount=function(t){m&&m(t);var r,u=t.__c;u&&u.__H&&(u.__H.__.forEach(function(n){try{k(n);}catch(n){r=n;}}),u.__H=void 0,r&&l$2.__e(r,u.__v));};var g="function"==typeof requestAnimationFrame;function j(n){var t,r=function(){clearTimeout(u),g&&cancelAnimationFrame(t),setTimeout(n);},u=setTimeout(r,100);g&&(t=requestAnimationFrame(r));}function k(n){var t=r,u=n.__c;"function"==typeof u&&(n.__c=void 0,u()),r=t;}function w(n){var t=r;n.__c=n.__(),r=t;}function z(n,t){return !n||n.length!==t.length||t.some(function(t,r){return t!==n[r]})}function B(n,t){return "function"==typeof t?t(n):t}

	var _=0;function o(o,e,n,t,f){var l,s,u={};for(s in e)"ref"==s?l=e[s]:u[s]=e[s];var a={type:o,props:u,key:n,ref:l,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:--_,__source:f,__self:t};if("function"==typeof o&&(l=o.defaultProps))for(s in l)void 0===u[s]&&(u[s]=l[s]);return l$2.vnode&&l$2.vnode(a),a}

	var _jsxFileName$2x = "/home/runner/work/frontend-shared/frontend-shared/src/components/SvgIcon.js";
	const iconRegistry = new Map();
	/**
	 * @typedef SvgIconProps
	 * @prop {string|symbol} name - The name of the icon to display.
	 *   The name must match a name that has already been registered using the
	 *   `registerIcon` or `registerIcons` functions.
	 * @prop {string} [className] - A CSS class to apply to the `<svg>` element.
	 * @prop {boolean} [inline] - Apply a style allowing for inline display of icon wrapper.
	 * @prop {string} [title] - Optional title attribute to apply to the SVG's containing `span`.
	 */

	/**
	 * Component that renders icons using inline `<svg>` elements.
	 * This enables their appearance to be customized via CSS.
	 *
	 * This matches the way we do icons on the website, see
	 * https://github.com/hypothesis/h/pull/3675
	 *
	 * @param {SvgIconProps} props
	 */

	function SvgIcon({
	  name,
	  className = '',
	  inline = false,
	  title = ''
	}) {
	  const markup = iconRegistry.get(name);

	  if (!markup) {
	    throw new Error(`Icon "${name.toString()}" is not registered`);
	  }

	  const element =
	  /** @type {{ current: HTMLElement }} */
	  _$1();
	  s(() => {
	    const svg = element.current.querySelector('svg'); // The icon should always contain an `<svg>` element, but check here as we
	    // don't validate the markup when it is registered.

	    if (svg) {
	      svg.setAttribute('class', className);
	    }
	  }, [className, // `markup` is a dependency of this effect because the SVG is replaced if
	  // it changes.
	  markup]);
	  const spanProps = {};

	  if (title) {
	    spanProps.title = title;
	  }

	  return o("span", {
	    className: classnames('Hyp-SvgIcon', {
	      'Hyp-SvgIcon--inline': inline
	    }),
	    dangerouslySetInnerHTML: {
	      __html: markup
	    },
	    ref: element,
	    ...spanProps
	  }, void 0, false, {
	    fileName: _jsxFileName$2x,
	    lineNumber: 69,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * Register an icon for use with the `SvgIcon` component.
	 *
	 * Returns a symbol that can be passed as the `name` prop to `SvgIcon` in order
	 * to render this icon.
	 *
	 * @param {string|symbol} name - A name for this icon
	 * @param {string} markup - SVG markup for the icon
	 * @return {symbol}
	 */

	function registerIcon(name, markup) {
	  const key = typeof name === 'string' ? Symbol(name) : name;
	  iconRegistry.set(key, markup);
	  return key;
	}
	/**
	 * Register icons for use with the `SvgIcon` component.
	 *
	 * @deprecated Prefer the `registerIcon` function instead which will return a
	 * key that does not conflict with existing icons.
	 *
	 * @param {Record<string, string>} icons
	 * @param {Object} options
	 *  @param {boolean} [options.reset] - If `true`, remove existing registered icons.
	 */

	function registerIcons(icons, {
	  reset = false
	} = {}) {
	  if (reset) {
	    iconRegistry.clear();
	  }

	  for (let [key, value] of Object.entries(icons)) {
	    iconRegistry.set(key, value);
	  }
	}
	/**
	 * Return the currently available icons.
	 *
	 * To register icons, don't mutate this directly but call `registerIcons`
	 * instead.
	 *
	 * @return {IconMap}
	 */

	function availableIcons() {
	  return iconRegistry;
	}

	var _jsxFileName$2w = "/home/runner/work/frontend-shared/frontend-shared/src/components/buttons.js";

	function ButtonBase({
	  // Custom props.
	  buttonRef,
	  classes,
	  className,
	  icon,
	  iconPosition = 'left',
	  size = 'medium',
	  variant = 'normal',
	  expanded,
	  pressed,
	  // Standard <button> props.
	  type = 'button',
	  ...restProps
	}) {
	  var _restProps$role;

	  const role = (_restProps$role = restProps === null || restProps === void 0 ? void 0 : restProps.role) !== null && _restProps$role !== void 0 ? _restProps$role : 'button';
	  /** @type {Record<string, unknown>} */

	  const ariaProps = {
	    'aria-label': restProps.title
	  }; // aria-pressed and aria-expanded are not allowed for buttons with
	  // an aria role of `tab`. Instead, the aria-selected attribute is expected.

	  if (role === 'tab') {
	    ariaProps['aria-selected'] = pressed;
	  } else {
	    ariaProps['aria-pressed'] = pressed;
	    ariaProps['aria-expanded'] = expanded;
	  }

	  return o("button", {
	    ref: buttonRef,
	    className: classnames(className, `${className}--${size}`, `${className}--${variant}`, {
	      [`${className}--icon-${iconPosition}`]: icon
	    }, classes),
	    type: type,
	    ...ariaProps,
	    ...restProps
	  }, void 0, false, {
	    fileName: _jsxFileName$2w,
	    lineNumber: 84,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * An icon-only button
	 *
	 * @deprecated - Use re-implemented component in the input group
	 * @param {IconButtonProps} props
	 */


	function IconButton({
	  className = 'Hyp-IconButton',
	  ...restProps
	}) {
	  const {
	    icon
	  } = restProps;
	  return o(ButtonBase, {
	    className: className,
	    ...restProps,
	    children: o(SvgIcon, {
	      name: icon
	    }, void 0, false, {
	      fileName: _jsxFileName$2w,
	      lineNumber: 112,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2w,
	    lineNumber: 111,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * A labeled button, with or without an icon
	 *
	 * @deprecated - Use re-implemented component in the input group
	 * @param {ButtonBaseProps} props
	 */

	function LabeledButton({
	  children,
	  className = 'Hyp-LabeledButton',
	  ...restProps
	}) {
	  const {
	    icon,
	    iconPosition = 'left'
	  } = restProps;
	  return o(ButtonBase, {
	    className: className,
	    ...restProps,
	    children: [icon && iconPosition === 'left' && o(SvgIcon, {
	      name: icon
	    }, void 0, false, {
	      fileName: _jsxFileName$2w,
	      lineNumber: 131,
	      columnNumber: 43
	    }, this), children, icon && iconPosition === 'right' && o(SvgIcon, {
	      name: icon
	    }, void 0, false, {
	      fileName: _jsxFileName$2w,
	      lineNumber: 133,
	      columnNumber: 44
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$2w,
	    lineNumber: 130,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * A button styled to appear as an HTML link (<a>)
	 *
	 * @deprecated - Use re-implemented component in the navigation group
	 * @param {ButtonBaseProps} props
	 */

	function LinkButton(props) {
	  return o(ButtonBase, {
	    className: "Hyp-LinkButton",
	    ...props
	  }, void 0, false, {
	    fileName: _jsxFileName$2w,
	    lineNumber: 145,
	    columnNumber: 10
	  }, this);
	}

	var checkboxSVG = "  <svg\n    width=\"16\"\n    height=\"16\"\n    viewBox=\"-4 -4 39 39\"\n    aria-hidden=\"true\"\n    focusable=\"false\"\n  >\n    <rect\n      class=\"hyp-svg-checkbox--background\"\n      width=\"35\"\n      height=\"35\"\n      x=\"-2\"\n      y=\"-2\"\n      stroke=\"currentColor\"\n      fill=\"none\"\n      stroke-width=\"3\"\n      rx=\"5\"\n      ry=\"5\"\n    />\n    <polyline\n      class=\"hyp-svg-checkbox--checkmark\"\n      points=\"4,14 12,23 28,5\"\n      stroke=\"transparent\"\n      stroke-width=\"5\"\n      fill=\"none\"\n    />\n</svg>";

	var _jsxFileName$2v = "/home/runner/work/frontend-shared/frontend-shared/src/components/Checkbox.js";
	const checkboxIcon = registerIcon('checkbox', checkboxSVG);
	/**
	 * @typedef CheckboxBaseProps
	 * @prop {string} [classes] - Additional CSS classes to apply to the <input>
	 * @prop {string} name - The `name` of the checkbox.
	 * @prop {import('preact').Ref<HTMLInputElement>} [inputRef] - Access to the input
	 *    element in case a parent element wants for example to focus on it.
	 * @prop {(checked: boolean) => void} [onToggle] - Callback when checkbox is
	 *   checked/unchecked
	 * @prop {never} [type] - Type is always 'checkbox'
	 * @prop {never} [children] - Children are not allowed
	 *
	 * The props for Checkbox component extends and narrows the attributes of the native input element.
	 * `onToggle` event should only be associated to HTMLDetailsElement, but Preact is not very strict with types.
	 * We omit the `onToggle` because it clashes with our definition.
	 * @typedef {Omit<import('preact').JSX.HTMLAttributes<HTMLInputElement>, 'onToggle'> & CheckboxBaseProps} CheckboxProps
	 */

	/**
	 * @typedef LabeledCheckboxBaseProps
	 * @prop {import('preact').ComponentChildren} children - Label text or elements
	 * @prop {string} [containerClasses] - Optional additional classes for the container
	 *   <label> element
	 *
	 * @typedef {Omit<CheckboxProps, 'children'> & LabeledCheckboxBaseProps} LabeledCheckboxProps
	 */

	/**
	 * A checkbox input.
	 *
	 * A checkbox component is a combination of an <input> element and a sibling
	 * <svg> element that is used for the visual appearance of the checkbox.
	 *
	 * @deprecated - Use re-implemented Checkbox component in the input group
	 * @param {CheckboxProps} props
	 */

	function Checkbox({
	  classes = '',
	  inputRef,
	  onToggle,
	  onClick,
	  ...restProps
	}) {
	  /**
	   * @param {import('preact').JSX.TargetedMouseEvent<HTMLInputElement>} event
	   * @this HTMLInputElement
	   */
	  function onPressed(event) {
	    onToggle === null || onToggle === void 0 ? void 0 : onToggle(event.currentTarget.checked); // preact event handlers expects `this` context to be of type `never`
	    // https://github.com/preactjs/preact/issues/3137

	    onClick === null || onClick === void 0 ? void 0 : onClick.call(
	    /** @type {never} */
	    this, event);
	  }

	  return o(p$2, {
	    children: [o("input", {
	      className: classnames('Hyp-Checkbox', classes),
	      ref: inputRef,
	      type: "checkbox",
	      onClick: onPressed,
	      ...restProps
	    }, void 0, false, {
	      fileName: _jsxFileName$2v,
	      lineNumber: 65,
	      columnNumber: 7
	    }, this), o(SvgIcon, {
	      className: "hyp-svg-checkbox",
	      name: checkboxIcon
	    }, void 0, false, {
	      fileName: _jsxFileName$2v,
	      lineNumber: 72,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true);
	}
	/**
	 * @deprecated - Use re-implemented Checkbox component in the input group
	 * A labeled checkbox input
	 *
	 * @param {LabeledCheckboxProps} props
	 */

	function LabeledCheckbox({
	  children,
	  id,
	  containerClasses = '',
	  ...restProps
	}) {
	  var _id;

	  (_id = id) !== null && _id !== void 0 ? _id : id = restProps.name;
	  return o("label", {
	    htmlFor: id,
	    className: classnames('Hyp-LabeledCheckbox', containerClasses),
	    children: [o(Checkbox, {
	      id: id,
	      ...restProps
	    }, void 0, false, {
	      fileName: _jsxFileName$2v,
	      lineNumber: 95,
	      columnNumber: 7
	    }, this), o("span", {
	      "data-testid": "label-text",
	      children: children
	    }, void 0, false, {
	      fileName: _jsxFileName$2v,
	      lineNumber: 96,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$2v,
	    lineNumber: 91,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * @template T
	 * @typedef {import('preact').Ref<T>} Ref
	 */

	/**
	 * Helper for downcasting a ref to a more specific type, where that is safe
	 * to do.
	 *
	 * This is mainly useful to cast a generic `Ref<HTMLElement>` to a more specific
	 * element type (eg. `Ref<HTMLDivElement>`) for use with the `ref` prop of a JSX element.
	 * Since Preact only writes to the `ref` prop, such a cast is safe.
	 *
	 * @template T
	 * @template {T} U
	 * @param {Ref<T>|undefined} ref
	 * @return {Ref<U>|undefined}
	 */
	function downcastRef$1(ref) {
	  return (
	    /** @type {Ref<U>|undefined} */
	    ref
	  );
	}

	var _jsxFileName$2u = "/home/runner/work/frontend-shared/frontend-shared/src/components/containers.js";
	function Frame({
	  children,
	  classes,
	  containerRef,
	  elementRef,
	  ...restProps
	}) {
	  return o("div", {
	    className: classnames('Hyp-Frame', classes),
	    ...restProps,
	    ref: downcastRef$1(elementRef !== null && elementRef !== void 0 ? elementRef : containerRef),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$2u,
	    lineNumber: 41,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * Render content inside of a "card"
	 *
	 * @deprecated - Use re-implemented Card component in the layout group
	 * @param {PresentationalProps} props
	 */

	function Card({
	  children,
	  classes,
	  containerRef,
	  elementRef,
	  ...restProps
	}) {
	  return o("div", {
	    className: classnames('Hyp-Card', classes),
	    ...restProps,
	    ref: downcastRef$1(elementRef !== null && elementRef !== void 0 ? elementRef : containerRef),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$2u,
	    lineNumber: 65,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * Render a set of actions (typically buttons) laid out either horizontally
	 * by default or vertically.
	 *
	 * @deprecated - Use CardActions component in the layout group
	 * @param {{ direction?: 'row'|'column'} & PresentationalProps} props
	 */

	function Actions({
	  children,
	  direction = 'row',
	  classes,
	  containerRef,
	  elementRef,
	  ...restProps
	}) {
	  const baseClass = `Hyp-Actions--${direction}`;
	  return o("div", {
	    className: classnames(baseClass, classes),
	    ...restProps,
	    ref: downcastRef$1(elementRef !== null && elementRef !== void 0 ? elementRef : containerRef),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$2u,
	    lineNumber: 92,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * Render a scrollable container to contain content that might overflow.
	 * Optionally provide styling affordances for a sticky header (`withHeader`).
	 *
	 * @deprecated - Use re-implemented ScrollBox component in the data-display group
	 * @param {{withHeader?: boolean} & PresentationalProps} props
	 */

	function Scrollbox({
	  children,
	  classes,
	  containerRef,
	  elementRef,
	  withHeader = false,
	  ...restProps
	}) {
	  const baseClass = withHeader ? 'Hyp-Scrollbox--with-header' : 'Hyp-Scrollbox';
	  return o("div", {
	    className: classnames(baseClass, classes),
	    ...restProps,
	    ref: downcastRef$1(elementRef !== null && elementRef !== void 0 ? elementRef : containerRef),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$2u,
	    lineNumber: 119,
	    columnNumber: 5
	  }, this);
	}

	var cancel = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 8l3.536-3.536L8 8 4.464 4.464 8 8zm0 0l-3.536 3.536L8 8l3.536 3.536L8 8z\"></path></g></svg>\n";

	var _jsxFileName$2t = "/home/runner/work/frontend-shared/frontend-shared/src/components/Dialog.js";
	const cancelIcon$1 = registerIcon('cancel', cancel);
	let idCounter = 0;
	/**
	 * Return an element ID beginning with `prefix` that is unique per component instance.
	 *
	 * This avoids different instances of a component re-using the same ID.
	 *
	 * @param {string} prefix
	 */

	function useUniqueId(prefix) {
	  const [id] = p(() => {
	    ++idCounter;
	    return `${prefix}-${idCounter}`;
	  });
	  return id;
	}
	/**
	 * @typedef {import('preact').ComponentChildren} Children
	 *
	 * @typedef DialogProps
	 * @prop {Children} [buttons] -
	 *   Additional `Button` elements to display at the bottom of the dialog.
	 *   A "Cancel" button is added automatically if the `onCancel` prop is set.
	 * @prop {string} [cancelLabel] - Label for the cancel button
	 * @prop {Children} children
	 * @prop {string} [contentClass] - CSS class to apply to the dialog's content
	 * @prop {string|symbol} [icon] - Name of optional icon to render in header
	 * @prop {import("preact/hooks").Ref<HTMLElement>|null} [initialFocus] -
	 *   Child element to focus when the dialog is rendered. If not provided,
	 *   the Dialog's container will be automatically focused on opening. Set to
	 *   `null` to opt out of automatic focus control.
	 * @prop {() => void} [onCancel] -
	 *   A callback to invoke when the user cancels the dialog. If provided, a
	 *   "Cancel" button will be displayed.
	 * @prop {'dialog'|'alertdialog'} [role] - The aria role for the dialog (defaults to" dialog")
	 * @prop {string} title
	 * @prop {boolean} [withCancelButton=true] - If `onCancel` is provided, render
	 *   a Cancel button as one of the Dialog's buttons (along with any other
	 *   `buttons`)
	 * @prop {boolean} [withCloseButton=true] - If `onCancel` is provided, render
	 *   a close button (X icon) in the Dialog's header
	 */

	/**
	 * HTML control that can be disabled.
	 *
	 * @typedef {HTMLElement & { disabled: boolean }} InputElement
	 */

	/**
	 * Render a "panel"-like interface with a title and optional icon and/or
	 * close button. Grabs focus on initial render, defaulting to the entire
	 * Dialog container element, or `initialFocus` HTMLElement if provided.
	 *
	 * @param {DialogProps} props
	 */


	function Dialog({
	  buttons,
	  cancelLabel = 'Cancel',
	  children,
	  contentClass,
	  icon,
	  initialFocus,
	  onCancel,
	  role = 'dialog',
	  title,
	  withCancelButton = true,
	  withCloseButton = true
	}) {
	  const dialogDescriptionId = useUniqueId('dialog-description');
	  const dialogTitleId = useUniqueId('dialog-title');
	  const rootEl =
	  /** @type {{ current: HTMLDivElement }} */
	  _$1();
	  h(() => {
	    // Setting `initialFocus` to `null` opts out of focus handling
	    if (initialFocus !== null) {
	      const focusEl =
	      /** @type {InputElement|null} */
	      initialFocus === null || initialFocus === void 0 ? void 0 : initialFocus.current;

	      if (focusEl && !focusEl.disabled) {
	        focusEl.focus();
	      } else {
	        // The `initialFocus` prop has not been set, so use automatic focus handling.
	        // Modern accessibility guidance is to focus the dialog itself rather than
	        // trying to be smart about focusing a particular control within the
	        // dialog.
	        rootEl.current.focus();
	      }
	    } // We only want to run this effect once when the dialog is mounted.
	    //
	    // eslint-disable-next-line react-hooks/exhaustive-deps

	  }, []); // Try to assign the dialog an accessible description, using the content of
	  // the first paragraph of text in it.
	  //
	  // A limitation of this approach is that it doesn't update if the dialog's
	  // content changes after the initial render.

	  s(() => {
	    const description = rootEl.current.querySelector('p');

	    if (description) {
	      description.id = dialogDescriptionId;
	      rootEl.current.setAttribute('aria-describedby', dialogDescriptionId);
	    }
	  }, [dialogDescriptionId]);
	  const hasCancelButton = onCancel && withCancelButton;
	  const hasCloseButton = onCancel && withCloseButton;
	  const hasButtons = buttons || hasCancelButton;
	  return o("div", {
	    "aria-labelledby": dialogTitleId,
	    className: classnames('Hyp-Dialog', {
	      'Hyp-Dialog--closeable': hasCloseButton
	    }, contentClass),
	    ref: rootEl,
	    role: role,
	    tabIndex: -1,
	    children: [o("header", {
	      className: "Hyp-Dialog__header",
	      children: [icon && o("div", {
	        className: "Hyp-Dialog__header-icon",
	        children: o(SvgIcon, {
	          name: icon,
	          title: title,
	          "data-testid": "header-icon"
	        }, void 0, false, {
	          fileName: _jsxFileName$2t,
	          lineNumber: 139,
	          columnNumber: 13
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$2t,
	        lineNumber: 138,
	        columnNumber: 11
	      }, this), o("h2", {
	        className: "Hyp-Dialog__title",
	        id: dialogTitleId,
	        children: title
	      }, void 0, false, {
	        fileName: _jsxFileName$2t,
	        lineNumber: 142,
	        columnNumber: 9
	      }, this), onCancel && withCloseButton && o("div", {
	        className: "Hyp-Dialog__close",
	        children: o(IconButton, {
	          "data-testid": "close-button",
	          icon: cancelIcon$1,
	          title: "Close",
	          onClick: onCancel
	        }, void 0, false, {
	          fileName: _jsxFileName$2t,
	          lineNumber: 147,
	          columnNumber: 13
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$2t,
	        lineNumber: 146,
	        columnNumber: 11
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2t,
	      lineNumber: 136,
	      columnNumber: 7
	    }, this), children, hasButtons && o("div", {
	      className: "Hyp-Dialog__actions",
	      children: [hasCancelButton && o(LabeledButton, {
	        "data-testid": "cancel-button",
	        onClick: onCancel,
	        children: cancelLabel
	      }, void 0, false, {
	        fileName: _jsxFileName$2t,
	        lineNumber: 160,
	        columnNumber: 13
	      }, this), buttons]
	    }, void 0, true, {
	      fileName: _jsxFileName$2t,
	      lineNumber: 158,
	      columnNumber: 9
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$2t,
	    lineNumber: 125,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2s = "/home/runner/work/frontend-shared/frontend-shared/src/components/Icon.js";
	function Icon({
	  name,
	  classes = '',
	  containerClasses = '',
	  title = ''
	}) {
	  const registeredIcons = availableIcons();
	  const markup = registeredIcons.get(name);

	  if (!markup) {
	    throw new Error(`Icon "${name.toString()}" is not registered`);
	  }

	  const element =
	  /** @type {{ current: HTMLElement }} */
	  _$1();
	  s(() => {
	    const svg = element.current.querySelector('svg'); // The icon should always contain an `<svg>` element, but check here as we
	    // don't validate the markup when it is registered.

	    if (svg) {
	      svg.setAttribute('class', classnames('Hyp-Icon', classes));
	    }
	  }, [classes, // `markup` is a dependency of this effect because the SVG is replaced if
	  // it changes.
	  markup]);
	  const spanProps = {};

	  if (title) {
	    spanProps.title = title;
	  }

	  return o("span", {
	    className: containerClasses,
	    dangerouslySetInnerHTML: {
	      __html: markup
	    },
	    ref: element,
	    ...spanProps
	  }, void 0, false, {
	    fileName: _jsxFileName$2s,
	    lineNumber: 62,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2r = "/home/runner/work/frontend-shared/frontend-shared/src/components/Link.js";
	function Link({
	  children,
	  classes = '',
	  linkRef,
	  ...restProps
	}) {
	  return o("a", {
	    className: classnames('Hyp-Link', classes),
	    ref: linkRef,
	    rel: "noopener noreferrer",
	    ...restProps,
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$2r,
	    lineNumber: 26,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * Attach listeners for one or multiple events to an element and return a
	 * function that removes the listeners.
	 *
	 * @param {HTMLElement} element
	 * @param {string[]} events
	 * @param {EventListener} listener
	 * @param {object} options
	 *   @param {boolean} [options.useCapture]
	 * @return {() => void} Function which removes the event listeners.
	 */

	function listen(element, events, listener, {
	  useCapture = false
	} = {}) {
	  events.forEach(event => element.addEventListener(event, listener, useCapture));
	  return () => {
	    events.forEach(event => element.removeEventListener(event, listener, useCapture));
	  };
	}
	/**
	 * @template T
	 * @typedef {import("preact/hooks").Ref<T>} Ref
	 */

	/**
	 * This hook provides a way to close or hide an element when a user interacts
	 * with elements outside of it or presses the Esc key. It can be used to
	 * create non-modal popups (eg. for menus, autocomplete lists and non-modal dialogs)
	 * that automatically close when appropriate.
	 *
	 * When the element is visible/open, this hook monitors for document interactions
	 * that should close it - such as clicks outside the element or Esc key presses.
	 * When such an interaction happens, the `handleClose` callback is invoked.
	 *
	 * @param {Ref<HTMLElement>} closeableEl - Outer DOM element for the popup
	 * @param {boolean} isOpen - Whether the popup is currently visible/open
	 * @param {() => void} handleClose - Callback invoked to close the popup
	 */


	function useElementShouldClose(closeableEl, isOpen, handleClose) {
	  h(() => {
	    if (!isOpen) {
	      return () => {};
	    } // Close element when user presses Escape key, regardless of focus.


	    const removeKeyDownListener = listen(document.body, ['keydown'], event => {
	      const keyEvent =
	      /** @type {KeyboardEvent} */
	      event;

	      if (keyEvent.key === 'Escape') {
	        handleClose();
	      }
	    }); // Close element if user focuses an element outside of it via any means
	    // (key press, programmatic focus change).

	    const removeFocusListener = listen(document.body, ['focus'], event => {
	      if (closeableEl.current && !closeableEl.current.contains(
	      /** @type {Node} */
	      event.target)) {
	        handleClose();
	      }
	    }, {
	      useCapture: true
	    }); // Close element if user clicks outside of it, even if on an element which
	    // does not accept focus.

	    const removeClickListener = listen(document.body, ['mousedown', 'click'], event => {
	      if (closeableEl.current && !closeableEl.current.contains(
	      /** @type {Node} */
	      event.target)) {
	        handleClose();
	      }
	    }, {
	      useCapture: true
	    });
	    return () => {
	      removeKeyDownListener();
	      removeClickListener();
	      removeFocusListener();
	    };
	  }, [closeableEl, isOpen, handleClose]);
	}

	var _jsxFileName$2q = "/home/runner/work/frontend-shared/frontend-shared/src/components/Modal.js";
	function Modal({
	  children,
	  onCancel,
	  ...restProps
	}) {
	  const modalContainerRef =
	  /** @type {{ current: HTMLDivElement }} */
	  _$1();
	  useElementShouldClose(modalContainerRef, true
	  /* isOpen */
	  , () => {
	    if (onCancel) {
	      onCancel();
	    }
	  });
	  return o(p$2, {
	    children: [o("div", {
	      className: "Hyp-Modal__overlay"
	    }, void 0, false, {
	      fileName: _jsxFileName$2q,
	      lineNumber: 39,
	      columnNumber: 7
	    }, this), o("div", {
	      className: "Hyp-Modal",
	      ref: modalContainerRef,
	      children: o(Dialog, {
	        onCancel: onCancel,
	        ...restProps,
	        children: children
	      }, void 0, false, {
	        fileName: _jsxFileName$2q,
	        lineNumber: 41,
	        columnNumber: 9
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$2q,
	      lineNumber: 40,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true);
	}
	/**
	 * @typedef ConfirmModalBaseProps
	 * @prop {string} message - Main text of the modal message
	 * @prop {string} confirmAction - Label for the "Confirm" button
	 * @prop {() => void} onConfirm - Callback invoked if the user clicks the "Confirm" button
	 * @prop {() => void} onCancel - Callback invoked if the user cancels
	 *
	 * @typedef {Omit<ModalProps, 'buttons' | 'children'> & ConfirmModalBaseProps} ConfirmModalProps
	 */

	/**
	 * A modal that emulates a `window.confirm` interface:
	 * request a boolean yes/no confirmation from the user.
	 *
	 * @param {ConfirmModalProps} props
	 */

	function ConfirmModal({
	  message,
	  confirmAction,
	  onConfirm,
	  onCancel,
	  ...restProps
	}) {
	  return o(Modal, {
	    onCancel: onCancel,
	    buttons: [o(LabeledButton, {
	      onClick: onConfirm,
	      variant: "primary",
	      "data-testid": "confirm-button",
	      children: confirmAction
	    }, "ok", false, {
	      fileName: _jsxFileName$2q,
	      lineNumber: 76,
	      columnNumber: 9
	    }, this)],
	    ...restProps,
	    children: o("p", {
	      children: message
	    }, void 0, false, {
	      fileName: _jsxFileName$2q,
	      lineNumber: 87,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2q,
	    lineNumber: 73,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2p = "/home/runner/work/frontend-shared/frontend-shared/src/components/Panel.js";
	const cancelIcon = registerIcon('cancel', cancel);
	/**
	 * @typedef PanelProps
	 * @prop {import("preact").ComponentChildren} children
	 * @prop {string} [icon] - Name of optional icon to render in header
	 * @prop {() => void} [onClose] - handler for closing the panel; if provided,
	 *   will render a close button that invokes this onClick
	 * @prop {string} title
	 */

	/**
	 * Render a "panel"-like interface with a title and optional icon and/or
	 * close button.
	 *
	 * @deprecated - Use re-implemented Panel component in the layout group
	 * @param {PanelProps} props
	 */

	function Panel({
	  children,
	  icon,
	  onClose,
	  title
	}) {
	  const withCloseButton = !!onClose;
	  return o("div", {
	    className: classnames('Hyp-Panel', {
	      'Hyp-Panel--closeable': withCloseButton
	    }),
	    children: [o("header", {
	      className: "Hyp-Panel__header",
	      children: [icon && o("div", {
	        className: "Hyp-Panel__header-icon",
	        children: o(SvgIcon, {
	          name: icon,
	          title: title
	        }, void 0, false, {
	          fileName: _jsxFileName$2p,
	          lineNumber: 38,
	          columnNumber: 13
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$2p,
	        lineNumber: 37,
	        columnNumber: 11
	      }, this), o("h2", {
	        className: "Hyp-Panel__title",
	        children: title
	      }, void 0, false, {
	        fileName: _jsxFileName$2p,
	        lineNumber: 41,
	        columnNumber: 9
	      }, this), withCloseButton && o("div", {
	        className: "Hyp-Panel__close",
	        children: o(IconButton, {
	          icon: cancelIcon,
	          title: "Close",
	          onClick: onClose
	        }, void 0, false, {
	          fileName: _jsxFileName$2p,
	          lineNumber: 44,
	          columnNumber: 13
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$2p,
	        lineNumber: 43,
	        columnNumber: 11
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2p,
	      lineNumber: 35,
	      columnNumber: 7
	    }, this), o("div", {
	      className: "Hyp-Panel__content",
	      children: children
	    }, void 0, false, {
	      fileName: _jsxFileName$2p,
	      lineNumber: 48,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$2p,
	    lineNumber: 30,
	    columnNumber: 5
	  }, this);
	}

	var spinnerSVG = "<svg viewBox=\"0 0 64 64\" width=\"16\" height=\"16\">\n  <g stroke-width=\"6\" stroke=\"currentColor\" stroke-linecap=\"round\">\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(180)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\"0;1;.8;.65;.45;.3;.15;0\" repeatCount=\"indefinite\"></animate>\n    </line>\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(225)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\".15;0;1;.8;.65;.45;.3;.15\" repeatCount=\"indefinite\"></animate>\n    </line>\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(270)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\".3;.15;0;1;.8;.65;.45;.3\" repeatCount=\"indefinite\"></animate>\n    </line>\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(315)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\".45;.3;.15;0;1;.85;.65;.45\" repeatCount=\"indefinite\"></animate>\n    </line>\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(0)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\".65;.45;.3;.15;0;1;.8;.65;\" repeatCount=\"indefinite\"></animate>\n    </line>\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(45)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\".8;.65;.45;.3;.15;0;1;.8\" repeatCount=\"indefinite\"></animate>\n    </line>\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(90)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\"1;.85;.6;.45;.3;.15;0;1;\" repeatCount=\"indefinite\"></animate>\n    </line>\n    <line y1=\"16\" y2=\"28\" transform=\"translate(32,32) rotate(135)\">\n      <animate attributeName=\"stroke-opacity\" dur=\"750ms\" values=\"0;1;.8;.65;.45;.3;.15;0\" repeatCount=\"indefinite\"></animate>\n    </line>\n  </g>\n</svg>";

	var _jsxFileName$2o = "/home/runner/work/frontend-shared/frontend-shared/src/components/Spinner.js";
	const spinnerIcon = registerIcon('spinner', spinnerSVG);
	/**
	 * @typedef SpinnerProps
	 * @prop {string} [classes] - Additional CSS classes to apply
	 * @prop {'small'|'medium'|'large'} [size='medium'] - Relative size of spinner
	 *   to surrounding content
	 */

	/**
	 * @typedef FullScreenSpinnerProps
	 * @prop {string} [classes] - Additional CSS classes to apply
	 * @prop {string} [containerClasses] - CSS classes to apply to wrapping element.
	 */

	/**
	 * Loading indicator.
	 *
	 * @deprecated - Use re-implemented component in the feedback group
	 * @param {SpinnerProps} props
	 */

	function Spinner({
	  classes = '',
	  size = 'medium'
	}) {
	  const baseClass = `Hyp-Spinner--${size}`;
	  return o(Icon, {
	    name: spinnerIcon,
	    containerClasses: classnames(baseClass, classes)
	  }, void 0, false, {
	    fileName: _jsxFileName$2o,
	    lineNumber: 33,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * Full-screen loading indicator.
	 *
	 * @param {FullScreenSpinnerProps} props
	 */

	function FullScreenSpinner({
	  classes = '',
	  containerClasses = ''
	}) {
	  return o("div", {
	    className: classnames('Hyp-FullScreenSpinner', containerClasses),
	    children: o(Spinner, {
	      classes: classnames('Hyp-FullScreenSpinner__spinner', classes),
	      size: "large"
	    }, void 0, false, {
	      fileName: _jsxFileName$2o,
	      lineNumber: 48,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2o,
	    lineNumber: 47,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2n = "/home/runner/work/frontend-shared/frontend-shared/src/components/Table.js";

	function nextItem(items, currentItem, step) {
	  const index = currentItem ? items.indexOf(currentItem) : -1;
	  const delta = index + step;

	  if (index < 0) {
	    return items[0];
	  }

	  if (delta < 0) {
	    return items[0];
	  }

	  if (delta >= items.length) {
	    return items[items.length - 1];
	  }

	  return items[delta];
	}
	/**
	 * An interactive table of items with a sticky header.
	 *
	 * @template Item
	 * @param {TableProps<Item>} props
	 * @deprecated - Use re-implemented DataTable component in the data group
	 */


	function Table({
	  accessibleLabel,
	  classes,
	  containerClasses,
	  emptyItemsMessage,
	  isLoading = false,
	  items,
	  onSelectItem,
	  onUseItem,
	  renderItem,
	  selectedItem,
	  tableHeaders
	}) {
	  const rowRefs = _$1(
	  /** @type {(HTMLElement|null)[]} */
	  []);
	  const scrollboxRef =
	  /** @type {{ current: HTMLElement }} */
	  _$1();
	  const headerRef =
	  /** @type {{ current: HTMLTableSectionElement }} */
	  _$1();
	  /** @param {Item} item */

	  const onKeyboardSelect = item => {
	    const rowEl = rowRefs.current[items.indexOf(item)];

	    if (rowEl) {
	      rowEl.focus();
	    }

	    onSelectItem(item);
	  };
	  /** @param {KeyboardEvent} event */


	  const onKeyDown = event => {
	    let handled = false;

	    switch (event.key) {
	      case 'Enter':
	        handled = true;

	        if (selectedItem) {
	          onUseItem(selectedItem);
	        }

	        break;

	      case 'ArrowUp':
	        handled = true;
	        onKeyboardSelect(nextItem(items, selectedItem, -1));
	        break;

	      case 'ArrowDown':
	        handled = true;
	        onKeyboardSelect(nextItem(items, selectedItem, 1));
	        break;

	      default:
	        handled = false;
	        break;
	    }

	    if (handled) {
	      event.preventDefault();
	      event.stopPropagation();
	    }
	  }; // When the selectedItem changes, assure that the table row associated with it
	  // is fully visible and not obscured by the sticky table header. This could
	  // happen if the table is partially scrolled. Scroll the Scrollbox as needed
	  // to make the item row fully visible below the header.


	  h(() => {
	    if (!selectedItem) {
	      return;
	    }

	    const rowEl = rowRefs.current[items.indexOf(selectedItem)];
	    const headingEl = headerRef.current;
	    const scrollboxEl = scrollboxRef.current;

	    if (rowEl) {
	      const headingHeight = headingEl.offsetHeight; // The top of the selected row, relative to the top of the Scrollbox frame

	      const rowOffsetFromScrollbox = rowEl.offsetTop - scrollboxEl.scrollTop;

	      if (rowOffsetFromScrollbox >= scrollboxEl.clientHeight) {
	        // The `selectedItem` is in a table row that is not visible because it
	        // is below the visible content in the `scrollbox`. This is most likely
	        // to occur if a `Table` is rendered with an initial `selectedItem` that
	        // is towards the bottom of the table (later in the `items` array).
	        // Scroll it into view.
	        rowEl.scrollIntoView();
	      } // If the offset position is smaller than the height of the header,
	      // the row is partially or fully obscured by the header. Scroll just
	      // enough to make the full row visible beneath the header.


	      if (rowOffsetFromScrollbox <= headingHeight) {
	        scrollboxEl.scrollBy(0, rowOffsetFromScrollbox - headingHeight);
	      }
	    }
	  }, [items, selectedItem]);
	  return o(Scrollbox, {
	    withHeader: true,
	    classes: classnames('Hyp-Table-Scrollbox', containerClasses),
	    elementRef: scrollboxRef,
	    children: [o("table", {
	      "aria-label": accessibleLabel,
	      className: classnames('Hyp-Table', classes),
	      tabIndex: 0,
	      role: "grid",
	      onKeyDown: onKeyDown,
	      children: [o("thead", {
	        ref: headerRef,
	        children: o("tr", {
	          children: tableHeaders.map(({
	            classes,
	            label
	          }, index) => o("th", {
	            className: classnames('Hyp-Table__header', classes),
	            scope: "col",
	            children: label
	          }, `${label}-${index}`, false, {
	            fileName: _jsxFileName$2n,
	            lineNumber: 181,
	            columnNumber: 15
	          }, this))
	        }, void 0, false, {
	          fileName: _jsxFileName$2n,
	          lineNumber: 179,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$2n,
	        lineNumber: 178,
	        columnNumber: 9
	      }, this), o("tbody", {
	        children: !isLoading && items.map((item, index) => o("tr", {
	          "aria-selected": selectedItem === item,
	          className: classnames({
	            'is-selected': selectedItem === item
	          }),
	          onMouseDown: () => onSelectItem(item),
	          onClick: () => onSelectItem(item)
	          /* preact-React incompatibility `onDblClick` */

	          /* eslint-disable-next-line react/no-unknown-property */
	          ,
	          onDblClick: () => onUseItem(item),
	          ref: node => rowRefs.current[index] = node,
	          tabIndex: -1,
	          children: renderItem(item, selectedItem === item)
	        }, index, false, {
	          fileName: _jsxFileName$2n,
	          lineNumber: 194,
	          columnNumber: 15
	        }, this))
	      }, void 0, false, {
	        fileName: _jsxFileName$2n,
	        lineNumber: 191,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2n,
	      lineNumber: 171,
	      columnNumber: 7
	    }, this), isLoading && o("div", {
	      className: "Hyp-Table-Scrollbox__loading",
	      children: o(Spinner, {
	        size: "large"
	      }, void 0, false, {
	        fileName: _jsxFileName$2n,
	        lineNumber: 215,
	        columnNumber: 11
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$2n,
	      lineNumber: 214,
	      columnNumber: 9
	    }, this), !isLoading && items.length === 0 && emptyItemsMessage && o("div", {
	      className: "Hyp-Table-Scrollbox__message",
	      "data-testid": "empty-items-message",
	      children: emptyItemsMessage
	    }, void 0, false, {
	      fileName: _jsxFileName$2n,
	      lineNumber: 219,
	      columnNumber: 9
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$2n,
	    lineNumber: 166,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2m = "/home/runner/work/frontend-shared/frontend-shared/src/components/TextInput.js";
	function TextInput({
	  classes = '',
	  inputRef,
	  hasError = false,
	  type = 'text',
	  ...restProps
	}) {
	  return o("input", {
	    className: classnames('Hyp-TextInput', {
	      'has-error': hasError
	    }, classes),
	    ...restProps,
	    ref: inputRef,
	    type: type
	  }, void 0, false, {
	    fileName: _jsxFileName$2m,
	    lineNumber: 40,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * A wrapping component for pairing a `TextInput` with an `IconButton` component.
	 * Applies appropriate design pattern. Expected usage:
	 *
	 * <TextInputWithButton>
	 *   <TextInput />
	 *   <IconButton />
	 * </TextInputWithButton>
	 *
	 * Current implementation assumes the input is on the left and button on right.
	 *
	 * @deprecated - Use InputGroup component in the input group
	 * @param {TextInputWithButtonProps} props
	 */

	function TextInputWithButton({
	  children,
	  classes = ''
	}) {
	  return o("div", {
	    className: classnames('Hyp-TextInputWithButton', classes),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$2m,
	    lineNumber: 69,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2l = "/home/runner/work/frontend-shared/frontend-shared/src/components/Thumbnail.js";
	function Thumbnail({
	  children,
	  classes = '',
	  isLoading = false,
	  placeholder = '...',
	  size = 'medium'
	}) {
	  // If there are no `children`, render a placeholder (unless loading)
	  const content = x$1(children).length ? children : placeholder;
	  return o("div", {
	    className: classnames('Hyp-Thumbnail', classes),
	    children: o("div", {
	      className: "Hyp-Thumbnail__content",
	      children: [isLoading && o(Spinner, {
	        size: size
	      }, void 0, false, {
	        fileName: _jsxFileName$2l,
	        lineNumber: 59,
	        columnNumber: 23
	      }, this), !isLoading && content]
	    }, void 0, true, {
	      fileName: _jsxFileName$2l,
	      lineNumber: 58,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2l,
	    lineNumber: 57,
	    columnNumber: 5
	  }, this);
	}

	// Components

	var annotate = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\">\n  <path fill=\"currentColor\" fill-rule=\"nonzero\" d=\"M15 0c.27 0 .505.099.703.297A.961.961 0 0116 1v15l-4-3H1a.974.974 0 01-.703-.29A.953.953 0 010 12V1C0 .719.096.482.29.29A.966.966 0 011 0h14zM7 3l-.469.063c-.312.041-.656.187-1.031.437-.375.25-.719.646-1.031 1.188C4.156 5.229 4 6 4 7l.002.063.006.062a.896.896 0 01.008.11l-.002.074-.006.066a1.447 1.447 0 00.43 1.188C4.729 8.854 5.082 9 5.5 9c.417 0 .77-.146 1.063-.438C6.854 8.271 7 7.918 7 7.5c0-.417-.146-.77-.438-1.063A1.447 1.447 0 005.5 6c-.073 0-.146.005-.219.016-.073.01-.14.026-.203.046.177-1.03.542-1.632 1.094-1.804L7 4V3zm5 0l-.469.063c-.312.041-.656.187-1.031.437-.375.25-.719.646-1.031 1.188C9.156 5.229 9 6 9 7l.002.063.006.062a.896.896 0 01.008.11l-.002.074-.006.066a1.447 1.447 0 00.43 1.188c.291.291.645.437 1.062.437.417 0 .77-.146 1.063-.438.291-.291.437-.645.437-1.062 0-.417-.146-.77-.438-1.063A1.447 1.447 0 0010.5 6c-.073 0-.146.005-.219.016-.073.01-.14.026-.203.046.177-1.03.542-1.632 1.094-1.804L12 4V3z\"/>\n</svg>\n";

	var annotateAlt = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M14 0a2 2 0 012 2v13a1 1 0 01-1.555.832l-4.262-1.757A1 1 0 009.802 14H2a2 2 0 01-2-2V2a2 2 0 012-2h12zm-2.109 3.5h-.484l-.14.006-.122.018a.684.684 0 00-.2.071l-.076.054-.108.1-.097.1-1.632 1.999-.091.12-.084.129a2.56 2.56 0 00-.291.722l-.03.142-.027.218-.009.223v2.646l.01.086.027.08a.537.537 0 00.236.236l.067.028.07.016.074.006h2.907l.074-.006.094-.024a.516.516 0 00.169-.108.525.525 0 00.082-.096l.029-.051.027-.081.01-.086V7.336l-.006-.073-.018-.068a.436.436 0 00-.124-.178.549.549 0 00-.103-.074l-.055-.026-.087-.024-.092-.009h-.579l-.057-.006-.054-.017a.307.307 0 01-.096-.07.175.175 0 01-.045-.078l-.004-.04.01-.043.022-.043 1.311-2.227.047-.09.037-.106a.492.492 0 00-.06-.394.531.531 0 00-.255-.22l-.084-.028-.092-.016-.1-.006zm-5.924 0h-.424l-.121.006-.108.018a.552.552 0 00-.174.071l-.067.054-.095.1-.084.1-1.429 1.999-.08.12-.096.174a2.798 2.798 0 00-.232.677l-.025.142-.024.218L3 7.402v2.646l.008.086.024.08a.486.486 0 00.097.148c.035.037.071.066.11.088l.058.028.062.016.065.006h2.543l.065-.006.082-.024a.513.513 0 00.22-.204l.025-.051.024-.081.008-.086V7.336l-.005-.073-.023-.09a.487.487 0 00-.191-.23l-.048-.026-.076-.024-.08-.009H5.46l-.05-.006-.047-.017a.273.273 0 01-.084-.07.182.182 0 01-.04-.078l-.003-.04.008-.043.02-.043L6.411 4.36l.04-.09.033-.106a.553.553 0 00-.053-.394.49.49 0 00-.222-.22l-.074-.028-.08-.016-.089-.006z\"></path></g></svg>";

	var arrowDown = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 9l-4 4-4-4m4 3V3v9z\"></path></g></svg>";

	var arrowLeft = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 12L3 8l4-4M4 8h9-9z\"></path></g></svg>\n";

	var arrowRight = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 4l4 4-4 4m3-4H3h9z\"></path></g></svg>\n";

	var arrowUp = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 7l4-4 4 4M8 4v9-9z\"></path></g></svg>";

	var bookmark = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 1v14l-5-4-5 4V1z\"></path></g></svg>";

	var bookmarkFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M13 0a1 1 0 01.993.883L14 1v14a1 1 0 01-1.534.846l-.09-.065L8 12.28l-4.375 3.5a1.001 1.001 0 01-1.6-.556l-.02-.112L2 15V1a1 1 0 01.883-.993L3 0h10z\"></path></g></svg>";

	var caretDown = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 6l-4 4-4-4\"></path></g></svg>";

	var caretLeft = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 12L6 8l4-4\"></path></g></svg>";

	var caretRight = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 4l4 4-4 4\"></path></g></svg>";

	var caretUp = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 10l4-4 4 4\"></path></g></svg>";

	var caution = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"></path><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"></line><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"></line></svg>";

	var ccStd = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M7.985 0c2.238 0 4.143.781 5.715 2.343a7.694 7.694 0 011.714 2.579C15.804 5.888 16 6.914 16 8a8.164 8.164 0 01-.579 3.078 7.344 7.344 0 01-1.707 2.536 8.222 8.222 0 01-2.657 1.772c-.99.41-2.014.614-3.071.614a7.775 7.775 0 01-3.036-.607 8.047 8.047 0 01-2.6-1.757A7.846 7.846 0 010 8c0-1.057.202-2.074.607-3.05A8.033 8.033 0 012.371 2.33C3.895.777 5.766 0 7.985 0zm.03 1.443c-1.83 0-3.367.638-4.615 1.914a6.878 6.878 0 00-1.45 2.15A6.301 6.301 0 001.443 8c0 .858.168 1.684.507 2.479a6.627 6.627 0 001.45 2.129 6.593 6.593 0 002.129 1.428c.79.329 1.619.493 2.485.493.857 0 1.688-.166 2.494-.5a6.91 6.91 0 002.178-1.442c1.247-1.22 1.871-2.748 1.871-4.586a6.57 6.57 0 00-.486-2.515 6.397 6.397 0 00-1.413-2.114C11.37 2.086 9.824 1.443 8.014 1.443zm-.1 5.229l-1.073.557c-.114-.238-.254-.405-.42-.5a.95.95 0 00-.465-.143c-.714 0-1.072.472-1.072 1.415 0 .428.09.77.271 1.028.181.257.448.386.8.386.467 0 .796-.229.987-.686l.985.5a2.35 2.35 0 01-2.1 1.257c-.714 0-1.29-.218-1.729-.657-.438-.438-.657-1.047-.657-1.828 0-.762.222-1.367.665-1.814.442-.448 1.002-.672 1.678-.672.991 0 1.7.385 2.13 1.157zm4.613 0l-1.057.557c-.114-.238-.255-.405-.421-.5a.972.972 0 00-.479-.143c-.714 0-1.072.472-1.072 1.415 0 .428.091.77.272 1.028.18.257.447.386.8.386.466 0 .795-.229.985-.686l1 .5c-.218.39-.514.698-.885.922a2.308 2.308 0 01-1.214.335c-.724 0-1.302-.218-1.735-.657-.434-.438-.65-1.047-.65-1.828 0-.762.22-1.367.664-1.814.442-.448 1.002-.672 1.678-.672.99 0 1.696.385 2.114 1.157z\"></path></g></svg>";

	var ccStdFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M7.98537477,0 C10.2231597,0 12.1284395,0.781262207 13.6997141,2.34303661 C14.4517258,3.09529836 15.0234847,3.9550618 15.4139908,4.9215769 C15.8042469,5.88834201 16,6.91435804 16,8.000125 C16,9.09539212 15.806747,10.1216582 15.421491,11.0784231 C15.0357349,12.0354381 14.466476,12.8809513 13.7144643,13.6142127 C12.9337021,14.3854748 12.0479382,14.976234 11.0571728,15.3857404 C10.0669073,15.7952468 9.0428913,16 7.98587478,16 C6.92885826,16 5.91684245,15.7979968 4.95007734,15.3927405 C3.98356224,14.9882342 3.1167987,14.402475 2.35003672,13.6359631 C1.58327474,12.8694511 1.00001563,12.0049376 0.600009375,11.0429225 C0.200003125,10.0809075 0,9.06689167 0,8.000125 C0,6.94285848 0.20225316,5.9263426 0.607009485,4.95007734 C1.01176581,3.97381209 1.600025,3.10004844 2.37128705,2.32853638 C3.89506086,0.776512133 5.7663401,0 7.98537477,0 Z M5.7853404,5.5150852 C5.10882983,5.5150852 4.54932108,5.73908967 4.10656417,6.18659667 C3.66380725,6.63435366 3.44230379,7.23886311 3.44230379,8.00087501 C3.44230379,8.78163721 3.66130721,9.39114674 4.09931405,9.82915358 C4.5373209,10.2676604 5.1138299,10.4864139 5.82809106,10.4864139 C6.27584806,10.4864139 6.68560446,10.3746621 7.05661026,10.1506586 C7.37504381,9.95886989 7.63396622,9.70591696 7.8333775,9.39148493 L7.92812388,9.22914421 L6.94260848,8.72913639 C6.7518555,9.18614353 6.42335036,9.41489711 5.95659307,9.41489711 C5.60408756,9.41489711 5.3373334,9.2861451 5.15633057,9.02889108 C4.97557774,8.77163706 4.88507633,8.42913171 4.88507633,8.00062501 C4.88507633,7.05761028 5.24258192,6.58635291 5.95659307,6.58635291 C6.09959531,6.58635291 6.25434772,6.63410366 6.42110033,6.72910514 C6.55430241,6.80530633 6.67070423,6.92742824 6.77056179,7.09495886 L6.84235691,7.22911295 L7.91412366,6.67185425 C7.48536696,5.90034219 6.77610588,5.51458617 5.7853404,5.5150852 Z M10.4139127,5.5150852 C9.73765215,5.5150852 9.17814341,5.73908967 8.73563649,6.18659667 C8.29237957,6.63435366 8.07112611,7.23886311 8.07112611,8.00087501 C8.07112611,8.78163721 8.28762949,9.39114674 8.72163628,9.82915358 C9.15464304,10.2676604 9.73290208,10.4864139 10.4569134,10.4864139 C10.8949202,10.4864139 11.2996766,10.3746621 11.6711824,10.1506586 C11.9803539,9.96419736 12.237094,9.71992271 12.4406793,9.4175453 L12.5564462,9.22914421 L11.5564306,8.72913639 C11.3661776,9.18614353 11.0374225,9.41489711 10.5711652,9.41489711 C10.2181597,9.41489711 9.95165549,9.2861451 9.77090267,9.02889108 C9.59014985,8.77163706 9.49939843,8.42913171 9.49939843,8.00062501 C9.49939843,7.05761028 9.85690401,6.58635291 10.5711652,6.58635291 C10.7229175,6.58635291 10.88267,6.63410366 11.0496727,6.72910514 C11.1828747,6.80530633 11.2995966,6.92742824 11.3994541,7.09495886 L11.4711792,7.22911295 L12.5284458,6.67185425 C12.1096892,5.90034219 11.4044282,5.51458617 10.4139127,5.5150852 Z\"></path></svg>";

	var ccZero = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M7.983 0c2.238 0 4.148.78 5.72 2.342a7.662 7.662 0 011.715 2.582c.39.962.582 1.99.582 3.076a8.13 8.13 0 01-.583 3.087 7.262 7.262 0 01-1.703 2.526 8.213 8.213 0 01-2.655 1.77c-.99.41-2.018.617-3.076.617a7.902 7.902 0 01-3.042-.6 8.301 8.301 0 01-2.6-1.759A8.087 8.087 0 01.6 11.042 7.84 7.84 0 010 8c0-1.057.2-2.07.6-3.042a8.12 8.12 0 011.77-2.633C3.893.772 5.764 0 7.983 0zm.034 1.44c-1.829 0-3.369.64-4.616 1.915a6.962 6.962 0 00-1.457 2.157 6.388 6.388 0 000 4.969 6.83 6.83 0 003.585 3.558c.79.324 1.62.487 2.488.487.857 0 1.681-.165 2.482-.498a6.88 6.88 0 002.184-1.446C13.931 11.364 14.56 9.838 14.56 8a6.57 6.57 0 00-.487-2.515 6.418 6.418 0 00-1.418-2.118C11.37 2.081 9.826 1.44 8.017 1.44zM8 3.395c2.641 0 3.305 2.492 3.305 4.605 0 2.113-.664 4.605-3.305 4.605S4.694 10.113 4.694 8l.007-.355c.073-2.027.804-4.25 3.299-4.25zm1.316 3.227L7.35 10.017c-.274.412-.083.645.219.774l.135.044c.091.022.19.034.297.034 1.357 0 1.422-1.938 1.422-2.869l-.007-.409a7.282 7.282 0 00-.06-.72l-.04-.25zM8 5.132c-1.258 0-1.406 1.66-1.421 2.646L6.577 8c0 .24.005.544.035.865l.027.244 1.759-3.232c.182-.316.09-.542-.101-.706A1.222 1.222 0 008 5.13z\"></path></g></svg>";

	var ccZeroFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M7.98325,0 C10.22125,0 12.13125,0.77975 13.70325,2.34175 C14.4555,3.09425 15.027,3.953 15.4175,4.92425 C15.8075,5.8865 16,6.91425 16,8 C16,9.09575 15.8075,10.125 15.41725,11.08675 C15.0365,12.039 14.467,12.88 13.71425,13.61325 C12.933,14.385 12.0495,14.97375 11.059,15.3835 C10.06825,15.79325 9.0405,15.99975 7.98325,15.99975 C6.92575,15.99975 5.9125,15.80075 4.941,15.40025 C3.97875,14.99075 3.11275,14.40325 2.3415,13.641 C1.5795,12.87 0.99925,12.0045 0.59925,11.042 C0.19925,10.08 0,9.067 0,8 C0,6.94275 0.19925,5.92975 0.59925,4.958 C1.009,3.97675 1.598,3.09675 2.36975,2.325 C3.8935,0.7725 5.764,0 7.98325,0 Z M8,3.395 C5.58107744,3.395 4.82033452,5.48533799 4.70940247,7.46012326 L4.70087556,7.64485352 L4.6945,8 L4.70087337,8.35518364 L4.70087337,8.35518364 L4.72089438,8.7144321 C4.86646914,10.6360123 5.652,12.605 8,12.605 C10.641,12.605 11.30525,10.113 11.30525,8 C11.30525,5.88725 10.641,3.395 8,3.395 Z M9.3165,6.62175 L9.35676736,6.87076968 C9.37957986,7.03692014 9.39473958,7.20226042 9.40471875,7.36028125 L9.41611111,7.59100926 L9.42267213,8.10741209 L9.42267213,8.10741209 L9.41475695,8.47041107 L9.41475695,8.47041107 L9.39995748,8.73740123 L9.39995748,8.73740123 L9.37404324,9.01600457 L9.37404324,9.01600457 L9.33401712,9.29903864 C9.19778738,10.1004619 8.85553704,10.86875 8.0005,10.86875 C7.92916667,10.86875 7.86161111,10.86375 7.79738889,10.8536759 L7.7035,10.83475 L7.569,10.7905 C7.28976923,10.6716538 7.10597041,10.4641923 7.29524761,10.1091259 L7.3505,10.01725 L9.3165,6.62175 Z M8,5.1315 C8.10725,5.1315 8.205,5.148 8.297,5.17075 C8.46611111,5.31652778 8.55838272,5.51149074 8.44862414,5.77460185 L8.39775,5.8765 L6.63875,9.109 L6.611592,8.86531 C6.589368,8.62408 6.581022,8.39248 6.578238,8.19076 L6.57856145,7.77758895 L6.58524468,7.52944923 L6.58524468,7.52944923 L6.60004801,7.26251269 L6.60004801,7.26251269 L6.62596977,6.98396115 L6.62596977,6.98396115 L6.66600828,6.70097644 C6.80228121,5.89968896 7.14464815,5.1315 8,5.1315 Z\"></path></svg>";

	var check = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 3L6 13 3 8\"></path></g></svg>\n";

	var collapse = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 11l-4 4 4-4zm-3-1h4v4m9-13l-4 4 4-4zm-1 5h-4V2\"></path></g></svg>";

	var contrast = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 1C4.5 1 1 4.5 1 8s3.5 7 7 7 7-3.5 7-7-3.5-7-7-7zM7 2v12M6 2v12M4 3v10M2 5v6\"></path></g></svg>";

	var copy = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 15H1V5h3m11-4v10H7V1h8z\"></path></g></svg>";

	var copyFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M1,16 C0.487164161,16 0.0644928393,15.6139598 0.00672773133,15.1166211 L0,15 L0,5 C0,4.48716416 0.38604019,4.06449284 0.883378875,4.00672773 L1,4 L4,4 C4.55228475,4 5,4.44771525 5,5 L5,13 L9,13 C9.55228475,13 10,13.4477153 10,14 L10,15 C10,15.5128358 9.61395981,15.9355072 9.11662113,15.9932723 L9,16 L1,16 Z M15,0 C15.5128358,0 15.9355072,0.38604019 15.9932723,0.883378875 L16,1 L16,11 C16,11.5128358 15.6139598,11.9355072 15.1166211,11.9932723 L15,12 L7,12 C6.48716416,12 6.06449284,11.6139598 6.00672773,11.1166211 L6,11 L6,1 C6,0.487164161 6.38604019,0.0644928393 6.88337887,0.00672773133 L7,0 L15,0 Z\"></path></svg>";

	var edit = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 4l1 1-9 9-2 1 1-2 9-9zm3-3l1 1-1 1-1-1 1-1z\"></path></g></svg>\n";

	var editorLatex = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M13.392 16c.158 0 .299-.036.423-.108.123-.073.185-.155.185-.248v-1.778c0-.099-.062-.183-.185-.252a.848.848 0 00-.423-.104H6.85c-.138 0-.227-.028-.267-.083-.04-.055-.04-.105 0-.152l5.533-5.101c.158-.14.223-.265.193-.378a.755.755 0 00-.193-.325L6.88 2.707c-.04-.046-.042-.094-.007-.143.034-.05.13-.074.289-.074h6.17a.782.782 0 00.416-.108c.119-.073.178-.155.178-.248V.356c0-.093-.06-.175-.178-.248A.782.782 0 0013.333 0H2.905c-.158 0-.3.036-.423.108-.124.073-.185.155-.185.248v1.943c0 .128.037.236.11.326l.171.204 5.31 4.815c.04.047.065.106.075.178a.221.221 0 01-.074.195l-5.622 5.154c-.04.047-.094.113-.163.2A.512.512 0 002 13.7v1.943c0 .093.062.175.185.248a.822.822 0 00.423.108h10.784z\"></path></g></svg>";

	var editorQuote = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M2.701 14c.38 0 .659-.085.837-.255.177-.17.328-.343.45-.52l2.408-3.25c.246-.328.445-.725.598-1.19a4.69 4.69 0 00.23-1.475V2.775a.752.752 0 00-.23-.539A.713.713 0 006.47 2H1.947a.713.713 0 00-.524.236.752.752 0 00-.23.539v4.649c0 .214.077.396.23.548a.726.726 0 00.524.226h.901c.123 0 .23.054.322.161.092.107.101.224.028.35l-2.041 3.817c-.196.365-.208.702-.037 1.011.172.309.447.463.827.463h.754zm7.795 0c.367 0 .64-.085.818-.255.178-.17.328-.343.45-.52l2.409-3.25c.257-.328.46-.725.606-1.19A4.87 4.87 0 0015 7.31V2.775a.752.752 0 00-.23-.539.713.713 0 00-.524-.236H9.742a.703.703 0 00-.533.236.767.767 0 00-.22.539v4.649c0 .214.076.396.23.548a.726.726 0 00.523.226h.9c.123 0 .228.054.313.161.086.107.092.224.019.35L8.95 12.526c-.208.365-.223.702-.045 1.011.177.309.456.463.836.463h.754z\"></path></g></svg>";

	var editorTextBold = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M8.661 16c.805 0 1.536-.117 2.193-.351a4.953 4.953 0 001.69-.993c.47-.428.831-.947 1.081-1.557s.375-1.287.375-2.03c0-.29-.038-.588-.114-.893a4.123 4.123 0 00-.325-.87 3.937 3.937 0 00-.495-.754 4.412 4.412 0 00-.604-.597c-.17-.126-.17-.264 0-.412.381-.335.699-.772.953-1.311.254-.54.382-1.062.382-1.568 0-.64-.132-1.244-.394-1.813a4.628 4.628 0 00-1.081-1.484c-.458-.42-1-.753-1.627-.999A5.531 5.531 0 008.66 0h-6.14a.534.534 0 00-.362.14A.415.415 0 002 .456v15.086c0 .119.053.225.159.318.106.093.227.139.362.139h6.14zm-.127-9.852H5.826c-.17 0-.254-.075-.254-.223V3.437c0-.157.085-.235.254-.235h2.708c.45 0 .847.145 1.195.435.347.29.521.633.521 1.027 0 .394-.174.74-.521 1.038a1.784 1.784 0 01-1.195.446zm0 6.65H5.826c-.17 0-.254-.075-.254-.223v-2.99c0-.157.085-.235.254-.235h2.708c.56 0 1.004.177 1.335.53.33.353.495.75.495 1.188 0 .454-.165.856-.495 1.205-.33.35-.776.525-1.335.525z\"></path></g></svg>";

	var editorTextItalic = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M10.61 16c.12 0 .23-.046.329-.14a.633.633 0 00.191-.317l.457-2.176a.348.348 0 00-.064-.313.336.336 0 00-.276-.133H8.845c-.142-.008-.198-.086-.17-.235l1.892-9.372c.035-.149.124-.223.266-.223H13a.49.49 0 00.335-.14.62.62 0 00.196-.318L13.99.457a.542.542 0 00.011-.1.337.337 0 00-.085-.223.336.336 0 00-.276-.134H5.805a.49.49 0 00-.335.14.62.62 0 00-.196.317l-.457 2.176a.353.353 0 00.069.318c.074.093.168.14.281.14h2.18c.141 0 .198.074.17.223l-1.893 9.372c-.028.156-.113.235-.255.235H2.967a.489.489 0 00-.324.133.59.59 0 00-.197.313l-.435 2.176a.542.542 0 00-.011.1c0 .082.025.156.074.223.071.09.16.134.266.134h8.27z\"></path></g></svg>";

	var ellipsis = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z\"></path></g></svg>";

	var email = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M1 3v10h14V3H1zm0 0l7 6 7-6H1z\"></path></g></svg>";

	var emailFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M0.0310424035,3.64706271 L7.7,9.4 L7.77988338,9.44897959 C7.91852932,9.5170068 8.08147068,9.5170068 8.22011662,9.44897959 L8.3,9.4 L15.9691358,3.64806483 L15.9921737,3.82184812 L15.9921737,3.82184812 L16,4 L16,12 C16,13.0543618 15.1841222,13.9181651 14.1492623,13.9945143 L14,14 L2,14 C0.945638205,14 0.0818348781,13.1841222 0.00548573643,12.1492623 L-8.8817842e-16,12 L-8.8817842e-16,4 C-8.8817842e-16,3.87957173 0.0106439466,3.76162949 0.0310424035,3.64706271 Z M14,2 C14.6181536,2 15.1708071,2.2804391 15.5376736,2.7210303 L8,8.375 L0.462326444,2.7210303 C0.792506267,2.32449822 1.27317359,2.05768934 1.81663922,2.00829289 L2,2 L14,2 Z\"></path></svg>";

	var expand = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 14l4-4-4 4zm3 1H1v-4m13-9l-4 4 4-4zm-3-1h4v4\"></path></g></svg>";

	var external = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 3h6v6m-1-5l-9 9 9-9z\"></path></g></svg>";

	var fileCode = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L12.3333333,0 Z M11,1 L2,1 L2,15 L14,15 L14,4 L11.5,4 C11.2238576,4 11,3.77614237 11,3.5 L11,1 Z M6.53033009,5.46966991 C6.79659665,5.73593648 6.8208027,6.15260016 6.60294824,6.44621165 L6.53033009,6.53033009 L5.061,8 L6.53033009,9.46966991 C6.79659665,9.73593648 6.8208027,10.1526002 6.60294824,10.4462117 L6.53033009,10.5303301 C6.26406352,10.7965966 5.84739984,10.8208027 5.55378835,10.6029482 L5.46966991,10.5303301 L3.46966991,8.53033009 C3.20340335,8.26406352 3.1791973,7.84739984 3.39705176,7.55378835 L3.46966991,7.46966991 L5.46966991,5.46966991 C5.76256313,5.1767767 6.23743687,5.1767767 6.53033009,5.46966991 Z M10.4462117,5.39705176 L10.5303301,5.46966991 L12.5303301,7.46966991 L12.6029482,7.55378835 C12.7965966,7.81477634 12.7989874,8.17299076 12.6101204,8.4363794 L12.5303301,8.53033009 L10.5303301,10.5303301 L10.4462117,10.6029482 C10.1852237,10.7965966 9.82700924,10.7989874 9.5636206,10.6101204 L9.46966991,10.5303301 L9.39705176,10.4462117 C9.20340335,10.1852237 9.20101263,9.82700924 9.3898796,9.5636206 L9.46966991,9.46966991 L10.939,8 L9.46966991,6.53033009 L9.39705176,6.44621165 C9.1791973,6.15260016 9.20340335,5.73593648 9.46966991,5.46966991 C9.73593648,5.20340335 10.1526002,5.1791973 10.4462117,5.39705176 Z\"></path></svg>";

	var fileCodeFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M11,0 L11,3.5 C11,3.74545989 11.1768752,3.94960837 11.4101244,3.99194433 L11.5,4 L15,4 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L11,0 Z M6.53033009,5.46966991 C6.23743687,5.1767767 5.76256313,5.1767767 5.46966991,5.46966991 L5.46966991,5.46966991 L3.46966991,7.46966991 L3.39705176,7.55378835 C3.1791973,7.84739984 3.20340335,8.26406352 3.46966991,8.53033009 L3.46966991,8.53033009 L5.46966991,10.5303301 L5.55378835,10.6029482 C5.84739984,10.8208027 6.26406352,10.7965966 6.53033009,10.5303301 L6.53033009,10.5303301 L6.60294824,10.4462117 C6.8208027,10.1526002 6.79659665,9.73593648 6.53033009,9.46966991 L6.53033009,9.46966991 L5.061,8 L6.53033009,6.53033009 L6.60294824,6.44621165 C6.8208027,6.15260016 6.79659665,5.73593648 6.53033009,5.46966991 Z M10.4462117,5.39705176 C10.1526002,5.1791973 9.73593648,5.20340335 9.46966991,5.46966991 C9.20340335,5.73593648 9.1791973,6.15260016 9.39705176,6.44621165 L9.39705176,6.44621165 L9.46966991,6.53033009 L10.939,8 L9.46966991,9.46966991 L9.3898796,9.5636206 C9.20101263,9.82700924 9.20340335,10.1852237 9.39705176,10.4462117 L9.39705176,10.4462117 L9.46966991,10.5303301 L9.5636206,10.6101204 C9.82700924,10.7989874 10.1852237,10.7965966 10.4462117,10.6029482 L10.4462117,10.6029482 L10.5303301,10.5303301 L12.5303301,8.53033009 L12.6101204,8.4363794 C12.7989874,8.17299076 12.7965966,7.81477634 12.6029482,7.55378835 L12.6029482,7.55378835 L12.5303301,7.46966991 L10.5303301,5.46966991 Z M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,3 L12.25,3 C12.1119288,3 12,2.88807119 12,2.75 L12,0 L12.3333333,0 Z\"></path></svg>";

	var fileGeneric = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L12.3333333,0 Z M11,1 L2,1 L2,15 L14,15 L14,4 L11.5,4 C11.2238576,4 11,3.77614237 11,3.5 L11,1 Z M7.25,10.5 C7.66421356,10.5 8,10.8357864 8,11.25 C8,11.6642136 7.66421356,12 7.25,12 L4.75,12 C4.33578644,12 4,11.6642136 4,11.25 C4,10.8357864 4.33578644,10.5 4.75,10.5 L7.25,10.5 Z M11.25,7.75 C11.6642136,7.75 12,8.08578644 12,8.5 C12,8.91421356 11.6642136,9.25 11.25,9.25 L4.75,9.25 C4.33578644,9.25 4,8.91421356 4,8.5 C4,8.08578644 4.33578644,7.75 4.75,7.75 L11.25,7.75 Z M11.25,5 C11.6642136,5 12,5.33578644 12,5.75 C12,6.16421356 11.6642136,6.5 11.25,6.5 L4.75,6.5 C4.33578644,6.5 4,6.16421356 4,5.75 C4,5.33578644 4.33578644,5 4.75,5 L11.25,5 Z\"></path></svg>";

	var fileGenericFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M11,0 L11,3.5 C11,3.74545989 11.1768752,3.94960837 11.4101244,3.99194433 L11.5,4 L15,4 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L11,0 Z M7.25,10.5 L4.75,10.5 C4.33578644,10.5 4,10.8357864 4,11.25 C4,11.6642136 4.33578644,12 4.75,12 L4.75,12 L7.25,12 C7.66421356,12 8,11.6642136 8,11.25 C8,10.8357864 7.66421356,10.5 7.25,10.5 L7.25,10.5 Z M11.25,7.75 L4.75,7.75 C4.33578644,7.75 4,8.08578644 4,8.5 C4,8.91421356 4.33578644,9.25 4.75,9.25 L4.75,9.25 L11.25,9.25 C11.6642136,9.25 12,8.91421356 12,8.5 C12,8.08578644 11.6642136,7.75 11.25,7.75 L11.25,7.75 Z M11.25,5 L4.75,5 C4.33578644,5 4,5.33578644 4,5.75 C4,6.16421356 4.33578644,6.5 4.75,6.5 L4.75,6.5 L11.25,6.5 C11.6642136,6.5 12,6.16421356 12,5.75 C12,5.33578644 11.6642136,5 11.25,5 L11.25,5 Z M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,3 L12.25,3 C12.1119288,3 12,2.88807119 12,2.75 L12,0 L12.3333333,0 Z\"></path></svg>";

	var fileImage = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L12.3333333,0 Z M11,1 L2,1 L2,15 L14,15 L14,4 L11.5,4 C11.2238576,4 11,3.77614237 11,3.5 L11,1 Z M9.54145248,5.12213937 L9.59648295,5.19084277 L12.9293307,10.3336999 C13.0985213,10.594775 12.9458527,10.9370896 12.6629375,10.992329 L12.5826935,11 L9.22956549,11.000554 C9.38101295,10.7046385 9.37898764,10.3284054 9.15394288,10.0197277 L7.36454649,7.564 L8.90320872,5.19084277 C9.05162037,4.96183145 9.3608727,4.93893031 9.54145248,5.12213937 Z M6.18902068,6.81798942 L6.2502829,6.88571429 L8.74991868,10.3142857 C8.94005528,10.5750825 8.78770602,10.9386856 8.49312613,10.9930813 L8.41663391,11 L3.41736235,11 C3.10046801,11 2.90911637,10.6564582 3.04356266,10.3813883 L3.08407757,10.3142857 L5.58371336,6.88571429 C5.73183992,6.68253968 6.01163454,6.65996473 6.18902068,6.81798942 Z\"></path></svg>";

	var fileImageFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M11,0 L11,3.5 C11,3.74545989 11.1768752,3.94960837 11.4101244,3.99194433 L11.5,4 L15,4 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L11,0 Z M9.54145248,5.12213937 C9.38093712,4.95928688 9.11875456,4.95928688 8.9582392,5.12213937 L8.90320872,5.19084277 L7.36454649,7.564 L9.15394288,10.0197277 C9.35398266,10.2941079 9.37780955,10.6218651 9.2742684,10.8991436 L9.22956549,11.000554 L12.5826935,11 L12.6629375,10.992329 C12.9201332,10.9421113 13.069687,10.6546415 12.9676376,10.4066397 L12.9293307,10.3336999 L9.59648295,5.19084277 L9.54145248,5.12213937 Z M6.18902068,6.81798942 C6.03380781,6.67971781 5.80018845,6.67971781 5.64497558,6.81798942 L5.58371336,6.88571429 L3.08407757,10.3142857 L3.04356266,10.3813883 C2.92032023,10.6335357 3.07083856,10.9432185 3.34087012,10.9930813 L3.41736235,11 L8.41663391,11 L8.49312613,10.9930813 C8.7631577,10.9432185 8.91367603,10.6335357 8.7904336,10.3813883 L8.74991868,10.3142857 L6.2502829,6.88571429 L6.18902068,6.81798942 Z M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,3 L12.25,3 C12.1119288,3 12,2.88807119 12,2.75 L12,0 L12.3333333,0 Z\"></path></svg>";

	var filePdf = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L12.3333333,0 Z M11,1 L2,1 L2,15 L14,15 L14,4 L11.5,4 C11.2238576,4 11,3.77614237 11,3.5 L11,1 Z M7.44899868,3 C7.72116887,3 8.49231776,3.2739726 8.53767946,4.50684932 L8.53439997,4.7114967 L8.53439997,4.7114967 L8.52112076,4.92880771 C8.48445506,5.34358194 8.37135323,5.86149163 8.03870077,6.69863014 C8.2371582,6.98401826 8.45333505,7.26940639 8.72045521,7.58823844 L9.06757852,7.98903039 C9.13021665,8.05921804 9.19542409,8.13127854 9.26346664,8.20547945 L9.3917552,8.34175228 L9.3917552,8.34175228 L9.61431103,8.59717466 C9.64904108,8.63641553 9.68306236,8.67351598 9.71708363,8.70776256 L10.0799772,8.70776256 C11.1232963,8.70776256 11.9398069,8.89041096 12.4387856,9.16438356 C13.1192111,9.57534247 13.0284877,10.260274 12.9377643,10.5342466 C12.8470409,10.7625571 12.529509,11.173516 11.8490835,11.173516 C11.7129984,11.173516 11.5315516,11.173516 11.3501048,11.0821918 C10.9018245,10.9693795 10.5458372,10.7636631 9.85144216,10.0824957 L9.53186977,9.76034228 C9.47473601,9.70142674 9.41556175,9.63980661 9.35419004,9.57534247 C8.85521135,9.62100457 8.31087096,9.71232877 7.76653057,9.80365297 C7.31291358,9.89497717 6.90465829,9.98630137 6.5417647,10.1232877 C6.46011364,10.2846271 6.38128509,10.4364282 6.3051984,10.5792728 L6.08508327,10.9815187 C6.04974147,11.0442753 6.01506497,11.1049383 5.9810437,11.1635802 L5.7846981,11.4917622 C5.7532574,11.5426112 5.72245177,11.5915846 5.69227112,11.6387553 L5.51860638,11.9007272 C5.49088534,11.9409775 5.46376912,11.9795704 5.43724765,12.0165787 L5.28517507,12.2201945 L5.28517507,12.2201945 L5.14689245,12.3892694 L5.14689245,12.3892694 L5.02191593,12.5272941 C5.00216847,12.5479046 4.98295527,12.5673668 4.96426625,12.5857534 L4.85834165,12.6837477 L4.85834165,12.6837477 L4.76451349,12.7594182 L4.76451349,12.7594182 L4.68229793,12.8162557 L4.68229793,12.8162557 L4.61121111,12.8577507 L4.61121111,12.8577507 L4.50048824,12.9086758 L4.50048824,12.9086758 L4.25666911,12.9714612 C4.18295635,12.9885845 4.1149138,13 4.04687125,13 C3.6476883,13 3.39366279,12.76621 3.23834433,12.5791781 L3.13963727,12.4520548 L3.13963727,12.4520548 L3.09240884,12.3626097 C2.96547075,12.0890129 2.86242689,11.5388128 3.54789256,10.8082192 L3.74466613,10.6154123 C3.77007533,10.5915914 3.79678638,10.5670456 3.82491931,10.5418492 L4.01173971,10.3834585 C4.38904601,10.0809436 4.96744691,9.71770078 5.90670091,9.39269406 C6.08814771,8.98173516 6.3149562,8.57077626 6.496403,8.11415525 C6.57200583,7.94672755 6.64256847,7.78437341 6.70809093,7.62878404 L6.88953772,7.18400135 L6.88953772,7.18400135 L7.04074339,6.78995434 L7.04074339,6.78995434 C6.4510413,5.83105023 6.3603179,5.10045662 6.3603179,4.27853881 C6.3603179,3.3196347 7.04074339,3 7.44899868,3 Z M5.22627543,10.6712329 C4.81348397,10.8949772 4.55628313,11.096347 4.37687761,11.2596804 L4.18295635,11.4474886 L4.18295635,11.4474886 C3.97126842,11.6605784 3.92422666,11.8184227 3.91377293,11.9210215 L3.91078615,11.9954338 L3.91078615,11.9954338 L4.00150955,12.0410959 L3.95614785,12.0410959 L3.98449892,12.0639269 C4.00150955,12.0753425 4.0241904,12.086758 4.04687125,12.086758 C4.04687125,12.1324201 4.09223295,12.1324201 4.13759465,12.086758 L4.15950435,12.080411 L4.15950435,12.080411 L4.19856077,12.0578995 L4.19856077,12.0578995 L4.25558043,12.0140183 L4.25558043,12.0140183 L4.33137983,11.9435616 L4.33137983,11.9435616 L4.42677548,11.8413242 L4.42677548,11.8413242 L4.5425839,11.7021005 L4.5425839,11.7021005 L4.67962159,11.5206849 C4.70427567,11.4866438 4.72984833,11.4506279 4.75635658,11.4125285 L4.92676914,11.1580651 L4.92676914,11.1580651 L5.12045225,10.8483961 C5.15471735,10.791895 5.18998607,10.7328767 5.22627543,10.6712329 Z M10.6243176,9.62100457 L10.8681367,9.83959073 C11.2304003,10.1524607 11.3879062,10.2222222 11.5769133,10.260274 L11.6442471,10.2674087 L11.6442471,10.2674087 L11.761904,10.2988014 C11.7782058,10.3030822 11.7923814,10.3059361 11.8037218,10.3059361 C11.9851686,10.3059361 12.075892,10.260274 12.075892,10.2146119 C12.1061331,10.1232877 12.0557312,10.0522577 12.0053293,10.0015221 L11.9398069,9.94063927 L11.9398069,9.94063927 L11.8251535,9.88433584 L11.8251535,9.88433584 L11.6890477,9.82767909 C11.6622478,9.81751579 11.6333625,9.80710309 11.6023505,9.79660725 L11.3904286,9.73396475 C11.1920099,9.68314825 10.9383601,9.63856691 10.6243176,9.62100457 Z M7.67580717,7.70319635 L7.67580717,7.74885845 L7.4334056,8.32034817 C7.40647209,8.38812785 7.38095613,8.456621 7.35827528,8.52511416 L7.2278604,8.793379 C7.18816891,8.87899543 7.15414764,8.95890411 7.13146679,9.02739726 L7.17682848,9.02739726 L7.08610509,9.07305936 L7.33559443,9.01027397 C7.4149774,8.99315068 7.49436038,8.98173516 7.58508378,8.98173516 L7.84945743,8.94035388 L7.84945743,8.94035388 L8.34418346,8.84046804 L8.34418346,8.84046804 L8.58304116,8.79908676 C8.43788372,8.6347032 8.30724202,8.47762557 8.18530978,8.32785388 L7.83983508,7.90045662 C7.78467525,7.83287671 7.73024121,7.76712329 7.67580717,7.70319635 Z M7.44899868,3.91324201 C7.35827528,3.95890411 7.31291358,4.09589041 7.31291358,4.32420091 C7.26755188,4.73515982 7.31291358,5.10045662 7.49436038,5.64840183 C7.61532491,5.28310502 7.65564642,5.01927955 7.66908692,4.81633688 L7.67555828,4.6321852 C7.67580717,4.60437454 7.67580717,4.57787925 7.67580717,4.55251142 C7.67580717,4.14155251 7.53972208,3.95890411 7.44899868,3.91324201 Z\"></path></svg>";

	var filePdfFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M11,0 L11,3.5 C11,3.74545989 11.1768752,3.94960837 11.4101244,3.99194433 L11.5,4 L15,4 L15,15.5 C15,15.7761424 14.7761424,16 14.5,16 L1.5,16 C1.22385763,16 1,15.7761424 1,15.5 L1,0.5 C1,0.223857625 1.22385763,0 1.5,0 L11,0 Z M7.44899868,3 C7.04074339,3 6.3603179,3.3196347 6.3603179,4.27853881 C6.3603179,5.10045662 6.4510413,5.83105023 7.04074339,6.78995434 L6.88953772,7.18400135 L6.88953772,7.18400135 L6.70809093,7.62878404 C6.64256847,7.78437341 6.57200583,7.94672755 6.496403,8.11415525 C6.3149562,8.57077626 6.08814771,8.98173516 5.90670091,9.39269406 C4.96744691,9.71770078 4.38904601,10.0809436 4.01173971,10.3834585 L3.82491931,10.5418492 L3.82491931,10.5418492 L3.67222406,10.6846257 L3.67222406,10.6846257 L3.54789256,10.8082192 L3.54789256,10.8082192 C2.86242689,11.5388128 2.96547075,12.0890129 3.09240884,12.3626097 L3.13963727,12.4520548 L3.13963727,12.4520548 L3.23834433,12.5791781 C3.39366279,12.76621 3.6476883,13 4.04687125,13 C4.1149138,13 4.18295635,12.9885845 4.25666911,12.9714612 L4.50048824,12.9086758 L4.50048824,12.9086758 L4.61121111,12.8577507 L4.61121111,12.8577507 L4.68229793,12.8162557 L4.68229793,12.8162557 L4.76451349,12.7594182 L4.76451349,12.7594182 L4.85834165,12.6837477 L4.85834165,12.6837477 L4.96426625,12.5857534 L4.96426625,12.5857534 L5.08277117,12.4619449 C5.10359723,12.438965 5.12496763,12.4147641 5.14689245,12.3892694 L5.28517507,12.2201945 L5.28517507,12.2201945 L5.43724765,12.0165787 L5.43724765,12.0165787 L5.60359404,11.7749315 C5.6325348,11.7312938 5.66209047,11.6859259 5.69227112,11.6387553 L5.88093547,11.333516 C5.94637728,11.2241705 6.01439967,11.107032 6.08508327,10.9815187 L6.3051984,10.5792728 C6.38128509,10.4364282 6.46011364,10.2846271 6.5417647,10.1232877 C6.90465829,9.98630137 7.31291358,9.89497717 7.76653057,9.80365297 C8.31087096,9.71232877 8.85521135,9.62100457 9.35419004,9.57534247 L9.53186977,9.76034228 L9.53186977,9.76034228 L9.85144216,10.0824957 C10.5458372,10.7636631 10.9018245,10.9693795 11.3501048,11.0821918 C11.5315516,11.173516 11.7129984,11.173516 11.8490835,11.173516 C12.529509,11.173516 12.8470409,10.7625571 12.9377643,10.5342466 C13.0284877,10.260274 13.1192111,9.57534247 12.4387856,9.16438356 C11.9813884,8.91324201 11.2571763,8.73883815 10.3360293,8.71151488 L10.0799772,8.70776256 L9.71708363,8.70776256 L9.61431103,8.59717466 L9.61431103,8.59717466 L9.3917552,8.34175228 C9.35135493,8.29680365 9.30882834,8.25114155 9.26346664,8.20547945 L9.06757852,7.98903039 L9.06757852,7.98903039 L8.72045521,7.58823844 C8.45333505,7.26940639 8.2371582,6.98401826 8.03870077,6.69863014 C8.37135323,5.86149163 8.48445506,5.34358194 8.52112076,4.92880771 L8.53439997,4.7114967 L8.53439997,4.7114967 L8.53767946,4.50684932 L8.53767946,4.50684932 C8.49231776,3.2739726 7.72116887,3 7.44899868,3 Z M5.22627543,10.6712329 L5.02065084,11.0104566 C4.988376,11.062032 4.95708776,11.1111986 4.92676914,11.1580651 L4.75635658,11.4125285 L4.75635658,11.4125285 L4.60839805,11.616992 L4.60839805,11.616992 L4.48207706,11.776661 L4.48207706,11.776661 L4.37657709,11.8967409 L4.37657709,11.8967409 L4.29108163,11.9824372 C4.27845407,11.9941438 4.266626,12.0046347 4.25558043,12.0140183 L4.19856077,12.0578995 L4.19856077,12.0578995 L4.15950435,12.080411 L4.15950435,12.080411 L4.13759465,12.086758 L4.13759465,12.086758 C4.09223295,12.1324201 4.04687125,12.1324201 4.04687125,12.086758 C4.0241904,12.086758 4.00150955,12.0753425 3.98449892,12.0639269 L3.95614785,12.0410959 L4.00150955,12.0410959 L3.91078615,11.9954338 L3.91377293,11.9210215 C3.92422666,11.8184227 3.97126842,11.6605784 4.18295635,11.4474886 L4.37687761,11.2596804 C4.55628313,11.096347 4.81348397,10.8949772 5.22627543,10.6712329 Z M10.6243176,9.62100457 C10.9383601,9.63856691 11.1920099,9.68314825 11.3904286,9.73396475 L11.6023505,9.79660725 C11.6333625,9.80710309 11.6622478,9.81751579 11.6890477,9.82767909 L11.8750575,9.9079255 L11.8750575,9.9079255 L11.9398069,9.94063927 L11.9398069,9.94063927 L12.0053293,10.0015221 C12.0557312,10.0522577 12.1061331,10.1232877 12.075892,10.2146119 C12.075892,10.260274 11.9851686,10.3059361 11.8037218,10.3059361 L11.761904,10.2988014 L11.761904,10.2988014 L11.6442471,10.2674087 C11.622275,10.2631279 11.5995941,10.260274 11.5769133,10.260274 C11.4068069,10.2260274 11.2622165,10.1660959 10.9709093,9.92636986 L10.7530787,9.7382251 C10.7125209,9.70186454 10.6696793,9.66286149 10.6243176,9.62100457 Z M7.67580717,7.70319635 L7.83983508,7.90045662 L7.83983508,7.90045662 L8.18530978,8.32785388 C8.2462759,8.40273973 8.30941939,8.47945205 8.37546602,8.55799087 L8.58304116,8.79908676 L8.34418346,8.84046804 L7.84945743,8.94035388 C7.76369547,8.95605023 7.67580717,8.97031963 7.58508378,8.98173516 C7.49436038,8.98173516 7.4149774,8.99315068 7.33559443,9.01027397 L7.08610509,9.07305936 L7.17682848,9.02739726 L7.13146679,9.02739726 C7.15414764,8.95890411 7.18816891,8.87899543 7.2278604,8.793379 L7.35827528,8.52511416 L7.35827528,8.52511416 L7.4334056,8.32034817 L7.4334056,8.32034817 L7.67580717,7.74885845 L7.67580717,7.70319635 Z M7.44899868,3.91324201 C7.53972208,3.95890411 7.67580717,4.14155251 7.67580717,4.55251142 L7.67381599,4.71975121 C7.66684684,4.93415638 7.63548566,5.22222222 7.49436038,5.64840183 C7.31291358,5.10045662 7.26755188,4.73515982 7.31291358,4.32420091 C7.31291358,4.09589041 7.35827528,3.95890411 7.44899868,3.91324201 Z M12.3333333,0 C12.4649846,0 12.5913236,0.0519229236 12.684928,0.144498701 L14.8515947,2.28735584 C14.9465603,2.38127786 15,2.5092914 15,2.64285714 L15,3 L12.25,3 C12.1119288,3 12,2.88807119 12,2.75 L12,0 L12.3333333,0 Z\"></path></svg>";

	var filter = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M1 3h14H1zm4 10h6-6zM3 8h10H3z\"></path></g></svg>";

	var flag = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 9v6V1h12l-4 4 4 4H3z\"></path></g></svg>";

	var flagFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M2 1a1 1 0 01.883-.993L3 0h12c.852 0 1.297.986.783 1.623l-.076.084L12.415 5l3.292 3.293c.575.575.253 1.523-.485 1.684l-.108.017L15 10H4v5a1 1 0 01-1.993.117L2 15V1z\"></path></g></svg>";

	var folder = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M4.5,1 C5.08477209,1 5.59138843,1.33462455 5.83881221,1.82283684 L5.89516355,1.9479849 L5.913,2 L14.5,2 C15.2309651,2 15.8398119,2.52285085 15.9729528,3.21496507 L15.9931334,3.35553999 L16,3.5 L16,13.5 C16,14.2796961 15.4051119,14.9204487 14.64446,14.9931334 L14.5,15 L1.5,15 C0.720303883,15 0.0795513218,14.4051119 0.00686657806,13.64446 L0,13.5 L0,2.5 C0,1.72030388 0.594888083,1.07955132 1.35553999,1.00686658 L1.5,1 L4.5,1 Z M15,5 L1,5 L1,13.5 C1,13.7454599 1.17687516,13.9496084 1.41012437,13.9919443 L1.5,14 L14.5,14 C14.7454599,14 14.9496084,13.8231248 14.9919443,13.5898756 L15,13.5 L15,5 Z M4.5,2 L1.5,2 C1.25454011,2 1.05039163,2.17687516 1.00805567,2.41012437 L1,2.5 L1,4 L15,4 L15,3.5 C15,3.25454011 14.8231248,3.05039163 14.5898756,3.00805567 L14.5,3 L5.5,3 C5.25454011,3 5.05039163,2.82312484 5.00805567,2.58987563 L4.99194433,2.41012437 C4.95490037,2.20603131 4.79396869,2.04509963 4.58987563,2.00805567 L4.5,2 Z\"></path></svg>";

	var folderFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M16,5 L16,13.5 C16,14.2796961 15.4051119,14.9204487 14.64446,14.9931334 L14.5,15 L1.5,15 C0.720303883,15 0.0795513218,14.4051119 0.00686657806,13.64446 L0,13.5 L0,5 L16,5 Z M0,2.5 C0,1.72030388 0.594888083,1.07955132 1.35553999,1.00686658 L1.5,1 L4.5,1 C5.15321869,1 5.70891488,1.41754351 5.91475048,2.00029246 L14.5,2 C15.2796961,2 15.9204487,2.59488808 15.9931334,3.35553999 L16,3.5 L16,4 L0,4 L0,2.5 Z\"></path></svg>";

	var folderOpen = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M5.5,1 C6.08477209,1 6.59138843,1.33462455 6.83881221,1.82283684 L6.89516355,1.9479849 L6.913,2 L13.5,2 C14.2309651,2 14.8398119,2.52285085 14.9729528,3.21496507 L14.9931334,3.35553999 L15,3.5 L15.0010598,4.13322895 C15.4776831,4.34981658 15.8213063,4.81001691 15.8751588,5.36132835 L15.8825437,5.51383039 L15.8781572,5.61042101 L15,13.5 C15,14.2796961 14.4051119,14.9204487 13.64446,14.9931334 L13.5,15 L2.5,15 C1.72030388,15 1.07955132,14.4051119 1.00941616,13.6904938 L1.00305813,13.5552158 L0.126439413,5.66564729 C0.0530908166,5.00550992 0.41993647,4.39791149 0.999710191,4.1351147 L1,2.5 C1,1.72030388 1.59488808,1.07955132 2.35553999,1.00686658 L2.5,1 L5.5,1 Z M1.593,5 L1.56204925,5.00305813 C1.31809066,5.03016464 1.1347234,5.22850242 1.11840444,5.46500023 L1.12032315,5.55521576 L2,13.5 C2,13.7454599 2.17687516,13.9496084 2.41012437,13.9919443 L2.5,14 L13.5,14 C13.7454599,14 13.9496084,13.8231248 13.9940847,13.5511627 L14.0030476,13.4448794 L14.8813961,5.54147 L14.882735,5.5 C14.882735,5.25454011 14.7058598,5.05039163 14.4726106,5.00805567 L14.382735,5 L1.593,5 Z M5.5,2 L2.5,2 C2.25454011,2 2.05039163,2.17687516 2.00805567,2.41012437 L2,2.5 L2,4 L14,4 L14,3.5 C14,3.2852226 13.86458,3.10207424 13.6744662,3.03128126 L13.5898756,3.00805567 L13.5,3 L6.5,3 C6.25454011,3 6.05039163,2.82312484 6.00805567,2.58987563 L6,2.5 C6,2.25454011 5.82312484,2.05039163 5.58987563,2.00805567 L5.5,2 Z\"></path></svg>";

	var folderOpenFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M5.5,1 C6.1335031,1 6.67528173,1.39271909 6.89516355,1.9479849 L6.913,2 L13.5,2 C14.2796961,2 14.9204487,2.59488808 14.9931334,3.35553999 L15,3.5 L15.000587,4.13275264 C15.5208051,4.36820732 15.882735,4.89183703 15.882735,5.5 L15.8804396,5.58295058 L15.8804396,5.58295058 L15.8735606,5.66564729 L15,13.5 C15,14.2796961 14.4051119,14.9204487 13.64446,14.9931334 L13.5,15 L2.5,15 C1.72030388,15 1.07955132,14.4051119 1.00941616,13.6904938 L1.00305813,13.5552158 L0.126439413,5.66564729 C0.0528213209,5.00308446 0.422638124,4.39344735 0.998935589,4.13292877 L1,2.5 C1,1.72030388 1.59488808,1.07955132 2.35553999,1.00686658 L2.5,1 L5.5,1 Z M5.5,2 L2.5,2 C2.25454011,2 2.05039163,2.17687516 2.00805567,2.41012437 L2,2.5 L1.99913273,4 L13.9991327,4 L14,3.5 C14,3.25454011 13.8231248,3.05039163 13.5898756,3.00805567 L13.5,3 L6.5,3 C6.25454011,3 6.05039163,2.82312484 6.00805567,2.58987563 L6,2.5 C6,2.25454011 5.82312484,2.05039163 5.58987563,2.00805567 L5.5,2 Z\"></path></svg>";

	var globe = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\">\n  <path fill=\"currentColor\" fill-rule=\"nonzero\" d=\"M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm2.655 11.535c.244-.242.442-.719.442-1.063a1.13 1.13 0 0 0-.288-.696l-.442-.442a1.033 1.033 0 0 0-.73-.302H7.484C7.181 8.88 6.791 8 6.452 8c-.34 0-.674-.08-.978-.231l-.357-.179a.386.386 0 0 1-.213-.345c0-.153.118-.317.263-.366l1.006-.335a.618.618 0 0 1 .163-.026c.106 0 .258.056.338.126l.3.26c.046.04.106.063.169.063h.182a.258.258 0 0 0 .23-.373l-.503-1.006a.306.306 0 0 1-.027-.116c0-.06.035-.143.078-.185l.32-.31a.258.258 0 0 1 .18-.074h.29c.06 0 .141-.034.183-.076l.258-.258c.1-.1.1-.264 0-.364l-.151-.152c-.101-.1-.101-.264 0-.365l.333-.333.151-.151a.516.516 0 0 0 0-.73l-.912-.913a6.45 6.45 0 0 0-.787.078v.365a.516.516 0 0 1-.747.461l-.775-.387a6.487 6.487 0 0 0-3.329 3.287c.32.474.813 1.205 1.116 1.65.138.203.4.503.582.668l.026.023c.308.278.65.516 1.021.702.452.227 1.111.586 1.575.842.328.182.53.527.53.903v1.032c0 .274.11.537.303.73.484.484.785 1.246.73 1.653v.884c.473 0 .932-.055 1.376-.152l.56-1.511c.067-.177.106-.362.155-.544a.771.771 0 0 1 .199-.346l.365-.364zm2.797-2.946l.94.235c.036-.27.06-.544.06-.824a6.4 6.4 0 0 0-.688-2.882l-.419.21a.773.773 0 0 0-.298.263l-.632.947a.908.908 0 0 0-.13.43c0 .13.058.321.13.43l.58.87c.107.16.27.274.457.32z\"/>\n</svg>";

	var globeAlt = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 0c1.105 0 2-3.134 2-7s-.895-7-2-7-2 3.134-2 7 .895 7 2 7zm6.272-9.61C13.127 6.049 10.748 6.501 8 6.501S2.873 6.05 1.728 5.39m12.544 5.221C13.127 9.953 10.748 9.5 8 9.5s-5.127.453-6.272 1.111\"></path></g></svg>";

	var groups = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M1 15a3 3 0 0 1 6 0m2-4a3 3 0 0 1 6 0M4 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8-4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z\"></path></g></svg>";

	var groupsFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M4,11 C6.209139,11 8,12.790861 8,15 C8,15.5128358 7.61395981,15.9355072 7.11662113,15.9932723 L7,16 L1,16 C0.44771525,16 0,15.5522847 0,15 C0,12.790861 1.790861,11 4,11 Z M12,7 C14.209139,7 16,8.790861 16,11 C16,11.5128358 15.6139598,11.9355072 15.1166211,11.9932723 L15,12 L9,12 C8.44771525,12 8,11.5522847 8,11 C8,8.790861 9.790861,7 12,7 Z M4,4 C5.65685425,4 7,5.34314575 7,7 C7,8.65685425 5.65685425,10 4,10 C2.34314575,10 1,8.65685425 1,7 C1,5.34314575 2.34314575,4 4,4 Z M12,0 C13.6568542,0 15,1.34314575 15,3 C15,4.65685425 13.6568542,6 12,6 C10.3431458,6 9,4.65685425 9,3 C9,1.34314575 10.3431458,0 12,0 Z\"></path></svg>";

	var help = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 4.5C4 2.567 5.79 1 8 1s4 1.567 4 3.5S10.21 8 8 8m0 0v1.5V8z\"></path></g></svg>";

	var hide = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M1.61289944,0.209704612 L1.70710678,0.292893219 L15.7071068,14.2928932 C16.0976311,14.6834175 16.0976311,15.3165825 15.7071068,15.7071068 C15.3466228,16.0675907 14.7793918,16.0953203 14.3871006,15.7902954 L14.2928932,15.7071068 L0.292893219,1.70710678 C-0.0976310729,1.31658249 -0.0976310729,0.683417511 0.292893219,0.292893219 C0.65337718,-0.0675907428 1.22060824,-0.0953202783 1.61289944,0.209704612 Z M2.19604887,5.05494269 C2.65878442,5.35642943 2.78950241,5.97595401 2.48801567,6.43868956 C2.16488794,6.93464068 2,7.46139686 2,8 C2,10.1228856 4.62796016,12 8,12 C8.22060643,12 8.4396701,11.9919023 8.65660209,11.9758355 C9.20737829,11.9350431 9.68693944,12.3484666 9.72773191,12.8992428 C9.76852437,13.450019 9.35510087,13.9295801 8.80432467,13.9703726 C8.53822524,13.9900809 8.26988704,14 8,14 C3.64005335,14 0,11.3999619 0,8 C0,7.06308249 0.28281658,6.15958778 0.812302005,5.34690949 C1.11378875,4.88417394 1.73331332,4.75345595 2.19604887,5.05494269 Z M8,2 C12.3599467,2 16,4.6000381 16,8 C16,8.93691751 15.7171834,9.84041222 15.187698,10.6530905 C14.8862113,11.1158261 14.2666867,11.246544 13.8039511,10.9450573 C13.3412156,10.6435706 13.2104976,10.024046 13.5119843,9.56131044 C13.8351121,9.06535932 14,8.53860314 14,8 C14,5.8771144 11.3720398,4 8,4 C7.77939357,4 7.5603299,4.00809769 7.34339791,4.02416445 C6.79262171,4.06495692 6.31306056,3.65153342 6.27226809,3.10075722 C6.23147563,2.54998102 6.64489913,2.07041987 7.19567533,2.02962741 C7.46177476,2.00991913 7.73011296,2 8,2 Z\"></path></svg>";

	var hideFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M1.61289944,0.209704612 L1.70710678,0.292893219 L15.7071068,14.2928932 C16.0976311,14.6834175 16.0976311,15.3165825 15.7071068,15.7071068 C15.3466228,16.0675907 14.7793918,16.0953203 14.3871006,15.7902954 L14.2928932,15.7071068 L0.292893219,1.70710678 C-0.0976310729,1.31658249 -0.0976310729,0.683417511 0.292893219,0.292893219 C0.65337718,-0.0675907428 1.22060824,-0.0953202783 1.61289944,0.209704612 Z M1.57493899,4.40449804 L5.00453586,7.83361728 L5,8 L5,8 C5,9.65685425 6.34314575,11 8,11 L8.166,10.994 L10.7974423,13.6264349 C9.92342583,13.8686663 8.97989462,14 8,14 C3.64005335,14 0,11.3999619 0,8 C0,6.63325914 0.58820946,5.39578088 1.57493899,4.40449804 Z M8,2 C12.3599467,2 16,4.6000381 16,8 C16,9.36674086 15.4117905,10.6042191 14.425061,11.595502 L10.9954672,8.1663265 L11,8 L11,8 C11,6.34314575 9.65685425,5 8,5 L7.833,5.005 L5.20154887,2.37384475 C6.0758481,2.13143476 7.01972836,2 8,2 Z\"></path></svg>";

	var highlight = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 15H1h11zm-.5-6v2l-1 1v-2l1-1zm.5-7v6h-2V2h2zm0-1h-2 2zm0 8h-2 2z\"></path></g></svg>";

	var image = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 1v14H1V1h14zM1 15l3-8 4 6 3-4 4 6m-4-9a1 1 0 110-2 1 1 0 010 2z\"></path></g></svg>";

	var imageFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M14,0 C15.1045695,0 16,0.8954305 16,2 L16,2 L16,14 C16,15.1045695 15.1045695,16 14,16 L14,16 L2,16 C0.8954305,16 0,15.1045695 0,14 L0,14 L0,2 C0,0.8954305 0.8954305,0 2,0 L2,0 Z M9.54145248,5.12213937 C9.3608727,4.93893031 9.05162037,4.96183145 8.90320872,5.19084277 L8.90320872,5.19084277 L7.36454649,7.564 L9.15394288,10.0197277 C9.37898764,10.3284054 9.38101295,10.7046385 9.22956549,11.000554 L9.22956549,11.000554 L12.5826935,11 L12.6629375,10.992329 C12.9458527,10.9370896 13.0985213,10.594775 12.9293307,10.3336999 L12.9293307,10.3336999 L9.59648295,5.19084277 Z M6.18902068,6.81798942 C6.01163454,6.65996473 5.73183992,6.68253968 5.58371336,6.88571429 L5.58371336,6.88571429 L3.08407757,10.3142857 L3.04356266,10.3813883 C2.90911637,10.6564582 3.10046801,11 3.41736235,11 L3.41736235,11 L8.41663391,11 L8.49312613,10.9930813 C8.78770602,10.9386856 8.94005528,10.5750825 8.74991868,10.3142857 L8.74991868,10.3142857 L6.2502829,6.88571429 Z\"></path></svg>";

	var leave = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,0 C12.0522847,0 16,3.94771525 16,8 C16,12.0522847 12.0522847,16 8,16 C3.94771525,16 0,12.0522847 0,8 C0,3.94771525 3.94771525,0 8,0 Z M8,2 C5.05228475,2 2,5.05228475 2,8 C2,10.9477153 5.05228475,14 8,14 C10.9477153,14 14,10.9477153 14,8 C14,5.05228475 10.9477153,2 8,2 Z M10.7864022,6.62017694 L10.7071068,6.70710678 L9.415,8 L10.7071068,9.29289322 C11.0976311,9.68341751 11.0976311,10.3165825 10.7071068,10.7071068 C10.3466228,11.0675907 9.77939176,11.0953203 9.38710056,10.7902954 L9.29289322,10.7071068 L8,9.415 L6.70710678,10.7071068 C5.79286771,11.6213459 4.43536121,10.3192478 5.21359778,9.37982306 L5.29289322,9.29289322 L6.585,8 L5.29289322,6.70710678 C4.90236893,6.31658249 4.90236893,5.68341751 5.29289322,5.29289322 C5.65337718,4.93240926 6.22060824,4.90467972 6.61289944,5.20970461 L6.70710678,5.29289322 L8,6.585 L9.29289322,5.29289322 C10.2071323,4.37865415 11.5646388,5.68075222 10.7864022,6.62017694 Z\"></path></svg>";

	var leaveFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,0 C12.0522847,0 16,3.94771525 16,8 C16,12.0522847 12.0522847,16 8,16 C3.94771525,16 0,12.0522847 0,8 C0,3.94771525 3.94771525,0 8,0 Z M6.61289944,5.20970461 C6.25329917,4.93009846 5.74670083,4.93009846 5.38710056,5.20970461 L5.38710056,5.20970461 L5.29289322,5.29289322 L5.20970461,5.38710056 C4.93009846,5.74670083 4.93009846,6.25329917 5.20970461,6.61289944 L5.20970461,6.61289944 L5.29289322,6.70710678 L6.585,8 L5.29289322,9.29289322 L5.20970461,9.38710056 C4.90467972,9.77939176 4.93240926,10.3466228 5.29289322,10.7071068 L5.29289322,10.7071068 L5.38710056,10.7902954 C5.77939176,11.0953203 6.34662282,11.0675907 6.70710678,10.7071068 L6.70710678,10.7071068 L8,9.415 L9.29289322,10.7071068 L9.38710056,10.7902954 C9.77939176,11.0953203 10.3466228,11.0675907 10.7071068,10.7071068 C11.0976311,10.3165825 11.0976311,9.68341751 10.7071068,9.29289322 L10.7071068,9.29289322 L9.415,8 L10.7071068,6.70710678 L10.7902954,6.61289944 C11.0953203,6.22060824 11.0675907,5.65337718 10.7071068,5.29289322 C10.3466228,4.93240926 9.77939176,4.90467972 9.38710056,5.20970461 L9.38710056,5.20970461 L9.29289322,5.29289322 L8,6.585 L6.70710678,5.29289322 Z\"></path></svg>";

	var link = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M9.68027557,6.09714063 C10.0850762,6.47284645 10.1086623,7.10557198 9.73295644,7.51037264 C9.35725062,7.9151733 8.72452509,7.93875933 8.31972443,7.56305351 C7.52101725,6.821753 6.4700536,6.81243414 5.66500421,7.53509692 L2.58706553,11.1273971 L2.50815798,11.2094765 C1.81384474,11.8538863 1.84803625,12.885989 2.50815798,13.4986648 C3.17004601,14.1129799 4.31769172,14.1788096 5.06581128,13.6063341 L5.156,13.529 L6.16163376,12.3189006 C6.48720494,11.9265987 7.04943452,11.8464869 7.46827399,12.1138931 L7.56977663,12.1880051 C7.96207853,12.5135762 8.04219031,13.0758058 7.77478412,13.4946453 L7.70067217,13.5961479 L6.64329964,14.8702449 L6.554056,14.9645777 C5.02884562,16.3801643 2.59807851,16.3107974 1.14760683,14.9645777 C-0.293859995,13.6267155 -0.415580233,11.3582822 0.996093014,9.89228498 L1.095,9.794 L4.19491885,6.17921998 L4.2738264,6.09714063 C5.8499647,4.63428646 8.10413728,4.63428646 9.68027557,6.09714063 Z M14.8523932,1.03542234 C16.29386,2.37328448 16.4155802,4.64171776 15.003907,6.10771502 L14.904,6.205 L11.7857496,9.84275726 L11.7261736,9.90285937 C10.1500353,11.3657135 7.89586272,11.3657135 6.31972443,9.90285937 C5.91492376,9.52715355 5.89133773,8.89442802 6.26704356,8.48962736 C6.64274938,8.0848267 7.27547491,8.06124067 7.68027557,8.43694649 C8.47898275,9.178247 9.5299464,9.18756586 10.3349958,8.46490308 L13.4129345,4.87260289 L13.491842,4.79052353 C14.1861553,4.1461137 14.1519637,3.11401104 13.491842,2.50133522 C12.829954,1.88702005 11.6823083,1.82119037 10.9341887,2.39366585 L10.843,2.47 L9.83836624,3.6810994 C9.51279506,4.0734013 8.95056548,4.15351308 8.53172601,3.88610689 L8.43022337,3.81199494 C8.03792147,3.48642376 7.95780969,2.92419418 8.22521588,2.5053547 L8.29932783,2.40385206 L9.35670036,1.12975511 L9.445944,1.03542234 C10.9711544,-0.380164327 13.4019215,-0.310797434 14.8523932,1.03542234 Z\"></path></svg>";

	var listOrdered = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M2.74823068,11.5 C2.97524895,11.5 3.1905939,11.5343408 3.39366257,11.603155 C3.59684892,11.6720091 3.77524112,11.7672163 3.92811884,11.8888526 C4.08261947,12.0117802 4.20418892,12.156176 4.29187398,12.3213933 C4.38099535,12.489317 4.42568877,12.6706965 4.42568877,12.8637096 C4.42568877,13.0343925 4.38425005,13.1965655 4.30193102,13.3483633 C4.2490321,13.4459099 4.1864049,13.5350392 4.1129322,13.6165937 L4.04984615,13.678 L4.09689729,13.7134462 C4.1440201,13.7542692 4.18757668,13.798784 4.2275306,13.8469317 L4.28475493,13.9218707 L4.36039919,14.0444001 C4.45317113,14.2160007 4.5,14.3957363 4.5,14.5818816 C4.5,14.7829974 4.45212751,14.9723959 4.35676927,15.1481679 C4.26309551,15.320835 4.13497752,15.4708273 3.973323,15.5974593 C3.8136645,15.7225277 3.62857226,15.8208403 3.41870764,15.8924562 C3.20845593,15.9642041 2.98476013,16 2.74823068,16 C2.51170124,16 2.28800544,15.9642041 2.07775373,15.8924562 C1.86788911,15.8208403 1.68279687,15.7225277 1.52313837,15.5974593 C1.36129205,15.4706771 1.23362688,15.3204523 1.14109689,15.1474913 C1.07063396,15.015779 1.02649843,14.8764526 1.00883459,14.7302917 L1,14.5818816 L1.00164157,14.5040028 L1.01140889,14.4539704 C1.02582527,14.4107075 1.05279311,14.3734256 1.08945882,14.3425177 C1.12493487,14.3126126 1.16582677,14.2925055 1.21036894,14.2824235 L1.27969922,14.2748479 L1.98756339,14.275596 L2.03880852,14.2818104 C2.08219582,14.2912785 2.12219058,14.3102242 2.15757967,14.3377172 C2.20307663,14.3730626 2.23398517,14.4185737 2.24659587,14.4705773 L2.25296992,14.5246092 L2.25258047,14.5718213 L2.25807808,14.6486267 C2.27079066,14.7268552 2.30703478,14.7869418 2.3704462,14.83505 C2.45795803,14.9014424 2.58255226,14.9363441 2.74823068,14.9363441 C2.90942468,14.9363441 3.03317339,14.9014105 3.12354059,14.834251 C3.20476584,14.7738856 3.24349145,14.6939404 3.24349145,14.5818816 C3.24349145,14.4698229 3.20476584,14.3898777 3.12354059,14.3295123 C3.05576519,14.2791427 2.96921269,14.2469001 2.86216869,14.2339269 L2.74823068,14.2274192 L2.64842249,14.226608 L2.59661089,14.2200403 C2.55268483,14.2100552 2.5123734,14.1901638 2.47690455,14.1614608 C2.43271565,14.1257011 2.40232873,14.081078 2.38989708,14.0303367 L2.38360435,13.9776578 L2.38524592,13.4072363 L2.39501324,13.3572039 C2.40942962,13.313941 2.43639745,13.2766591 2.47306317,13.2457512 C2.50853922,13.2158461 2.54943112,13.195739 2.59397329,13.1856571 L2.66330356,13.1780814 L2.73975563,13.1783439 L2.85168659,13.171719 C2.9437197,13.159688 3.01749149,13.1309337 3.07554665,13.0860883 C3.14630362,13.0314312 3.17979611,12.9612082 3.17979611,12.8637096 C3.17979611,12.7707791 3.14699089,12.703807 3.07678781,12.650869 C2.99833824,12.5917126 2.89023521,12.5607923 2.74823068,12.5607923 C2.61090557,12.5607923 2.5044056,12.5916531 2.4243983,12.6513063 C2.37106807,12.6910692 2.33912383,12.7385788 2.32648485,12.7989128 L2.32020389,12.8637096 L2.31842543,12.9739248 L2.3080742,13.0246617 C2.2929189,13.0683229 2.26484596,13.1055802 2.22690369,13.1362848 C2.19123111,13.1651527 2.15096982,13.1848449 2.10763134,13.1947655 L2.04050468,13.2022432 L1.32851348,13.201432 L1.27670188,13.1948643 C1.23277582,13.1848792 1.19246439,13.1649878 1.15699554,13.1362848 C1.11280664,13.1005251 1.08241973,13.055902 1.06998808,13.0051607 L1.06369534,12.9524818 L1.06393749,12.8557746 L1.07242996,12.7209412 C1.08997955,12.5797335 1.13393935,12.4455677 1.2039704,12.3192694 C1.29496951,12.155156 1.41713001,12.0116018 1.56968036,11.8891974 C1.72150283,11.7673769 1.89945766,11.6720615 2.1027988,11.603155 C2.30586747,11.5343408 2.52121242,11.5 2.74823068,11.5 Z M15,13 C15.5522847,13 16,13.4477153 16,14 C16,14.5128358 15.6139598,14.9355072 15.1166211,14.9932723 L15,15 L7,15 C6.44771525,15 6,14.5522847 6,14 C6,13.4871642 6.38604019,13.0644928 6.88337887,13.0067277 L7,13 L15,13 Z M2.7773794,5.5 C3.01061163,5.5 3.23063146,5.5337146 3.43690633,5.60133257 C3.64413053,5.66926173 3.82577219,5.7650503 3.98104183,5.88877206 C4.13710704,6.01312774 4.26121525,6.15905988 4.35251855,6.32596194 C4.4458521,6.49657529 4.49269883,6.68102126 4.49269883,6.87734324 C4.49269883,7.06676157 4.44420922,7.24780552 4.34808196,7.41850518 C4.27840068,7.54224292 4.19235414,7.65579573 4.08998064,7.75916145 L3.98216624,7.8591314 L2.70907692,8.93164706 L4.22978618,8.93317541 L4.2819717,8.93938021 C4.32589213,8.9488175 4.3664409,8.96773068 4.4024143,8.99524839 C4.44854332,9.0305346 4.48037077,9.07558051 4.49340143,9.12731154 L4.5,9.18115708 L4.49816677,9.77015236 L4.48750644,9.82162448 C4.47195889,9.86572783 4.44325396,9.90323894 4.40450989,9.93411094 C4.36826988,9.96298765 4.327482,9.98264611 4.28362146,9.99254322 L4.21571056,10 L1.26963414,9.99921332 L1.21688863,9.99265811 C1.17242832,9.98270676 1.1315541,9.9628474 1.09549011,9.93411094 C1.0503175,9.89811655 1.01919062,9.8530851 1.00645046,9.80173694 L1,9.74838397 L1.00023177,9.03667757 L1.00355503,8.98666953 C1.00929123,8.94324778 1.02217372,8.90475398 1.04484149,8.87164013 L1.07818082,8.82870401 L1.07818082,8.82870401 L1.11259372,8.79570542 L3.0410264,7.16741642 L3.07654241,7.13085815 C3.10025944,7.10314083 3.12742004,7.06517228 3.15746767,7.01728725 C3.19525076,6.95707469 3.21225554,6.90816349 3.21225554,6.87152553 C3.21225554,6.79090998 3.18100574,6.72355114 3.1131028,6.66181443 C3.04506831,6.5999581 2.94635937,6.5675501 2.81023468,6.5675501 C2.64713406,6.5675501 2.52518911,6.59993944 2.44117557,6.66093246 C2.38470254,6.70193134 2.35127551,6.74944837 2.33809157,6.80847605 L2.3315515,6.87152553 L2.32971827,6.99510388 L2.31905794,7.046576 C2.30351039,7.09067935 2.27480546,7.12819046 2.23606139,7.15906246 C2.19982138,7.18793917 2.1590335,7.20759763 2.11517296,7.21749474 L2.04726206,7.22495152 L1.32074236,7.22416484 L1.26799684,7.21760963 C1.22353654,7.20765828 1.18266232,7.18779892 1.14659833,7.15906246 C1.10142571,7.12306807 1.07029883,7.07803662 1.05755868,7.02668846 L1.05110821,6.97333549 L1.05135795,6.86928498 L1.06011863,6.73232654 C1.07821769,6.58893392 1.12354325,6.45272403 1.19572508,6.32454589 C1.28957677,6.15788712 1.41614427,6.01221295 1.57458539,5.88808592 C1.73194983,5.7648024 1.91380696,5.66924767 2.11943393,5.60141275 C2.3245881,5.53373381 2.54408196,5.5 2.7773794,5.5 Z M15,7 C15.5522847,7 16,7.44771525 16,8 C16,8.51283584 15.6139598,8.93550716 15.1166211,8.99327227 L15,9 L7,9 C6.44771525,9 6,8.55228475 6,8 C6,7.48716416 6.38604019,7.06449284 6.88337887,7.00672773 L7,7 L15,7 Z M3.23683366,0.000892565676 L3.28871073,0.00783402044 C3.33286644,0.0183677239 3.37314954,0.0392281526 3.40833624,0.0691110527 C3.45125131,0.105557407 3.4804697,0.15047096 3.49239669,0.201063483 L3.49842676,0.25344573 L3.49415385,3.42 L4.23779051,3.42095615 L4.28908093,3.4275216 C4.33270312,3.43751177 4.37269953,3.45739525 4.40784121,3.48604614 C4.45172591,3.52182516 4.48162288,3.56677356 4.49382857,3.61775241 L4.5,3.67062515 L4.498507,4.26621158 L4.48924681,4.31635115 C4.4754812,4.35970406 4.44942679,4.39750461 4.41369292,4.42911668 C4.37842528,4.46031631 4.3374287,4.48142013 4.29262358,4.49202272 L4.22279954,4.5 L1.28941458,4.49910743 L1.23753751,4.49216598 C1.1933818,4.48163228 1.1530987,4.46077185 1.117912,4.43088895 C1.07499693,4.39444259 1.04577855,4.34952904 1.03385155,4.29893652 L1.02782148,4.24655427 L1.02933048,3.65086338 L1.03870489,3.60058458 C1.05277955,3.55675636 1.07953979,3.51887873 1.11617316,3.48776722 C1.15134466,3.45789723 1.19194091,3.4377942 1.23617227,3.42771107 L1.30502194,3.42013291 L2.23738462,3.42211765 L2.23953846,1.46329412 L1.44368956,2.09185679 L1.37612125,2.12885556 C1.31383831,2.15121761 1.2470982,2.14957471 1.18010744,2.12726371 C1.08916935,2.09697716 1.02846344,2.03286164 1.0078186,1.94807494 L1,1.88081467 L1.00024153,1.29400722 L1.00681164,1.20546936 L1.0220171,1.13018676 C1.03500364,1.08276189 1.06008142,1.03856361 1.09493964,0.997770613 L1.15427346,0.939157422 L1.98428355,0.180994532 L2.02561691,0.145157104 C2.05782836,0.119624731 2.0953492,0.0943348848 2.13827642,0.0690384205 C2.19137322,0.0377491519 2.25228164,0.0174951656 2.32051982,0.00746909355 L2.42831415,0 L3.23683366,0.000892565676 Z M15,1 C15.5522847,1 16,1.44771525 16,2 C16,2.51283584 15.6139598,2.93550716 15.1166211,2.99327227 L15,3 L7,3 C6.44771525,3 6,2.55228475 6,2 C6,1.48716416 6.38604019,1.06449284 6.88337887,1.00672773 L7,1 L15,1 Z\"></path></svg>";

	var listUnordered = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M2,12 C3.1045695,12 4,12.8954305 4,14 C4,15.1045695 3.1045695,16 2,16 C0.8954305,16 0,15.1045695 0,14 C0,12.8954305 0.8954305,12 2,12 Z M15,13 C15.5522847,13 16,13.4477153 16,14 C16,14.5128358 15.6139598,14.9355072 15.1166211,14.9932723 L15,15 L7,15 C6.44771525,15 6,14.5522847 6,14 C6,13.4871642 6.38604019,13.0644928 6.88337887,13.0067277 L7,13 L15,13 Z M2,6 C3.1045695,6 4,6.8954305 4,8 C4,9.1045695 3.1045695,10 2,10 C0.8954305,10 0,9.1045695 0,8 C0,6.8954305 0.8954305,6 2,6 Z M15,7 C15.5522847,7 16,7.44771525 16,8 C16,8.51283584 15.6139598,8.93550716 15.1166211,8.99327227 L15,9 L7,9 C6.44771525,9 6,8.55228475 6,8 C6,7.48716416 6.38604019,7.06449284 6.88337887,7.00672773 L7,7 L15,7 Z M2,0 C3.1045695,0 4,0.8954305 4,2 C4,3.1045695 3.1045695,4 2,4 C0.8954305,4 0,3.1045695 0,2 C0,0.8954305 0.8954305,0 2,0 Z M15,1 C15.5522847,1 16,1.44771525 16,2 C16,2.51283584 15.6139598,2.93550716 15.1166211,2.99327227 L15,3 L7,3 C6.44771525,3 6,2.55228475 6,2 C6,1.48716416 6.38604019,1.06449284 6.88337887,1.00672773 L7,1 L15,1 Z\"></path></svg>";

	var list = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M15,12 C15.5522847,12 16,12.4477153 16,13 C16,13.5128358 15.6139598,13.9355072 15.1166211,13.9932723 L15,14 L1,14 C0.44771525,14 0,13.5522847 0,13 C0,12.4871642 0.38604019,12.0644928 0.883378875,12.0067277 L1,12 L15,12 Z M15,7 C15.5522847,7 16,7.44771525 16,8 C16,8.51283584 15.6139598,8.93550716 15.1166211,8.99327227 L15,9 L1,9 C0.44771525,9 0,8.55228475 0,8 C0,7.48716416 0.38604019,7.06449284 0.883378875,7.00672773 L1,7 L15,7 Z M15,2 C15.5522847,2 16,2.44771525 16,3 C16,3.51283584 15.6139598,3.93550716 15.1166211,3.99327227 L15,4 L1,4 C0.44771525,4 0,3.55228475 0,3 C0,2.48716416 0.38604019,2.06449284 0.883378875,2.00672773 L1,2 L15,2 Z\"></path></svg>";

	var lock = "<svg width=\"14\" height=\"16\" viewBox=\"0 0 48 56\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">\n    <g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g fill=\"currentColor\">\n            <rect x=\"0\" y=\"24\" width=\"48\" height=\"32\"></rect>\n            <path d=\"M24,0 C24,0 8,0 8,16 L8,32 L16,32 L16,16.0000004 C16,8 24,8 24,8 C24,8 32,8 32,16 L32,32 L40,32 L40,16 C40,0 24,0 24,0 Z\"></path>\n        </g>\n    </g>\n</svg>";

	var lockAltFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M15,7 C15.5128358,7 15.9355072,7.38604019 15.9932723,7.88337887 L16,8 L16,15 C16,15.5128358 15.6139598,15.9355072 15.1166211,15.9932723 L15,16 L1,16 C0.487164161,16 0.0644928393,15.6139598 0.00672773133,15.1166211 L0,15 L0,8 C0,7.48716416 0.38604019,7.06449284 0.883378875,7.00672773 L1,7 L15,7 Z M8,0 C10.6887547,0 12.8818181,2.12230671 12.9953805,4.78311038 L13,5 L13,5.5 C13,5.77614237 12.7761424,6 12.5,6 L11.5,6 C11.2238576,6 11,5.77614237 11,5.5 L11,5 C11,3.34314575 9.65685425,2 8,2 C6.40231912,2 5.09633912,3.24891996 5.00509269,4.82372721 L5,5 L5,5.5 C5,5.77614237 4.77614237,6 4.5,6 L3.5,6 C3.22385763,6 3,5.77614237 3,5.5 L3,5 C3,2.23857625 5.23857625,0 8,0 Z\"></path></svg>";

	var logout = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M9,0 C9.55228475,0 10,0.44771525 10,1 C10,1.51283584 9.61395981,1.93550716 9.11662113,1.99327227 L9,2 L1.999,2 L1.999,14 L9,14 C9.51283584,14 9.93550716,14.3860402 9.99327227,14.8833789 L10,15 C10,15.5128358 9.61395981,15.9355072 9.11662113,15.9932723 L9,16 L1,16 C0.487164161,16 0.0644928393,15.6139598 0.00672773133,15.1166211 L-8.8817842e-16,15 L-8.8817842e-16,1 C-8.8817842e-16,0.487164161 0.38604019,0.0644928393 0.883378875,0.00672773133 L1,0 L9,0 Z M11.6128994,3.20970461 L11.7071068,3.29289322 L15.7071068,7.29289322 C16.0675907,7.65337718 16.0953203,8.22060824 15.7902954,8.61289944 L15.7071068,8.70710678 L11.7071068,12.7071068 C11.3165825,13.0976311 10.6834175,13.0976311 10.2928932,12.7071068 C9.93240926,12.3466228 9.90467972,11.7793918 10.2097046,11.3871006 L10.2928932,11.2928932 L12.585,9 L5,9 C4.44771525,9 4,8.55228475 4,8 C4,7.48716416 4.38604019,7.06449284 4.88337887,7.00672773 L5,7 L12.585,7 L10.2928932,4.70710678 C9.93240926,4.34662282 9.90467972,3.77939176 10.2097046,3.38710056 L10.2928932,3.29289322 C10.6533772,2.93240926 11.2206082,2.90467972 11.6128994,3.20970461 Z\"></path></svg>";

	var logo = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"24px\" height=\"28px\" viewBox=\"0 0 24 28\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <rect fill=\"#ffffff\" stroke=\"none\" width=\"17.14407\" height=\"16.046612\" x=\"3.8855932\" y=\"3.9449153\" />\n    <g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <path d=\"M0,2.00494659 C0,0.897645164 0.897026226,0 2.00494659,0 L21.9950534,0 C23.1023548,0 24,0.897026226 24,2.00494659 L24,21.9950534 C24,23.1023548 23.1029738,24 21.9950534,24 L2.00494659,24 C0.897645164,24 0,23.1029738 0,21.9950534 L0,2.00494659 Z M9,24 L12,28 L15,24 L9,24 Z M7.00811294,4 L4,4 L4,20 L7.00811294,20 L7.00811294,15.0028975 C7.00811294,12.004636 8.16824717,12.0097227 9,12 C10,12.0072451 11.0189302,12.0606714 11.0189302,14.003477 L11.0189302,20 L14.0270431,20 L14.0270431,13.1087862 C14.0270433,10 12,9.00309038 10,9.00309064 C8.01081726,9.00309091 8,9.00309086 7.00811294,11.0019317 L7.00811294,4 Z M19,19.9869002 C20.1045695,19.9869002 21,19.0944022 21,17.9934501 C21,16.892498 20.1045695,16 19,16 C17.8954305,16 17,16.892498 17,17.9934501 C17,19.0944022 17.8954305,19.9869002 19,19.9869002 Z\" fill=\"currentColor\"></path>\n    </g>\n</svg>\n";

	var note = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M14,0 C15.0543618,0 15.9181651,0.815877791 15.9945143,1.85073766 L16,2 L16,9 C16,9.27541264 15.8865388,9.53676152 15.6894833,9.7243131 L15.6,9.8 L7.6,15.8 C7.46152306,15.9038577 7.29908616,15.9695431 7.12886893,15.9916629 L7,16 L2,16 C0.945638205,16 0.0818348781,15.1841222 0.00548573643,14.1492623 L0,14 L0,2 C0,0.945638205 0.815877791,0.0818348781 1.85073766,0.00548573643 L2,0 L14,0 Z M14,2 L2,2 L2,14 L6,14 L6,9 C6,8.48716416 6.38604019,8.06449284 6.88337887,8.00672773 L7,8 L14,8 L14,2 Z M12,10 L8,10 L8,13 L12,10 Z\"></path></svg>";

	var noteFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M14,0 C15.0543618,0 15.9181651,0.815877791 15.9945143,1.85073766 L16,2 L16,7 C16,7.55228475 15.5522847,8 15,8 L7,8 C6.44771525,8 6,8.44771525 6,9 L6,15 C6,15.5522847 5.55228475,16 5,16 L2,16 C0.945638205,16 0.0818348781,15.1841222 0.00548573643,14.1492623 L0,14 L0,2 C0,0.945638205 0.815877791,0.0818348781 1.85073766,0.00548573643 L2,0 L14,0 Z M15.75,9 C15.8880712,9 16,9.11192881 16,9.25 L7.25,16 C7.11192881,16 7,15.8880712 7,15.75 L7,10 C7,9.44771525 7.44771525,9 8,9 L15.75,9 Z\"></path></svg>";

	var plus = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8.99302964,2.86682521 L9,3 L9,6.999 L13,7 C13.5522847,7 14,7.44771525 14,8 C14,8.51283584 13.6139598,8.93550716 13.1166211,8.99327227 L13,9 L9,9 L9,13 C9,14.2873563 7.13555291,14.3317479 7.00697036,13.1331748 L7,13 L7,9 L3,9 C2.44771525,9 2,8.55228475 2,8 C2,7.48716416 2.38604019,7.06449284 2.88337887,7.00672773 L3,7 L7,7 L7,3 C7,1.71264368 8.86444709,1.66825208 8.99302964,2.86682521 Z\"></path></svg>";

	var preview = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,0 C12.418278,0 16,3.581722 16,8 C16,12.418278 12.418278,16 8,16 C3.581722,16 0,12.418278 0,8 C0,3.581722 3.581722,0 8,0 Z M8,2 C4.6862915,2 2,4.6862915 2,8 C2,11.3137085 4.6862915,14 8,14 C11.3137085,14 14,11.3137085 14,8 C14,4.6862915 11.3137085,2 8,2 Z M6,5 C6,4.21341129 6.8571835,3.74906551 7.50847393,4.13850094 L7.6,4.2 L11.6,7.2 C12.0977778,7.57333333 12.130963,8.29511111 11.6995556,8.7149037 L11.6,8.8 L7.6,11.8 C6.97072903,12.2719532 6.08494231,11.8648139 6.00571639,11.1101203 L6,11 L6,5 Z\"></path></svg>";

	var previewFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,0 C12.418278,0 16,3.581722 16,8 C16,12.418278 12.418278,16 8,16 C3.581722,16 0,12.418278 0,8 C0,3.581722 3.581722,0 8,0 Z M7.6,4.2 C6.97072903,3.72804677 6.08494231,4.1351861 6.00571639,4.88987971 L6,5 L6,11 C6,11.7865887 6.8571835,12.2509345 7.50847393,11.8614991 L7.6,11.8 L11.6,8.8 C12.0977778,8.42666667 12.130963,7.70488889 11.6995556,7.2850963 L11.6,7.2 L7.6,4.2 Z\"></path></svg>";

	var profile = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M1 15c0-2.761 3.134-5 7-5s7 2.239 7 5M8 7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z\"></path></g></svg>\n";

	var profileFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,9 C12.3599467,9 16,11.6000381 16,15 C16,15.5128358 15.6139598,15.9355072 15.1166211,15.9932723 L15,16 L1,16 C0.44771525,16 0,15.5522847 0,15 C0,11.6000381 3.64005335,9 8,9 Z M8,0 C10.209139,0 12,1.790861 12,4 C12,6.209139 10.209139,8 8,8 C5.790861,8 4,6.209139 4,4 C4,1.790861 5.790861,0 8,0 Z\"></path></svg>";

	var refresh = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"16px\" height=\"16px\" viewBox=\"0 0 16 16\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <defs/>\n    <g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g fill=\"currentColor\">\n            <g>\n                <path d=\"M0,8 C0,12.418278 3.581722,16 8,16 C12.418278,16 16,12.418278 16,8 C16,4.89580324 14.2154684,2.11256098 11.4682644,0.789110134 L10.6002482,2.59092808 C12.661769,3.58405472 14,5.6712248 14,8 C14,11.3137085 11.3137085,14 8,14 C4.6862915,14 2,11.3137085 2,8 C2,5.65296151 3.35941993,3.55225774 5.44569583,2.56903563 L4.59307587,0.759881355 C1.81273067,2.07020511 0,4.87140735 0,8 Z\" />\n                <polygon points=\"7 8.58578644 7 0 9 0 9 8.58578644 10.2928932 7.29289322 11 6.58578644 12.4142136 8 11.7071068 8.70710678 8.70710678 11.7071068 8 12.4142136 7.64644661 12.0606602 7.29289322 11.7071068 4.29289322 8.70710678 3.58578644 8 5 6.58578644 5.70710678 7.29289322\"/>\n            </g>\n        </g>\n    </g>\n</svg>";

	var reply = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\">\n  <path fill=\"currentColor\" fill-rule=\"nonzero\" d=\"M6.422 5.422c2 0 3.542.417 4.625 1.25 1.083.833 1.875 1.75 2.375 2.75s.792 1.917.875 2.75l.125 1.25h-2l-.094-.938c-.062-.625-.281-1.312-.656-2.062-.375-.75-.969-1.438-1.781-2.063-.813-.625-1.97-.937-3.47-.937H4.829l2 2-1.406 1.422L1 6.422 5.422 2l1.406 1.422-2 2h1.594z\"/>\n</svg>\n";

	var restricted = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,0 C9.68208046,0 11.3461433,0.680204408 12.7173184,1.76574326 L12.7968302,1.82941136 L13.0821869,2.07021798 L13.0821869,2.07021798 L13.3921258,2.35532672 L13.3921258,2.35532672 L13.5196418,2.4804269 L13.5196418,2.4804269 L13.6802379,2.64503003 L13.6802379,2.64503003 L13.9230383,2.91014998 L13.9230383,2.91014998 L14.2342567,3.28268159 C15.3197956,4.65385675 16,6.31791954 16,8 C16,12.0522847 12.0522847,16 8,16 C6.31791954,16 4.65385675,15.3197956 3.28268159,14.2342567 L3.22655228,14.1894621 C3.11728724,14.1015615 3.00992829,14.0110805 2.90461703,13.9181609 L2.77356586,13.8003012 L2.77356586,13.8003012 L2.60704997,13.6438799 L2.60704997,13.6438799 L2.47549501,13.5147055 L2.47549501,13.5147055 L2.3227975,13.3581572 L2.3227975,13.3581572 L2.07024759,13.082218 L2.07024759,13.082218 L1.76574326,12.7173184 C0.680204408,11.3461433 0,9.68208046 0,8 C0,3.94771525 3.94771525,0 8,0 Z M12.7649054,4.65130747 L4.65130747,12.7649054 C5.65399996,13.523368 6.83516455,14 8,14 C10.9477153,14 14,10.9477153 14,8 C14,6.83516455 13.523368,5.65399996 12.7649054,4.65130747 Z M8,2 C5.05228475,2 2,5.05228475 2,8 C2,9.1652227 2.47694891,10.3467854 3.23585116,11.3496925 L11.3496925,3.23585116 C10.3467854,2.47694891 9.1652227,2 8,2 Z\"></path></svg>";

	var search$2 = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M6,7.74491582e-13 C9.3137085,7.74491582e-13 12,2.6862915 12,6 C12,7.29898246 11.5846266,8.5351264 10.8252219,9.56391425 L10.8900586,9.47439923 L15.7071068,14.2928932 C16.0976311,14.6834175 16.0976311,15.3165825 15.7071068,15.7071068 C15.3466228,16.0675907 14.7793918,16.0953203 14.3871006,15.7902954 L14.2928932,15.7071068 L9.47512648,10.8918743 L9.53331766,10.8499347 C8.52109315,11.5886903 7.29230116,12 6,12 C2.6862915,12 0,9.3137085 0,6 C0,2.6862915 2.6862915,7.74491582e-13 6,7.74491582e-13 Z M6,2 C3.790861,2 2,3.790861 2,6 C2,8.209139 3.790861,10 6,10 C6.99932461,10 7.93836334,9.63301144 8.65132683,8.99699272 L8.81176823,8.84548807 L8.96107603,8.68929627 C9.62604013,7.95767293 10,7.00931223 10,6 C10,3.790861 8.209139,2 6,2 Z\"></path></svg>";

	var settings = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M13,10 C14.6568542,10 16,11.3431458 16,13 C16,14.6568542 14.6568542,16 13,16 C11.6882004,16 10.5730503,15.1580438 10.1654654,13.9850473 L10.1166211,13.9932723 L10,14 L1,14 C0.44771525,14 0,13.5522847 0,13 C0,12.4871642 0.38604019,12.0644928 0.883378875,12.0067277 L1,12 L10,12 C10.0565551,12 10.1120136,12.0046948 10.1660072,12.013716 C10.5730503,10.8419562 11.6882004,10 13,10 Z M13,12 C12.4477153,12 12,12.4477153 12,13 C12,13.5522847 12.4477153,14 13,14 C13.5522847,14 14,13.5522847 14,13 C14,12.4477153 13.5522847,12 13,12 Z M3,0 C4.31179956,0 5.42694971,0.841956184 5.83453458,2.01495267 L5.88337887,2.00672773 L6,2 L15,2 C15.5522847,2 16,2.44771525 16,3 C16,3.51283584 15.6139598,3.93550716 15.1166211,3.99327227 L15,4 L6,4 C5.94344492,4 5.88798638,3.99530518 5.83399285,3.98628401 C5.42694971,5.15804382 4.31179956,6 3,6 C1.34314575,6 0,4.65685425 0,3 C0,1.34314575 1.34314575,0 3,0 Z M3,2 C2.44771525,2 2,2.44771525 2,3 C2,3.55228475 2.44771525,4 3,4 C3.55228475,4 4,3.55228475 4,3 C4,2.44771525 3.55228475,2 3,2 Z\"></path></svg>";

	var share = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M15,9 C15.5128358,9 15.9355072,9.38604019 15.9932723,9.88337887 L16,10 L16,15 C16,15.5128358 15.6139598,15.9355072 15.1166211,15.9932723 L15,16 L1,16 C0.487164161,16 0.0644928393,15.6139598 0.00672773133,15.1166211 L0,15 L0,10 C0,9.44771525 0.44771525,9 1,9 C1.51283584,9 1.93550716,9.38604019 1.99327227,9.88337887 L2,10 L2,14 L14,14 L14,10 C14,9.48716416 14.3860402,9.06449284 14.8833789,9.00672773 L15,9 Z M8.61289944,0.209704612 L8.70710678,0.292893219 L12.7071068,4.29289322 C13.0976311,4.68341751 13.0976311,5.31658249 12.7071068,5.70710678 C12.3466228,6.06759074 11.7793918,6.09532028 11.3871006,5.79029539 L11.2928932,5.70710678 L9,3.415 L9,11 C9,11.5522847 8.55228475,12 8,12 C7.48716416,12 7.06449284,11.6139598 7.00672773,11.1166211 L7,11 L7,3.415 L4.70710678,5.70710678 C4.34662282,6.06759074 3.77939176,6.09532028 3.38710056,5.79029539 L3.29289322,5.70710678 C2.93240926,5.34662282 2.90467972,4.77939176 3.20970461,4.38710056 L3.29289322,4.29289322 L7.29289322,0.292893219 C7.62333685,-0.0375504127 8.12750547,-0.0883878944 8.51140295,0.140380774 L8.61289944,0.209704612 Z\"></path></svg>";

	var show = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,2 C12.3599467,2 16,4.6000381 16,8 C16,11.3999619 12.3599467,14 8,14 C3.64005335,14 0,11.3999619 0,8 C0,4.6000381 3.64005335,2 8,2 Z M8,4 C4.62796016,4 2,5.8771144 2,8 C2,10.1228856 4.62796016,12 8,12 C11.3720398,12 14,10.1228856 14,8 C14,5.8771144 11.3720398,4 8,4 Z M8,6 C9.1045695,6 10,6.8954305 10,8 C10,9.1045695 9.1045695,10 8,10 C6.8954305,10 6,9.1045695 6,8 C6,6.8954305 6.8954305,6 8,6 Z\"></path></svg>";

	var showFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,2 C12.3599467,2 16,4.6000381 16,8 C16,11.3999619 12.3599467,14 8,14 C3.64005335,14 0,11.3999619 0,8 C0,4.6000381 3.64005335,2 8,2 Z M8,5 C6.34314575,5 5,6.34314575 5,8 C5,9.65685425 6.34314575,11 8,11 C9.65685425,11 11,9.65685425 11,8 C11,6.34314575 9.65685425,5 8,5 Z\"></path></svg>";

	var socialFacebook = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M15.999 8.049c0-4.445-3.582-8.049-8-8.049S0 3.604 0 8.049C0 12.066 2.925 15.396 6.75 16v-5.624H4.717V8.049H6.75V6.276c0-2.018 1.195-3.132 3.022-3.132.875 0 1.79.157 1.79.157v1.981h-1.008c-.994 0-1.304.62-1.304 1.257v1.51h2.219l-.355 2.327H9.25V16c3.825-.604 6.75-3.934 6.75-7.951z\"></path></g></svg>";

	var socialTwitter = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"currentColor\" stroke=\"none\" d=\"M15.969 3.049c-.59.259-1.22.436-1.884.516a3.305 3.305 0 0 0 1.442-1.815c-.634.37-1.336.64-2.084.79a3.28 3.28 0 0 0-5.59 2.988 9.29 9.29 0 0 1-6.76-3.418A3.214 3.214 0 0 0 .65 3.76c0 1.14.58 2.142 1.459 2.73a3.27 3.27 0 0 1-1.485-.41v.04a3.282 3.282 0 0 0 2.63 3.218 3.33 3.33 0 0 1-1.474.057 3.291 3.291 0 0 0 3.069 2.278A6.578 6.578 0 0 1 .78 13.076c-.26 0-.52-.015-.78-.044a9.33 9.33 0 0 0 5.038 1.472c6.036 0 9.332-4.997 9.332-9.323 0-.14 0-.28-.01-.42.64-.46 1.2-1.04 1.64-1.7l-.031-.012z\"></path></g></svg>";

	var sort = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 9V2v7zM1 5l4-4 4 4m2 2v7-7zm-4 4l4 4 4-4\"></path></g></svg>\n";

	var tag = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M7,3.95905531e-13 C7.20185262,3.95905531e-13 7.39798776,0.0610543386 7.56325188,0.173711952 L7.65850461,0.247423305 L15.6585046,7.24742331 C16.0132096,7.55779017 16.0991779,8.06835747 15.880849,8.47356796 L15.8137335,8.58123819 L10.8137335,15.5812382 C10.4929736,16.030302 9.8764296,16.1291156 9.43434479,15.824813 L9.33563616,15.7474093 L0.335636161,7.74740932 C0.152646135,7.58475152 0.0367634639,7.36167496 0.00738861958,7.12138148 L0,7 L0,1 C0,0.487164161 0.38604019,0.0644928393 0.883378875,0.00672773133 L1,3.95905531e-13 L7,3.95905531e-13 Z M6.624,2 L2,2 L2,6.551 L9.833,13.513 L13.659,8.155 L6.624,2 Z M5,3 C6.1045695,3 7,3.8954305 7,5 C7,6.1045695 6.1045695,7 5,7 C3.8954305,7 3,6.1045695 3,5 C3,3.8954305 3.8954305,3 5,3 Z\"></path></svg>";

	var tagFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M7,-2.4158453e-13 C7.20185262,-2.4158453e-13 7.39798776,0.0610543386 7.56325188,0.173711952 L7.65850461,0.247423305 L15.6585046,7.24742331 C16.0132096,7.55779017 16.0991779,8.06835747 15.880849,8.47356796 L15.8137335,8.58123819 L10.8137335,15.5812382 C10.4929736,16.030302 9.8764296,16.1291156 9.43434479,15.824813 L9.33563616,15.7474093 L0.335636161,7.74740932 C0.152646135,7.58475152 0.0367634639,7.36167496 0.00738861958,7.12138148 L0,7 L0,1 C0,0.487164161 0.38604019,0.0644928393 0.883378875,0.00672773133 L1,-2.4158453e-13 L7,-2.4158453e-13 Z M5,3 C3.8954305,3 3,3.8954305 3,5 C3,6.1045695 3.8954305,7 5,7 C6.1045695,7 7,6.1045695 7,5 C7,3.8954305 6.1045695,3 5,3 Z\"></path></svg>";

	var tagAltFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M5,3 C7.76142375,3 10,5.23857625 10,8 C10,10.7614237 7.76142375,13 5,13 C2.23857625,13 0,10.7614237 0,8 C0,5.23857625 2.23857625,3 5,3 Z M11,3 C13.7614237,3 16,5.23857625 16,8 C16,10.7614237 13.7614237,13 11,13 C10.4477153,13 10,12.5522847 10,12 C10,11.4871642 10.3860402,11.0644928 10.8833789,11.0067277 L11,11 C12.6568542,11 14,9.65685425 14,8 C14,6.34314575 12.6568542,5 11,5 C10.4477153,5 10,4.55228475 10,4 C10,3.44771525 10.4477153,3 11,3 Z\"></path></svg>";

	var theme = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M8,12 C8.51283584,12 8.93550716,12.3860402 8.99327227,12.8833789 L9,13 L9,15 C9,15.5522847 8.55228475,16 8,16 C7.48716416,16 7.06449284,15.6139598 7.00672773,15.1166211 L7,15 L7,13 C7,12.4477153 7.44771525,12 8,12 Z M5.17157288,10.8284271 C5.53420257,11.1910568 5.5601047,11.7629022 5.24927924,12.1554199 L5.17157288,12.2426407 L3.75735931,13.6568542 C3.36683502,14.0473785 2.73367004,14.0473785 2.34314575,13.6568542 C1.98051605,13.2942246 1.95461393,12.7223792 2.26543939,12.3298615 L2.34314575,12.2426407 L3.75735931,10.8284271 C4.1478836,10.4379028 4.78104858,10.4379028 5.17157288,10.8284271 Z M12.1554199,10.7507208 L12.2426407,10.8284271 L13.6568542,12.2426407 C14.0473785,12.633165 14.0473785,13.26633 13.6568542,13.6568542 C13.2942246,14.0194839 12.7223792,14.0453861 12.3298615,13.7345606 L12.2426407,13.6568542 L10.8284271,12.2426407 C10.4379028,11.8521164 10.4379028,11.2189514 10.8284271,10.8284271 C11.1910568,10.4657974 11.7629022,10.4398953 12.1554199,10.7507208 Z M8,5 C9.55228475,5 11,6.44771525 11,8 C11,9.55228475 9.55228475,11 8,11 C6.44771525,11 5,9.55228475 5,8 C5,6.44771525 6.44771525,5 8,5 Z M15,7 C15.5522847,7 16,7.44771525 16,8 C16,8.51283584 15.6139598,8.93550716 15.1166211,8.99327227 L15,9 L13,9 C12.4477153,9 12,8.55228475 12,8 C12,7.48716416 12.3860402,7.06449284 12.8833789,7.00672773 L13,7 L15,7 Z M3,7 C3.55228475,7 4,7.44771525 4,8 C4,8.51283584 3.61395981,8.93550716 3.11662113,8.99327227 L3,9 L1,9 C0.44771525,9 0,8.55228475 0,8 C0,7.48716416 0.38604019,7.06449284 0.883378875,7.00672773 L1,7 L3,7 Z M13.6568542,2.34314575 C14.0194839,2.70577545 14.0453861,3.27762084 13.7345606,3.6701385 L13.6568542,3.75735931 L12.2426407,5.17157288 C11.8521164,5.56209717 11.2189514,5.56209717 10.8284271,5.17157288 C10.4657974,4.80894318 10.4398953,4.23709778 10.7507208,3.84458013 L10.8284271,3.75735931 L12.2426407,2.34314575 C12.633165,1.95262146 13.26633,1.95262146 13.6568542,2.34314575 Z M3.6701385,2.26543939 L3.75735931,2.34314575 L5.17157288,3.75735931 C5.56209717,4.1478836 5.56209717,4.78104858 5.17157288,5.17157288 C4.80894318,5.53420257 4.23709778,5.5601047 3.84458013,5.24927924 L3.75735931,5.17157288 L2.34314575,3.75735931 C1.95262146,3.36683502 1.95262146,2.73367004 2.34314575,2.34314575 C2.70577545,1.98051605 3.27762084,1.95461393 3.6701385,2.26543939 Z M8,0 C8.51283584,0 8.93550716,0.38604019 8.99327227,0.883378875 L9,1 L9,3 C9,3.55228475 8.55228475,4 8,4 C7.48716416,4 7.06449284,3.61395981 7.00672773,3.11662113 L7,3 L7,1 C7,0.44771525 7.44771525,0 8,0 Z\"></path></svg>";

	var trash = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><g fill-rule=\"evenodd\"><rect fill=\"none\" stroke=\"none\" x=\"0\" y=\"0\" width=\"16\" height=\"16\"></rect><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 4h12l-2 11H4L2 4zM1 1h14H1z\"></path></g></svg>\n";

	var trashFilled = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M14,4 C14.591606,4 15.0445613,4.50741385 14.9968959,5.08070942 L14.9805807,5.19611614 L12.9805807,15.1961161 C12.8948862,15.6245883 12.5428826,15.9430139 12.1176446,15.9931093 L12,16 L4,16 C3.5630424,16 3.18176682,15.7172804 3.04924818,15.3101248 L3.01941932,15.1961161 L1.01941932,5.19611614 C0.903395838,4.6159987 1.31212423,4.07232751 1.88363472,4.00663469 L2,4 L14,4 Z M15,0 C15.5522847,0 16,0.44771525 16,1 C16,1.55228475 15.5522847,2 15,2 L1,2 C0.44771525,2 0,1.55228475 0,1 C0,0.44771525 0.44771525,0 1,0 L15,0 Z\"></path></svg>";

	// @ts-nocheck

	var annotateIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\">\n  <path fill=\"currentColor\" fill-rule=\"nonzero\" d=\"M15 0c.27 0 .505.099.703.297A.961.961 0 0116 1v15l-4-3H1a.974.974 0 01-.703-.29A.953.953 0 010 12V1C0 .719.096.482.29.29A.966.966 0 011 0h14zM7 3l-.469.063c-.312.041-.656.187-1.031.437-.375.25-.719.646-1.031 1.188C4.156 5.229 4 6 4 7l.002.063.006.062a.896.896 0 01.008.11l-.002.074-.006.066a1.447 1.447 0 00.43 1.188C4.729 8.854 5.082 9 5.5 9c.417 0 .77-.146 1.063-.438C6.854 8.271 7 7.918 7 7.5c0-.417-.146-.77-.438-1.063A1.447 1.447 0 005.5 6c-.073 0-.146.005-.219.016-.073.01-.14.026-.203.046.177-1.03.542-1.632 1.094-1.804L7 4V3zm5 0l-.469.063c-.312.041-.656.187-1.031.437-.375.25-.719.646-1.031 1.188C9.156 5.229 9 6 9 7l.002.063.006.062a.896.896 0 01.008.11l-.002.074-.006.066a1.447 1.447 0 00.43 1.188c.291.291.645.437 1.062.437.417 0 .77-.146 1.063-.438.291-.291.437-.645.437-1.062 0-.417-.146-.77-.438-1.063A1.447 1.447 0 0010.5 6c-.073 0-.146.005-.219.016-.073.01-.14.026-.203.046.177-1.03.542-1.632 1.094-1.804L12 4V3z\"/>\n</svg>\n";

	var pointerIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"15\" height=\"8\" viewBox=\"0 0 15 8\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M0 8 L7 0 L15 8\" stroke=\"currentColor\" strokeWidth=\"2\" /></svg>\n";

	// @ts-nocheck

	/**
	 * Set of icons used by the annotator part of the application via the `Icon`
	 * component.
	 */
	const annotatorIcons = {
	  annotate: annotateIcon,
	  cancel,
	  caution,
	  'caret-left': caretLeft,
	  'caret-right': caretRight,
	  hide,
	  highlight,
	  note,
	  pointer: pointerIcon,
	  show
	};

	function _AsyncGenerator(gen) {
	  var front, back;
	  function resume(key, arg) {
	    try {
	      var result = gen[key](arg),
	        value = result.value,
	        overloaded = value instanceof _OverloadYield;
	      Promise.resolve(overloaded ? value.v : value).then(function (arg) {
	        if (overloaded) {
	          var nextKey = "return" === key ? "return" : "next";
	          if (!value.k || arg.done) return resume(nextKey, arg);
	          arg = gen[nextKey](arg).value;
	        }
	        settle(result.done ? "return" : "normal", arg);
	      }, function (err) {
	        resume("throw", err);
	      });
	    } catch (err) {
	      settle("throw", err);
	    }
	  }
	  function settle(type, value) {
	    switch (type) {
	      case "return":
	        front.resolve({
	          value: value,
	          done: !0
	        });
	        break;
	      case "throw":
	        front.reject(value);
	        break;
	      default:
	        front.resolve({
	          value: value,
	          done: !1
	        });
	    }
	    (front = front.next) ? resume(front.key, front.arg) : back = null;
	  }
	  this._invoke = function (key, arg) {
	    return new Promise(function (resolve, reject) {
	      var request = {
	        key: key,
	        arg: arg,
	        resolve: resolve,
	        reject: reject,
	        next: null
	      };
	      back ? back = back.next = request : (front = back = request, resume(key, arg));
	    });
	  }, "function" != typeof gen.return && (this.return = void 0);
	}
	_AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function () {
	  return this;
	}, _AsyncGenerator.prototype.next = function (arg) {
	  return this._invoke("next", arg);
	}, _AsyncGenerator.prototype.throw = function (arg) {
	  return this._invoke("throw", arg);
	}, _AsyncGenerator.prototype.return = function (arg) {
	  return this._invoke("return", arg);
	};
	function _OverloadYield(value, kind) {
	  this.v = value, this.k = kind;
	}
	function old_createMetadataMethodsForProperty(metadataMap, kind, property, decoratorFinishedRef) {
	  return {
	    getMetadata: function (key) {
	      old_assertNotFinished(decoratorFinishedRef, "getMetadata"), old_assertMetadataKey(key);
	      var metadataForKey = metadataMap[key];
	      if (void 0 !== metadataForKey) if (1 === kind) {
	        var pub = metadataForKey.public;
	        if (void 0 !== pub) return pub[property];
	      } else if (2 === kind) {
	        var priv = metadataForKey.private;
	        if (void 0 !== priv) return priv.get(property);
	      } else if (Object.hasOwnProperty.call(metadataForKey, "constructor")) return metadataForKey.constructor;
	    },
	    setMetadata: function (key, value) {
	      old_assertNotFinished(decoratorFinishedRef, "setMetadata"), old_assertMetadataKey(key);
	      var metadataForKey = metadataMap[key];
	      if (void 0 === metadataForKey && (metadataForKey = metadataMap[key] = {}), 1 === kind) {
	        var pub = metadataForKey.public;
	        void 0 === pub && (pub = metadataForKey.public = {}), pub[property] = value;
	      } else if (2 === kind) {
	        var priv = metadataForKey.priv;
	        void 0 === priv && (priv = metadataForKey.private = new Map()), priv.set(property, value);
	      } else metadataForKey.constructor = value;
	    }
	  };
	}
	function old_convertMetadataMapToFinal(obj, metadataMap) {
	  var parentMetadataMap = obj[Symbol.metadata || Symbol.for("Symbol.metadata")],
	    metadataKeys = Object.getOwnPropertySymbols(metadataMap);
	  if (0 !== metadataKeys.length) {
	    for (var i = 0; i < metadataKeys.length; i++) {
	      var key = metadataKeys[i],
	        metaForKey = metadataMap[key],
	        parentMetaForKey = parentMetadataMap ? parentMetadataMap[key] : null,
	        pub = metaForKey.public,
	        parentPub = parentMetaForKey ? parentMetaForKey.public : null;
	      pub && parentPub && Object.setPrototypeOf(pub, parentPub);
	      var priv = metaForKey.private;
	      if (priv) {
	        var privArr = Array.from(priv.values()),
	          parentPriv = parentMetaForKey ? parentMetaForKey.private : null;
	        parentPriv && (privArr = privArr.concat(parentPriv)), metaForKey.private = privArr;
	      }
	      parentMetaForKey && Object.setPrototypeOf(metaForKey, parentMetaForKey);
	    }
	    parentMetadataMap && Object.setPrototypeOf(metadataMap, parentMetadataMap), obj[Symbol.metadata || Symbol.for("Symbol.metadata")] = metadataMap;
	  }
	}
	function old_createAddInitializerMethod(initializers, decoratorFinishedRef) {
	  return function (initializer) {
	    old_assertNotFinished(decoratorFinishedRef, "addInitializer"), old_assertCallable(initializer, "An initializer"), initializers.push(initializer);
	  };
	}
	function old_memberDec(dec, name, desc, metadataMap, initializers, kind, isStatic, isPrivate, value) {
	  var kindStr;
	  switch (kind) {
	    case 1:
	      kindStr = "accessor";
	      break;
	    case 2:
	      kindStr = "method";
	      break;
	    case 3:
	      kindStr = "getter";
	      break;
	    case 4:
	      kindStr = "setter";
	      break;
	    default:
	      kindStr = "field";
	  }
	  var metadataKind,
	    metadataName,
	    ctx = {
	      kind: kindStr,
	      name: isPrivate ? "#" + name : name,
	      isStatic: isStatic,
	      isPrivate: isPrivate
	    },
	    decoratorFinishedRef = {
	      v: !1
	    };
	  if (0 !== kind && (ctx.addInitializer = old_createAddInitializerMethod(initializers, decoratorFinishedRef)), isPrivate) {
	    metadataKind = 2, metadataName = Symbol(name);
	    var access = {};
	    0 === kind ? (access.get = desc.get, access.set = desc.set) : 2 === kind ? access.get = function () {
	      return desc.value;
	    } : (1 !== kind && 3 !== kind || (access.get = function () {
	      return desc.get.call(this);
	    }), 1 !== kind && 4 !== kind || (access.set = function (v) {
	      desc.set.call(this, v);
	    })), ctx.access = access;
	  } else metadataKind = 1, metadataName = name;
	  try {
	    return dec(value, Object.assign(ctx, old_createMetadataMethodsForProperty(metadataMap, metadataKind, metadataName, decoratorFinishedRef)));
	  } finally {
	    decoratorFinishedRef.v = !0;
	  }
	}
	function old_assertNotFinished(decoratorFinishedRef, fnName) {
	  if (decoratorFinishedRef.v) throw new Error("attempted to call " + fnName + " after decoration was finished");
	}
	function old_assertMetadataKey(key) {
	  if ("symbol" != typeof key) throw new TypeError("Metadata keys must be symbols, received: " + key);
	}
	function old_assertCallable(fn, hint) {
	  if ("function" != typeof fn) throw new TypeError(hint + " must be a function");
	}
	function old_assertValidReturnValue(kind, value) {
	  var type = typeof value;
	  if (1 === kind) {
	    if ("object" !== type || null === value) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
	    void 0 !== value.get && old_assertCallable(value.get, "accessor.get"), void 0 !== value.set && old_assertCallable(value.set, "accessor.set"), void 0 !== value.init && old_assertCallable(value.init, "accessor.init"), void 0 !== value.initializer && old_assertCallable(value.initializer, "accessor.initializer");
	  } else if ("function" !== type) {
	    var hint;
	    throw hint = 0 === kind ? "field" : 10 === kind ? "class" : "method", new TypeError(hint + " decorators must return a function or void 0");
	  }
	}
	function old_getInit(desc) {
	  var initializer;
	  return null == (initializer = desc.init) && (initializer = desc.initializer) && "undefined" != typeof console && console.warn(".initializer has been renamed to .init as of March 2022"), initializer;
	}
	function old_applyMemberDec(ret, base, decInfo, name, kind, isStatic, isPrivate, metadataMap, initializers) {
	  var desc,
	    initializer,
	    value,
	    newValue,
	    get,
	    set,
	    decs = decInfo[0];
	  if (isPrivate ? desc = 0 === kind || 1 === kind ? {
	    get: decInfo[3],
	    set: decInfo[4]
	  } : 3 === kind ? {
	    get: decInfo[3]
	  } : 4 === kind ? {
	    set: decInfo[3]
	  } : {
	    value: decInfo[3]
	  } : 0 !== kind && (desc = Object.getOwnPropertyDescriptor(base, name)), 1 === kind ? value = {
	    get: desc.get,
	    set: desc.set
	  } : 2 === kind ? value = desc.value : 3 === kind ? value = desc.get : 4 === kind && (value = desc.set), "function" == typeof decs) void 0 !== (newValue = old_memberDec(decs, name, desc, metadataMap, initializers, kind, isStatic, isPrivate, value)) && (old_assertValidReturnValue(kind, newValue), 0 === kind ? initializer = newValue : 1 === kind ? (initializer = old_getInit(newValue), get = newValue.get || value.get, set = newValue.set || value.set, value = {
	    get: get,
	    set: set
	  }) : value = newValue);else for (var i = decs.length - 1; i >= 0; i--) {
	    var newInit;
	    if (void 0 !== (newValue = old_memberDec(decs[i], name, desc, metadataMap, initializers, kind, isStatic, isPrivate, value))) old_assertValidReturnValue(kind, newValue), 0 === kind ? newInit = newValue : 1 === kind ? (newInit = old_getInit(newValue), get = newValue.get || value.get, set = newValue.set || value.set, value = {
	      get: get,
	      set: set
	    }) : value = newValue, void 0 !== newInit && (void 0 === initializer ? initializer = newInit : "function" == typeof initializer ? initializer = [initializer, newInit] : initializer.push(newInit));
	  }
	  if (0 === kind || 1 === kind) {
	    if (void 0 === initializer) initializer = function (instance, init) {
	      return init;
	    };else if ("function" != typeof initializer) {
	      var ownInitializers = initializer;
	      initializer = function (instance, init) {
	        for (var value = init, i = 0; i < ownInitializers.length; i++) value = ownInitializers[i].call(instance, value);
	        return value;
	      };
	    } else {
	      var originalInitializer = initializer;
	      initializer = function (instance, init) {
	        return originalInitializer.call(instance, init);
	      };
	    }
	    ret.push(initializer);
	  }
	  0 !== kind && (1 === kind ? (desc.get = value.get, desc.set = value.set) : 2 === kind ? desc.value = value : 3 === kind ? desc.get = value : 4 === kind && (desc.set = value), isPrivate ? 1 === kind ? (ret.push(function (instance, args) {
	    return value.get.call(instance, args);
	  }), ret.push(function (instance, args) {
	    return value.set.call(instance, args);
	  })) : 2 === kind ? ret.push(value) : ret.push(function (instance, args) {
	    return value.call(instance, args);
	  }) : Object.defineProperty(base, name, desc));
	}
	function old_applyMemberDecs(ret, Class, protoMetadataMap, staticMetadataMap, decInfos) {
	  for (var protoInitializers, staticInitializers, existingProtoNonFields = new Map(), existingStaticNonFields = new Map(), i = 0; i < decInfos.length; i++) {
	    var decInfo = decInfos[i];
	    if (Array.isArray(decInfo)) {
	      var base,
	        metadataMap,
	        initializers,
	        kind = decInfo[1],
	        name = decInfo[2],
	        isPrivate = decInfo.length > 3,
	        isStatic = kind >= 5;
	      if (isStatic ? (base = Class, metadataMap = staticMetadataMap, 0 !== (kind -= 5) && (initializers = staticInitializers = staticInitializers || [])) : (base = Class.prototype, metadataMap = protoMetadataMap, 0 !== kind && (initializers = protoInitializers = protoInitializers || [])), 0 !== kind && !isPrivate) {
	        var existingNonFields = isStatic ? existingStaticNonFields : existingProtoNonFields,
	          existingKind = existingNonFields.get(name) || 0;
	        if (!0 === existingKind || 3 === existingKind && 4 !== kind || 4 === existingKind && 3 !== kind) throw new Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + name);
	        !existingKind && kind > 2 ? existingNonFields.set(name, kind) : existingNonFields.set(name, !0);
	      }
	      old_applyMemberDec(ret, base, decInfo, name, kind, isStatic, isPrivate, metadataMap, initializers);
	    }
	  }
	  old_pushInitializers(ret, protoInitializers), old_pushInitializers(ret, staticInitializers);
	}
	function old_pushInitializers(ret, initializers) {
	  initializers && ret.push(function (instance) {
	    for (var i = 0; i < initializers.length; i++) initializers[i].call(instance);
	    return instance;
	  });
	}
	function old_applyClassDecs(ret, targetClass, metadataMap, classDecs) {
	  if (classDecs.length > 0) {
	    for (var initializers = [], newClass = targetClass, name = targetClass.name, i = classDecs.length - 1; i >= 0; i--) {
	      var decoratorFinishedRef = {
	        v: !1
	      };
	      try {
	        var ctx = Object.assign({
	            kind: "class",
	            name: name,
	            addInitializer: old_createAddInitializerMethod(initializers, decoratorFinishedRef)
	          }, old_createMetadataMethodsForProperty(metadataMap, 0, name, decoratorFinishedRef)),
	          nextNewClass = classDecs[i](newClass, ctx);
	      } finally {
	        decoratorFinishedRef.v = !0;
	      }
	      void 0 !== nextNewClass && (old_assertValidReturnValue(10, nextNewClass), newClass = nextNewClass);
	    }
	    ret.push(newClass, function () {
	      for (var i = 0; i < initializers.length; i++) initializers[i].call(newClass);
	    });
	  }
	}
	function _applyDecs(targetClass, memberDecs, classDecs) {
	  var ret = [],
	    staticMetadataMap = {},
	    protoMetadataMap = {};
	  return old_applyMemberDecs(ret, targetClass, protoMetadataMap, staticMetadataMap, memberDecs), old_convertMetadataMapToFinal(targetClass.prototype, protoMetadataMap), old_applyClassDecs(ret, targetClass, staticMetadataMap, classDecs), old_convertMetadataMapToFinal(targetClass, staticMetadataMap), ret;
	}
	function createAddInitializerMethod(initializers, decoratorFinishedRef) {
	  return function (initializer) {
	    assertNotFinished(decoratorFinishedRef, "addInitializer"), assertCallable(initializer, "An initializer"), initializers.push(initializer);
	  };
	}
	function memberDec(dec, name, desc, initializers, kind, isStatic, isPrivate, value) {
	  var kindStr;
	  switch (kind) {
	    case 1:
	      kindStr = "accessor";
	      break;
	    case 2:
	      kindStr = "method";
	      break;
	    case 3:
	      kindStr = "getter";
	      break;
	    case 4:
	      kindStr = "setter";
	      break;
	    default:
	      kindStr = "field";
	  }
	  var get,
	    set,
	    ctx = {
	      kind: kindStr,
	      name: isPrivate ? "#" + name : name,
	      static: isStatic,
	      private: isPrivate
	    },
	    decoratorFinishedRef = {
	      v: !1
	    };
	  0 !== kind && (ctx.addInitializer = createAddInitializerMethod(initializers, decoratorFinishedRef)), 0 === kind ? isPrivate ? (get = desc.get, set = desc.set) : (get = function () {
	    return this[name];
	  }, set = function (v) {
	    this[name] = v;
	  }) : 2 === kind ? get = function () {
	    return desc.value;
	  } : (1 !== kind && 3 !== kind || (get = function () {
	    return desc.get.call(this);
	  }), 1 !== kind && 4 !== kind || (set = function (v) {
	    desc.set.call(this, v);
	  })), ctx.access = get && set ? {
	    get: get,
	    set: set
	  } : get ? {
	    get: get
	  } : {
	    set: set
	  };
	  try {
	    return dec(value, ctx);
	  } finally {
	    decoratorFinishedRef.v = !0;
	  }
	}
	function assertNotFinished(decoratorFinishedRef, fnName) {
	  if (decoratorFinishedRef.v) throw new Error("attempted to call " + fnName + " after decoration was finished");
	}
	function assertCallable(fn, hint) {
	  if ("function" != typeof fn) throw new TypeError(hint + " must be a function");
	}
	function assertValidReturnValue(kind, value) {
	  var type = typeof value;
	  if (1 === kind) {
	    if ("object" !== type || null === value) throw new TypeError("accessor decorators must return an object with get, set, or init properties or void 0");
	    void 0 !== value.get && assertCallable(value.get, "accessor.get"), void 0 !== value.set && assertCallable(value.set, "accessor.set"), void 0 !== value.init && assertCallable(value.init, "accessor.init");
	  } else if ("function" !== type) {
	    var hint;
	    throw hint = 0 === kind ? "field" : 10 === kind ? "class" : "method", new TypeError(hint + " decorators must return a function or void 0");
	  }
	}
	function applyMemberDec(ret, base, decInfo, name, kind, isStatic, isPrivate, initializers) {
	  var desc,
	    init,
	    value,
	    newValue,
	    get,
	    set,
	    decs = decInfo[0];
	  if (isPrivate ? desc = 0 === kind || 1 === kind ? {
	    get: decInfo[3],
	    set: decInfo[4]
	  } : 3 === kind ? {
	    get: decInfo[3]
	  } : 4 === kind ? {
	    set: decInfo[3]
	  } : {
	    value: decInfo[3]
	  } : 0 !== kind && (desc = Object.getOwnPropertyDescriptor(base, name)), 1 === kind ? value = {
	    get: desc.get,
	    set: desc.set
	  } : 2 === kind ? value = desc.value : 3 === kind ? value = desc.get : 4 === kind && (value = desc.set), "function" == typeof decs) void 0 !== (newValue = memberDec(decs, name, desc, initializers, kind, isStatic, isPrivate, value)) && (assertValidReturnValue(kind, newValue), 0 === kind ? init = newValue : 1 === kind ? (init = newValue.init, get = newValue.get || value.get, set = newValue.set || value.set, value = {
	    get: get,
	    set: set
	  }) : value = newValue);else for (var i = decs.length - 1; i >= 0; i--) {
	    var newInit;
	    if (void 0 !== (newValue = memberDec(decs[i], name, desc, initializers, kind, isStatic, isPrivate, value))) assertValidReturnValue(kind, newValue), 0 === kind ? newInit = newValue : 1 === kind ? (newInit = newValue.init, get = newValue.get || value.get, set = newValue.set || value.set, value = {
	      get: get,
	      set: set
	    }) : value = newValue, void 0 !== newInit && (void 0 === init ? init = newInit : "function" == typeof init ? init = [init, newInit] : init.push(newInit));
	  }
	  if (0 === kind || 1 === kind) {
	    if (void 0 === init) init = function (instance, init) {
	      return init;
	    };else if ("function" != typeof init) {
	      var ownInitializers = init;
	      init = function (instance, init) {
	        for (var value = init, i = 0; i < ownInitializers.length; i++) value = ownInitializers[i].call(instance, value);
	        return value;
	      };
	    } else {
	      var originalInitializer = init;
	      init = function (instance, init) {
	        return originalInitializer.call(instance, init);
	      };
	    }
	    ret.push(init);
	  }
	  0 !== kind && (1 === kind ? (desc.get = value.get, desc.set = value.set) : 2 === kind ? desc.value = value : 3 === kind ? desc.get = value : 4 === kind && (desc.set = value), isPrivate ? 1 === kind ? (ret.push(function (instance, args) {
	    return value.get.call(instance, args);
	  }), ret.push(function (instance, args) {
	    return value.set.call(instance, args);
	  })) : 2 === kind ? ret.push(value) : ret.push(function (instance, args) {
	    return value.call(instance, args);
	  }) : Object.defineProperty(base, name, desc));
	}
	function applyMemberDecs(ret, Class, decInfos) {
	  for (var protoInitializers, staticInitializers, existingProtoNonFields = new Map(), existingStaticNonFields = new Map(), i = 0; i < decInfos.length; i++) {
	    var decInfo = decInfos[i];
	    if (Array.isArray(decInfo)) {
	      var base,
	        initializers,
	        kind = decInfo[1],
	        name = decInfo[2],
	        isPrivate = decInfo.length > 3,
	        isStatic = kind >= 5;
	      if (isStatic ? (base = Class, 0 !== (kind -= 5) && (initializers = staticInitializers = staticInitializers || [])) : (base = Class.prototype, 0 !== kind && (initializers = protoInitializers = protoInitializers || [])), 0 !== kind && !isPrivate) {
	        var existingNonFields = isStatic ? existingStaticNonFields : existingProtoNonFields,
	          existingKind = existingNonFields.get(name) || 0;
	        if (!0 === existingKind || 3 === existingKind && 4 !== kind || 4 === existingKind && 3 !== kind) throw new Error("Attempted to decorate a public method/accessor that has the same name as a previously decorated public method/accessor. This is not currently supported by the decorators plugin. Property name was: " + name);
	        !existingKind && kind > 2 ? existingNonFields.set(name, kind) : existingNonFields.set(name, !0);
	      }
	      applyMemberDec(ret, base, decInfo, name, kind, isStatic, isPrivate, initializers);
	    }
	  }
	  pushInitializers(ret, protoInitializers), pushInitializers(ret, staticInitializers);
	}
	function pushInitializers(ret, initializers) {
	  initializers && ret.push(function (instance) {
	    for (var i = 0; i < initializers.length; i++) initializers[i].call(instance);
	    return instance;
	  });
	}
	function applyClassDecs(ret, targetClass, classDecs) {
	  if (classDecs.length > 0) {
	    for (var initializers = [], newClass = targetClass, name = targetClass.name, i = classDecs.length - 1; i >= 0; i--) {
	      var decoratorFinishedRef = {
	        v: !1
	      };
	      try {
	        var nextNewClass = classDecs[i](newClass, {
	          kind: "class",
	          name: name,
	          addInitializer: createAddInitializerMethod(initializers, decoratorFinishedRef)
	        });
	      } finally {
	        decoratorFinishedRef.v = !0;
	      }
	      void 0 !== nextNewClass && (assertValidReturnValue(10, nextNewClass), newClass = nextNewClass);
	    }
	    ret.push(newClass, function () {
	      for (var i = 0; i < initializers.length; i++) initializers[i].call(newClass);
	    });
	  }
	}
	function _applyDecs2203(targetClass, memberDecs, classDecs) {
	  var ret = [];
	  return applyMemberDecs(ret, targetClass, memberDecs), applyClassDecs(ret, targetClass, classDecs), ret;
	}
	function _asyncGeneratorDelegate(inner) {
	  var iter = {},
	    waiting = !1;
	  function pump(key, value) {
	    return waiting = !0, value = new Promise(function (resolve) {
	      resolve(inner[key](value));
	    }), {
	      done: !1,
	      value: new _OverloadYield(value, 1)
	    };
	  }
	  return iter["undefined" != typeof Symbol && Symbol.iterator || "@@iterator"] = function () {
	    return this;
	  }, iter.next = function (value) {
	    return waiting ? (waiting = !1, value) : pump("next", value);
	  }, "function" == typeof inner.throw && (iter.throw = function (value) {
	    if (waiting) throw waiting = !1, value;
	    return pump("throw", value);
	  }), "function" == typeof inner.return && (iter.return = function (value) {
	    return waiting ? (waiting = !1, value) : pump("return", value);
	  }), iter;
	}
	function _asyncIterator(iterable) {
	  var method,
	    async,
	    sync,
	    retry = 2;
	  for ("undefined" != typeof Symbol && (async = Symbol.asyncIterator, sync = Symbol.iterator); retry--;) {
	    if (async && null != (method = iterable[async])) return method.call(iterable);
	    if (sync && null != (method = iterable[sync])) return new AsyncFromSyncIterator(method.call(iterable));
	    async = "@@asyncIterator", sync = "@@iterator";
	  }
	  throw new TypeError("Object is not async iterable");
	}
	function AsyncFromSyncIterator(s) {
	  function AsyncFromSyncIteratorContinuation(r) {
	    if (Object(r) !== r) return Promise.reject(new TypeError(r + " is not an object."));
	    var done = r.done;
	    return Promise.resolve(r.value).then(function (value) {
	      return {
	        value: value,
	        done: done
	      };
	    });
	  }
	  return AsyncFromSyncIterator = function (s) {
	    this.s = s, this.n = s.next;
	  }, AsyncFromSyncIterator.prototype = {
	    s: null,
	    n: null,
	    next: function () {
	      return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
	    },
	    return: function (value) {
	      var ret = this.s.return;
	      return void 0 === ret ? Promise.resolve({
	        value: value,
	        done: !0
	      }) : AsyncFromSyncIteratorContinuation(ret.apply(this.s, arguments));
	    },
	    throw: function (value) {
	      var thr = this.s.return;
	      return void 0 === thr ? Promise.reject(value) : AsyncFromSyncIteratorContinuation(thr.apply(this.s, arguments));
	    }
	  }, new AsyncFromSyncIterator(s);
	}
	function _awaitAsyncGenerator(value) {
	  return new _OverloadYield(value, 0);
	}
	var REACT_ELEMENT_TYPE;
	function _jsx(type, props, key, children) {
	  REACT_ELEMENT_TYPE || (REACT_ELEMENT_TYPE = "function" == typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103);
	  var defaultProps = type && type.defaultProps,
	    childrenLength = arguments.length - 3;
	  if (props || 0 === childrenLength || (props = {
	    children: void 0
	  }), 1 === childrenLength) props.children = children;else if (childrenLength > 1) {
	    for (var childArray = new Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 3];
	    props.children = childArray;
	  }
	  if (props && defaultProps) for (var propName in defaultProps) void 0 === props[propName] && (props[propName] = defaultProps[propName]);else props || (props = defaultProps || {});
	  return {
	    $$typeof: REACT_ELEMENT_TYPE,
	    type: type,
	    key: void 0 === key ? null : "" + key,
	    ref: null,
	    props: props,
	    _owner: null
	  };
	}
	function ownKeys(object, enumerableOnly) {
	  var keys = Object.keys(object);
	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    enumerableOnly && (symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    })), keys.push.apply(keys, symbols);
	  }
	  return keys;
	}
	function _objectSpread2(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = null != arguments[i] ? arguments[i] : {};
	    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
	      _defineProperty(target, key, source[key]);
	    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
	      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	    });
	  }
	  return target;
	}
	function _regeneratorRuntime() {
	  "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
	  _regeneratorRuntime = function () {
	    return exports;
	  };
	  var exports = {},
	    Op = Object.prototype,
	    hasOwn = Op.hasOwnProperty,
	    defineProperty = Object.defineProperty || function (obj, key, desc) {
	      obj[key] = desc.value;
	    },
	    $Symbol = "function" == typeof Symbol ? Symbol : {},
	    iteratorSymbol = $Symbol.iterator || "@@iterator",
	    asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator",
	    toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
	  function define(obj, key, value) {
	    return Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: !0,
	      configurable: !0,
	      writable: !0
	    }), obj[key];
	  }
	  try {
	    define({}, "");
	  } catch (err) {
	    define = function (obj, key, value) {
	      return obj[key] = value;
	    };
	  }
	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator,
	      generator = Object.create(protoGenerator.prototype),
	      context = new Context(tryLocsList || []);
	    return defineProperty(generator, "_invoke", {
	      value: makeInvokeMethod(innerFn, self, context)
	    }), generator;
	  }
	  function tryCatch(fn, obj, arg) {
	    try {
	      return {
	        type: "normal",
	        arg: fn.call(obj, arg)
	      };
	    } catch (err) {
	      return {
	        type: "throw",
	        arg: err
	      };
	    }
	  }
	  exports.wrap = wrap;
	  var ContinueSentinel = {};
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	  var IteratorPrototype = {};
	  define(IteratorPrototype, iteratorSymbol, function () {
	    return this;
	  });
	  var getProto = Object.getPrototypeOf,
	    NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	  NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype);
	  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function (method) {
	      define(prototype, method, function (arg) {
	        return this._invoke(method, arg);
	      });
	    });
	  }
	  function AsyncIterator(generator, PromiseImpl) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if ("throw" !== record.type) {
	        var result = record.arg,
	          value = result.value;
	        return value && "object" == typeof value && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) {
	          invoke("next", value, resolve, reject);
	        }, function (err) {
	          invoke("throw", err, resolve, reject);
	        }) : PromiseImpl.resolve(value).then(function (unwrapped) {
	          result.value = unwrapped, resolve(result);
	        }, function (error) {
	          return invoke("throw", error, resolve, reject);
	        });
	      }
	      reject(record.arg);
	    }
	    var previousPromise;
	    defineProperty(this, "_invoke", {
	      value: function (method, arg) {
	        function callInvokeWithMethodAndArg() {
	          return new PromiseImpl(function (resolve, reject) {
	            invoke(method, arg, resolve, reject);
	          });
	        }
	        return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
	      }
	    });
	  }
	  function makeInvokeMethod(innerFn, self, context) {
	    var state = "suspendedStart";
	    return function (method, arg) {
	      if ("executing" === state) throw new Error("Generator is already running");
	      if ("completed" === state) {
	        if ("throw" === method) throw arg;
	        return doneResult();
	      }
	      for (context.method = method, context.arg = arg;;) {
	        var delegate = context.delegate;
	        if (delegate) {
	          var delegateResult = maybeInvokeDelegate(delegate, context);
	          if (delegateResult) {
	            if (delegateResult === ContinueSentinel) continue;
	            return delegateResult;
	          }
	        }
	        if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) {
	          if ("suspendedStart" === state) throw state = "completed", context.arg;
	          context.dispatchException(context.arg);
	        } else "return" === context.method && context.abrupt("return", context.arg);
	        state = "executing";
	        var record = tryCatch(innerFn, self, context);
	        if ("normal" === record.type) {
	          if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue;
	          return {
	            value: record.arg,
	            done: context.done
	          };
	        }
	        "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg);
	      }
	    };
	  }
	  function maybeInvokeDelegate(delegate, context) {
	    var method = delegate.iterator[context.method];
	    if (undefined === method) {
	      if (context.delegate = null, "throw" === context.method) {
	        if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel;
	        context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method");
	      }
	      return ContinueSentinel;
	    }
	    var record = tryCatch(method, delegate.iterator, context.arg);
	    if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel;
	    var info = record.arg;
	    return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel);
	  }
	  function pushTryEntry(locs) {
	    var entry = {
	      tryLoc: locs[0]
	    };
	    1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry);
	  }
	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal", delete record.arg, entry.completion = record;
	  }
	  function Context(tryLocsList) {
	    this.tryEntries = [{
	      tryLoc: "root"
	    }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0);
	  }
	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) return iteratorMethod.call(iterable);
	      if ("function" == typeof iterable.next) return iterable;
	      if (!isNaN(iterable.length)) {
	        var i = -1,
	          next = function next() {
	            for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next;
	            return next.value = undefined, next.done = !0, next;
	          };
	        return next.next = next;
	      }
	    }
	    return {
	      next: doneResult
	    };
	  }
	  function doneResult() {
	    return {
	      value: undefined,
	      done: !0
	    };
	  }
	  return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", {
	    value: GeneratorFunctionPrototype,
	    configurable: !0
	  }), defineProperty(GeneratorFunctionPrototype, "constructor", {
	    value: GeneratorFunction,
	    configurable: !0
	  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) {
	    var ctor = "function" == typeof genFun && genFun.constructor;
	    return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name));
	  }, exports.mark = function (genFun) {
	    return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun;
	  }, exports.awrap = function (arg) {
	    return {
	      __await: arg
	    };
	  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
	    return this;
	  }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
	    void 0 === PromiseImpl && (PromiseImpl = Promise);
	    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
	    return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) {
	      return result.done ? result.value : iter.next();
	    });
	  }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () {
	    return this;
	  }), define(Gp, "toString", function () {
	    return "[object Generator]";
	  }), exports.keys = function (val) {
	    var object = Object(val),
	      keys = [];
	    for (var key in object) keys.push(key);
	    return keys.reverse(), function next() {
	      for (; keys.length;) {
	        var key = keys.pop();
	        if (key in object) return next.value = key, next.done = !1, next;
	      }
	      return next.done = !0, next;
	    };
	  }, exports.values = values, Context.prototype = {
	    constructor: Context,
	    reset: function (skipTempReset) {
	      if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined);
	    },
	    stop: function () {
	      this.done = !0;
	      var rootRecord = this.tryEntries[0].completion;
	      if ("throw" === rootRecord.type) throw rootRecord.arg;
	      return this.rval;
	    },
	    dispatchException: function (exception) {
	      if (this.done) throw exception;
	      var context = this;
	      function handle(loc, caught) {
	        return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught;
	      }
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i],
	          record = entry.completion;
	        if ("root" === entry.tryLoc) return handle("end");
	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc"),
	            hasFinally = hasOwn.call(entry, "finallyLoc");
	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
	            if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
	          } else {
	            if (!hasFinally) throw new Error("try statement without catch or finally");
	            if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
	          }
	        }
	      }
	    },
	    abrupt: function (type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }
	      finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null);
	      var record = finallyEntry ? finallyEntry.completion : {};
	      return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record);
	    },
	    complete: function (record, afterLoc) {
	      if ("throw" === record.type) throw record.arg;
	      return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel;
	    },
	    finish: function (finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel;
	      }
	    },
	    catch: function (tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if ("throw" === record.type) {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }
	      throw new Error("illegal catch attempt");
	    },
	    delegateYield: function (iterable, resultName, nextLoc) {
	      return this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      }, "next" === this.method && (this.arg = undefined), ContinueSentinel;
	    }
	  }, exports;
	}
	function _typeof(obj) {
	  "@babel/helpers - typeof";

	  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
	    return typeof obj;
	  } : function (obj) {
	    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	  }, _typeof(obj);
	}
	function _wrapRegExp() {
	  _wrapRegExp = function (re, groups) {
	    return new BabelRegExp(re, void 0, groups);
	  };
	  var _super = RegExp.prototype,
	    _groups = new WeakMap();
	  function BabelRegExp(re, flags, groups) {
	    var _this = new RegExp(re, flags);
	    return _groups.set(_this, groups || _groups.get(re)), _setPrototypeOf(_this, BabelRegExp.prototype);
	  }
	  function buildGroups(result, re) {
	    var g = _groups.get(re);
	    return Object.keys(g).reduce(function (groups, name) {
	      var i = g[name];
	      if ("number" == typeof i) groups[name] = result[i];else {
	        for (var k = 0; void 0 === result[i[k]] && k + 1 < i.length;) k++;
	        groups[name] = result[i[k]];
	      }
	      return groups;
	    }, Object.create(null));
	  }
	  return _inherits(BabelRegExp, RegExp), BabelRegExp.prototype.exec = function (str) {
	    var result = _super.exec.call(this, str);
	    if (result) {
	      result.groups = buildGroups(result, this);
	      var indices = result.indices;
	      indices && (indices.groups = buildGroups(indices, this));
	    }
	    return result;
	  }, BabelRegExp.prototype[Symbol.replace] = function (str, substitution) {
	    if ("string" == typeof substitution) {
	      var groups = _groups.get(this);
	      return _super[Symbol.replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) {
	        var group = groups[name];
	        return "$" + (Array.isArray(group) ? group.join("$") : group);
	      }));
	    }
	    if ("function" == typeof substitution) {
	      var _this = this;
	      return _super[Symbol.replace].call(this, str, function () {
	        var args = arguments;
	        return "object" != typeof args[args.length - 1] && (args = [].slice.call(args)).push(buildGroups(args, _this)), substitution.apply(this, args);
	      });
	    }
	    return _super[Symbol.replace].call(this, str, substitution);
	  }, _wrapRegExp.apply(this, arguments);
	}
	function _AwaitValue(value) {
	  this.wrapped = value;
	}
	function _wrapAsyncGenerator(fn) {
	  return function () {
	    return new _AsyncGenerator(fn.apply(this, arguments));
	  };
	}
	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
	  try {
	    var info = gen[key](arg);
	    var value = info.value;
	  } catch (error) {
	    reject(error);
	    return;
	  }
	  if (info.done) {
	    resolve(value);
	  } else {
	    Promise.resolve(value).then(_next, _throw);
	  }
	}
	function _asyncToGenerator(fn) {
	  return function () {
	    var self = this,
	      args = arguments;
	    return new Promise(function (resolve, reject) {
	      var gen = fn.apply(self, args);
	      function _next(value) {
	        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
	      }
	      function _throw(err) {
	        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
	      }
	      _next(undefined);
	    });
	  };
	}
	function _classCallCheck(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}
	function _defineProperties(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}
	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties(Constructor, staticProps);
	  Object.defineProperty(Constructor, "prototype", {
	    writable: false
	  });
	  return Constructor;
	}
	function _defineEnumerableProperties(obj, descs) {
	  for (var key in descs) {
	    var desc = descs[key];
	    desc.configurable = desc.enumerable = true;
	    if ("value" in desc) desc.writable = true;
	    Object.defineProperty(obj, key, desc);
	  }
	  if (Object.getOwnPropertySymbols) {
	    var objectSymbols = Object.getOwnPropertySymbols(descs);
	    for (var i = 0; i < objectSymbols.length; i++) {
	      var sym = objectSymbols[i];
	      var desc = descs[sym];
	      desc.configurable = desc.enumerable = true;
	      if ("value" in desc) desc.writable = true;
	      Object.defineProperty(obj, sym, desc);
	    }
	  }
	  return obj;
	}
	function _defaults(obj, defaults) {
	  var keys = Object.getOwnPropertyNames(defaults);
	  for (var i = 0; i < keys.length; i++) {
	    var key = keys[i];
	    var value = Object.getOwnPropertyDescriptor(defaults, key);
	    if (value && value.configurable && obj[key] === undefined) {
	      Object.defineProperty(obj, key, value);
	    }
	  }
	  return obj;
	}
	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }
	  return obj;
	}
	function _extends() {
	  _extends = Object.assign ? Object.assign.bind() : function (target) {
	    for (var i = 1; i < arguments.length; i++) {
	      var source = arguments[i];
	      for (var key in source) {
	        if (Object.prototype.hasOwnProperty.call(source, key)) {
	          target[key] = source[key];
	        }
	      }
	    }
	    return target;
	  };
	  return _extends.apply(this, arguments);
	}
	function _objectSpread(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? Object(arguments[i]) : {};
	    var ownKeys = Object.keys(source);
	    if (typeof Object.getOwnPropertySymbols === 'function') {
	      ownKeys.push.apply(ownKeys, Object.getOwnPropertySymbols(source).filter(function (sym) {
	        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
	      }));
	    }
	    ownKeys.forEach(function (key) {
	      _defineProperty(target, key, source[key]);
	    });
	  }
	  return target;
	}
	function _inherits(subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function");
	  }
	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      writable: true,
	      configurable: true
	    }
	  });
	  Object.defineProperty(subClass, "prototype", {
	    writable: false
	  });
	  if (superClass) _setPrototypeOf(subClass, superClass);
	}
	function _inheritsLoose(subClass, superClass) {
	  subClass.prototype = Object.create(superClass.prototype);
	  subClass.prototype.constructor = subClass;
	  _setPrototypeOf(subClass, superClass);
	}
	function _getPrototypeOf(o) {
	  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
	    return o.__proto__ || Object.getPrototypeOf(o);
	  };
	  return _getPrototypeOf(o);
	}
	function _setPrototypeOf(o, p) {
	  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
	    o.__proto__ = p;
	    return o;
	  };
	  return _setPrototypeOf(o, p);
	}
	function _isNativeReflectConstruct() {
	  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
	  if (Reflect.construct.sham) return false;
	  if (typeof Proxy === "function") return true;
	  try {
	    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
	    return true;
	  } catch (e) {
	    return false;
	  }
	}
	function _construct(Parent, args, Class) {
	  if (_isNativeReflectConstruct()) {
	    _construct = Reflect.construct.bind();
	  } else {
	    _construct = function _construct(Parent, args, Class) {
	      var a = [null];
	      a.push.apply(a, args);
	      var Constructor = Function.bind.apply(Parent, a);
	      var instance = new Constructor();
	      if (Class) _setPrototypeOf(instance, Class.prototype);
	      return instance;
	    };
	  }
	  return _construct.apply(null, arguments);
	}
	function _isNativeFunction(fn) {
	  return Function.toString.call(fn).indexOf("[native code]") !== -1;
	}
	function _wrapNativeSuper(Class) {
	  var _cache = typeof Map === "function" ? new Map() : undefined;
	  _wrapNativeSuper = function _wrapNativeSuper(Class) {
	    if (Class === null || !_isNativeFunction(Class)) return Class;
	    if (typeof Class !== "function") {
	      throw new TypeError("Super expression must either be null or a function");
	    }
	    if (typeof _cache !== "undefined") {
	      if (_cache.has(Class)) return _cache.get(Class);
	      _cache.set(Class, Wrapper);
	    }
	    function Wrapper() {
	      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
	    }
	    Wrapper.prototype = Object.create(Class.prototype, {
	      constructor: {
	        value: Wrapper,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	    return _setPrototypeOf(Wrapper, Class);
	  };
	  return _wrapNativeSuper(Class);
	}
	function _instanceof(left, right) {
	  if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
	    return !!right[Symbol.hasInstance](left);
	  } else {
	    return left instanceof right;
	  }
	}
	function _interopRequireDefault(obj) {
	  return obj && obj.__esModule ? obj : {
	    default: obj
	  };
	}
	function _getRequireWildcardCache(nodeInterop) {
	  if (typeof WeakMap !== "function") return null;
	  var cacheBabelInterop = new WeakMap();
	  var cacheNodeInterop = new WeakMap();
	  return (_getRequireWildcardCache = function (nodeInterop) {
	    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
	  })(nodeInterop);
	}
	function _interopRequireWildcard(obj, nodeInterop) {
	  if (!nodeInterop && obj && obj.__esModule) {
	    return obj;
	  }
	  if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
	    return {
	      default: obj
	    };
	  }
	  var cache = _getRequireWildcardCache(nodeInterop);
	  if (cache && cache.has(obj)) {
	    return cache.get(obj);
	  }
	  var newObj = {};
	  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
	  for (var key in obj) {
	    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
	      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
	      if (desc && (desc.get || desc.set)) {
	        Object.defineProperty(newObj, key, desc);
	      } else {
	        newObj[key] = obj[key];
	      }
	    }
	  }
	  newObj.default = obj;
	  if (cache) {
	    cache.set(obj, newObj);
	  }
	  return newObj;
	}
	function _newArrowCheck(innerThis, boundThis) {
	  if (innerThis !== boundThis) {
	    throw new TypeError("Cannot instantiate an arrow function");
	  }
	}
	function _objectDestructuringEmpty(obj) {
	  if (obj == null) throw new TypeError("Cannot destructure " + obj);
	}
	function _objectWithoutPropertiesLoose(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;
	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }
	  return target;
	}
	function _objectWithoutProperties(source, excluded) {
	  if (source == null) return {};
	  var target = _objectWithoutPropertiesLoose(source, excluded);
	  var key, i;
	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }
	  return target;
	}
	function _assertThisInitialized(self) {
	  if (self === void 0) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }
	  return self;
	}
	function _possibleConstructorReturn(self, call) {
	  if (call && (typeof call === "object" || typeof call === "function")) {
	    return call;
	  } else if (call !== void 0) {
	    throw new TypeError("Derived constructors may only return object or undefined");
	  }
	  return _assertThisInitialized(self);
	}
	function _createSuper(Derived) {
	  var hasNativeReflectConstruct = _isNativeReflectConstruct();
	  return function _createSuperInternal() {
	    var Super = _getPrototypeOf(Derived),
	      result;
	    if (hasNativeReflectConstruct) {
	      var NewTarget = _getPrototypeOf(this).constructor;
	      result = Reflect.construct(Super, arguments, NewTarget);
	    } else {
	      result = Super.apply(this, arguments);
	    }
	    return _possibleConstructorReturn(this, result);
	  };
	}
	function _superPropBase(object, property) {
	  while (!Object.prototype.hasOwnProperty.call(object, property)) {
	    object = _getPrototypeOf(object);
	    if (object === null) break;
	  }
	  return object;
	}
	function _get() {
	  if (typeof Reflect !== "undefined" && Reflect.get) {
	    _get = Reflect.get.bind();
	  } else {
	    _get = function _get(target, property, receiver) {
	      var base = _superPropBase(target, property);
	      if (!base) return;
	      var desc = Object.getOwnPropertyDescriptor(base, property);
	      if (desc.get) {
	        return desc.get.call(arguments.length < 3 ? target : receiver);
	      }
	      return desc.value;
	    };
	  }
	  return _get.apply(this, arguments);
	}
	function set(target, property, value, receiver) {
	  if (typeof Reflect !== "undefined" && Reflect.set) {
	    set = Reflect.set;
	  } else {
	    set = function set(target, property, value, receiver) {
	      var base = _superPropBase(target, property);
	      var desc;
	      if (base) {
	        desc = Object.getOwnPropertyDescriptor(base, property);
	        if (desc.set) {
	          desc.set.call(receiver, value);
	          return true;
	        } else if (!desc.writable) {
	          return false;
	        }
	      }
	      desc = Object.getOwnPropertyDescriptor(receiver, property);
	      if (desc) {
	        if (!desc.writable) {
	          return false;
	        }
	        desc.value = value;
	        Object.defineProperty(receiver, property, desc);
	      } else {
	        _defineProperty(receiver, property, value);
	      }
	      return true;
	    };
	  }
	  return set(target, property, value, receiver);
	}
	function _set(target, property, value, receiver, isStrict) {
	  var s = set(target, property, value, receiver || target);
	  if (!s && isStrict) {
	    throw new Error('failed to set property');
	  }
	  return value;
	}
	function _taggedTemplateLiteral(strings, raw) {
	  if (!raw) {
	    raw = strings.slice(0);
	  }
	  return Object.freeze(Object.defineProperties(strings, {
	    raw: {
	      value: Object.freeze(raw)
	    }
	  }));
	}
	function _taggedTemplateLiteralLoose(strings, raw) {
	  if (!raw) {
	    raw = strings.slice(0);
	  }
	  strings.raw = raw;
	  return strings;
	}
	function _readOnlyError(name) {
	  throw new TypeError("\"" + name + "\" is read-only");
	}
	function _writeOnlyError(name) {
	  throw new TypeError("\"" + name + "\" is write-only");
	}
	function _classNameTDZError(name) {
	  throw new Error("Class \"" + name + "\" cannot be referenced in computed property keys.");
	}
	function _temporalUndefined() {}
	function _tdz(name) {
	  throw new ReferenceError(name + " is not defined - temporal dead zone");
	}
	function _temporalRef(val, name) {
	  return val === _temporalUndefined ? _tdz(name) : val;
	}
	function _slicedToArray(arr, i) {
	  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
	}
	function _slicedToArrayLoose(arr, i) {
	  return _arrayWithHoles(arr) || _iterableToArrayLimitLoose(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
	}
	function _toArray(arr) {
	  return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
	}
	function _toConsumableArray(arr) {
	  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
	}
	function _arrayWithoutHoles(arr) {
	  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
	}
	function _arrayWithHoles(arr) {
	  if (Array.isArray(arr)) return arr;
	}
	function _maybeArrayLike(next, arr, i) {
	  if (arr && !Array.isArray(arr) && typeof arr.length === "number") {
	    var len = arr.length;
	    return _arrayLikeToArray(arr, i !== void 0 && i < len ? i : len);
	  }
	  return next(arr, i);
	}
	function _iterableToArray(iter) {
	  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
	}
	function _iterableToArrayLimit(arr, i) {
	  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
	  if (_i == null) return;
	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _s, _e;
	  try {
	    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);
	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }
	  return _arr;
	}
	function _iterableToArrayLimitLoose(arr, i) {
	  var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]);
	  if (_i == null) return;
	  var _arr = [];
	  for (_i = _i.call(arr), _step; !(_step = _i.next()).done;) {
	    _arr.push(_step.value);
	    if (i && _arr.length === i) break;
	  }
	  return _arr;
	}
	function _unsupportedIterableToArray(o, minLen) {
	  if (!o) return;
	  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
	  var n = Object.prototype.toString.call(o).slice(8, -1);
	  if (n === "Object" && o.constructor) n = o.constructor.name;
	  if (n === "Map" || n === "Set") return Array.from(o);
	  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}
	function _arrayLikeToArray(arr, len) {
	  if (len == null || len > arr.length) len = arr.length;
	  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
	  return arr2;
	}
	function _nonIterableSpread() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _nonIterableRest() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _createForOfIteratorHelper(o, allowArrayLike) {
	  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
	  if (!it) {
	    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
	      if (it) o = it;
	      var i = 0;
	      var F = function () {};
	      return {
	        s: F,
	        n: function () {
	          if (i >= o.length) return {
	            done: true
	          };
	          return {
	            done: false,
	            value: o[i++]
	          };
	        },
	        e: function (e) {
	          throw e;
	        },
	        f: F
	      };
	    }
	    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	  }
	  var normalCompletion = true,
	    didErr = false,
	    err;
	  return {
	    s: function () {
	      it = it.call(o);
	    },
	    n: function () {
	      var step = it.next();
	      normalCompletion = step.done;
	      return step;
	    },
	    e: function (e) {
	      didErr = true;
	      err = e;
	    },
	    f: function () {
	      try {
	        if (!normalCompletion && it.return != null) it.return();
	      } finally {
	        if (didErr) throw err;
	      }
	    }
	  };
	}
	function _createForOfIteratorHelperLoose(o, allowArrayLike) {
	  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
	  if (it) return (it = it.call(o)).next.bind(it);
	  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
	    if (it) o = it;
	    var i = 0;
	    return function () {
	      if (i >= o.length) return {
	        done: true
	      };
	      return {
	        done: false,
	        value: o[i++]
	      };
	    };
	  }
	  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function _skipFirstGeneratorNext(fn) {
	  return function () {
	    var it = fn.apply(this, arguments);
	    it.next();
	    return it;
	  };
	}
	function _toPrimitive(input, hint) {
	  if (typeof input !== "object" || input === null) return input;
	  var prim = input[Symbol.toPrimitive];
	  if (prim !== undefined) {
	    var res = prim.call(input, hint || "default");
	    if (typeof res !== "object") return res;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return (hint === "string" ? String : Number)(input);
	}
	function _toPropertyKey(arg) {
	  var key = _toPrimitive(arg, "string");
	  return typeof key === "symbol" ? key : String(key);
	}
	function _initializerWarningHelper(descriptor, context) {
	  throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and runs after the decorators transform.');
	}
	function _initializerDefineProperty(target, property, descriptor, context) {
	  if (!descriptor) return;
	  Object.defineProperty(target, property, {
	    enumerable: descriptor.enumerable,
	    configurable: descriptor.configurable,
	    writable: descriptor.writable,
	    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
	  });
	}
	function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
	  var desc = {};
	  Object.keys(descriptor).forEach(function (key) {
	    desc[key] = descriptor[key];
	  });
	  desc.enumerable = !!desc.enumerable;
	  desc.configurable = !!desc.configurable;
	  if ('value' in desc || desc.initializer) {
	    desc.writable = true;
	  }
	  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
	    return decorator(target, property, desc) || desc;
	  }, desc);
	  if (context && desc.initializer !== void 0) {
	    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
	    desc.initializer = undefined;
	  }
	  if (desc.initializer === void 0) {
	    Object.defineProperty(target, property, desc);
	    desc = null;
	  }
	  return desc;
	}
	var id = 0;
	function _classPrivateFieldLooseKey(name) {
	  return "__private_" + id++ + "_" + name;
	}
	function _classPrivateFieldLooseBase(receiver, privateKey) {
	  if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
	    throw new TypeError("attempted to use private field on non-instance");
	  }
	  return receiver;
	}
	function _classPrivateFieldGet(receiver, privateMap) {
	  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
	  return _classApplyDescriptorGet(receiver, descriptor);
	}
	function _classPrivateFieldSet(receiver, privateMap, value) {
	  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
	  _classApplyDescriptorSet(receiver, descriptor, value);
	  return value;
	}
	function _classPrivateFieldDestructureSet(receiver, privateMap) {
	  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
	  return _classApplyDescriptorDestructureSet(receiver, descriptor);
	}
	function _classExtractFieldDescriptor(receiver, privateMap, action) {
	  if (!privateMap.has(receiver)) {
	    throw new TypeError("attempted to " + action + " private field on non-instance");
	  }
	  return privateMap.get(receiver);
	}
	function _classStaticPrivateFieldSpecGet(receiver, classConstructor, descriptor) {
	  _classCheckPrivateStaticAccess(receiver, classConstructor);
	  _classCheckPrivateStaticFieldDescriptor(descriptor, "get");
	  return _classApplyDescriptorGet(receiver, descriptor);
	}
	function _classStaticPrivateFieldSpecSet(receiver, classConstructor, descriptor, value) {
	  _classCheckPrivateStaticAccess(receiver, classConstructor);
	  _classCheckPrivateStaticFieldDescriptor(descriptor, "set");
	  _classApplyDescriptorSet(receiver, descriptor, value);
	  return value;
	}
	function _classStaticPrivateMethodGet(receiver, classConstructor, method) {
	  _classCheckPrivateStaticAccess(receiver, classConstructor);
	  return method;
	}
	function _classStaticPrivateMethodSet() {
	  throw new TypeError("attempted to set read only static private field");
	}
	function _classApplyDescriptorGet(receiver, descriptor) {
	  if (descriptor.get) {
	    return descriptor.get.call(receiver);
	  }
	  return descriptor.value;
	}
	function _classApplyDescriptorSet(receiver, descriptor, value) {
	  if (descriptor.set) {
	    descriptor.set.call(receiver, value);
	  } else {
	    if (!descriptor.writable) {
	      throw new TypeError("attempted to set read only private field");
	    }
	    descriptor.value = value;
	  }
	}
	function _classApplyDescriptorDestructureSet(receiver, descriptor) {
	  if (descriptor.set) {
	    if (!("__destrObj" in descriptor)) {
	      descriptor.__destrObj = {
	        set value(v) {
	          descriptor.set.call(receiver, v);
	        }
	      };
	    }
	    return descriptor.__destrObj;
	  } else {
	    if (!descriptor.writable) {
	      throw new TypeError("attempted to set read only private field");
	    }
	    return descriptor;
	  }
	}
	function _classStaticPrivateFieldDestructureSet(receiver, classConstructor, descriptor) {
	  _classCheckPrivateStaticAccess(receiver, classConstructor);
	  _classCheckPrivateStaticFieldDescriptor(descriptor, "set");
	  return _classApplyDescriptorDestructureSet(receiver, descriptor);
	}
	function _classCheckPrivateStaticAccess(receiver, classConstructor) {
	  if (receiver !== classConstructor) {
	    throw new TypeError("Private static access of wrong provenance");
	  }
	}
	function _classCheckPrivateStaticFieldDescriptor(descriptor, action) {
	  if (descriptor === undefined) {
	    throw new TypeError("attempted to " + action + " private static field before its declaration");
	  }
	}
	function _decorate(decorators, factory, superClass, mixins) {
	  var api = _getDecoratorsApi();
	  if (mixins) {
	    for (var i = 0; i < mixins.length; i++) {
	      api = mixins[i](api);
	    }
	  }
	  var r = factory(function initialize(O) {
	    api.initializeInstanceElements(O, decorated.elements);
	  }, superClass);
	  var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators);
	  api.initializeClassElements(r.F, decorated.elements);
	  return api.runClassFinishers(r.F, decorated.finishers);
	}
	function _getDecoratorsApi() {
	  _getDecoratorsApi = function () {
	    return api;
	  };
	  var api = {
	    elementsDefinitionOrder: [["method"], ["field"]],
	    initializeInstanceElements: function (O, elements) {
	      ["method", "field"].forEach(function (kind) {
	        elements.forEach(function (element) {
	          if (element.kind === kind && element.placement === "own") {
	            this.defineClassElement(O, element);
	          }
	        }, this);
	      }, this);
	    },
	    initializeClassElements: function (F, elements) {
	      var proto = F.prototype;
	      ["method", "field"].forEach(function (kind) {
	        elements.forEach(function (element) {
	          var placement = element.placement;
	          if (element.kind === kind && (placement === "static" || placement === "prototype")) {
	            var receiver = placement === "static" ? F : proto;
	            this.defineClassElement(receiver, element);
	          }
	        }, this);
	      }, this);
	    },
	    defineClassElement: function (receiver, element) {
	      var descriptor = element.descriptor;
	      if (element.kind === "field") {
	        var initializer = element.initializer;
	        descriptor = {
	          enumerable: descriptor.enumerable,
	          writable: descriptor.writable,
	          configurable: descriptor.configurable,
	          value: initializer === void 0 ? void 0 : initializer.call(receiver)
	        };
	      }
	      Object.defineProperty(receiver, element.key, descriptor);
	    },
	    decorateClass: function (elements, decorators) {
	      var newElements = [];
	      var finishers = [];
	      var placements = {
	        static: [],
	        prototype: [],
	        own: []
	      };
	      elements.forEach(function (element) {
	        this.addElementPlacement(element, placements);
	      }, this);
	      elements.forEach(function (element) {
	        if (!_hasDecorators(element)) return newElements.push(element);
	        var elementFinishersExtras = this.decorateElement(element, placements);
	        newElements.push(elementFinishersExtras.element);
	        newElements.push.apply(newElements, elementFinishersExtras.extras);
	        finishers.push.apply(finishers, elementFinishersExtras.finishers);
	      }, this);
	      if (!decorators) {
	        return {
	          elements: newElements,
	          finishers: finishers
	        };
	      }
	      var result = this.decorateConstructor(newElements, decorators);
	      finishers.push.apply(finishers, result.finishers);
	      result.finishers = finishers;
	      return result;
	    },
	    addElementPlacement: function (element, placements, silent) {
	      var keys = placements[element.placement];
	      if (!silent && keys.indexOf(element.key) !== -1) {
	        throw new TypeError("Duplicated element (" + element.key + ")");
	      }
	      keys.push(element.key);
	    },
	    decorateElement: function (element, placements) {
	      var extras = [];
	      var finishers = [];
	      for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) {
	        var keys = placements[element.placement];
	        keys.splice(keys.indexOf(element.key), 1);
	        var elementObject = this.fromElementDescriptor(element);
	        var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject);
	        element = elementFinisherExtras.element;
	        this.addElementPlacement(element, placements);
	        if (elementFinisherExtras.finisher) {
	          finishers.push(elementFinisherExtras.finisher);
	        }
	        var newExtras = elementFinisherExtras.extras;
	        if (newExtras) {
	          for (var j = 0; j < newExtras.length; j++) {
	            this.addElementPlacement(newExtras[j], placements);
	          }
	          extras.push.apply(extras, newExtras);
	        }
	      }
	      return {
	        element: element,
	        finishers: finishers,
	        extras: extras
	      };
	    },
	    decorateConstructor: function (elements, decorators) {
	      var finishers = [];
	      for (var i = decorators.length - 1; i >= 0; i--) {
	        var obj = this.fromClassDescriptor(elements);
	        var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj);
	        if (elementsAndFinisher.finisher !== undefined) {
	          finishers.push(elementsAndFinisher.finisher);
	        }
	        if (elementsAndFinisher.elements !== undefined) {
	          elements = elementsAndFinisher.elements;
	          for (var j = 0; j < elements.length - 1; j++) {
	            for (var k = j + 1; k < elements.length; k++) {
	              if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) {
	                throw new TypeError("Duplicated element (" + elements[j].key + ")");
	              }
	            }
	          }
	        }
	      }
	      return {
	        elements: elements,
	        finishers: finishers
	      };
	    },
	    fromElementDescriptor: function (element) {
	      var obj = {
	        kind: element.kind,
	        key: element.key,
	        placement: element.placement,
	        descriptor: element.descriptor
	      };
	      var desc = {
	        value: "Descriptor",
	        configurable: true
	      };
	      Object.defineProperty(obj, Symbol.toStringTag, desc);
	      if (element.kind === "field") obj.initializer = element.initializer;
	      return obj;
	    },
	    toElementDescriptors: function (elementObjects) {
	      if (elementObjects === undefined) return;
	      return _toArray(elementObjects).map(function (elementObject) {
	        var element = this.toElementDescriptor(elementObject);
	        this.disallowProperty(elementObject, "finisher", "An element descriptor");
	        this.disallowProperty(elementObject, "extras", "An element descriptor");
	        return element;
	      }, this);
	    },
	    toElementDescriptor: function (elementObject) {
	      var kind = String(elementObject.kind);
	      if (kind !== "method" && kind !== "field") {
	        throw new TypeError('An element descriptor\'s .kind property must be either "method" or' + ' "field", but a decorator created an element descriptor with' + ' .kind "' + kind + '"');
	      }
	      var key = _toPropertyKey(elementObject.key);
	      var placement = String(elementObject.placement);
	      if (placement !== "static" && placement !== "prototype" && placement !== "own") {
	        throw new TypeError('An element descriptor\'s .placement property must be one of "static",' + ' "prototype" or "own", but a decorator created an element descriptor' + ' with .placement "' + placement + '"');
	      }
	      var descriptor = elementObject.descriptor;
	      this.disallowProperty(elementObject, "elements", "An element descriptor");
	      var element = {
	        kind: kind,
	        key: key,
	        placement: placement,
	        descriptor: Object.assign({}, descriptor)
	      };
	      if (kind !== "field") {
	        this.disallowProperty(elementObject, "initializer", "A method descriptor");
	      } else {
	        this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor");
	        this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor");
	        this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor");
	        element.initializer = elementObject.initializer;
	      }
	      return element;
	    },
	    toElementFinisherExtras: function (elementObject) {
	      var element = this.toElementDescriptor(elementObject);
	      var finisher = _optionalCallableProperty(elementObject, "finisher");
	      var extras = this.toElementDescriptors(elementObject.extras);
	      return {
	        element: element,
	        finisher: finisher,
	        extras: extras
	      };
	    },
	    fromClassDescriptor: function (elements) {
	      var obj = {
	        kind: "class",
	        elements: elements.map(this.fromElementDescriptor, this)
	      };
	      var desc = {
	        value: "Descriptor",
	        configurable: true
	      };
	      Object.defineProperty(obj, Symbol.toStringTag, desc);
	      return obj;
	    },
	    toClassDescriptor: function (obj) {
	      var kind = String(obj.kind);
	      if (kind !== "class") {
	        throw new TypeError('A class descriptor\'s .kind property must be "class", but a decorator' + ' created a class descriptor with .kind "' + kind + '"');
	      }
	      this.disallowProperty(obj, "key", "A class descriptor");
	      this.disallowProperty(obj, "placement", "A class descriptor");
	      this.disallowProperty(obj, "descriptor", "A class descriptor");
	      this.disallowProperty(obj, "initializer", "A class descriptor");
	      this.disallowProperty(obj, "extras", "A class descriptor");
	      var finisher = _optionalCallableProperty(obj, "finisher");
	      var elements = this.toElementDescriptors(obj.elements);
	      return {
	        elements: elements,
	        finisher: finisher
	      };
	    },
	    runClassFinishers: function (constructor, finishers) {
	      for (var i = 0; i < finishers.length; i++) {
	        var newConstructor = (0, finishers[i])(constructor);
	        if (newConstructor !== undefined) {
	          if (typeof newConstructor !== "function") {
	            throw new TypeError("Finishers must return a constructor.");
	          }
	          constructor = newConstructor;
	        }
	      }
	      return constructor;
	    },
	    disallowProperty: function (obj, name, objectType) {
	      if (obj[name] !== undefined) {
	        throw new TypeError(objectType + " can't have a ." + name + " property.");
	      }
	    }
	  };
	  return api;
	}
	function _createElementDescriptor(def) {
	  var key = _toPropertyKey(def.key);
	  var descriptor;
	  if (def.kind === "method") {
	    descriptor = {
	      value: def.value,
	      writable: true,
	      configurable: true,
	      enumerable: false
	    };
	  } else if (def.kind === "get") {
	    descriptor = {
	      get: def.value,
	      configurable: true,
	      enumerable: false
	    };
	  } else if (def.kind === "set") {
	    descriptor = {
	      set: def.value,
	      configurable: true,
	      enumerable: false
	    };
	  } else if (def.kind === "field") {
	    descriptor = {
	      configurable: true,
	      writable: true,
	      enumerable: true
	    };
	  }
	  var element = {
	    kind: def.kind === "field" ? "field" : "method",
	    key: key,
	    placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype",
	    descriptor: descriptor
	  };
	  if (def.decorators) element.decorators = def.decorators;
	  if (def.kind === "field") element.initializer = def.value;
	  return element;
	}
	function _coalesceGetterSetter(element, other) {
	  if (element.descriptor.get !== undefined) {
	    other.descriptor.get = element.descriptor.get;
	  } else {
	    other.descriptor.set = element.descriptor.set;
	  }
	}
	function _coalesceClassElements(elements) {
	  var newElements = [];
	  var isSameElement = function (other) {
	    return other.kind === "method" && other.key === element.key && other.placement === element.placement;
	  };
	  for (var i = 0; i < elements.length; i++) {
	    var element = elements[i];
	    var other;
	    if (element.kind === "method" && (other = newElements.find(isSameElement))) {
	      if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) {
	        if (_hasDecorators(element) || _hasDecorators(other)) {
	          throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated.");
	        }
	        other.descriptor = element.descriptor;
	      } else {
	        if (_hasDecorators(element)) {
	          if (_hasDecorators(other)) {
	            throw new ReferenceError("Decorators can't be placed on different accessors with for " + "the same property (" + element.key + ").");
	          }
	          other.decorators = element.decorators;
	        }
	        _coalesceGetterSetter(element, other);
	      }
	    } else {
	      newElements.push(element);
	    }
	  }
	  return newElements;
	}
	function _hasDecorators(element) {
	  return element.decorators && element.decorators.length;
	}
	function _isDataDescriptor(desc) {
	  return desc !== undefined && !(desc.value === undefined && desc.writable === undefined);
	}
	function _optionalCallableProperty(obj, name) {
	  var value = obj[name];
	  if (value !== undefined && typeof value !== "function") {
	    throw new TypeError("Expected '" + name + "' to be a function");
	  }
	  return value;
	}
	function _classPrivateMethodGet(receiver, privateSet, fn) {
	  if (!privateSet.has(receiver)) {
	    throw new TypeError("attempted to get private field on non-instance");
	  }
	  return fn;
	}
	function _checkPrivateRedeclaration(obj, privateCollection) {
	  if (privateCollection.has(obj)) {
	    throw new TypeError("Cannot initialize the same private elements twice on an object");
	  }
	}
	function _classPrivateFieldInitSpec(obj, privateMap, value) {
	  _checkPrivateRedeclaration(obj, privateMap);
	  privateMap.set(obj, value);
	}
	function _classPrivateMethodInitSpec(obj, privateSet) {
	  _checkPrivateRedeclaration(obj, privateSet);
	  privateSet.add(obj);
	}
	function _classPrivateMethodSet() {
	  throw new TypeError("attempted to reassign private method");
	}
	function _identity(x) {
	  return x;
	}

	/**
	 * Return the event type that a listener will receive.
	 *
	 * For example `EventType<HTMLElement, 'keydown'>` evaluates to `KeyboardEvent`.
	 *
	 * The event type is extracted from the target's `on${Type}` property (eg.
	 * `HTMLElement.onkeydown` here) If there is no such property, the type defaults
	 * to `Event`.
	 */

	/**
	 * Utility that provides a way to conveniently remove a set of DOM event
	 * listeners when they are no longer needed.
	 */
	class ListenerCollection$1 {
	  constructor() {
	    _defineProperty(this, "_listeners", void 0);
	    this._listeners = new Map();
	  }

	  /**
	   * Add a listener and return an ID that can be used to remove it later
	   */
	  add(eventTarget, eventType, listener, options) {
	    eventTarget.addEventListener(eventType, listener, options);
	    const symbol = Symbol();
	    this._listeners.set(symbol, {
	      eventTarget,
	      eventType,
	      // eslint-disable-next-line object-shorthand
	      listener: listener
	    });
	    return symbol;
	  }

	  /**
	   * Remove a specific listener.
	   */
	  remove(listenerId) {
	    const event = this._listeners.get(listenerId);
	    if (event) {
	      const {
	        eventTarget,
	        eventType,
	        listener
	      } = event;
	      eventTarget.removeEventListener(eventType, listener);
	      this._listeners.delete(listenerId);
	    }
	  }
	  removeAll() {
	    this._listeners.forEach(({
	      eventTarget,
	      eventType,
	      listener
	    }) => {
	      eventTarget.removeEventListener(eventType, listener);
	    });
	    this._listeners.clear();
	  }
	}

	/** @param {number} val */
	function byteToHex(val) {
	  const str = val.toString(16);
	  return str.length === 1 ? '0' + str : str;
	}

	/**
	 * Generate a random hex string of `len` chars.
	 *
	 * @param {number} len - An even-numbered length string to generate.
	 * @return {string}
	 */
	function generateHexString(len) {
	  const bytes = new Uint8Array(len / 2);
	  window.crypto.getRandomValues(bytes);
	  return Array.from(bytes).map(byteToHex).join('');
	}

	/**
	 * Message sent by `PortProvider` and `PortFinder` to establish a
	 * MessageChannel-based connection between two frames.
	 *
	 * @typedef {'guest'|'host'|'notebook'|'sidebar'} Frame
	 *
	 * @typedef Message
	 * @prop {Frame} frame1 - Role of the source frame
	 * @prop {Frame} frame2 - Role of the target frame
	 * @prop {'offer'|'request'} type - Message type. "request" messages are sent
	 *   by the source frame to the host frame to request a connection. "offer"
	 *   messages are sent from the host frame back to the source frame and also
	 *   to the target frame, accompanied by a MessagePort.
	 * @prop {string} requestId - ID of the request. Used to associate "offer"
	 *   messages with their corresponding "request" messages.
	 * @prop {string} [sourceId] - Identifier for the source frame. This is useful
	 *   in cases where multiple source frames with a given role may connect to
	 *   the same destination frame.
	 */

	/**
	 * Return true if an object, eg. from the data field of a `MessageEvent`, is a
	 * valid `Message`.
	 *
	 * @param {any} data
	 * @return {data is Message}
	 */
	function isMessage(data) {
	  if (data === null || typeof data !== 'object') {
	    return false;
	  }
	  for (let property of ['frame1', 'frame2', 'type', 'requestId']) {
	    if (typeof data[property] !== 'string') {
	      return false;
	    }
	  }
	  return true;
	}

	/**
	 * Return true if the data payload from a MessageEvent matches `message`.
	 *
	 * @param {any} data
	 * @param {Partial<Message>} message
	 */
	function isMessageEqual(data, message) {
	  if (!isMessage(data)) {
	    return false;
	  }

	  // We assume `JSON.stringify` cannot throw because `isMessage` verifies that
	  // all the fields we serialize here are serializable values.
	  return JSON.stringify(data, Object.keys(message).sort()) === JSON.stringify(message, Object.keys(message).sort());
	}

	/**
	 * Check that source is of type Window.
	 *
	 * @param {MessageEventSource|null} source
	 * @return {source is Window}
	 */
	function isSourceWindow(source) {
	  if (
	  // `source` can be of type Window, MessagePort, ServiceWorker, or null.
	  // `source instanceof Window` doesn't work in Chrome if `source` is a
	  // cross-origin window.
	  source === null || source instanceof MessagePort || window.ServiceWorker && source instanceof ServiceWorker) {
	    return false;
	  }
	  return true;
	}

	/** Timeout for waiting for the host frame to respond to a port request. */
	const MAX_WAIT_FOR_PORT = 1000 * 20;

	/** Polling interval for requests to the host frame for a port. */
	const POLLING_INTERVAL_FOR_PORT = 250;

	/**
	 * @typedef {import('../../types/annotator').Destroyable} Destroyable
	 * @typedef {import('./port-util').Message} Message
	 * @typedef {import('./port-util').Frame} Frame
	 */

	/**
	 * PortFinder is used by non-host frames in the client to establish a
	 * MessagePort-based connection to other frames. It is used together with
	 * PortProvider which runs in the host frame. See PortProvider for an overview.
	 *
	 * @implements {Destroyable}
	 */
	class PortFinder {
	  /**
	   * @param {object} options
	   *   @param {Exclude<Frame, 'host'>} options.source - the role of this frame
	   *   @param {string} [options.sourceId] - Identifier for this frame
	   *   @param {Window} options.hostFrame - the frame where the `PortProvider` is
	   *     listening for messages.
	   */
	  constructor({
	    hostFrame,
	    source,
	    sourceId
	  }) {
	    this._hostFrame = hostFrame;
	    this._source = source;
	    this._sourceId = sourceId;
	    this._listeners = new ListenerCollection$1();
	  }
	  destroy() {
	    this._listeners.removeAll();
	  }

	  /**
	   * Request a specific port from the host frame
	   *
	   * @param {Frame} target - the frame aiming to be discovered
	   * @return {Promise<MessagePort>}
	   */
	  async discover(target) {
	    let isValidRequest = false;
	    if (this._source === 'guest' && target === 'host' || this._source === 'guest' && target === 'sidebar' || this._source === 'sidebar' && target === 'host' || this._source === 'notebook' && target === 'sidebar') {
	      isValidRequest = true;
	    }
	    if (!isValidRequest) {
	      throw new Error('Invalid request of channel/port');
	    }
	    const requestId = generateHexString(6);
	    return new Promise((resolve, reject) => {
	      const postRequest = () => {
	        this._hostFrame.postMessage({
	          frame1: this._source,
	          frame2: target,
	          type: 'request',
	          requestId,
	          sourceId: this._sourceId
	        }, '*');
	      };

	      // Because `guest` iframes load in parallel to the `host` frame, we can
	      // not assume that the code in the `host` frame is executed before the
	      // code in a `guest` frame. Hence, we can't assume that `PortProvider` (in
	      // the `host` frame) is initialized before `PortFinder` (in the non-host
	      // frames). Therefore, for the `PortFinder`, we implement a polling
	      // strategy (sending a message every N milliseconds) until a response is
	      // received.
	      const intervalId = setInterval(postRequest, POLLING_INTERVAL_FOR_PORT);

	      // The `host` frame maybe busy, that's why we should wait.
	      const timeoutId = setTimeout(() => {
	        clearInterval(intervalId);
	        reject(new Error(`Unable to establish ${this._source}-${target} communication channel`));
	      }, MAX_WAIT_FOR_PORT);
	      const listenerId = this._listeners.add(window, 'message', event => {
	        const {
	          data,
	          ports
	        } = event;
	        if (isMessageEqual(data, {
	          frame1: this._source,
	          frame2: target,
	          type: 'offer',
	          requestId
	        })) {
	          clearInterval(intervalId);
	          clearTimeout(timeoutId);
	          this._listeners.remove(listenerId);
	          resolve(ports[0]);
	        }
	      });
	      postRequest();
	    });
	  }
	}

	var tinyEmitter = {exports: {}};

	function E () {
	  // Keep this empty so it's easier to inherit from
	  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
	}

	E.prototype = {
	  on: function (name, callback, ctx) {
	    var e = this.e || (this.e = {});

	    (e[name] || (e[name] = [])).push({
	      fn: callback,
	      ctx: ctx
	    });

	    return this;
	  },

	  once: function (name, callback, ctx) {
	    var self = this;
	    function listener () {
	      self.off(name, listener);
	      callback.apply(ctx, arguments);
	    };

	    listener._ = callback;
	    return this.on(name, listener, ctx);
	  },

	  emit: function (name) {
	    var data = [].slice.call(arguments, 1);
	    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
	    var i = 0;
	    var len = evtArr.length;

	    for (i; i < len; i++) {
	      evtArr[i].fn.apply(evtArr[i].ctx, data);
	    }

	    return this;
	  },

	  off: function (name, callback) {
	    var e = this.e || (this.e = {});
	    var evts = e[name];
	    var liveEvents = [];

	    if (evts && callback) {
	      for (var i = 0, len = evts.length; i < len; i++) {
	        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
	          liveEvents.push(evts[i]);
	      }
	    }

	    // Remove event from queue to prevent memory leak
	    // Suggested by https://github.com/lazd
	    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

	    (liveEvents.length)
	      ? e[name] = liveEvents
	      : delete e[name];

	    return this;
	  }
	};

	tinyEmitter.exports = E;
	var TinyEmitter = tinyEmitter.exports.TinyEmitter = E;

	/** @type {Window|null} */
	let errorDestination = null;

	/**
	 * Wrap a callback with an error handler which forwards errors to another frame
	 * using {@link sendError}.
	 *
	 * @template {unknown[]} Args
	 * @template Result
	 * @param {(...args: Args) => Result} callback
	 * @param {string} context - A short message indicating where the error happened.
	 * @return {(...args: Args) => Result}
	 */
	function captureErrors(callback, context) {
	  return (...args) => {
	    try {
	      return callback(...args);
	    } catch (err) {
	      sendError(err, context);
	      throw err;
	    }
	  };
	}

	/**
	 * @typedef ErrorData
	 * @prop {string} message
	 * @prop {string} [stack]
	 */

	/**
	 * Return a cloneable representation of an Error.
	 *
	 * This is needed in browsers that don't support structured-cloning of Error
	 * objects, or if the error is not cloneable for some reason.
	 *
	 * @param {Error|unknown} err
	 * @return {ErrorData}
	 */
	function serializeError(err) {
	  if (!(err instanceof Error)) {
	    return {
	      message: String(err),
	      stack: undefined
	    };
	  }
	  return {
	    message: err.message,
	    stack: err.stack
	  };
	}

	/**
	 * Convert error data serialized by {@link serializeError} back into an Error.
	 *
	 * @param {ErrorData} data
	 * @return {Error}
	 */
	function deserializeError(data) {
	  const err = new Error(data.message);
	  err.stack = data.stack;
	  return err;
	}

	/**
	 * Forward an error to the frame registered with {@link sendErrorsTo}.
	 *
	 * Errors are delivered on a best-effort basis. If no error handling frame has
	 * been registered or the frame is still loading, the error will not be received.
	 *
	 * Ideally we would use a more robust delivery system which can queue messages
	 * until they can be processed (eg. using MessagePort). We use `window.postMessage`
	 * for the moment because we are trying to rule out problems with
	 * MessageChannel/MessagePort when setting up sidebar <-> host communication.
	 *
	 * @param {unknown} error
	 * @param {string} context - A short message indicating where the error happened.
	 */
	function sendError(error, context) {
	  if (!errorDestination) {
	    return;
	  }
	  const data = {
	    type: 'hypothesis-error',
	    error: error instanceof Error ? error : serializeError(error),
	    context
	  };
	  try {
	    // Try to send the error. If this fails because the browser doesn't support
	    // structured cloning of errors, use a fallback.
	    try {
	      errorDestination.postMessage(data, '*');
	    } catch (postErr) {
	      if (postErr instanceof DOMException && postErr.name === 'DataCloneError') {
	        data.error = serializeError(data.error);
	        errorDestination.postMessage(data, '*');
	      } else {
	        throw postErr;
	      }
	    }
	  } catch (sendErr) {
	    console.warn('Unable to report Hypothesis error', sendErr);
	  }
	}

	/**
	 * Register a handler for errors sent to the current frame using {@link sendError}
	 *
	 * @param {(error: unknown, context: string) => void} callback
	 * @return {() => void} A function that unregisters the handler
	 */
	function handleErrorsInFrames(callback) {
	  /** @param {MessageEvent} event */
	  const handleMessage = event => {
	    const {
	      data
	    } = event;
	    if (data && (data === null || data === void 0 ? void 0 : data.type) === 'hypothesis-error') {
	      const {
	        context,
	        error
	      } = data;
	      callback(error instanceof Error ? error : deserializeError(error), context);
	    }
	  };
	  window.addEventListener('message', handleMessage);
	  return () => window.removeEventListener('message', handleMessage);
	}

	/**
	 * Register a destination frame that {@link sendError} should submit errors to.
	 *
	 * @param {Window|null} destination
	 */
	function sendErrorsTo(destination) {
	  errorDestination = destination;
	}

	/**
	 * @typedef {import('../../types/annotator').Destroyable} Destroyable
	 * @typedef {import('./port-util').Message} Message
	 * @typedef {import('./port-util').Frame} Frame
	 * @typedef {'guest-host'|'guest-sidebar'|'notebook-sidebar'|'sidebar-host'} Channel
	 */

	/**
	 * PortProvider creates a `MessageChannel` for communication between two
	 * frames.
	 *
	 * There are 4 types of frames:
	 * - `host`: frame where the Hypothesis client is initially loaded.
	 * - `guest`: frames with annotatable content. In some instances a `guest`
	 *    frame can be the same as the `host` frame, in other cases, it is an iframe
	 *    where either (1) the hypothesis client has been injected or (2) the
	 *    hypothesis client has been configured to act exclusively as a `guest` (not
	 *    showing the sidebar).
	 * - `notebook`: another hypothesis app that runs in a separate iframe.
	 * - `sidebar`: the main hypothesis app. It runs in an iframe on a different
	 *    origin than the host and is responsible for the communication with the
	 *    backend (fetching and saving annotations).
	 *
	 * This layout represents the current arrangement of frames:
	 *
	 * `host` frame
	 * |-> `sidebar` iframe
	 * |-> `notebook` iframe
	 * |-> [`guest` iframes]
	 *
	 * Currently, we support communication between the following pairs of frames:
	 * - `guest-host`
	 * - `guest-sidebar`
	 * - `notebook-sidebar`
	 * - `sidebar-host`
	 *
	 * `PortProvider` is used only in the `host` frame. The other frames use the
	 * companion class, `PortFinder`. `PortProvider` creates a `MessageChannel`
	 * for two frames to communicate with each other. It also listens to requests for
	 * particular `MessagePort` and dispatches the corresponding `MessagePort`.
	 *
	 *
	 *        PortFinder (non-host frame)                 |       PortProvider (host frame)
	 * -----------------------------------------------------------------------------------------------
	 * 1. Request `MessagePort` via `window.postMessage` ---> 2. Receive request and create port pair
	 *                                                                          |
	 *                                                                          V
	 * 4. Receive requested port      <---------------------- 3. Send first port to requesting frame
	 *                                                        5. Send second port to other frame
	 *                                                           (eg. via MessageChannel connection
	 *                                                           between host and other frame)
	 *
	 * @implements {Destroyable}
	 */
	class PortProvider {
	  /**
	   * Begin listening to port requests from other frames.
	   *
	   * @param {string} hypothesisAppsOrigin - the origin of the hypothesis apps
	   *   is use to send the notebook and sidebar ports to only the frames that
	   *   match the origin.
	   */
	  constructor(hypothesisAppsOrigin) {
	    this._hypothesisAppsOrigin = hypothesisAppsOrigin;
	    this._emitter = new TinyEmitter();

	    /**
	     * IDs of port requests that have been handled.
	     *
	     * This is used to avoid responding to the same request multiple times.
	     * Guest frames in particular may send duplicate requests (see comments in
	     * PortFinder).
	     *
	     * @type {Set<string>}
	     */
	    this._handledRequests = new Set();

	    // Create the `sidebar-host` channel immediately, while other channels are
	    // created on demand
	    this._sidebarHostChannel = new MessageChannel();
	    this._listeners = new ListenerCollection$1();

	    /** @type {Array<Partial<Message> & {allowedOrigin: string}>} */
	    this._allowedMessages = [{
	      allowedOrigin: '*',
	      frame1: 'guest',
	      frame2: 'host',
	      type: 'request'
	    }, {
	      allowedOrigin: '*',
	      frame1: 'guest',
	      frame2: 'sidebar',
	      type: 'request'
	    }, {
	      allowedOrigin: this._hypothesisAppsOrigin,
	      frame1: 'sidebar',
	      frame2: 'host',
	      type: 'request'
	    }, {
	      allowedOrigin: this._hypothesisAppsOrigin,
	      frame1: 'notebook',
	      frame2: 'sidebar',
	      type: 'request'
	    }];
	    this._listen();
	  }
	  _listen() {
	    const errorContext = 'Handling port request';
	    const sentErrors = /** @type {Set<string>} */new Set();

	    /** @param {string} message */
	    const reportError = message => {
	      if (sentErrors.has(message)) {
	        // PortFinder will send requests repeatedly until it gets a response or
	        // a timeout is reached.
	        //
	        // Only send errors once to avoid spamming Sentry.
	        return;
	      }
	      sentErrors.add(message);
	      sendError(new Error(message), errorContext);
	    };

	    /** @param {MessageEvent} event */
	    const handleRequest = event => {
	      const {
	        data,
	        origin,
	        source
	      } = event;
	      if (!isMessage(data) || data.type !== 'request') {
	        // If this does not look like a message intended for us, ignore it.
	        return;
	      }
	      const {
	        frame1,
	        frame2,
	        requestId,
	        sourceId
	      } = data;
	      const channel = /** @type {Channel} */`${frame1}-${frame2}`;
	      if (!isSourceWindow(source)) {
	        reportError(`Ignored port request for channel ${channel} from non-Window source`);
	        return;
	      }
	      const match = this._allowedMessages.find(({
	        allowedOrigin,
	        ...allowedMessage
	      }) => this._messageMatches({
	        allowedMessage,
	        allowedOrigin,
	        data,
	        origin
	      }));
	      if (match === undefined) {
	        reportError(`Ignored invalid port request for channel ${channel} from ${origin}`);
	        return;
	      }
	      if (this._handledRequests.has(requestId)) {
	        return;
	      }
	      this._handledRequests.add(requestId);

	      // Create the channel for these two frames to communicate and send the
	      // corresponding ports to them.
	      const messageChannel = channel === 'sidebar-host' ? this._sidebarHostChannel : new MessageChannel();

	      // The message that is sent to the target frame that the source wants to
	      // connect to, as well as the source frame requesting the connection.
	      // Each message is accompanied by a port for the appropriate end of the
	      // connection.
	      const message = {
	        frame1,
	        frame2,
	        type: 'offer',
	        requestId,
	        sourceId
	      };

	      // If the source window has an opaque origin [1], `event.origin` will be
	      // the string "null". This is not a legal value for the `targetOrigin`
	      // parameter to `postMessage`, so remap it to "*".
	      //
	      // [1] https://html.spec.whatwg.org/multipage/origin.html#origin.
	      //     Documents with opaque origins include file:// URLs and
	      //     sandboxed iframes.
	      const targetOrigin = origin === 'null' ? '*' : origin;
	      source.postMessage(message, targetOrigin, [messageChannel.port1]);
	      if (frame2 === 'sidebar') {
	        this._sidebarHostChannel.port2.postMessage(message, [messageChannel.port2]);
	      } else if (frame2 === 'host') {
	        this._emitter.emit('frameConnected', frame1, messageChannel.port2);
	      }
	    };
	    this._listeners.add(window, 'message', captureErrors(handleRequest, errorContext));
	  }

	  /**
	   * @param {object} options
	   *   @param {Partial<Message>} options.allowedMessage - the `data` must match this
	   *     `Message`.
	   *   @param {string} options.allowedOrigin - the `origin` must match this
	   *     value. If `allowedOrigin` is '*', the origin is ignored.
	   *   @param {unknown} options.data - the data to be compared with `allowedMessage`.
	   *   @param {string} options.origin - the origin to be compared with
	   *     `allowedOrigin`.
	   */
	  _messageMatches({
	    allowedMessage,
	    allowedOrigin,
	    data,
	    origin
	  }) {
	    if (allowedOrigin !== '*' && origin !== allowedOrigin) {
	      return false;
	    }
	    return isMessageEqual(data, allowedMessage);
	  }

	  /**
	   * @param {'frameConnected'} eventName
	   * @param {(source: 'guest'|'sidebar', port: MessagePort) => void} handler - this handler
	   *   fires when a frame connects to the host frame
	   */
	  on(eventName, handler) {
	    this._emitter.on(eventName, handler);
	  }
	  destroy() {
	    this._listeners.removeAll();
	  }
	}

	/*
	  This module was adapted from `index.js` in https://github.com/substack/frame-rpc.

	  This software is released under the MIT license:

	  Permission is hereby granted, free of charge, to any person obtaining a copy
	  of this software and associated documentation files (the "Software"), to deal
	  in the Software without restriction, including without limitation the rights
	  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	  copies of the Software, and to permit persons to whom the Software is
	  furnished to do so, subject to the following conditions:

	  The above copyright notice and this permission notice shall be included in
	  all copies or substantial portions of the Software.

	  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	  SOFTWARE.
	 */

	const VERSION = '1.0.0';
	const PROTOCOL = 'frame-rpc';

	/**
	 * Format of messages sent between frames.
	 *
	 * See https://github.com/substack/frame-rpc#protocol
	 *
	 * @typedef RequestMessage
	 * @prop {unknown[]} arguments
	 * @prop {string} method
	 * @prop {PROTOCOL} protocol
	 * @prop {number} sequence
	 * @prop {VERSION} version
	 *
	 * @typedef ResponseMessage
	 * @prop {unknown[]} arguments
	 * @prop {PROTOCOL} protocol
	 * @prop {number} response
	 * @prop {VERSION} version
	 *
	 * @typedef {RequestMessage|ResponseMessage} Message
	 *
	 * @typedef {import('../../types/annotator').Destroyable} Destroyable
	 */

	/**
	 * Send a PortRPC method call.
	 *
	 * @param {MessagePort} port
	 * @param {string} method
	 * @param {unknown[]} [args]
	 * @param {number} [sequence] - Sequence number used for replies
	 */
	function sendCall(port, method, args = [], sequence = -1) {
	  port.postMessage( /** @type {RequestMessage} */{
	    protocol: PROTOCOL,
	    version: VERSION,
	    arguments: args,
	    method,
	    sequence
	  });
	}

	/**
	 * Install a message listener that ensures proper delivery of "close" notifications
	 * from {@link PortRPC}s in Safari <= 15.
	 *
	 * This must be called in the _parent_ frame of the frame that owns the port.
	 * In Hypothesis this means for example that the workaround would be installed
	 * in the host frame to ensure delivery of "close" notifications from "guest"
	 * frames.
	 *
	 * @param {string} [userAgent] - Test seam
	 * @return {() => void} - Callback that removes the listener
	 */
	function installPortCloseWorkaroundForSafari( /* istanbul ignore next */
	userAgent = navigator.userAgent) {
	  if (!shouldUseSafariWorkaround(userAgent)) {
	    return () => {};
	  }

	  /** @param {MessageEvent} event */
	  const handler = event => {
	    var _event$data;
	    if (((_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.type) === 'hypothesisPortClosed' && event.ports[0]) {
	      const port = event.ports[0];
	      sendCall(port, 'close');
	      port.close();
	    }
	  };
	  window.addEventListener('message', handler);
	  return () => window.removeEventListener('message', handler);
	}

	/**
	 * Test whether this browser needs the workaround for https://bugs.webkit.org/show_bug.cgi?id=231167.
	 *
	 * @param {string} userAgent
	 */
	function shouldUseSafariWorkaround(userAgent) {
	  const webkitVersionMatch = userAgent.match(/\bAppleWebKit\/([0-9]+)\b/);
	  if (!webkitVersionMatch) {
	    return false;
	  }
	  const version = parseInt(webkitVersionMatch[1]);

	  // Chrome's user agent contains the token "AppleWebKit/537.36", where the
	  // version number is frozen. This corresponds to a version of Safari from 2013,
	  // which is older than all supported Safari versions.
	  if (version <= 537) {
	    return false;
	  }
	  return true;
	}

	/**
	 * Callback type used for RPC method handlers and result callbacks.
	 *
	 * @typedef {(...args: unknown[]) => void} Callback
	 */

	/**
	 * @param {any} value
	 * @return {value is Callback}
	 */
	function isCallback(value) {
	  return typeof value === 'function';
	}

	/**
	 * PortRPC provides remote procedure calls between frames or workers. It uses
	 * the Channel Messaging API [1] as a transport.
	 *
	 * To communicate between two frames with this class, construct a PortRPC
	 * instance in each and register method handlers with {@link on}. Create a
	 * {@link MessageChannel} and send one of its two ports to each frame. Then call
	 * {@link connect} to make the PortRPC instance in each frame use the corresponding
	 * port.
	 *
	 * In addition to the custom methods that a PortRPC handles, there are several
	 * built-in events which are sent automatically:
	 *
	 * - "connect" is sent when a PortRPC connects to a port. This event can
	 *   be used to confirm that the sending frame has received the port and will
	 *   send a "close" event when it goes away.
	 * - "close" is sent when a PortRPC is destroyed or the owning frame is
	 *   unloaded. This event may not be dispatched if the guest frame terminates
	 *   abnormally (eg. due to an OS process crash).
	 *
	 * [1] https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API
	 *
	 * @template {string} OnMethod - Names of RPC methods this client responds to
	 * @template {string} CallMethod - Names of RPC methods this client invokes
	 * @implements {Destroyable}
	 */
	class PortRPC {
	  /**
	   * @param {object} options
	   *   @param {string} [options.userAgent] - Test seam
	   *   @param {Window} [options.currentWindow] - Test seam
	   */
	  constructor({
	    userAgent = navigator.userAgent,
	    currentWindow = window
	  } = {}) {
	    /** @type {MessagePort|null} */
	    this._port = null;

	    /** @type {Map<string, Callback>} */
	    this._methods = new Map();
	    this._sequence = 1;

	    /** @type {Map<number, Callback>} */
	    this._callbacks = new Map();
	    this._listeners = new ListenerCollection$1();
	    this._listeners.add(currentWindow, 'unload', () => {
	      if (this._port) {
	        // Send "close" notification directly. This works in Chrome, Firefox and
	        // Safari >= 16.
	        sendCall(this._port, 'close');

	        // To work around a bug in Safari <= 15 which prevents sending messages
	        // while a window is unloading, try transferring the port to the parent frame
	        // and re-sending the "close" event from there.
	        if (currentWindow !== currentWindow.parent && shouldUseSafariWorkaround(userAgent)) {
	          currentWindow.parent.postMessage({
	            type: 'hypothesisPortClosed'
	          }, '*', [this._port]);
	        }
	      }
	    });

	    /**
	     * Method and arguments of pending RPC calls made before a port was connected.
	     *
	     * @type {Array<[CallMethod, unknown[]]>}
	     */
	    this._pendingCalls = [];
	    this._receivedCloseEvent = false;
	  }

	  /**
	   * Register a method handler for incoming RPC requests.
	   *
	   * This can also be used to register a handler for the built-in "connect"
	   * and "close" events.
	   *
	   * All handlers must be registered before {@link connect} is invoked.
	   *
	   * @template {function} Handler
	   * @param {OnMethod|'close'|'connect'} method
	   * @param {Handler} handler
	   */
	  on(method, handler) {
	    if (this._port) {
	      throw new Error('Cannot add a method handler after a port is connected');
	    }
	    this._methods.set(method, /** @type {any} */handler);
	  }

	  /**
	   * Connect to a MessagePort and process any queued RPC requests.
	   *
	   * @param {MessagePort} port
	   */
	  connect(port) {
	    this._port = port;
	    this._listeners.add(port, 'message', event => this._handle(event));
	    port.start();
	    sendCall(port, 'connect');
	    for (let [method, args] of this._pendingCalls) {
	      this.call(method, ...args);
	    }
	    this._pendingCalls = [];
	  }

	  /**
	   * Disconnect the RPC channel and close the MessagePort.
	   */
	  destroy() {
	    if (this._port) {
	      sendCall(this._port, 'close');
	      this._port.close();
	    }
	    this._destroyed = true;
	    this._listeners.removeAll();
	  }

	  /**
	   * Send an RPC request via the connected port.
	   *
	   * If this client is not yet connected to a port, the call will be queued and
	   * sent when {@link connect} is called.
	   *
	   * If the final argument in `args` is a function, it is treated as a callback
	   * which is invoked with the response in the form of (error, result) arguments.
	   *
	   * @param {CallMethod} method
	   * @param {unknown[]} args
	   */
	  call(method, ...args) {
	    if (!this._port) {
	      this._pendingCalls.push([method, args]);
	    }
	    if (!this._port || this._destroyed) {
	      return;
	    }
	    const seq = this._sequence++;
	    const finalArg = args[args.length - 1];
	    if (isCallback(finalArg)) {
	      this._callbacks.set(seq, finalArg);
	      args = args.slice(0, -1);
	    }
	    sendCall(this._port, method, args, seq);
	  }

	  /**
	   * Validate message
	   *
	   * @param {MessageEvent} event
	   * @return {null|Message}
	   */
	  _parseMessage({
	    data
	  }) {
	    if (!data || typeof data !== 'object') {
	      return null;
	    }
	    if (data.protocol !== PROTOCOL) {
	      return null;
	    }
	    if (data.version !== VERSION) {
	      return null;
	    }
	    if (!Array.isArray(data.arguments)) {
	      return null;
	    }
	    return data;
	  }

	  /**
	   * @param {MessageEvent} event
	   */
	  _handle(event) {
	    const msg = this._parseMessage(event);
	    const port = this._port;
	    if (!msg || !port) {
	      return;
	    }
	    if ('method' in msg) {
	      // Only allow close event to fire once.
	      if (msg.method === 'close') {
	        if (this._receivedCloseEvent) {
	          return;
	        } else {
	          this._receivedCloseEvent = true;
	        }
	      }
	      const handler = this._methods.get(msg.method);
	      if (!handler) {
	        return;
	      }

	      /** @param {unknown[]} args */
	      const callback = (...args) => {
	        /** @type {ResponseMessage} */
	        const message = {
	          arguments: args,
	          protocol: PROTOCOL,
	          response: msg.sequence,
	          version: VERSION
	        };
	        port.postMessage(message);
	      };
	      handler(...msg.arguments, callback);
	    } else if ('response' in msg) {
	      const cb = this._callbacks.get(msg.response);
	      this._callbacks.delete(msg.response);
	      if (cb) {
	        cb(...msg.arguments);
	      }
	    }
	  }
	}

	/**
	 * Return true if the client is from a browser extension.
	 *
	 * @param {string} url
	 * @return {boolean} - Returns true if this instance of the Hypothesis client is one
	 *   distributed in a browser extension, false if it's one embedded in a
	 *   website.
	 *
	 */
	function isBrowserExtension(url) {
	  return !(url.startsWith('http://') || url.startsWith('https://'));
	}

	/**
	 * Polyfill for `Object.hasOwn`.
	 *
	 * `hasOwn(someObject, property)` should be used instead of
	 * `someObject.hasOwnProperty(name)`.
	 *
	 * @param {object} object
	 * @param {string} property
	 */
	function hasOwn(object, property) {
	  return Object.prototype.hasOwnProperty.call(object, property);
	}

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
	 * Type conversion methods that coerce incoming configuration values to an
	 * expected type or format that other parts of the UI may make assumptions
	 * on. This is needed for incoming configuration values that are otherwise
	 * not sanitized.
	 *
	 * Note that if the values passed are plain javascript values (such as ones
	 * produced from JSON.parse), then these methods do not throw errors.
	 */

	/**
	 * Returns a boolean
	 *
	 * @param {any} value - initial value
	 * @return {boolean}
	 */
	function toBoolean(value) {
	  if (typeof value === 'string') {
	    if (value.trim().toLocaleLowerCase() === 'false') {
	      // "false", "False", " false", "FALSE" all return false
	      return false;
	    }
	  }
	  const numericalVal = Number(value);
	  if (!isNaN(numericalVal)) {
	    return Boolean(numericalVal);
	  }
	  // Any non numerical or falsely string should return true, otherwise return false
	  return typeof value === 'string';
	}

	/**
	 * Returns either an integer or NaN
	 *
	 * @param {any} value - initial value
	 * @return {number}
	 */
	function toInteger(value) {
	  // Acts as a simple wrapper
	  return parseInt(value);
	}

	/**
	 * Returns either the value if its an object or an empty object
	 *
	 * @param {any} value - initial value
	 * @return {object}
	 */
	function toObject(value) {
	  if (typeof value === 'object' && value !== null) {
	    return value;
	  }
	  // Don't attempt to fix the values, just ensure type correctness
	  return {};
	}

	/**
	 * Returns the value as a string or an empty string if the
	 * value undefined, null or otherwise falsely.
	 *
	 * @param {any} value - initial value
	 * @return {string}
	 */
	function toString(value) {
	  if (value && typeof value.toString === 'function') {
	    return value.toString();
	  }
	  return '';
	}

	/**
	 * @template T
	 * @typedef {import('preact').Ref<T>} Ref
	 */

	/**
	 * Helper for downcasting a ref to a more specific type, where that is safe
	 * to do.
	 *
	 * This is mainly useful to cast a generic `Ref<HTMLElement>` to a more specific
	 * element type (eg. `Ref<HTMLDivElement>`) for use with the `ref` prop of a JSX element.
	 * Since Preact only writes to the `ref` prop, such a cast is safe.
	 *
	 * @template T
	 * @template {T} U
	 * @param {Ref<T>|undefined} ref
	 * @return {Ref<U>|undefined}
	 */
	function downcastRef(ref) {
	  return (/** @type {Ref<U>|undefined} */ref
	  );
	}

	/**
	 * @typedef HypothesisWindowProps
	 * @prop {() => Record<string, unknown>} [hypothesisConfig] - Function that returns configuration
	 *   for the Hypothesis client
	 */

	/**
	 * Return an object containing config settings from window.hypothesisConfig().
	 *
	 * Return an object containing config settings returned by the
	 * window.hypothesisConfig() function provided by the host page:
	 *
	 *   {
	 *     fooSetting: 'fooValue',
	 *     barSetting: 'barValue',
	 *     ...
	 *   }
	 *
	 * If there's no window.hypothesisConfig() function then return {}.
	 *
	 * @param {Window & HypothesisWindowProps} window_ - The window to search for a hypothesisConfig() function
	 * @return {Record<string, unknown>} - Any config settings returned by hypothesisConfig()
	 */
	function configFuncSettingsFrom(window_) {
	  if (!hasOwn(window_, 'hypothesisConfig')) {
	    return {};
	  }
	  if (typeof window_.hypothesisConfig !== 'function') {
	    const docs = 'https://h.readthedocs.io/projects/client/en/latest/publishers/config/#window.hypothesisConfig';
	    console.warn('hypothesisConfig must be a function, see: ' + docs);
	    return {};
	  }
	  return window_.hypothesisConfig();
	}

	/**
	 * Return the URL of a resource related to the Hypothesis client that has been stored in
	 * the page via a `<link type="application/annotator+{type}">` tag.
	 *
	 * These link tags are generally written to the page by the boot script, which may be executed
	 * in a separate JavaScript realm (eg. in the browser extension), and thus can share information
	 * with the annotator code via the DOM but not JS globals.
	 *
	 * @param {Window} window_
	 * @param {string} rel - The `rel` attribute to match
	 * @param {'javascript'|'html'} type - Type of resource that the link refers to
	 * @throws {Error} - If there's no link with the `rel` indicated, or the first
	 *   matching link has no `href`
	 */
	function urlFromLinkTag(window_, rel, type) {
	  const link = /** @type {HTMLLinkElement} */
	  window_.document.querySelector(`link[type="application/annotator+${type}"][rel="${rel}"]`);
	  if (!link) {
	    throw new Error(`No application/annotator+${type} (rel="${rel}") link in the document`);
	  }
	  if (!link.href) {
	    throw new Error(`application/annotator+${type} (rel="${rel}") link has no href`);
	  }
	  return link.href;
	}

	/**
	 * @typedef SettingsGetters
	 * @prop {string|null} annotations
	 * @prop {string|null} query
	 * @prop {string|null} group
	 * @prop {string} showHighlights
	 * @prop {string} clientUrl
	 * @prop {string} sidebarAppUrl
	 * @prop {string} notebookAppUrl
	 * @prop {(name: string) => unknown} hostPageSetting
	 */

	/**
	 * Discard a setting if it is not a string.
	 *
	 * @param {unknown} value
	 */
	function checkIfString(value) {
	  return typeof value === 'string' ? value : null;
	}

	/**
	 * @param {Window} window_
	 * @return {SettingsGetters}
	 */
	function settingsFrom(window_) {
	  // Prioritize the `window.hypothesisConfig` function over the JSON format
	  // Via uses `window.hypothesisConfig` and makes it non-configurable and non-writable.
	  // In addition, Via sets the `ignoreOtherConfiguration` option to prevent configuration merging.
	  const configFuncSettings = configFuncSettingsFrom(window_);

	  /** @type {Record<string, unknown>} */
	  let jsonConfigs;
	  if (toBoolean(configFuncSettings.ignoreOtherConfiguration)) {
	    jsonConfigs = {};
	  } else {
	    jsonConfigs = parseJsonConfig(window_.document);
	  }

	  /**
	   * Return the `#annotations:*` ID from the given URL's fragment.
	   *
	   * If the URL contains a `#annotations:<ANNOTATION_ID>` fragment then return
	   * the annotation ID extracted from the fragment. Otherwise return `null`.
	   *
	   * @return {string|null} - The extracted ID, or null.
	   */
	  function annotations() {
	    /** Return the annotations from the URL, or null. */
	    function annotationsFromURL() {
	      // Annotation IDs are url-safe-base64 identifiers
	      // See https://tools.ietf.org/html/rfc4648#page-7
	      const annotFragmentMatch = window_.location.href.match(/#annotations:([A-Za-z0-9_-]+)$/);
	      if (annotFragmentMatch) {
	        return annotFragmentMatch[1];
	      }
	      return null;
	    }
	    return checkIfString(jsonConfigs.annotations) || annotationsFromURL();
	  }

	  /**
	   * Return the `#annotations:group:*` ID from the given URL's fragment.
	   *
	   * If the URL contains a `#annotations:group:<GROUP_ID>` fragment then return
	   * the group ID extracted from the fragment. Otherwise return `null`.
	   *
	   * @return {string|null} - The extracted ID, or null.
	   */
	  function group() {
	    function groupFromURL() {
	      const groupFragmentMatch = window_.location.href.match(/#annotations:group:([A-Za-z0-9_-]+)$/);
	      if (groupFragmentMatch) {
	        return groupFragmentMatch[1];
	      }
	      return null;
	    }
	    return checkIfString(jsonConfigs.group) || groupFromURL();
	  }
	  function showHighlights() {
	    const value = hostPageSetting('showHighlights');
	    switch (value) {
	      case 'always':
	      case 'never':
	      case 'whenSidebarOpen':
	        return value;
	      case true:
	        return 'always';
	      case false:
	        return 'never';
	      default:
	        return 'always';
	    }
	  }

	  /**
	   * Return the config.query setting from the host page or from the URL.
	   *
	   * If the host page contains a js-hypothesis-config script containing a
	   * query setting then return that.
	   *
	   * Otherwise if the host page's URL has a `#annotations:query:*` (or
	   * `#annotations:q:*`) fragment then return the query value from that.
	   *
	   * Otherwise return null.
	   *
	   * @return {string|null} - The config.query setting, or null.
	   */
	  function query() {
	    /** Return the query from the URL, or null. */
	    function queryFromURL() {
	      const queryFragmentMatch = window_.location.href.match(/#annotations:(query|q):(.+)$/i);
	      if (queryFragmentMatch) {
	        try {
	          return decodeURIComponent(queryFragmentMatch[2]);
	        } catch (err) {
	          // URI Error should return the page unfiltered.
	        }
	      }
	      return null;
	    }
	    return checkIfString(jsonConfigs.query) || queryFromURL();
	  }

	  /**
	   * Returns the first setting value found from the respective sources in order.
	   *
	   *  1. window.hypothesisConfig()
	   *  2. <script class="js-hypothesis-config">
	   *
	   * If the setting is not found in either source, then return undefined.
	   *
	   * @param {string} name - Unique name of the setting
	   */
	  function hostPageSetting(name) {
	    if (hasOwn(configFuncSettings, name)) {
	      return configFuncSettings[name];
	    }
	    if (hasOwn(jsonConfigs, name)) {
	      return jsonConfigs[name];
	    }
	    return undefined;
	  }
	  return {
	    get annotations() {
	      return annotations();
	    },
	    get clientUrl() {
	      return urlFromLinkTag(window_, 'hypothesis-client', 'javascript');
	    },
	    get group() {
	      return group();
	    },
	    get notebookAppUrl() {
	      return urlFromLinkTag(window_, 'notebook', 'html');
	    },
	    get showHighlights() {
	      return showHighlights();
	    },
	    get sidebarAppUrl() {
	      return urlFromLinkTag(window_, 'sidebar', 'html');
	    },
	    get query() {
	      return query();
	    },
	    hostPageSetting
	  };
	}

	/**
	 * @typedef {import('./settings').SettingsGetters} SettingsGetters
	 * @typedef {(settings: SettingsGetters, name: string) => any} ValueGetter
	 *
	 * @typedef ConfigDefinition
	 * @prop {ValueGetter} getValue - Method to retrieve the value from the incoming source
	 * @prop {boolean} allowInBrowserExt -
	 *  Allow this setting to be read in the browser extension. If this is false
	 *  and browser extension context is true, use `defaultValue` if provided otherwise
	 *  ignore the config key
	 * @prop {any} [defaultValue] - Sets a default if `getValue` returns undefined
	 * @prop {(value: any) => any} [coerce] - Transform a value's type, value or both
	 *
	 * @typedef {Record<string, ConfigDefinition>} ConfigDefinitionMap
	 */

	/**
	 * Named subset of the Hypothesis client configuration that is relevant in
	 * a particular context.
	 *
	 * @typedef {'sidebar'|'notebook'|'annotator'|'all'} Context
	 */

	/**
	 * Returns the configuration keys that are relevant to a particular context.
	 *
	 * @param {Context} context
	 */
	function configurationKeys(context) {
	  const contexts = {
	    annotator: ['clientUrl', 'contentInfoBanner', 'subFrameIdentifier'],
	    sidebar: ['appType', 'annotations', 'branding', 'enableExperimentalNewNoteButton', 'externalContainerSelector', 'focus', 'group', 'onLayoutChange', 'openSidebar', 'query', 'requestConfigFromFrame', 'services', 'showHighlights', 'sidebarAppUrl', 'theme', 'usernameUrl'],
	    notebook: ['branding', 'group', 'notebookAppUrl', 'requestConfigFromFrame', 'services', 'theme', 'usernameUrl']
	  };
	  switch (context) {
	    case 'annotator':
	      return contexts.annotator;
	    case 'sidebar':
	      return contexts.sidebar;
	    case 'notebook':
	      return contexts.notebook;
	    case 'all':
	      // Complete list of configuration keys used for testing.
	      return [...contexts.annotator, ...contexts.sidebar, ...contexts.notebook];
	    default:
	      throw new Error(`Invalid application context used: "${context}"`);
	  }
	}

	/** @type {ValueGetter} */
	function getHostPageSetting(settings, name) {
	  return settings.hostPageSetting(name);
	}

	/**
	 * Definitions of configuration keys
	 *
	 * @type {ConfigDefinitionMap}
	 */
	const configDefinitions = {
	  annotations: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: settings => settings.annotations
	  },
	  appType: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  branding: {
	    defaultValue: null,
	    allowInBrowserExt: false,
	    getValue: getHostPageSetting
	  },
	  // URL of the client's boot script. Used when injecting the client into
	  // child iframes.
	  clientUrl: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: settings => settings.clientUrl
	  },
	  contentInfoBanner: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  enableExperimentalNewNoteButton: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  group: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: settings => settings.group
	  },
	  focus: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  theme: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  usernameUrl: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  onLayoutChange: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  openSidebar: {
	    allowInBrowserExt: true,
	    defaultValue: false,
	    coerce: toBoolean,
	    getValue: getHostPageSetting
	  },
	  query: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: settings => settings.query
	  },
	  requestConfigFromFrame: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  services: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  showHighlights: {
	    allowInBrowserExt: false,
	    defaultValue: 'always',
	    getValue: settings => settings.showHighlights
	  },
	  notebookAppUrl: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: settings => settings.notebookAppUrl
	  },
	  sidebarAppUrl: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: settings => settings.sidebarAppUrl
	  },
	  // Sub-frame identifier given when a frame is being embedded into
	  // by a top level client
	  subFrameIdentifier: {
	    allowInBrowserExt: true,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  },
	  externalContainerSelector: {
	    allowInBrowserExt: false,
	    defaultValue: null,
	    getValue: getHostPageSetting
	  }
	};

	/**
	 * Return the subset of Hypothesis client configuration that is relevant in
	 * a particular context.
	 *
	 * See https://h.readthedocs.io/projects/client/en/latest/publishers/config/
	 * for details of all available configuration and the different ways they
	 * can be included on the page. In addition to the configuration provided by
	 * the embedder, the boot script also passes some additional configuration
	 * to the annotator, such as URLs of the various sub-applications and the
	 * boot script itself.
	 *
	 * @param {Context} context
	 */
	function getConfig(context, window_ = window) {
	  const settings = settingsFrom(window_);

	  /** @type {Record<string, unknown>} */
	  const config = {};

	  // Filter the config based on the application context as some config values
	  // may be inappropriate or erroneous for some applications.
	  for (let key of configurationKeys(context)) {
	    const configDef = configDefinitions[key];
	    const hasDefault = configDef.defaultValue !== undefined; // A default could be null
	    const isURLFromBrowserExtension = isBrowserExtension(urlFromLinkTag(window_, 'sidebar', 'html'));

	    // Only allow certain values in the browser extension context
	    if (!configDef.allowInBrowserExt && isURLFromBrowserExtension) {
	      // If the value is not allowed here, then set to the default if provided, otherwise ignore
	      // the key:value pair
	      if (hasDefault) {
	        config[key] = configDef.defaultValue;
	      }
	      continue;
	    }

	    // Get the value from the configuration source
	    const value = configDef.getValue(settings, key);
	    if (value === undefined) {
	      // If there is no value (e.g. undefined), then set to the default if provided,
	      // otherwise ignore the config key:value pair
	      if (hasDefault) {
	        config[key] = configDef.defaultValue;
	      }
	      continue;
	    }

	    // Finally, run the value through an optional coerce method
	    config[key] = configDef.coerce ? configDef.coerce(value) : value;
	  }
	  return config;
	}

	/**
	 * Bit flags indicating modifiers required by a shortcut or pressed in a key event.
	 */
	const modifiers = {
	  alt: 1,
	  ctrl: 2,
	  meta: 4,
	  shift: 8
	};

	/**
	 * Match a `shortcut` key sequence against a keydown event.
	 *
	 * A shortcut key sequence is a string of "+"-separated keyboard modifiers and
	 * keys. The list may contain zero or more modifiers and must contain exactly
	 * one non-modifier key. The key and modifier names are case-insensitive.
	 * For example "Ctrl+Enter", "shift+a".
	 *
	 * Key names are matched against {@link KeyboardEvent.key}. Be aware that this
	 * property is affected by the modifiers for certain keys. For example on a US
	 * QWERTY keyboard, "Shift+1" would not match any event because the key value
	 * would be "!" instead. See also https://github.com/w3c/uievents/issues/247.
	 */
	function matchShortcut(event, shortcut) {
	  const parts = shortcut.split('+').map(p => p.toLowerCase());
	  let requiredModifiers = 0;
	  let requiredKey = null;
	  for (const part of parts) {
	    const modifierFlag = modifiers[part];
	    if (modifierFlag) {
	      requiredModifiers |= modifierFlag;
	    } else if (requiredKey === null) {
	      requiredKey = part;
	    } else {
	      throw new Error('Multiple non-modifier keys specified');
	    }
	  }
	  if (!requiredKey) {
	    throw new Error(`Invalid shortcut: ${shortcut}`);
	  }
	  const actualModifiers = (event.ctrlKey ? modifiers.ctrl : 0) | (event.metaKey ? modifiers.meta : 0) | (event.altKey ? modifiers.alt : 0) | (event.shiftKey ? modifiers.shift : 0);
	  return actualModifiers === requiredModifiers && event.key.toLowerCase() === requiredKey;
	}
	/**
	 * Install a shortcut key listener on the document.
	 *
	 * This can be used directly outside of a component. To use within a Preact
	 * component, you probably want {@link useShortcut}.
	 *
	 * @param shortcut - Shortcut key sequence. See {@link matchShortcut}.
	 * @param onPress - A function to call when the shortcut matches
	 * @return A function that removes the shortcut
	 */
	function installShortcut(shortcut, onPress, {
	  // We use `documentElement` as the root element rather than `document.body`
	  // which is used as a root element in some other places because the body
	  // element is not keyboard-focusable in XHTML documents in Safari/Chrome.
	  // See https://github.com/hypothesis/client/issues/4364.
	  rootElement = document.documentElement
	} = {}) {
	  const onKeydown = event => {
	    if (matchShortcut(event, shortcut)) {
	      onPress(event);
	    }
	  };
	  rootElement.addEventListener('keydown', onKeydown);
	  return () => rootElement.removeEventListener('keydown', onKeydown);
	}

	/**
	 * An effect hook that installs a shortcut using {@link installShortcut} and
	 * removes it when the component is unmounted.
	 *
	 * This provides a convenient way to enable a document-level shortcut while
	 * a component is mounted. This differs from adding an `onKeyDown` handler to
	 * one of the component's DOM elements in that it doesn't require the component
	 * to have focus.
	 *
	 * To conditionally disable the shortcut, set `shortcut` to `null`.
	 *
	 * @param shortcut - A shortcut key sequence to match or `null` to disable. See {@link matchShortcut}.
	 * @param onPress - A function to call when the shortcut matches
	 */
	function useShortcut(shortcut, onPress, {
	  rootElement
	} = {}) {
	  h(() => {
	    if (!shortcut) {
	      return undefined;
	    }
	    return installShortcut(shortcut, onPress, {
	      rootElement
	    });
	  }, [shortcut, onPress, rootElement]);
	}

	/**
	 * @typedef Listener
	 * @prop {EventTarget} eventTarget
	 * @prop {string} eventType
	 * @prop {(event: Event) => void} listener
	 */

	/**
	 * Return the event type that a listener will receive.
	 *
	 * For example `EventType<HTMLElement, 'keydown'>` evaluates to `KeyboardEvent`.
	 *
	 * The event type is extracted from the target's `on${Type}` property (eg.
	 * `HTMLElement.onkeydown` here) If there is no such property, the type defaults
	 * to `Event`.
	 *
	 * @template {EventTarget} Target
	 * @template {string} Type
	 * @typedef {`on${Type}` extends keyof Target ?
	 *   Target[`on${Type}`] extends ((...args: any[]) => void)|null ?
	 *     Parameters<NonNullable<Target[`on${Type}`]>>[0]
	 *  : Event : Event} EventType
	 */

	/**
	 * Utility that provides a way to conveniently remove a set of DOM event
	 * listeners when they are no longer needed.
	 */
	class ListenerCollection {
	  constructor() {
	    /** @type {Map<Symbol, Listener>} */
	    this._listeners = new Map();
	  }
	  /**
	   * Add a listener and return an ID that can be used to remove it later
	   *
	   * @template {string} Type
	   * @template {EventTarget} Target
	   * @param {Target} eventTarget
	   * @param {Type} eventType
	   * @param {(event: EventType<Target, Type>) => void} listener
	   * @param {AddEventListenerOptions} [options]
	   */


	  add(eventTarget, eventType, listener, options) {
	    eventTarget.addEventListener(eventType,
	    /** @type {EventListener} */
	    listener, options);
	    const symbol = Symbol();

	    this._listeners.set(symbol, {
	      eventTarget,
	      eventType,
	      // eslint-disable-next-line object-shorthand
	      listener:
	      /** @type {EventListener} */
	      listener
	    });

	    return symbol;
	  }
	  /**
	   * Remove a specific listener.
	   *
	   * @param {Symbol} listenerId
	   */


	  remove(listenerId) {
	    const event = this._listeners.get(listenerId);

	    if (event) {
	      const {
	        eventTarget,
	        eventType,
	        listener
	      } = event;
	      eventTarget.removeEventListener(eventType, listener);

	      this._listeners.delete(listenerId);
	    }
	  }

	  removeAll() {
	    this._listeners.forEach(({
	      eventTarget,
	      eventType,
	      listener
	    }) => {
	      eventTarget.removeEventListener(eventType, listener);
	    });

	    this._listeners.clear();
	  }

	}

	/**
	 * @param {HTMLElement & { disabled?: boolean }} element
	 */

	function isElementDisabled(element) {
	  return typeof element.disabled === 'boolean' && element.disabled;
	}
	/** @param {HTMLElement} element */


	function isElementVisible(element) {
	  return element.offsetParent !== null;
	}
	/**
	 * Enable arrow key navigation between interactive descendants of a
	 * container element.
	 *
	 * In addition to moving focus between elements when arrow keys are pressed,
	 * this also implements the "roving tabindex" pattern [1] which sets the
	 * `tabindex` attribute of elements to control which element gets focus when the
	 * user tabs into the container.
	 *
	 * See [2] for a reference of how keyboard navigation should work in web
	 * applications and how it applies to various common widgets.
	 *
	 * @example
	 *   function MyToolbar() {
	 *     const container = useRef();
	 *
	 *     // Enable arrow key navigation between interactive elements in the
	 *     // toolbar container.
	 *     useArrowKeyNavigation(container);
	 *
	 *     return (
	 *       <div ref={container} role="toolbar">
	 *         <button>Bold</bold>
	 *         <button>Italic</bold>
	 *         <a href="https://example.com/help">Help</a>
	 *       </div>
	 *     )
	 *   }
	 *
	 * [1] https://www.w3.org/TR/wai-aria-practices/#kbd_roving_tabindex
	 * [2] https://www.w3.org/TR/wai-aria-practices/#keyboard
	 *
	 * @param {import('preact').RefObject<HTMLElement>} containerRef
	 * @param {object} options
	 *   @param {boolean} [options.autofocus] - Whether to focus the first element
	 *     in the set of matching elements when the component is mounted
	 *   @param {boolean} [options.horizontal] - Enable navigating elements using left/right arrow keys
	 *   @param {boolean} [options.vertical] - Enable navigating elements using up/down arrow keys
	 *   @param {string} [options.selector] - CSS selector which specifies the
	 *     elements that navigation moves between
	 */


	function useArrowKeyNavigation(containerRef, {
	  autofocus = false,
	  horizontal = true,
	  vertical = true,
	  selector = 'a,button'
	} = {}) {
	  h(() => {
	    if (!containerRef.current) {
	      throw new Error('Container ref not set');
	    }

	    const container = containerRef.current;

	    const getNavigableElements = () => {
	      const elements =
	      /** @type {HTMLElement[]} */
	      Array.from(container.querySelectorAll(selector));
	      return elements.filter(el => isElementVisible(el) && !isElementDisabled(el));
	    };
	    /**
	     * Update the `tabindex` attribute of navigable elements.
	     *
	     * Exactly one element will have `tabindex=0` and all others will have
	     * `tabindex=1`.
	     *
	     * @param {HTMLElement[]} elements
	     * @param {number} currentIndex - Index of element in `elements` to make current.
	     *   Defaults to the current element if there is one, or the first element
	     *   otherwise.
	     * @param {boolean} setFocus - Whether to focus the current element
	     */


	    const updateTabIndexes = (elements = getNavigableElements(), currentIndex = -1, setFocus = false) => {
	      if (currentIndex < 0) {
	        currentIndex = elements.findIndex(el => el.tabIndex === 0);

	        if (currentIndex < 0) {
	          currentIndex = 0;
	        }
	      }

	      for (let [index, element] of elements.entries()) {
	        element.tabIndex = index === currentIndex ? 0 : -1;

	        if (index === currentIndex && setFocus) {
	          element.focus();
	        }
	      }
	    };
	    /** @param {KeyboardEvent} event */


	    const onKeyDown = event => {
	      const elements = getNavigableElements();
	      let currentIndex = elements.findIndex(item => item.tabIndex === 0);
	      let handled = false;

	      if (horizontal && event.key === 'ArrowLeft' || vertical && event.key === 'ArrowUp') {
	        if (currentIndex === 0) {
	          currentIndex = elements.length - 1;
	        } else {
	          --currentIndex;
	        }

	        handled = true;
	      } else if (horizontal && event.key === 'ArrowRight' || vertical && event.key === 'ArrowDown') {
	        if (currentIndex === elements.length - 1) {
	          currentIndex = 0;
	        } else {
	          ++currentIndex;
	        }

	        handled = true;
	      } else if (event.key === 'Home') {
	        currentIndex = 0;
	        handled = true;
	      } else if (event.key === 'End') {
	        currentIndex = elements.length - 1;
	        handled = true;
	      }

	      if (!handled) {
	        return;
	      }

	      updateTabIndexes(elements, currentIndex, true);
	      event.preventDefault();
	      event.stopPropagation();
	    };

	    updateTabIndexes(getNavigableElements(), 0, autofocus);
	    const listeners = new ListenerCollection(); // Set an element as current when it gains focus. In Safari this event
	    // may not be received if the element immediately loses focus after it
	    // is triggered.

	    listeners.add(container, 'focusin', event => {
	      const elements = getNavigableElements();
	      const targetIndex = elements.indexOf(
	      /** @type {HTMLElement} */
	      event.target);

	      if (targetIndex >= 0) {
	        updateTabIndexes(elements, targetIndex);
	      }
	    });
	    listeners.add(container, 'keydown',
	    /** @type {EventListener} */
	    onKeyDown); // Update the tab indexes of elements as they are added, removed, enabled
	    // or disabled.

	    const mo = new MutationObserver(() => {
	      updateTabIndexes();
	    });
	    mo.observe(container, {
	      subtree: true,
	      attributes: true,
	      attributeFilter: ['disabled'],
	      childList: true
	    });
	    return () => {
	      listeners.removeAll();
	      mo.disconnect();
	    };
	  }, [autofocus, containerRef, horizontal, selector, vertical]);
	}

	/**
	 * @template T
	 * @typedef {import('preact').RefObject<T>} RefObject
	 */

	/**
	 * @template T
	 * @typedef {import('preact').Ref<T>} Ref
	 */

	/**
	 * Object ref which synchronizes its value to another ref.
	 *
	 * @template T
	 * @implements {RefObject<T>}
	 */

	class SyncedRef {
	  /**
	   * @param {Ref<T>} [target] - Initial target for this ref to synchronize to.
	   *   This is not called/set until the {@link current} property of the
	   *   SyncedRef is set. This makes the target behave close to how it would
	   *   if used in place of the SyncedRef.
	   */
	  constructor(target) {
	    /** @type {Ref<T>|undefined} */
	    this._target = target;
	    /** @type {T|null} */

	    this._value = null;
	  }

	  get current() {
	    return this._value;
	  }
	  /** @param {T|null} value */


	  set current(value) {
	    this._value = value;

	    this._updateTarget();
	  }

	  get target() {
	    return this._target;
	  }
	  /** @param {Ref<T>|undefined} target */


	  set target(target) {
	    if (target === this._target) {
	      return;
	    }

	    this._target = target; // If the target changes after the initial render, we currently synchronize
	    // the value immediately. This is different than what happens if the target
	    // were passed to an element directly, as it would be updated only after the
	    // render.

	    this._updateTarget();
	  }

	  _updateTarget() {
	    const value = this._value;

	    if (typeof this._target === 'function') {
	      this._target(value);
	    } else if (this._target) {
	      this._target.current = value;
	    }
	  }

	}
	/**
	 * Return an object ref which synchronizes its value to another "target" ref.
	 *
	 * This is useful when a component needs an object ref for an element for
	 * internal use, but also wants to allow the caller to get a ref for the same
	 * element.
	 *
	 * The target ref can be either a callback or an object.
	 *
	 * @example
	 *   function Widget({ elementRef }) {
	 *     const ref = useSyncedRef(elementRef);
	 *
	 *     useEffect(() => {
	 *       ref.current.focus();
	 *     }, []);
	 *
	 *     return <input ref={ref}>...</input>;
	 *   }
	 *
	 * @template T
	 * @param {import('preact').Ref<T>} [targetRef]
	 * @return {import('preact').RefObject<T>}
	 */


	function useSyncedRef(targetRef) {
	  const container = _$1(new SyncedRef(targetRef));
	  container.current.target = targetRef;
	  return container.current;
	}

	var _jsxFileName$2k = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Annotate.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from annotate.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function AnnotateIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M15 0c.27 0 .505.099.703.297A.961.961 0 0 1 16 1v15l-4-3H1a.974.974 0 0 1-.703-.29A.953.953 0 0 1 0 12V1A.96.96 0 0 1 .29.29.966.966 0 0 1 1 0h14zM7 3l-.469.063c-.312.041-.656.187-1.031.437-.375.25-.719.646-1.031 1.188C4.156 5.229 4 6 4 7l.002.063.006.062a.896.896 0 0 1 .008.11l-.002.074-.006.066a1.447 1.447 0 0 0 .43 1.188C4.729 8.854 5.082 9 5.5 9c.417 0 .77-.146 1.063-.438C6.854 8.271 7 7.918 7 7.5c0-.417-.146-.77-.438-1.063A1.447 1.447 0 0 0 5.5 6a1.467 1.467 0 0 0-.422.062c.177-1.03.542-1.632 1.094-1.804L7 4V3zm5 0-.469.063c-.312.041-.656.187-1.031.437-.375.25-.719.646-1.031 1.188C9.156 5.229 9 6 9 7l.002.063.006.062a.896.896 0 0 1 .008.11l-.002.074-.006.066a1.447 1.447 0 0 0 .43 1.188c.291.291.645.437 1.062.437.417 0 .77-.146 1.063-.438.291-.291.437-.645.437-1.062 0-.417-.146-.77-.438-1.063A1.447 1.447 0 0 0 10.5 6a1.467 1.467 0 0 0-.422.062c.177-1.03.542-1.632 1.094-1.804L12 4V3z"
	    }, void 0, false, {
	      fileName: _jsxFileName$2k,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2k,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2j = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/AnnotateAlt.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from annotate-alt.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function AnnotateAltIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2j,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M14 0a2 2 0 0 1 2 2v13a1 1 0 0 1-1.555.832l-4.262-1.757A1 1 0 0 0 9.802 14H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12zm-2.109 3.5h-.484l-.14.006-.122.018a.684.684 0 0 0-.2.071l-.076.054-.108.1-.097.1-1.632 1.999-.091.12-.084.129a2.56 2.56 0 0 0-.291.722l-.03.142-.027.218-.009.223v2.646l.01.086.027.08a.537.537 0 0 0 .236.236l.067.028.07.016.074.006h2.907l.074-.006.094-.024a.516.516 0 0 0 .169-.108.525.525 0 0 0 .082-.096l.029-.051.027-.081.01-.086V7.336l-.006-.073-.018-.068a.436.436 0 0 0-.124-.178.549.549 0 0 0-.103-.074l-.055-.026-.087-.024-.092-.009h-.579l-.057-.006-.054-.017a.307.307 0 0 1-.096-.07.175.175 0 0 1-.045-.078l-.004-.04.01-.043.022-.043 1.311-2.227.047-.09.037-.106a.492.492 0 0 0-.06-.394.531.531 0 0 0-.255-.22l-.084-.028-.092-.016-.1-.006zm-5.924 0h-.424l-.121.006-.108.018a.552.552 0 0 0-.174.071l-.067.054-.095.1-.084.1-1.429 1.999-.08.12-.096.174a2.798 2.798 0 0 0-.232.677l-.025.142-.024.218L3 7.402v2.646l.008.086.024.08a.486.486 0 0 0 .097.148.468.468 0 0 0 .11.088l.058.028.062.016.065.006h2.543l.065-.006.082-.024a.513.513 0 0 0 .22-.204l.025-.051.024-.081.008-.086V7.336l-.005-.073-.023-.09a.487.487 0 0 0-.191-.23l-.048-.026-.076-.024-.08-.009H5.46l-.05-.006-.047-.017a.273.273 0 0 1-.084-.07.182.182 0 0 1-.04-.078l-.003-.04.008-.043.02-.043L6.411 4.36l.04-.09.033-.106a.553.553 0 0 0-.053-.394.49.49 0 0 0-.222-.22l-.074-.028-.08-.016-.089-.006z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2j,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2j,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2j,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2i = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ArrowDown.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from arrow-down.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ArrowDownIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2i,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m12 9-4 4-4-4m4 3V3v9z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2i,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2i,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2i,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2h = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ArrowLeft.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from arrow-left.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ArrowLeftIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2h,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M7 12 3 8l4-4M4 8h9-9z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2h,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2h,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2h,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2g = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ArrowRight.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from arrow-right.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ArrowRightIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2g,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m9 4 4 4-4 4m3-4H3h9z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2g,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2g,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2g,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2f = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ArrowUp.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from arrow-up.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ArrowUpIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2f,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m4 7 4-4 4 4M8 4v9-9z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2f,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2f,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2f,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2e = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Bookmark.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from bookmark.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function BookmarkIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2e,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M13 1v14l-5-4-5 4V1z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2e,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2e,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2e,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2d = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/BookmarkFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from bookmark-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function BookmarkFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2d,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M13 0a1 1 0 0 1 .993.883L14 1v14a1 1 0 0 1-1.534.846l-.09-.065L8 12.28l-4.375 3.5a1.001 1.001 0 0 1-1.6-.556l-.02-.112L2 15V1a1 1 0 0 1 .883-.993L3 0h10z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2d,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2d,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2d,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2c = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Cancel.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from cancel.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CancelIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2c,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m8 8 3.536-3.536L8 8 4.464 4.464 8 8zm0 0-3.536 3.536L8 8l3.536 3.536L8 8z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2c,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2c,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2c,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2b = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CaretDown.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from caret-down.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CaretDownIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2b,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m12 6-4 4-4-4"
	      }, void 0, false, {
	        fileName: _jsxFileName$2b,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2b,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2b,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2a = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CaretLeft.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from caret-left.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CaretLeftIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$2a,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M10 12 6 8l4-4"
	      }, void 0, false, {
	        fileName: _jsxFileName$2a,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$2a,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$2a,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$29 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CaretRight.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from caret-right.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CaretRightIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$29,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m6 4 4 4-4 4"
	      }, void 0, false, {
	        fileName: _jsxFileName$29,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$29,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$29,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$28 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CaretUp.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from caret-up.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CaretUpIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$28,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m4 10 4-4 4 4"
	      }, void 0, false, {
	        fileName: _jsxFileName$28,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$28,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$28,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$27 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Caution.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from caution.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CautionIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 24 24",
	    fill: "none",
	    stroke: "currentColor",
	    "stroke-width": "2.5",
	    "stroke-linecap": "round",
	    "stroke-linejoin": "round",
	    ...props,
	    children: o("path", {
	      d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
	    }, void 0, false, {
	      fileName: _jsxFileName$27,
	      lineNumber: 22,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$27,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$26 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CcStd.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from cc-std.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CcStdIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$26,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M7.985 0c2.238 0 4.143.781 5.715 2.343a7.694 7.694 0 0 1 1.714 2.579C15.804 5.888 16 6.914 16 8a8.164 8.164 0 0 1-.579 3.078 7.344 7.344 0 0 1-1.707 2.536 8.222 8.222 0 0 1-2.657 1.772c-.99.41-2.014.614-3.071.614a7.775 7.775 0 0 1-3.036-.607 8.047 8.047 0 0 1-2.6-1.757A7.846 7.846 0 0 1 0 8c0-1.057.202-2.074.607-3.05a8.033 8.033 0 0 1 1.764-2.62C3.895.777 5.766 0 7.985 0zm.03 1.443c-1.83 0-3.367.638-4.615 1.914a6.878 6.878 0 0 0-1.45 2.15A6.301 6.301 0 0 0 1.443 8c0 .858.168 1.684.507 2.479a6.627 6.627 0 0 0 1.45 2.129 6.593 6.593 0 0 0 2.129 1.428c.79.329 1.619.493 2.485.493.857 0 1.688-.166 2.494-.5a6.91 6.91 0 0 0 2.178-1.442c1.247-1.22 1.871-2.748 1.871-4.586a6.57 6.57 0 0 0-.486-2.515 6.397 6.397 0 0 0-1.413-2.114C11.37 2.086 9.824 1.443 8.014 1.443zm-.1 5.229-1.073.557c-.114-.238-.254-.405-.42-.5a.95.95 0 0 0-.465-.143c-.714 0-1.072.472-1.072 1.415 0 .428.09.77.271 1.028.181.257.448.386.8.386.467 0 .796-.229.987-.686l.985.5a2.35 2.35 0 0 1-2.1 1.257c-.714 0-1.29-.218-1.729-.657-.438-.438-.657-1.047-.657-1.828 0-.762.222-1.367.665-1.814.442-.448 1.002-.672 1.678-.672.991 0 1.7.385 2.13 1.157zm4.613 0-1.057.557c-.114-.238-.255-.405-.421-.5a.972.972 0 0 0-.479-.143c-.714 0-1.072.472-1.072 1.415 0 .428.091.77.272 1.028.18.257.447.386.8.386.466 0 .795-.229.985-.686l1 .5c-.218.39-.514.698-.885.922a2.308 2.308 0 0 1-1.214.335c-.724 0-1.302-.218-1.735-.657-.434-.438-.65-1.047-.65-1.828 0-.762.22-1.367.664-1.814.442-.448 1.002-.672 1.678-.672.99 0 1.696.385 2.114 1.157z"
	      }, void 0, false, {
	        fileName: _jsxFileName$26,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$26,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$26,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$25 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CcStdFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from cc-std-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CcStdFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M7.985 0c2.238 0 4.143.781 5.715 2.343a7.694 7.694 0 0 1 1.714 2.579C15.804 5.888 16 6.914 16 8a8.164 8.164 0 0 1-.579 3.078 7.344 7.344 0 0 1-1.707 2.536 8.222 8.222 0 0 1-2.657 1.772c-.99.41-2.014.614-3.071.614a7.775 7.775 0 0 1-3.036-.607 8.047 8.047 0 0 1-2.6-1.757A7.846 7.846 0 0 1 0 8c0-1.057.202-2.074.607-3.05A8.033 8.033 0 0 1 2.371 2.33C3.895.777 5.766 0 7.985 0Zm-2.2 5.515c-.676 0-1.236.224-1.678.672-.443.447-.665 1.052-.665 1.814 0 .78.22 1.39.657 1.828.438.439 1.015.657 1.73.657.447 0 .857-.111 1.228-.335.318-.192.577-.445.776-.76l.095-.162-.985-.5c-.191.457-.52.686-.986.686-.353 0-.62-.129-.8-.386-.181-.257-.272-.6-.272-1.028 0-.943.358-1.415 1.072-1.415a.991.991 0 0 1 .814.509l.071.134 1.072-.557C7.485 5.9 6.776 5.515 5.785 5.515Zm4.629 0c-.676 0-1.236.224-1.678.672C8.292 6.634 8.07 7.239 8.07 8c0 .78.217 1.39.65 1.828.434.439 1.012.657 1.736.657.438 0 .843-.111 1.214-.335.31-.187.566-.431.77-.733l.115-.189-1-.5c-.19.457-.519.686-.985.686-.353 0-.62-.129-.8-.386-.18-.257-.272-.6-.272-1.028 0-.943.358-1.415 1.072-1.415a.992.992 0 0 1 .828.509l.072.134 1.057-.557c-.418-.772-1.124-1.157-2.114-1.157Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$25,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$25,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$24 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CcZero.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from cc-zero.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CcZeroIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$24,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M7.983 0c2.238 0 4.148.78 5.72 2.342a7.662 7.662 0 0 1 1.715 2.582c.39.962.582 1.99.582 3.076a8.13 8.13 0 0 1-.583 3.087 7.262 7.262 0 0 1-1.703 2.526 8.213 8.213 0 0 1-2.655 1.77c-.99.41-2.018.617-3.076.617a7.902 7.902 0 0 1-3.042-.6 8.301 8.301 0 0 1-2.6-1.759A8.087 8.087 0 0 1 .6 11.042 7.84 7.84 0 0 1 0 8c0-1.057.2-2.07.6-3.042a8.12 8.12 0 0 1 1.77-2.633C3.893.772 5.764 0 7.983 0zm.034 1.44c-1.829 0-3.369.64-4.616 1.915a6.962 6.962 0 0 0-1.457 2.157 6.388 6.388 0 0 0 0 4.969 6.83 6.83 0 0 0 3.585 3.558c.79.324 1.62.487 2.488.487.857 0 1.681-.165 2.482-.498a6.88 6.88 0 0 0 2.184-1.446C13.931 11.364 14.56 9.838 14.56 8a6.57 6.57 0 0 0-.487-2.515 6.418 6.418 0 0 0-1.418-2.118C11.37 2.081 9.826 1.44 8.017 1.44zM8 3.395c2.641 0 3.305 2.492 3.305 4.605 0 2.113-.664 4.605-3.305 4.605S4.694 10.113 4.694 8l.007-.355c.073-2.027.804-4.25 3.299-4.25zm1.316 3.227L7.35 10.017c-.274.412-.083.645.219.774l.135.044c.091.022.19.034.297.034 1.357 0 1.422-1.938 1.422-2.869l-.007-.409a7.282 7.282 0 0 0-.06-.72l-.04-.25zM8 5.132c-1.258 0-1.406 1.66-1.421 2.646L6.577 8c0 .24.005.544.035.865l.027.244 1.759-3.232c.182-.316.09-.542-.101-.706A1.222 1.222 0 0 0 8 5.13z"
	      }, void 0, false, {
	        fileName: _jsxFileName$24,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$24,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$24,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$23 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CcZeroFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from cc-zero-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CcZeroFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M7.983 0c2.238 0 4.148.78 5.72 2.342a7.662 7.662 0 0 1 1.715 2.582c.39.962.582 1.99.582 3.076a8.13 8.13 0 0 1-.583 3.087 7.262 7.262 0 0 1-1.703 2.526 8.213 8.213 0 0 1-2.655 1.77c-.99.41-2.018.617-3.076.617a7.902 7.902 0 0 1-3.042-.6 8.301 8.301 0 0 1-2.6-1.759A8.087 8.087 0 0 1 .6 11.042 7.84 7.84 0 0 1 0 8c0-1.057.2-2.07.6-3.042a8.12 8.12 0 0 1 1.77-2.633C3.893.772 5.764 0 7.983 0ZM8 3.395c-2.419 0-3.18 2.09-3.29 4.065l-.01.185L4.695 8l.007.355.02.36c.145 1.921.931 3.89 3.279 3.89 2.641 0 3.305-2.492 3.305-4.605 0-2.113-.664-4.605-3.305-4.605Zm1.316 3.227.04.249c.024.166.039.331.049.49l.011.23.007.516-.008.363-.015.267-.026.279-.04.283c-.136.801-.478 1.57-1.333 1.57a1.31 1.31 0 0 1-.204-.015l-.093-.02-.135-.043c-.28-.12-.463-.327-.274-.682l.056-.092 1.965-3.395ZM8 5.132c.107 0 .205.016.297.039.17.146.261.34.152.604l-.051.101-1.76 3.233-.026-.244a8.691 8.691 0 0 1-.034-.674v-.413l.007-.249.015-.266.026-.279.04-.283c.136-.801.479-1.57 1.334-1.57Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$23,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$23,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$22 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Check.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from check.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CheckIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$22,
	        lineNumber: 18,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M13 3 6 13 3 8"
	      }, void 0, false, {
	        fileName: _jsxFileName$22,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$22,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$22,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$21 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Checkbox.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from checkbox.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CheckboxIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "16",
	    viewBox: "-4 -4 39 39",
	    "aria-hidden": "true",
	    ...props,
	    children: [o("rect", {
	      class: "hyp-svg-checkbox--background",
	      width: "35",
	      height: "35",
	      x: "-2",
	      y: "-2",
	      stroke: "currentColor",
	      fill: "none",
	      "stroke-width": "3",
	      rx: "5",
	      ry: "5"
	    }, void 0, false, {
	      fileName: _jsxFileName$21,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this), o("path", {
	      class: "hyp-svg-checkbox--checkmark",
	      stroke: "transparent",
	      "stroke-width": "5",
	      fill: "none",
	      d: "m4 14 8 9L28 5"
	    }, void 0, false, {
	      fileName: _jsxFileName$21,
	      lineNumber: 29,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$21,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$20 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CheckboxChecked.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from checkbox-checked.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CheckboxCheckedIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "16",
	    viewBox: "-4 -4 39 39",
	    "aria-hidden": "true",
	    ...props,
	    children: [o("rect", {
	      width: "35",
	      height: "35",
	      x: "-2",
	      y: "-2",
	      stroke: "currentColor",
	      fill: "none",
	      "stroke-width": "3",
	      rx: "5",
	      ry: "5"
	    }, void 0, false, {
	      fileName: _jsxFileName$20,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this), o("path", {
	      stroke: "currentColor",
	      "stroke-width": "5",
	      fill: "none",
	      d: "m4 14 8 9L28 5"
	    }, void 0, false, {
	      fileName: _jsxFileName$20,
	      lineNumber: 28,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$20,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1$ = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CheckboxOutline.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from checkbox-outline.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CheckboxOutlineIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "16",
	    viewBox: "-4 -4 39 39",
	    "aria-hidden": "true",
	    ...props,
	    children: o("rect", {
	      width: "35",
	      height: "35",
	      x: "-2",
	      y: "-2",
	      stroke: "currentColor",
	      fill: "none",
	      "stroke-width": "3",
	      rx: "5",
	      ry: "5"
	    }, void 0, false, {
	      fileName: _jsxFileName$1$,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1$,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1_ = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Collapse.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from collapse.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CollapseIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1_,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m5 11-4 4 4-4zm-3-1h4v4m9-13-4 4 4-4zm-1 5h-4V2"
	      }, void 0, false, {
	        fileName: _jsxFileName$1_,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1_,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1_,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1Z = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Contrast.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from contrast.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ContrastIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1Z,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M8 1C4.5 1 1 4.5 1 8s3.5 7 7 7 7-3.5 7-7-3.5-7-7-7zM7 2v12M6 2v12M4 3v10M2 5v6"
	      }, void 0, false, {
	        fileName: _jsxFileName$1Z,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1Z,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1Z,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1Y = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Copy.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from copy.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CopyIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1Y,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M9 15H1V5h3m11-4v10H7V1h8z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1Y,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1Y,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1Y,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1X = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/CopyFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from copy-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function CopyFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M1 16a1 1 0 0 1-.993-.883L0 15V5a1 1 0 0 1 .883-.993L1 4h3a1 1 0 0 1 1 1v8h4a1 1 0 0 1 1 1v1a1 1 0 0 1-.883.993L9 16H1ZM15 0a1 1 0 0 1 .993.883L16 1v10a1 1 0 0 1-.883.993L15 12H7a1 1 0 0 1-.993-.883L6 11V1a1 1 0 0 1 .883-.993L7 0h8Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1X,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1X,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1W = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Edit.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from edit.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EditIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1W,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m11 4 1 1-9 9-2 1 1-2 9-9zm3-3 1 1-1 1-1-1 1-1z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1W,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1W,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1W,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1V = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/EditorLatex.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from editor-latex.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EditorLatexIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1V,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M13.392 16a.827.827 0 0 0 .423-.108c.123-.073.185-.155.185-.248v-1.778c0-.099-.062-.183-.185-.252a.848.848 0 0 0-.423-.104H6.85c-.138 0-.227-.028-.267-.083-.04-.055-.04-.105 0-.152l5.533-5.101c.158-.14.223-.265.193-.378a.755.755 0 0 0-.193-.325L6.88 2.707c-.04-.046-.042-.094-.007-.143.034-.05.13-.074.289-.074h6.17a.782.782 0 0 0 .416-.108c.119-.073.178-.155.178-.248V.356c0-.093-.06-.175-.178-.248A.782.782 0 0 0 13.333 0H2.905c-.158 0-.3.036-.423.108-.124.073-.185.155-.185.248v1.943a.5.5 0 0 0 .11.326l.171.204 5.31 4.815a.34.34 0 0 1 .075.178.221.221 0 0 1-.074.195l-5.622 5.154c-.04.047-.094.113-.163.2A.512.512 0 0 0 2 13.7v1.943c0 .093.062.175.185.248a.822.822 0 0 0 .423.108h10.784z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1V,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1V,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1V,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1U = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/EditorQuote.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from editor-quote.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EditorQuoteIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1U,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M2.701 14c.38 0 .659-.085.837-.255.177-.17.328-.343.45-.52l2.408-3.25c.246-.328.445-.725.598-1.19a4.69 4.69 0 0 0 .23-1.475V2.775a.752.752 0 0 0-.23-.539A.713.713 0 0 0 6.47 2H1.947a.713.713 0 0 0-.524.236.752.752 0 0 0-.23.539v4.649c0 .214.077.396.23.548a.726.726 0 0 0 .524.226h.901c.123 0 .23.054.322.161.092.107.101.224.028.35l-2.041 3.817c-.196.365-.208.702-.037 1.011.172.309.447.463.827.463h.754zm7.795 0c.367 0 .64-.085.818-.255.178-.17.328-.343.45-.52l2.409-3.25c.257-.328.46-.725.606-1.19A4.87 4.87 0 0 0 15 7.31V2.775a.752.752 0 0 0-.23-.539.713.713 0 0 0-.524-.236H9.742a.703.703 0 0 0-.533.236.767.767 0 0 0-.22.539v4.649a.74.74 0 0 0 .23.548.726.726 0 0 0 .523.226h.9c.123 0 .228.054.313.161.086.107.092.224.019.35L8.95 12.526c-.208.365-.223.702-.045 1.011.177.309.456.463.836.463h.754z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1U,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1U,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1U,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1T = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/EditorTextBold.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from editor-text-bold.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EditorTextBoldIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1T,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M8.661 16c.805 0 1.536-.117 2.193-.351a4.953 4.953 0 0 0 1.69-.993c.47-.428.831-.947 1.081-1.557s.375-1.287.375-2.03c0-.29-.038-.588-.114-.893a4.123 4.123 0 0 0-.325-.87 3.937 3.937 0 0 0-.495-.754 4.412 4.412 0 0 0-.604-.597c-.17-.126-.17-.264 0-.412.381-.335.699-.772.953-1.311.254-.54.382-1.062.382-1.568 0-.64-.132-1.244-.394-1.813a4.628 4.628 0 0 0-1.081-1.484c-.458-.42-1-.753-1.627-.999A5.531 5.531 0 0 0 8.66 0H2.52a.534.534 0 0 0-.362.14A.415.415 0 0 0 2 .456v15.086c0 .119.053.225.159.318a.534.534 0 0 0 .362.139h6.14zm-.127-9.852H5.826c-.17 0-.254-.075-.254-.223V3.437c0-.157.085-.235.254-.235h2.708c.45 0 .847.145 1.195.435.347.29.521.633.521 1.027 0 .394-.174.74-.521 1.038a1.784 1.784 0 0 1-1.195.446zm0 6.65H5.826c-.17 0-.254-.075-.254-.223v-2.99c0-.157.085-.235.254-.235h2.708c.56 0 1.004.177 1.335.53.33.353.495.75.495 1.188 0 .454-.165.856-.495 1.205-.33.35-.776.525-1.335.525z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1T,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1T,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1T,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1S = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/EditorTextItalic.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from editor-text-italic.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EditorTextItalicIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1S,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M10.61 16c.12 0 .23-.046.329-.14a.633.633 0 0 0 .191-.317l.457-2.176a.348.348 0 0 0-.064-.313.336.336 0 0 0-.276-.133H8.845c-.142-.008-.198-.086-.17-.235l1.892-9.372c.035-.149.124-.223.266-.223H13a.49.49 0 0 0 .335-.14.62.62 0 0 0 .196-.318L13.99.457a.542.542 0 0 0 .011-.1.337.337 0 0 0-.085-.223A.336.336 0 0 0 13.64 0H5.805a.49.49 0 0 0-.335.14.62.62 0 0 0-.196.317l-.457 2.176a.353.353 0 0 0 .069.318c.074.093.168.14.281.14h2.18c.141 0 .198.074.17.223l-1.893 9.372c-.028.156-.113.235-.255.235H2.967a.489.489 0 0 0-.324.133.59.59 0 0 0-.197.313l-.435 2.176a.542.542 0 0 0-.011.1c0 .082.025.156.074.223.071.09.16.134.266.134h8.27z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1S,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1S,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1S,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1R = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Ellipsis.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from ellipsis.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EllipsisIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1R,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M2 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1R,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1R,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1R,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1Q = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Email.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from email.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EmailIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1Q,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M1 3v10h14V3H1zm0 0 7 6 7-6H1z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1Q,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1Q,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1Q,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1P = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/EmailFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from email-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function EmailFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M.031 3.647 7.7 9.4l.08.049a.5.5 0 0 0 .44 0L8.3 9.4l7.67-5.752.022.174L16 4v8a2 2 0 0 1-1.85 1.995L14 14H2a2 2 0 0 1-1.995-1.85L0 12V4c0-.12.01-.238.031-.353ZM14 2c.618 0 1.17.28 1.538.721L8 8.375.462 2.721c.33-.397.811-.663 1.355-.713L2 2h12Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1P,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1P,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1O = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Expand.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from expand.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ExpandIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1O,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "m2 14 4-4-4 4zm3 1H1v-4m13-9-4 4 4-4zm-3-1h4v4"
	      }, void 0, false, {
	        fileName: _jsxFileName$1O,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1O,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1O,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1N = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/External.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from external.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ExternalIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1N,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M7 3h6v6m-1-5-9 9 9-9z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1N,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1N,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1N,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1M = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FileCode.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-code.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FileCodeIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M12.333 0a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V15.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5h10.833ZM11 1H2v14h12V4h-2.5a.5.5 0 0 1-.5-.5V1ZM6.53 5.47a.75.75 0 0 1 .073.976l-.073.084L5.061 8l1.47 1.47a.75.75 0 0 1 .072.976l-.073.084a.75.75 0 0 1-.976.073l-.084-.073-2-2a.75.75 0 0 1-.073-.976l.073-.084 2-2a.75.75 0 0 1 1.06 0Zm3.916-.073.084.073 2 2 .073.084a.75.75 0 0 1 .007.882l-.08.094-2 2-.084.073a.75.75 0 0 1-.882.007l-.094-.08-.073-.084a.75.75 0 0 1-.007-.882l.08-.094L10.939 8l-1.47-1.47-.072-.084a.75.75 0 0 1 1.05-1.049Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1M,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1M,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1L = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FileCodeFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-code-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FileCodeFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M11 0v3.5a.5.5 0 0 0 .41.492L11.5 4H15v11.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5H11ZM6.53 5.47a.75.75 0 0 0-1.06 0l-2 2-.073.084a.75.75 0 0 0 .073.976l2 2 .084.073a.75.75 0 0 0 .976-.073l.073-.084a.75.75 0 0 0-.073-.976L5.061 8l1.47-1.47.072-.084a.75.75 0 0 0-.073-.976Zm3.916-.073a.75.75 0 0 0-1.049 1.05l.073.083L10.939 8l-1.47 1.47-.08.094a.75.75 0 0 0 .008.882l.073.084.094.08a.75.75 0 0 0 .882-.007l.084-.073 2-2 .08-.094a.75.75 0 0 0-.007-.882l-.073-.084-2-2ZM12.333 0a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V3h-2.75a.25.25 0 0 1-.25-.25V0h.333Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1L,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1L,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1K = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FileGeneric.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-generic.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FileGenericIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M12.333 0a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V15.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5h10.833ZM11 1H2v14h12V4h-2.5a.5.5 0 0 1-.5-.5V1Zm-3.75 9.5a.75.75 0 1 1 0 1.5h-2.5a.75.75 0 1 1 0-1.5h2.5Zm4-2.75a.75.75 0 1 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h6.5Zm0-2.75a.75.75 0 1 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h6.5Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1K,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1K,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1J = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FileGenericFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-generic-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FileGenericFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M11 0v3.5a.5.5 0 0 0 .41.492L11.5 4H15v11.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5H11ZM7.25 10.5h-2.5a.75.75 0 1 0 0 1.5h2.5a.75.75 0 1 0 0-1.5Zm4-2.75h-6.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 1 0 0-1.5Zm0-2.75h-6.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 1 0 0-1.5Zm1.083-5a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V3h-2.75a.25.25 0 0 1-.25-.25V0h.333Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1J,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1J,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1I = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FileImage.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-image.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FileImageIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M12.333 0a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V15.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5h10.833ZM11 1H2v14h12V4h-2.5a.5.5 0 0 1-.5-.5V1ZM9.541 5.122l.055.069 3.333 5.143a.432.432 0 0 1-.266.658l-.08.008H9.23a.931.931 0 0 0-.076-.98l-1.79-2.456 1.54-2.373a.41.41 0 0 1 .637-.069ZM6.19 6.818l.061.068 2.5 3.428c.19.261.038.625-.257.68L8.417 11h-5c-.317 0-.508-.344-.373-.619l.04-.067 2.5-3.428a.41.41 0 0 1 .605-.068Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1I,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1I,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1H = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FileImageFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-image-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FileImageFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M11 0v3.5a.5.5 0 0 0 .41.492L11.5 4H15v11.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5H11ZM9.541 5.122a.41.41 0 0 0-.583 0l-.055.069-1.538 2.373 1.789 2.456c.2.274.224.602.12.88l-.044.1h3.353l.08-.008a.431.431 0 0 0 .305-.585l-.039-.073L9.596 5.19l-.055-.069ZM6.19 6.818a.409.409 0 0 0-.544 0l-.061.068-2.5 3.428-.04.067a.432.432 0 0 0 .297.612l.076.007h5l.076-.007c.27-.05.42-.36.297-.612l-.04-.067-2.5-3.428-.061-.068ZM12.333 0a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V3h-2.75a.25.25 0 0 1-.25-.25V0h.333Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1H,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1H,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1G = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FilePdf.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-pdf.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FilePdfIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M12.333 0a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V15.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5h10.833ZM11 1H2v14h12V4h-2.5a.5.5 0 0 1-.5-.5V1ZM7.449 3c.272 0 1.043.274 1.089 1.507l-.004.204-.013.218c-.037.415-.15.932-.482 1.77.198.285.414.57.681.89l.348.4.195.216.129.137.222.255c.035.04.07.077.103.11h.363c1.043 0 1.86.183 2.359.457.68.411.59 1.096.499 1.37-.091.229-.408.64-1.089.64-.136 0-.317 0-.499-.092-.448-.113-.804-.318-1.499-1l-.32-.322-.177-.185c-.499.046-1.043.137-1.587.229-.454.091-.862.182-1.225.32-.082.16-.16.312-.237.455l-.22.403-.104.182-.196.328-.093.147-.173.262-.082.116-.152.203-.138.17-.125.137-.058.059-.106.098-.093.075-.083.057-.07.042-.112.05-.243.063a.925.925 0 0 1-.21.029c-.4 0-.653-.234-.809-.42l-.098-.128-.048-.09c-.127-.273-.23-.823.456-1.554l.197-.193.08-.073.187-.159c.377-.302.955-.665 1.895-.99.181-.411.408-.822.59-1.279.075-.167.146-.33.211-.485l.182-.445.15-.394c-.589-.959-.68-1.69-.68-2.511C6.36 3.319 7.04 3 7.45 3Zm-2.223 7.671c-.413.224-.67.425-.85.589l-.193.187c-.212.214-.259.371-.27.474l-.002.074.09.046h-.045l.028.023c.018.011.04.023.063.023 0 .045.045.045.09 0l.023-.007.039-.022.057-.044.075-.07.096-.103.116-.139.137-.181.076-.108.17-.255.194-.31c.035-.056.07-.115.106-.177Zm5.398-1.05.244.219c.362.312.52.382.709.42l.067.007.118.032c.016.004.03.007.042.007.181 0 .272-.046.272-.091.03-.092-.02-.163-.07-.213l-.066-.061-.115-.057-.136-.056a2.549 2.549 0 0 0-.087-.031l-.212-.063a3.981 3.981 0 0 0-.766-.113ZM7.676 7.703v.046l-.243.571a3.742 3.742 0 0 0-.075.205l-.13.268a2.31 2.31 0 0 0-.097.234h.046l-.09.046.249-.063c.079-.017.158-.028.25-.028l.263-.042.495-.1.239-.04a15.213 15.213 0 0 1-.398-.472L7.84 7.9l-.164-.197Zm-.227-3.79c-.09.046-.136.183-.136.411-.045.411 0 .776.181 1.324.121-.365.162-.629.175-.832l.007-.184v-.08c0-.41-.136-.593-.227-.639Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1G,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1G,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1F = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FilePdfFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from file-pdf-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FilePdfFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M11 0v3.5a.5.5 0 0 0 .41.492L11.5 4H15v11.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5H11ZM7.449 3c-.408 0-1.089.32-1.089 1.279 0 .821.091 1.552.68 2.511l-.15.394-.182.445c-.065.155-.136.318-.212.485-.181.457-.408.868-.59 1.279-.939.325-1.517.688-1.894.99l-.187.159-.153.143-.124.123c-.686.73-.583 1.281-.456 1.555l.048.09.098.126c.156.187.41.421.809.421a.925.925 0 0 0 .21-.029l.243-.062.111-.051.071-.042.083-.057.093-.075.106-.098.119-.124.064-.073.138-.169.152-.203.167-.242a9.9 9.9 0 0 0 .088-.136l.189-.305c.065-.11.133-.227.204-.352l.22-.403c.076-.143.155-.294.237-.456.363-.137.77-.228 1.225-.32a22.131 22.131 0 0 1 1.587-.228l.178.185.32.322c.694.682 1.05.887 1.498 1 .182.092.363.092.5.092.68 0 .997-.411 1.088-.64.09-.274.181-.959-.5-1.37-.457-.25-1.18-.425-2.102-.452l-.256-.004h-.363l-.103-.11-.222-.256a3.738 3.738 0 0 0-.129-.137l-.195-.216-.348-.4a12.24 12.24 0 0 1-.681-.89c.332-.838.445-1.355.482-1.77l.013-.218.004-.204C8.492 3.274 7.72 3 7.449 3Zm-2.223 7.671-.205.34-.094.147-.17.255-.149.204-.126.16-.105.12-.086.085a1.098 1.098 0 0 1-.035.032l-.057.044-.04.022-.021.007c-.046.045-.091.045-.091 0a.118.118 0 0 1-.063-.023l-.028-.023h.046l-.091-.046.003-.074c.01-.103.057-.26.269-.474l.194-.187c.18-.164.436-.365.85-.589Zm5.398-1.05c.314.018.568.062.766.113l.212.063.087.03.186.08.065.034.065.06c.05.051.101.122.07.214 0 .045-.09.09-.271.09l-.042-.006-.118-.032a.354.354 0 0 0-.067-.007c-.17-.034-.315-.094-.606-.334l-.218-.188-.129-.117ZM7.676 7.703l.164.197.345.428.19.23.208.241-.239.041-.495.1c-.085.016-.173.03-.264.042-.09 0-.17.011-.25.028l-.249.063.09-.046h-.045a2.31 2.31 0 0 1 .097-.234l.13-.268.075-.205.243-.571v-.046Zm-.227-3.79c.09.046.227.229.227.64l-.002.167a3.164 3.164 0 0 1-.18.928c-.181-.548-.226-.913-.181-1.324 0-.228.045-.365.136-.41ZM12.333 0a.5.5 0 0 1 .352.144l2.167 2.143a.5.5 0 0 1 .148.356V3h-2.75a.25.25 0 0 1-.25-.25V0h.333Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1F,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1F,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1E = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Filter.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from filter.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FilterIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1E,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M1 3h14H1zm4 10h6-6zM3 8h10H3z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1E,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1E,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1E,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1D = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Flag.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from flag.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FlagIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1D,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M3 9v6V1h12l-4 4 4 4H3z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1D,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1D,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1D,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1C = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FlagFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from flag-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FlagFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1C,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M2 1a1 1 0 0 1 .883-.993L3 0h12c.852 0 1.297.986.783 1.623l-.076.084L12.415 5l3.292 3.293c.575.575.253 1.523-.485 1.684l-.108.017L15 10H4v5a1 1 0 0 1-1.993.117L2 15V1z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1C,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1C,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1C,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1B = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Folder.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from folder.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FolderIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M4.5 1a1.5 1.5 0 0 1 1.339.823l.056.125.018.052H14.5a1.5 1.5 0 0 1 1.473 1.215l.02.14L16 3.5v10a1.5 1.5 0 0 1-1.356 1.493L14.5 15h-13a1.5 1.5 0 0 1-1.493-1.356L0 13.5v-11a1.5 1.5 0 0 1 1.356-1.493L1.5 1h3ZM15 5H1v8.5a.5.5 0 0 0 .41.492L1.5 14h13a.5.5 0 0 0 .492-.41L15 13.5V5ZM4.5 2h-3a.5.5 0 0 0-.492.41L1 2.5V4h14v-.5a.5.5 0 0 0-.41-.492L14.5 3h-9a.5.5 0 0 1-.492-.41l-.016-.18a.5.5 0 0 0-.402-.402L4.5 2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1B,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1B,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1A = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FolderFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from folder-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FolderFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M16 5v8.5a1.5 1.5 0 0 1-1.356 1.493L14.5 15h-13a1.5 1.5 0 0 1-1.493-1.356L0 13.5V5h16ZM0 2.5a1.5 1.5 0 0 1 1.356-1.493L1.5 1h3a1.5 1.5 0 0 1 1.415 1H14.5a1.5 1.5 0 0 1 1.493 1.356L16 3.5V4H0V2.5Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1A,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1A,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1z = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FolderOpen.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from folder-open.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FolderOpenIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M5.5 1a1.5 1.5 0 0 1 1.339.823l.056.125.018.052H13.5a1.5 1.5 0 0 1 1.473 1.215l.02.14L15 3.5l.001.633c.477.217.82.677.874 1.228l.008.153-.005.096L15 13.5a1.5 1.5 0 0 1-1.356 1.493L13.5 15h-11c-.78 0-1.42-.595-1.49-1.31l-.007-.135-.877-7.89A1.498 1.498 0 0 1 1 4.136V2.5a1.5 1.5 0 0 1 1.356-1.493L2.5 1h3ZM1.593 5l-.031.003a.5.5 0 0 0-.444.462l.002.09L2 13.5a.5.5 0 0 0 .41.492L2.5 14h11c.245 0 .45-.177.494-.449l.009-.106.878-7.904.002-.041a.5.5 0 0 0-.41-.492L14.383 5H1.593ZM5.5 2h-3a.5.5 0 0 0-.492.41L2 2.5V4h12v-.5a.5.5 0 0 0-.326-.469l-.084-.023L13.5 3h-7a.5.5 0 0 1-.492-.41L6 2.5a.5.5 0 0 0-.41-.492L5.5 2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1z,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1z,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1y = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/FolderOpenFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from folder-open-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function FolderOpenFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M5.5 1a1.5 1.5 0 0 1 1.395.948L6.913 2H13.5a1.5 1.5 0 0 1 1.493 1.356L15 3.5v.633c.52.235.883.759.883 1.367l-.003.083-.006.083L15 13.5a1.5 1.5 0 0 1-1.356 1.493L13.5 15h-11c-.78 0-1.42-.595-1.49-1.31l-.007-.135-.877-7.89A1.5 1.5 0 0 1 1 4.134L1 2.5a1.5 1.5 0 0 1 1.356-1.493L2.5 1h3Zm0 1h-3a.5.5 0 0 0-.492.41L2 2.5V4h12v-.5a.5.5 0 0 0-.41-.492L13.5 3h-7a.5.5 0 0 1-.492-.41L6 2.5a.5.5 0 0 0-.41-.492L5.5 2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1y,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1y,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1x = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Globe.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from globe.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function GlobeIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm2.655 11.535c.244-.242.442-.719.442-1.063a1.13 1.13 0 0 0-.288-.696l-.442-.442a1.033 1.033 0 0 0-.73-.302H7.484C7.181 8.88 6.791 8 6.452 8c-.34 0-.674-.08-.978-.231l-.357-.179a.386.386 0 0 1-.213-.345c0-.153.118-.317.263-.366l1.006-.335a.618.618 0 0 1 .163-.026c.106 0 .258.056.338.126l.3.26c.046.04.106.063.169.063h.182a.258.258 0 0 0 .23-.373l-.503-1.006a.306.306 0 0 1-.027-.116c0-.06.035-.143.078-.185l.32-.31a.258.258 0 0 1 .18-.074h.29c.06 0 .141-.034.183-.076l.258-.258c.1-.1.1-.264 0-.364l-.151-.152a.258.258 0 0 1 0-.365l.333-.333.151-.151a.516.516 0 0 0 0-.73l-.912-.913a6.45 6.45 0 0 0-.787.078v.365a.516.516 0 0 1-.747.461l-.775-.387a6.487 6.487 0 0 0-3.329 3.287c.32.474.813 1.205 1.116 1.65.138.203.4.503.582.668l.026.023c.308.278.65.516 1.021.702.452.227 1.111.586 1.575.842.328.182.53.527.53.903v1.032c0 .274.11.537.303.73.484.484.785 1.246.73 1.653v.884c.473 0 .932-.055 1.376-.152l.56-1.511c.067-.177.106-.362.155-.544a.771.771 0 0 1 .199-.346l.365-.364zm2.797-2.946.94.235c.036-.27.06-.544.06-.824a6.4 6.4 0 0 0-.688-2.882l-.419.21a.773.773 0 0 0-.298.263l-.632.947a.908.908 0 0 0-.13.43c0 .13.058.321.13.43l.58.87c.107.16.27.274.457.32z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1x,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1x,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1w = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/GlobeAlt.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from globe-alt.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function GlobeAltIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1w,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 0c1.105 0 2-3.134 2-7s-.895-7-2-7-2 3.134-2 7 .895 7 2 7zm6.272-9.61C13.127 6.049 10.748 6.501 8 6.501S2.873 6.05 1.728 5.39m12.544 5.221C13.127 9.953 10.748 9.5 8 9.5s-5.127.453-6.272 1.111"
	      }, void 0, false, {
	        fileName: _jsxFileName$1w,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1w,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1w,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1v = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Groups.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from groups.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function GroupsIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1v,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M1 15a3 3 0 0 1 6 0m2-4a3 3 0 0 1 6 0M4 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8-4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1v,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1v,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1v,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1u = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/GroupsFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from groups-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function GroupsFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M4 11a4 4 0 0 1 4 4 1 1 0 0 1-.883.993L7 16H1a1 1 0 0 1-1-1 4 4 0 0 1 4-4Zm8-4a4 4 0 0 1 4 4 1 1 0 0 1-.883.993L15 12H9a1 1 0 0 1-1-1 4 4 0 0 1 4-4ZM4 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm8-4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1u,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1u,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1t = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Help.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from help.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function HelpIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1t,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M8 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 4.5C4 2.567 5.79 1 8 1s4 1.567 4 3.5S10.21 8 8 8m0 0v1.5V8z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1t,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1t,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1t,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1s = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Hide.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from hide.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function HideIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "m1.613.21.094.083 14 14a1 1 0 0 1-1.32 1.497l-.094-.083-14-14A1 1 0 0 1 1.613.21Zm.583 4.845a1 1 0 0 1 .292 1.384C2.165 6.935 2 7.46 2 8c0 2.123 2.628 4 6 4 .22 0 .44-.008.657-.024a1 1 0 0 1 .147 1.994c-.266.02-.534.03-.804.03-4.36 0-8-2.6-8-6 0-.937.283-1.84.812-2.653a1 1 0 0 1 1.384-.292ZM8 2c4.36 0 8 2.6 8 6 0 .937-.283 1.84-.812 2.653a1 1 0 0 1-1.676-1.092C13.835 9.065 14 8.54 14 8c0-2.123-2.628-4-6-4-.22 0-.44.008-.657.024a1 1 0 1 1-.147-1.994C7.462 2.01 7.73 2 8 2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1s,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1s,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1r = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/HideFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from hide-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function HideFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "m1.613.21.094.083 14 14a1 1 0 0 1-1.32 1.497l-.094-.083-14-14A1 1 0 0 1 1.613.21Zm-.038 4.194 3.43 3.43L5 8a3 3 0 0 0 3 3l.166-.006 2.631 2.632C9.923 13.87 8.98 14 8 14c-4.36 0-8-2.6-8-6 0-1.367.588-2.604 1.575-3.596ZM8 2c4.36 0 8 2.6 8 6 0 1.367-.588 2.604-1.575 3.596l-3.43-3.43L11 8a3 3 0 0 0-3-3l-.167.005-2.631-2.631A10.492 10.492 0 0 1 8 2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1r,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1r,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1q = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Highlight.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from highlight.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function HighlightIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1q,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M12 15H1h11zm-.5-6v2l-1 1v-2l1-1zm.5-7v6h-2V2h2zm0-1h-2 2zm0 8h-2 2z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1q,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1q,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1q,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1p = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Image.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from image.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ImageIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1p,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M15 1v14H1V1h14zM1 15l3-8 4 6 3-4 4 6m-4-9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1p,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1p,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1p,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1o = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ImageFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from image-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ImageFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M14 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2ZM9.541 5.122a.41.41 0 0 0-.638.069L7.365 7.564l1.789 2.456a.931.931 0 0 1 .076.98h3.353l.08-.008a.432.432 0 0 0 .266-.658L9.596 5.19ZM6.19 6.818a.41.41 0 0 0-.605.068l-2.5 3.428-.04.067c-.135.275.056.619.373.619h5l.076-.007a.432.432 0 0 0 .257-.679l-2.5-3.428Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1o,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1o,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1n = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Leave.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from leave.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LeaveIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 0c4.052 0 8 3.948 8 8s-3.948 8-8 8-8-3.948-8-8 3.948-8 8-8Zm0 2C5.052 2 2 5.052 2 8s3.052 6 6 6 6-3.052 6-6-3.052-6-6-6Zm2.786 4.62-.079.087L9.415 8l1.292 1.293a1 1 0 0 1-1.32 1.497l-.094-.083L8 9.415l-1.293 1.292c-.914.914-2.272-.388-1.493-1.327l.079-.087L6.585 8 5.293 6.707a1 1 0 0 1 1.32-1.497l.094.083L8 6.585l1.293-1.292c.914-.914 2.272.388 1.493 1.327Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1n,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1n,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1m = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/LeaveFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from leave-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LeaveFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 0c4.052 0 8 3.948 8 8s-3.948 8-8 8-8-3.948-8-8 3.948-8 8-8ZM6.613 5.21a1 1 0 0 0-1.226 0l-.094.083-.083.094a1 1 0 0 0 0 1.226l.083.094L6.585 8 5.293 9.293l-.083.094a1 1 0 0 0 .083 1.32l.094.083a1 1 0 0 0 1.32-.083L8 9.415l1.293 1.292.094.083a1 1 0 0 0 1.32-1.497L9.415 8l1.292-1.293.083-.094A1 1 0 0 0 9.387 5.21l-.094.083L8 6.585 6.707 5.293Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1m,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1m,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1l = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Link.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from link.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LinkIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M9.68 6.097a1 1 0 1 1-1.36 1.466c-.799-.741-1.85-.75-2.655-.028l-3.078 3.592-.079.082a1.544 1.544 0 0 0 0 2.29c.662.614 1.81.68 2.558.107l.09-.077 1.006-1.21a1 1 0 0 1 1.306-.205l.102.074a1 1 0 0 1 .205 1.307l-.074.101-1.058 1.274-.089.095c-1.525 1.415-3.956 1.346-5.406 0-1.442-1.338-1.564-3.607-.152-5.073l.099-.098 3.1-3.615.079-.082c1.576-1.463 3.83-1.463 5.406 0Zm5.172-5.062c1.442 1.338 1.564 3.607.152 5.073l-.1.097-3.118 3.638-.06.06c-1.576 1.463-3.83 1.463-5.406 0a1 1 0 1 1 1.36-1.466c.799.741 1.85.75 2.655.028l3.078-3.592.079-.082a1.544 1.544 0 0 0 0-2.29c-.662-.614-1.81-.68-2.558-.107l-.091.076-1.005 1.211a1 1 0 0 1-1.306.205l-.102-.074a1 1 0 0 1-.205-1.307l.074-.101L9.357 1.13l.089-.095c1.525-1.415 3.956-1.346 5.406 0Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1l,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1l,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1k = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/List.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from list.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ListIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M15 12a1 1 0 0 1 .117 1.993L15 14H1a1 1 0 0 1-.117-1.993L1 12h14Zm0-5a1 1 0 0 1 .117 1.993L15 9H1a1 1 0 0 1-.117-1.993L1 7h14Zm0-5a1 1 0 0 1 .117 1.993L15 4H1a1 1 0 0 1-.117-1.993L1 2h14Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1k,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1k,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1j = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ListOrdered.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from list-ordered.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ListOrderedIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M2.748 11.5c.227 0 .443.034.646.103.203.069.381.164.534.286.155.123.276.267.364.432.089.168.134.35.134.543 0 .17-.042.333-.124.484a1.384 1.384 0 0 1-.19.269l-.062.061.047.035c.047.041.09.086.13.134l.058.075.075.122c.093.172.14.352.14.538 0 .201-.048.39-.143.566a1.44 1.44 0 0 1-.384.45c-.16.125-.344.223-.554.294-.21.072-.434.108-.67.108-.237 0-.461-.036-.671-.108a1.871 1.871 0 0 1-.555-.295 1.42 1.42 0 0 1-.382-.45 1.178 1.178 0 0 1-.132-.417L1 14.582l.002-.078.01-.05a.249.249 0 0 1 .077-.111.283.283 0 0 1 .121-.06l.07-.008h.708l.05.007c.044.01.084.028.12.056a.24.24 0 0 1 .089.133l.006.054v.047l.005.077a.279.279 0 0 0 .112.186c.088.066.213.101.378.101a.615.615 0 0 0 .376-.102.29.29 0 0 0 .12-.252.29.29 0 0 0-.12-.252.538.538 0 0 0-.262-.096l-.114-.007h-.1l-.051-.007a.292.292 0 0 1-.12-.059.244.244 0 0 1-.087-.13l-.006-.053.001-.57.01-.05a.249.249 0 0 1 .078-.112.283.283 0 0 1 .121-.06l.07-.008h.076l.112-.006a.454.454 0 0 0 .224-.086.26.26 0 0 0 .104-.222.246.246 0 0 0-.103-.213.533.533 0 0 0-.329-.09.527.527 0 0 0-.324.09.24.24 0 0 0-.098.148l-.006.065-.002.11-.01.05a.249.249 0 0 1-.081.112.292.292 0 0 1-.12.059l-.066.007h-.712l-.052-.007a.292.292 0 0 1-.12-.059.244.244 0 0 1-.087-.13l-.006-.054v-.096l.008-.135c.018-.141.062-.275.132-.402.091-.164.213-.307.366-.43.152-.122.33-.217.533-.286.203-.069.418-.103.645-.103ZM15 13a1 1 0 0 1 .117 1.993L15 15H7a1 1 0 0 1-.117-1.993L7 13h8ZM2.777 5.5c.234 0 .454.034.66.101.207.068.389.164.544.288.156.124.28.27.372.437.093.17.14.355.14.551 0 .19-.049.37-.145.542-.07.123-.156.237-.258.34l-.108.1L2.71 8.932l1.52.001.053.006c.044.01.084.029.12.056.047.036.078.08.091.132l.007.054-.002.59-.01.05a.25.25 0 0 1-.083.113.298.298 0 0 1-.121.059L4.216 10H1.27l-.053-.007a.298.298 0 0 1-.122-.059.246.246 0 0 1-.089-.132L1 9.748v-.711l.004-.05a.26.26 0 0 1 .04-.115l.034-.043.035-.033L3.04 7.167l.036-.036a.98.98 0 0 0 .08-.114.295.295 0 0 0 .055-.145.27.27 0 0 0-.099-.21c-.068-.062-.167-.094-.303-.094-.163 0-.285.032-.369.093a.244.244 0 0 0-.103.147l-.006.064-.002.123-.01.052a.25.25 0 0 1-.084.112.298.298 0 0 1-.12.058l-.069.008h-.726l-.053-.007a.298.298 0 0 1-.121-.059.246.246 0 0 1-.09-.132l-.006-.054V6.87l.01-.137c.017-.143.063-.28.135-.407.094-.167.22-.313.379-.437.157-.123.339-.219.544-.287.206-.067.425-.101.658-.101ZM15 7a1 1 0 0 1 .117 1.993L15 9H7a1 1 0 0 1-.117-1.993L7 7h8ZM3.237 0l.052.008c.044.01.084.031.12.061a.248.248 0 0 1 .083.132l.006.052-.004 3.167.744.001.051.007c.044.01.084.03.119.058.044.036.074.08.086.132l.006.053-.001.595-.01.05a.278.278 0 0 1-.197.176l-.07.008H1.29l-.051-.008a.287.287 0 0 1-.12-.061.248.248 0 0 1-.084-.132l-.006-.052.001-.596.01-.05a.247.247 0 0 1 .077-.113.28.28 0 0 1 .12-.06l.069-.008.932.002.003-1.959-.796.629-.068.037a.295.295 0 0 1-.196-.002.25.25 0 0 1-.172-.179L1 1.881v-.587l.007-.089.015-.075a.345.345 0 0 1 .073-.132l.06-.059.83-.758.04-.036A.994.994 0 0 1 2.139.07a.498.498 0 0 1 .183-.062L2.428 0h.809ZM15 1a1 1 0 0 1 .117 1.993L15 3H7a1 1 0 0 1-.117-1.993L7 1h8Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1j,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1j,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1i = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ListUnordered.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from list-unordered.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ListUnorderedIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M2 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm13 1a1 1 0 0 1 .117 1.993L15 15H7a1 1 0 0 1-.117-1.993L7 13h8ZM2 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm13 1a1 1 0 0 1 .117 1.993L15 9H7a1 1 0 0 1-.117-1.993L7 7h8ZM2 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm13 1a1 1 0 0 1 .117 1.993L15 3H7a1 1 0 0 1-.117-1.993L7 1h8Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1i,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1i,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1h = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Lock.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from lock.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LockIcon(props) {
	  return o("svg", {
	    width: "14",
	    height: "16",
	    viewBox: "0 0 48 56",
	    xmlns: "http://www.w3.org/2000/svg",
	    ...props,
	    children: o("g", {
	      fill: "currentColor",
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        d: "M0 24h48v32H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1h,
	        lineNumber: 18,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "M24 0S8 0 8 16v16h8V16c0-8 8-8 8-8s8 0 8 8v16h8V16C40 0 24 0 24 0Z"
	      }, void 0, false, {
	        fileName: _jsxFileName$1h,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$1h,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1h,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1g = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/LockAlt.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from lock-alt.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LockAltIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 0a5 5 0 0 1 4.995 4.783L13 5v2h2a1 1 0 0 1 .993.883L16 8v7a1 1 0 0 1-.883.993L15 16H1a1 1 0 0 1-.993-.883L0 15V8a1 1 0 0 1 .883-.993L1 7h2V5a5 5 0 0 1 5-5Zm6 9H2v5h12V9ZM8 2a3 3 0 0 0-2.995 2.824L5 5v2h6V5a3 3 0 0 0-3-3Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1g,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1g,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1f = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/LockAltFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from lock-alt-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LockAltFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M15 7a1 1 0 0 1 .993.883L16 8v7a1 1 0 0 1-.883.993L15 16H1a1 1 0 0 1-.993-.883L0 15V8a1 1 0 0 1 .883-.993L1 7h14ZM8 0a5 5 0 0 1 4.995 4.783L13 5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V5a3 3 0 0 0-5.995-.176L5 5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V5a5 5 0 0 1 5-5Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1f,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1f,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1e = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Logo.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from logo.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LogoIcon(props) {
	  return o("svg", {
	    width: "24",
	    height: "28",
	    viewBox: "0 0 24 28",
	    xmlns: "http://www.w3.org/2000/svg",
	    ...props,
	    children: [o("path", {
	      fill: "#fff",
	      d: "M3.886 3.945H21.03v16.047H3.886z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1e,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this), o("path", {
	      d: "M0 2.005C0 .898.897 0 2.005 0h19.99C23.102 0 24 .897 24 2.005v19.99A2.005 2.005 0 0 1 21.995 24H2.005A2.005 2.005 0 0 1 0 21.995V2.005ZM9 24l3 4 3-4H9ZM7.008 4H4v16h3.008v-4.997C7.008 12.005 8.168 12.01 9 12c1 .007 2.019.06 2.019 2.003V20h3.008v-6.891C14.027 10 12 9.003 10 9.003c-1.99 0-2 0-2.992 1.999V4ZM19 19.987c1.105 0 2-.893 2-1.994A1.997 1.997 0 0 0 19 16c-1.105 0-2 .892-2 1.993s.895 1.994 2 1.994Z",
	      fill: "currentColor",
	      "fill-rule": "evenodd"
	    }, void 0, false, {
	      fileName: _jsxFileName$1e,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$1e,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1d = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Logout.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from logout.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function LogoutIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M9 0a1 1 0 0 1 .117 1.993L9 2H1.999v12H9a1 1 0 0 1 .993.883L10 15a1 1 0 0 1-.883.993L9 16H1a1 1 0 0 1-.993-.883L0 15V1A1 1 0 0 1 .883.007L1 0h8Zm2.613 3.21.094.083 4 4a1 1 0 0 1 .083 1.32l-.083.094-4 4a1 1 0 0 1-1.497-1.32l.083-.094L12.585 9H5a1 1 0 0 1-.117-1.993L5 7h7.585l-2.292-2.293a1 1 0 0 1-.083-1.32l.083-.094a1 1 0 0 1 1.32-.083Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1d,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1d,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1c = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/MenuCollapse.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from menu-collapse.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function MenuCollapseIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "16",
	    xmlns: "http://www.w3.org/2000/svg",
	    ...props,
	    children: o("path", {
	      d: "m8.54 4.205 6.23 5.87a.69.69 0 0 1 0 1.03l-.72.68a.8.8 0 0 1-1.09 0L8 7.135l-4.96 4.65a.8.8 0 0 1-1.09 0l-.73-.69a.69.69 0 0 1 0-1.02l6.24-5.87a.8.8 0 0 1 1.08 0z",
	      fill: "currentColor"
	    }, void 0, false, {
	      fileName: _jsxFileName$1c,
	      lineNumber: 11,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1c,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1b = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/MenuExpand.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from menu-expand.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function MenuExpandIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M7.456 11.788 1.226 5.92a.695.695 0 0 1 0-1.025l.726-.684a.804.804 0 0 1 1.087-.001L8 8.861l4.961-4.65a.804.804 0 0 1 1.087.001l.727.684c.3.283.3.742 0 1.025l-6.23 5.867a.804.804 0 0 1-1.09 0z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1b,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1b,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$1a = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Note.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from note.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function NoteIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M14 0a2 2 0 0 1 1.995 1.85L16 2v7a1 1 0 0 1-.31.724l-.09.076-8 6a1 1 0 0 1-.471.192L7 16H2a2 2 0 0 1-1.995-1.85L0 14V2A2 2 0 0 1 1.85.005L2 0h12Zm0 2H2v12h4V9a1 1 0 0 1 .883-.993L7 8h7V2Zm-2 8H8v3l4-3Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$1a,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$1a,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$19 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/NoteFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from note-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function NoteFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M14 0a2 2 0 0 1 1.995 1.85L16 2v5a1 1 0 0 1-1 1H7a1 1 0 0 0-1 1v6a1 1 0 0 1-1 1H2a2 2 0 0 1-1.995-1.85L0 14V2A2 2 0 0 1 1.85.005L2 0h12Zm1.75 9a.25.25 0 0 1 .25.25L7.25 16a.25.25 0 0 1-.25-.25V10a1 1 0 0 1 1-1h7.75Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$19,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$19,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$18 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Plus.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from plus.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function PlusIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8.993 2.867 9 3v3.999L13 7a1 1 0 0 1 .117 1.993L13 9H9v4c0 1.287-1.864 1.332-1.993.133L7 13V9H3a1 1 0 0 1-.117-1.993L3 7h4V3c0-1.287 1.864-1.332 1.993-.133Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$18,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$18,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$17 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/PointerDown.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from pointer-down.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function PointerDownIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "9",
	    xmlns: "http://www.w3.org/2000/svg",
	    ...props,
	    children: o("path", {
	      d: "m15.5 0-7 8-8-8",
	      stroke: "currentColor"
	    }, void 0, false, {
	      fileName: _jsxFileName$17,
	      lineNumber: 11,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$17,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$16 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/PointerUp.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from pointer-up.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function PointerUpIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "9",
	    xmlns: "http://www.w3.org/2000/svg",
	    ...props,
	    children: o("path", {
	      d: "m.5 9 7-8 8 8",
	      stroke: "currentColor"
	    }, void 0, false, {
	      fileName: _jsxFileName$16,
	      lineNumber: 11,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$16,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$15 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Preview.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from preview.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function PreviewIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2ZM6 5a1 1 0 0 1 1.508-.861L7.6 4.2l4 3a1 1 0 0 1 .1 1.515l-.1.085-4 3a1 1 0 0 1-1.594-.69L6 11V5Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$15,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$15,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$14 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/PreviewFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from preview-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function PreviewFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm-.4 4.2a1 1 0 0 0-1.594.69L6 5v6a1 1 0 0 0 1.508.861L7.6 11.8l4-3a1 1 0 0 0 .1-1.515l-.1-.085-4-3Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$14,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$14,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$13 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Profile.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from profile.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ProfileIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$13,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M1 15c0-2.761 3.134-5 7-5s7 2.239 7 5M8 7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
	      }, void 0, false, {
	        fileName: _jsxFileName$13,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$13,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$13,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$12 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ProfileFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from profile-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ProfileFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 9c4.36 0 8 2.6 8 6a1 1 0 0 1-.883.993L15 16H1a1 1 0 0 1-1-1c0-3.4 3.64-6 8-6Zm0-9a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$12,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$12,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$11 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Refresh.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from refresh.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function RefreshIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    xmlns: "http://www.w3.org/2000/svg",
	    ...props,
	    children: o("g", {
	      fill: "currentColor",
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        d: "M0 8A8 8 0 1 0 11.468.79l-.868 1.8a6 6 0 1 1-5.155-.022L4.594.761A8 8 0 0 0 0 8Z"
	      }, void 0, false, {
	        fileName: _jsxFileName$11,
	        lineNumber: 18,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "M7 8.586V0h2v8.586l1.293-1.293.707-.707L12.414 8l-.707.707-3 3-.707.707-.354-.353-.353-.354-3-3L3.586 8 5 6.586l.707.707z"
	      }, void 0, false, {
	        fileName: _jsxFileName$11,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$11,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$11,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$10 = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Reply.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from reply.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ReplyIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M6.422 5.422c2 0 3.542.417 4.625 1.25 1.083.833 1.875 1.75 2.375 2.75s.792 1.917.875 2.75l.125 1.25h-2l-.094-.938c-.062-.625-.281-1.312-.656-2.062-.375-.75-.969-1.438-1.781-2.063-.813-.625-1.97-.937-3.47-.937H4.829l2 2-1.406 1.422L1 6.422 5.422 2l1.406 1.422-2 2h1.594z"
	    }, void 0, false, {
	      fileName: _jsxFileName$10,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$10,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$$ = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ReplyAlt.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from reply-alt.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ReplyAltIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M7.707.293a1 1 0 0 1 .083 1.32l-.083.094L5.415 4H8a6 6 0 1 1 0 12 1 1 0 0 1 0-2 4 4 0 1 0 0-8H5.415l2.292 2.293a1 1 0 0 1 .083 1.32l-.083.094a1 1 0 0 1-1.32.083l-.094-.083-4-4a1 1 0 0 1-.083-1.32l.083-.094 4-4a1 1 0 0 1 1.414 0Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$$,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$$,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$_ = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Restricted.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from restricted.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function RestrictedIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 0c1.682 0 3.346.68 4.717 1.766l.08.063.285.241.31.285.128.125.16.165.243.265.311.373C15.32 4.653 16 6.318 16 8c0 4.052-3.948 8-8 8-1.682 0-3.346-.68-4.717-1.766l-.056-.045a9.253 9.253 0 0 1-.322-.27l-.131-.119-.167-.156-.132-.13-.152-.156-.253-.276-.304-.365C.68 11.347 0 9.682 0 8c0-4.052 3.948-8 8-8Zm4.765 4.651L4.65 12.765C5.654 13.523 6.835 14 8 14c2.948 0 6-3.052 6-6 0-1.165-.477-2.346-1.235-3.349ZM8 2C5.052 2 2 5.052 2 8c0 1.165.477 2.347 1.236 3.35l8.114-8.114C10.347 2.476 9.165 2 8 2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$_,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$_,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$Z = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Search.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from search.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SearchIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M6 0a6 6 0 0 1 4.825 9.564l.065-.09 4.817 4.819a1 1 0 0 1-1.32 1.497l-.094-.083-4.818-4.815.058-.042A6 6 0 1 1 6 0Zm0 2a4 4 0 1 0 0 8c1 0 1.938-.367 2.651-1.003l.16-.152.15-.156A4 4 0 0 0 6 2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$Z,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$Z,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$Y = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Settings.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from settings.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SettingsIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M13 10a3 3 0 1 1-2.835 3.985l-.048.008L10 14H1a1 1 0 0 1-.117-1.993L1 12h9c.057 0 .112.005.166.014A3 3 0 0 1 13 10Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM3 0c1.312 0 2.427.842 2.835 2.015l.048-.008L6 2h9a1 1 0 0 1 .117 1.993L15 4H6c-.057 0-.112-.005-.166-.014A3 3 0 1 1 3 0Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$Y,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$Y,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$X = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Share.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from share.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ShareIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M15 9a1 1 0 0 1 .993.883L16 10v5a1 1 0 0 1-.883.993L15 16H1a1 1 0 0 1-.993-.883L0 15v-5a1 1 0 0 1 1.993-.117L2 10v4h12v-4a1 1 0 0 1 .883-.993L15 9ZM8.613.21l.094.083 4 4a1 1 0 0 1-1.32 1.497l-.094-.083L9 3.415V11a1 1 0 0 1-1.993.117L7 11V3.415L4.707 5.707a1 1 0 0 1-1.32.083l-.094-.083a1 1 0 0 1-.083-1.32l.083-.094 4-4A1 1 0 0 1 8.51.14l.102.07Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$X,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$X,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$W = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Show.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from show.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ShowIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 2c4.36 0 8 2.6 8 6s-3.64 6-8 6c-4.36 0-8-2.6-8-6s3.64-6 8-6Zm0 2C4.628 4 2 5.877 2 8s2.628 4 6 4 6-1.877 6-4-2.628-4-6-4Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$W,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$W,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$V = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/ShowFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from show-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ShowFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 2c4.36 0 8 2.6 8 6s-3.64 6-8 6c-4.36 0-8-2.6-8-6s3.64-6 8-6Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$V,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$V,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$U = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/SocialFacebook.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from social-facebook.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SocialFacebookIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$U,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M15.999 8.049c0-4.445-3.582-8.049-8-8.049S0 3.604 0 8.049C0 12.066 2.925 15.396 6.75 16v-5.624H4.717V8.049H6.75V6.276c0-2.018 1.195-3.132 3.022-3.132.875 0 1.79.157 1.79.157v1.981h-1.008c-.994 0-1.304.62-1.304 1.257v1.51h2.219l-.355 2.327H9.25V16c3.825-.604 6.75-3.934 6.75-7.951z"
	      }, void 0, false, {
	        fileName: _jsxFileName$U,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$U,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$U,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$T = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/SocialTwitter.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from social-twitter.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SocialTwitterIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        fill: "none",
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$T,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        fill: "currentColor",
	        d: "M15.969 3.049c-.59.259-1.22.436-1.884.516a3.305 3.305 0 0 0 1.442-1.815c-.634.37-1.336.64-2.084.79a3.28 3.28 0 0 0-5.59 2.988 9.29 9.29 0 0 1-6.76-3.418A3.214 3.214 0 0 0 .65 3.76c0 1.14.58 2.142 1.459 2.73a3.27 3.27 0 0 1-1.485-.41v.04a3.282 3.282 0 0 0 2.63 3.218 3.33 3.33 0 0 1-1.474.057 3.291 3.291 0 0 0 3.069 2.278A6.578 6.578 0 0 1 .78 13.076c-.26 0-.52-.015-.78-.044a9.33 9.33 0 0 0 5.038 1.472c6.036 0 9.332-4.997 9.332-9.323 0-.14 0-.28-.01-.42a6.63 6.63 0 0 0 1.64-1.7l-.031-.012z"
	      }, void 0, false, {
	        fileName: _jsxFileName$T,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$T,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$T,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$S = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Sort.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from sort.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SortIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$S,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M5 9V2v7zM1 5l4-4 4 4m2 2v7-7zm-4 4 4 4 4-4"
	      }, void 0, false, {
	        fileName: _jsxFileName$S,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$S,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$S,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$R = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/SortAlt.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from sort-alt.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SortAltIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M12 7a1 1 0 0 1 1 1v4.585l1.293-1.292a1 1 0 0 1 1.32-.083l.094.083a1 1 0 0 1 .083 1.32l-.083.094-3 3a1 1 0 0 1-1.32.083l-.094-.083-3-3a1 1 0 0 1 1.32-1.497l.094.083L11 12.585V8a1 1 0 0 1 1-1ZM4.613.21l.094.083 3 3a1 1 0 0 1-1.32 1.497l-.094-.083L5 3.415V8a1 1 0 1 1-2 0V3.415L1.707 4.707a1 1 0 0 1-1.32.083l-.094-.083a1 1 0 0 1-.083-1.32l.083-.094 3-3A1 1 0 0 1 4.613.21Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$R,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$R,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$Q = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/SpinnerCircle.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from spinner--circle.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SpinnerCircleIcon(props) {
	  return o("svg", {
	    width: "16",
	    height: "16",
	    viewBox: "0 0 38 38",
	    xmlns: "http://www.w3.org/2000/svg",
	    ...props,
	    children: o("g", {
	      transform: "translate(1 1)",
	      fill: "none",
	      "fill-rule": "evenodd",
	      children: [o("path", {
	        d: "M36 18c0-9.94-8.06-18-18-18",
	        stroke: "currentColor",
	        "stroke-width": "2",
	        children: o("animateTransform", {
	          attributeName: "transform",
	          type: "rotate",
	          from: "0 18 18",
	          to: "360 18 18",
	          dur: "0.9s",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$Q,
	          lineNumber: 23,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$Q,
	        lineNumber: 18,
	        columnNumber: 9
	      }, this), o("circle", {
	        fill: "#fff",
	        cx: "36",
	        cy: "18",
	        r: "1",
	        children: o("animateTransform", {
	          attributeName: "transform",
	          type: "rotate",
	          from: "0 18 18",
	          to: "360 18 18",
	          dur: "0.9s",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$Q,
	          lineNumber: 33,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$Q,
	        lineNumber: 32,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$Q,
	      lineNumber: 17,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$Q,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$P = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/SpinnerSpokes.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from spinner--spokes.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function SpinnerSpokesIcon(props) {
	  return o("svg", {
	    viewBox: "0 0 64 64",
	    width: "16",
	    height: "16",
	    ...props,
	    children: o("g", {
	      "stroke-width": "6",
	      stroke: "currentColor",
	      "stroke-linecap": "round",
	      children: [o("path", {
	        d: "M32 16V4",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: "0;1;.8;.65;.45;.3;.15;0",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 13,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 12,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "m43.314 20.686 8.485-8.485",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: ".15;0;1;.8;.65;.45;.3;.15",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 21,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "M48 32h12",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: ".3;.15;0;1;.8;.65;.45;.3",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 29,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 28,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "m43.314 43.314 8.485 8.485",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: ".45;.3;.15;0;1;.85;.65;.45",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 37,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 36,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "M32 48v12",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: ".65;.45;.3;.15;0;1;.8;.65;",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 45,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 44,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "m20.686 43.314-8.485 8.485",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: ".8;.65;.45;.3;.15;0;1;.8",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 53,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 52,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "M16 32H4",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: "1;.85;.6;.45;.3;.15;0;1;",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 61,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 60,
	        columnNumber: 9
	      }, this), o("path", {
	        d: "m20.686 20.686-8.485-8.485",
	        children: o("animate", {
	          attributeName: "stroke-opacity",
	          dur: "750ms",
	          values: "0;1;.8;.65;.45;.3;.15;0",
	          repeatCount: "indefinite"
	        }, void 0, false, {
	          fileName: _jsxFileName$P,
	          lineNumber: 69,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$P,
	        lineNumber: 68,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$P,
	      lineNumber: 11,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$P,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$O = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Tag.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from tag.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function TagIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M7 0a1 1 0 0 1 .563.174l.096.073 8 7a1 1 0 0 1 .222 1.227l-.067.107-5 7a1 1 0 0 1-1.38.244l-.098-.078-9-8a1 1 0 0 1-.329-.626L0 7V1A1 1 0 0 1 .883.007L1 0h6Zm-.376 2H2v4.551l7.833 6.962 3.826-5.358L6.624 2ZM5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$O,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$O,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$N = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/TagAlt.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from tag-alt.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function TagAltIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M5 3a5 5 0 1 1 0 10A5 5 0 0 1 5 3Zm6 0a5 5 0 0 1 0 10 1 1 0 0 1-.117-1.993L11 11a3 3 0 0 0 0-6 1 1 0 0 1 0-2ZM5 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$N,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$N,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$M = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/TagAltFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from tag-alt-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function TagAltFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M5 3a5 5 0 1 1 0 10A5 5 0 0 1 5 3Zm6 0a5 5 0 0 1 0 10 1 1 0 0 1-.117-1.993L11 11a3 3 0 0 0 0-6 1 1 0 0 1 0-2Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$M,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$M,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$L = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/TagFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from tag-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function TagFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M7 0a1 1 0 0 1 .563.174l.096.073 8 7a1 1 0 0 1 .222 1.227l-.067.107-5 7a1 1 0 0 1-1.38.244l-.098-.078-9-8a1 1 0 0 1-.329-.626L0 7V1A1 1 0 0 1 .883.007L1 0h6ZM5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$L,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$L,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$K = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Theme.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from theme.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function ThemeIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M8 12a1 1 0 0 1 .993.883L9 13v2a1 1 0 0 1-1.993.117L7 15v-2a1 1 0 0 1 1-1Zm-2.828-1.172a1 1 0 0 1 .077 1.327l-.077.088-1.415 1.414a1 1 0 0 1-1.492-1.327l.078-.087 1.414-1.415a1 1 0 0 1 1.415 0Zm6.983-.077.088.077 1.414 1.415a1 1 0 0 1-1.327 1.492l-.087-.078-1.415-1.414a1 1 0 0 1 1.327-1.492ZM8 5c1.552 0 3 1.448 3 3s-1.448 3-3 3-3-1.448-3-3 1.448-3 3-3Zm7 2a1 1 0 0 1 .117 1.993L15 9h-2a1 1 0 0 1-.117-1.993L13 7h2ZM3 7a1 1 0 0 1 .117 1.993L3 9H1a1 1 0 0 1-.117-1.993L1 7h2Zm10.657-4.657a1 1 0 0 1 .078 1.327l-.078.087-1.414 1.415a1 1 0 0 1-1.492-1.327l.077-.088 1.415-1.414a1 1 0 0 1 1.414 0ZM3.67 2.265l.087.078 1.415 1.414A1 1 0 0 1 3.845 5.25l-.088-.077-1.414-1.415A1 1 0 0 1 3.67 2.265ZM8 0a1 1 0 0 1 .993.883L9 1v2a1 1 0 0 1-1.993.117L7 3V1a1 1 0 0 1 1-1Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$K,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$K,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$J = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/Trash.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from trash.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function TrashIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("g", {
	      "fill-rule": "evenodd",
	      fill: "none",
	      children: [o("path", {
	        d: "M0 0h16v16H0z"
	      }, void 0, false, {
	        fileName: _jsxFileName$J,
	        lineNumber: 19,
	        columnNumber: 9
	      }, this), o("path", {
	        stroke: "currentColor",
	        "stroke-linecap": "round",
	        "stroke-linejoin": "round",
	        "stroke-width": "2",
	        d: "M2 4h12l-2 11H4L2 4zM1 1h14H1z"
	      }, void 0, false, {
	        fileName: _jsxFileName$J,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$J,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$J,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$I = "/home/runner/work/frontend-shared/frontend-shared/src/components/icons/TrashFilled.js";
	// This file was auto-generated using scripts/generate-icons.js

	/**
	 * Icon generated from trash-filled.svg
	 *
	 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
	 */
	function TrashFilledIcon(props) {
	  return o("svg", {
	    xmlns: "http://www.w3.org/2000/svg",
	    width: "16",
	    height: "16",
	    viewBox: "0 0 16 16",
	    "aria-hidden": "true",
	    ...props,
	    children: o("path", {
	      fill: "currentColor",
	      d: "M14 4a1 1 0 0 1 .997 1.08l-.016.116-2 10a1 1 0 0 1-.863.797L12 16H4a1 1 0 0 1-.95-.69l-.03-.114-2-10a1 1 0 0 1 .864-1.19L2 4h12Zm1-4a1 1 0 0 1 0 2H1a1 1 0 1 1 0-2h14Z"
	    }, void 0, false, {
	      fileName: _jsxFileName$I,
	      lineNumber: 18,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$I,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	// This file was auto-generated using scripts/generate-icons.js

	var _jsxFileName$H = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/AspectRatio.js";

	const AspectRatioNext = function AspectRatio({
	  children,
	  objectFit = 'cover',
	  ratio = '16/9'
	}) {
	  // Find the first vNode. This is the element that will be constrained to the
	  // aspect ratio. Typically, this is either:
	  // - a "replaceable element", e.g. image or video (media), or
	  // - a block element, e.g. a div that contains placeholder content. In this
	  //   case, content within this node will be centered horizontally and
	  //   vertically.
	  const childNodes = x$1(children);
	  const firstChildNode =
	  /** @type {import('preact').VNode<any>|undefined} */
	  childNodes.find(child => typeof child === 'object');
	  const otherChildren = firstChildNode ? childNodes.filter(child => child !== firstChildNode) : children;
	  const mediaClasses = classnames( // Position the element box relative to its container
	  'absolute w-full h-full top-0 left-0', // Center any children horizontally and vertically
	  'flex items-center justify-center', {
	    'object-cover': objectFit === 'cover',
	    // default
	    'object-contain': objectFit === 'contain',
	    'object-fill': objectFit === 'fill',
	    'object-scale-down': objectFit === 'scale-down',
	    'object-none': objectFit === 'none'
	  });
	  return o("div", {
	    className: "w-full h-0 relative overflow-hidden",
	    "data-component": "AspectRatio",
	    style: {
	      paddingBottom: `calc(100% / (${ratio}))`
	    },
	    children: [firstChildNode && q$1(firstChildNode, {
	      class: classnames(mediaClasses, // Retain existing classes
	      firstChildNode.props.className)
	    }), otherChildren]
	  }, void 0, true, {
	    fileName: _jsxFileName$H,
	    lineNumber: 65,
	    columnNumber: 5
	  }, this);
	};

	/**
	 * @typedef ScrollInfo
	 * @prop {import('preact').RefObject<HTMLElement>} scrollRef
	 */

	const ScrollContext = B$1(
	/** @type {ScrollInfo} */
	{});

	/**
	 * @typedef TableInfo
	 * @prop {boolean} interactive - This table has click-able, focus-able rows
	 * @prop {boolean} stickyHeader - This table has a sticky header
	 * @prop {import('preact').RefObject<HTMLElement>} tableRef
	 */

	const TableContext = B$1(
	/** @type {TableInfo} */
	{});

	var _jsxFileName$G = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/Table.js";

	const TableNext = function Table({
	  children,
	  classes,
	  elementRef,
	  interactive = false,
	  title,
	  stickyHeader,
	  ...htmlAttributes
	}) {
	  const ref = useSyncedRef(elementRef);
	  const tableContext =
	  /** @type {TableInfo} */
	  {
	    interactive,
	    stickyHeader,
	    tableRef: ref
	  };
	  return o(TableContext.Provider, {
	    value: tableContext,
	    children: o("table", { ...htmlAttributes,
	      "aria-label": title,
	      className: classnames('w-full h-full', // Set the width of columns based on the width of the columns in the
	      // first table row (typically headers)
	      'table-fixed', // `border-separate` is required to handle borders on sticky headers.
	      // A side effect is that borders need to be set primarily on table
	      // cells, not rows
	      'border-separate border-spacing-0', // No top border is set here: that border is set by `TableCell`.
	      // If it is set here, there will be a 1-pixel wiggle in the sticky
	      // header on scroll
	      'border-x border-b', classes),
	      ref: downcastRef$1(ref),
	      "data-component": "Table",
	      children: children
	    }, void 0, false, {
	      fileName: _jsxFileName$G,
	      lineNumber: 44,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$G,
	    lineNumber: 43,
	    columnNumber: 5
	  }, this);
	};

	/**
	 * @typedef TableSection
	 * @prop {'head'|'body'|'footer'} section
	 */

	const TableSectionContext = B$1(
	/** @type {TableSection} */
	{});

	var _jsxFileName$F = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/TableHead.js";

	const TableHeadNext = function TableHead({
	  children,
	  classes,
	  elementRef,
	  ...htmlAttributes
	}) {
	  const tableContext = q(TableContext);
	  const sectionContext =
	  /** @type {TableSection} */
	  {
	    section: 'head'
	  };
	  return o(TableSectionContext.Provider, {
	    value: sectionContext,
	    children: o("thead", { ...htmlAttributes,
	      ref: downcastRef$1(elementRef),
	      className: classnames('bg-grey-2', {
	        'sticky top-0': tableContext === null || tableContext === void 0 ? void 0 : tableContext.stickyHeader
	      }, classes),
	      "data-component": "TableHead",
	      children: children
	    }, void 0, false, {
	      fileName: _jsxFileName$F,
	      lineNumber: 35,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$F,
	    lineNumber: 34,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$E = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/TableBody.js";

	const TableBodyNext = function TableBody({
	  children,
	  classes,
	  elementRef,
	  ...htmlAttributes
	}) {
	  const tableContext = q(TableContext);
	  const sectionContext =
	  /** @type {TableSection} */
	  {
	    section: 'body'
	  };
	  return o(TableSectionContext.Provider, {
	    value: sectionContext,
	    children: o("tbody", { ...htmlAttributes,
	      ref: downcastRef$1(elementRef),
	      className: classnames({
	        'cursor-pointer': tableContext === null || tableContext === void 0 ? void 0 : tableContext.interactive
	      }, classes),
	      "data-component": "TableBody",
	      children: children
	    }, void 0, false, {
	      fileName: _jsxFileName$E,
	      lineNumber: 34,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$E,
	    lineNumber: 33,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$D = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/TableRow.js";

	const TableRowNext = function TableRow({
	  children,
	  classes,
	  elementRef,
	  selected,
	  ...htmlAttributes
	}) {
	  const rowRef = useSyncedRef(elementRef);
	  const sectionContext = q(TableSectionContext);
	  const tableContext = q(TableContext);
	  const isHeadRow = (sectionContext === null || sectionContext === void 0 ? void 0 : sectionContext.section) === 'head';
	  return o("tr", { ...htmlAttributes,
	    "aria-selected": selected,
	    ref: downcastRef$1(rowRef),
	    className: classnames('group', {
	      // Low-opacity backgrounds allow any scroll shadows to be visible
	      'odd:bg-slate-9/[.03]': !isHeadRow && !selected,
	      'bg-slate-7 text-color-text-inverted': selected,
	      'focus-visible-ring ring-inset': tableContext === null || tableContext === void 0 ? void 0 : tableContext.interactive,
	      'hover:bg-slate-9/[.08]': (tableContext === null || tableContext === void 0 ? void 0 : tableContext.interactive) && !selected
	    }, classes),
	    "data-component": "TableRow",
	    "data-section": isHeadRow ? 'head' : 'body',
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$D,
	    lineNumber: 40,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$C = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/TableCell.js";

	const TableCellNext = function TableCell({
	  children,
	  classes,
	  elementRef,
	  ...htmlAttributes
	}) {
	  const sectionContext = q(TableSectionContext);
	  const isHeadCell = sectionContext && sectionContext.section === 'head';
	  const Cell = isHeadCell ? 'th' : 'td';
	  return o(Cell, { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames('p-3', {
	      // Set horizontal borders here for table headers. This needs to be
	      // done here (versus on the row or table) to prevent a 1-pixel wiggle
	      // on scroll with sticky headers.
	      'text-left border-t border-b border-b-grey-5': isHeadCell,
	      'border-none': !isHeadCell
	    }, classes),
	    "data-component": "TableCell",
	    scope: isHeadCell ? 'col' : undefined,
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$C,
	    lineNumber: 30,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$B = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/DataTable.js";

	const DataTableNext = function DataTable({
	  children,
	  elementRef,
	  columns = [],
	  rows = [],
	  title,
	  selectedRow,
	  loading = false,
	  renderItem = (row, field) =>
	  /** @type {Children} */
	  row[field],
	  onSelectRow,
	  onConfirmRow,
	  emptyMessage,
	  ...htmlAttributes
	}) {
	  const tableRef = useSyncedRef(elementRef);
	  const scrollContext = q(ScrollContext);
	  useArrowKeyNavigation(tableRef, {
	    selector: 'tbody tr',
	    horizontal: true,
	    vertical: true
	  });
	  const noContent = loading || !rows.length && emptyMessage;
	  const fields = columns.map(column => column.field);
	  /** @param {Row} row */

	  function selectRow(row) {
	    onSelectRow === null || onSelectRow === void 0 ? void 0 : onSelectRow(row);
	  }
	  /** @param {Row} row */


	  function confirmRow(row) {
	    onConfirmRow === null || onConfirmRow === void 0 ? void 0 : onConfirmRow(row);
	  }
	  /**
	   * @param {KeyboardEvent} event
	   * @param {Row} row
	   * */


	  function handleKeyDown(event, row) {
	    if (event.key === 'Enter') {
	      confirmRow(row);
	      event.preventDefault();
	      event.stopPropagation();
	    }
	  } // Ensure that a selected row is visible when this table is within
	  // a scrolling context


	  h(() => {
	    var _tableRef$current, _tableRef$current2;

	    if (!selectedRow || !scrollContext) {
	      return;
	    }

	    const scrollEl = scrollContext.scrollRef.current;
	    const tableHead = (_tableRef$current = tableRef.current) === null || _tableRef$current === void 0 ? void 0 : _tableRef$current.querySelector('thead');
	    /** @type {HTMLElement | undefined | null} */

	    const selectedRowEl = (_tableRef$current2 = tableRef.current) === null || _tableRef$current2 === void 0 ? void 0 : _tableRef$current2.querySelector('tr[aria-selected="true"]');

	    if (scrollEl && selectedRowEl) {
	      // Ensure the row is visible within the scroll content area
	      const scrollOffset = selectedRowEl.offsetTop - scrollEl.scrollTop;

	      if (scrollOffset > scrollEl.clientHeight) {
	        selectedRowEl.scrollIntoView();
	      } // Ensure the row is not obscured by a sticky header


	      if (tableHead) {
	        const headingHeight = tableHead.clientHeight;
	        const headingOffset = scrollOffset - headingHeight;

	        if (headingOffset < 0) {
	          scrollEl.scrollBy(0, headingOffset);
	        }
	      }
	    }
	  }, [selectedRow, tableRef, scrollContext]);
	  return o(TableNext, { ...htmlAttributes,
	    title: title,
	    elementRef: downcastRef$1(tableRef),
	    interactive: !!(onSelectRow || onConfirmRow),
	    stickyHeader: true,
	    role: "grid",
	    "data-composite-component": "DataTable",
	    children: [o(TableHeadNext, {
	      children: o(TableRowNext, {
	        children: columns.map(column => o(TableCellNext, {
	          classes: column.classes,
	          children: column.label
	        }, column.field, false, {
	          fileName: _jsxFileName$B,
	          lineNumber: 145,
	          columnNumber: 13
	        }, this))
	      }, void 0, false, {
	        fileName: _jsxFileName$B,
	        lineNumber: 143,
	        columnNumber: 9
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$B,
	      lineNumber: 142,
	      columnNumber: 7
	    }, this), o(TableBodyNext, {
	      children: [!loading && rows.map((row, idx) => o(TableRowNext, {
	        selected: row === selectedRow,
	        onClick: () => selectRow(row),
	        onFocus: () => selectRow(row),
	        onDblClick: () => confirmRow(row),
	        onKeyDown: event => handleKeyDown(event, row),
	        children: fields.map(field => o(TableCellNext, {
	          children: renderItem(row,
	          /** @type {keyof Row} */
	          field)
	        }, field, false, {
	          fileName: _jsxFileName$B,
	          lineNumber: 163,
	          columnNumber: 17
	        }, this))
	      }, idx, false, {
	        fileName: _jsxFileName$B,
	        lineNumber: 154,
	        columnNumber: 13
	      }, this)), noContent && o("tr", {
	        children: o("td", {
	          colSpan: columns.length,
	          className: "text-center p-3",
	          children: loading ? o(SpinnerSpokesIcon, {
	            className: "inline w-4em h-4em"
	          }, void 0, false, {
	            fileName: _jsxFileName$B,
	            lineNumber: 173,
	            columnNumber: 17
	          }, this) : o(p$2, {
	            children: emptyMessage
	          }, void 0, false)
	        }, void 0, false, {
	          fileName: _jsxFileName$B,
	          lineNumber: 171,
	          columnNumber: 13
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$B,
	        lineNumber: 170,
	        columnNumber: 11
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$B,
	      lineNumber: 151,
	      columnNumber: 7
	    }, this), children]
	  }, void 0, true, {
	    fileName: _jsxFileName$B,
	    lineNumber: 133,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$A = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/Scroll.js";

	const ScrollNext = function Scroll({
	  children,
	  classes,
	  elementRef,
	  variant = 'raised',
	  ...htmlAttributes
	}) {
	  const ref = useSyncedRef(elementRef);
	  const scrollContext =
	  /** @type {ScrollInfo} */
	  {
	    scrollRef: ref
	  };
	  return o(ScrollContext.Provider, {
	    value: scrollContext,
	    children: o("div", { ...htmlAttributes,
	      ref: downcastRef$1(ref),
	      className: classnames( // Prevent overflow by overriding `min-height: auto`.
	      // See https://stackoverflow.com/a/66689926/434243.
	      'min-h-0', 'h-full w-full overflow-auto', {
	        'scroll-shadows': variant === 'raised'
	      }, classes),
	      "data-component": "Scroll",
	      children: children
	    }, void 0, false, {
	      fileName: _jsxFileName$A,
	      lineNumber: 40,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$A,
	    lineNumber: 39,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$z = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/ScrollContainer.js";

	const ScrollContainerNext = function ScrollContainer({
	  children,
	  classes,
	  elementRef,
	  borderless = false,
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames('flex flex-col h-full w-full', // Prevent overflow by overriding `min-height: auto`.
	    // See https://stackoverflow.com/a/66689926/434243.
	    'min-h-0', {
	      border: !borderless
	    }, classes),
	    "data-component": "ScrollContainer",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$z,
	    lineNumber: 29,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$y = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/ScrollContent.js";

	const ScrollContentNext = function ScrollContent({
	  children,
	  classes,
	  elementRef,
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames('px-3 py-2', classes),
	    "data-component": "ScrollContent",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$y,
	    lineNumber: 22,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$x = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/ScrollBox.js";

	const ScrollBoxNext = function ScrollBox({
	  children,
	  elementRef,
	  borderless = false,
	  ...htmlAttributes
	}) {
	  return o(ScrollContainerNext, { ...htmlAttributes,
	    borderless: borderless,
	    elementRef: elementRef,
	    "data-composite-component": "ScrollBox",
	    children: o(ScrollNext, {
	      children: o(ScrollContentNext, {
	        children: children
	      }, void 0, false, {
	        fileName: _jsxFileName$x,
	        lineNumber: 35,
	        columnNumber: 9
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$x,
	      lineNumber: 34,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$x,
	    lineNumber: 28,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$w = "/home/runner/work/frontend-shared/frontend-shared/src/components/feedback/Spinner.tsx";

	/**
	 * Style a spinner icon.
	 */
	const SpinnerNext = function Spinner({
	  size = 'sm',
	  color = 'text-light'
	}) {
	  return o(SpinnerSpokesIcon, {
	    className: classnames({
	      'text-color-text-light': color === 'text-light',
	      // default
	      'text-color-text': color === 'text',
	      'text-color-text-inverted': color === 'text-inverted'
	    }, {
	      'w-em h-em': size === 'sm',
	      // default
	      'w-2em h-2em': size === 'md',
	      'w-4em h-4em': size === 'lg'
	    }),
	    "data-component": "Spinner"
	  }, void 0, false, {
	    fileName: _jsxFileName$w,
	    lineNumber: 18,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$v = "/home/runner/work/frontend-shared/frontend-shared/src/components/data/Thumbnail.js";

	const ThumbnailNext = function Thumbnail({
	  children,
	  elementRef,
	  borderless = false,
	  loading = false,
	  placeholder,
	  ratio = '16/9',
	  size = 'md',
	  ...htmlAttributes
	}) {
	  const emptyContent = placeholder !== null && placeholder !== void 0 ? placeholder : o(EllipsisIcon, {
	    className: classnames('text-grey-5', {
	      'w-4 h-4': size === 'sm' || size === 'md',
	      // default (md)
	      'w-8 h-8': size === 'lg'
	    })
	  }, void 0, false, {
	    fileName: _jsxFileName$v,
	    lineNumber: 43,
	    columnNumber: 5
	  }, this); // If there are no `children`, render a placeholder (unless loading)

	  const content = x$1(children).length ? children : o("div", {
	    children: emptyContent
	  }, void 0, false, {
	    fileName: _jsxFileName$v,
	    lineNumber: 54,
	    columnNumber: 5
	  }, this);
	  return o("div", { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames('bg-grey-1 w-full h-full overflow-hidden', {
	      'p-3': size === 'md' && !borderless,
	      // default
	      'p-2': size === 'sm' && !borderless,
	      'p-4': size === 'lg' && !borderless,
	      'p-0': borderless
	    }),
	    "data-composite-component": "Thumbnail",
	    children: o("div", {
	      className: "bg-white h-full w-full flex items-center justify-center overflow-hidden",
	      children: o(AspectRatioNext, {
	        ratio: ratio,
	        children: loading ? o("div", {
	          children: o(SpinnerNext, {
	            size: size
	          }, void 0, false, {
	            fileName: _jsxFileName$v,
	            lineNumber: 73,
	            columnNumber: 15
	          }, this)
	        }, void 0, false, {
	          fileName: _jsxFileName$v,
	          lineNumber: 72,
	          columnNumber: 13
	        }, this) : content
	      }, void 0, false, {
	        fileName: _jsxFileName$v,
	        lineNumber: 70,
	        columnNumber: 9
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$v,
	      lineNumber: 69,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$v,
	    lineNumber: 58,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$u = "/home/runner/work/frontend-shared/frontend-shared/src/components/layout/Overlay.js";

	const OverlayNext = function Overlay({
	  children,
	  classes,
	  elementRef,
	  open = true,
	  variant = 'dark',
	  ...htmlAttributes
	}) {
	  if (!open) {
	    return null;
	  }

	  return o("div", { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames('fixed top-0 left-0 w-full h-full z-10 flex items-center justify-center', {
	      'bg-black/50': variant === 'dark',
	      // default
	      'bg-white/50': variant === 'light'
	    }, classes),
	    "data-component": "Overlay",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$u,
	    lineNumber: 34,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$t = "/home/runner/work/frontend-shared/frontend-shared/src/components/feedback/SpinnerOverlay.js";

	const SpinnerOverlayNext = function SpinnerOverlay({ ...htmlAttributes
	}) {
	  return o(OverlayNext, { ...htmlAttributes,
	    variant: "light",
	    "data-composite-component": "SpinnerOverlay",
	    children: o(SpinnerNext, {
	      size: "lg"
	    }, void 0, false, {
	      fileName: _jsxFileName$t,
	      lineNumber: 20,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$t,
	    lineNumber: 15,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$s = "/home/runner/work/frontend-shared/frontend-shared/src/components/input/ButtonBase.js";

	const ButtonBaseNext = function ButtonBase({
	  elementRef,
	  children,
	  classes,
	  unstyled = false,
	  expanded,
	  pressed,
	  title,
	  role,
	  ...htmlAttributes
	}) {
	  /** @type {Record<string, unknown>} */
	  const ariaProps = {
	    'aria-label': title
	  }; // aria-pressed and aria-expanded are not allowed for buttons with
	  // an aria role of `tab`. Instead, the aria-selected attribute is expected.

	  if (role === 'tab') {
	    ariaProps['aria-selected'] = pressed;
	  } else {
	    ariaProps['aria-pressed'] = pressed;
	    ariaProps['aria-expanded'] = expanded;
	  }

	  return o("button", {
	    role: role !== null && role !== void 0 ? role : 'button',
	    ...ariaProps,
	    "data-base-component": "ButtonBase"
	    /* data-component will be overwritten unless this component is used directly */
	    ,
	    "data-component": "ButtonBase",
	    ...htmlAttributes,
	    className: classnames({
	      'focus-visible-ring': !unstyled,
	      'transition-colors': !unstyled,
	      // Set layout for button content
	      'whitespace-nowrap flex items-center': !unstyled
	    }, classes),
	    title: title,
	    ref: downcastRef$1(elementRef),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$s,
	    lineNumber: 59,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$r = "/home/runner/work/frontend-shared/frontend-shared/src/components/input/Button.js";

	const ButtonNext = function Button({
	  children,
	  classes,
	  elementRef,
	  expanded,
	  pressed,
	  title,
	  icon: Icon,
	  size = 'md',
	  variant = 'secondary',
	  ...htmlAttributes
	}) {
	  return o(ButtonBaseNext, { ...htmlAttributes,
	    classes: classnames('focus-visible-ring transition-colors whitespace-nowrap flex items-center', 'font-semibold rounded-sm', {
	      // Variants
	      'text-grey-7 bg-grey-1 enabled:hover:text-grey-9 enabled:hover:bg-grey-2 aria-pressed:text-grey-9 aria-expanded:text-grey-9': variant === 'secondary',
	      // default
	      'text-grey-1 bg-grey-7 enabled:hover:bg-grey-8 disabled:text-grey-4': variant === 'primary'
	    }, {
	      // Sizes
	      'p-2 gap-x-2': size === 'md',
	      // default
	      'p-1 gap-x-1': size === 'xs',
	      'p-1.5 gap-x-1.5': size === 'sm',
	      'p-2.5 gap-x-1.5': size === 'lg'
	    }, classes),
	    elementRef: downcastRef$1(elementRef),
	    expanded: expanded,
	    pressed: pressed,
	    title: title,
	    "data-component": "Button",
	    unstyled: true,
	    children: [Icon && o(Icon, {
	      className: "w-em h-em"
	    }, void 0, false, {
	      fileName: _jsxFileName$r,
	      lineNumber: 70,
	      columnNumber: 16
	    }, this), children]
	  }, void 0, true, {
	    fileName: _jsxFileName$r,
	    lineNumber: 42,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$q = "/home/runner/work/frontend-shared/frontend-shared/src/components/input/Checkbox.js";

	const CheckboxNext = function Checkbox({
	  children,
	  elementRef,
	  checked,
	  defaultChecked = false,
	  icon: UncheckedIcon = CheckboxOutlineIcon,
	  checkedIcon: CheckedIcon = CheckboxCheckedIcon,
	  disabled,
	  onChange,
	  id,
	  ...htmlAttributes
	}) {
	  // If `checked` is present, treat this as a controlled component
	  const isControlled = typeof checked === 'boolean'; // Only use this local state if checkbox is uncontrolled

	  const [uncontrolledChecked, setUncontrolledChecked] = p(defaultChecked);
	  const isChecked = isControlled ? checked : uncontrolledChecked;
	  /**
	   * @param {import('preact').JSX.TargetedEvent<HTMLInputElement>} event
	   * @this HTMLInputElement
	   */

	  function handleChange(event) {
	    // preact event handlers expects `this` context to be of type `never`
	    // https://github.com/preactjs/preact/issues/3137
	    onChange === null || onChange === void 0 ? void 0 : onChange.call(
	    /** @type {never} */
	    this, event);

	    if (!isControlled) {
	      setUncontrolledChecked(
	      /** @type {HTMLInputElement} */
	      event.target.checked);
	    }
	  }

	  return o("label", {
	    className: classnames('relative flex items-center gap-x-1.5', {
	      'cursor-pointer': !disabled,
	      'opacity-70': disabled
	    }),
	    htmlFor: id,
	    "data-composite-component": "Checkbox",
	    children: [o("input", { ...htmlAttributes,
	      type: "checkbox",
	      ref: downcastRef$1(elementRef),
	      className: classnames( // Position this atop the icon and size it to the same dimensions
	      'absolute w-em h-em', // Make checkbox input visually hidden, but
	      // some screen readers won't read out elements with 0 opacity
	      'opacity-[.00001]', {
	        'cursor-pointer': !disabled
	      }),
	      checked: isChecked,
	      disabled: disabled,
	      id: id,
	      onChange: handleChange
	    }, void 0, false, {
	      fileName: _jsxFileName$q,
	      lineNumber: 75,
	      columnNumber: 7
	    }, this), isChecked ? o(CheckedIcon, {
	      className: "w-em h-em"
	    }, void 0, false, {
	      fileName: _jsxFileName$q,
	      lineNumber: 95,
	      columnNumber: 9
	    }, this) : o(UncheckedIcon, {
	      className: "w-em h-em"
	    }, void 0, false, {
	      fileName: _jsxFileName$q,
	      lineNumber: 97,
	      columnNumber: 9
	    }, this), children]
	  }, void 0, true, {
	    fileName: _jsxFileName$q,
	    lineNumber: 67,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$p = "/home/runner/work/frontend-shared/frontend-shared/src/components/input/InputGroup.js";
	const inputGroupStyles = classnames( // All inputs within an InputGroup should have a border. Turn off border-radius
	'input-group:border input-group:rounded-none', // Restore border-radius on the leftmost and rightmost components in the group
	'input-group:first:rounded-l-sm input-group:last:rounded-r-sm', // "Collapse" borders between input components
	'input-group:border-l-0 input-group:first:border-l');
	/**
	 * Render a container that lays out a group of input components
	 *
	 * @param {CommonProps & HTMLAttributes} props
	 */

	const InputGroupNext = function InputGroup({
	  children,
	  classes,
	  elementRef,
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames( // Set the `.input-group` class so that children may
	    // use the `input-group:` variant in their styles
	    'input-group', 'flex items-stretch w-full justify-center', classes),
	    "data-component": "InputGroup",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$p,
	    lineNumber: 34,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$o = "/home/runner/work/frontend-shared/frontend-shared/src/components/input/IconButton.js";

	const IconButtonNext = function IconButton({
	  children,
	  classes,
	  elementRef,
	  pressed,
	  expanded,
	  icon: Icon,
	  disableTouchSizing = false,
	  size = 'md',
	  title,
	  variant = 'secondary',
	  ...htmlAttributes
	}) {
	  return o(ButtonBaseNext, { ...htmlAttributes,
	    classes: classnames('focus-visible-ring transition-colors whitespace-nowrap flex items-center', 'justify-center gap-x-2 rounded-sm', {
	      // variant
	      'text-grey-7 bg-transparent enabled:hover:text-grey-9 aria-pressed:text-brand aria-expanded:text-brand': variant === 'secondary',
	      //default
	      'text-brand bg-transparent enabled:hover:text-grey-9 disabled:text-grey-7': variant === 'primary',
	      'text-grey-7 bg-grey-2 enabled:hover:text-grey-9 enabled:hover:bg-grey-3 disabled:text-grey-5 aria-pressed:bg-grey-3 aria-expanded:bg-grey-3': variant === 'dark',
	      // size
	      'p-2': size === 'md',
	      // Default
	      'p-1': size === 'xs',
	      'p-1.5': size === 'sm',
	      'p-2.5': size === 'lg',
	      // Responsive
	      'touch:min-w-touch-minimum touch:min-h-touch-minimum': !disableTouchSizing
	    }, // Adapt styling when this component is inside an InputGroup
	    inputGroupStyles, classes),
	    elementRef: downcastRef$1(elementRef),
	    title: title,
	    pressed: pressed,
	    expanded: expanded,
	    "data-component": "IconButton",
	    unstyled: true,
	    children: [Icon && o(Icon, {
	      className: "w-em h-em"
	    }, void 0, false, {
	      fileName: _jsxFileName$o,
	      lineNumber: 83,
	      columnNumber: 16
	    }, this), children]
	  }, void 0, true, {
	    fileName: _jsxFileName$o,
	    lineNumber: 48,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$n = "/home/runner/work/frontend-shared/frontend-shared/src/components/input/Input.js";

	const InputNext = function Input({
	  children,
	  classes,
	  elementRef,
	  hasError,
	  type = 'text',
	  ...htmlAttributes
	}) {
	  // @ts-expect-error - "aria-label" is missing from HTMLInputAttributes
	  if (!htmlAttributes.id && !htmlAttributes['aria-label']) {
	    console.warn('`Input` component should have either an `id` or an `aria-label` attribute');
	  }

	  return o("input", { ...htmlAttributes,
	    type: type,
	    ref: downcastRef$1(elementRef),
	    className: classnames('focus-visible-ring ring-inset border rounded-sm w-full p-2', 'bg-grey-0 focus:bg-white disabled:bg-grey-1', 'placeholder:text-color-grey-5 disabled:placeholder:color-grey-6', {
	      'ring-inset ring-2 ring-red-error': hasError
	    }, // Adapt styles when this component is inside an InputGroup
	    inputGroupStyles, classes),
	    "data-component": "Input",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$n,
	    lineNumber: 38,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$m = "/home/runner/work/frontend-shared/frontend-shared/src/components/layout/Card.js";

	const CardNext = function Card({
	  children,
	  classes,
	  elementRef,
	  active = false,
	  variant = 'raised',
	  width = 'full',
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames('rounded-sm border bg-white', {
	      'shadow hover:shadow-md': variant === 'raised',
	      // default
	      'shadow-md': active && variant === 'raised'
	    }, {
	      'w-full': width === 'full',
	      // default
	      'w-auto': width === 'auto' // No width is set if `width === 'custom'`

	    }, classes),
	    "data-component": "Card",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$m,
	    lineNumber: 36,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$l = "/home/runner/work/frontend-shared/frontend-shared/src/components/layout/CardContent.js";

	const CardContentNext = function CardContent({
	  children,
	  classes,
	  elementRef,
	  size = 'md',
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    ref: downcastRef$1(elementRef),
	    className: classnames({
	      'p-3 space-y-4': size === 'md',
	      // Default
	      'p-2 space-y-3': size === 'sm',
	      'p-4 space-y-6': size === 'lg'
	    }, classes),
	    "data-component": "CardContent",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$l,
	    lineNumber: 28,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$k = "/home/runner/work/frontend-shared/frontend-shared/src/components/layout/CardTitle.js";

	const CardTitleNext = function CardTitle({
	  children,
	  classes,
	  elementRef,
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    className: classnames('grow text-lg text-brand font-semibold', classes),
	    ref: downcastRef$1(elementRef),
	    "data-component": "CardTitle",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$k,
	    lineNumber: 24,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$j = "/home/runner/work/frontend-shared/frontend-shared/src/components/layout/CardHeader.js";

	const CardHeaderNext = function CardHeader({
	  children,
	  classes,
	  elementRef,
	  onClose,
	  title,
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    className: classnames('flex items-center gap-x-2 mx-3 py-2 border-b', classes),
	    ref: downcastRef$1(elementRef),
	    "data-component": "CardHeader",
	    children: [title && o(CardTitleNext, {
	      children: title
	    }, void 0, false, {
	      fileName: _jsxFileName$j,
	      lineNumber: 45,
	      columnNumber: 17
	    }, this), children, onClose && o(IconButtonNext, {
	      onClick: onClose,
	      title: "Close",
	      children: o(CancelIcon, {}, void 0, false, {
	        fileName: _jsxFileName$j,
	        lineNumber: 49,
	        columnNumber: 11
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$j,
	      lineNumber: 48,
	      columnNumber: 9
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$j,
	    lineNumber: 36,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$i = "/home/runner/work/frontend-shared/frontend-shared/src/components/layout/CardActions.js";

	const CardActionsNext = function CardActions({
	  children,
	  classes,
	  elementRef,
	  ...htmlAttributes
	}) {
	  return o("div", { ...htmlAttributes,
	    className: classnames('flex items-center justify-end space-x-3', classes),
	    ref: downcastRef$1(elementRef),
	    "data-component": "CardActions",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$i,
	    lineNumber: 23,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$h = "/home/runner/work/frontend-shared/frontend-shared/src/components/layout/Panel.js";

	const PanelNext = function Panel({
	  children,
	  elementRef,
	  buttons,
	  icon: Icon,
	  onClose,
	  title,
	  ...htmlAttributes
	}) {
	  return o(CardNext, { ...htmlAttributes,
	    elementRef: downcastRef$1(elementRef),
	    "data-composite-component": "Panel",
	    children: [o(CardHeaderNext, {
	      onClose: onClose,
	      children: [Icon && o(Icon, {
	        className: "w-em h-em"
	      }, void 0, false, {
	        fileName: _jsxFileName$h,
	        lineNumber: 47,
	        columnNumber: 18
	      }, this), o(CardTitleNext, {
	        children: title
	      }, void 0, false, {
	        fileName: _jsxFileName$h,
	        lineNumber: 48,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$h,
	      lineNumber: 46,
	      columnNumber: 7
	    }, this), o(CardContentNext, {
	      children: [children, buttons && o(CardActionsNext, {
	        children: buttons
	      }, void 0, false, {
	        fileName: _jsxFileName$h,
	        lineNumber: 52,
	        columnNumber: 21
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$h,
	      lineNumber: 50,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$h,
	    lineNumber: 41,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$g = "/home/runner/work/frontend-shared/frontend-shared/src/components/navigation/LinkBase.js";

	const LinkBaseNext = function LinkBase({
	  children,
	  classes,
	  elementRef,
	  unstyled = false,
	  ...htmlAttributes
	}) {
	  return o("a", {
	    "data-base-component": "LinkBase"
	    /* data-component will be overwritten unless this component is used directly */
	    ,
	    "data-component": "LinkBase",
	    ...htmlAttributes,
	    className: classnames({
	      'focus-visible-ring': !unstyled
	    }, classes),
	    rel: "noopener noreferrer",
	    ref: downcastRef$1(elementRef),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$g,
	    lineNumber: 24,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$f = "/home/runner/work/frontend-shared/frontend-shared/src/components/navigation/Link.js";

	const LinkNext = function Link({
	  children,
	  classes,
	  elementRef,
	  underline = 'none',
	  color = 'brand',
	  ...htmlAttributes
	}) {
	  return o(LinkBaseNext, { ...htmlAttributes,
	    classes: classnames('rounded-sm', // NB: Base classes are applied by LinkBase
	    {
	      // color
	      'text-brand hover:text-brand-dark': color === 'brand',
	      // default
	      'text-color-text-light hover:text-brand': color === 'text-light',
	      'text-color-text hover:text-brand-dark': color === 'text'
	    }, {
	      // underline
	      'no-underline hover:no-underline': underline === 'none',
	      // default
	      'underline hover:underline': underline === 'always',
	      'no-underline hover:underline': underline === 'hover'
	    }, classes),
	    elementRef: downcastRef$1(elementRef),
	    "data-component": "Link",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$f,
	    lineNumber: 32,
	    columnNumber: 5
	  }, this);
	};

	var _jsxFileName$e = "/home/runner/work/frontend-shared/frontend-shared/src/components/navigation/LinkButton.js";

	const LinkButtonNext = function LinkButton({
	  children,
	  classes,
	  elementRef,
	  color = 'brand',
	  inline = false,
	  underline = 'none',
	  variant = 'secondary',
	  ...htmlAttributes
	}) {
	  return o(ButtonBaseNext, { ...htmlAttributes,
	    elementRef: downcastRef$1(elementRef),
	    classes: classnames('focus-visible-ring transition-colors whitespace-nowrap', 'aria-pressed:font-semibold aria-expanded:font-semibold rounded-sm', {
	      // inline
	      inline: inline,
	      'flex items-center': !inline
	    }, {
	      // color
	      'text-brand enabled:hover:text-brand-dark': color === 'brand',
	      // default
	      'text-color-text enabled:hover:text-brand-dark': color === 'text',
	      'text-color-text-light enabled:hover:text-brand': color === 'text-light'
	    }, {
	      // underline
	      'no-underline hover:no-underline': underline === 'none',
	      // default
	      'underline enabled:hover:underline': underline === 'always',
	      'no-underline enabled:hover:underline': underline === 'hover'
	    }, {
	      // variant
	      // no exta styling for default 'secondary' variant
	      'font-semibold': variant === 'primary'
	    }, classes),
	    "data-component": "LinkButton",
	    unstyled: true,
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$e,
	    lineNumber: 37,
	    columnNumber: 5
	  }, this);
	};

	// Hooks

	var _jsxFileName$d = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/AdderToolbar.tsx";
	function NumberIcon({
	  badgeCount
	}) {
	  return o("span", {
	    className: classnames('rounded px-1 py-0.5',
	    // The background color is inherited from the current text color in
	    // the containing button and will vary depending on hover state.
	    'bg-current'),
	    children: o("span", {
	      className: "font-bold text-color-text-inverted",
	      children: badgeCount
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 28,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$d,
	    lineNumber: 20,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * Render an arrow pointing up or down from the AdderToolbar. This arrow
	 * should point roughly to the end of the user selection in the document.
	 */
	function AdderToolbarArrow({
	  arrowDirection
	}) {
	  return o("div", {
	    className: classnames(
	    // Position horizontally center of the AdderToolbar
	    'absolute left-1/2 -translate-x-1/2 z-2', 'fill-white text-grey-3', {
	      // Move the pointer to the top of the AdderToolbar
	      'top-0 -translate-y-full': arrowDirection === 'up'
	    }),
	    children: arrowDirection === 'up' ? o(PointerUpIcon, {}, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 54,
	      columnNumber: 34
	    }, this) : o(PointerDownIcon, {}, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 54,
	      columnNumber: 54
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$d,
	    lineNumber: 43,
	    columnNumber: 5
	  }, this);
	}
	function ToolbarButton$1({
	  badgeCount,
	  icon: Icon,
	  label,
	  onClick,
	  shortcut
	}) {
	  useShortcut(shortcut, onClick);
	  const title = shortcut ? `${label} (${shortcut})` : label;
	  return o(ButtonBaseNext, {
	    classes: classnames('flex-col gap-y-1 py-2.5 px-2', 'text-annotator-sm leading-none',
	    // Default color when the toolbar is not hovered
	    'text-grey-7',
	    // When the parent .group element is hovered (but this element itself is
	    // not), dim this button's text. This has the effect of dimming inactive
	    // buttons.
	    'group-hover:text-grey-5',
	    // When the parent .group element is hovered AND this element is
	    // hovered, this is the "active" button. Intensify the text color, which
	    // will also darken any descendant Icon
	    'hover:group-hover:text-grey-9'),
	    onClick: onClick,
	    title: title,
	    children: [Icon && o(Icon, {
	      className: "text-annotator-lg",
	      title: title
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 97,
	      columnNumber: 16
	    }, this), typeof badgeCount === 'number' && o(NumberIcon, {
	      badgeCount: badgeCount
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 98,
	      columnNumber: 42
	    }, this), o("span", {
	      children: label
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 99,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$d,
	    lineNumber: 79,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * Render non-visible content for screen readers to announce adder keyboard
	 * shortcuts and count of annotations associated with the current selection.
	 */
	function AdderToolbarShortcuts({
	  annotationCount,
	  isVisible
	}) {
	  return o("div", {
	    className: "sr-only",
	    children: [o("span", {
	      "aria-live": "polite",
	      "aria-atomic": "true",
	      role: "status",
	      "data-testid": "annotation-count-announce",
	      children: annotationCount > 0 && o("span", {
	        children: [annotationCount, ' ', annotationCount === 1 ? 'annotation' : 'annotations', " for this selection."]
	      }, void 0, true, {
	        fileName: _jsxFileName$d,
	        lineNumber: 124,
	        columnNumber: 11
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 117,
	      columnNumber: 7
	    }, this), o("ul", {
	      "aria-live": "polite",
	      "data-testid": "annotate-shortcuts-announce",
	      children: isVisible && o(p$2, {
	        children: [annotationCount > 0 && o("li", {
	          children: ["Press ", "'S'", " to show annotations."]
	        }, void 0, true, {
	          fileName: _jsxFileName$d,
	          lineNumber: 134,
	          columnNumber: 37
	        }, this), o("li", {
	          children: ["Press ", "'A'", " to annotate."]
	        }, void 0, true, {
	          fileName: _jsxFileName$d,
	          lineNumber: 135,
	          columnNumber: 13
	        }, this), o("li", {
	          children: ["Press ", "'H'", " to highlight."]
	        }, void 0, true, {
	          fileName: _jsxFileName$d,
	          lineNumber: 136,
	          columnNumber: 13
	        }, this)]
	      }, void 0, true)
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 131,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$d,
	    lineNumber: 116,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * The toolbar that is displayed above or below selected text in the document,
	 * providing options to create annotations or highlights.
	 *
	 * @param {AdderToolbarProps} props
	 * The toolbar has nuanced styling for hover. The component structure is:
	 *
	 * <AdderToolbar>
	 *   <div.group>
	 *     <button.hover-group><AnnotateIcon />Annotate</button>
	 *     <button.hover-group><HighlightIcon />Highlight</button>
	 *     <div>[vertical separator]</div>
	 *     <button.hover-group><span><NumberIcon /></span>[count]</button>
	 *   </div.group>
	 *   <AdderToolbarArrow />
	 * </AdderToolbar>
	 *
	 * Behavior: When div.group is hovered, all descendant buttons and their
	 * contents dim, except for the contents of the button that is directly hovered,
	 * which are darkened. This is intended to make the hovered button stand out,
	 * and the non-hovered buttons recede.
	 *
	 * This is achieved by:
	 * - Setting the .group class on the div that contains the buttons. This allows
	 *   buttons to style themselves based on the combination of the div.group's
	 *   hover state and their own "local" hover state. `group` is available in
	 *   Tailwind out of the box; see
	 *   https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-parent-state
	 * - The challenge is in getting the "badge" in NumberIcon to dim and darken its
	 *   background appropriately. `hover-group-hover` is a custom tailwind variant
	 *   that allows NumberIcon to style itself based on the hover states of
	 *   both div.group AND its parent button.hover-group. We need to ensure this
	 *   badge will darken when its parent button is hovered, even if it is not
	 *   hovered directly.
	 *
	 */
	function AdderToolbar({
	  arrowDirection,
	  isVisible,
	  onCommand,
	  annotationCount = 0
	}) {
	  // Since the selection toolbar is only shown when there is a selection
	  // of static text, we can use a plain key without any modifier as
	  // the shortcut. This avoids conflicts with browser/OS shortcuts.
	  const annotateShortcut = isVisible ? 'a' : null;
	  const highlightShortcut = isVisible ? 'h' : null;
	  const showShortcut = isVisible ? 's' : null;
	  const hideShortcut = isVisible ? 'Escape' : null;

	  // Add a shortcut to close the adder. Note, there is no button associated with this
	  // shortcut because any outside click will also hide the adder.
	  useShortcut(hideShortcut, () => onCommand('hide'));

	  // nb. The adder is hidden using the `visibility` property rather than `display`
	  // so that we can compute its size in order to position it before display.
	  return o("div", {
	    className: classnames(
	    // Reset all inherited properties to their initial values. This prevents
	    // CSS property values from the host page being inherited by elements of
	    // the Adder, even when using Shadow DOM.
	    'all-initial',
	    // As we've reset all properties to initial values, we cannot rely on
	    // default border values from Tailwind and have to be explicit about all
	    // border attributes.
	    'border border-solid border-grey-3', 'absolute select-none bg-white rounded shadow-adder-toolbar',
	    // Start at a very low opacity as we're going to fade in in the animation
	    'opacity-5', {
	      'animate-adder-pop-up': arrowDirection === 'up' && isVisible,
	      'animate-adder-pop-down': arrowDirection === 'down' && isVisible
	    }),
	    "data-component": "AdderToolbar",
	    dir: "ltr",
	    style: {
	      visibility: isVisible ? 'visible' : 'hidden'
	    },
	    children: [o("div", {
	      className: classnames(
	      // This group is used to manage hover state styling for descendant
	      // buttons
	      'flex group'),
	      children: [o(ToolbarButton$1, {
	        icon: AnnotateIcon,
	        onClick: () => onCommand('annotate'),
	        label: "Annotate",
	        shortcut: annotateShortcut
	      }, void 0, false, {
	        fileName: _jsxFileName$d,
	        lineNumber: 253,
	        columnNumber: 9
	      }, this), o(ToolbarButton$1, {
	        icon: HighlightIcon,
	        onClick: () => onCommand('highlight'),
	        label: "Highlight",
	        shortcut: highlightShortcut
	      }, void 0, false, {
	        fileName: _jsxFileName$d,
	        lineNumber: 259,
	        columnNumber: 9
	      }, this), annotationCount > 0 && o(p$2, {
	        children: [o("div", {
	          className: classnames(
	          // Style a vertical separator line
	          'm-1.5 border-r border-grey-4 border-solid')
	        }, void 0, false, {
	          fileName: _jsxFileName$d,
	          lineNumber: 267,
	          columnNumber: 13
	        }, this), o(ToolbarButton$1, {
	          badgeCount: annotationCount,
	          onClick: () => onCommand('show'),
	          label: "Show",
	          shortcut: showShortcut
	        }, void 0, false, {
	          fileName: _jsxFileName$d,
	          lineNumber: 273,
	          columnNumber: 13
	        }, this)]
	      }, void 0, true)]
	    }, void 0, true, {
	      fileName: _jsxFileName$d,
	      lineNumber: 246,
	      columnNumber: 7
	    }, this), o(AdderToolbarArrow, {
	      arrowDirection: arrowDirection
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 282,
	      columnNumber: 7
	    }, this), o(AdderToolbarShortcuts, {
	      annotationCount: annotationCount,
	      isVisible: isVisible
	    }, void 0, false, {
	      fileName: _jsxFileName$d,
	      lineNumber: 283,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$d,
	    lineNumber: 222,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * Helper methods to identify browser versions and os types
	 */

	/**
	 * Returns true when the OS is Mac OS.
	 *
	 * @param _userAgent {string} - Test seam
	 */
	const isMacOS = (_userAgent = window.navigator.userAgent) => {
	  return _userAgent.indexOf('Mac OS') >= 0;
	};

	/**
	 * Returns true when device is iOS.
	 * https://stackoverflow.com/a/9039885/14463679
	 *
	 * @param _navigator {{platform: string, userAgent: string}}
	 * @param _ontouchend {boolean}
	 */
	const isIOS = (_navigator = window.navigator, _ontouchend = 'ontouchend' in document) => {
	  return ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(_navigator.platform) ||
	  // iPad on iOS 13 detection
	  _navigator.userAgent.includes('Mac') && _ontouchend;
	};

	/**
	 * Returns true when the device is a touch device such
	 * as android or iOS.
	 * https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer#browser_compatibility
	 *
	 * @param _window {Window} - Test seam
	 */
	const isTouchDevice = (_window = window) => {
	  return _window.matchMedia('(pointer: coarse)').matches;
	};

	/**
	 * Load stylesheets for annotator UI components into the shadow DOM root.
	 *
	 * @param {ShadowRoot} shadowRoot
	 */
	function loadStyles(shadowRoot) {
	  var _document$querySelect;
	  // Find the preloaded stylesheet added by the boot script.
	  const url = /** @type {HTMLLinkElement|undefined} */(_document$querySelect = document.querySelector('link[rel="preload"][href*="/build/styles/annotator.css"]')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.href;
	  if (!url) {
	    return;
	  }
	  const linkEl = document.createElement('link');
	  linkEl.rel = 'stylesheet';
	  linkEl.href = url;
	  shadowRoot.appendChild(linkEl);
	}

	/**
	 * Create the shadow root for an annotator UI component and load the annotator
	 * CSS styles into it.
	 *
	 * @param {HTMLElement} container - Container element to render the UI into
	 * @return {ShadowRoot}
	 */
	function createShadowRoot(container) {
	  const shadowRoot = container.attachShadow({
	    mode: 'open'
	  });
	  loadStyles(shadowRoot);

	  // @ts-ignore The window doesn't know about the polyfill
	  // applyFocusVisiblePolyfill comes from the `focus-visible` package.
	  const applyFocusVisible = window.applyFocusVisiblePolyfill;
	  if (applyFocusVisible) {
	    applyFocusVisible(shadowRoot);
	  }
	  stopEventPropagation(shadowRoot);
	  return shadowRoot;
	}

	/**
	 * Stop bubbling up of several events.
	 *
	 * This makes the host page a little bit less aware of the annotator activity.
	 * It is still possible for the host page to manipulate the events on the capturing
	 * face.
	 *
	 * Another benefit is that click and touchstart typically causes the sidebar to close.
	 * By preventing the bubble up of these events, we don't have to individually stop
	 * the propagation.
	 *
	 * @param {HTMLElement|ShadowRoot} element
	 */
	function stopEventPropagation(element) {
	  element.addEventListener('mouseup', event => event.stopPropagation());
	  element.addEventListener('mousedown', event => event.stopPropagation());
	  element.addEventListener('touchstart', event => event.stopPropagation(), {
	    passive: true
	  });
	}

	var _jsxFileName$c = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/adder.js";
	const ARROW_POINTING_DOWN = 1;

	/**
	 *  @typedef {2} ArrowPointingUp
	 * Show the adder above the selection with an arrow pointing up at the
	 * selected text.
	 */
	const ARROW_POINTING_UP = 2;

	/**
	 *  @typedef {ArrowPointingDown|ArrowPointingUp} ArrowDirection
	 * Show the adder above the selection with an arrow pointing up at the
	 * selected text.
	 */

	/**
	 * @typedef Target
	 * @prop {number} left - Offset from left edge of viewport.
	 * @prop {number} top - Offset from top edge of viewport.
	 * @prop {ArrowDirection} arrowDirection - Direction of the adder's arrow.
	 */

	/** @param {number} pixels */
	function toPx(pixels) {
	  return pixels.toString() + 'px';
	}
	const ARROW_HEIGHT = 10;

	// The preferred gap between the end of the text selection and the adder's
	// arrow position.
	const ARROW_H_MARGIN = 20;

	/**
	 * Return the closest ancestor of `el` which has been positioned.
	 *
	 * If no ancestor has been positioned, returns the root element.
	 *
	 * @param {Element} el
	 * @return {Element}
	 */
	function nearestPositionedAncestor(el) {
	  let parentEl = /** @type {Element} */el.parentElement;
	  while (parentEl.parentElement) {
	    if (getComputedStyle(parentEl).position !== 'static') {
	      break;
	    }
	    parentEl = parentEl.parentElement;
	  }
	  return parentEl;
	}

	/**
	 * @typedef AdderOptions
	 * @prop {() => void} onAnnotate - Callback invoked when "Annotate" button is clicked
	 * @prop {() => void} onHighlight - Callback invoked when "Highlight" button is clicked
	 * @prop {(tags: string[]) => void} onShowAnnotations -
	 *   Callback invoked when  "Show" button is clicked
	 *
	 * @typedef {import('../types/annotator').Destroyable} Destroyable
	 */

	/**
	 * Container for the 'adder' toolbar which provides controls for the user to
	 * annotate and highlight the selected text.
	 *
	 * The toolbar implementation is split between this class, which is
	 * the container for the toolbar that positions it on the page and isolates
	 * it from the page's styles using shadow DOM, and the `AdderToolbar` Preact
	 * component which actually renders the toolbar.
	 *
	 * @implements {Destroyable}
	 */
	class Adder {
	  /**
	   * Create the toolbar's container and hide it.
	   *
	   * The adder is initially hidden.
	   *
	   * @param {HTMLElement} element - The DOM element into which the adder will be created
	   * @param {AdderOptions} options - Options object specifying `onAnnotate` and `onHighlight`
	   *        event handlers.
	   */
	  constructor(element, options) {
	    this._outerContainer = document.createElement('hypothesis-adder');
	    element.appendChild(this._outerContainer);
	    this._shadowRoot = createShadowRoot(this._outerContainer);

	    // Set initial style
	    Object.assign(this._outerContainer.style, {
	      // take position out of layout flow initially
	      position: 'absolute',
	      top: 0,
	      left: 0
	    });
	    this._view = /** @type {Window} */element.ownerDocument.defaultView;
	    this._width = () => {
	      const firstChild = /** @type {Element} */this._shadowRoot.firstChild;
	      return firstChild.getBoundingClientRect().width;
	    };
	    this._height = () => {
	      const firstChild = /** @type {Element} */this._shadowRoot.firstChild;
	      return firstChild.getBoundingClientRect().height;
	    };
	    this._isVisible = false;

	    /** @type {'up'|'down'} */
	    this._arrowDirection = 'up';
	    this._onAnnotate = options.onAnnotate;
	    this._onHighlight = options.onHighlight;
	    this._onShowAnnotations = options.onShowAnnotations;

	    /**
	     * Annotation tags associated with the current selection.
	     *
	     * @type {string[]}
	     */
	    this._annotationsForSelection = [];
	    this._render();
	  }
	  get annotationsForSelection() {
	    return this._annotationsForSelection;
	  }

	  /**
	   * Set the annotation IDs associated with the current selection.
	   *
	   * Setting this to a non-empty list causes the "Show" button to appear in
	   * the toolbar. Clicking the "Show" button  triggers the `onShowAnnotations`
	   * callback passed to the constructor.
	   */
	  set annotationsForSelection(ids) {
	    this._annotationsForSelection = ids;
	    this._render();
	  }

	  /** Hide the adder */
	  hide() {
	    this._isVisible = false;
	    this._render();
	    // Reposition the outerContainer because it affects the responsiveness of host page
	    // https://github.com/hypothesis/client/issues/3193
	    Object.assign(this._outerContainer.style, {
	      top: 0,
	      left: 0
	    });
	  }
	  destroy() {
	    P$1(null, this._shadowRoot); // First, unload the Preact component
	    this._outerContainer.remove();
	  }

	  /**
	   * Display the adder in the best position in order to target the
	   * selected text in `selectionRect`.
	   *
	   * @param {DOMRect} selectionRect - The rect of text to target, in viewport
	   *        coordinates.
	   * @param {boolean} isRTLselection - True if the selection was made
	   *        rigth-to-left, such that the focus point is mosty likely at the
	   *        top-left edge of `targetRect`.
	   */
	  show(selectionRect, isRTLselection) {
	    const {
	      left,
	      top,
	      arrowDirection
	    } = this._calculateTarget(selectionRect, isRTLselection);
	    this._showAt(left, top);
	    this._isVisible = true;
	    this._arrowDirection = arrowDirection === ARROW_POINTING_UP ? 'up' : 'down';
	    this._render();
	  }

	  /**
	   *  Determine the best position for the Adder and its pointer-arrow.
	   * - Position the pointer-arrow near the end of the selection (where the user's
	   *   cursor/input is most likely to be)
	   * - Position the Adder to center horizontally on the pointer-arrow
	   * - Position the Adder below the selection (arrow pointing up) for LTR selections
	   *   and above (arrow down) for RTL selections
	   *
	   * @param {DOMRect} selectionRect - The rect of text to target, in viewport
	   *        coordinates.
	   * @param {boolean} isRTLselection - True if the selection was made
	   *        rigth-to-left, such that the focus point is mosty likely at the
	   *        top-left edge of `targetRect`.
	   * @return {Target}
	   */
	  _calculateTarget(selectionRect, isRTLselection) {
	    // Set the initial arrow direction based on whether the selection was made
	    // forwards/upwards or downwards/backwards.
	    /** @type {ArrowDirection} */
	    let arrowDirection;
	    if (isRTLselection && !isTouchDevice()) {
	      arrowDirection = ARROW_POINTING_DOWN;
	    } else {
	      // Render the adder below the selection for touch devices due to competing
	      // space with the native copy/paste bar that typical (not always) renders above
	      // the selection.
	      arrowDirection = ARROW_POINTING_UP;
	    }
	    let top;
	    let left;

	    // Position the adder such that the arrow it is above or below the selection
	    // and close to the end.
	    const hMargin = Math.min(ARROW_H_MARGIN, selectionRect.width);
	    const adderWidth = this._width();
	    // Render the adder a little lower on touch devices to provide room for the native
	    // selection handles so that the interactions with selection don't compete with the adder.
	    const touchScreenOffset = isTouchDevice() ? 10 : 0;
	    const adderHeight = this._height();
	    if (isRTLselection) {
	      left = selectionRect.left - adderWidth / 2 + hMargin;
	    } else {
	      left = selectionRect.left + selectionRect.width - adderWidth / 2 - hMargin;
	    }

	    // Flip arrow direction if adder would appear above the top or below the
	    // bottom of the viewport.
	    if (selectionRect.top - adderHeight < 0 && arrowDirection === ARROW_POINTING_DOWN) {
	      arrowDirection = ARROW_POINTING_UP;
	    } else if (selectionRect.top + adderHeight > this._view.innerHeight) {
	      arrowDirection = ARROW_POINTING_DOWN;
	    }
	    if (arrowDirection === ARROW_POINTING_UP) {
	      top = selectionRect.top + selectionRect.height + ARROW_HEIGHT + touchScreenOffset;
	    } else {
	      top = selectionRect.top - adderHeight - ARROW_HEIGHT;
	    }

	    // Constrain the adder to the viewport.
	    left = Math.max(left, 0);
	    left = Math.min(left, this._view.innerWidth - adderWidth);
	    top = Math.max(top, 0);
	    top = Math.min(top, this._view.innerHeight - adderHeight);
	    return {
	      top,
	      left,
	      arrowDirection
	    };
	  }

	  /**
	   * Find a Z index value that will cause the adder to appear on top of any
	   * content in the document when the adder is shown at (left, top).
	   *
	   * @param {number} left - Horizontal offset from left edge of viewport.
	   * @param {number} top - Vertical offset from top edge of viewport.
	   * @return {number} - greatest zIndex (default value of 1)
	   */
	  _findZindex(left, top) {
	    if (document.elementsFromPoint === undefined) {
	      // In case of not being able to use `document.elementsFromPoint`,
	      // default to the large arbitrary number (2^15)
	      return 32768;
	    }
	    const adderWidth = this._width();
	    const adderHeight = this._height();

	    // Find the Z index of all the elements in the screen for five positions
	    // around the adder (left-top, left-bottom, middle-center, right-top,
	    // right-bottom) and use the greatest.

	    // Unique elements so `getComputedStyle` is called the minimum amount of times.
	    const elements = new Set([...document.elementsFromPoint(left, top), ...document.elementsFromPoint(left, top + adderHeight), ...document.elementsFromPoint(left + adderWidth / 2, top + adderHeight / 2), ...document.elementsFromPoint(left + adderWidth, top), ...document.elementsFromPoint(left + adderWidth, top + adderHeight)]);
	    const zIndexes = [...elements].map(element => +getComputedStyle(element).zIndex).filter(Number.isInteger);

	    // Make sure the array contains at least one element,
	    // otherwise `Math.max(...[])` results in +Infinity
	    zIndexes.push(0);
	    return Math.max(...zIndexes) + 1;
	  }

	  /**
	   * Show the adder at the given position and with the arrow pointing in
	   * `arrowDirection`.
	   *
	   * @param {number} left - Horizontal offset from left edge of viewport.
	   * @param {number} top - Vertical offset from top edge of viewport.
	   */
	  _showAt(left, top) {
	    // Translate the (left, top) viewport coordinates into positions relative to
	    // the adder's nearest positioned ancestor (NPA).
	    //
	    // Typically the adder is a child of the `<body>` and the NPA is the root
	    // `<html>` element. However page styling may make the `<body>` positioned.
	    // See https://github.com/hypothesis/client/issues/487.
	    const positionedAncestor = nearestPositionedAncestor(this._outerContainer);
	    const parentRect = positionedAncestor.getBoundingClientRect();
	    const zIndex = this._findZindex(left, top);
	    Object.assign(this._outerContainer.style, {
	      left: toPx(left - parentRect.left),
	      top: toPx(top - parentRect.top),
	      zIndex
	    });
	  }
	  _render() {
	    /** @param {import('./components/AdderToolbar').Command} command */
	    const handleCommand = command => {
	      switch (command) {
	        case 'annotate':
	          this._onAnnotate();
	          this.hide();
	          break;
	        case 'highlight':
	          this._onHighlight();
	          this.hide();
	          break;
	        case 'show':
	          this._onShowAnnotations(this.annotationsForSelection);
	          break;
	        case 'hide':
	          this.hide();
	          break;
	        default:
	          break;
	      }
	    };
	    P$1(o(AdderToolbar, {
	      isVisible: this._isVisible,
	      arrowDirection: this._arrowDirection,
	      onCommand: handleCommand,
	      annotationCount: this.annotationsForSelection.length
	    }, void 0, false, {
	      fileName: _jsxFileName$c,
	      lineNumber: 366,
	      columnNumber: 7
	    }, this), this._shadowRoot);
	  }
	}

	/**
	 * Return the combined length of text nodes contained in `node`.
	 *
	 * @param {Node} node
	 */
	function nodeTextLength(node) {
	  switch (node.nodeType) {
	    case Node.ELEMENT_NODE:
	    case Node.TEXT_NODE:
	      // nb. `textContent` excludes text in comments and processing instructions
	      // when called on a parent element, so we don't need to subtract that here.

	      return (/** @type {string} */node.textContent.length
	      );
	    default:
	      return 0;
	  }
	}

	/**
	 * Return the total length of the text of all previous siblings of `node`.
	 *
	 * @param {Node} node
	 */
	function previousSiblingsTextLength(node) {
	  let sibling = node.previousSibling;
	  let length = 0;
	  while (sibling) {
	    length += nodeTextLength(sibling);
	    sibling = sibling.previousSibling;
	  }
	  return length;
	}

	/**
	 * Resolve one or more character offsets within an element to (text node, position)
	 * pairs.
	 *
	 * @param {Element} element
	 * @param {number[]} offsets - Offsets, which must be sorted in ascending order
	 * @return {{ node: Text, offset: number }[]}
	 */
	function resolveOffsets(element, ...offsets) {
	  let nextOffset = offsets.shift();
	  const nodeIter = /** @type {Document} */element.ownerDocument.createNodeIterator(element, NodeFilter.SHOW_TEXT);
	  const results = [];
	  let currentNode = nodeIter.nextNode();
	  let textNode;
	  let length = 0;

	  // Find the text node containing the `nextOffset`th character from the start
	  // of `element`.
	  while (nextOffset !== undefined && currentNode) {
	    textNode = /** @type {Text} */currentNode;
	    if (length + textNode.data.length > nextOffset) {
	      results.push({
	        node: textNode,
	        offset: nextOffset - length
	      });
	      nextOffset = offsets.shift();
	    } else {
	      currentNode = nodeIter.nextNode();
	      length += textNode.data.length;
	    }
	  }

	  // Boundary case.
	  while (nextOffset !== undefined && textNode && length === nextOffset) {
	    results.push({
	      node: textNode,
	      offset: textNode.data.length
	    });
	    nextOffset = offsets.shift();
	  }
	  if (nextOffset !== undefined) {
	    throw new RangeError('Offset exceeds text length');
	  }
	  return results;
	}
	let RESOLVE_FORWARDS = 1;
	let RESOLVE_BACKWARDS = 2;

	/**
	 * Represents an offset within the text content of an element.
	 *
	 * This position can be resolved to a specific descendant node in the current
	 * DOM subtree of the element using the `resolve` method.
	 */
	class TextPosition {
	  /**
	   * Construct a `TextPosition` that refers to the text position `offset` within
	   * the text content of `element`.
	   *
	   * @param {Element} element
	   * @param {number} offset
	   */
	  constructor(element, offset) {
	    if (offset < 0) {
	      throw new Error('Offset is invalid');
	    }

	    /** Element that `offset` is relative to. */
	    this.element = element;

	    /** Character offset from the start of the element's `textContent`. */
	    this.offset = offset;
	  }

	  /**
	   * Return a copy of this position with offset relative to a given ancestor
	   * element.
	   *
	   * @param {Element} parent - Ancestor of `this.element`
	   * @return {TextPosition}
	   */
	  relativeTo(parent) {
	    if (!parent.contains(this.element)) {
	      throw new Error('Parent is not an ancestor of current element');
	    }
	    let el = this.element;
	    let offset = this.offset;
	    while (el !== parent) {
	      offset += previousSiblingsTextLength(el);
	      el = /** @type {Element} */el.parentElement;
	    }
	    return new TextPosition(el, offset);
	  }

	  /**
	   * Resolve the position to a specific text node and offset within that node.
	   *
	   * Throws if `this.offset` exceeds the length of the element's text. In the
	   * case where the element has no text and `this.offset` is 0, the `direction`
	   * option determines what happens.
	   *
	   * Offsets at the boundary between two nodes are resolved to the start of the
	   * node that begins at the boundary.
	   *
	   * @param {object} [options]
	   *   @param {RESOLVE_FORWARDS|RESOLVE_BACKWARDS} [options.direction] -
	   *     Specifies in which direction to search for the nearest text node if
	   *     `this.offset` is `0` and `this.element` has no text. If not specified
	   *     an error is thrown.
	   * @return {{ node: Text, offset: number }}
	   * @throws {RangeError}
	   */
	  resolve(options = {}) {
	    try {
	      return resolveOffsets(this.element, this.offset)[0];
	    } catch (err) {
	      if (this.offset === 0 && options.direction !== undefined) {
	        const tw = document.createTreeWalker(this.element.getRootNode(), NodeFilter.SHOW_TEXT);
	        tw.currentNode = this.element;
	        const forwards = options.direction === RESOLVE_FORWARDS;
	        const text = /** @type {Text|null} */
	        forwards ? tw.nextNode() : tw.previousNode();
	        if (!text) {
	          throw err;
	        }
	        return {
	          node: text,
	          offset: forwards ? 0 : text.data.length
	        };
	      } else {
	        throw err;
	      }
	    }
	  }

	  /**
	   * Construct a `TextPosition` that refers to the `offset`th character within
	   * `node`.
	   *
	   * @param {Node} node
	   * @param {number} offset
	   * @return {TextPosition}
	   */
	  static fromCharOffset(node, offset) {
	    switch (node.nodeType) {
	      case Node.TEXT_NODE:
	        return TextPosition.fromPoint(node, offset);
	      case Node.ELEMENT_NODE:
	        return new TextPosition( /** @type {Element} */node, offset);
	      default:
	        throw new Error('Node is not an element or text node');
	    }
	  }

	  /**
	   * Construct a `TextPosition` representing the range start or end point (node, offset).
	   *
	   * @param {Node} node - Text or Element node
	   * @param {number} offset - Offset within the node.
	   * @return {TextPosition}
	   */
	  static fromPoint(node, offset) {
	    switch (node.nodeType) {
	      case Node.TEXT_NODE:
	        {
	          if (offset < 0 || offset > /** @type {Text} */node.data.length) {
	            throw new Error('Text node offset is out of range');
	          }
	          if (!node.parentElement) {
	            throw new Error('Text node has no parent');
	          }

	          // Get the offset from the start of the parent element.
	          const textOffset = previousSiblingsTextLength(node) + offset;
	          return new TextPosition(node.parentElement, textOffset);
	        }
	      case Node.ELEMENT_NODE:
	        {
	          if (offset < 0 || offset > node.childNodes.length) {
	            throw new Error('Child node offset is out of range');
	          }

	          // Get the text length before the `offset`th child of element.
	          let textOffset = 0;
	          for (let i = 0; i < offset; i++) {
	            textOffset += nodeTextLength(node.childNodes[i]);
	          }
	          return new TextPosition( /** @type {Element} */node, textOffset);
	        }
	      default:
	        throw new Error('Point is not in an element or text node');
	    }
	  }
	}

	/**
	 * Represents a region of a document as a (start, end) pair of `TextPosition` points.
	 *
	 * Representing a range in this way allows for changes in the DOM content of the
	 * range which don't affect its text content, without affecting the text content
	 * of the range itself.
	 */
	class TextRange {
	  /**
	   * Construct an immutable `TextRange` from a `start` and `end` point.
	   *
	   * @param {TextPosition} start
	   * @param {TextPosition} end
	   */
	  constructor(start, end) {
	    this.start = start;
	    this.end = end;
	  }

	  /**
	   * Return a copy of this range with start and end positions relative to a
	   * given ancestor. See `TextPosition.relativeTo`.
	   *
	   * @param {Element} element
	   */
	  relativeTo(element) {
	    return new TextRange(this.start.relativeTo(element), this.end.relativeTo(element));
	  }

	  /**
	   * Resolve the `TextRange` to a DOM range.
	   *
	   * The resulting DOM Range will always start and end in a `Text` node.
	   * Hence `TextRange.fromRange(range).toRange()` can be used to "shrink" a
	   * range to the text it contains.
	   *
	   * May throw if the `start` or `end` positions cannot be resolved to a range.
	   *
	   * @return {Range}
	   */
	  toRange() {
	    let start;
	    let end;
	    if (this.start.element === this.end.element && this.start.offset <= this.end.offset) {
	      // Fast path for start and end points in same element.
	      [start, end] = resolveOffsets(this.start.element, this.start.offset, this.end.offset);
	    } else {
	      start = this.start.resolve({
	        direction: RESOLVE_FORWARDS
	      });
	      end = this.end.resolve({
	        direction: RESOLVE_BACKWARDS
	      });
	    }
	    const range = new Range();
	    range.setStart(start.node, start.offset);
	    range.setEnd(end.node, end.offset);
	    return range;
	  }

	  /**
	   * Convert an existing DOM `Range` to a `TextRange`
	   *
	   * @param {Range} range
	   * @return {TextRange}
	   */
	  static fromRange(range) {
	    const start = TextPosition.fromPoint(range.startContainer, range.startOffset);
	    const end = TextPosition.fromPoint(range.endContainer, range.endOffset);
	    return new TextRange(start, end);
	  }

	  /**
	   * Return a `TextRange` from the `start`th to `end`th characters in `root`.
	   *
	   * @param {Element} root
	   * @param {number} start
	   * @param {number} end
	   */
	  static fromOffsets(root, start, end) {
	    return new TextRange(new TextPosition(root, start), new TextPosition(root, end));
	  }
	}

	/**
	 * CSS selector that will match the placeholder within a page/tile container.
	 */
	const placeholderSelector = '.annotator-placeholder';

	/**
	 * Create or return a placeholder element for anchoring.
	 *
	 * In document viewers such as PDF.js which only render a subset of long
	 * documents at a time, it may not be possible to anchor annotations to the
	 * actual text in pages which are off-screen. For these non-rendered pages,
	 * a "placeholder" element is created in the approximate X/Y location (eg.
	 * middle of the page) where the content will appear. Any highlights for that
	 * page are then rendered inside the placeholder.
	 *
	 * When the viewport is scrolled to the non-rendered page, the placeholder
	 * is removed and annotations are re-anchored to the real content.
	 *
	 * @param {HTMLElement} container - The container element for the page or tile
	 *   which is not rendered.
	 */
	function createPlaceholder(container) {
	  let placeholder = container.querySelector(placeholderSelector);
	  if (placeholder) {
	    return placeholder;
	  }
	  placeholder = document.createElement('span');
	  placeholder.classList.add('annotator-placeholder');
	  placeholder.textContent = 'Loading annotations...';
	  container.appendChild(placeholder);
	  return placeholder;
	}

	/**
	 * Return true if a page/tile container has a placeholder.
	 *
	 * @param {HTMLElement} container
	 */
	function hasPlaceholder(container) {
	  return container.querySelector(placeholderSelector) !== null;
	}

	/**
	 * Remove the placeholder element in `container`, if present.
	 *
	 * @param {HTMLElement} container
	 */
	function removePlaceholder(container) {
	  var _container$querySelec;
	  (_container$querySelec = container.querySelector(placeholderSelector)) === null || _container$querySelec === void 0 ? void 0 : _container$querySelec.remove();
	}

	/**
	 * Return true if `node` is inside a placeholder element created with `createPlaceholder`.
	 *
	 * This is typically used to test if a highlight element associated with an
	 * anchor is inside a placeholder.
	 *
	 * @param {Node} node
	 */
	function isInPlaceholder(node) {
	  if (!node.parentElement) {
	    return false;
	  }
	  return node.parentElement.closest(placeholderSelector) !== null;
	}

	/**
	 * Returns true if the start point of a selection occurs after the end point,
	 * in document order.
	 *
	 * @param {Selection} selection
	 */
	function isSelectionBackwards(selection) {
	  if (selection.focusNode === selection.anchorNode) {
	    return selection.focusOffset < selection.anchorOffset;
	  }
	  const range = selection.getRangeAt(0);
	  // Does not work correctly on iOS when selecting nodes backwards.
	  // https://bugs.webkit.org/show_bug.cgi?id=220523
	  return range.startContainer === selection.focusNode;
	}

	/**
	 * Returns true if any part of `node` lies within `range`.
	 *
	 * @param {Range} range
	 * @param {Node} node
	 */
	function isNodeInRange(range, node) {
	  try {
	    var _node$nodeValue$lengt, _node$nodeValue;
	    const length = (_node$nodeValue$lengt = (_node$nodeValue = node.nodeValue) === null || _node$nodeValue === void 0 ? void 0 : _node$nodeValue.length) !== null && _node$nodeValue$lengt !== void 0 ? _node$nodeValue$lengt : node.childNodes.length;
	    return (
	      // Check start of node is before end of range.
	      range.comparePoint(node, 0) <= 0 &&
	      // Check end of node is after start of range.
	      range.comparePoint(node, length) >= 0
	    );
	  } catch (e) {
	    // `comparePoint` may fail if the `range` and `node` do not share a common
	    // ancestor or `node` is a doctype.
	    return false;
	  }
	}

	/**
	 * Iterate over all Node(s) which overlap `range` in document order and invoke
	 * `callback` for each of them.
	 *
	 * @param {Range} range
	 * @param {(n: Node) => void} callback
	 */
	function forEachNodeInRange(range, callback) {
	  const root = range.commonAncestorContainer;
	  const nodeIter = /** @type {Document} */root.ownerDocument.createNodeIterator(root, NodeFilter.SHOW_ALL);
	  let currentNode;
	  while (currentNode = nodeIter.nextNode()) {
	    if (isNodeInRange(range, currentNode)) {
	      callback(currentNode);
	    }
	  }
	}

	/**
	 * Returns the bounding rectangles of non-whitespace text nodes in `range`.
	 *
	 * @param {Range} range
	 * @return {Array<DOMRect>} Array of bounding rects in viewport coordinates.
	 */
	function getTextBoundingBoxes(range) {
	  const whitespaceOnly = /^\s*$/;
	  const textNodes = /** @type {Text[]} */[];
	  forEachNodeInRange(range, node => {
	    if (node.nodeType === Node.TEXT_NODE && ! /** @type {string} */node.textContent.match(whitespaceOnly)) {
	      textNodes.push( /** @type {Text} */node);
	    }
	  });

	  /** @type {DOMRect[]} */
	  let rects = [];
	  textNodes.forEach(node => {
	    const nodeRange = node.ownerDocument.createRange();
	    nodeRange.selectNodeContents(node);
	    if (node === range.startContainer) {
	      nodeRange.setStart(node, range.startOffset);
	    }
	    if (node === range.endContainer) {
	      nodeRange.setEnd(node, range.endOffset);
	    }
	    if (nodeRange.collapsed) {
	      // If the range ends at the start of this text node or starts at the end
	      // of this node then do not include it.
	      return;
	    }

	    // Measure the range and translate from viewport to document coordinates
	    const viewportRects = Array.from(nodeRange.getClientRects());
	    nodeRange.detach();
	    rects = rects.concat(viewportRects);
	  });
	  return rects;
	}

	/**
	 * Returns the rectangle, in viewport coordinates, for the line of text
	 * containing the focus point of a Selection.
	 *
	 * Returns null if the selection is empty.
	 *
	 * @param {Selection} selection
	 * @return {DOMRect|null}
	 */
	function selectionFocusRect(selection) {
	  if (selection.isCollapsed) {
	    return null;
	  }
	  const textBoxes = getTextBoundingBoxes(selection.getRangeAt(0));
	  if (textBoxes.length === 0) {
	    return null;
	  }
	  if (isSelectionBackwards(selection)) {
	    return textBoxes[0];
	  } else {
	    return textBoxes[textBoxes.length - 1];
	  }
	}

	/**
	 * Retrieve a set of items associated with nodes in a given range.
	 *
	 * An `item` can be any data that the caller wishes to compute from or associate
	 * with a node. Only unique items, as determined by `Object.is`, are returned.
	 *
	 * @template T
	 * @param {Range} range
	 * @param {(n: Node) => T} itemForNode - Callback returning the item for a given node
	 * @return {NonNullable<T>[]} items
	 */
	function itemsForRange(range, itemForNode) {
	  /** @type {Set<Node>} */
	  const checkedNodes = new Set();
	  /** @type {Set<NonNullable<T>>} */
	  const items = new Set();
	  forEachNodeInRange(range, node => {
	    /** @type {Node|null} */
	    let current = node;
	    while (current) {
	      if (checkedNodes.has(current)) {
	        break;
	      }
	      checkedNodes.add(current);
	      const item = /** @type {NonNullable<T>|null|undefined} */
	      itemForNode(current);
	      if (item !== null && item !== undefined) {
	        items.add(item);
	      }
	      current = current.parentNode;
	    }
	  });
	  return [...items];
	}

	const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	/**
	 * Return the canvas element underneath a highlight element in a PDF page's
	 * text layer.
	 *
	 * Returns `null` if the highlight is not above a PDF canvas.
	 */
	function getPDFCanvas(highlightEl) {
	  // This code assumes that PDF.js renders pages with a structure like:
	  //
	  // <div class="page">
	  //   <div class="canvasWrapper">
	  //     <canvas></canvas> <!-- The rendered PDF page -->
	  //   </div>
	  //   <div class="textLayer">
	  //      <!-- Transparent text layer with text spans used to enable text selection -->
	  //   </div>
	  // </div>
	  //
	  // It also assumes that the `highlightEl` element is somewhere under
	  // the `.textLayer` div.

	  const pageEl = highlightEl.closest('.page');
	  if (!pageEl) {
	    return null;
	  }
	  const canvasEl = pageEl.querySelector('.canvasWrapper > canvas');
	  if (!canvasEl) {
	    return null;
	  }
	  return canvasEl;
	}

	/**
	 * Draw highlights in an SVG layer overlaid on top of a PDF.js canvas.
	 *
	 * The created SVG elements are stored in the `svgHighlight` property of
	 * each `HighlightElement`.
	 *
	 * @param highlightEls -
	 *   An element that wraps the highlighted text in the transparent text layer
	 *   above the PDF.
	 * @param [cssClass] - CSS class(es) to add to the SVG highlight elements
	 */
	function drawHighlightsAbovePDFCanvas(highlightEls, cssClass) {
	  if (highlightEls.length === 0) {
	    return;
	  }

	  // Get the <canvas> for the PDF page containing the highlight. We assume all
	  // the highlights are on the same page.
	  const canvasEl = getPDFCanvas(highlightEls[0]);
	  if (!canvasEl || !canvasEl.parentElement) {
	    return;
	  }
	  let svgHighlightLayer = canvasEl.parentElement.querySelector('.hypothesis-highlight-layer');
	  if (!svgHighlightLayer) {
	    // Create SVG layer. This must be in the same stacking context as
	    // the canvas so that CSS `mix-blend-mode` can be used to control how SVG
	    // content blends with the canvas below.
	    svgHighlightLayer = document.createElementNS(SVG_NAMESPACE, 'svg');
	    svgHighlightLayer.setAttribute('class', 'hypothesis-highlight-layer');
	    canvasEl.parentElement.appendChild(svgHighlightLayer);

	    // Overlay SVG layer above canvas.
	    canvasEl.parentElement.style.position = 'relative';
	    const svgStyle = svgHighlightLayer.style;
	    svgStyle.position = 'absolute';
	    svgStyle.left = '0';
	    svgStyle.top = '0';
	    svgStyle.width = '100%';
	    svgStyle.height = '100%';

	    // Use multiply blending so that highlights drawn on top of text darken it
	    // rather than making it lighter. This improves contrast and thus readability
	    // of highlighted text, especially for overlapping highlights.
	    //
	    // This choice optimizes for the common case of dark text on a light background.
	    svgStyle.mixBlendMode = 'multiply';
	  }
	  const canvasRect = canvasEl.getBoundingClientRect();
	  const highlightRects = highlightEls.map(highlightEl => {
	    const highlightRect = highlightEl.getBoundingClientRect();

	    // Create SVG element for the current highlight element.
	    const rect = document.createElementNS(SVG_NAMESPACE, 'rect');
	    rect.setAttribute('x', (highlightRect.left - canvasRect.left).toString());
	    rect.setAttribute('y', (highlightRect.top - canvasRect.top).toString());
	    rect.setAttribute('width', highlightRect.width.toString());
	    rect.setAttribute('height', highlightRect.height.toString());
	    rect.setAttribute('class', classnames('hypothesis-svg-highlight', cssClass));

	    // Make the highlight in the text layer transparent.
	    highlightEl.classList.add('is-transparent');

	    // Associate SVG element with highlight for use by `removeHighlights`.
	    highlightEl.svgHighlight = rect;
	    return rect;
	  });
	  svgHighlightLayer.append(...highlightRects);
	}

	/**
	 * Return text nodes which are entirely inside `range`.
	 *
	 * If a range starts or ends part-way through a text node, the node is split
	 * and the part inside the range is returned.
	 */
	function wholeTextNodesInRange(range) {
	  if (range.collapsed) {
	    // Exit early for an empty range to avoid an edge case that breaks the algorithm
	    // below. Splitting a text node at the start of an empty range can leave the
	    // range ending in the left part rather than the right part.
	    return [];
	  }
	  let root = range.commonAncestorContainer;
	  if (root && root.nodeType !== Node.ELEMENT_NODE) {
	    // If the common ancestor is not an element, set it to the parent element to
	    // ensure that the loop below visits any text nodes generated by splitting
	    // the common ancestor.
	    //
	    // Note that `parentElement` may be `null`.
	    root = root.parentElement;
	  }
	  if (!root) {
	    // If there is no root element then we won't be able to insert highlights,
	    // so exit here.
	    return [];
	  }
	  const textNodes = [];
	  const nodeIter = root.ownerDocument.createNodeIterator(root, NodeFilter.SHOW_TEXT // Only return `Text` nodes.
	  );

	  let node;
	  while (node = nodeIter.nextNode()) {
	    if (!isNodeInRange(range, node)) {
	      continue;
	    }
	    const text = node;
	    if (text === range.startContainer && range.startOffset > 0) {
	      // Split `text` where the range starts. The split will create a new `Text`
	      // node which will be in the range and will be visited in the next loop iteration.
	      text.splitText(range.startOffset);
	      continue;
	    }
	    if (text === range.endContainer && range.endOffset < text.data.length) {
	      // Split `text` where the range ends, leaving it as the part in the range.
	      text.splitText(range.endOffset);
	    }
	    textNodes.push(text);
	  }
	  return textNodes;
	}

	/**
	 * Wraps the DOM Nodes within the provided range with a highlight
	 * element of the specified class and returns the highlight Elements.
	 *
	 * @param range - Range to be highlighted
	 * @param [cssClass] - CSS class(es) to add to the highlight elements
	 * @return Elements wrapping text in `normedRange` to add a highlight effect
	 */
	function highlightRange(range, cssClass) {
	  const textNodes = wholeTextNodesInRange(range);

	  // Check if this range refers to a placeholder for not-yet-rendered content in
	  // a PDF. These highlights should be invisible.
	  const inPlaceholder = textNodes.length > 0 && isInPlaceholder(textNodes[0]);

	  // Group text nodes into spans of adjacent nodes. If a group of text nodes are
	  // adjacent, we only need to create one highlight element for the group.
	  let textNodeSpans = [];
	  let prevNode = null;
	  let currentSpan = null;
	  textNodes.forEach(node => {
	    if (prevNode && prevNode.nextSibling === node) {
	      currentSpan.push(node);
	    } else {
	      currentSpan = [node];
	      textNodeSpans.push(currentSpan);
	    }
	    prevNode = node;
	  });

	  // Filter out text node spans that consist only of white space. This avoids
	  // inserting highlight elements in places that can only contain a restricted
	  // subset of nodes such as table rows and lists.
	  const whitespace = /^\s*$/;
	  textNodeSpans = textNodeSpans.filter(span =>
	  // Check for at least one text node with non-space content.
	  span.some(node => !whitespace.test(node.data)));

	  // Wrap each text node span with a `<hypothesis-highlight>` element.
	  const highlights = [];
	  textNodeSpans.forEach(nodes => {
	    // A custom element name is used here rather than `<span>` to reduce the
	    // likelihood of highlights being hidden by page styling.

	    const highlightEl = document.createElement('hypothesis-highlight');
	    highlightEl.className = classnames('hypothesis-highlight', cssClass);
	    const parent = nodes[0].parentNode;
	    parent.replaceChild(highlightEl, nodes[0]);
	    nodes.forEach(node => highlightEl.appendChild(node));
	    highlights.push(highlightEl);
	  });

	  // For PDF highlights, create the highlight effect by using an SVG placed
	  // above the page's canvas rather than CSS `background-color` on the highlight
	  // element. This enables more control over blending of the highlight with the
	  // content below.
	  //
	  // Drawing these SVG highlights involves measuring the `<hypothesis-highlight>`
	  // elements, so we create them only after those elements have all been created
	  // to reduce the number of forced reflows. We also skip creating them for
	  // unrendered pages for performance reasons.
	  if (!inPlaceholder) {
	    drawHighlightsAbovePDFCanvas(highlights, cssClass);
	  }
	  return highlights;
	}

	/**
	 * Replace a child `node` with `replacements`.
	 *
	 * nb. This is like `ChildNode.replaceWith` but it works in older browsers.
	 */
	function replaceWith(node, replacements) {
	  const parent = node.parentNode;
	  replacements.forEach(r => parent.insertBefore(r, node));
	  node.remove();
	}

	/**
	 * Remove all highlights under a given root element.
	 */
	function removeAllHighlights(root) {
	  const highlights = Array.from(root.querySelectorAll('hypothesis-highlight'));
	  removeHighlights(highlights);
	}

	/**
	 * Remove highlights from a range previously highlighted with `highlightRange`.
	 */
	function removeHighlights(highlights) {
	  for (const h of highlights) {
	    if (h.parentNode) {
	      const children = Array.from(h.childNodes);
	      replaceWith(h, children);
	    }
	    if (h.svgHighlight) {
	      h.svgHighlight.remove();
	    }
	  }
	}

	/**
	 * Set whether the given highlight elements should appear "focused".
	 *
	 * A highlight can be displayed in a different ("focused") style to indicate
	 * that it is current in some other context - for example the user has selected
	 * the corresponding annotation in the sidebar.
	 */
	function setHighlightsFocused(highlights, focused) {
	  highlights.forEach(h => {
	    // In PDFs the visible highlight is created by an SVG element, so the focused
	    // effect is applied to that. In other documents the effect is applied to the
	    // `<hypothesis-highlight>` element.
	    if (h.svgHighlight) {
	      h.svgHighlight.classList.toggle('is-focused', focused);

	      // Ensure that focused highlights are drawn above un-focused highlights
	      // on the same page.
	      //
	      // SVG elements are rendered in document order so to achieve this we need
	      // to move the element to be the last child of its parent.
	      if (focused) {
	        const parent = h.svgHighlight.parentNode;
	        parent.append(h.svgHighlight);
	      }
	    } else {
	      h.classList.toggle('hypothesis-highlight-focused', focused);
	    }
	  });
	}

	/**
	 * Set whether highlights under the given root element should be visible.
	 */
	function setHighlightsVisible(root, visible) {
	  const showHighlightsClass = 'hypothesis-highlights-always-on';
	  root.classList.toggle(showHighlightsClass, visible);
	}

	/**
	 * Get the highlight elements that contain the given node.
	 */
	function getHighlightsContainingNode(node) {
	  let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
	  const highlights = [];
	  while (el) {
	    if (el.classList.contains('hypothesis-highlight')) {
	      highlights.push(el);
	    }
	    el = el.parentElement;
	  }
	  return highlights;
	}

	// Subset of `DOMRect` interface

	/**
	 * Get the bounding client rectangle of a collection in viewport coordinates.
	 * Unfortunately, Chrome has issues ([1]) with Range.getBoundingClient rect or we
	 * could just use that.
	 *
	 * [1] https://bugs.chromium.org/p/chromium/issues/detail?id=324437
	 */
	function getBoundingClientRect(collection) {
	  // Reduce the client rectangles of the highlights to a bounding box
	  const rects = collection.map(n => n.getBoundingClientRect());
	  return rects.reduce((acc, r) => ({
	    top: Math.min(acc.top, r.top),
	    left: Math.min(acc.left, r.left),
	    bottom: Math.max(acc.bottom, r.bottom),
	    right: Math.max(acc.right, r.right)
	  }));
	}

	/**
	 * @typedef {import('../../types/annotator').Anchor} Anchor
	 * @typedef {import('../../types/annotator').AnchorPosition} AnchorPosition
	 */

	/**
	 * @typedef Bucket
	 * @prop {Set<string>} tags - The annotation tags in this bucket
	 * @prop {number} position - The vertical pixel offset where this bucket should
	 *   appear in the bucket bar
	 */

	/**
	 * @typedef BucketSet
	 * @prop {Bucket} above - A single bucket containing all the annotation
	 *   tags whose anchors are offscreen upwards
	 * @prop {Bucket} below - A single bucket containing all the annotation
	 *   tags which anchors are offscreen downwards
	 * @prop {Bucket[]} buckets - On-screen buckets
	 */

	/**
	 * @typedef WorkingBucket
	 * @prop {Set<string>} tags - The annotation tags in this bucket
	 * @prop {number} position - The computed position (offset) for this bucket,
	 *   based on the current anchors. This is centered between `top` and `bottom`
	 * @prop {number} top - The uppermost (lowest) vertical offset for the anchors
	 *   in this bucket — the lowest `top` position value, akin to the top offset of
	 *   a theoretical box drawn around all of the anchor highlights in this bucket
	 * @prop {number} bottom - The bottommost (highest) vertical offset for the
	 *   anchors in this bucket — the highest `top` position value, akin to the
	 *   bottom of a theoretical box drawn around all of the anchor highlights in
	 *   this bucket
	 */

	// Only anchors with top offsets between `BUCKET_TOP_THRESHOLD` and
	// `window.innerHeight - BUCKET_BOTTOM_THRESHOLD` are considered "on-screen"
	// and will be bucketed. This is to account for bucket-bar tool buttons (top
	// and the height of the bottom navigation bucket (bottom)
	const BUCKET_TOP_THRESHOLD = 137;
	const BUCKET_BOTTOM_THRESHOLD = 22;
	// Generated buckets of annotation anchor highlights should be spaced by
	// at least this amount, in pixels
	const BUCKET_GAP_SIZE = 60;

	/**
	 * Find the closest valid anchor in `anchors` that is offscreen in the direction
	 * indicated.
	 *
	 * @param {Anchor[]} anchors
	 * @param {'up'|'down'} direction
	 * @return {Anchor|null} - The closest anchor or `null` if no valid anchor found
	 */
	function findClosestOffscreenAnchor(anchors, direction) {
	  let closestAnchor = null;
	  let closestTop = 0;
	  for (let anchor of anchors) {
	    var _anchor$highlights;
	    if (!((_anchor$highlights = anchor.highlights) !== null && _anchor$highlights !== void 0 && _anchor$highlights.length)) {
	      continue;
	    }
	    const top = getBoundingClientRect(anchor.highlights).top;

	    // Verify that the anchor is offscreen in the direction we're headed
	    if (direction === 'up' && top >= BUCKET_TOP_THRESHOLD) {
	      // We're headed up but the anchor is already below the
	      // visible top of the bucket bar: it's not our guy
	      continue;
	    } else if (direction === 'down' && top <= window.innerHeight - BUCKET_BOTTOM_THRESHOLD) {
	      // We're headed down but this anchor is already above
	      // the usable bottom of the screen: it's not our guy
	      continue;
	    }
	    if (!closestAnchor || direction === 'up' && top > closestTop || direction === 'down' && top < closestTop) {
	      // This anchor is either:
	      // - The first anchor we've encountered off-screen in the direction
	      //   we're headed, or
	      // - Closer to the screen than the previous `closestAnchor`
	      closestAnchor = anchor;
	      closestTop = top;
	    }
	  }
	  return closestAnchor;
	}

	/**
	 * Compute the top and bottom positions for the set of anchors' highlights, sorted
	 * vertically, from top to bottom.
	 *
	 * @param {Anchor[]} anchors
	 * @return {AnchorPosition[]}
	 */
	function computeAnchorPositions(anchors) {
	  /** @type {AnchorPosition[]} */
	  const positions = [];
	  anchors.forEach(({
	    annotation,
	    highlights
	  }) => {
	    if (!(highlights !== null && highlights !== void 0 && highlights.length)) {
	      return;
	    }
	    const {
	      top,
	      bottom
	    } = getBoundingClientRect(highlights);
	    if (top >= bottom) {
	      // Empty rect. The highlights may be disconnected from the document or hidden.
	      return;
	    }
	    positions.push({
	      tag: annotation.$tag,
	      top,
	      bottom
	    });
	  });

	  // Sort anchors vertically from top to bottom
	  positions.sort((anchor1, anchor2) => anchor1.top - anchor2.top);
	  return positions;
	}

	/**
	 * Compute buckets
	 *
	 * @param {AnchorPosition[]} anchorPositions
	 * @return {BucketSet}
	 */
	function computeBuckets(anchorPositions) {
	  /** @type {Set<string>} */
	  const aboveTags = new Set();
	  /** @type {Set<string>} */
	  const belowTags = new Set();
	  /** @type {Bucket[]} */
	  const buckets = [];

	  // Hold current working anchors and positions as we build each bucket
	  /** @type {WorkingBucket|null} */
	  let currentBucket = null;

	  /**
	   * Create a new working bucket based on the provided `AnchorPosition`
	   *
	   * @param {AnchorPosition} anchorPosition
	   * @return {WorkingBucket}
	   */
	  function newBucket({
	    bottom,
	    tag,
	    top
	  }) {
	    const anchorHeight = bottom - top;
	    const bucketPosition = top + anchorHeight / 2;
	    return {
	      bottom,
	      position: bucketPosition,
	      tags: new Set([tag]),
	      top
	    };
	  }

	  // Build buckets from position information
	  anchorPositions.forEach(aPos => {
	    if (aPos.top < BUCKET_TOP_THRESHOLD) {
	      aboveTags.add(aPos.tag);
	      return;
	    } else if (aPos.top > window.innerHeight - BUCKET_BOTTOM_THRESHOLD) {
	      belowTags.add(aPos.tag);
	      return;
	    }
	    if (!currentBucket) {
	      // We've encountered our first on-screen anchor position:
	      // We'll need a bucket!
	      currentBucket = newBucket(aPos);
	      return;
	    }
	    // We want to contain overlapping highlights and those near each other
	    // within a shared bucket
	    const isContainedWithin = aPos.top > currentBucket.top && aPos.bottom < currentBucket.bottom;

	    // The new anchor's position is far enough below the bottom of the current
	    // bucket to justify starting a new bucket
	    const isLargeGap = aPos.top - currentBucket.bottom > BUCKET_GAP_SIZE;
	    if (isLargeGap && !isContainedWithin) {
	      // We need to start a new bucket; push the working bucket and create
	      // a new bucket
	      buckets.push(currentBucket);
	      currentBucket = newBucket(aPos);
	    } else {
	      // We'll add this anchor to the current working bucket and update
	      // offset properties accordingly.
	      // We can be confident that `aPos.top` is >= `currentBucket.top` because
	      // AnchorPositions are sorted by their `top` offset — meaning that
	      // `currentBucket.top` still accurately represents the `top` offset of
	      // the virtual rectangle enclosing all anchors in this bucket. But
	      // let's check to see if the bottom is larger/lower:
	      const updatedBottom = aPos.bottom > currentBucket.bottom ? aPos.bottom : currentBucket.bottom;
	      const updatedHeight = updatedBottom - currentBucket.top;
	      currentBucket.tags.add(aPos.tag);
	      currentBucket.bottom = updatedBottom;
	      currentBucket.position = currentBucket.top + updatedHeight / 2;
	    }
	  });
	  if (currentBucket) {
	    buckets.push(currentBucket);
	  }

	  // Add an upper "navigation" bucket with offscreen-above anchors
	  const above = {
	    tags: aboveTags,
	    position: BUCKET_TOP_THRESHOLD
	  };

	  // Add a lower "navigation" bucket with offscreen-below anchors
	  const below = {
	    tags: belowTags,
	    position: window.innerHeight - BUCKET_BOTTOM_THRESHOLD
	  };
	  return {
	    above,
	    below,
	    buckets
	  };
	}

	/**
	 * @typedef {import('../shared/messaging').PortRPC<HostToGuestEvent, GuestToHostEvent>} HostRPC
	 * @typedef {import('../types/annotator').Anchor} Anchor
	 * @typedef {import('../types/annotator').AnchorPosition} AnchorPosition
	 * @typedef {import('../types/annotator').Destroyable} Destroyable
	 * @typedef {import('../types/port-rpc-events').HostToGuestEvent} HostToGuestEvent
	 * @typedef {import('../types/port-rpc-events').GuestToHostEvent} GuestToHostEvent
	 */

	/**
	 * Communicate to the host frame when:
	 *
	 * 1. The set of anchors has been changed (due to annotations being added or removed)
	 * 2. The position of anchors relative to the viewport of the guest has changed
	 *
	 * @implements {Destroyable}
	 */
	class BucketBarClient {
	  /**
	   * @param {object} options
	   *   @param {Element} options.contentContainer - The scrollable container element for the
	   *     document content. All of the highlights that the bucket bar's buckets point
	   *     at should be contained within this element.
	   *   @param {HostRPC} options.hostRPC
	   */
	  constructor({
	    contentContainer,
	    hostRPC
	  }) {
	    this._hostRPC = hostRPC;
	    this._updatePending = false;
	    /** @type {Anchor[]} */
	    this._anchors = [];
	    this._listeners = new ListenerCollection$1();
	    this._listeners.add(window, 'resize', () => this.update());
	    this._listeners.add(window, 'scroll', () => this.update());
	    this._listeners.add(contentContainer, 'scroll', () => this.update());
	  }
	  destroy() {
	    this._listeners.removeAll();
	  }

	  /**
	   * Notifies the BucketBar in the host frame when:
	   * 1. The set of anchors has been changed (due to annotations being added or removed)
	   * 2. The position of anchors relative to the viewport of the guest has changed
	   *
	   * Updates are debounced to reduce the overhead of gathering and sending anchor
	   * position data across frames.
	   *
	   * @param {Anchor[]} [anchors] - pass this option when anchors are added or
	   *   deleted
	   */
	  update(anchors) {
	    if (anchors) {
	      this._anchors = anchors;
	    }
	    if (this._updatePending) {
	      return;
	    }
	    this._updatePending = true;
	    requestAnimationFrame(() => {
	      const positions = computeAnchorPositions(this._anchors);
	      this._hostRPC.call('anchorsChanged', positions);
	      this._updatePending = false;
	    });
	  }
	}

	var _jsxFileName$b = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/ClusterToolbar.tsx";
	/**
	 * Render controls for changing a single highlight cluster's style
	 */
	function ClusterStyleControl({
	  cluster,
	  label,
	  onChange,
	  currentStyles,
	  highlightStyles
	}) {
	  const appliedStyleName = currentStyles[cluster];
	  const isHidden = appliedStyleName === 'transparent'; // This style is somewhat special
	  return o("div", {
	    className: "space-y-2",
	    children: [o("div", {
	      className: "flex items-center gap-x-2 text-annotator-base",
	      children: o("div", {
	        className: "grow text-color-text px-2 py-1 rounded",
	        style: {
	          backgroundColor: highlightStyles[appliedStyleName].color
	        },
	        children: label
	      }, void 0, false, {
	        fileName: _jsxFileName$b,
	        lineNumber: 39,
	        columnNumber: 9
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$b,
	      lineNumber: 38,
	      columnNumber: 7
	    }, this), o("div", {
	      className: "flex items-center gap-x-2",
	      children: Object.keys(highlightStyles).map(styleName => o("div", {
	        className: "relative",
	        children: [o("input", {
	          className: classnames(
	          // Position this atop its label and size it to the same dimensions
	          'absolute w-6 h-6',
	          // Make radio input visually hidden, but
	          // some screen readers won't read out elements with 0 opacity
	          'opacity-[.00001]', 'cursor-pointer'),
	          name: cluster,
	          id: `hypothesis-${cluster}-${styleName}`,
	          checked: appliedStyleName === styleName,
	          onChange: onChange,
	          type: "radio",
	          value: styleName
	        }, void 0, false, {
	          fileName: _jsxFileName$b,
	          lineNumber: 51,
	          columnNumber: 13
	        }, this), o("label", {
	          className: "block",
	          htmlFor: `${cluster}-${styleName}`,
	          children: [o("div", {
	            style: {
	              backgroundColor: highlightStyles[styleName].color
	            },
	            className: classnames('block w-6 h-6 rounded-full flex items-center justify-center', {
	              'border-2 border-slate-0': appliedStyleName !== styleName,
	              'border-2 border-slate-3': appliedStyleName === styleName
	            }),
	            children: styleName === 'transparent' && o(HideIcon, {
	              className: classnames('w-3 h-3', {
	                'text-slate-3': !isHidden,
	                'text-slate-7': isHidden
	              })
	            }, void 0, false, {
	              fileName: _jsxFileName$b,
	              lineNumber: 81,
	              columnNumber: 19
	            }, this)
	          }, void 0, false, {
	            fileName: _jsxFileName$b,
	            lineNumber: 68,
	            columnNumber: 15
	          }, this), o("span", {
	            className: "sr-only",
	            children: styleName
	          }, void 0, false, {
	            fileName: _jsxFileName$b,
	            lineNumber: 89,
	            columnNumber: 15
	          }, this)]
	        }, void 0, true, {
	          fileName: _jsxFileName$b,
	          lineNumber: 67,
	          columnNumber: 13
	        }, this)]
	      }, `${cluster}-${styleName}`, true, {
	        fileName: _jsxFileName$b,
	        lineNumber: 50,
	        columnNumber: 11
	      }, this))
	    }, void 0, false, {
	      fileName: _jsxFileName$b,
	      lineNumber: 48,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$b,
	    lineNumber: 37,
	    columnNumber: 5
	  }, this);
	}
	/**
	 * Render controls to change highlight-cluster styling.
	 */
	function ClusterToolbar({
	  active,
	  availableStyles,
	  currentStyles,
	  onStyleChange
	}) {
	  const handleStyleChange = T(changeEvent => {
	    const input = changeEvent.target;
	    const cluster = input.name;
	    const styleName = input.value;
	    onStyleChange(cluster, styleName);
	  }, [onStyleChange]);
	  const [isOpen, setOpen] = p(false);
	  if (!active) {
	    return null;
	  }
	  return o(CardNext, {
	    children: o("div", {
	      className: "flex flex-col text-annotator-base text-color-text",
	      children: [o(ButtonNext, {
	        "data-testid": "control-toggle-button",
	        onClick: () => setOpen(!isOpen),
	        title: isOpen ? 'Hide highlight settings' : 'Show highlight settings',
	        children: isOpen ? o(p$2, {
	          children: [o(CaretDownIcon, {}, void 0, false, {
	            fileName: _jsxFileName$b,
	            lineNumber: 142,
	            columnNumber: 15
	          }, this), o("span", {
	            children: "Highlight Appearance"
	          }, void 0, false, {
	            fileName: _jsxFileName$b,
	            lineNumber: 143,
	            columnNumber: 15
	          }, this)]
	        }, void 0, true) : o(p$2, {
	          children: [o(CaretRightIcon, {}, void 0, false, {
	            fileName: _jsxFileName$b,
	            lineNumber: 147,
	            columnNumber: 15
	          }, this), o(HighlightIcon, {}, void 0, false, {
	            fileName: _jsxFileName$b,
	            lineNumber: 148,
	            columnNumber: 15
	          }, this)]
	        }, void 0, true)
	      }, void 0, false, {
	        fileName: _jsxFileName$b,
	        lineNumber: 135,
	        columnNumber: 9
	      }, this), isOpen && o(CardContentNext, {
	        "data-testid": "cluster-style-controls",
	        size: "sm",
	        children: [o(ClusterStyleControl, {
	          highlightStyles: availableStyles,
	          label: "My annotations",
	          cluster: "user-annotations",
	          onChange: handleStyleChange,
	          currentStyles: currentStyles
	        }, void 0, false, {
	          fileName: _jsxFileName$b,
	          lineNumber: 154,
	          columnNumber: 13
	        }, this), o(ClusterStyleControl, {
	          highlightStyles: availableStyles,
	          label: "My highlights",
	          cluster: "user-highlights",
	          onChange: handleStyleChange,
	          currentStyles: currentStyles
	        }, void 0, false, {
	          fileName: _jsxFileName$b,
	          lineNumber: 161,
	          columnNumber: 13
	        }, this), o(ClusterStyleControl, {
	          highlightStyles: availableStyles,
	          label: "Everybody's content",
	          cluster: "other-content",
	          onChange: handleStyleChange,
	          currentStyles: currentStyles
	        }, void 0, false, {
	          fileName: _jsxFileName$b,
	          lineNumber: 168,
	          columnNumber: 13
	        }, this)]
	      }, void 0, true, {
	        fileName: _jsxFileName$b,
	        lineNumber: 153,
	        columnNumber: 11
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$b,
	      lineNumber: 134,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$b,
	    lineNumber: 133,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$a = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/highlight-clusters.tsx";
	// Available styles that users can apply to highlight clusters
	const highlightStyles = {
	  transparent: {
	    color: 'transparent',
	    secondColor: 'transparent',
	    thirdColor: 'transparent'
	  },
	  pink: {
	    color: 'var(--hypothesis-color-pink)',
	    secondColor: 'var(--hypothesis-color-pink-1)',
	    thirdColor: 'var(--hypothesis-color-pink-2)'
	  },
	  orange: {
	    color: 'var(--hypothesis-color-orange)',
	    secondColor: 'var(--hypothesis-color-orange-1)',
	    thirdColor: 'var(--hypothesis-color-orange-2)'
	  },
	  yellow: {
	    color: 'var(--hypothesis-color-yellow)',
	    secondColor: 'var(--hypothesis-color-yellow-1)',
	    thirdColor: 'var(--hypothesis-color-yellow-2)'
	  },
	  green: {
	    color: 'var(--hypothesis-color-green)',
	    secondColor: 'var(--hypothesis-color-green-1)',
	    thirdColor: 'var(--hypothesis-color-green-2)'
	  },
	  purple: {
	    color: 'var(--hypothesis-color-purple)',
	    secondColor: 'var(--hypothesis-color-purple-1)',
	    thirdColor: 'var(--hypothesis-color-purple-2)'
	  },
	  grey: {
	    color: 'var(--hypothesis-color-grey)',
	    secondColor: 'var(--hypothesis-color-grey-1)',
	    thirdColor: 'var(--hypothesis-color-grey-2)'
	  }
	};

	// The default styles applied to each highlight cluster. For now, this is
	// hard-coded.
	const defaultClusterStyles = {
	  'other-content': 'yellow',
	  'user-annotations': 'orange',
	  'user-highlights': 'purple'
	};
	class HighlightClusterController {
	  constructor(element, options) {
	    _defineProperty(this, "appliedStyles", void 0);
	    _defineProperty(this, "_element", void 0);
	    _defineProperty(this, "_features", void 0);
	    _defineProperty(this, "_outerContainer", void 0);
	    _defineProperty(this, "_shadowRoot", void 0);
	    this._element = element;
	    this._features = options.features;
	    this._outerContainer = document.createElement('hypothesis-highlight-cluster-toolbar');
	    this._element.appendChild(this._outerContainer);
	    this._shadowRoot = createShadowRoot(this._outerContainer);

	    // For now, the controls are fixed at top-left of screen. This is temporary.
	    Object.assign(this._outerContainer.style, {
	      position: 'fixed',
	      top: `${this._element.offsetTop + 4}px`,
	      left: '4px'
	    });
	    this.appliedStyles = defaultClusterStyles;
	    this._init();
	    this._features.on('flagsChanged', () => {
	      this._activate(this._isActive());
	    });
	    this._render();
	  }
	  destroy() {
	    P$1(null, this._shadowRoot); // unload the Preact component
	    this._activate(false); // De-activate cluster styling
	    this._outerContainer.remove();
	  }

	  /**
	   * Set initial values for :root CSS custom properties (variables) based on the
	   * applied styles for each cluster. This has no effect if this feature
	   * is not active.
	   */
	  _init() {
	    for (const cluster of Object.keys(this.appliedStyles)) {
	      this._setClusterStyles(cluster, this.appliedStyles[cluster]);
	    }
	    this._activate(this._isActive());
	  }
	  _isActive() {
	    return this._features.flagEnabled('styled_highlight_clusters');
	  }

	  /**
	   * Activate cluster highlighting if `active` is set.
	   */
	  _activate(active) {
	    this._element.classList.toggle('hypothesis-highlights-clustered', active);
	    this._render();
	  }

	  /**
	   * Set a value for an individual CSS variable at :root
	   */
	  _setClusterStyle(key, value) {
	    document.documentElement.style.setProperty(key, value);
	  }

	  /**
	   * Set CSS variables for the highlight `cluster` to apply the
	   * {@link HighlightStyle} `highlightStyles[styleName]`
	   */
	  _setClusterStyles(cluster, styleName) {
	    const styleRules = highlightStyles[styleName];
	    for (const ruleName of Object.keys(styleRules)) {
	      this._setClusterStyle(`--hypothesis-${cluster}-${ruleName}`, styleRules[ruleName]);
	    }
	  }

	  /**
	   * Respond to user input to change the applied style for a cluster
	   */
	  _onChangeClusterStyle(cluster, styleName) {
	    this.appliedStyles[cluster] = styleName;
	    this._setClusterStyles(cluster, styleName);
	    this._render();
	  }
	  _render() {
	    P$1(o(ClusterToolbar, {
	      active: this._isActive(),
	      availableStyles: highlightStyles,
	      currentStyles: this.appliedStyles,
	      onStyleChange: (cluster, styleName) => this._onChangeClusterStyle(cluster, styleName)
	    }, void 0, false, {
	      fileName: _jsxFileName$a,
	      lineNumber: 177,
	      columnNumber: 7
	    }, this), this._shadowRoot);
	  }
	}

	/** @type {Set<string>} */
	let shownWarnings = new Set();

	/**
	 * Log a warning if it has not already been reported.
	 *
	 * This is useful to avoid spamming the console if a warning is emitted in a
	 * context that may be called frequently.
	 *
	 * @param {...unknown} args -
	 *   Arguments to forward to `console.warn`. The arguments `toString()` values
	 *   are concatenated into a string key which is used to determine if the warning
	 *   has been logged before.
	 */
	function warnOnce(...args) {
	  const key = args.join();
	  if (shownWarnings.has(key)) {
	    return;
	  }
	  console.warn(...args);
	  shownWarnings.add(key);
	}
	warnOnce.reset = () => {
	  shownWarnings.clear();
	};

	/**
	 * @typedef {import('../types/annotator').FeatureFlags} IFeatureFlags
	 */

	/**
	 * List of feature flags that annotator code tests for.
	 *
	 * @type {string[]}
	 */
	const annotatorFlags = ['book_as_single_document', 'html_side_by_side', 'styled_highlight_clusters'];

	/**
	 * An observable container of feature flags.
	 *
	 * @implements {IFeatureFlags}
	 */
	class FeatureFlags extends TinyEmitter {
	  /**
	   * @param {string[]} knownFlags - Test seam. This is a list of known flags
	   *   used to catch mistakes where code checks for an obsolete feature flag.
	   */
	  constructor(knownFlags = annotatorFlags) {
	    super();

	    /**
	     * Map of flag name to enabled state.
	     *
	     * @type {Map<string, boolean>}
	     */
	    this._flags = new Map();
	    this._knownFlags = knownFlags;
	  }

	  /**
	   * Update the stored flags and notify observers via a "flagsChanged" event.
	   *
	   * @param {Record<string, boolean>} flags
	   */
	  update(flags) {
	    this._flags.clear();
	    for (let [flag, on] of Object.entries(flags)) {
	      this._flags.set(flag, on);
	    }
	    this.emit('flagsChanged');
	  }

	  /**
	   * Test if a feature flag is enabled.
	   *
	   * This will return false if the feature flags have not yet been received from
	   * the backend. Code that uses a feature flag should handle subsequent changes
	   * to the flag's state by listening for the "flagsChanged" event.
	   *
	   * @param {string} flag
	   * @return {boolean}
	   */
	  flagEnabled(flag) {
	    var _this$_flags$get;
	    if (!this._knownFlags.includes(flag)) {
	      warnOnce('Looked up unknown feature', flag);
	      return false;
	    }
	    return (_this$_flags$get = this._flags.get(flag)) !== null && _this$_flags$get !== void 0 ? _this$_flags$get : false;
	  }

	  /**
	   * Return the state of all feature flags.
	   *
	   * To test whether an individual flag is enabled, use {@link flagEnabled}
	   * instead.
	   */
	  allFlags() {
	    return Object.fromEntries(this._flags);
	  }
	}

	/**
	 * Implementation of Myers' online approximate string matching algorithm [1],
	 * with additional optimizations suggested by [2].
	 *
	 * This has O((k/w) * n) expected-time where `n` is the length of the
	 * text, `k` is the maximum number of errors allowed (always <= the pattern
	 * length) and `w` is the word size. Because JS only supports bitwise operations
	 * on 32 bit integers, `w` is 32.
	 *
	 * As far as I am aware, there aren't any online algorithms which are
	 * significantly better for a wide range of input parameters. The problem can be
	 * solved faster using "filter then verify" approaches which first filter out
	 * regions of the text that cannot match using a "cheap" check and then verify
	 * the remaining potential matches. The verify step requires an algorithm such
	 * as this one however.
	 *
	 * The algorithm's approach is essentially to optimize the classic dynamic
	 * programming solution to the problem by computing columns of the matrix in
	 * word-sized chunks (ie. dealing with 32 chars of the pattern at a time) and
	 * avoiding calculating regions of the matrix where the minimum error count is
	 * guaranteed to exceed the input threshold.
	 *
	 * The paper consists of two parts, the first describes the core algorithm for
	 * matching patterns <= the size of a word (implemented by `advanceBlock` here).
	 * The second uses the core algorithm as part of a larger block-based algorithm
	 * to handle longer patterns.
	 *
	 * [1] G. Myers, “A Fast Bit-Vector Algorithm for Approximate String Matching
	 * Based on Dynamic Programming,” vol. 46, no. 3, pp. 395–415, 1999.
	 *
	 * [2] Šošić, M. (2014). An simd dynamic programming c/c++ library (Doctoral
	 * dissertation, Fakultet Elektrotehnike i računarstva, Sveučilište u Zagrebu).
	 */
	function reverse(s) {
	    return s.split("").reverse().join("");
	}
	/**
	 * Given the ends of approximate matches for `pattern` in `text`, find
	 * the start of the matches.
	 *
	 * @param findEndFn - Function for finding the end of matches in
	 * text.
	 * @return Matches with the `start` property set.
	 */
	function findMatchStarts(text, pattern, matches) {
	    const patRev = reverse(pattern);
	    return matches.map((m) => {
	        // Find start of each match by reversing the pattern and matching segment
	        // of text and searching for an approx match with the same number of
	        // errors.
	        const minStart = Math.max(0, m.end - pattern.length - m.errors);
	        const textRev = reverse(text.slice(minStart, m.end));
	        // If there are multiple possible start points, choose the one that
	        // maximizes the length of the match.
	        const start = findMatchEnds(textRev, patRev, m.errors).reduce((min, rm) => {
	            if (m.end - rm.end < min) {
	                return m.end - rm.end;
	            }
	            return min;
	        }, m.end);
	        return {
	            start,
	            end: m.end,
	            errors: m.errors,
	        };
	    });
	}
	/**
	 * Return 1 if a number is non-zero or zero otherwise, without using
	 * conditional operators.
	 *
	 * This should get inlined into `advanceBlock` below by the JIT.
	 *
	 * Adapted from https://stackoverflow.com/a/3912218/434243
	 */
	function oneIfNotZero(n) {
	    return ((n | -n) >> 31) & 1;
	}
	/**
	 * Block calculation step of the algorithm.
	 *
	 * From Fig 8. on p. 408 of [1], additionally optimized to replace conditional
	 * checks with bitwise operations as per Section 4.2.3 of [2].
	 *
	 * @param ctx - The pattern context object
	 * @param peq - The `peq` array for the current character (`ctx.peq.get(ch)`)
	 * @param b - The block level
	 * @param hIn - Horizontal input delta ∈ {1,0,-1}
	 * @return Horizontal output delta ∈ {1,0,-1}
	 */
	function advanceBlock(ctx, peq, b, hIn) {
	    let pV = ctx.P[b];
	    let mV = ctx.M[b];
	    const hInIsNegative = hIn >>> 31; // 1 if hIn < 0 or 0 otherwise.
	    const eq = peq[b] | hInIsNegative;
	    // Step 1: Compute horizontal deltas.
	    const xV = eq | mV;
	    const xH = (((eq & pV) + pV) ^ pV) | eq;
	    let pH = mV | ~(xH | pV);
	    let mH = pV & xH;
	    // Step 2: Update score (value of last row of this block).
	    const hOut = oneIfNotZero(pH & ctx.lastRowMask[b]) -
	        oneIfNotZero(mH & ctx.lastRowMask[b]);
	    // Step 3: Update vertical deltas for use when processing next char.
	    pH <<= 1;
	    mH <<= 1;
	    mH |= hInIsNegative;
	    pH |= oneIfNotZero(hIn) - hInIsNegative; // set pH[0] if hIn > 0
	    pV = mH | ~(xV | pH);
	    mV = pH & xV;
	    ctx.P[b] = pV;
	    ctx.M[b] = mV;
	    return hOut;
	}
	/**
	 * Find the ends and error counts for matches of `pattern` in `text`.
	 *
	 * Only the matches with the lowest error count are reported. Other matches
	 * with error counts <= maxErrors are discarded.
	 *
	 * This is the block-based search algorithm from Fig. 9 on p.410 of [1].
	 */
	function findMatchEnds(text, pattern, maxErrors) {
	    if (pattern.length === 0) {
	        return [];
	    }
	    // Clamp error count so we can rely on the `maxErrors` and `pattern.length`
	    // rows being in the same block below.
	    maxErrors = Math.min(maxErrors, pattern.length);
	    const matches = [];
	    // Word size.
	    const w = 32;
	    // Index of maximum block level.
	    const bMax = Math.ceil(pattern.length / w) - 1;
	    // Context used across block calculations.
	    const ctx = {
	        P: new Uint32Array(bMax + 1),
	        M: new Uint32Array(bMax + 1),
	        lastRowMask: new Uint32Array(bMax + 1),
	    };
	    ctx.lastRowMask.fill(1 << 31);
	    ctx.lastRowMask[bMax] = 1 << (pattern.length - 1) % w;
	    // Dummy "peq" array for chars in the text which do not occur in the pattern.
	    const emptyPeq = new Uint32Array(bMax + 1);
	    // Map of UTF-16 character code to bit vector indicating positions in the
	    // pattern that equal that character.
	    const peq = new Map();
	    // Version of `peq` that only stores mappings for small characters. This
	    // allows faster lookups when iterating through the text because a simple
	    // array lookup can be done instead of a hash table lookup.
	    const asciiPeq = [];
	    for (let i = 0; i < 256; i++) {
	        asciiPeq.push(emptyPeq);
	    }
	    // Calculate `ctx.peq` - a map of character values to bitmasks indicating
	    // positions of that character within the pattern, where each bit represents
	    // a position in the pattern.
	    for (let c = 0; c < pattern.length; c += 1) {
	        const val = pattern.charCodeAt(c);
	        if (peq.has(val)) {
	            // Duplicate char in pattern.
	            continue;
	        }
	        const charPeq = new Uint32Array(bMax + 1);
	        peq.set(val, charPeq);
	        if (val < asciiPeq.length) {
	            asciiPeq[val] = charPeq;
	        }
	        for (let b = 0; b <= bMax; b += 1) {
	            charPeq[b] = 0;
	            // Set all the bits where the pattern matches the current char (ch).
	            // For indexes beyond the end of the pattern, always set the bit as if the
	            // pattern contained a wildcard char in that position.
	            for (let r = 0; r < w; r += 1) {
	                const idx = b * w + r;
	                if (idx >= pattern.length) {
	                    continue;
	                }
	                const match = pattern.charCodeAt(idx) === val;
	                if (match) {
	                    charPeq[b] |= 1 << r;
	                }
	            }
	        }
	    }
	    // Index of last-active block level in the column.
	    let y = Math.max(0, Math.ceil(maxErrors / w) - 1);
	    // Initialize maximum error count at bottom of each block.
	    const score = new Uint32Array(bMax + 1);
	    for (let b = 0; b <= y; b += 1) {
	        score[b] = (b + 1) * w;
	    }
	    score[bMax] = pattern.length;
	    // Initialize vertical deltas for each block.
	    for (let b = 0; b <= y; b += 1) {
	        ctx.P[b] = ~0;
	        ctx.M[b] = 0;
	    }
	    // Process each char of the text, computing the error count for `w` chars of
	    // the pattern at a time.
	    for (let j = 0; j < text.length; j += 1) {
	        // Lookup the bitmask representing the positions of the current char from
	        // the text within the pattern.
	        const charCode = text.charCodeAt(j);
	        let charPeq;
	        if (charCode < asciiPeq.length) {
	            // Fast array lookup.
	            charPeq = asciiPeq[charCode];
	        }
	        else {
	            // Slower hash table lookup.
	            charPeq = peq.get(charCode);
	            if (typeof charPeq === "undefined") {
	                charPeq = emptyPeq;
	            }
	        }
	        // Calculate error count for blocks that we definitely have to process for
	        // this column.
	        let carry = 0;
	        for (let b = 0; b <= y; b += 1) {
	            carry = advanceBlock(ctx, charPeq, b, carry);
	            score[b] += carry;
	        }
	        // Check if we also need to compute an additional block, or if we can reduce
	        // the number of blocks processed for the next column.
	        if (score[y] - carry <= maxErrors &&
	            y < bMax &&
	            (charPeq[y + 1] & 1 || carry < 0)) {
	            // Error count for bottom block is under threshold, increase the number of
	            // blocks processed for this column & next by 1.
	            y += 1;
	            ctx.P[y] = ~0;
	            ctx.M[y] = 0;
	            let maxBlockScore;
	            if (y === bMax) {
	                const remainder = pattern.length % w;
	                maxBlockScore = remainder === 0 ? w : remainder;
	            }
	            else {
	                maxBlockScore = w;
	            }
	            score[y] =
	                score[y - 1] +
	                    maxBlockScore -
	                    carry +
	                    advanceBlock(ctx, charPeq, y, carry);
	        }
	        else {
	            // Error count for bottom block exceeds threshold, reduce the number of
	            // blocks processed for the next column.
	            while (y > 0 && score[y] >= maxErrors + w) {
	                y -= 1;
	            }
	        }
	        // If error count is under threshold, report a match.
	        if (y === bMax && score[y] <= maxErrors) {
	            if (score[y] < maxErrors) {
	                // Discard any earlier, worse matches.
	                matches.splice(0, matches.length);
	            }
	            matches.push({
	                start: -1,
	                end: j + 1,
	                errors: score[y],
	            });
	            // Because `search` only reports the matches with the lowest error count,
	            // we can "ratchet down" the max error threshold whenever a match is
	            // encountered and thereby save a small amount of work for the remainder
	            // of the text.
	            maxErrors = score[y];
	        }
	    }
	    return matches;
	}
	/**
	 * Search for matches for `pattern` in `text` allowing up to `maxErrors` errors.
	 *
	 * Returns the start, and end positions and error counts for each lowest-cost
	 * match. Only the "best" matches are returned.
	 */
	function search$1(text, pattern, maxErrors) {
	    const matches = findMatchEnds(text, pattern, maxErrors);
	    return findMatchStarts(text, pattern, matches);
	}

	/**
	 * @typedef {import('approx-string-match').Match} StringMatch
	 */

	/**
	 * @typedef Match
	 * @prop {number} start - Start offset of match in text
	 * @prop {number} end - End offset of match in text
	 * @prop {number} score -
	 *   Score for the match between 0 and 1.0, where 1.0 indicates a perfect match
	 *   for the quote and context.
	 */

	/**
	 * Find the best approximate matches for `str` in `text` allowing up to `maxErrors` errors.
	 *
	 * @param {string} text
	 * @param {string} str
	 * @param {number} maxErrors
	 * @return {StringMatch[]}
	 */
	function search(text, str, maxErrors) {
	  // Do a fast search for exact matches. The `approx-string-match` library
	  // doesn't currently incorporate this optimization itself.
	  let matchPos = 0;
	  let exactMatches = [];
	  while (matchPos !== -1) {
	    matchPos = text.indexOf(str, matchPos);
	    if (matchPos !== -1) {
	      exactMatches.push({
	        start: matchPos,
	        end: matchPos + str.length,
	        errors: 0
	      });
	      matchPos += 1;
	    }
	  }
	  if (exactMatches.length > 0) {
	    return exactMatches;
	  }

	  // If there are no exact matches, do a more expensive search for matches
	  // with errors.
	  return search$1(text, str, maxErrors);
	}

	/**
	 * Compute a score between 0 and 1.0 for the similarity between `text` and `str`.
	 *
	 * @param {string} text
	 * @param {string} str
	 */
	function textMatchScore(text, str) {
	  // `search` will return no matches if either the text or pattern is empty,
	  // otherwise it will return at least one match if the max allowed error count
	  // is at least `str.length`.
	  if (str.length === 0 || text.length === 0) {
	    return 0.0;
	  }
	  const matches = search(text, str, str.length);

	  // prettier-ignore
	  return 1 - matches[0].errors / str.length;
	}

	/**
	 * Find the best approximate match for `quote` in `text`.
	 *
	 * Returns `null` if no match exceeding the minimum quality threshold was found.
	 *
	 * @param {string} text - Document text to search
	 * @param {string} quote - String to find within `text`
	 * @param {object} context -
	 *   Context in which the quote originally appeared. This is used to choose the
	 *   best match.
	 *   @param {string} [context.prefix] - Expected text before the quote
	 *   @param {string} [context.suffix] - Expected text after the quote
	 *   @param {number} [context.hint] - Expected offset of match within text
	 * @return {Match|null}
	 */
	function matchQuote(text, quote, context = {}) {
	  if (quote.length === 0) {
	    return null;
	  }

	  // Choose the maximum number of errors to allow for the initial search.
	  // This choice involves a tradeoff between:
	  //
	  //  - Recall (proportion of "good" matches found)
	  //  - Precision (proportion of matches found which are "good")
	  //  - Cost of the initial search and of processing the candidate matches [1]
	  //
	  // [1] Specifically, the expected-time complexity of the initial search is
	  //     `O((maxErrors / 32) * text.length)`. See `approx-string-match` docs.
	  const maxErrors = Math.min(256, quote.length / 2);

	  // Find closest matches for `quote` in `text` based on edit distance.
	  const matches = search(text, quote, maxErrors);
	  if (matches.length === 0) {
	    return null;
	  }

	  /**
	   * Compute a score between 0 and 1.0 for a match candidate.
	   *
	   * @param {StringMatch} match
	   */
	  const scoreMatch = match => {
	    const quoteWeight = 50; // Similarity of matched text to quote.
	    const prefixWeight = 20; // Similarity of text before matched text to `context.prefix`.
	    const suffixWeight = 20; // Similarity of text after matched text to `context.suffix`.
	    const posWeight = 2; // Proximity to expected location. Used as a tie-breaker.

	    const quoteScore = 1 - match.errors / quote.length;
	    const prefixScore = context.prefix ? textMatchScore(text.slice(Math.max(0, match.start - context.prefix.length), match.start), context.prefix) : 1.0;
	    const suffixScore = context.suffix ? textMatchScore(text.slice(match.end, match.end + context.suffix.length), context.suffix) : 1.0;
	    let posScore = 1.0;
	    if (typeof context.hint === 'number') {
	      const offset = Math.abs(match.start - context.hint);
	      posScore = 1.0 - offset / text.length;
	    }
	    const rawScore = quoteWeight * quoteScore + prefixWeight * prefixScore + suffixWeight * suffixScore + posWeight * posScore;
	    const maxScore = quoteWeight + prefixWeight + suffixWeight + posWeight;
	    const normalizedScore = rawScore / maxScore;
	    return normalizedScore;
	  };

	  // Rank matches based on similarity of actual and expected surrounding text
	  // and actual/expected offset in the document text.
	  const scoredMatches = matches.map(m => ({
	    start: m.start,
	    end: m.end,
	    score: scoreMatch(m)
	  }));

	  // Choose match with highest score.
	  scoredMatches.sort((a, b) => b.score - a.score);
	  return scoredMatches[0];
	}

	/**
	 * Get the node name for use in generating an xpath expression.
	 *
	 * @param {Node} node
	 */
	function getNodeName(node) {
	  const nodeName = node.nodeName.toLowerCase();
	  let result = nodeName;
	  if (nodeName === '#text') {
	    result = 'text()';
	  }
	  return result;
	}

	/**
	 * Get the index of the node as it appears in its parent's child list
	 *
	 * @param {Node} node
	 */
	function getNodePosition(node) {
	  let pos = 0;
	  /** @type {Node|null} */
	  let tmp = node;
	  while (tmp) {
	    if (tmp.nodeName === node.nodeName) {
	      pos += 1;
	    }
	    tmp = tmp.previousSibling;
	  }
	  return pos;
	}

	/** @param {Node} node */
	function getPathSegment(node) {
	  const name = getNodeName(node);
	  const pos = getNodePosition(node);
	  return `${name}[${pos}]`;
	}

	/**
	 * A simple XPath generator which can generate XPaths of the form
	 * /tag[index]/tag[index].
	 *
	 * @param {Node} node - The node to generate a path to
	 * @param {Node} root - Root node to which the returned path is relative
	 */
	function xpathFromNode(node, root) {
	  let xpath = '';

	  /** @type {Node|null} */
	  let elem = node;
	  while (elem !== root) {
	    if (!elem) {
	      throw new Error('Node is not a descendant of root');
	    }
	    xpath = getPathSegment(elem) + '/' + xpath;
	    elem = elem.parentNode;
	  }
	  xpath = '/' + xpath;
	  xpath = xpath.replace(/\/$/, ''); // Remove trailing slash

	  return xpath;
	}

	/**
	 * Return the `index`'th immediate child of `element` whose tag name is
	 * `nodeName` (case insensitive).
	 *
	 * @param {Element} element
	 * @param {string} nodeName
	 * @param {number} index
	 */
	function nthChildOfType(element, nodeName, index) {
	  nodeName = nodeName.toUpperCase();
	  let matchIndex = -1;
	  for (let i = 0; i < element.children.length; i++) {
	    const child = element.children[i];
	    if (child.nodeName.toUpperCase() === nodeName) {
	      ++matchIndex;
	      if (matchIndex === index) {
	        return child;
	      }
	    }
	  }
	  return null;
	}

	/**
	 * Evaluate a _simple XPath_ relative to a `root` element and return the
	 * matching element.
	 *
	 * A _simple XPath_ is a sequence of one or more `/tagName[index]` strings.
	 *
	 * Unlike `document.evaluate` this function:
	 *
	 *  - Only supports simple XPaths
	 *  - Is not affected by the document's _type_ (HTML or XML/XHTML)
	 *  - Ignores element namespaces when matching element names in the XPath against
	 *    elements in the DOM tree
	 *  - Is case insensitive for all elements, not just HTML elements
	 *
	 * The matching element is returned or `null` if no such element is found.
	 * An error is thrown if `xpath` is not a simple XPath.
	 *
	 * @param {string} xpath
	 * @param {Element} root
	 * @return {Element|null}
	 */
	function evaluateSimpleXPath(xpath, root) {
	  const isSimpleXPath = xpath.match(/^(\/[A-Za-z0-9-]+(\[[0-9]+\])?)+$/) !== null;
	  if (!isSimpleXPath) {
	    throw new Error('Expression is not a simple XPath');
	  }
	  const segments = xpath.split('/');
	  let element = root;

	  // Remove leading empty segment. The regex above validates that the XPath
	  // has at least two segments, with the first being empty and the others non-empty.
	  segments.shift();
	  for (let segment of segments) {
	    let elementName;
	    let elementIndex;
	    const separatorPos = segment.indexOf('[');
	    if (separatorPos !== -1) {
	      elementName = segment.slice(0, separatorPos);
	      const indexStr = segment.slice(separatorPos + 1, segment.indexOf(']'));
	      elementIndex = parseInt(indexStr) - 1;
	      if (elementIndex < 0) {
	        return null;
	      }
	    } else {
	      elementName = segment;
	      elementIndex = 0;
	    }
	    const child = nthChildOfType(element, elementName, elementIndex);
	    if (!child) {
	      return null;
	    }
	    element = child;
	  }
	  return element;
	}

	/**
	 * Finds an element node using an XPath relative to `root`
	 *
	 * Example:
	 *   node = nodeFromXPath('/main/article[1]/p[3]', document.body)
	 *
	 * @param {string} xpath
	 * @param {Element} [root]
	 * @return {Node|null}
	 */
	function nodeFromXPath(xpath, root = document.body) {
	  try {
	    return evaluateSimpleXPath(xpath, root);
	  } catch (err) {
	    return document.evaluate('.' + xpath, root,
	    // nb. The `namespaceResolver` and `result` arguments are optional in the spec
	    // but required in Edge Legacy.
	    null /* namespaceResolver */, XPathResult.FIRST_ORDERED_NODE_TYPE, null /* result */).singleNodeValue;
	  }
	}

	/**
	 * This module exports a set of classes for converting between DOM `Range`
	 * objects and different types of selectors. It is mostly a thin wrapper around a
	 * set of anchoring libraries. It serves two main purposes:
	 *
	 *  1. Providing a consistent interface across different types of anchors.
	 *  2. Insulating the rest of the code from API changes in the underlying anchoring
	 *     libraries.
	 */

	/**
	 * @typedef {import('../../types/api').RangeSelector} RangeSelector
	 * @typedef {import('../../types/api').TextPositionSelector} TextPositionSelector
	 * @typedef {import('../../types/api').TextQuoteSelector} TextQuoteSelector
	 */

	/**
	 * Converts between `RangeSelector` selectors and `Range` objects.
	 */
	class RangeAnchor {
	  /**
	   * @param {Node} root - A root element from which to anchor.
	   * @param {Range} range -  A range describing the anchor.
	   */
	  constructor(root, range) {
	    this.root = root;
	    this.range = range;
	  }

	  /**
	   * @param {Node} root -  A root element from which to anchor.
	   * @param {Range} range -  A range describing the anchor.
	   */
	  static fromRange(root, range) {
	    return new RangeAnchor(root, range);
	  }

	  /**
	   * Create an anchor from a serialized `RangeSelector` selector.
	   *
	   * @param {Element} root -  A root element from which to anchor.
	   * @param {RangeSelector} selector
	   */
	  static fromSelector(root, selector) {
	    const startContainer = nodeFromXPath(selector.startContainer, root);
	    if (!startContainer) {
	      throw new Error('Failed to resolve startContainer XPath');
	    }
	    const endContainer = nodeFromXPath(selector.endContainer, root);
	    if (!endContainer) {
	      throw new Error('Failed to resolve endContainer XPath');
	    }
	    const startPos = TextPosition.fromCharOffset(startContainer, selector.startOffset);
	    const endPos = TextPosition.fromCharOffset(endContainer, selector.endOffset);
	    const range = new TextRange(startPos, endPos).toRange();
	    return new RangeAnchor(root, range);
	  }
	  toRange() {
	    return this.range;
	  }

	  /**
	   * 
	   * @param {Element} el 
	   * @returns {string}
	   */
	  selector(el) {
	    let x = el.tagName;
	    if (el.id) {
	      x += '#' + el.id;
	    }
	    el.classList.forEach(c => x += '.' + c);
	    if (el.parentElement) {
	      return this.selector(el.parentElement) + ' > ' + x;
	    }
	    return x;
	  }

	  /**
	   * @return {RangeSelector}
	   */
	  toSelector() {
	    // "Shrink" the range so that it tightly wraps its text. This ensures more
	    // predictable output for a given text selection.
	    const normalizedRange = TextRange.fromRange(this.range).toRange();
	    const textRange = TextRange.fromRange(normalizedRange);
	    const startContainer = xpathFromNode(textRange.start.element, this.root);
	    const endContainer = xpathFromNode(textRange.end.element, this.root);
	    return {
	      type: 'RangeSelector',
	      startContainer,
	      startOffset: textRange.start.offset,
	      endContainer,
	      endOffset: textRange.end.offset,
	      fullCssSelector: this.selector(textRange.start.element)
	    };
	  }
	}

	/**
	 * Converts between `TextPositionSelector` selectors and `Range` objects.
	 */
	class TextPositionAnchor {
	  /**
	   * @param {Element} root
	   * @param {number} start
	   * @param {number} end
	   */
	  constructor(root, start, end) {
	    this.root = root;
	    this.start = start;
	    this.end = end;
	  }

	  /**
	   * @param {Element} root
	   * @param {Range} range
	   */
	  static fromRange(root, range) {
	    const textRange = TextRange.fromRange(range).relativeTo(root);
	    return new TextPositionAnchor(root, textRange.start.offset, textRange.end.offset);
	  }
	  /**
	   * @param {Element} root
	   * @param {TextPositionSelector} selector
	   */
	  static fromSelector(root, selector) {
	    return new TextPositionAnchor(root, selector.start, selector.end);
	  }

	  /**
	   * @return {TextPositionSelector}
	   */
	  toSelector() {
	    return {
	      type: 'TextPositionSelector',
	      start: this.start,
	      end: this.end
	    };
	  }
	  toRange() {
	    return TextRange.fromOffsets(this.root, this.start, this.end).toRange();
	  }
	}

	/**
	 * @typedef QuoteMatchOptions
	 * @prop {number} [hint] - Expected position of match in text. See `matchQuote`.
	 */

	/**
	 * Converts between `TextQuoteSelector` selectors and `Range` objects.
	 */
	class TextQuoteAnchor {
	  /**
	   * @param {Element} root - A root element from which to anchor.
	   * @param {string} exact
	   * @param {object} context
	   *   @param {string} [context.prefix]
	   *   @param {string} [context.suffix]
	   */
	  constructor(root, exact, context = {}) {
	    this.root = root;
	    this.exact = exact;
	    this.context = context;
	  }

	  /**
	   * Create a `TextQuoteAnchor` from a range.
	   *
	   * Will throw if `range` does not contain any text nodes.
	   *
	   * @param {Element} root
	   * @param {Range} range
	   */
	  static fromRange(root, range) {
	    const text = /** @type {string} */root.textContent;
	    const textRange = TextRange.fromRange(range).relativeTo(root);
	    const start = textRange.start.offset;
	    const end = textRange.end.offset;

	    // Number of characters around the quote to capture as context. We currently
	    // always use a fixed amount, but it would be better if this code was aware
	    // of logical boundaries in the document (paragraph, article etc.) to avoid
	    // capturing text unrelated to the quote.
	    //
	    // In regular prose the ideal content would often be the surrounding sentence.
	    // This is a natural unit of meaning which enables displaying quotes in
	    // context even when the document is not available. We could use `Intl.Segmenter`
	    // for this when available.
	    const contextLen = 32;
	    return new TextQuoteAnchor(root, text.slice(start, end), {
	      prefix: text.slice(Math.max(0, start - contextLen), start),
	      suffix: text.slice(end, Math.min(text.length, end + contextLen))
	    });
	  }

	  /**
	   * @param {Element} root
	   * @param {TextQuoteSelector} selector
	   */
	  static fromSelector(root, selector) {
	    const {
	      prefix,
	      suffix
	    } = selector;
	    return new TextQuoteAnchor(root, selector.exact, {
	      prefix,
	      suffix
	    });
	  }

	  /**
	   * @return {TextQuoteSelector}
	   */
	  toSelector() {
	    return {
	      type: 'TextQuoteSelector',
	      exact: this.exact,
	      prefix: this.context.prefix,
	      suffix: this.context.suffix
	    };
	  }

	  /**
	   * @param {QuoteMatchOptions} [options]
	   */
	  toRange(options = {}) {
	    return this.toPositionAnchor(options).toRange();
	  }

	  /**
	   * @param {QuoteMatchOptions} [options]
	   */
	  toPositionAnchor(options = {}) {
	    const text = /** @type {string} */this.root.textContent;
	    const match = matchQuote(text, this.exact, {
	      ...this.context,
	      hint: options.hint
	    });
	    if (!match) {
	      throw new Error('Quote not found');
	    }
	    return new TextPositionAnchor(this.root, match.start, match.end);
	  }
	}

	/**
	 * @typedef {import('../../types/api').RangeSelector} RangeSelector
	 * @typedef {import('../../types/api').Selector} Selector
	 * @typedef {import('../../types/api').TextPositionSelector} TextPositionSelector
	 * @typedef {import('../../types/api').TextQuoteSelector} TextQuoteSelector
	 */

	/**
	 * @param {RangeAnchor|TextPositionAnchor|TextQuoteAnchor} anchor
	 * @param {object} [options]
	 *  @param {number} [options.hint]
	 */
	async function querySelector(anchor, options = {}) {
	  return anchor.toRange(options);
	}

	/**
	 * Anchor a set of selectors.
	 *
	 * This function converts a set of selectors into a document range.
	 * It encapsulates the core anchoring algorithm, using the selectors alone or
	 * in combination to establish the best anchor within the document.
	 *
	 * @param {Element} root - The root element of the anchoring context.
	 * @param {Selector[]} selectors - The selectors to try.
	 * @param {object} [options]
	 *   @param {number} [options.hint]
	 */
	function anchor$1(root, selectors, options = {}) {
	  let position = /** @type {TextPositionSelector|null} */null;
	  let quote = /** @type {TextQuoteSelector|null} */null;
	  let range = /** @type {RangeSelector|null} */null;

	  // Collect all the selectors
	  for (let selector of selectors) {
	    switch (selector.type) {
	      case 'TextPositionSelector':
	        position = selector;
	        options.hint = position.start; // TextQuoteAnchor hint
	        break;
	      case 'TextQuoteSelector':
	        quote = selector;
	        break;
	      case 'RangeSelector':
	        range = selector;
	        break;
	    }
	  }

	  /**
	   * Assert the quote matches the stored quote, if applicable
	   * @param {Range} range
	   */
	  const maybeAssertQuote = range => {
	    var _quote;
	    if ((_quote = quote) !== null && _quote !== void 0 && _quote.exact && range.toString() !== quote.exact) {
	      throw new Error('quote mismatch');
	    } else {
	      return range;
	    }
	  };

	  // From a default of failure, we build up catch clauses to try selectors in
	  // order, from simple to complex.
	  /** @type {Promise<Range>} */
	  let promise = Promise.reject('unable to anchor');
	  if (range) {
	    // Const binding assures TS that it won't be re-assigned when callback runs.
	    const range_ = range;
	    promise = promise.catch(() => {
	      let anchor = RangeAnchor.fromSelector(root, range_);
	      return querySelector(anchor, options).then(maybeAssertQuote);
	    });
	  }
	  if (position) {
	    const position_ = position;
	    promise = promise.catch(() => {
	      let anchor = TextPositionAnchor.fromSelector(root, position_);
	      return querySelector(anchor, options).then(maybeAssertQuote);
	    });
	  }
	  if (quote) {
	    const quote_ = quote;
	    promise = promise.catch(() => {
	      let anchor = TextQuoteAnchor.fromSelector(root, quote_);
	      return querySelector(anchor, options);
	    });
	  }
	  return promise;
	}

	/**
	 * @param {Element} root
	 * @param {Range} range
	 */
	function describe$1(root, range) {
	  const types = [RangeAnchor, TextPositionAnchor, TextQuoteAnchor];
	  const result = [];
	  for (let type of types) {
	    try {
	      const anchor = type.fromRange(root, range);
	      result.push(anchor.toSelector());
	    } catch (error) {
	      continue;
	    }
	  }
	  return result;
	}

	/**
	 * Return a normalized version of a URI.
	 *
	 * This makes it absolute and strips the fragment identifier.
	 *
	 * @param {string} uri - Relative or absolute URL
	 * @param {string} [base] - Base URL to resolve relative to. Defaults to
	 *   the document's base URL.
	 */
	function normalizeURI(uri, base = document.baseURI) {
	  const absUrl = new URL(uri, base).href;

	  // Remove the fragment identifier.
	  // This is done on the serialized URL rather than modifying `url.hash` due to
	  // a bug in Safari.
	  // See https://github.com/hypothesis/h/issues/3471#issuecomment-226713750
	  return absUrl.toString().replace(/#.*/, '');
	}

	/*
	 ** Adapted from:
	 ** https://github.com/openannotation/annotator/blob/v1.2.x/src/plugin/document.coffee
	 **
	 ** Annotator v1.2.10
	 ** https://github.com/openannotation/annotator
	 **
	 ** Copyright 2015, the Annotator project contributors.
	 ** Dual licensed under the MIT and GPLv3 licenses.
	 ** https://github.com/openannotation/annotator/blob/master/LICENSE
	 */

	/**
	 * @typedef Link
	 * @prop {string} link.href
	 * @prop {string} [link.rel]
	 * @prop {string} [link.type]
	 */

	/**
	 * Extension of the `Metadata` type with non-optional fields for `dc`, `eprints` etc.
	 *
	 * @typedef HTMLDocumentMetadata
	 * @prop {string} title
	 * @prop {Link[]} link
	 * @prop {Record<string, string[]>} dc
	 * @prop {Record<string, string[]>} eprints
	 * @prop {Record<string, string[]>} facebook
	 * @prop {Record<string, string[]>} highwire
	 * @prop {Record<string, string[]>} prism
	 * @prop {Record<string, string[]>} twitter
	 * @prop {string} [favicon]
	 * @prop {string} [documentFingerprint]
	 */

	/**
	 * HTMLMetadata reads metadata/links from the current HTML document.
	 */
	class HTMLMetadata {
	  /**
	   * @param {object} [options]
	   *   @param {Document} [options.document]
	   */
	  constructor(options = {}) {
	    this.document = options.document || document;
	  }

	  /**
	   * Returns the primary URI for the document being annotated
	   *
	   * @return {string}
	   */
	  uri() {
	    let uri = decodeURIComponent(this._getDocumentHref());

	    // Use the `link[rel=canonical]` element's href as the URL if present.
	    const links = this._getLinks();
	    for (let link of links) {
	      if (link.rel === 'canonical') {
	        uri = link.href;
	      }
	    }
	    return uri;
	  }

	  /**
	   * Return metadata for the current page.
	   *
	   * @return {HTMLDocumentMetadata}
	   */
	  getDocumentMetadata() {
	    /** @type {HTMLDocumentMetadata} */
	    const metadata = {
	      title: document.title,
	      link: [],
	      dc: this._getMetaTags('name', 'dc.'),
	      eprints: this._getMetaTags('name', 'eprints.'),
	      facebook: this._getMetaTags('property', 'og:'),
	      highwire: this._getMetaTags('name', 'citation_'),
	      prism: this._getMetaTags('name', 'prism.'),
	      twitter: this._getMetaTags('name', 'twitter:')
	    };
	    const favicon = this._getFavicon();
	    if (favicon) {
	      metadata.favicon = favicon;
	    }
	    metadata.title = this._getTitle(metadata);
	    metadata.link = this._getLinks(metadata);
	    const dcLink = metadata.link.find(link => link.href.startsWith('urn:x-dc'));
	    if (dcLink) {
	      metadata.documentFingerprint = dcLink.href;
	    }
	    return metadata;
	  }

	  /**
	   * Return an array of all the `content` values of `<meta>` tags on the page
	   * where the value of the attribute begins with `<prefix>`.
	   *
	   * @param {string} attribute
	   * @param {string} prefix - it is interpreted as a regex
	   * @return {Record<string,string[]>}
	   */
	  _getMetaTags(attribute, prefix) {
	    /** @type {Record<string,string[]>} */
	    const tags = {};
	    for (let meta of Array.from(this.document.querySelectorAll('meta'))) {
	      const name = meta.getAttribute(attribute);
	      const {
	        content
	      } = meta;
	      if (name && content) {
	        const match = name.match(RegExp(`^${prefix}(.+)$`, 'i'));
	        if (match) {
	          const key = match[1].toLowerCase();
	          if (tags[key]) {
	            tags[key].push(content);
	          } else {
	            tags[key] = [content];
	          }
	        }
	      }
	    }
	    return tags;
	  }

	  /** @param {HTMLDocumentMetadata} metadata */
	  _getTitle(metadata) {
	    if (metadata.highwire.title) {
	      return metadata.highwire.title[0];
	    } else if (metadata.eprints.title) {
	      return metadata.eprints.title[0];
	    } else if (metadata.prism.title) {
	      return metadata.prism.title[0];
	    } else if (metadata.facebook.title) {
	      return metadata.facebook.title[0];
	    } else if (metadata.twitter.title) {
	      return metadata.twitter.title[0];
	    } else if (metadata.dc.title) {
	      return metadata.dc.title[0];
	    } else {
	      return this.document.title;
	    }
	  }

	  /**
	   * Get document URIs from `<link>` and `<meta>` elements on the page.
	   *
	   * @param {Pick<HTMLDocumentMetadata, 'highwire'|'dc'>} [metadata] -
	   *   Dublin Core and Highwire metadata parsed from `<meta>` tags.
	   * @return {Link[]}
	   */
	  _getLinks(metadata = {
	    dc: {},
	    highwire: {}
	  }) {
	    /** @type {Link[]} */
	    const links = [{
	      href: this._getDocumentHref()
	    }];

	    // Extract links from `<link>` tags with certain `rel` values.
	    const linkElements = Array.from(this.document.querySelectorAll('link'));
	    for (let link of linkElements) {
	      if (!['alternate', 'canonical', 'bookmark', 'shortlink'].includes(link.rel)) {
	        continue;
	      }
	      if (link.rel === 'alternate') {
	        // Ignore RSS feed links.
	        if (link.type && link.type.match(/^application\/(rss|atom)\+xml/)) {
	          continue;
	        }
	        // Ignore alternate languages.
	        if (link.hreflang) {
	          continue;
	        }
	      }
	      try {
	        const href = this._absoluteUrl(link.href);
	        links.push({
	          href,
	          rel: link.rel,
	          type: link.type
	        });
	      } catch (e) {
	        // Ignore URIs which cannot be parsed.
	      }
	    }

	    // Look for links in scholar metadata
	    for (let name of Object.keys(metadata.highwire)) {
	      const values = metadata.highwire[name];
	      if (name === 'pdf_url') {
	        for (let url of values) {
	          try {
	            links.push({
	              href: this._absoluteUrl(url),
	              type: 'application/pdf'
	            });
	          } catch (e) {
	            // Ignore URIs which cannot be parsed.
	          }
	        }
	      }

	      // Kind of a hack to express DOI identifiers as links but it's a
	      // convenient place to look them up later, and somewhat sane since
	      // they don't have a type.
	      if (name === 'doi') {
	        for (let doi of values) {
	          if (doi.slice(0, 4) !== 'doi:') {
	            doi = `doi:${doi}`;
	          }
	          links.push({
	            href: doi
	          });
	        }
	      }
	    }

	    // Look for links in Dublin Core data
	    for (let name of Object.keys(metadata.dc)) {
	      const values = metadata.dc[name];
	      if (name === 'identifier') {
	        for (let id of values) {
	          if (id.slice(0, 4) === 'doi:') {
	            links.push({
	              href: id
	            });
	          }
	        }
	      }
	    }

	    // Look for a link to identify the resource in Dublin Core metadata
	    const dcRelationValues = metadata.dc['relation.ispartof'];
	    const dcIdentifierValues = metadata.dc.identifier;
	    if (dcRelationValues && dcIdentifierValues) {
	      const dcUrnRelationComponent = dcRelationValues[dcRelationValues.length - 1];
	      const dcUrnIdentifierComponent = dcIdentifierValues[dcIdentifierValues.length - 1];
	      const dcUrn = 'urn:x-dc:' + encodeURIComponent(dcUrnRelationComponent) + '/' + encodeURIComponent(dcUrnIdentifierComponent);
	      links.push({
	        href: dcUrn
	      });
	    }
	    return links;
	  }
	  _getFavicon() {
	    let favicon = null;
	    for (let link of Array.from(this.document.querySelectorAll('link'))) {
	      if (['shortcut icon', 'icon'].includes(link.rel)) {
	        try {
	          favicon = this._absoluteUrl(link.href);
	        } catch (e) {
	          // Ignore URIs which cannot be parsed.
	        }
	      }
	    }
	    return favicon;
	  }

	  /**
	   * Convert a possibly relative URI to an absolute one. This will throw an
	   * exception if the URL cannot be parsed.
	   *
	   * @param {string} url
	   */
	  _absoluteUrl(url) {
	    return normalizeURI(url, this.document.baseURI);
	  }

	  // Get the true URI record when it's masked via a different protocol.
	  // This happens when an href is set with a uri using the 'blob:' protocol
	  // but the document can set a different uri through a <base> tag.
	  _getDocumentHref() {
	    const {
	      href
	    } = this.document.location;
	    const allowedSchemes = ['http:', 'https:', 'file:'];

	    // Use the current document location if it has a recognized scheme.
	    const scheme = new URL(href).protocol;
	    if (allowedSchemes.includes(scheme)) {
	      return href;
	    }

	    // Otherwise, try using the location specified by the <base> element.
	    if (this.document.baseURI && allowedSchemes.includes(new URL(this.document.baseURI).protocol)) {
	      return this.document.baseURI;
	    }

	    // Fall back to returning the document URI, even though the scheme is not
	    // in the allowed list.
	    return href;
	  }
	}

	/**
	 * Return the intersection of two rects.
	 *
	 * @param {DOMRect} rectA
	 * @param {DOMRect} rectB
	 */
	function intersectRects(rectA, rectB) {
	  const left = Math.max(rectA.left, rectB.left);
	  const right = Math.min(rectA.right, rectB.right);
	  const top = Math.max(rectA.top, rectB.top);
	  const bottom = Math.min(rectA.bottom, rectB.bottom);
	  return new DOMRect(left, top, right - left, bottom - top);
	}

	/**
	 * Return `true` if a rect is _empty_.
	 *
	 * An empty rect is defined as one with zero or negative width/height, eg.
	 * as returned by `new DOMRect()` or `Element.getBoundingClientRect()` for a
	 * hidden element.
	 *
	 * @param {DOMRect} rect
	 */
	function rectIsEmpty(rect) {
	  return rect.width <= 0 || rect.height <= 0;
	}

	/**
	 * Return true if the 1D lines a-b and c-d overlap (ie. the length of their
	 * intersection is non-zero).
	 *
	 * For example, the following lines overlap:
	 *
	 *   a----b
	 *      c------d
	 *
	 * The inputs must be normalized such that b >= a and d >= c.
	 *
	 * @param {number} a
	 * @param {number} b
	 * @param {number} c
	 * @param {number} d
	 */
	function linesOverlap(a, b, c, d) {
	  const maxStart = Math.max(a, c);
	  const minEnd = Math.min(b, d);
	  return maxStart < minEnd;
	}

	/**
	 * Return true if the intersection of `rectB` and `rectA` is non-empty.
	 *
	 * @param {DOMRect} rectA
	 * @param {DOMRect} rectB
	 */
	function rectIntersects(rectA, rectB) {
	  if (rectIsEmpty(rectA) || rectIsEmpty(rectB)) {
	    return false;
	  }
	  return linesOverlap(rectA.left, rectA.right, rectB.left, rectB.right) && linesOverlap(rectA.top, rectA.bottom, rectB.top, rectB.bottom);
	}

	/**
	 * Return true if `rectB` is fully contained within `rectA`
	 *
	 * @param {DOMRect} rectA
	 * @param {DOMRect} rectB
	 */
	function rectContains(rectA, rectB) {
	  if (rectIsEmpty(rectA) || rectIsEmpty(rectB)) {
	    return false;
	  }
	  return rectB.left >= rectA.left && rectB.right <= rectA.right && rectB.top >= rectA.top && rectB.bottom <= rectA.bottom;
	}

	/**
	 * Return true if two rects overlap vertically.
	 *
	 * @param {DOMRect} a
	 * @param {DOMRect} b
	 */
	function rectsOverlapVertically(a, b) {
	  return linesOverlap(a.top, a.bottom, b.top, b.bottom);
	}

	/**
	 * Return true if two rects overlap horizontally.
	 *
	 * @param {DOMRect} a
	 * @param {DOMRect} b
	 */
	function rectsOverlapHorizontally(a, b) {
	  return linesOverlap(a.left, a.right, b.left, b.right);
	}

	/**
	 * Return the union of two rects.
	 *
	 * The union of an empty rect (see {@link rectIsEmpty}) with a non-empty rect is
	 * defined to be the non-empty rect. The union of two empty rects is an empty
	 * rect.
	 *
	 * @param {DOMRect} a
	 * @param {DOMRect} b
	 */
	function unionRects(a, b) {
	  if (rectIsEmpty(a)) {
	    return b;
	  } else if (rectIsEmpty(b)) {
	    return a;
	  }
	  const left = Math.min(a.left, b.left);
	  const top = Math.min(a.top, b.top);
	  const right = Math.max(a.right, b.right);
	  const bottom = Math.max(a.bottom, b.bottom);
	  return new DOMRect(left, top, right - left, bottom - top);
	}

	/**
	 * Return the point at the center of a rect.
	 *
	 * @param {DOMRect} rect
	 */
	function rectCenter(rect) {
	  return new DOMPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
	}

	/**
	 * CSS selectors used to find elements that are considered potentially part
	 * of the main content of a page.
	 */
	const contentSelectors = ['p',
	// Paragraphs in VitalSource "Great Book" format ebooks.
	'.para'];

	/**
	 * Attempt to guess the region of the page that contains the main content.
	 *
	 * @param {Element} root
	 * @return {{ left: number, right: number }|null} -
	 *   The left/right content margins or `null` if they could not be determined
	 */
	function guessMainContentArea(root) {
	  // Maps of (margin X coord, votes) for margin positions.

	  /** @type {Map<number,number>} */
	  const leftMarginVotes = new Map();

	  /** @type {Map<number,number>} */
	  const rightMarginVotes = new Map();

	  // Gather data about the paragraphs of text in the document.
	  //
	  // In future we might want to expand this to consider other text containers,
	  // since some pages, especially eg. in ebooks, may not have any paragraphs
	  // (eg. instead they may only contain tables or lists or headings).
	  const contentSelector = contentSelectors.join(',');
	  const paragraphs = Array.from(root.querySelectorAll(contentSelector)).map(p => {
	    // Gather some data about them.
	    const rect = p.getBoundingClientRect();
	    const textLength = /** @type {string} */p.textContent.length;
	    return {
	      rect,
	      textLength
	    };
	  }).filter(({
	    rect
	  }) => {
	    // Filter out hidden paragraphs
	    return rect.width > 0 && rect.height > 0;
	  })
	  // Select the paragraphs containing the most text.
	  .sort((a, b) => b.textLength - a.textLength).slice(0, 15);

	  // Let these paragraphs "vote" for what the left and right margins of the
	  // main content area in the document are.
	  paragraphs.forEach(({
	    rect
	  }) => {
	    var _leftMarginVotes$get, _rightMarginVotes$get;
	    let leftVotes = (_leftMarginVotes$get = leftMarginVotes.get(rect.left)) !== null && _leftMarginVotes$get !== void 0 ? _leftMarginVotes$get : 0;
	    leftVotes += 1;
	    leftMarginVotes.set(rect.left, leftVotes);
	    let rightVotes = (_rightMarginVotes$get = rightMarginVotes.get(rect.right)) !== null && _rightMarginVotes$get !== void 0 ? _rightMarginVotes$get : 0;
	    rightVotes += 1;
	    rightMarginVotes.set(rect.right, rightVotes);
	  });

	  // Find the margin values with the most votes.
	  if (leftMarginVotes.size === 0 || rightMarginVotes.size === 0) {
	    return null;
	  }
	  const leftMargin = [...leftMarginVotes.entries()].sort((a, b) => b[1] - a[1]);
	  const rightMargin = [...rightMarginVotes.entries()].sort((a, b) => b[1] - a[1]);
	  const [leftPos] = leftMargin[0];
	  const [rightPos] = rightMargin[0];
	  return {
	    left: leftPos,
	    right: rightPos
	  };
	}

	/** @type {Range} */
	let textRectRange;

	/**
	 * Return the viewport-relative rect occupied by part of a text node.
	 *
	 * @param {Text} text
	 * @param {number} start
	 * @param {number} end
	 */
	function textRect(text, start = 0, end = text.data.length) {
	  if (!textRectRange) {
	    // Allocate a range only on the first call to avoid the overhead of
	    // constructing and maintaining a large number of live ranges.
	    textRectRange = document.createRange();
	  }
	  textRectRange.setStart(text, start);
	  textRectRange.setEnd(text, end);
	  return textRectRange.getBoundingClientRect();
	}

	/** @param {Element} element */
	function hasFixedPosition(element) {
	  switch (getComputedStyle(element).position) {
	    case 'fixed':
	    case 'sticky':
	      return true;
	    default:
	      return false;
	  }
	}

	/**
	 * Return the bounding rect that contains the element's content. Unlike
	 * `Element.getBoundingClientRect`, this includes content which overflows
	 * the element's specified size.
	 *
	 * @param {Element} element
	 */
	function elementContentRect(element) {
	  const rect = element.getBoundingClientRect();
	  rect.x -= element.scrollLeft;
	  rect.y -= element.scrollTop;
	  rect.height = Math.max(rect.height, element.scrollHeight);
	  rect.width = Math.max(rect.width, element.scrollWidth);
	  return rect;
	}

	/**
	 * Yield all the text node descendants of `root` that intersect `rect`.
	 *
	 * @param {Element} root
	 * @param {DOMRect} rect
	 * @param {(el: Element) => boolean} shouldVisit - Optional filter that determines
	 *   whether to visit a subtree
	 * @return {Generator<Text>}
	 */
	function* textNodesInRect(root, rect, shouldVisit = () => true) {
	  /** @type {Node|null} */
	  let node = root.firstChild;
	  while (node) {
	    if (node.nodeType === Node.ELEMENT_NODE) {
	      const element = /** @type {Element} */node;
	      const contentIntersectsRect = rectIntersects(elementContentRect(element), rect);

	      // Only examine subtrees which are visible.
	      if (shouldVisit(element) && contentIntersectsRect) {
	        yield* textNodesInRect(element, rect, shouldVisit);
	      }
	    } else if (node.nodeType === Node.TEXT_NODE) {
	      const text = /** @type {Text} */node;

	      // Skip over text nodes which are entirely outside the viewport or empty.
	      if (rectIntersects(textRect(text), rect)) {
	        yield text;
	      }
	    }
	    node = node.nextSibling;
	  }
	}

	/**
	 * Find content within an element to use as an anchor when applying a layout
	 * change to the document.
	 *
	 * @param {Element} root
	 * @param {DOMRect} viewport
	 * @return {Range|null} - Range to use as an anchor or `null` if a suitable
	 *   range could not be found
	 */
	function getScrollAnchor(root, viewport) {
	  // Range representing the content whose position within the viewport we will
	  // try to maintain after running the callback.
	  let anchorRange = /** @type {Range|null} */null;

	  // Find the first word (non-whitespace substring of a text node) that is fully
	  // visible in the viewport.

	  // Text inside fixed-position elements is ignored because its position won't
	  // be affected by a layout change and so it makes a poor scroll anchor.
	  /** @param {Element} el */
	  const shouldVisit = el => !hasFixedPosition(el);
	  textNodeLoop: for (let textNode of textNodesInRect(root, viewport, shouldVisit)) {
	    let textLen = 0;

	    // Visit all the non-whitespace substrings of the text node.
	    for (let word of textNode.data.split(/\b/)) {
	      if (/\S/.test(word)) {
	        const start = textLen;
	        const end = textLen + word.length;
	        const wordBox = textRect(textNode, start, end);
	        if (rectContains(viewport, wordBox)) {
	          anchorRange = document.createRange();
	          anchorRange.setStart(textNode, start);
	          anchorRange.setEnd(textNode, end);
	          break textNodeLoop;
	        }
	      }
	      textLen += word.length;
	    }
	  }
	  return anchorRange;
	}

	/**
	 * Apply a layout change to the document and preserve the scroll position.
	 *
	 * This utility selects part of the content in the viewport as an _anchor_
	 * and tries to preserve the position of this content within the viewport
	 * after the callback is invoked.
	 *
	 * @param {() => void} callback - Callback that will apply the layout change
	 * @param {Element} [scrollRoot]
	 * @param {DOMRect} [viewport] - Area to consider "in the viewport". Defaults to
	 *   the viewport of the current window.
	 * @return {number} - Amount by which the scroll position was adjusted to keep
	 *   the anchored content in view
	 */
	function preserveScrollPosition(callback, /* istanbul ignore next */
	scrollRoot = document.documentElement, /* istanbul ignore next */
	viewport = new DOMRect(0, 0, window.innerWidth, window.innerHeight)) {
	  const anchor = getScrollAnchor(scrollRoot, viewport);
	  if (!anchor) {
	    callback();
	    return 0;
	  }
	  const anchorTop = anchor.getBoundingClientRect().top;
	  callback();
	  const newAnchorTop = anchor.getBoundingClientRect().top;

	  // Determine how far we scrolled as a result of the layout change.
	  // This will be positive if the anchor element moved down or negative if it moved up.
	  const scrollDelta = newAnchorTop - anchorTop;
	  scrollRoot.scrollTop += scrollDelta;
	  return scrollDelta;
	}

	/**
	 * Monkey-patch an object to observe calls to a method.
	 *
	 * The `handler` is not invoked if the observed method throws.
	 *
	 * @template {any} T
	 * @param {T} object
	 * @param {keyof T} method
	 * @param {(...args: unknown[]) => void} handler - Handler that is invoked
	 *   after the monitored method has been called.
	 * @return {() => void} Callback that removes the observer and restores `object[method]`.
	 */
	function observeCalls(object, method, handler) {
	  const origHandler = object[method];

	  /* istanbul ignore next */
	  if (typeof origHandler !== 'function') {
	    throw new Error('Can only intercept functions');
	  }

	  /** @param {unknown[]} args */
	  const wrapper = (...args) => {
	    const result = origHandler.call(object, ...args);
	    handler(...args);
	    return result;
	  };
	  object[method] = /** @type {any} */wrapper;
	  return () => {
	    object[method] = origHandler;
	  };
	}

	/** @param {string} url */
	function stripFragment(url) {
	  return url.replace(/#.*/, '');
	}

	/**
	 * Utility for detecting client-side navigations of an HTML document.
	 *
	 * This uses the Navigation API [1] if available, or falls back to
	 * monkey-patching the History API [2] otherwise.
	 *
	 * Only navigations which change the path or query params are reported. URL
	 * updates which change only the hash fragment are assumed to be navigations to
	 * different parts of the same logical document. Also Hypothesis in general
	 * ignores the hash fragment when comparing URLs.
	 *
	 * [1] https://wicg.github.io/navigation-api/
	 * [2] https://developer.mozilla.org/en-US/docs/Web/API/History
	 */
	class NavigationObserver {
	  /**
	   * Begin observing navigation changes.
	   *
	   * @param {(url: string) => void} onNavigate - Callback invoked when a navigation
	   *   occurs. The callback is fired after the navigation has completed and the
	   *   new URL is reflected in `location.href`.
	   * @param {() => string} getLocation - Test seam that returns the current URL
	   */
	  constructor(onNavigate, /* istanbul ignore next - default overridden in tests */
	  getLocation = () => location.href) {
	    this._listeners = new ListenerCollection$1();
	    let lastURL = getLocation();
	    const checkForURLChange = (newURL = getLocation()) => {
	      if (stripFragment(lastURL) !== stripFragment(newURL)) {
	        lastURL = newURL;
	        onNavigate(newURL);
	      }
	    };

	    // @ts-expect-error - TS is missing Navigation API types.
	    const navigation = window.navigation;
	    if (navigation) {
	      this._listeners.add(navigation, 'navigatesuccess', () => checkForURLChange());
	    } else {
	      const unpatchers = [observeCalls(window.history, 'pushState', () => checkForURLChange()), observeCalls(window.history, 'replaceState', () => checkForURLChange())];
	      this._unpatchHistory = () => unpatchers.forEach(cleanup => cleanup());
	      this._listeners.add(window, 'popstate', () => checkForURLChange());
	    }
	  }

	  /** Stop observing navigation changes. */
	  disconnect() {
	    var _this$_unpatchHistory;
	    (_this$_unpatchHistory = this._unpatchHistory) === null || _this$_unpatchHistory === void 0 ? void 0 : _this$_unpatchHistory.call(this);
	    this._listeners.removeAll();
	  }
	}

	var COMPLETE = 'complete',
	    CANCELED = 'canceled';

	function raf(task){
	    if('requestAnimationFrame' in window){
	        return window.requestAnimationFrame(task);
	    }

	    setTimeout(task, 16);
	}

	function setElementScroll(element, x, y){
	    Math.max(0, x);
	    Math.max(0, y);

	    if(element.self === element){
	        element.scrollTo(x, y);
	    }else {
	        element.scrollLeft = x;
	        element.scrollTop = y;
	    }
	}

	function getTargetScrollLocation(scrollSettings, parent){
	    var align = scrollSettings.align,
	        target = scrollSettings.target,
	        targetPosition = target.getBoundingClientRect(),
	        parentPosition,
	        x,
	        y,
	        differenceX,
	        differenceY,
	        targetWidth,
	        targetHeight,
	        leftAlign = align && align.left != null ? align.left : 0.5,
	        topAlign = align && align.top != null ? align.top : 0.5,
	        leftOffset = align && align.leftOffset != null ? align.leftOffset : 0,
	        topOffset = align && align.topOffset != null ? align.topOffset : 0,
	        leftScalar = leftAlign,
	        topScalar = topAlign;

	    if(scrollSettings.isWindow(parent)){
	        targetWidth = Math.min(targetPosition.width, parent.innerWidth);
	        targetHeight = Math.min(targetPosition.height, parent.innerHeight);
	        x = targetPosition.left + parent.pageXOffset - parent.innerWidth * leftScalar + targetWidth * leftScalar;
	        y = targetPosition.top + parent.pageYOffset - parent.innerHeight * topScalar + targetHeight * topScalar;
	        x -= leftOffset;
	        y -= topOffset;
	        x = scrollSettings.align.lockX ? parent.pageXOffset : x;
	        y = scrollSettings.align.lockY ? parent.pageYOffset : y;
	        differenceX = x - parent.pageXOffset;
	        differenceY = y - parent.pageYOffset;
	    }else {
	        targetWidth = targetPosition.width;
	        targetHeight = targetPosition.height;
	        parentPosition = parent.getBoundingClientRect();
	        var offsetLeft = targetPosition.left - (parentPosition.left - parent.scrollLeft);
	        var offsetTop = targetPosition.top - (parentPosition.top - parent.scrollTop);
	        x = offsetLeft + (targetWidth * leftScalar) - parent.clientWidth * leftScalar;
	        y = offsetTop + (targetHeight * topScalar) - parent.clientHeight * topScalar;
	        x -= leftOffset;
	        y -= topOffset;
	        x = Math.max(Math.min(x, parent.scrollWidth - parent.clientWidth), 0);
	        y = Math.max(Math.min(y, parent.scrollHeight - parent.clientHeight), 0);
	        x = scrollSettings.align.lockX ? parent.scrollLeft : x;
	        y = scrollSettings.align.lockY ? parent.scrollTop : y;
	        differenceX = x - parent.scrollLeft;
	        differenceY = y - parent.scrollTop;
	    }

	    return {
	        x: x,
	        y: y,
	        differenceX: differenceX,
	        differenceY: differenceY
	    };
	}

	function animate(parent){
	    var scrollSettings = parent._scrollSettings;

	    if(!scrollSettings){
	        return;
	    }

	    var maxSynchronousAlignments = scrollSettings.maxSynchronousAlignments;

	    var location = getTargetScrollLocation(scrollSettings, parent),
	        time = Date.now() - scrollSettings.startTime,
	        timeValue = Math.min(1 / scrollSettings.time * time, 1);

	    if(scrollSettings.endIterations >= maxSynchronousAlignments){
	        setElementScroll(parent, location.x, location.y);
	        parent._scrollSettings = null;
	        return scrollSettings.end(COMPLETE);
	    }

	    var easeValue = 1 - scrollSettings.ease(timeValue);

	    setElementScroll(parent,
	        location.x - location.differenceX * easeValue,
	        location.y - location.differenceY * easeValue
	    );

	    if(time >= scrollSettings.time){
	        scrollSettings.endIterations++;
	        // Align ancestor synchronously
	        scrollSettings.scrollAncestor && animate(scrollSettings.scrollAncestor);
	        animate(parent);
	        return;
	    }

	    raf(animate.bind(null, parent));
	}

	function defaultIsWindow(target){
	    return target.self === target
	}

	function transitionScrollTo(target, parent, settings, scrollAncestor, callback){
	    var idle = !parent._scrollSettings,
	        lastSettings = parent._scrollSettings,
	        now = Date.now(),
	        cancelHandler,
	        passiveOptions = { passive: true };

	    if(lastSettings){
	        lastSettings.end(CANCELED);
	    }

	    function end(endType){
	        parent._scrollSettings = null;

	        if(parent.parentElement && parent.parentElement._scrollSettings){
	            parent.parentElement._scrollSettings.end(endType);
	        }

	        if(settings.debug){
	            console.log('Scrolling ended with type', endType, 'for', parent);
	        }

	        callback(endType);
	        if(cancelHandler){
	            parent.removeEventListener('touchstart', cancelHandler, passiveOptions);
	            parent.removeEventListener('wheel', cancelHandler, passiveOptions);
	        }
	    }

	    var maxSynchronousAlignments = settings.maxSynchronousAlignments;

	    if(maxSynchronousAlignments == null){
	        maxSynchronousAlignments = 3;
	    }

	    parent._scrollSettings = {
	        startTime: now,
	        endIterations: 0,
	        target: target,
	        time: settings.time,
	        ease: settings.ease,
	        align: settings.align,
	        isWindow: settings.isWindow || defaultIsWindow,
	        maxSynchronousAlignments: maxSynchronousAlignments,
	        end: end,
	        scrollAncestor
	    };

	    if(!('cancellable' in settings) || settings.cancellable){
	        cancelHandler = end.bind(null, CANCELED);
	        parent.addEventListener('touchstart', cancelHandler, passiveOptions);
	        parent.addEventListener('wheel', cancelHandler, passiveOptions);
	    }

	    if(idle){
	        animate(parent);
	    }

	    return cancelHandler
	}

	function defaultIsScrollable(element){
	    return (
	        'pageXOffset' in element ||
	        (
	            element.scrollHeight !== element.clientHeight ||
	            element.scrollWidth !== element.clientWidth
	        ) &&
	        getComputedStyle(element).overflow !== 'hidden'
	    );
	}

	function defaultValidTarget(){
	    return true;
	}

	function findParentElement(el){
	    if (el.assignedSlot) {
	        return findParentElement(el.assignedSlot);
	    }

	    if (el.parentElement) {
	        if(el.parentElement.tagName.toLowerCase() === 'body'){
	            return el.parentElement.ownerDocument.defaultView || el.parentElement.ownerDocument.ownerWindow;
	        }
	        return el.parentElement;
	    }

	    if (el.getRootNode){
	        var parent = el.getRootNode();
	        if(parent.nodeType === 11) {
	            return parent.host;
	        }
	    }
	}

	var scrollIntoView = function(target, settings, callback){
	    if(!target){
	        return;
	    }

	    if(typeof settings === 'function'){
	        callback = settings;
	        settings = null;
	    }

	    if(!settings){
	        settings = {};
	    }

	    settings.time = isNaN(settings.time) ? 1000 : settings.time;
	    settings.ease = settings.ease || function(v){return 1 - Math.pow(1 - v, v / 2);};
	    settings.align = settings.align || {};

	    var parent = findParentElement(target),
	        parents = 1;

	    function done(endType){
	        parents--;
	        if(!parents){
	            callback && callback(endType);
	        }
	    }

	    var validTarget = settings.validTarget || defaultValidTarget;
	    var isScrollable = settings.isScrollable;

	    if(settings.debug){
	        console.log('About to scroll to', target);

	        if(!parent){
	            console.error('Target did not have a parent, is it mounted in the DOM?');
	        }
	    }

	    var scrollingElements = [];

	    while(parent){
	        if(settings.debug){
	            console.log('Scrolling parent node', parent);
	        }

	        if(validTarget(parent, parents) && (isScrollable ? isScrollable(parent, defaultIsScrollable) : defaultIsScrollable(parent))){
	            parents++;
	            scrollingElements.push(parent);
	        }

	        parent = findParentElement(parent);

	        if(!parent){
	            done(COMPLETE);
	            break;
	        }
	    }

	    return scrollingElements.reduce((cancel, parent, index) => transitionScrollTo(target, parent, settings, scrollingElements[index + 1], done), null);
	};

	/**
	 * Return a promise that resolves on the next animation frame.
	 */
	function nextAnimationFrame() {
	  return new Promise(resolve => {
	    requestAnimationFrame(resolve);
	  });
	}

	/**
	 * Linearly interpolate between two values.
	 *
	 * @param {number} a
	 * @param {number} b
	 * @param {number} fraction - Value in [0, 1]
	 */
	function interpolate(a, b, fraction) {
	  return a + fraction * (b - a);
	}

	/**
	 * Return the offset of `element` from the top of a positioned ancestor `parent`.
	 *
	 * @param {HTMLElement} element
	 * @param {HTMLElement} parent - Positioned ancestor of `element`
	 * @return {number}
	 */
	function offsetRelativeTo(element, parent) {
	  let offset = 0;
	  while (element !== parent && parent.contains(element)) {
	    offset += element.offsetTop;
	    element = /** @type {HTMLElement} */element.offsetParent;
	  }
	  return offset;
	}

	/**
	 * Scroll `element` until its `scrollTop` offset reaches a target value.
	 *
	 * @param {Element} element - Container element to scroll
	 * @param {number} offset - Target value for the scroll offset
	 * @param {object} options
	 *   @param {number} [options.maxDuration]
	 * @return {Promise<void>} - A promise that resolves once the scroll animation
	 *   is complete
	 */
	async function scrollElement(element, offset, /* istanbul ignore next - defaults are overridden in tests */
	{
	  maxDuration = 500
	} = {}) {
	  const startOffset = element.scrollTop;
	  const endOffset = offset;
	  const scrollStart = Date.now();

	  // Choose a scroll duration proportional to the scroll distance, but capped
	  // to avoid it being too slow.
	  const pixelsPerMs = 3;
	  const scrollDuration = Math.min(Math.abs(endOffset - startOffset) / pixelsPerMs, maxDuration);
	  let scrollFraction = 0.0;
	  while (scrollFraction < 1.0) {
	    await nextAnimationFrame();
	    scrollFraction = Math.min(1.0, (Date.now() - scrollStart) / scrollDuration);
	    element.scrollTop = interpolate(startOffset, endOffset, scrollFraction);
	  }
	}

	/**
	 * Smoothly scroll an element into view.
	 *
	 * @param {HTMLElement} element
	 * @param {object} options
	 *   @param {number} [options.maxDuration]
	 */
	async function scrollElementIntoView(element, /* istanbul ignore next - defaults are overridden in tests */
	{
	  maxDuration = 500
	} = {}) {
	  // Make the body's `tagName` return an upper-case string in XHTML documents
	  // like it does in HTML documents. This is a workaround for
	  // `scrollIntoView`'s detection of the <body> element. See
	  // https://github.com/KoryNunn/scroll-into-view/issues/101.
	  const body = element.closest('body');
	  if (body && body.tagName !== 'BODY') {
	    Object.defineProperty(body, 'tagName', {
	      value: 'BODY',
	      configurable: true
	    });
	  }
	  await new Promise(resolve => scrollIntoView(element, {
	    time: maxDuration
	  }, resolve));
	}

	/**
	 * @typedef {import('../../types/annotator').Anchor} Anchor
	 * @typedef {import('../../types/annotator').Annotator} Annotator
	 * @typedef {import('../../types/annotator').FeatureFlags} FeatureFlags
	 * @typedef {import('../../types/annotator').Integration} Integration
	 * @typedef {import('../../types/annotator').SidebarLayout} SidebarLayout
	 */

	// When activating side-by-side mode, make sure there is at least this amount
	// of space (in pixels) left for the document's content. Any narrower and the
	// content line lengths and scale are too short to be readable.
	const MIN_HTML_WIDTH = 480;

	/**
	 * Document type integration for ordinary web pages.
	 *
	 * This integration is used for web pages and applications that are not handled
	 * by a more specific integration (eg. for PDFs).
	 *
	 * @implements {Integration}
	 */
	class HTMLIntegration extends TinyEmitter {
	  /**
	   * @param {object} options
	   *   @param {FeatureFlags} options.features
	   *   @param {HTMLElement} [options.container]
	   */
	  constructor({
	    features,
	    container = document.body
	  }) {
	    super();
	    this.features = features;
	    this.container = container;
	    this.anchor = anchor$1;
	    this.describe = describe$1;
	    this._htmlMeta = new HTMLMetadata();
	    this._prevURI = this._htmlMeta.uri();

	    /** Whether to attempt to resize the document to fit alongside sidebar. */
	    this._sideBySideEnabled = this.features.flagEnabled('html_side_by_side');

	    /**
	     * Whether the document is currently being resized to fit alongside an
	     * open sidebar.
	     */
	    this._sideBySideActive = false;

	    /** @type {SidebarLayout|null} */
	    this._lastLayout = null;

	    // Watch for changes to `location.href`.
	    this._navObserver = new NavigationObserver(() => this._checkForURIChange());

	    // Watch for potential changes to location information in `<head>`, eg.
	    // `<link rel=canonical>`.
	    this._metaObserver = new MutationObserver(() => this._checkForURIChange());
	    this._metaObserver.observe(document.head, {
	      childList: true,
	      subtree: true,
	      attributes: true,
	      attributeFilter: [
	      // Keys and values of <link> elements
	      'rel', 'href',
	      // Keys and values of <meta> elements
	      'name', 'content']
	    });
	    this._flagsChanged = () => {
	      const sideBySide = features.flagEnabled('html_side_by_side');
	      if (sideBySide !== this._sideBySideEnabled) {
	        this._sideBySideEnabled = sideBySide;

	        // `fitSideBySide` is normally called by Guest when the sidebar layout
	        // changes. When the feature flag changes, we need to re-run the method.
	        if (this._lastLayout) {
	          this.fitSideBySide(this._lastLayout);
	        }
	      }
	    };
	    this.features.on('flagsChanged', this._flagsChanged);
	  }
	  _checkForURIChange() {
	    const currentURI = this._htmlMeta.uri();
	    if (currentURI !== this._prevURI) {
	      this._prevURI = currentURI;
	      this.emit('uriChanged', currentURI);
	    }
	  }
	  canAnnotate() {
	    return true;
	  }
	  canStyleClusteredHighlights() {
	    return true;
	  }
	  destroy() {
	    this._navObserver.disconnect();
	    this._metaObserver.disconnect();
	    this.features.off('flagsChanged', this._flagsChanged);
	  }
	  contentContainer() {
	    return this.container;
	  }

	  /**
	   * @param {SidebarLayout} layout
	   */
	  fitSideBySide(layout) {
	    this._lastLayout = layout;
	    const maximumWidthToFit = window.innerWidth - layout.width;
	    const active = this._sideBySideEnabled && layout.expanded && maximumWidthToFit >= MIN_HTML_WIDTH;
	    if (active) {
	      // nb. We call `_activateSideBySide` regardless of whether side-by-side
	      // is already active because the sidebar width might be different.
	      this._activateSideBySide(layout.width);
	    } else if (this._sideBySideActive) {
	      this._deactivateSideBySide();
	    }
	    this._sideBySideActive = active;
	    return active;
	  }

	  /**
	   * Resize the document content after side-by-side mode is activated.
	   *
	   * @param {number} sidebarWidth
	   */
	  _activateSideBySide(sidebarWidth) {
	    // When side-by-side mode is activated, what we want to achieve is that the
	    // main content of the page is fully visible alongside the sidebar, with
	    // as much space given to the main content as possible. A challenge is that
	    // we don't know how the page will respond to reducing the width of the body.
	    //
	    // - The content might have margins which automatically get reduced as the
	    //   available width is reduced. For example a blog post with a fixed-width
	    //   article in the middle and `margin: auto` for both margins.
	    //
	    //   In this scenario we'd want to reduce the document width by the full
	    //   width of the sidebar.
	    //
	    // - There might be sidebars to the left and/or right of the main content
	    //   which cause the main content to be squashed when the width is reduced.
	    //   For example a news website with a column of ads on the right.
	    //
	    //   In this scenario we'd want to not reduce the document width or reduce
	    //   it by a smaller amount and let the Hypothesis sidebar cover up the
	    //   document's sidebar, leaving as much space as possible to the content.
	    //
	    // Therefore what we do is to initially reduce the width of the document by
	    // the full width of the sidebar, then we use heuristics to analyze the
	    // resulting page layout and determine whether there is significant "free space"
	    // (ie. anything that is not the main content of the document, such as ads or
	    // links to related stories) to the right of the main content. If there is,
	    // we make the document wider again to allow more space for the main content.
	    //
	    // These heuristics assume a typical "article" page with one central block
	    // of content. If we can't find the "main content" then we just assume that
	    // everything on the page is potentially content that the user might want
	    // to annotate and so try to keep it all visible.

	    // nb. 12px padding is a multiple of the 4px grid unit in our design system.
	    const padding = 12;
	    const rightMargin = sidebarWidth + padding;

	    /** @param {HTMLElement} element */
	    const computeLeftMargin = element => parseInt(window.getComputedStyle(element).marginLeft, 10);
	    preserveScrollPosition(() => {
	      // nb. Adjusting the body size this way relies on the page not setting a
	      // width on the body. For sites that do this won't work.

	      // Remove any margins we've previously set
	      document.body.style.marginLeft = '';
	      document.body.style.marginRight = '';

	      // Keep track of what left margin would be naturally without right margin set
	      const beforeBodyLeft = computeLeftMargin(document.body);
	      document.body.style.marginRight = `${rightMargin}px`;
	      const contentArea = guessMainContentArea(document.body);
	      if (contentArea) {
	        // Check if we can give the main content more space by letting the
	        // sidebar overlap stuff in the document to the right of the main content.
	        const freeSpace = Math.max(0, window.innerWidth - rightMargin - contentArea.right);
	        if (freeSpace > 0) {
	          const adjustedMargin = Math.max(0, rightMargin - freeSpace);
	          document.body.style.marginRight = `${adjustedMargin}px`;
	        }

	        // Changes to right margin can affect left margin in cases where body
	        // has `margin:auto`. It's OK to move the body to the left to make
	        // space, but avoid moving it to the right.
	        // See https://github.com/hypothesis/client/issues/4280
	        const afterBodyLeft = computeLeftMargin(document.body);
	        if (afterBodyLeft > beforeBodyLeft) {
	          document.body.style.marginLeft = `${beforeBodyLeft}px`;
	        }

	        // If the main content appears to be right up against the edge of the
	        // window, add padding for readability.
	        if (contentArea.left < padding) {
	          document.body.style.marginLeft = `${padding}px`;
	        }
	      } else {
	        document.body.style.marginLeft = '';
	        document.body.style.marginRight = '';
	      }
	    });
	  }

	  /**
	   * Undo the effects of `activateSideBySide`.
	   */
	  _deactivateSideBySide() {
	    preserveScrollPosition(() => {
	      document.body.style.marginLeft = '';
	      document.body.style.marginRight = '';
	    });
	  }
	  async getMetadata() {
	    return this._htmlMeta.getDocumentMetadata();
	  }
	  async uri() {
	    return this._htmlMeta.uri();
	  }

	  /**
	   * @param {Anchor} anchor
	   */
	  async scrollToAnchor(anchor) {
	    var _anchor$highlights;
	    const highlight = (_anchor$highlights = anchor.highlights) === null || _anchor$highlights === void 0 ? void 0 : _anchor$highlights[0];
	    if (!highlight) {
	      return;
	    }
	    await scrollElementIntoView(highlight);
	  }
	}

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */

	/** Used as the `TypeError` message for "Functions" methods. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/** Used as references for various `Number` constants. */
	var NAN = 0 / 0;

	/** `Object#toString` result references. */
	var symbolTag = '[object Symbol]';

	/** Used to match leading and trailing whitespace. */
	var reTrim = /^\s+|\s+$/g;

	/** Used to detect bad signed hexadecimal string values. */
	var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

	/** Used to detect binary string values. */
	var reIsBinary = /^0b[01]+$/i;

	/** Used to detect octal string values. */
	var reIsOctal = /^0o[0-7]+$/i;

	/** Built-in method references without a dependency on `root`. */
	var freeParseInt = parseInt;

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeMax = Math.max,
	    nativeMin = Math.min;

	/**
	 * Gets the timestamp of the number of milliseconds that have elapsed since
	 * the Unix epoch (1 January 1970 00:00:00 UTC).
	 *
	 * @static
	 * @memberOf _
	 * @since 2.4.0
	 * @category Date
	 * @returns {number} Returns the timestamp.
	 * @example
	 *
	 * _.defer(function(stamp) {
	 *   console.log(_.now() - stamp);
	 * }, _.now());
	 * // => Logs the number of milliseconds it took for the deferred invocation.
	 */
	var now = function() {
	  return root.Date.now();
	};

	/**
	 * Creates a debounced function that delays invoking `func` until after `wait`
	 * milliseconds have elapsed since the last time the debounced function was
	 * invoked. The debounced function comes with a `cancel` method to cancel
	 * delayed `func` invocations and a `flush` method to immediately invoke them.
	 * Provide `options` to indicate whether `func` should be invoked on the
	 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
	 * with the last arguments provided to the debounced function. Subsequent
	 * calls to the debounced function return the result of the last `func`
	 * invocation.
	 *
	 * **Note:** If `leading` and `trailing` options are `true`, `func` is
	 * invoked on the trailing edge of the timeout only if the debounced function
	 * is invoked more than once during the `wait` timeout.
	 *
	 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
	 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
	 *
	 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
	 * for details over the differences between `_.debounce` and `_.throttle`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to debounce.
	 * @param {number} [wait=0] The number of milliseconds to delay.
	 * @param {Object} [options={}] The options object.
	 * @param {boolean} [options.leading=false]
	 *  Specify invoking on the leading edge of the timeout.
	 * @param {number} [options.maxWait]
	 *  The maximum time `func` is allowed to be delayed before it's invoked.
	 * @param {boolean} [options.trailing=true]
	 *  Specify invoking on the trailing edge of the timeout.
	 * @returns {Function} Returns the new debounced function.
	 * @example
	 *
	 * // Avoid costly calculations while the window size is in flux.
	 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
	 *
	 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
	 * jQuery(element).on('click', _.debounce(sendMail, 300, {
	 *   'leading': true,
	 *   'trailing': false
	 * }));
	 *
	 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
	 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
	 * var source = new EventSource('/stream');
	 * jQuery(source).on('message', debounced);
	 *
	 * // Cancel the trailing debounced invocation.
	 * jQuery(window).on('popstate', debounced.cancel);
	 */
	function debounce(func, wait, options) {
	  var lastArgs,
	      lastThis,
	      maxWait,
	      result,
	      timerId,
	      lastCallTime,
	      lastInvokeTime = 0,
	      leading = false,
	      maxing = false,
	      trailing = true;

	  if (typeof func != 'function') {
	    throw new TypeError(FUNC_ERROR_TEXT);
	  }
	  wait = toNumber(wait) || 0;
	  if (isObject(options)) {
	    leading = !!options.leading;
	    maxing = 'maxWait' in options;
	    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
	    trailing = 'trailing' in options ? !!options.trailing : trailing;
	  }

	  function invokeFunc(time) {
	    var args = lastArgs,
	        thisArg = lastThis;

	    lastArgs = lastThis = undefined;
	    lastInvokeTime = time;
	    result = func.apply(thisArg, args);
	    return result;
	  }

	  function leadingEdge(time) {
	    // Reset any `maxWait` timer.
	    lastInvokeTime = time;
	    // Start the timer for the trailing edge.
	    timerId = setTimeout(timerExpired, wait);
	    // Invoke the leading edge.
	    return leading ? invokeFunc(time) : result;
	  }

	  function remainingWait(time) {
	    var timeSinceLastCall = time - lastCallTime,
	        timeSinceLastInvoke = time - lastInvokeTime,
	        result = wait - timeSinceLastCall;

	    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
	  }

	  function shouldInvoke(time) {
	    var timeSinceLastCall = time - lastCallTime,
	        timeSinceLastInvoke = time - lastInvokeTime;

	    // Either this is the first call, activity has stopped and we're at the
	    // trailing edge, the system time has gone backwards and we're treating
	    // it as the trailing edge, or we've hit the `maxWait` limit.
	    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
	      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
	  }

	  function timerExpired() {
	    var time = now();
	    if (shouldInvoke(time)) {
	      return trailingEdge(time);
	    }
	    // Restart the timer.
	    timerId = setTimeout(timerExpired, remainingWait(time));
	  }

	  function trailingEdge(time) {
	    timerId = undefined;

	    // Only invoke if we have `lastArgs` which means `func` has been
	    // debounced at least once.
	    if (trailing && lastArgs) {
	      return invokeFunc(time);
	    }
	    lastArgs = lastThis = undefined;
	    return result;
	  }

	  function cancel() {
	    if (timerId !== undefined) {
	      clearTimeout(timerId);
	    }
	    lastInvokeTime = 0;
	    lastArgs = lastCallTime = lastThis = timerId = undefined;
	  }

	  function flush() {
	    return timerId === undefined ? result : trailingEdge(now());
	  }

	  function debounced() {
	    var time = now(),
	        isInvoking = shouldInvoke(time);

	    lastArgs = arguments;
	    lastThis = this;
	    lastCallTime = time;

	    if (isInvoking) {
	      if (timerId === undefined) {
	        return leadingEdge(lastCallTime);
	      }
	      if (maxing) {
	        // Handle invocations in a tight loop.
	        timerId = setTimeout(timerExpired, wait);
	        return invokeFunc(lastCallTime);
	      }
	    }
	    if (timerId === undefined) {
	      timerId = setTimeout(timerExpired, wait);
	    }
	    return result;
	  }
	  debounced.cancel = cancel;
	  debounced.flush = flush;
	  return debounced;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	  var type = typeof value;
	  return !!value && (type == 'object' || type == 'function');
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	  return !!value && typeof value == 'object';
	}

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	  return typeof value == 'symbol' ||
	    (isObjectLike(value) && objectToString.call(value) == symbolTag);
	}

	/**
	 * Converts `value` to a number.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {number} Returns the number.
	 * @example
	 *
	 * _.toNumber(3.2);
	 * // => 3.2
	 *
	 * _.toNumber(Number.MIN_VALUE);
	 * // => 5e-324
	 *
	 * _.toNumber(Infinity);
	 * // => Infinity
	 *
	 * _.toNumber('3.2');
	 * // => 3.2
	 */
	function toNumber(value) {
	  if (typeof value == 'number') {
	    return value;
	  }
	  if (isSymbol(value)) {
	    return NAN;
	  }
	  if (isObject(value)) {
	    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
	    value = isObject(other) ? (other + '') : other;
	  }
	  if (typeof value != 'string') {
	    return value === 0 ? value : +value;
	  }
	  value = value.replace(reTrim, '');
	  var isBinary = reIsBinary.test(value);
	  return (isBinary || reIsOctal.test(value))
	    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
	    : (reIsBadHex.test(value) ? NAN : +value);
	}

	var lodash_debounce = debounce;

	/**
	 * Find the smallest offset in `str` which contains at least `count` chars
	 * that match `filter` before it.
	 *
	 * @param {string} str
	 * @param {number} count
	 * @param {(char: string) => boolean} filter
	 * @param {number} [startPos]
	 */
	function advance(str, count, filter, startPos = 0) {
	  let pos = startPos;
	  while (pos < str.length && count > 0) {
	    if (filter(str[pos])) {
	      --count;
	    }
	    ++pos;
	  }
	  return pos;
	}

	/**
	 * Count characters which match `filter` in `str`.
	 *
	 * @param {string} str
	 * @param {(char: string) => boolean} filter
	 * @param {number} startPos
	 * @param {number} endPos
	 */
	function countChars(str, filter, startPos, endPos) {
	  let count = 0;
	  for (let pos = startPos; pos < endPos; pos++) {
	    if (filter(str[pos])) {
	      ++count;
	    }
	  }
	  return count;
	}

	/**
	 * Translate a (start, end) pair of offsets for an "input" string into
	 * corresponding offsets in an "output" string.
	 *
	 * Positions in the input and output strings are related by counting
	 * the number of "important" characters before them, as determined by a
	 * filter function.
	 *
	 * An example usage would be to find equivalent positions in two strings which
	 * contain the same text content except for the addition or removal of
	 * whitespace at arbitrary locations in the output string.
	 *
	 * Where there are multiple possible offsets in the output string that
	 * correspond to the input offsets, the largest start offset and smallest end
	 * offset are chosen. In other words, leading and trailing ignored characters
	 * are trimmed from the output.
	 *
	 * @example
	 *   // The input offsets (1, 3) select the substring "bc" in the "input" argument.
	 *   // The returned offsets select the substring "b c" in the "output" argument.
	 *   translateOffsets('abcd', ' a b c d ', 1, 3, char => char !== ' ')
	 *
	 * @param {string} input
	 * @param {string} output
	 * @param {number} start - Start offset in `input`
	 * @param {number} end - End offset in `input`
	 * @param {(ch: string) => boolean} filter - Filter function that returns true
	 *   if a character should be counted when relating positions between `input`
	 *   and `output`.
	 * @return {[number, number]} - Start and end offsets in `output`
	 */
	function translateOffsets(input, output, start, end, filter) {
	  const beforeStartCount = countChars(input, filter, 0, start);
	  const startToEndCount = countChars(input, filter, start, end);

	  // Find smallest offset in `output` with same number of non-ignored characters
	  // before it as before `start` in the input. This offset might correspond to
	  // an ignored character.
	  let outputStart = advance(output, beforeStartCount, filter);

	  // Increment this offset until it points to a non-ignored character. This
	  // "trims" leading ignored characters from the result.
	  while (outputStart < output.length && !filter(output[outputStart])) {
	    ++outputStart;
	  }

	  // Find smallest offset in `output` with same number of non-ignored characters
	  // before it as before `end` in the input.
	  const outputEnd = advance(output, startToEndCount, filter, outputStart);
	  return [outputStart, outputEnd];
	}

	/* global PDFViewerApplication */

	/**
	 * @typedef {import('../../types/api').TextPositionSelector} TextPositionSelector
	 * @typedef {import('../../types/api').TextQuoteSelector} TextQuoteSelector
	 * @typedef {import('../../types/api').Selector} Selector
	 *
	 * @typedef {import('../../types/pdfjs').PDFPageView} PDFPageView
	 * @typedef {import('../../types/pdfjs').PDFViewer} PDFViewer
	 */

	/**
	 * @typedef PDFTextRange
	 * @prop {number} pageIndex
	 * @prop {object} anchor
	 * @prop {number} anchor.start - Start character offset within the page's text
	 * @prop {number} anchor.end - End character offset within the page's text
	 */

	/**
	 * Enum values for page rendering states (IRenderableView#renderingState)
	 * in PDF.js. Taken from web/pdf_rendering_queue.js in the PDF.js library.
	 *
	 * Reproduced here because this enum is not exported consistently across
	 * different versions of PDF.js
	 */
	const RenderingStates = {
	  INITIAL: 0,
	  RUNNING: 1,
	  PAUSED: 2,
	  FINISHED: 3
	};

	// Caches for performance.

	/**
	 * Map of page index to page text content.
	 *
	 * @type {Map<number, Promise<string>>}
	 */
	const pageTextCache = new Map();

	/**
	 * A cache that maps a `{quote}:{offset}` key to a specific
	 * location in the document.
	 *
	 * The components of the key come from an annotation's selectors. This is used
	 * to speed up re-anchoring an annotation that was previously anchored in the
	 * current session.
	 *
	 * @type {Map<string, PDFTextRange>}
	 */
	const quotePositionCache = new Map();

	/**
	 * Return a cache key for lookups in `quotePositionCache`.
	 *
	 * @param {string} quote
	 * @param {number} [pos] - Offset in document text
	 */
	function quotePositionCacheKey(quote, pos) {
	  return `${quote}:${pos}`;
	}

	/**
	 * Return offset of `node` among its siblings
	 *
	 * @param {Node} node
	 */
	function getSiblingIndex(node) {
	  let index = 0;
	  while (node.previousSibling) {
	    ++index;
	    node = node.previousSibling;
	  }
	  return index;
	}

	/**
	 * Return the text layer element of the PDF page containing `node`.
	 *
	 * @param {Node|Element} node
	 * @return {Element|null}
	 */
	function getNodeTextLayer(node) {
	  var _el$closest;
	  const el = 'closest' in node ? node : node.parentElement;
	  return (_el$closest = el === null || el === void 0 ? void 0 : el.closest('.textLayer')) !== null && _el$closest !== void 0 ? _el$closest : null;
	}

	/**
	 * Get the PDF.js viewer application.
	 *
	 * @return {PDFViewer}
	 */
	function getPDFViewer() {
	  // @ts-ignore - TS doesn't know about PDFViewerApplication global.
	  return PDFViewerApplication.pdfViewer;
	}

	/**
	 * Returns the view into which a PDF page is drawn.
	 *
	 * If called while the PDF document is still loading, this will delay until
	 * the document loading has progressed far enough for a `PDFPageView` and its
	 * associated `PDFPage` to be ready.
	 *
	 * @param {number} pageIndex
	 * @return {Promise<PDFPageView>}
	 */
	async function getPageView(pageIndex) {
	  const pdfViewer = getPDFViewer();
	  let pageView = pdfViewer.getPageView(pageIndex);
	  if (!pageView || !pageView.pdfPage) {
	    // If the document is still loading, wait for the `pagesloaded` event.
	    //
	    // Note that loading happens in several stages. Initially the page view
	    // objects do not exist (`pageView` will be nullish), then after the
	    // "pagesinit" event, the page view exists but it does not have a `pdfPage`
	    // property set, then finally after the "pagesloaded" event, it will have
	    // a "pdfPage" property.
	    pageView = await new Promise(resolve => {
	      const onPagesLoaded = () => {
	        if (pdfViewer.eventBus) {
	          pdfViewer.eventBus.off('pagesloaded', onPagesLoaded);
	        } else {
	          document.removeEventListener('pagesloaded', onPagesLoaded);
	        }
	        resolve(pdfViewer.getPageView(pageIndex));
	      };
	      if (pdfViewer.eventBus) {
	        pdfViewer.eventBus.on('pagesloaded', onPagesLoaded);
	      } else {
	        // Old PDF.js versions (< 1.6.210) use DOM events.
	        document.addEventListener('pagesloaded', onPagesLoaded);
	      }
	    });
	  }
	  return (/** @type {PDFPageView} */pageView
	  );
	}

	/**
	 * Return true if the document has selectable text.
	 */
	async function documentHasText() {
	  const viewer = getPDFViewer();
	  let hasText = false;
	  for (let i = 0; i < viewer.pagesCount; i++) {
	    const pageText = await getPageTextContent(i);
	    if (pageText.trim().length > 0) {
	      hasText = true;
	      break;
	    }
	  }
	  return hasText;
	}

	/**
	 * Return the text of a given PDF page.
	 *
	 * The text returned by this function should match the `textContent` of the text
	 * layer element that PDF.js creates for rendered pages, with the exception
	 * that differences in whitespace are tolerated.
	 *
	 * @param {number} pageIndex
	 * @return {Promise<string>}
	 */
	function getPageTextContent(pageIndex) {
	  // If we already have or are fetching the text for this page, return the
	  // existing result.
	  const cachedText = pageTextCache.get(pageIndex);
	  if (cachedText) {
	    return cachedText;
	  }
	  const getPageText = async () => {
	    const pageView = await getPageView(pageIndex);
	    const textContent = await pageView.pdfPage.getTextContent({
	      // Deprecated option, set for compatibility with older PDF.js releases.
	      normalizeWhitespace: true
	    });
	    return textContent.items.map(it => it.str).join('');
	  };

	  // This function synchronously populates the cache with a promise so that
	  // multiple calls don't call `PDFPageProxy.getTextContent` twice.
	  const pageText = getPageText();
	  pageTextCache.set(pageIndex, pageText);
	  return pageText;
	}

	/**
	 * Find the offset within the document's text at which a page begins.
	 *
	 * @param {number} pageIndex
	 * @return {Promise<number>} - Offset of page's text within document text
	 */
	async function getPageOffset(pageIndex) {
	  const viewer = getPDFViewer();
	  if (pageIndex >= viewer.pagesCount) {
	    /* istanbul ignore next - This should never be triggered */
	    throw new Error('Invalid page index');
	  }
	  let offset = 0;
	  for (let i = 0; i < pageIndex; i++) {
	    const text = await getPageTextContent(i);
	    offset += text.length;
	  }
	  return offset;
	}

	/**
	 * @typedef PageOffset
	 * @prop {number} index - Page index
	 * @prop {number} offset - Character offset of start of page within document text
	 * @prop {string} text - Text of page
	 */

	/**
	 * Find the page containing a text offset within the document.
	 *
	 * If the offset is invalid (less than 0 or greater than the length of the document)
	 * then the nearest (first or last) page is returned.
	 *
	 * @param {number} offset
	 * @return {Promise<PageOffset>}
	 */
	async function findPageByOffset(offset) {
	  const viewer = getPDFViewer();
	  let pageStartOffset = 0;
	  let pageEndOffset = 0;
	  let text = '';
	  for (let i = 0; i < viewer.pagesCount; i++) {
	    text = await getPageTextContent(i);
	    pageStartOffset = pageEndOffset;
	    pageEndOffset += text.length;
	    if (pageEndOffset >= offset) {
	      return {
	        index: i,
	        offset: pageStartOffset,
	        text
	      };
	    }
	  }

	  // If the offset is beyond the end of the document, just pretend it was on
	  // the last page.
	  return {
	    index: viewer.pagesCount - 1,
	    offset: pageStartOffset,
	    text
	  };
	}

	/**
	 * Return true if `char` is an ASCII space.
	 *
	 * This is more efficient than `/\s/.test(char)` but does not handle Unicode
	 * spaces.
	 *
	 * @param {string} char
	 */
	function isSpace(char) {
	  switch (char) {
	    case ' ':
	    case '\f':
	    case '\n':
	    case '\r':
	    case '\t':
	    case '\v':
	    case '\u00a0':
	      // nbsp
	      return true;
	    default:
	      return false;
	  }
	}

	/** @param {string} char */
	const isNotSpace = char => !isSpace(char);

	/**
	 * Locate the DOM Range which a position selector refers to.
	 *
	 * If the page is off-screen it may be in an unrendered state, in which case
	 * the text layer will not have been created. In that case a placeholder
	 * DOM element is created and the returned range refers to that placeholder.
	 * In that case, the selector will need to be re-anchored when the page is
	 * scrolled into view.
	 *
	 * @param {number} pageIndex - The PDF page index
	 * @param {number} start - Character offset within the page's text
	 * @param {number} end - Character offset within the page's text
	 * @return {Promise<Range>}
	 */
	async function anchorByPosition(pageIndex, start, end) {
	  const [page, pageText] = await Promise.all([getPageView(pageIndex), getPageTextContent(pageIndex)]);
	  if (page.renderingState === RenderingStates.FINISHED && page.textLayer && page.textLayer.renderingDone) {
	    // The page has been rendered. Locate the position in the text layer.
	    //
	    // We allow for differences in whitespace between the text returned by
	    // `getPageTextContent` and the text layer content. Any other differences
	    // will cause mis-anchoring.

	    const root = page.textLayer.textLayerDiv;
	    const textLayerStr = /** @type {string} */root.textContent;
	    const [textLayerStart, textLayerEnd] = translateOffsets(pageText, textLayerStr, start, end, isNotSpace);
	    const textLayerQuote = stripSpaces(textLayerStr.slice(textLayerStart, textLayerEnd));
	    const pageTextQuote = stripSpaces(pageText.slice(start, end));
	    if (textLayerQuote !== pageTextQuote) {
	      warnOnce('Text layer text does not match page text. Highlights will be mis-aligned.');
	    }
	    const startPos = new TextPosition(root, textLayerStart);
	    const endPos = new TextPosition(root, textLayerEnd);
	    return new TextRange(startPos, endPos).toRange();
	  }

	  // The page has not been rendered yet. Create a placeholder element and
	  // anchor to that instead.
	  const placeholder = createPlaceholder(page.div);
	  const range = document.createRange();
	  range.setStartBefore(placeholder);
	  range.setEndAfter(placeholder);
	  return range;
	}

	/**
	 * Return a string with spaces stripped.
	 *
	 * This function optimizes for performance of stripping the main space chars
	 * that PDF.js generates over handling all kinds of whitespace that could
	 * occur in a string.
	 *
	 * @param {string} str
	 */
	function stripSpaces(str) {
	  let stripped = '';
	  for (let i = 0; i < str.length; i++) {
	    const char = str[i];
	    if (isSpace(char)) {
	      continue;
	    }
	    stripped += char;
	  }
	  return stripped;
	}

	/**
	 * Search for a quote in the given pages.
	 *
	 * When comparing quote selectors to document text, ASCII whitespace characters
	 * are ignored. This is because text extracted from a PDF by different PDF
	 * viewers, including different versions of PDF.js, can often differ in the
	 * whitespace between characters and words. For a long time PDF.js in particular
	 * had issues where it would often produce extra spaces between characters that
	 * should not be there or omit spaces between words.
	 *
	 * @param {TextQuoteSelector} quoteSelector
	 * @param {number} [positionHint] - Expected start offset of quote
	 * @return {Promise<Range>} Location of quote
	 */
	async function anchorQuote(quoteSelector, positionHint) {
	  // Determine which pages to search and in what order. If we have a position
	  // hint we'll try to use that. Otherwise we'll just search all pages in order.
	  const pageCount = getPDFViewer().pagesCount;
	  const pageIndexes = Array(pageCount).fill(0).map((_, i) => i);
	  let expectedPageIndex;
	  let expectedOffsetInPage;
	  if (positionHint) {
	    const {
	      index,
	      offset
	    } = await findPageByOffset(positionHint);
	    expectedPageIndex = index;
	    expectedOffsetInPage = positionHint - offset;

	    // Sort pages by distance from the page where we expect to find the quote,
	    // based on the position hint.
	    pageIndexes.sort((a, b) => {
	      const distA = Math.abs(a - index);
	      const distB = Math.abs(b - index);
	      return distA - distB;
	    });
	  }

	  // Search pages for the best match, ignoring whitespace differences.
	  const strippedPrefix = quoteSelector.prefix !== undefined ? stripSpaces(quoteSelector.prefix) : undefined;
	  const strippedSuffix = quoteSelector.suffix !== undefined ? stripSpaces(quoteSelector.suffix) : undefined;
	  const strippedQuote = stripSpaces(quoteSelector.exact);
	  let bestMatch;
	  for (let page of pageIndexes) {
	    const text = await getPageTextContent(page);
	    const strippedText = stripSpaces(text);

	    // Determine expected offset of quote in current page based on position hint.
	    let strippedHint;
	    if (expectedPageIndex !== undefined && expectedOffsetInPage !== undefined) {
	      if (page < expectedPageIndex) {
	        strippedHint = strippedText.length; // Prefer matches closer to end of page.
	      } else if (page === expectedPageIndex) {
	        // Translate expected offset in whitespace-inclusive version of page
	        // text into offset in whitespace-stripped version of page text.
	        [strippedHint] = translateOffsets(text, strippedText, expectedOffsetInPage, expectedOffsetInPage, isNotSpace);
	      } else {
	        strippedHint = 0; // Prefer matches closer to start of page.
	      }
	    }

	    const match = matchQuote(strippedText, strippedQuote, {
	      prefix: strippedPrefix,
	      suffix: strippedSuffix,
	      hint: strippedHint
	    });
	    if (!match) {
	      continue;
	    }
	    if (!bestMatch || match.score > bestMatch.match.score) {
	      // Translate match offset from whitespace-stripped version of page text
	      // back to original text.
	      const [start, end] = translateOffsets(strippedText, text, match.start, match.end, isNotSpace);
	      bestMatch = {
	        page,
	        match: {
	          start,
	          end,
	          score: match.score
	        }
	      };

	      // If we find a very good match, stop early.
	      //
	      // There is a tradeoff here between optimizing search performance and
	      // ensuring that we have found the best match in the document.
	      //
	      // The current heuristics are that we require an exact match for the quote
	      // and either the preceding or following context. The context matching
	      // helps to avoid incorrectly stopping the search early if the quote is
	      // a word or phrase that is common in the document.
	      const exactQuoteMatch = strippedText.slice(match.start, match.end) === strippedQuote;
	      const exactPrefixMatch = strippedPrefix !== undefined && strippedText.slice(Math.max(0, match.start - strippedPrefix.length), match.start) === strippedPrefix;
	      const exactSuffixMatch = strippedSuffix !== undefined && strippedText.slice(match.end, strippedSuffix.length) === strippedSuffix;
	      const hasContext = strippedPrefix !== undefined || strippedSuffix !== undefined;
	      if (exactQuoteMatch && (exactPrefixMatch || exactSuffixMatch || !hasContext)) {
	        break;
	      }
	    }
	  }
	  if (bestMatch) {
	    const {
	      page,
	      match
	    } = bestMatch;

	    // If we found a match, optimize future anchoring of this selector in the
	    // same session by caching the match location.
	    if (positionHint) {
	      const cacheKey = quotePositionCacheKey(quoteSelector.exact, positionHint);
	      quotePositionCache.set(cacheKey, {
	        pageIndex: page,
	        anchor: match
	      });
	    }

	    // Convert the (start, end) position match into a DOM range.
	    return anchorByPosition(page, match.start, match.end);
	  }
	  throw new Error('Quote not found');
	}

	/**
	 * Anchor a set of selectors to a DOM Range.
	 *
	 * `selectors` must include a `TextQuoteSelector` and may include other selector
	 * types.
	 *
	 * @param {HTMLElement} root
	 * @param {Selector[]} selectors
	 * @return {Promise<Range>}
	 */
	async function anchor(root, selectors) {
	  const quote = /** @type {TextQuoteSelector|undefined} */
	  selectors.find(s => s.type === 'TextQuoteSelector');

	  // The quote selector is required in order to check that text position
	  // selector results are still valid.
	  if (!quote) {
	    throw new Error('No quote selector found');
	  }
	  const position = /** @type {TextPositionSelector|undefined} */
	  selectors.find(s => s.type === 'TextPositionSelector');
	  if (position) {
	    // If we have a position selector, try using that first as it is the fastest
	    // anchoring method.
	    try {
	      const {
	        index,
	        offset,
	        text
	      } = await findPageByOffset(position.start);
	      const start = position.start - offset;
	      const end = position.end - offset;
	      const matchedText = text.substring(start, end);
	      if (quote.exact !== matchedText) {
	        throw new Error('quote mismatch');
	      }
	      const range = await anchorByPosition(index, start, end);
	      return range;
	    } catch {
	      // Fall back to quote selector
	    }

	    // If anchoring with the position failed, check for a cached quote-based
	    // match using the quote + position as a cache key.
	    try {
	      const cacheKey = quotePositionCacheKey(quote.exact, position.start);
	      const cachedPos = quotePositionCache.get(cacheKey);
	      if (cachedPos) {
	        const {
	          pageIndex,
	          anchor
	        } = cachedPos;
	        const range = await anchorByPosition(pageIndex, anchor.start, anchor.end);
	        return range;
	      }
	    } catch {
	      // Fall back to uncached quote selector match
	    }
	  }
	  return anchorQuote(quote, position === null || position === void 0 ? void 0 : position.start);
	}

	/**
	 * Prepare a DOM range for generating selectors and find the containing text layer.
	 *
	 * @param {Range} range
	 * @return {[Range, Element]}
	 * @throws If the range cannot be annotated
	 */
	function getTextLayerForRange(range) {
	  // "Shrink" the range so that the start and endpoints are at offsets within
	  // text nodes rather than any containing nodes.
	  try {
	    range = TextRange.fromRange(range).toRange();
	  } catch {
	    throw new Error('Selection does not contain text');
	  }
	  const startTextLayer = getNodeTextLayer(range.startContainer);
	  const endTextLayer = getNodeTextLayer(range.endContainer);
	  if (!startTextLayer || !endTextLayer) {
	    throw new Error('Selection is outside page text');
	  }
	  if (startTextLayer !== endTextLayer) {
	    throw new Error('Selecting across page breaks is not supported');
	  }
	  return [range, startTextLayer];
	}

	/**
	 * Return true if selectors can be generated for a range using `describe`.
	 *
	 * This function is faster than calling `describe` if the selectors are not
	 * required.
	 *
	 * @param {Range} range
	 */
	function canDescribe(range) {
	  try {
	    getTextLayerForRange(range);
	    return true;
	  } catch {
	    return false;
	  }
	}

	/**
	 * Convert a DOM Range object into a set of selectors.
	 *
	 * Converts a DOM `Range` object into a `[position, quote]` tuple of selectors
	 * which can be saved with an annotation and later passed to `anchor` to
	 * convert the selectors back to a `Range`.
	 *
	 * @param {HTMLElement} root - The root element
	 * @param {Range} range
	 * @return {Promise<Selector[]>}
	 */
	async function describe(root, range) {
	  const [textRange, textLayer] = getTextLayerForRange(range);
	  const startPos = TextPosition.fromPoint(textRange.startContainer, textRange.startOffset).relativeTo(textLayer);
	  const endPos = TextPosition.fromPoint(textRange.endContainer, textRange.endOffset).relativeTo(textLayer);
	  const startPageIndex = getSiblingIndex( /** @type {Node} */textLayer.parentNode);
	  const pageOffset = await getPageOffset(startPageIndex);

	  /** @type {TextPositionSelector} */
	  const position = {
	    type: 'TextPositionSelector',
	    start: pageOffset + startPos.offset,
	    end: pageOffset + endPos.offset
	  };
	  const quote = TextQuoteAnchor.fromRange(root, textRange).toSelector();
	  return [position, quote];
	}

	/**
	 * Clear this module's internal caches.
	 *
	 * This exists mainly as a helper for use in tests.
	 */
	function purgeCache() {
	  pageTextCache.clear();
	  quotePositionCache.clear();
	}

	var _jsxFileName$9 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/Banners.js";
	/**
	 * Render banners at the top of a document in a stacked column.
	 *
	 * @param {object} props
	 *   @param {import("preact").ComponentChildren} props.children
	 */
	function Banners({
	  children
	}) {
	  return o("div", {
	    className: "flex flex-col",
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$9,
	    lineNumber: 8,
	    columnNumber: 10
	  }, this);
	}

	var _jsxFileName$8 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/ContentInfoBanner.js";
	function ContentInfoBanner({
	  info
	}) {
	  // Format item title to show subtitle
	  let itemTitle = info.item.title;
	  if (info.item.subtitle) {
	    itemTitle += `: ${info.item.subtitle}`;
	  }
	  return o("div", {
	    className: classnames('h-10 bg-white px-4 text-slate-7 text-annotator-base border-b', 'grid items-center',
	    // Two columns in narrower viewports; three in wider
	    'grid-cols-[100px_minmax(0,auto)]', '2xl:grid-cols-[100px_minmax(0,auto)_minmax(0,auto)] 2xl:gap-x-3'),
	    children: [o("div", {
	      "data-testid": "content-logo",
	      children: info.logo && o(LinkNext, {
	        href: info.logo.link,
	        target: "_blank",
	        "data-testid": "logo-link",
	        children: o("img", {
	          alt: info.logo.title,
	          src: info.logo.logo,
	          "data-testid": "logo-image"
	        }, void 0, false, {
	          fileName: _jsxFileName$8,
	          lineNumber: 45,
	          columnNumber: 13
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$8,
	        lineNumber: 44,
	        columnNumber: 11
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$8,
	      lineNumber: 42,
	      columnNumber: 7
	    }, this), o("div", {
	      className: classnames(
	      // Container title (this element) is not shown on narrow screens
	      'hidden', '2xl:block 2xl:whitespace-nowrap 2xl:overflow-hidden 2xl:text-ellipsis', 'font-semibold'),
	      "data-testid": "content-container-info",
	      title: info.container.title,
	      children: info.container.title
	    }, void 0, false, {
	      fileName: _jsxFileName$8,
	      lineNumber: 53,
	      columnNumber: 7
	    }, this), o("div", {
	      className: classnames(
	      // Flex layout for item title, next and previous links
	      'flex justify-center items-center gap-x-2'),
	      "data-testid": "content-item-info",
	      children: [o("div", {
	        className: classnames(
	        // Narrower viewports center this flex content:
	        // this element is not needed for alignment
	        'hidden',
	        // Wider viewports align this flex content to the right:
	        // This empty element is needed to fill extra space at left
	        '2xl:block 2xl:grow')
	      }, void 0, false, {
	        fileName: _jsxFileName$8,
	        lineNumber: 72,
	        columnNumber: 9
	      }, this), info.links.previousItem && o(p$2, {
	        children: [o(LinkNext, {
	          classes: "flex gap-x-1 items-center text-annotator-sm whitespace-nowrap",
	          title: "Open previous item",
	          href: info.links.previousItem,
	          underline: "always",
	          target: "_blank",
	          "data-testid": "content-previous-link",
	          children: [o(CaretLeftIcon, {
	            className: "w-em h-em"
	          }, void 0, false, {
	            fileName: _jsxFileName$8,
	            lineNumber: 92,
	            columnNumber: 15
	          }, this), o("span", {
	            children: "Previous"
	          }, void 0, false, {
	            fileName: _jsxFileName$8,
	            lineNumber: 93,
	            columnNumber: 15
	          }, this)]
	        }, void 0, true, {
	          fileName: _jsxFileName$8,
	          lineNumber: 84,
	          columnNumber: 13
	        }, this), o("div", {
	          className: "text-annotator-sm",
	          children: "|"
	        }, void 0, false, {
	          fileName: _jsxFileName$8,
	          lineNumber: 95,
	          columnNumber: 13
	        }, this)]
	      }, void 0, true), o("div", {
	        className: classnames(
	        // This element will shrink and truncate fluidly.
	        // Overriding min-width `auto` prevents the content from overflowing
	        // See https://stackoverflow.com/a/66689926/434243.
	        'min-w-0 whitespace-nowrap overflow-hidden text-ellipsis shrink font-medium'),
	        children: o(LinkBaseNext, {
	          title: itemTitle,
	          href: info.links.currentItem,
	          "data-testid": "content-item-link",
	          target: "_blank",
	          unstyled: true,
	          children: itemTitle
	        }, void 0, false, {
	          fileName: _jsxFileName$8,
	          lineNumber: 106,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$8,
	        lineNumber: 98,
	        columnNumber: 9
	      }, this), info.links.nextItem && o(p$2, {
	        children: [o("div", {
	          className: "text-annotator-sm",
	          children: "|"
	        }, void 0, false, {
	          fileName: _jsxFileName$8,
	          lineNumber: 119,
	          columnNumber: 13
	        }, this), o(LinkNext, {
	          title: "Open next item",
	          classes: "flex gap-x-1 items-center text-annotator-sm whitespace-nowrap",
	          href: info.links.nextItem,
	          underline: "always",
	          target: "_blank",
	          "data-testid": "content-next-link",
	          children: [o("span", {
	            children: "Next"
	          }, void 0, false, {
	            fileName: _jsxFileName$8,
	            lineNumber: 128,
	            columnNumber: 15
	          }, this), o(CaretRightIcon, {
	            className: "w-em h-em"
	          }, void 0, false, {
	            fileName: _jsxFileName$8,
	            lineNumber: 129,
	            columnNumber: 15
	          }, this)]
	        }, void 0, true, {
	          fileName: _jsxFileName$8,
	          lineNumber: 120,
	          columnNumber: 13
	        }, this)]
	      }, void 0, true)]
	    }, void 0, true, {
	      fileName: _jsxFileName$8,
	      lineNumber: 65,
	      columnNumber: 7
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$8,
	    lineNumber: 33,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$7 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/WarningBanner.js";
	function WarningBanner() {
	  return o("div", {
	    className: "bg-white",
	    children: o("div", {
	      className: classnames('flex items-center gap-x-2', 'border border-yellow-notice bg-yellow-notice/10 text-annotator-base'),
	      children: [o("div", {
	        className: "bg-yellow-notice text-white p-2",
	        children: o(Icon, {
	          name: "caution",
	          classes: "text-annotator-xl"
	        }, void 0, false, {
	          fileName: _jsxFileName$7,
	          lineNumber: 18,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$7,
	        lineNumber: 17,
	        columnNumber: 9
	      }, this), o("div", {
	        children: [o("strong", {
	          children: "This PDF does not contain selectable text:"
	        }, void 0, false, {
	          fileName: _jsxFileName$7,
	          lineNumber: 21,
	          columnNumber: 11
	        }, this), ' ', o(Link, {
	          target: "_blank",
	          href: "https://web.hypothes.is/help/how-to-ocr-optimize-pdfs/",
	          children: "Learn how to fix this"
	        }, void 0, false, {
	          fileName: _jsxFileName$7,
	          lineNumber: 22,
	          columnNumber: 11
	        }, this), ' ', "in order to annotate with Hypothesis."]
	      }, void 0, true, {
	        fileName: _jsxFileName$7,
	        lineNumber: 20,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$7,
	      lineNumber: 11,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$7,
	    lineNumber: 10,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * @typedef {import('../../types/pdfjs').PDFViewerApplication} PDFViewerApplication
	 */

	/**
	 * @typedef Link
	 * @prop {string} href
	 */

	/**
	 * @typedef Metadata
	 * @prop {string} title - The document title
	 * @prop {Link[]} link - Array of URIs associated with this document
	 * @prop {string} documentFingerprint - The fingerprint of this PDF. This is
	 *   referred to as the "File Identifier" in the PDF spec. It may be a hash of
	 *   part of the content if the PDF file does not have a File Identifier.
	 *
	 *   PDFs may have two file identifiers. The first is the "original" identifier
	 *   which is not supposed to change if the file is updated and the second
	 *   one is the "last modified" identifier. This property is the original
	 *   identifier.
	 */

	/**
	 * Wait for a PDFViewerApplication to be initialized.
	 *
	 * @param {PDFViewerApplication} app
	 * @return {Promise<void>}
	 */
	function pdfViewerInitialized(app) {
	  // `initializedPromise` was added in PDF.js v2.4.456.
	  // See https://github.com/mozilla/pdf.js/pull/11607. In earlier versions the
	  // `initialized` property can be queried.
	  if (app.initializedPromise) {
	    return app.initializedPromise;
	  } else if (app.initialized) {
	    return Promise.resolve();
	  } else {
	    // PDF.js < v2.4.456. The recommended approach is to listen for a `localized`
	    // DOM event, but this assumes that PDF.js has been configured to publish
	    // events to the DOM. Here we simply poll `app.initialized` because it is
	    // easier.
	    return new Promise(resolve => {
	      const timeout = setInterval(() => {
	        if (app.initialized) {
	          clearTimeout(timeout);
	          resolve();
	        }
	      }, 5);
	    });
	  }
	}

	/**
	 * PDFMetadata extracts metadata about a loading/loaded PDF document from a
	 * PDF.js PDFViewerApplication object.
	 *
	 * @example
	 * // Invoke in a PDF.js viewer, before or after the PDF has finished loading.
	 * const meta = new PDFMetadata(window.PDFViewerApplication)
	 * meta.getUri().then(uri => {
	 *    // Do something with the URL of the PDF.
	 * })
	 */
	class PDFMetadata {
	  /**
	   * Construct a `PDFMetadata` that returns URIs/metadata associated with a
	   * given PDF viewer.
	   *
	   * @param {PDFViewerApplication} app - The `PDFViewerApplication` global from PDF.js
	   */
	  constructor(app) {
	    /** @type {Promise<PDFViewerApplication>} */
	    this._loaded = pdfViewerInitialized(app).then(() => {
	      // Check if document has already loaded.
	      if (app.downloadComplete) {
	        return app;
	      }
	      return new Promise(resolve => {
	        const finish = () => {
	          if (app.eventBus) {
	            app.eventBus.off('documentload', finish);
	            app.eventBus.off('documentloaded', finish);
	          } else {
	            window.removeEventListener('documentload', finish);
	          }
	          resolve(app);
	        };

	        // Listen for "documentloaded" event which signals that the document
	        // has been downloaded and the first page has been rendered.
	        if (app.eventBus) {
	          // PDF.js >= v1.6.210 dispatch events via an internal event bus.
	          // PDF.js < v2.5.207 also dispatches events to the DOM.

	          // `documentloaded` is the preferred event in PDF.js >= v2.0.943.
	          // See https://github.com/mozilla/pdf.js/commit/7bc4bfcc8b7f52b14107f0a551becdf01643c5c2
	          app.eventBus.on('documentloaded', finish);

	          // `documentload` is dispatched by PDF.js < v2.1.266.
	          app.eventBus.on('documentload', finish);
	        } else {
	          // PDF.js < v1.6.210 dispatches events only to the DOM.
	          window.addEventListener('documentload', finish);
	        }
	      });
	    });
	  }

	  /**
	   * Return the URI of the PDF.
	   *
	   * If the PDF is currently loading, the returned promise resolves once loading
	   * is complete.
	   *
	   * @return {Promise<string>}
	   */
	  getUri() {
	    return this._loaded.then(app => {
	      let uri = getPDFURL(app);
	      if (!uri) {
	        uri = fingerprintToURN(getFingerprint(app));
	      }
	      return uri;
	    });
	  }

	  /**
	   * Returns metadata about the document.
	   *
	   * If the PDF is currently loading, the returned promise resolves once loading
	   * is complete.
	   *
	   * @return {Promise<Metadata>}
	   */
	  async getMetadata() {
	    const app = await this._loaded;
	    const {
	      info: documentInfo,
	      contentDispositionFilename,
	      metadata
	    } = await app.pdfDocument.getMetadata();
	    const documentFingerprint = getFingerprint(app);
	    const url = getPDFURL(app);

	    // Return the title metadata embedded in the PDF if available, otherwise
	    // fall back to values from the `Content-Disposition` header or URL.
	    //
	    // PDFs contain two embedded metadata sources, the metadata stream and
	    // the document info dictionary. Per the specification, the metadata stream
	    // is preferred if available.
	    //
	    // This logic is similar to how PDF.js sets `document.title`.
	    let title;
	    if (metadata !== null && metadata !== void 0 && metadata.has('dc:title') && metadata.get('dc:title') !== 'Untitled') {
	      title = /** @type {string} */metadata.get('dc:title');
	    } else if (documentInfo !== null && documentInfo !== void 0 && documentInfo.Title) {
	      title = documentInfo.Title;
	    } else if (contentDispositionFilename) {
	      title = contentDispositionFilename;
	    } else if (url) {
	      title = filenameFromURL(url);
	    } else {
	      title = '';
	    }
	    const link = [{
	      href: fingerprintToURN(documentFingerprint)
	    }];
	    if (url) {
	      link.push({
	        href: url
	      });
	    }
	    return {
	      title,
	      link,
	      documentFingerprint
	    };
	  }
	}

	/**
	 * Get the fingerprint/file identifier of the currently loaded PDF.
	 *
	 * @param {PDFViewerApplication} app
	 */
	function getFingerprint(app) {
	  if (Array.isArray(app.pdfDocument.fingerprints)) {
	    return app.pdfDocument.fingerprints[0];
	  } else {
	    return (/** @type {string} */app.pdfDocument.fingerprint
	    );
	  }
	}

	/**
	 * Generate a URI from a PDF fingerprint suitable for storing as the main
	 * or associated URI of an annotation.
	 *
	 * @param {string} fingerprint
	 */
	function fingerprintToURN(fingerprint) {
	  return `urn:x-pdf:${fingerprint}`;
	}

	/**
	 * @param {PDFViewerApplication} app
	 * @return {string|null} - Valid URL string or `null`
	 */
	function getPDFURL(app) {
	  if (!app.url) {
	    return null;
	  }
	  const url = normalizeURI(app.url);

	  // Local file:// URLs should not be saved in document metadata.
	  // Entries in document.link should be URIs. In the case of
	  // local files, omit the URL.
	  if (url.indexOf('file://') !== 0) {
	    return url;
	  }
	  return null;
	}

	/**
	 * Return the last component of the path part of a URL.
	 *
	 * @param {string} url - A valid URL string
	 * @return {string}
	 */
	function filenameFromURL(url) {
	  const parsed = new URL(url);
	  const pathSegments = parsed.pathname.split('/');
	  return pathSegments[pathSegments.length - 1];
	}

	var _jsxFileName$6 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/integrations/pdf.js";
	const MIN_PDF_WIDTH = 680;

	/**
	 * Return true if `anchor` is in an un-rendered page.
	 *
	 * @param {Anchor} anchor
	 */
	function anchorIsInPlaceholder(anchor) {
	  var _anchor$highlights;
	  const highlight = (_anchor$highlights = anchor.highlights) === null || _anchor$highlights === void 0 ? void 0 : _anchor$highlights[0];
	  return highlight && isInPlaceholder(highlight);
	}

	/** @param {number} ms */
	function delay(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Is the current document the PDF.js viewer application?
	 */
	function isPDF() {
	  // @ts-ignore - TS doesn't know about PDFViewerApplication global.
	  return typeof PDFViewerApplication !== 'undefined';
	}

	/**
	 * Integration that works with PDF.js
	 * @implements {Integration}
	 */
	class PDFIntegration extends TinyEmitter {
	  /**
	   * @param {Annotator} annotator
	   * @param {object} options
	   *   @param {number} [options.reanchoringMaxWait] - Max time to wait for
	   *     re-anchoring to complete when scrolling to an un-rendered page.
	   */
	  constructor(annotator, options = {}) {
	    var _pdfViewerApp$appConf, _pdfViewerApp$appConf2, _options$reanchoringM;
	    super();
	    this.annotator = annotator;

	    // Assume this class is only used if we're in the PDF.js viewer.
	    const pdfWindow = /** @type {PDFWindow} */
	    /** @type {unknown} */window;
	    const pdfViewerApp = pdfWindow.PDFViewerApplication;
	    this.pdfViewer = pdfViewerApp.pdfViewer;
	    this.pdfViewer.viewer.classList.add('has-transparent-text-layer');

	    // Get the element that contains all of the PDF.js UI. This is typically
	    // `document.body`.
	    this.pdfContainer = (_pdfViewerApp$appConf = (_pdfViewerApp$appConf2 = pdfViewerApp.appConfig) === null || _pdfViewerApp$appConf2 === void 0 ? void 0 : _pdfViewerApp$appConf2.appContainer) !== null && _pdfViewerApp$appConf !== void 0 ? _pdfViewerApp$appConf : document.body;
	    this.pdfMetadata = new PDFMetadata(pdfViewerApp);
	    this.observer = new MutationObserver(lodash_debounce(() => this._update(), 100));
	    this.observer.observe(this.pdfViewer.viewer, {
	      attributes: true,
	      attributeFilter: ['data-loaded'],
	      childList: true,
	      subtree: true
	    });

	    /**
	     * Amount of time to wait for re-anchoring to complete when scrolling to
	     * an anchor in a not-yet-rendered page.
	     */
	    this._reanchoringMaxWait = (_options$reanchoringM = options.reanchoringMaxWait) !== null && _options$reanchoringM !== void 0 ? _options$reanchoringM : 3000;

	    /**
	     * Banners shown at the top of the PDF viewer.
	     *
	     * @type {HTMLElement|null}
	     */
	    this._banner = null;

	    /** State indicating which banners to show above the PDF viewer. */
	    this._bannerState = {
	      /** @type {ContentInfoConfig|null} */
	      contentInfo: null,
	      /** Warning that the current PDF does not have selectable text. */
	      noTextWarning: false
	    };
	    this._updateBannerState(this._bannerState);
	    this._checkForSelectableText();

	    // Hide annotation layer when the user is making a selection. The annotation
	    // layer appears above the invisible text layer and can interfere with text
	    // selection. See https://github.com/hypothesis/client/issues/1464.
	    this._updateAnnotationLayerVisibility = () => {
	      const selection = /** @type {Selection} */pdfWindow.getSelection();

	      // Add CSS class to indicate whether there is a selection. Annotation
	      // layers are then hidden by a CSS rule in `pdfjs-overrides.scss`.
	      this.pdfViewer.viewer.classList.toggle('is-selecting', !selection.isCollapsed);
	    };
	    this._listeners = new ListenerCollection$1();
	    this._listeners.add(document, 'selectionchange', this._updateAnnotationLayerVisibility);

	    // A flag that indicates whether `destroy` has been called. Used to handle
	    // `destroy` being called during async code elsewhere in the class.
	    this._destroyed = false;
	  }
	  destroy() {
	    var _this$_banner;
	    this._listeners.removeAll();
	    this.pdfViewer.viewer.classList.remove('has-transparent-text-layer');
	    this.observer.disconnect();
	    (_this$_banner = this._banner) === null || _this$_banner === void 0 ? void 0 : _this$_banner.remove();
	    this._destroyed = true;
	  }

	  /**
	   * Return the URL of the currently loaded PDF document.
	   */
	  uri() {
	    return this.pdfMetadata.getUri();
	  }

	  /**
	   * Return the metadata (eg. title) for the currently loaded PDF document.
	   */
	  getMetadata() {
	    return this.pdfMetadata.getMetadata();
	  }

	  /**
	   * Display a banner at the top of the PDF viewer showing information about the
	   * current document.
	   *
	   * @param {ContentInfoConfig} contentInfo
	   */
	  showContentInfo(contentInfo) {
	    this._updateBannerState({
	      contentInfo
	    });
	  }

	  /**
	   * Resolve serialized `selectors` from an annotation to a range.
	   *
	   * @param {HTMLElement} root
	   * @param {Selector[]} selectors
	   * @return {Promise<Range>}
	   */
	  anchor(root, selectors) {
	    // nb. The `root` argument is not really used by `anchor`. It existed for
	    // consistency between HTML and PDF anchoring and could be removed.
	    return anchor(root, selectors);
	  }

	  /**
	   * Return true if the text in a range lies within the text layer of a PDF.
	   *
	   * @param {Range} range
	   */
	  canAnnotate(range) {
	    return canDescribe(range);
	  }

	  /* istanbul ignore next */
	  canStyleClusteredHighlights() {
	    return true;
	  }

	  /**
	   * Generate selectors for the text in `range`.
	   *
	   * @param {HTMLElement} root
	   * @param {Range} range
	   * @return {Promise<Selector[]>}
	   */
	  describe(root, range) {
	    // nb. The `root` argument is not really used by `anchor`. It existed for
	    // consistency between HTML and PDF anchoring and could be removed.
	    return describe(root, range);
	  }

	  /**
	   * Check whether the PDF has selectable text and show a warning if not.
	   */
	  async _checkForSelectableText() {
	    // Wait for PDF to load.
	    try {
	      await this.uri();
	    } catch (e) {
	      return;
	    }

	    // Handle `PDF` instance being destroyed while URI is fetched. This is only
	    // expected to happen in synchronous tests.
	    if (this._destroyed) {
	      return;
	    }
	    try {
	      const hasText = await documentHasText();
	      this._updateBannerState({
	        noTextWarning: !hasText
	      });
	    } catch (err) {
	      /* istanbul ignore next */
	      console.warn('Unable to check for text in PDF:', err);
	    }
	  }

	  /**
	   * Update banners shown above the PDF viewer.
	   *
	   * @param {Partial<typeof PDFIntegration.prototype._bannerState>} state
	   */
	  _updateBannerState(state) {
	    this._bannerState = {
	      ...this._bannerState,
	      ...state
	    };

	    // Get a reference to the top-level DOM element associated with the PDF.js
	    // viewer.
	    const outerContainer = /** @type {HTMLElement} */
	    document.querySelector('#outerContainer');
	    const showBanner = this._bannerState.contentInfo || this._bannerState.noTextWarning;
	    if (!showBanner) {
	      var _this$_banner2;
	      (_this$_banner2 = this._banner) === null || _this$_banner2 === void 0 ? void 0 : _this$_banner2.remove();
	      this._banner = null;

	      // Undo inline styles applied when the banner is shown. The banner will
	      // then gets its normal 100% height set by PDF.js's CSS.
	      outerContainer.style.height = '';
	      return;
	    }
	    if (!this._banner) {
	      this._banner = document.createElement('hypothesis-banner');
	      document.body.prepend(this._banner);
	      createShadowRoot(this._banner);
	    }
	    P$1(o(Banners, {
	      children: [this._bannerState.contentInfo && o(ContentInfoBanner, {
	        info: this._bannerState.contentInfo
	      }, void 0, false, {
	        fileName: _jsxFileName$6,
	        lineNumber: 290,
	        columnNumber: 11
	      }, this), this._bannerState.noTextWarning && o(WarningBanner, {}, void 0, false, {
	        fileName: _jsxFileName$6,
	        lineNumber: 292,
	        columnNumber: 45
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$6,
	      lineNumber: 288,
	      columnNumber: 7
	    }, this), /** @type {ShadowRoot} */this._banner.shadowRoot);
	    const bannerHeight = this._banner.getBoundingClientRect().height;

	    // The `#outerContainer` element normally has height set to 100% of the body.
	    //
	    // Reduce this by the height of the banner so that it doesn't extend beyond
	    // the bottom of the viewport.
	    //
	    // We don't currently handle the height of the banner changing here.
	    outerContainer.style.height = `calc(100% - ${bannerHeight}px)`;
	  }

	  // This method (re-)anchors annotations when pages are rendered and destroyed.
	  _update() {
	    // A list of annotations that need to be refreshed.
	    const refreshAnnotations = /** @type {AnnotationData[]} */[];
	    const pageCount = this.pdfViewer.pagesCount;
	    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
	      var _page$textLayer;
	      const page = this.pdfViewer.getPageView(pageIndex);
	      if (!(page !== null && page !== void 0 && (_page$textLayer = page.textLayer) !== null && _page$textLayer !== void 0 && _page$textLayer.renderingDone)) {
	        continue;
	      }

	      // Detect what needs to be done by checking the rendering state.
	      switch (page.renderingState) {
	        case RenderingStates.INITIAL:
	          // This page has been reset to its initial state so its text layer
	          // is no longer valid. Null it out so that we don't process it again.
	          page.textLayer = null;
	          break;
	        case RenderingStates.FINISHED:
	          // This page is still rendered. If it has a placeholder node that
	          // means the PDF anchoring module anchored annotations before it was
	          // rendered. Remove this, which will cause the annotations to anchor
	          // again, below.
	          removePlaceholder(page.div);
	          break;
	      }
	    }

	    // Find all the anchors that have been invalidated by page state changes.
	    for (let anchor of this.annotator.anchors) {
	      // Skip any we already know about.
	      if (anchor.highlights) {
	        if (refreshAnnotations.includes(anchor.annotation)) {
	          continue;
	        }

	        // If the highlights are no longer in the document it means that either
	        // the page was destroyed by PDF.js or the placeholder was removed above.
	        // The annotations for these anchors need to be refreshed.
	        for (let index = 0; index < anchor.highlights.length; index++) {
	          const hl = anchor.highlights[index];
	          if (!document.body.contains(hl)) {
	            anchor.highlights.splice(index, 1);
	            delete anchor.range;
	            refreshAnnotations.push(anchor.annotation);
	            break;
	          }
	        }
	      }
	    }
	    refreshAnnotations.map(annotation => this.annotator.anchor(annotation));
	  }

	  /**
	   * Return the scrollable element which contains the document content.
	   *
	   * @return {HTMLElement}
	   */
	  contentContainer() {
	    return (/** @type {HTMLElement} */
	      document.querySelector('#viewerContainer')
	    );
	  }

	  /**
	   * Attempt to make the PDF viewer and the sidebar fit side-by-side without
	   * overlap if there is enough room in the viewport to do so reasonably.
	   * Resize the PDF viewer container element to leave the right amount of room
	   * for the sidebar, and prompt PDF.js to re-render the PDF pages to scale
	   * within that resized container.
	   *
	   * @param {SidebarLayout} sidebarLayout
	   * @return {boolean} - True if side-by-side mode was activated
	   */
	  fitSideBySide(sidebarLayout) {
	    const maximumWidthToFit = window.innerWidth - sidebarLayout.width;
	    const active = sidebarLayout.expanded && maximumWidthToFit >= MIN_PDF_WIDTH;

	    // If the sidebar is closed, we reserve enough space for the toolbar controls
	    // so that they don't overlap a) the chevron-menu on the right side of
	    // PDF.js's top toolbar and b) the document's scrollbar.
	    //
	    // If the sidebar is open, we reserve space for the whole sidebar if there is
	    // room, otherwise we reserve the same space as in the closed state to
	    // prevent the PDF content shifting when opening and closing the sidebar.
	    const reservedSpace = active ? sidebarLayout.width : sidebarLayout.toolbarWidth;
	    this.pdfContainer.style.width = `calc(100% - ${reservedSpace}px)`;

	    // The following logic is pulled from PDF.js `webViewerResize`
	    const currentScaleValue = this.pdfViewer.currentScaleValue;
	    if (currentScaleValue === 'auto' || currentScaleValue === 'page-fit' || currentScaleValue === 'page-width') {
	      // NB: There is logic within the setter for `currentScaleValue`
	      // Setting this scale value will prompt PDF.js to recalculate viewport
	      this.pdfViewer.currentScaleValue = currentScaleValue;
	    }
	    // This will cause PDF pages to re-render if their scaling has changed
	    this.pdfViewer.update();
	    return active;
	  }

	  /**
	   * Scroll to the location of an anchor in the PDF.
	   *
	   * If the anchor refers to a location that is an un-rendered page far from
	   * the viewport, then scrolling happens in three phases. First the document
	   * scrolls to the approximate location indicated by the placeholder anchor,
	   * then `scrollToAnchor` waits until the page's text layer is rendered and
	   * the annotation is re-anchored in the fully rendered page. Then it scrolls
	   * again to the final location.
	   *
	   * @param {Anchor} anchor
	   */
	  async scrollToAnchor(anchor) {
	    const annotation = anchor.annotation;
	    const inPlaceholder = anchorIsInPlaceholder(anchor);
	    const offset = this._anchorOffset(anchor);
	    if (offset === null) {
	      return;
	    }

	    // nb. We only compute the scroll offset once at the start of scrolling.
	    // This is important as the highlight may be removed from the document during
	    // the scroll due to a page transitioning from rendered <-> un-rendered.
	    await scrollElement(this.contentContainer(), offset);
	    if (inPlaceholder) {
	      const anchor = await this._waitForAnnotationToBeAnchored(annotation, this._reanchoringMaxWait);
	      if (!anchor) {
	        return;
	      }
	      const offset = this._anchorOffset(anchor);
	      if (offset === null) {
	        return;
	      }
	      await scrollElement(this.contentContainer(), offset);
	    }
	  }

	  /**
	   * Wait for an annotation to be anchored in a rendered page.
	   *
	   * @param {AnnotationData} annotation
	   * @param {number} maxWait
	   * @return {Promise<Anchor|null>}
	   */
	  async _waitForAnnotationToBeAnchored(annotation, maxWait) {
	    var _anchor;
	    const start = Date.now();
	    let anchor;
	    do {
	      // nb. Re-anchoring might result in a different anchor object for the
	      // same annotation.
	      anchor = this.annotator.anchors.find(a => a.annotation === annotation);
	      if (!anchor || anchorIsInPlaceholder(anchor)) {
	        anchor = null;

	        // If no anchor was found, wait a bit longer and check again to see if
	        // re-anchoring completed.
	        await delay(20);
	      }
	    } while (!anchor && Date.now() - start < maxWait);
	    return (_anchor = anchor) !== null && _anchor !== void 0 ? _anchor : null;
	  }

	  /**
	   * Return the offset that the PDF content container would need to be scrolled
	   * to, in order to make an anchor visible.
	   *
	   * @param {Anchor} anchor
	   * @return {number|null} - Target offset or `null` if this anchor was not resolved
	   */
	  _anchorOffset(anchor) {
	    if (!anchor.highlights) {
	      // This anchor was not resolved to a location in the document.
	      return null;
	    }
	    const highlight = anchor.highlights[0];
	    return offsetRelativeTo(highlight, this.contentContainer());
	  }
	}

	const DEBOUNCE_WAIT = 40;

	/** @typedef {(frame: HTMLIFrameElement) => void} FrameCallback */

	/**
	 * FrameObserver detects iframes added and deleted from the document.
	 *
	 * To enable annotation, an iframe must be opted-in by adding the
	 * `enable-annotation` attribute.
	 *
	 * We require the `enable-annotation` attribute to avoid the overhead of loading
	 * the client into frames which are not useful to annotate. See
	 * https://github.com/hypothesis/client/issues/530
	 */
	class FrameObserver {
	  /**
	   * @param {Element} element - root of the DOM subtree to watch for the addition
	   *   and removal of annotatable iframes
	   * @param {FrameCallback} onFrameAdded - callback fired when an annotatable iframe is added
	   * @param {FrameCallback} onFrameRemoved - callback triggered when the annotatable iframe is removed
	   */
	  constructor(element, onFrameAdded, onFrameRemoved) {
	    this._element = element;
	    this._onFrameAdded = onFrameAdded;
	    this._onFrameRemoved = onFrameRemoved;
	    /** @type {Set<HTMLIFrameElement>} */
	    this._annotatableFrames = new Set();
	    this._isDisconnected = false;
	    this._mutationObserver = new MutationObserver(lodash_debounce(() => {
	      this._discoverFrames();
	    }, DEBOUNCE_WAIT));
	    this._discoverFrames();
	    this._mutationObserver.observe(this._element, {
	      childList: true,
	      subtree: true,
	      attributeFilter: ['enable-annotation']
	    });
	  }
	  disconnect() {
	    this._isDisconnected = true;
	    this._mutationObserver.disconnect();
	  }

	  /**
	   * @param {HTMLIFrameElement} frame
	   */
	  async _addFrame(frame) {
	    this._annotatableFrames.add(frame);
	    try {
	      await onNextDocumentReady(frame);
	      if (this._isDisconnected) {
	        return;
	      }
	      const frameWindow = frame.contentWindow;
	      // @ts-expect-error
	      // This line raises an exception if the iframe is from a different origin
	      frameWindow.addEventListener('unload', () => {
	        this._removeFrame(frame);
	      });
	      this._onFrameAdded(frame);
	    } catch (e) {
	      console.warn(`Unable to inject the Hypothesis client (from '${document.location.href}' into a cross-origin frame '${frame.src}')`);
	    }
	  }

	  /**
	   * @param {HTMLIFrameElement} frame
	   */
	  _removeFrame(frame) {
	    this._annotatableFrames.delete(frame);
	    this._onFrameRemoved(frame);
	  }
	  _discoverFrames() {
	    const frames = new Set( /** @type {NodeListOf<HTMLIFrameElement> } */
	    this._element.querySelectorAll('iframe[enable-annotation]'));
	    for (let frame of frames) {
	      if (!this._annotatableFrames.has(frame)) {
	        this._addFrame(frame);
	      }
	    }
	    for (let frame of this._annotatableFrames) {
	      if (!frames.has(frame)) {
	        this._removeFrame(frame);
	      }
	    }
	  }
	}

	/**
	 * Test if this is the empty document that a new iframe has before the URL
	 * specified by its `src` attribute loads.
	 *
	 * @param {HTMLIFrameElement} frame
	 */
	function hasBlankDocumentThatWillNavigate(frame) {
	  var _frame$contentDocumen;
	  return ((_frame$contentDocumen = frame.contentDocument) === null || _frame$contentDocumen === void 0 ? void 0 : _frame$contentDocumen.location.href) === 'about:blank' &&
	  // Do we expect the frame to navigate away from about:blank?
	  frame.hasAttribute('src') && frame.src !== 'about:blank';
	}

	/**
	 * Wrapper around {@link onDocumentReady} which returns a promise that resolves
	 * the first time that a document in `frame` becomes ready.
	 *
	 * See {@link onDocumentReady} for the definition of _ready_.
	 *
	 * @param {HTMLIFrameElement} frame
	 * @return {Promise<Document>}
	 */
	function onNextDocumentReady(frame) {
	  return new Promise((resolve, reject) => {
	    const unsubscribe = onDocumentReady(frame, (err, doc) => {
	      unsubscribe();
	      if (doc) {
	        resolve(doc);
	      } else {
	        reject(err);
	      }
	    });
	  });
	}

	/**
	 * Register a callback that is invoked when the content document
	 * (`frame.contentDocument`) in a same-origin iframe becomes _ready_.
	 *
	 * A document is _ready_ when its `readyState` is either "interactive" or
	 * "complete". It must also not be the empty document with URL "about:blank"
	 * that iframes have before they navigate to the URL specified by their "src"
	 * attribute.
	 *
	 * The callback is fired both for the document that is in the frame when
	 * `onDocumentReady` is called, as well as for new documents that are
	 * subsequently loaded into the same frame.
	 *
	 * If at any time the frame navigates to an iframe that is cross-origin,
	 * the callback will fire with an error. It will fire again for subsequent
	 * navigations, but due to platform limitations, it will only fire after the
	 * next document fully loads (ie. when the frame's `load` event fires).
	 *
	 * @param {HTMLIFrameElement} frame
	 * @param {(err: Error|null, document?: Document) => void} callback
	 * @param {object} options
	 *   @param {number} [options.pollInterval]
	 * @return {() => void} Callback that unsubscribes from future changes
	 */
	function onDocumentReady(frame, callback, {
	  pollInterval = 10
	} = {}) {
	  /** @type {number|undefined} */
	  let pollTimer;
	  /** @type {() => void} */
	  let pollForDocumentChange;

	  // Visited documents for which we have fired the callback or are waiting
	  // to become ready.
	  const documents = new WeakSet();
	  const cancelPoll = () => {
	    clearTimeout(pollTimer);
	    pollTimer = undefined;
	  };

	  // Begin polling for a document change when the current document is about
	  // to go away.
	  const pollOnUnload = () => {
	    if (frame.contentDocument) {
	      var _frame$contentWindow;
	      (_frame$contentWindow = frame.contentWindow) === null || _frame$contentWindow === void 0 ? void 0 : _frame$contentWindow.addEventListener('unload', pollForDocumentChange);
	    }
	  };
	  const checkForDocumentChange = () => {
	    const currentDocument = frame.contentDocument;

	    // `contentDocument` may be null if the frame navigated to a URL that is
	    // cross-origin, or if the `<iframe>` was removed from the document.
	    if (!currentDocument) {
	      cancelPoll();
	      const errorMessage = frame.isConnected ? 'Frame is cross-origin' : 'Frame is disconnected';
	      callback(new Error(errorMessage));
	      return;
	    }
	    if (documents.has(currentDocument)) {
	      return;
	    }
	    documents.add(currentDocument);
	    cancelPoll();
	    if (!hasBlankDocumentThatWillNavigate(frame)) {
	      const isReady = currentDocument.readyState === 'interactive' || currentDocument.readyState === 'complete';
	      if (isReady) {
	        callback(null, currentDocument);
	      } else {
	        currentDocument.addEventListener('DOMContentLoaded', () => callback(null, currentDocument));
	      }
	    }

	    // Poll for the next document change.
	    pollOnUnload();
	  };
	  let canceled = false;
	  pollForDocumentChange = () => {
	    cancelPoll();
	    if (!canceled) {
	      pollTimer = setInterval(checkForDocumentChange, pollInterval);
	    }
	  };

	  // Set up observers for signals that the document either has changed or will
	  // soon change. There are two signals with different trade-offs:
	  //
	  //  - Polling after the current document is about to be unloaded. This allows
	  //    us to detect the new document quickly, but may not fire in some
	  //    situations (exact circumstances unclear, but eg. MDN warns about this).
	  //
	  //    This is set up in the first call to `checkForDocumentChange`.
	  //
	  //  - The iframe's "load" event. This is guaranteed to fire but only after the
	  //    new document is fully loaded.
	  frame.addEventListener('load', checkForDocumentChange);

	  // Notify caller about the current document. This fires asynchronously so that
	  // the caller will have received the unsubscribe callback first.
	  const initialCheckTimer = setTimeout(checkForDocumentChange, 0);
	  return () => {
	    canceled = true;
	    clearTimeout(initialCheckTimer);
	    cancelPoll();
	    frame.removeEventListener('load', checkForDocumentChange);
	  };
	}

	/**
	 * @typedef WordBox
	 * @prop {string} text
	 * @prop {DOMRect} rect - Bounding rectangle of all glyphs in word
	 */

	/**
	 * @typedef LineBox
	 * @prop {WordBox[]} words
	 * @prop {DOMRect} rect - Bounding rectangle of all words in line
	 */

	/**
	 * @typedef ColumnBox
	 * @prop {LineBox[]} lines
	 * @prop {DOMRect} rect - Bounding rectangle of all lines in column
	 */

	/**
	 * Group characters in a page into words, lines and columns.
	 *
	 * The input is assumed to be _roughly_ reading order, more so at the low (word,
	 * line) level. When the input is not in reading order, the output may be
	 * divided into more lines / columns than expected. Downstream code is expected
	 * to tolerate over-segmentation. This function should try to avoid producing
	 * lines or columns that significantly intersect, as this can impair text
	 * selection.
	 *
	 * @param {DOMRect[]} charBoxes - Bounding rectangle associated with each character on the page
	 * @param {string} text - Text that corresponds to `charBoxes`
	 * @return {ColumnBox[]}
	 */
	function analyzeLayout(charBoxes, text) {
	  /** @type {WordBox[]} */
	  const words = [];

	  /** @type {WordBox} */
	  let currentWord = {
	    text: '',
	    rect: new DOMRect()
	  };

	  // Group characters into words.
	  const addWord = () => {
	    if (currentWord.text.length > 0) {
	      words.push(currentWord);
	      currentWord = {
	        text: '',
	        rect: new DOMRect()
	      };
	    }
	  };
	  for (let [i, rect] of charBoxes.entries()) {
	    const char = text[i];
	    const isSpace = /\s/.test(char);
	    currentWord.rect = unionRects(currentWord.rect, rect);

	    // To simplify downstream logic, normalize whitespace.
	    currentWord.text += isSpace ? ' ' : char;
	    if (isSpace) {
	      addWord();
	    }
	  }
	  addWord();

	  /** @type {LineBox[]} */
	  const lines = [];

	  /** @type {LineBox} */
	  let currentLine = {
	    words: [],
	    rect: new DOMRect()
	  };

	  // Group words into lines.
	  const addLine = () => {
	    if (currentLine.words.length > 0) {
	      lines.push(currentLine);
	      currentLine = {
	        words: [],
	        rect: new DOMRect()
	      };
	    }
	  };
	  for (let word of words) {
	    const prevWord = currentLine.words[currentLine.words.length - 1];
	    if (prevWord) {
	      const prevCenter = rectCenter(prevWord.rect);
	      const currentCenter = rectCenter(word.rect);
	      const xDist = currentCenter.x - prevCenter.x;
	      if (!rectsOverlapVertically(prevWord.rect, word.rect) ||
	      // Break line if current word is left of previous word
	      xDist < 0) {
	        addLine();
	      }
	    }
	    currentLine.words.push(word);
	    currentLine.rect = unionRects(currentLine.rect, word.rect);
	  }
	  addLine();

	  /** @type {ColumnBox[]} */
	  const columns = [];

	  /** @type {ColumnBox} */
	  let currentColumn = {
	    lines: [],
	    rect: new DOMRect()
	  };

	  // Group lines into columns.
	  const addColumn = () => {
	    if (currentColumn.lines.length > 0) {
	      columns.push(currentColumn);
	      currentColumn = {
	        lines: [],
	        rect: new DOMRect()
	      };
	    }
	  };
	  for (let line of lines) {
	    const prevLine = currentColumn.lines[currentColumn.lines.length - 1];
	    if (prevLine) {
	      const prevCenter = rectCenter(prevLine.rect);
	      const currentCenter = rectCenter(line.rect);
	      const yDist = currentCenter.y - prevCenter.y;
	      if (!rectsOverlapHorizontally(prevLine.rect, line.rect) || rectsOverlapVertically(prevLine.rect, line.rect) ||
	      // Break column if current line is above previous line.
	      //
	      // In the case of a two column layout for example, this happens when
	      // moving from the bottom of one column to the top of the next.
	      yDist < 0 ||
	      // Break column if there is a large gap between the previous and current lines.
	      //
	      // This helps to avoid generating intersecting columns if there happens
	      // to be other content between the lines that comes later in the input.
	      yDist > line.rect.height * 4) {
	        addColumn();
	      }
	    }
	    currentColumn.lines.push(line);
	    currentColumn.rect = unionRects(currentColumn.rect, line.rect);
	  }
	  addColumn();
	  return columns;
	}

	/**
	 * ImageTextLayer maintains a transparent text layer on top of an image
	 * which contains text. This enables the text in the image to be selected
	 * and highlighted.
	 *
	 * This is similar to the one that PDF.js creates for us in our standard PDF
	 * viewer.
	 */
	class ImageTextLayer {
	  /**
	   * Create a text layer which is displayed on top of `image`.
	   *
	   * @param {Element} image - Rendered image on which to overlay the text layer.
	   *   The text layer will be inserted into the DOM as the next sibling of `image`.
	   * @param {DOMRect[]} charBoxes - Bounding boxes for characters in the image.
	   *   Coordinates should be in the range [0-1], where 0 is the top/left corner
	   *   of the image and 1 is the bottom/right.
	   * @param {string} text - Characters in the image corresponding to `charBoxes`
	   */
	  constructor(image, charBoxes, text) {
	    if (charBoxes.length !== text.length) {
	      throw new Error('Char boxes length does not match text length');
	    }

	    // Create container for text layer and position it above the image.
	    const containerParent = /** @type {HTMLElement} */image.parentNode;
	    const container = document.createElement('hypothesis-text-layer');
	    containerParent.insertBefore(container, image.nextSibling);

	    // Position text layer over image. We assume the image's top-left corner
	    // aligns with the top-left corner of its container.
	    containerParent.style.position = 'relative';
	    container.style.position = 'absolute';
	    container.style.top = '0';
	    container.style.left = '0';
	    container.style.color = 'transparent';

	    // Prevent inherited text alignment from affecting positioning.
	    // VitalSource sets `text-align: center` for example.
	    container.style.textAlign = 'left';

	    // Use multiply blending to make text in the image more readable when
	    // the corresponding text in the text layer is selected or highlighted.
	    // We apply a similar effect in PDF.js.
	    container.style.mixBlendMode = 'multiply';

	    // Set a fixed font style on the container and create a canvas using the same
	    // font which we can use to measure the "natural" size of the text. This is
	    // later used when scaling the text to fit the underlying part of the image.
	    const fontSize = 16;
	    const fontFamily = 'sans-serif';
	    container.style.fontSize = fontSize + 'px';
	    container.style.fontFamily = fontFamily;
	    const canvas = document.createElement('canvas');
	    const context = /** @type {CanvasRenderingContext2D} */
	    canvas.getContext('2d');
	    context.font = `${fontSize}px ${fontFamily}`;

	    /**
	     * Generate a CSS value that scales with the `--x-scale` or `--y-scale` CSS variables.
	     *
	     * @param {'x'|'y'} dimension
	     * @param {number} value
	     * @param {string} unit
	     */
	    const scaledValue = (dimension, value, unit = 'px') => `calc(var(--${dimension}-scale) * ${value}${unit})`;

	    // Group characters into words, lines and columns. Then use the result to
	    // create a hierarchical DOM structure in the text layer:
	    //
	    // 1. Columns are positioned absolutely
	    // 2. Columns stack lines vertically using a block layout
	    // 3. Lines arrange words horizontally using an inline layout
	    //
	    // This allows the browser to select the expected text when the cursor is
	    // in-between lines or words.
	    const columns = analyzeLayout(charBoxes, text);
	    for (let column of columns) {
	      const columnEl = document.createElement('hypothesis-text-column');
	      columnEl.style.display = 'block';
	      columnEl.style.position = 'absolute';
	      columnEl.style.left = scaledValue('x', column.rect.left);
	      columnEl.style.top = scaledValue('y', column.rect.top);
	      let prevLine = null;
	      for (let line of column.lines) {
	        const lineEl = document.createElement('hypothesis-text-line');
	        lineEl.style.display = 'block';
	        lineEl.style.marginLeft = scaledValue('x', line.rect.left - column.rect.left);
	        lineEl.style.height = scaledValue('y', line.rect.height);
	        if (prevLine) {
	          lineEl.style.marginTop = scaledValue('y', line.rect.top - prevLine.rect.bottom);
	        }
	        prevLine = line;

	        // Prevent line breaks if the word elements don't quite fit the line.
	        lineEl.style.whiteSpace = 'nowrap';
	        let prevWord = null;
	        for (let word of line.words) {
	          const wordEl = document.createElement('hypothesis-text-word');
	          wordEl.style.display = 'inline-block';
	          wordEl.style.transformOrigin = 'top left';
	          wordEl.textContent = word.text;
	          if (prevWord) {
	            wordEl.style.marginLeft = scaledValue('x', word.rect.left - prevWord.rect.right);
	          }
	          prevWord = word;

	          // Set the size of this box used for layout. This does not affect the
	          // rendered size of the content.
	          wordEl.style.width = scaledValue('x', word.rect.width);
	          wordEl.style.height = scaledValue('y', word.rect.height);

	          // Don't collapse whitespace at end of words, so it remains visible
	          // in selected text. Also prevent line breaks due to overflows.
	          wordEl.style.whiteSpace = 'pre';

	          // Scale content using a transform. This affects the rendered size
	          // of the text, used by text selection and
	          // `Element.getBoundingClientRect`, but not layout.
	          const metrics = context.measureText(word.text);
	          const xScale = scaledValue('x', word.rect.width / metrics.width, '');
	          const yScale = scaledValue('y', word.rect.height / fontSize, '');
	          wordEl.style.transform = `scale(${xScale}, ${yScale})`;
	          lineEl.append(wordEl);
	        }
	        columnEl.append(lineEl);
	      }
	      container.append(columnEl);
	    }
	    const updateTextLayerSize = () => {
	      const {
	        width: imageWidth,
	        height: imageHeight
	      } = image.getBoundingClientRect();
	      container.style.width = imageWidth + 'px';
	      container.style.height = imageHeight + 'px';
	      container.style.setProperty('--x-scale', `${imageWidth}`);
	      container.style.setProperty('--y-scale', `${imageHeight}`);
	    };
	    updateTextLayerSize();

	    /**
	     * Container element for the text layer.
	     *
	     * This is exposed so that callers can tweak the style if needed (eg.
	     * to set a z-index value).
	     */
	    this.container = container;
	    this._updateTextLayerSize = lodash_debounce(updateTextLayerSize, {
	      maxWait: 50
	    });
	    this._listeners = new ListenerCollection$1();
	    if (typeof ResizeObserver !== 'undefined') {
	      this._imageSizeObserver = new ResizeObserver(() => {
	        this._updateTextLayerSize();
	      });
	      this._imageSizeObserver.observe(image);
	    }

	    // Fallback for browsers that don't support ResizeObserver (Safari < 13.4).
	    // Due to the debouncing, we can register this listener in all browsers for
	    // simplicity, without downsides.
	    this._listeners.add(window, 'resize', this._updateTextLayerSize);
	  }

	  /**
	   * Synchronously update the text layer to match the size and position of
	   * the image.
	   *
	   * Normally the text layer is resized automatically but asynchronously when
	   * the image size changes (eg. due to the window being resized) and updates
	   * are debounced. This method can be used to force an immediate update if
	   * needed.
	   */
	  updateSync() {
	    this._updateTextLayerSize();
	    this._updateTextLayerSize.flush();
	  }
	  destroy() {
	    var _this$_imageSizeObser;
	    this.container.remove();
	    this._listeners.removeAll();
	    this._updateTextLayerSize.cancel();
	    (_this$_imageSizeObser = this._imageSizeObserver) === null || _this$_imageSizeObser === void 0 ? void 0 : _this$_imageSizeObser.disconnect();
	  }
	}

	/**
	 * @typedef {import('../types/annotator').Destroyable} Destroyable
	 */

	/**
	 * Options for injecting the client into child frames.
	 *
	 * This includes the URL of the client's boot script, plus configuration
	 * for the client when it loads in the child frame.
	 *
	 * @typedef {{ clientUrl: string } & Record<string, unknown>} InjectConfig
	 */

	/**
	 * HypothesisInjector injects the Hypothesis client into same-origin iframes.
	 *
	 * The client will be injected automatically into frames that have the
	 * `enable-annotation` attribute set (see {@link FrameObserver}) and can be
	 * manually injected into other frames using {@link injectClient}.
	 *
	 * @implements {Destroyable}
	 */
	class HypothesisInjector {
	  /**
	   * @param {Element} element - root of the DOM subtree to watch for the
	   *   addition and removal of annotatable iframes
	   * @param {InjectConfig} config
	   */
	  constructor(element, config) {
	    this._config = config;
	    this._frameObserver = new FrameObserver(element, frame => injectClient(frame, config),
	    // Frame added callback
	    () => {} // Frame removed callback
	    );
	  }

	  /**
	   * Disables the injection of the Hypothesis client into child iframes.
	   */
	  destroy() {
	    this._frameObserver.disconnect();
	  }
	}

	/**
	 * Check if the client was added to a frame by {@link injectHypothesis}.
	 *
	 * @param {HTMLIFrameElement} iframe
	 */
	function hasHypothesis(iframe) {
	  const iframeDocument = /** @type {Document} */iframe.contentDocument;
	  return iframeDocument.querySelector('script.js-hypothesis-config') !== null;
	}

	/**
	 * Inject Hypothesis client into a frame.
	 *
	 * IMPORTANT: This method requires that the iframe is same-origin
	 * (frame.contentDocument|contentWindow is not null).
	 *
	 * This waits for the frame to finish loading before injecting the client.
	 * See {@link onDocumentReady}.
	 *
	 * @param {HTMLIFrameElement} frame
	 * @param {InjectConfig} config -
	 * @param {string} [frameId] - The ID for the guest frame. If none is provided,
	 *   the guest will use a new randomly-generated ID.
	 */
	async function injectClient(frame, config, frameId) {
	  if (hasHypothesis(frame)) {
	    return;
	  }
	  await onNextDocumentReady(frame);

	  // Propagate the client resource locations from the current frame.
	  //
	  // These settings are set only in the browser extension and not by the
	  // embedded client (served by h).
	  //
	  // We could potentially do this by allowing these settings to be part of
	  // the "annotator" config (see `annotator/config/index.js`) which gets passed
	  // to the constructor.
	  const {
	    assetRoot,
	    notebookAppUrl,
	    sidebarAppUrl
	  } = parseJsonConfig(document);
	  const injectedConfig = {
	    ...config,
	    assetRoot,
	    notebookAppUrl,
	    sidebarAppUrl,
	    subFrameIdentifier: frameId !== null && frameId !== void 0 ? frameId : generateHexString(10)
	  };
	  const configElement = document.createElement('script');
	  configElement.className = 'js-hypothesis-config';
	  configElement.type = 'application/json';
	  configElement.innerText = JSON.stringify(injectedConfig);
	  const bootScript = document.createElement('script');
	  bootScript.async = true;
	  bootScript.src = config.clientUrl;
	  const iframeDocument = /** @type {Document} */frame.contentDocument;
	  iframeDocument.body.appendChild(configElement);
	  iframeDocument.body.appendChild(bootScript);
	}

	// When activating side-by-side mode for VitalSource PDF documents, make sure
	// at least this much space (in pixels) is left for the PDF document. Any
	// smaller and it feels unreadable or too-zoomed-out
	const MIN_CONTENT_WIDTH = 480;

	/**
	 * Book metadata exposed by the VitalSource viewer.
	 */

	/**
	 * Return the custom DOM element that contains the book content iframe.
	 */
	function findBookElement(document_ = document) {
	  return document_.querySelector('mosaic-book');
	}

	/**
	 * Return the role of the current frame in the VitalSource Bookshelf reader or
	 * `null` if the frame is not part of Bookshelf.
	 *
	 * @return `container` if this is the parent of the content frame, `content` if
	 *   this is the frame that contains the book content or `null` if the document is
	 *   not part of the Bookshelf reader.
	 */
	function vitalSourceFrameRole(window_ = window) {
	  var _window_$frameElement;
	  if (findBookElement(window_.document)) {
	    return 'container';
	  }
	  const parentDoc = (_window_$frameElement = window_.frameElement) === null || _window_$frameElement === void 0 ? void 0 : _window_$frameElement.ownerDocument;
	  if (parentDoc && findBookElement(parentDoc)) {
	    return 'content';
	  }
	  return null;
	}

	/**
	 * VitalSourceInjector runs in the book container frame and loads the client into
	 * book content frames.
	 *
	 * The frame structure of the VitalSource book reader looks like this:
	 *
	 * [VitalSource top frame - bookshelf.vitalsource.com]
	 *   |
	 *   [Book container frame - jigsaw.vitalsource.com]
	 *     |
	 *     [Book content frame - jigsaw.vitalsource.com]
	 *
	 * The Hypothesis client can be initially loaded in the container frame or the
	 * content frame. As the user navigates around the book, the container frame
	 * remains the same but the content frame is swapped out. When used in the
	 * container frame, this class handles initial injection of the client as a
	 * guest in the current content frame, and re-injecting the client into new
	 * content frames when they are created.
	 */
	class VitalSourceInjector {
	  /**
	   * @param config - Configuration for injecting the client into
	   *   book content frames
	   */
	  constructor(config) {
	    _defineProperty(this, "_frameObserver", void 0);
	    const bookElement = findBookElement();
	    if (!bookElement) {
	      throw new Error('Book container element not found');
	    }
	    const contentFrames = new WeakSet();
	    const shadowRoot = bookElement.shadowRoot;
	    const injectClientIntoContentFrame = () => {
	      const frame = shadowRoot.querySelector('iframe');
	      if (!frame || contentFrames.has(frame)) {
	        // Either there is no content frame or we are already watching it.
	        return;
	      }
	      contentFrames.add(frame);
	      onDocumentReady(frame, (err, document_) => {
	        if (err) {
	          return;
	        }

	        // If `err` is null, then `document_` will be set.
	        const body = document_.body;
	        const isBookContent = body &&
	        // Check that this is not the temporary page containing encrypted and
	        // invisible book content, which is replaced with the real content after
	        // a form submission. These pages look something like:
	        //
	        // ```
	        // <html>
	        //   <title>content</title>
	        //   <body><div id="page-content">{ Base64 encoded data }</div></body>
	        // </html>
	        // ```
	        !body.querySelector('#page-content');
	        if (isBookContent) {
	          injectClient(frame, config, 'vitalsource-content');
	        }
	      });
	    };
	    injectClientIntoContentFrame();

	    // Re-inject client into content frame after a chapter navigation.
	    this._frameObserver = new MutationObserver(injectClientIntoContentFrame);
	    this._frameObserver.observe(shadowRoot, {
	      childList: true,
	      subtree: true
	    });
	  }
	  destroy() {
	    this._frameObserver.disconnect();
	  }
	}

	/**
	 * Bounding box of a single character in the page.
	 *
	 * Coordinates are expressed in percentage distance from the top-left corner
	 * of the rendered page.
	 */

	function getPDFPageImage() {
	  return document.querySelector('img#pbk-page');
	}

	/**
	 * Fix how a VitalSource book content frame scrolls, so that various related
	 * Hypothesis behaviors (the bucket bar, scrolling annotations into view) work
	 * as intended.
	 *
	 * Some VitalSource books (PDFs) make content scrolling work by making the
	 * content iframe really tall and having the parent frame scroll. This stops the
	 * Hypothesis bucket bar and scrolling annotations into view from working.
	 */
	function makeContentFrameScrollable(frame) {
	  if (frame.getAttribute('scrolling') !== 'no') {
	    // This is a book (eg. EPUB) where the workaround is not required.
	    return;
	  }

	  // Override inline styles of iframe (hence `!important`). The iframe lives
	  // in Shadow DOM, so the element styles won't affect the rest of the app.
	  const style = document.createElement('style');
	  style.textContent = `iframe { height: 100% !important; }`;
	  frame.insertAdjacentElement('beforebegin', style);
	  const removeScrollingAttr = () => frame.removeAttribute('scrolling');
	  removeScrollingAttr();

	  // Sometimes the attribute gets re-added by VS. Remove it if that
	  // happens.
	  const attrObserver = new MutationObserver(removeScrollingAttr);
	  attrObserver.observe(frame, {
	    attributes: true
	  });
	}

	/**
	 * Integration for the content frame in VitalSource's Bookshelf ebook reader.
	 *
	 * This integration delegates to the standard HTML integration for most
	 * functionality, but it adds logic to:
	 *
	 *  - Customize the document URI and metadata that is associated with annotations
	 *  - Prevent VitalSource's built-in selection menu from getting in the way
	 *    of the adder.
	 *  - Create a hidden text layer in PDF-based books, so the user can select text
	 *    in the PDF image. This is similar to what PDF.js does for us in PDFs.
	 */
	class VitalSourceContentIntegration extends TinyEmitter {
	  constructor( /* istanbul ignore next - defaults are overridden in tests */
	  container = document.body, options) {
	    var _options$bookElement;
	    super();
	    _defineProperty(this, "_bookElement", void 0);
	    _defineProperty(this, "_features", void 0);
	    _defineProperty(this, "_htmlIntegration", void 0);
	    _defineProperty(this, "_listeners", void 0);
	    _defineProperty(this, "_textLayer", void 0);
	    this._features = options.features;
	    const bookElement = (_options$bookElement = options.bookElement) !== null && _options$bookElement !== void 0 ? _options$bookElement : findBookElement(window.parent.document);
	    if (!bookElement) {
	      /* istanbul ignore next */
	      throw new Error('Failed to find <mosaic-book> element in container frame');
	    }
	    this._bookElement = bookElement;

	    // If the book_as_single_document flag changed, this will change the
	    // document URI returned by this integration.
	    this._features.on('flagsChanged', () => {
	      this.emit('uriChanged');
	    });
	    const htmlFeatures = new FeatureFlags();

	    // Forcibly enable the side-by-side feature for VS books. This feature is
	    // only behind a flag for regular web pages, which are typically more
	    // complex and varied than EPUB books.
	    htmlFeatures.update({
	      html_side_by_side: true
	    });
	    this._htmlIntegration = new HTMLIntegration({
	      container,
	      features: htmlFeatures
	    });
	    this._listeners = new ListenerCollection$1();

	    // Prevent mouse events from reaching the window. This prevents VitalSource
	    // from showing its native selection menu, which obscures the client's
	    // annotation toolbar.
	    //
	    // To avoid interfering with the client's own selection handling, this
	    // event blocking must happen at the same level or higher in the DOM tree
	    // than where SelectionObserver listens.
	    const stopEvents = ['mouseup', 'mousedown', 'mouseout'];
	    for (const event of stopEvents) {
	      this._listeners.add(document.documentElement, event, e => {
	        e.stopPropagation();
	      });
	    }

	    // Install scrolling workaround for PDFs. We do this in the content frame
	    // so that it works whether Hypothesis is loaded directly into the content
	    // frame or injected by VitalSourceInjector from the parent frame.
	    const frame = window.frameElement;
	    if (frame) {
	      makeContentFrameScrollable(frame);
	    }

	    // If this is a PDF, create the hidden text layer above the rendered PDF
	    // image.
	    const bookImage = getPDFPageImage();
	    const pageData = window.innerPageData;
	    if (bookImage && pageData) {
	      const charRects = pageData.glyphs.glyphs.map(glyph => {
	        const left = glyph.l / 100;
	        const right = glyph.r / 100;
	        const top = glyph.t / 100;
	        const bottom = glyph.b / 100;
	        return new DOMRect(left, top, right - left, bottom - top);
	      });
	      this._textLayer = new ImageTextLayer(bookImage, charRects, pageData.words);

	      // VitalSource has several DOM elements in the page which are raised
	      // above the image using z-index. One of these is used to handle VS's
	      // own text selection functionality.
	      //
	      // Set a z-index on our text layer to raise it above VS's own one.
	      this._textLayer.container.style.zIndex = '100';
	    }
	  }
	  canAnnotate() {
	    return true;
	  }
	  destroy() {
	    var _this$_textLayer;
	    (_this$_textLayer = this._textLayer) === null || _this$_textLayer === void 0 ? void 0 : _this$_textLayer.destroy();
	    this._listeners.removeAll();
	    this._htmlIntegration.destroy();
	  }
	  anchor(root, selectors) {
	    return this._htmlIntegration.anchor(root, selectors);
	  }
	  async describe(root, range) {
	    const selectors = this._htmlIntegration.describe(root, range);
	    if (!this._bookIsSingleDocument()) {
	      return selectors;
	    }
	    const pageInfo = await this._bookElement.getCurrentPage();

	    // We generate an "EPUBContentSelector" with a CFI for all VS books,
	    // although for PDF-based books the CFI is a string generated from the
	    // page number.
	    const extraSelectors = [{
	      type: 'EPUBContentSelector',
	      cfi: pageInfo.cfi,
	      url: pageInfo.absoluteURL,
	      title: pageInfo.chapterTitle
	    }];

	    // If this is a PDF-based book, add a page selector. PDFs always have page
	    // numbers available. EPUB-based books _may_ have information about how
	    // content maps to page numbers in a printed edition of the book. We
	    // currently limit page number selectors to PDFs until more is understood
	    // about when EPUB page numbers are reliable/likely to remain stable.
	    const bookInfo = this._bookElement.getBookInfo();
	    if (bookInfo.format === 'pbk') {
	      extraSelectors.push({
	        type: 'PageSelector',
	        index: pageInfo.index,
	        label: pageInfo.page
	      });
	    }
	    selectors.push(...extraSelectors);
	    return selectors;
	  }
	  contentContainer() {
	    return this._htmlIntegration.contentContainer();
	  }
	  fitSideBySide(layout) {
	    // For PDF books, handle side-by-side mode in this integration. For EPUBs,
	    // delegate to the HTML integration.
	    const bookImage = getPDFPageImage();
	    if (bookImage && this._textLayer) {
	      const bookContainer = bookImage.parentElement;
	      const textLayer = this._textLayer;

	      // Update the PDF image size and alignment to fit alongside the sidebar.
	      // `ImageTextLayer` will handle adjusting the text layer to match.
	      const newWidth = window.innerWidth - layout.width;
	      preserveScrollPosition(() => {
	        if (layout.expanded && newWidth > MIN_CONTENT_WIDTH) {
	          // The VS book viewer sets `text-align: center` on the <body> element
	          // by default, which centers the book image in the page. When the sidebar
	          // is open we need the image to be left-aligned.
	          bookContainer.style.textAlign = 'left';
	          bookImage.style.width = `${newWidth}px`;
	        } else {
	          bookContainer.style.textAlign = '';
	          bookImage.style.width = '';
	        }

	        // Update text layer to match new image dimensions immediately. This
	        // is needed so that `preserveScrollPosition` can see how the content
	        // has shifted when this callback returns.
	        textLayer.updateSync();
	      });
	      return layout.expanded;
	    } else {
	      return this._htmlIntegration.fitSideBySide(layout);
	    }
	  }
	  async getMetadata() {
	    if (this._bookIsSingleDocument()) {
	      const bookInfo = this._bookElement.getBookInfo();
	      return {
	        title: bookInfo.title,
	        link: []
	      };
	    }

	    // Return minimal metadata which includes only the information we really
	    // want to include.
	    return {
	      title: document.title,
	      link: []
	    };
	  }
	  navigateToSegment(ann) {
	    var _ann$target$0$selecto;
	    const selector = (_ann$target$0$selecto = ann.target[0].selector) === null || _ann$target$0$selecto === void 0 ? void 0 : _ann$target$0$selecto.find(s => s.type === 'EPUBContentSelector');
	    if (selector !== null && selector !== void 0 && selector.cfi) {
	      this._bookElement.goToCfi(selector.cfi);
	    } else if (selector !== null && selector !== void 0 && selector.url) {
	      this._bookElement.goToURL(selector.url);
	    } else {
	      throw new Error('No segment information available');
	    }
	  }
	  persistFrame() {
	    // Hint to the sidebar that it should not unload annotations when the
	    // guest frame using this integration unloads.
	    return true;
	  }
	  async segmentInfo() {
	    const pageInfo = await this._bookElement.getCurrentPage();
	    return {
	      cfi: pageInfo.cfi,
	      url: pageInfo.absoluteURL
	    };
	  }
	  async uri() {
	    if (this._bookIsSingleDocument()) {
	      const bookInfo = this._bookElement.getBookInfo();
	      const bookId = bookInfo.isbn;
	      return `https://bookshelf.vitalsource.com/reader/books/${bookId}`;
	    }

	    // An example of a typical URL for the chapter content in the Bookshelf reader is:
	    //
	    // https://jigsaw.vitalsource.com/books/9781848317703/epub/OPS/xhtml/chapter_001.html#cfi=/6/10%5B;vnd.vst.idref=chap001%5D!/4
	    //
	    // Where "9781848317703" is the VitalSource book ID ("vbid"), "chapter_001.html"
	    // is the location of the HTML page for the current chapter within the book
	    // and the `#cfi` fragment identifies the scroll location.
	    //
	    // Note that this URL is typically different than what is displayed in the
	    // iframe's `src` attribute.

	    // Strip off search parameters and fragments.
	    const uri = new URL(document.location.href);
	    uri.search = '';
	    return uri.toString();
	  }
	  async scrollToAnchor(anchor) {
	    return this._htmlIntegration.scrollToAnchor(anchor);
	  }

	  /**
	   * Return true if the feature flag to treat books as one document is enabled,
	   * as opposed to treating each chapter/segment/page as a separate document.
	   */
	  _bookIsSingleDocument() {
	    return this._features.flagEnabled('book_as_single_document');
	  }
	  waitForFeatureFlags() {
	    // The `book_as_single_document` flag changes the URI reported by this
	    // integration.
	    //
	    // Ask the guest to delay reporting document metadata to the sidebar until
	    // feature flags have been received. This ensures that the initial document
	    // info reported to the sidebar after a chapter navigation is consistent
	    // between the previous/new guest frames.
	    return true;
	  }
	}

	/**
	 * @typedef {import('../../types/annotator').Annotator} Annotator
	 * @typedef {import('../../types/annotator').ContentInfoConfig} ContentInfoBanner
	 * @typedef {import('../../types/annotator').Integration} Integration
	 */

	/**
	 * Create the integration that handles document-type specific aspects of
	 * guest functionality.
	 *
	 * @param {Annotator} annotator
	 * @return {Integration}
	 */
	function createIntegration(annotator) {
	  if (isPDF()) {
	    return new PDFIntegration(annotator);
	  }
	  const vsFrameRole = vitalSourceFrameRole();
	  if (vsFrameRole === 'content') {
	    return new VitalSourceContentIntegration(document.body, {
	      features: annotator.features
	    });
	  }
	  return new HTMLIntegration({
	    features: annotator.features
	  });
	}

	/**
	 * Return the current selection or `null` if there is no selection or it is empty.
	 *
	 * @param {Document} document
	 * @return {Range|null}
	 */
	function selectedRange(document) {
	  const selection = document.getSelection();
	  if (!selection || selection.rangeCount === 0) {
	    return null;
	  }
	  const range = selection.getRangeAt(0);
	  if (range.collapsed) {
	    return null;
	  }
	  return range;
	}

	/**
	 * An observer that watches for and buffers changes to the document's current selection.
	 */
	class SelectionObserver {
	  /**
	   * Start observing changes to the current selection in the document.
	   *
	   * @param {(range: Range|null) => void} callback -
	   *   Callback invoked with the selected region of the document when it has
	   *   changed.
	   * @param {Document} document_ - Test seam
	   */
	  constructor(callback, document_ = document) {
	    let isMouseDown = false;
	    this._pendingCallback = null;
	    const scheduleCallback = (delay = 10) => {
	      this._pendingCallback = setTimeout(() => {
	        callback(selectedRange(document_));
	      }, delay);
	    };

	    /** @param {Event} event */
	    const eventHandler = event => {
	      if (event.type === 'mousedown') {
	        isMouseDown = true;
	      }
	      if (event.type === 'mouseup') {
	        isMouseDown = false;
	      }

	      // If the user makes a selection with the mouse, wait until they release
	      // it before reporting a selection change.
	      if (isMouseDown) {
	        return;
	      }
	      this._cancelPendingCallback();

	      // Schedule a notification after a short delay. The delay serves two
	      // purposes:
	      //
	      // - If this handler was called as a result of a 'mouseup' event then the
	      //   selection will not be updated until the next tick of the event loop.
	      //   In this case we only need a short delay.
	      //
	      // - If the user is changing the selection with a non-mouse input (eg.
	      //   keyboard or selection handles on mobile) this buffers updates and
	      //   makes sure that we only report one when the update has stopped
	      //   changing. In this case we want a longer delay.

	      const delay = event.type === 'mouseup' ? 10 : 100;
	      scheduleCallback(delay);
	    };
	    this._document = document_;
	    this._listeners = new ListenerCollection$1();
	    this._listeners.add(document_, 'selectionchange', eventHandler);

	    // Mouse events are handled on the body because propagation may be stopped
	    // before they reach the document in some environments (eg. VitalSource).
	    this._listeners.add(document_.body, 'mousedown', eventHandler);
	    this._listeners.add(document_.body, 'mouseup', eventHandler);

	    // Report the initial selection.
	    scheduleCallback(1);
	  }
	  disconnect() {
	    this._listeners.removeAll();
	    this._cancelPendingCallback();
	  }
	  _cancelPendingCallback() {
	    if (this._pendingCallback) {
	      clearTimeout(this._pendingCallback);
	      this._pendingCallback = null;
	    }
	  }
	}

	/**
	 * Test whether an iframe fills the viewport of an ancestor frame.
	 *
	 * @param {Window} frame
	 * @param {Window} ancestor
	 */
	function frameFillsAncestor(frame, ancestor) {
	  if (frame === ancestor) {
	    return true;
	  }
	  if (frame.parent !== ancestor) {
	    // To keep things simple, we initially only support direct ancestors.
	    return false;
	  }
	  if (!frame.frameElement) {
	    // This is a cross-origin iframe. In this case we can't tell if it fills
	    // the parent frame or not.
	    return false;
	  }
	  const frameBox = frame.frameElement.getBoundingClientRect();

	  // Threshold for deciding when a frame occupies enough of its parent's width
	  // to count as filling the viewport.
	  const fullWidthThreshold = 0.8;
	  return frameBox.width / frame.parent.innerWidth >= fullWidthThreshold;
	}

	/** Return all the annotations tags associated with the selected text. */
	function annotationsForSelection() {
	  const selection = window.getSelection();
	  const range = selection.getRangeAt(0);
	  const tags = itemsForRange(range, node => {
	    var _annotation;
	    return (_annotation = node._annotation) === null || _annotation === void 0 ? void 0 : _annotation.$tag;
	  });
	  return tags;
	}

	/**
	 * Return the annotation tags associated with any highlights that contain a given
	 * DOM node.
	 */
	function annotationsAt(node) {
	  const items = getHighlightsContainingNode(node).map(h => h._annotation).filter(ann => ann !== undefined).map(ann => ann === null || ann === void 0 ? void 0 : ann.$tag);
	  return items;
	}

	/**
	 * Resolve an anchor's associated document region to a concrete `Range`.
	 *
	 * This may fail if anchoring failed or if the document has been mutated since
	 * the anchor was created in a way that invalidates the anchor.
	 */
	function resolveAnchor(anchor) {
	  if (!anchor.range) {
	    return null;
	  }
	  try {
	    return anchor.range.toRange();
	  } catch {
	    return null;
	  }
	}
	function removeTextSelection() {
	  var _document$getSelectio;
	  (_document$getSelectio = document.getSelection()) === null || _document$getSelectio === void 0 ? void 0 : _document$getSelectio.removeAllRanges();
	}

	/**
	 * Subset of the Hypothesis client configuration that is used by {@link Guest}.
	 */

	/**
	 * `Guest` is the central class of the annotator that handles anchoring (locating)
	 * annotations in the document when they are fetched by the sidebar, rendering
	 * highlights for them and handling subsequent interactions with the highlights.
	 *
	 * It is also responsible for listening to changes in the current selection
	 * and triggering the display of controls to create new annotations. When one
	 * of these controls is clicked, it creates the new annotation and sends it to
	 * the sidebar.
	 *
	 * Within a browser tab, there is typically one `Guest` instance per frame that
	 * loads Hypothesis (not all frames will be annotation-enabled). In one frame,
	 * usually the top-level one, there will also be an instance of the `Sidebar`
	 * class that shows the sidebar app and surrounding UI. The `Guest` instance in
	 * each frame connects to the sidebar and host frames as part of its
	 * initialization.
	 */
	class Guest {
	  /** Ranges of the current text selection. */

	  /**
	   * The anchors generated by resolving annotation selectors to locations in the
	   * document. These are added by `anchor` and removed by `detach`.
	   *
	   * There is one anchor per annotation `Target`, which typically means one
	   * anchor per annotation.
	   */

	  /** Promise that resolves when feature flags are received from the sidebar. */

	  /**
	   * Tags of annotations that are currently anchored or being anchored in
	   * the guest.
	   */

	  /**
	   * Integration that handles document-type specific functionality in the
	   * guest.
	   */

	  /** Channel for host-guest communication. */

	  /** Channel for guest-sidebar communication. */

	  /**
	   * Tags of currently hovered annotations. This is used to set the hovered
	   * state correctly for new highlights if the associated annotation is already
	   * hovered in the sidebar.
	   */

	  /**
	   * @param element -
	   *   The root element in which the `Guest` instance should be able to anchor
	   *   or create annotations. In an ordinary web page this typically `document.body`.
	   * @param [config]
	   * @param [hostFrame] -
	   *   Host frame which this guest is associated with. This is expected to be
	   *   an ancestor of the guest frame. It may be same or cross origin.
	   */
	  constructor(element, config = {}, hostFrame = window) {
	    var _this$_frameIdentifie, _this$_integration$ca, _this$_integration2;
	    _defineProperty(this, "element", void 0);
	    _defineProperty(this, "selectedRanges", void 0);
	    _defineProperty(this, "anchors", void 0);
	    _defineProperty(this, "features", void 0);
	    _defineProperty(this, "_featureFlagsReceived", void 0);
	    _defineProperty(this, "_adder", void 0);
	    _defineProperty(this, "_clusterToolbar", void 0);
	    _defineProperty(this, "_hostFrame", void 0);
	    _defineProperty(this, "_highlightsVisible", void 0);
	    _defineProperty(this, "_isAdderVisible", void 0);
	    _defineProperty(this, "_informHostOnNextSelectionClear", void 0);
	    _defineProperty(this, "_selectionObserver", void 0);
	    _defineProperty(this, "_annotations", void 0);
	    _defineProperty(this, "_frameIdentifier", void 0);
	    _defineProperty(this, "_portFinder", void 0);
	    _defineProperty(this, "_integration", void 0);
	    _defineProperty(this, "_hostRPC", void 0);
	    _defineProperty(this, "_sidebarRPC", void 0);
	    _defineProperty(this, "_bucketBarClient", void 0);
	    _defineProperty(this, "_sideBySideActive", void 0);
	    _defineProperty(this, "_listeners", void 0);
	    _defineProperty(this, "_hoveredAnnotations", void 0);
	    this.element = element;
	    this._hostFrame = hostFrame;
	    this._highlightsVisible = false;
	    this._isAdderVisible = false;
	    this._informHostOnNextSelectionClear = true;
	    this.selectedRanges = [];
	    this._adder = new Adder(this.element, {
	      onAnnotate: () => this.createAnnotation(),
	      onHighlight: () => this.createAnnotation({
	        highlight: true
	      }),
	      // When the "Show" button is triggered, open the sidebar and select the
	      // annotations. Also give keyboard focus to the first selected annotation.
	      // This is an important affordance for eg. screen reader users as it gives
	      // them an efficient way to navigate from highlights in the document to
	      // the corresponding comments in the sidebar.
	      onShowAnnotations: tags => this.selectAnnotations(tags, {
	        focusInSidebar: true
	      })
	    });
	    this._selectionObserver = new SelectionObserver(range => {
	      if (range) {
	        this._onSelection(range);
	      } else {
	        this._onClearSelection();
	      }
	    });
	    this.anchors = [];
	    this._annotations = new Set();

	    // Set the frame identifier if it's available.
	    // The "top" guest instance will have this as null since it's in a top frame not a sub frame
	    this._frameIdentifier = config.subFrameIdentifier || null;
	    this._portFinder = new PortFinder({
	      hostFrame: this._hostFrame,
	      source: 'guest',
	      sourceId: (_this$_frameIdentifie = this._frameIdentifier) !== null && _this$_frameIdentifie !== void 0 ? _this$_frameIdentifie : undefined
	    });
	    this.features = new FeatureFlags();
	    this._featureFlagsReceived = new Promise(resolve => {
	      this.features.on('flagsChanged', resolve);
	    });
	    this._integration = createIntegration(this);
	    this._integration.on('uriChanged', () => this._sendDocumentInfo());
	    if (config.contentInfoBanner) {
	      var _this$_integration$sh, _this$_integration;
	      (_this$_integration$sh = (_this$_integration = this._integration).showContentInfo) === null || _this$_integration$sh === void 0 ? void 0 : _this$_integration$sh.call(_this$_integration, config.contentInfoBanner);
	    }
	    if ((_this$_integration$ca = (_this$_integration2 = this._integration).canStyleClusteredHighlights) !== null && _this$_integration$ca !== void 0 && _this$_integration$ca.call(_this$_integration2)) {
	      this._clusterToolbar = new HighlightClusterController(this._integration.contentContainer(), {
	        features: this.features
	      });
	    }
	    this._hostRPC = new PortRPC();
	    this._connectHost(hostFrame);
	    this._sidebarRPC = new PortRPC();
	    this._connectSidebar();
	    this._bucketBarClient = new BucketBarClient({
	      contentContainer: this._integration.contentContainer(),
	      hostRPC: this._hostRPC
	    });
	    this._sideBySideActive = false;

	    // Setup event handlers on the root element
	    this._listeners = new ListenerCollection$1();
	    this._setupElementEvents();
	    this._hoveredAnnotations = new Set();
	  }

	  // Add DOM event listeners for clicks, taps etc. on the document and
	  // highlights.
	  _setupElementEvents() {
	    // Hide the sidebar in response to a document click or tap, so it doesn't obscure
	    // the document content.
	    const maybeCloseSidebar = element => {
	      if (this._sideBySideActive) {
	        // Don't hide the sidebar if event was disabled because the sidebar
	        // doesn't overlap the content.
	        return;
	      }
	      if (annotationsAt(element).length) {
	        // Don't hide the sidebar if the event comes from an element that contains a highlight
	        return;
	      }
	      this._sidebarRPC.call('closeSidebar');
	    };
	    this._listeners.add(this.element, 'mouseup', event => {
	      const {
	        target,
	        metaKey,
	        ctrlKey
	      } = event;
	      const tags = annotationsAt(target);
	      if (tags.length && this._highlightsVisible) {
	        const toggle = metaKey || ctrlKey;
	        this.selectAnnotations(tags, {
	          toggle
	        });
	      }
	    });
	    this._listeners.add(this.element, 'mousedown', ({
	      target
	    }) => {
	      maybeCloseSidebar(target);
	    });

	    // Allow taps on the document to hide the sidebar as well as clicks.
	    // On iOS < 13 (2019), elements like h2 or div don't emit 'click' events.
	    this._listeners.add(this.element, 'touchstart', ({
	      target
	    }) => {
	      maybeCloseSidebar(target);
	    });
	    this._listeners.add(this.element, 'mouseover', ({
	      target
	    }) => {
	      const tags = annotationsAt(target);
	      if (tags.length && this._highlightsVisible) {
	        this._sidebarRPC.call('hoverAnnotations', tags);
	      }
	    });
	    this._listeners.add(this.element, 'mouseout', () => {
	      if (this._highlightsVisible) {
	        this._sidebarRPC.call('hoverAnnotations', []);
	      }
	    });
	    this._listeners.add(this.element, 'keydown', event => {
	      this._handleShortcut(event);
	    });
	    this._listeners.add(window, 'resize', () => this._repositionAdder());
	  }

	  /**
	   * Retrieve metadata for the current document.
	   */
	  async getDocumentInfo() {
	    var _this$_integration$se, _this$_integration3, _this$_integration$pe, _this$_integration$pe2, _this$_integration4;
	    const [uri, metadata, segmentInfo] = await Promise.all([this._integration.uri(), this._integration.getMetadata(), (_this$_integration$se = (_this$_integration3 = this._integration).segmentInfo) === null || _this$_integration$se === void 0 ? void 0 : _this$_integration$se.call(_this$_integration3)]);
	    return {
	      uri: normalizeURI(uri),
	      metadata,
	      segmentInfo,
	      persistent: (_this$_integration$pe = (_this$_integration$pe2 = (_this$_integration4 = this._integration).persistFrame) === null || _this$_integration$pe2 === void 0 ? void 0 : _this$_integration$pe2.call(_this$_integration4)) !== null && _this$_integration$pe !== void 0 ? _this$_integration$pe : false
	    };
	  }

	  /** Send the current document URI and metadata to the sidebar. */
	  async _sendDocumentInfo() {
	    var _this$_integration$wa, _this$_integration5;
	    if ((_this$_integration$wa = (_this$_integration5 = this._integration).waitForFeatureFlags) !== null && _this$_integration$wa !== void 0 && _this$_integration$wa.call(_this$_integration5)) {
	      await this._featureFlagsReceived;
	    }
	    const metadata = await this.getDocumentInfo();
	    this._sidebarRPC.call('documentInfoChanged', metadata);
	  }

	  /**
	   * Shift the position of the adder on window 'resize' events
	   */
	  _repositionAdder() {
	    var _window$getSelection;
	    if (this._isAdderVisible === false) {
	      return;
	    }
	    const range = (_window$getSelection = window.getSelection()) === null || _window$getSelection === void 0 ? void 0 : _window$getSelection.getRangeAt(0);
	    if (range) {
	      this._onSelection(range);
	    }
	  }
	  async _connectHost(hostFrame) {
	    this._hostRPC.on('clearSelection', () => {
	      if (selectedRange(document)) {
	        this._informHostOnNextSelectionClear = false;
	        removeTextSelection();
	      }
	    });
	    this._hostRPC.on('createAnnotation', () => this.createAnnotation());
	    this._hostRPC.on('hoverAnnotations', tags => this._hoverAnnotations(tags));
	    this._hostRPC.on('scrollToClosestOffScreenAnchor', (tags, direction) => this._scrollToClosestOffScreenAnchor(tags, direction));
	    this._hostRPC.on('selectAnnotations', (tags, toggle) => this.selectAnnotations(tags, {
	      toggle
	    }));
	    this._hostRPC.on('sidebarLayoutChanged', sidebarLayout => {
	      if (frameFillsAncestor(window, hostFrame)) {
	        this.fitSideBySide(sidebarLayout);
	      }
	    });

	    // Discover and connect to the host frame. All RPC events must be
	    // registered before creating the channel.
	    const hostPort = await this._portFinder.discover('host');
	    this._hostRPC.connect(hostPort);
	  }
	  async _connectSidebar() {
	    this._sidebarRPC.on('featureFlagsUpdated', flags => this.features.update(flags));

	    // Handlers for events sent when user hovers or clicks on an annotation card
	    // in the sidebar.
	    this._sidebarRPC.on('hoverAnnotations', tags => this._hoverAnnotations(tags));
	    this._sidebarRPC.on('scrollToAnnotation', tag => {
	      const anchor = this.anchors.find(a => a.annotation.$tag === tag);
	      if (!(anchor !== null && anchor !== void 0 && anchor.highlights)) {
	        return;
	      }
	      const range = resolveAnchor(anchor);
	      if (!range) {
	        return;
	      }

	      // Emit a custom event that the host page can respond to. This is useful,
	      // for example, if the highlighted content is contained in a collapsible
	      // section of the page that needs to be un-collapsed.
	      const event = new CustomEvent('scrolltorange', {
	        bubbles: true,
	        cancelable: true,
	        detail: range
	      });
	      const defaultNotPrevented = this.element.dispatchEvent(event);
	      if (defaultNotPrevented) {
	        this._integration.scrollToAnchor(anchor);
	      }
	    });

	    // Handler for controls on the sidebar
	    this._sidebarRPC.on('setHighlightsVisible', showHighlights => {
	      this.setHighlightsVisible(showHighlights, false /* notifyHost */);
	    });

	    this._sidebarRPC.on('deleteAnnotation', tag => this.detach(tag));
	    this._sidebarRPC.on('loadAnnotations', annotations => annotations.forEach(annotation => this.anchor(annotation)));
	    this._sidebarRPC.on('showContentInfo', info => {
	      var _this$_integration$sh2, _this$_integration6;
	      return (_this$_integration$sh2 = (_this$_integration6 = this._integration).showContentInfo) === null || _this$_integration$sh2 === void 0 ? void 0 : _this$_integration$sh2.call(_this$_integration6, info);
	    });
	    this._sidebarRPC.on('navigateToSegment', annotation => {
	      var _this$_integration$na, _this$_integration7;
	      return (_this$_integration$na = (_this$_integration7 = this._integration).navigateToSegment) === null || _this$_integration$na === void 0 ? void 0 : _this$_integration$na.call(_this$_integration7, annotation);
	    });

	    // Connect to sidebar and send document info/URIs to it.
	    //
	    // RPC calls are deferred until a connection is made, so these steps can
	    // complete in either order.
	    this._portFinder.discover('sidebar').then(port => {
	      this._sidebarRPC.connect(port);
	    });
	    this._sendDocumentInfo();
	  }
	  destroy() {
	    var _this$_clusterToolbar;
	    this._portFinder.destroy();
	    this._hostRPC.destroy();
	    this._sidebarRPC.destroy();
	    this._listeners.removeAll();
	    this._selectionObserver.disconnect();
	    this._adder.destroy();
	    this._bucketBarClient.destroy();
	    (_this$_clusterToolbar = this._clusterToolbar) === null || _this$_clusterToolbar === void 0 ? void 0 : _this$_clusterToolbar.destroy();
	    removeAllHighlights(this.element);
	    this._integration.destroy();
	  }

	  /**
	   * Anchor an annotation's selectors in the document.
	   *
	   * _Anchoring_ resolves a set of selectors to a concrete region of the document
	   * which is then highlighted.
	   *
	   * Any existing anchors associated with `annotation` will be removed before
	   * re-anchoring the annotation.
	   */
	  async anchor(annotation) {
	    /**
	     * Resolve an annotation's selectors to a concrete range.
	     */
	    const locate = async target => {
	      // Only annotations with an associated quote can currently be anchored.
	      // This is because the quote is used to verify anchoring with other selector
	      // types.
	      if (!target.selector || !target.selector.some(s => s.type === 'TextQuoteSelector')) {
	        return {
	          annotation,
	          target
	        };
	      }
	      let anchor;
	      try {
	        const range = await this._integration.anchor(this.element, target.selector);
	        // Convert the `Range` to a `TextRange` which can be converted back to
	        // a `Range` later. The `TextRange` representation allows for highlights
	        // to be inserted during anchoring other annotations without "breaking"
	        // this anchor.
	        const textRange = TextRange.fromRange(range);
	        anchor = {
	          annotation,
	          target,
	          range: textRange
	        };
	      } catch (err) {
	        anchor = {
	          annotation,
	          target
	        };
	      }
	      return anchor;
	    };

	    /**
	     * Highlight the text range that `anchor` refers to.
	     */
	    const highlight = anchor => {
	      var _anchor$annotation;
	      const range = resolveAnchor(anchor);
	      if (!range) {
	        return;
	      }
	      const highlights = highlightRange(range, (_anchor$annotation = anchor.annotation) === null || _anchor$annotation === void 0 ? void 0 : _anchor$annotation.$cluster /* cssClass */);
	      highlights.forEach(h => {
	        h._annotation = anchor.annotation;
	      });
	      anchor.highlights = highlights;
	      if (this._hoveredAnnotations.has(anchor.annotation.$tag)) {
	        setHighlightsFocused(highlights, true);
	      }
	    };

	    // Remove existing anchors for this annotation.
	    this.detach(annotation.$tag, false /* notify */);

	    this._annotations.add(annotation.$tag);

	    // Resolve selectors to ranges and insert highlights.
	    if (!annotation.target) {
	      annotation.target = [];
	    }
	    const anchors = await Promise.all(annotation.target.map(locate));

	    // If the annotation was removed while anchoring, don't save the anchors.
	    if (!this._annotations.has(annotation.$tag)) {
	      return [];
	    }
	    for (const anchor of anchors) {
	      highlight(anchor);
	    }

	    // Set flag indicating whether anchoring succeeded. For each target,
	    // anchoring is successful either if there are no selectors (ie. this is a
	    // Page Note) or we successfully resolved the selectors to a range.
	    annotation.$orphan = anchors.length > 0 && anchors.every(anchor => anchor.target.selector && !anchor.range);
	    this._updateAnchors(this.anchors.concat(anchors), true /* notify */);

	    // Let other frames (eg. the sidebar) know about the new annotation.
	    this._sidebarRPC.call('syncAnchoringStatus', annotation);
	    return anchors;
	  }

	  /**
	   * Remove the anchors and associated highlights for an annotation from the document.
	   *
	   * @param [notify] - For internal use. Whether to inform the host
	   *   frame about the removal of an anchor.
	   */
	  detach(tag, notify = true) {
	    this._annotations.delete(tag);
	    const anchors = [];
	    for (const anchor of this.anchors) {
	      if (anchor.annotation.$tag !== tag) {
	        anchors.push(anchor);
	      } else if (anchor.highlights) {
	        removeHighlights(anchor.highlights);
	      }
	    }
	    this._updateAnchors(anchors, notify);
	  }
	  _updateAnchors(anchors, notify) {
	    this.anchors = anchors;
	    if (notify) {
	      this._bucketBarClient.update(this.anchors);
	    }
	  }

	  /**
	   * Create a new annotation that is associated with the selected region of
	   * the current document.
	   *
	   * @param options
	   *   @param [options.highlight] - If true, the new annotation has
	   *     the `$highlight` flag set, causing it to be saved immediately without
	   *     prompting for a comment.
	   * @return The new annotation
	   */
	  async createAnnotation({
	    highlight = false
	  } = {}) {
	    const ranges = this.selectedRanges;
	    this.selectedRanges = [];
	    const info = await this.getDocumentInfo();
	    const root = this.element;
	    const rangeSelectors = await Promise.all(ranges.map(range => this._integration.describe(root, range)));
	    const target = rangeSelectors.map(selectors => ({
	      source: info.uri,
	      // In the Hypothesis API the field containing the selectors is called
	      // `selector`, despite being a list.
	      selector: selectors
	    }));
	    const annotation = {
	      uri: info.uri,
	      document: info.metadata,
	      target,
	      $highlight: highlight,
	      $cluster: highlight ? 'user-highlights' : 'user-annotations',
	      $tag: 'a:' + generateHexString(8)
	    };
	    this._sidebarRPC.call('createAnnotation', annotation);
	    this.anchor(annotation);

	    // Removing the text selection triggers the `SelectionObserver` callback,
	    // which causes the adder to be removed after some delay.
	    removeTextSelection();
	    return annotation;
	  }

	  /**
	   * Indicate in the sidebar that certain annotations are focused (ie. the
	   * associated document region(s) is hovered).
	   */
	  _hoverAnnotations(tags) {
	    this._hoveredAnnotations.clear();
	    tags.forEach(tag => this._hoveredAnnotations.add(tag));
	    for (const anchor of this.anchors) {
	      if (anchor.highlights) {
	        const toggle = tags.includes(anchor.annotation.$tag);
	        setHighlightsFocused(anchor.highlights, toggle);
	      }
	    }
	    this._sidebarRPC.call('hoverAnnotations', tags);
	  }

	  /**
	   * Scroll to the closest off screen anchor.
	   */
	  _scrollToClosestOffScreenAnchor(tags, direction) {
	    const anchors = this.anchors.filter(({
	      annotation
	    }) => tags.includes(annotation.$tag));
	    const closest = findClosestOffscreenAnchor(anchors, direction);
	    if (closest) {
	      this._integration.scrollToAnchor(closest);
	    }
	  }

	  /**
	   * Show or hide the adder toolbar when the selection changes.
	   */
	  _onSelection(range) {
	    if (!this._integration.canAnnotate(range)) {
	      this._onClearSelection();
	      return;
	    }
	    const selection = document.getSelection();
	    const isBackwards = isSelectionBackwards(selection);
	    const focusRect = selectionFocusRect(selection);
	    if (!focusRect) {
	      // The selected range does not contain any text
	      this._onClearSelection();
	      return;
	    }
	    this.selectedRanges = [range];
	    this._hostRPC.call('textSelected');
	    this._adder.annotationsForSelection = annotationsForSelection();
	    this._isAdderVisible = true;
	    this._adder.show(focusRect, isBackwards);
	  }
	  _onClearSelection() {
	    this._isAdderVisible = false;
	    this._adder.hide();
	    this.selectedRanges = [];
	    if (this._informHostOnNextSelectionClear) {
	      this._hostRPC.call('textUnselected');
	    }
	    this._informHostOnNextSelectionClear = true;
	  }

	  /**
	   * Show the given annotations in the sidebar.
	   *
	   * This sets up a filter in the sidebar to show only the selected annotations
	   * and opens the sidebar. Optionally it can also transfer keyboard focus to
	   * the annotation card for the first selected annotation.
	   *
	   * @param tags
	   * @param options
	   *   @param [options.toggle] - Toggle whether the annotations are
	   *     selected, as opposed to just selecting them
	   *   @param [options.focusInSidebar] - Whether to transfer keyboard
	   *     focus to the card for the first annotation in the selection. This
	   *     option has no effect if {@link toggle} is true.
	   */
	  selectAnnotations(tags, {
	    toggle = false,
	    focusInSidebar = false
	  } = {}) {
	    if (toggle) {
	      this._sidebarRPC.call('toggleAnnotationSelection', tags);
	    } else {
	      this._sidebarRPC.call('showAnnotations', tags, focusInSidebar);
	    }
	    this._sidebarRPC.call('openSidebar');
	  }

	  /**
	   * Set whether highlights are visible in the document or not.
	   *
	   * @param visible
	   * @param notifyHost - Whether to notify the host frame about this
	   *   change. This should be true unless the request to change highlight
	   *   visibility is coming from the host frame.
	   */
	  setHighlightsVisible(visible, notifyHost = true) {
	    setHighlightsVisible(this.element, visible);
	    this._highlightsVisible = visible;
	    if (notifyHost) {
	      this._hostRPC.call('highlightsVisibleChanged', visible);
	    }
	  }
	  get highlightsVisible() {
	    return this._highlightsVisible;
	  }

	  /**
	   * Attempt to fit the document content alongside the sidebar.
	   *
	   * @param sidebarLayout
	   */
	  fitSideBySide(sidebarLayout) {
	    this._sideBySideActive = this._integration.fitSideBySide(sidebarLayout);
	  }

	  /**
	   * Return true if side-by-side mode is currently active.
	   *
	   * Side-by-side mode is activated or de-activated when `fitSideBySide` is called
	   * depending on whether the sidebar is expanded and whether there is room for
	   * the content alongside the sidebar.
	   */
	  get sideBySideActive() {
	    return this._sideBySideActive;
	  }

	  /**
	   * Return the tags of annotations that are currently displayed in a hovered
	   * state.
	   */
	  get hoveredAnnotationTags() {
	    return this._hoveredAnnotations;
	  }

	  /**
	   * Handle a potential shortcut trigger.
	   */
	  _handleShortcut(event) {
	    if (matchShortcut(event, 'Ctrl+Shift+H')) {
	      this.setHighlightsVisible(!this._highlightsVisible);
	    }
	  }
	}

	/**
	 * Encode app configuration in a URL fragment.
	 *
	 * This is used by the annotator to pass configuration to the sidebar and
	 * notebook apps, which they can easily read on startup. The configuration is
	 * passed in the fragment to avoid invalidating cache entries for the URL
	 * or adding noise to server logs.
	 *
	 * @param {string} baseURL
	 * @param {object} config
	 * @return {string} URL with added fragment
	 */
	function addConfigFragment(baseURL, config) {
	  const url = new URL(baseURL);
	  const params = new URLSearchParams();
	  params.append('config', JSON.stringify(config));
	  url.hash = params.toString();
	  return url.toString();
	}

	/**
	 * Parse configuration from a URL generated by {@link addConfigFragment}.
	 *
	 * @param {string} url
	 * @return {Record<string, unknown>}
	 */
	function parseConfigFragment(url) {
	  const configStr = new URL(url).hash.slice(1);
	  const configJSON = new URLSearchParams(configStr).get('config');
	  return JSON.parse(configJSON || '{}');
	}

	/**
	 * Create the JSON-serializable subset of annotator configuration that should
	 * be passed to the sidebar or notebook applications.
	 *
	 * @param {string} appURL - URL from which the application will be served
	 * @param {Record<string, unknown>} config
	 * @return {Record<string, unknown>}
	 */
	function createAppConfig(appURL, config) {
	  var _appConfig$services;
	  /** @type {Record<string, unknown>} */
	  const appConfig = {};
	  for (let [key, value] of Object.entries(config)) {
	    // Remove several annotator-only properties.
	    //
	    // nb. We don't currently strip all the annotator-only properties here.
	    // That's OK because validation / filtering happens in the sidebar app itself.
	    // It just results in unnecessary content in the sidebar iframe's URL string.
	    if (key === 'notebookAppUrl' || key === 'sidebarAppUrl') {
	      continue;
	    }

	    // Strip nullish properties, as these are ignored by the application and
	    // they add noise to logs etc.
	    //
	    // eslint-disable-next-line eqeqeq
	    if (value == null) {
	      continue;
	    }
	    appConfig[key] = value;
	  }

	  // Pass the expected origin of the app. This is used to detect when it is
	  // served from a different location than expected, which may stop it working.
	  appConfig.origin = new URL(appURL).origin;

	  // Pass the version of the client, so we can check if it is the same as the
	  // one used in the sidebar/notebook.
	  appConfig.version = '1.0.0-dummy-version';

	  // Pass the URL of the page that embedded the client.
	  const hostURL = new URL(window.location.href);
	  hostURL.hash = '';
	  appConfig.hostURL = hostURL.toString();

	  // Some config settings are not JSON-stringifiable (e.g. JavaScript
	  // functions) and will be omitted when the config is JSON-stringified.
	  // Add a JSON-stringifiable option for each of these so that the sidebar can
	  // at least know whether the callback functions were provided or not.
	  if (Array.isArray(appConfig.services) && ((_appConfig$services = appConfig.services) === null || _appConfig$services === void 0 ? void 0 : _appConfig$services.length) > 0) {
	    const service = appConfig.services[0];
	    if (service.onLoginRequest) {
	      service.onLoginRequestProvided = true;
	    }
	    if (service.onLogoutRequest) {
	      service.onLogoutRequestProvided = true;
	    }
	    if (service.onSignupRequest) {
	      service.onSignupRequestProvided = true;
	    }
	    if (service.onProfileRequest) {
	      service.onProfileRequestProvided = true;
	    }
	    if (service.onHelpRequest) {
	      service.onHelpRequestProvided = true;
	    }
	  }
	  return appConfig;
	}

	var _jsxFileName$5 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/NotebookModal.js";
	function NotebookIframe({
	  config,
	  groupId
	}) {
	  const notebookAppSrc = addConfigFragment(config.notebookAppUrl, {
	    ...createAppConfig(config.notebookAppUrl, config),
	    // Explicity set the "focused" group
	    group: groupId
	  });
	  return o("iframe", {
	    title: 'Hypothesis annotation notebook',
	    className: "h-full w-full border-0"
	    // Enable media in annotations to be shown fullscreen.
	    // TODO: Use `allow="fullscreen" once `allow` attribute available for
	    // iframe elements in all supported browsers
	    // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-allow
	    // eslint-disable-next-line react/no-unknown-property
	    ,
	    allowFullScreen: true,
	    src: notebookAppSrc
	  }, void 0, false, {
	    fileName: _jsxFileName$5,
	    lineNumber: 37,
	    columnNumber: 5
	  }, this);
	}

	/** @typedef {import('../util/emitter').Emitter} Emitter */

	/**
	 * @typedef NotebookModalProps
	 * @prop {import('../util/emitter').EventBus} eventBus
	 * @prop {NotebookConfig} config
	 */

	/**
	 * Create a modal component that hosts (1) the notebook iframe and (2) a button to close the modal.
	 *
	 * @param {NotebookModalProps} props
	 */
	function NotebookModal({
	  eventBus,
	  config
	}) {
	  // Temporary solution: while there is no mechanism to sync new annotations in
	  // the notebook, we force re-rendering of the iframe on every 'openNotebook'
	  // event, so that the new annotations are displayed.
	  // https://github.com/hypothesis/client/issues/3182
	  const [iframeKey, setIframeKey] = p(0);
	  const [isHidden, setIsHidden] = p(true);
	  const [groupId, setGroupId] = p( /** @type {string|null} */null);
	  const originalDocumentOverflowStyle = _$1('');
	  const emitterRef = _$1( /** @type {Emitter|null} */null);

	  // Stores the original overflow CSS property of document.body and reset it
	  // when the component is destroyed
	  h(() => {
	    originalDocumentOverflowStyle.current = document.body.style.overflow;
	    return () => {
	      document.body.style.overflow = originalDocumentOverflowStyle.current;
	    };
	  }, []);

	  // The overflow CSS property is set to hidden to prevent scrolling of the host page,
	  // while the notebook modal is open. It is restored when the modal is closed.
	  h(() => {
	    if (isHidden) {
	      document.body.style.overflow = originalDocumentOverflowStyle.current;
	    } else {
	      document.body.style.overflow = 'hidden';
	    }
	  }, [isHidden]);
	  h(() => {
	    const emitter = eventBus.createEmitter();
	    emitter.subscribe('openNotebook', ( /** @type {string} */groupId) => {
	      setIsHidden(false);
	      setIframeKey(iframeKey => iframeKey + 1);
	      setGroupId(groupId);
	    });
	    emitterRef.current = emitter;
	    return () => {
	      emitter.destroy();
	    };
	  }, [eventBus]);
	  const onClose = () => {
	    var _emitterRef$current;
	    setIsHidden(true);
	    (_emitterRef$current = emitterRef.current) === null || _emitterRef$current === void 0 ? void 0 : _emitterRef$current.publish('closeNotebook');
	  };
	  if (groupId === null) {
	    return null;
	  }
	  return o("div", {
	    className: classnames('fixed z-max top-0 left-0 right-0 bottom-0 p-3 bg-black/50', {
	      hidden: isHidden
	    }),
	    "data-testid": "notebook-outer",
	    children: o("div", {
	      className: "relative w-full h-full",
	      "data-testid": "notebook-inner",
	      children: [o("div", {
	        className: "absolute right-0 text-xl m-3",
	        children: o(IconButton, {
	          icon: "cancel",
	          title: "Close the Notebook",
	          onClick: onClose,
	          variant: "dark"
	        }, void 0, false, {
	          fileName: _jsxFileName$5,
	          lineNumber: 128,
	          columnNumber: 11
	        }, this)
	      }, void 0, false, {
	        fileName: _jsxFileName$5,
	        lineNumber: 127,
	        columnNumber: 9
	      }, this), o(NotebookIframe, {
	        config: config,
	        groupId: groupId
	      }, iframeKey, false, {
	        fileName: _jsxFileName$5,
	        lineNumber: 135,
	        columnNumber: 9
	      }, this)]
	    }, void 0, true, {
	      fileName: _jsxFileName$5,
	      lineNumber: 126,
	      columnNumber: 7
	    }, this)
	  }, void 0, false, {
	    fileName: _jsxFileName$5,
	    lineNumber: 119,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$4 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/notebook.js";
	class Notebook {
	  /**
	   * @param {HTMLElement} element
	   * @param {import('./util/emitter').EventBus} eventBus -
	   *   Enables communication between components sharing the same eventBus
	   * @param {NotebookConfig} config
	   */
	  constructor(element, eventBus, config) {
	    /**
	     * Un-styled shadow host for the notebook content.
	     * This isolates the notebook from the page's styles.
	     */
	    this._outerContainer = document.createElement('hypothesis-notebook');
	    element.appendChild(this._outerContainer);
	    this.shadowRoot = createShadowRoot(this._outerContainer);
	    P$1(o(NotebookModal, {
	      eventBus: eventBus,
	      config: config
	    }, void 0, false, {
	      fileName: _jsxFileName$4,
	      lineNumber: 28,
	      columnNumber: 7
	    }, this), this.shadowRoot);
	  }
	  destroy() {
	    P$1(null, this.shadowRoot);
	    this._outerContainer.remove();
	  }
	}

	var hammer$1 = {exports: {}};

	/*! Hammer.JS - v2.0.7 - 2016-04-22
	 * http://hammerjs.github.io/
	 *
	 * Copyright (c) 2016 Jorik Tangelder;
	 * Licensed under the MIT license */

	(function (module) {
		(function(window, document, exportName, undefined$1) {
		  'use strict';

		var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
		var TEST_ELEMENT = document.createElement('div');

		var TYPE_FUNCTION = 'function';

		var round = Math.round;
		var abs = Math.abs;
		var now = Date.now;

		/**
		 * set a timeout with a given scope
		 * @param {Function} fn
		 * @param {Number} timeout
		 * @param {Object} context
		 * @returns {number}
		 */
		function setTimeoutContext(fn, timeout, context) {
		    return setTimeout(bindFn(fn, context), timeout);
		}

		/**
		 * if the argument is an array, we want to execute the fn on each entry
		 * if it aint an array we don't want to do a thing.
		 * this is used by all the methods that accept a single and array argument.
		 * @param {*|Array} arg
		 * @param {String} fn
		 * @param {Object} [context]
		 * @returns {Boolean}
		 */
		function invokeArrayArg(arg, fn, context) {
		    if (Array.isArray(arg)) {
		        each(arg, context[fn], context);
		        return true;
		    }
		    return false;
		}

		/**
		 * walk objects and arrays
		 * @param {Object} obj
		 * @param {Function} iterator
		 * @param {Object} context
		 */
		function each(obj, iterator, context) {
		    var i;

		    if (!obj) {
		        return;
		    }

		    if (obj.forEach) {
		        obj.forEach(iterator, context);
		    } else if (obj.length !== undefined$1) {
		        i = 0;
		        while (i < obj.length) {
		            iterator.call(context, obj[i], i, obj);
		            i++;
		        }
		    } else {
		        for (i in obj) {
		            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
		        }
		    }
		}

		/**
		 * wrap a method with a deprecation warning and stack trace
		 * @param {Function} method
		 * @param {String} name
		 * @param {String} message
		 * @returns {Function} A new function wrapping the supplied method.
		 */
		function deprecate(method, name, message) {
		    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
		    return function() {
		        var e = new Error('get-stack-trace');
		        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
		            .replace(/^\s+at\s+/gm, '')
		            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

		        var log = window.console && (window.console.warn || window.console.log);
		        if (log) {
		            log.call(window.console, deprecationMessage, stack);
		        }
		        return method.apply(this, arguments);
		    };
		}

		/**
		 * extend object.
		 * means that properties in dest will be overwritten by the ones in src.
		 * @param {Object} target
		 * @param {...Object} objects_to_assign
		 * @returns {Object} target
		 */
		var assign;
		if (typeof Object.assign !== 'function') {
		    assign = function assign(target) {
		        if (target === undefined$1 || target === null) {
		            throw new TypeError('Cannot convert undefined or null to object');
		        }

		        var output = Object(target);
		        for (var index = 1; index < arguments.length; index++) {
		            var source = arguments[index];
		            if (source !== undefined$1 && source !== null) {
		                for (var nextKey in source) {
		                    if (source.hasOwnProperty(nextKey)) {
		                        output[nextKey] = source[nextKey];
		                    }
		                }
		            }
		        }
		        return output;
		    };
		} else {
		    assign = Object.assign;
		}

		/**
		 * extend object.
		 * means that properties in dest will be overwritten by the ones in src.
		 * @param {Object} dest
		 * @param {Object} src
		 * @param {Boolean} [merge=false]
		 * @returns {Object} dest
		 */
		var extend = deprecate(function extend(dest, src, merge) {
		    var keys = Object.keys(src);
		    var i = 0;
		    while (i < keys.length) {
		        if (!merge || (merge && dest[keys[i]] === undefined$1)) {
		            dest[keys[i]] = src[keys[i]];
		        }
		        i++;
		    }
		    return dest;
		}, 'extend', 'Use `assign`.');

		/**
		 * merge the values from src in the dest.
		 * means that properties that exist in dest will not be overwritten by src
		 * @param {Object} dest
		 * @param {Object} src
		 * @returns {Object} dest
		 */
		var merge = deprecate(function merge(dest, src) {
		    return extend(dest, src, true);
		}, 'merge', 'Use `assign`.');

		/**
		 * simple class inheritance
		 * @param {Function} child
		 * @param {Function} base
		 * @param {Object} [properties]
		 */
		function inherit(child, base, properties) {
		    var baseP = base.prototype,
		        childP;

		    childP = child.prototype = Object.create(baseP);
		    childP.constructor = child;
		    childP._super = baseP;

		    if (properties) {
		        assign(childP, properties);
		    }
		}

		/**
		 * simple function bind
		 * @param {Function} fn
		 * @param {Object} context
		 * @returns {Function}
		 */
		function bindFn(fn, context) {
		    return function boundFn() {
		        return fn.apply(context, arguments);
		    };
		}

		/**
		 * let a boolean value also be a function that must return a boolean
		 * this first item in args will be used as the context
		 * @param {Boolean|Function} val
		 * @param {Array} [args]
		 * @returns {Boolean}
		 */
		function boolOrFn(val, args) {
		    if (typeof val == TYPE_FUNCTION) {
		        return val.apply(args ? args[0] || undefined$1 : undefined$1, args);
		    }
		    return val;
		}

		/**
		 * use the val2 when val1 is undefined
		 * @param {*} val1
		 * @param {*} val2
		 * @returns {*}
		 */
		function ifUndefined(val1, val2) {
		    return (val1 === undefined$1) ? val2 : val1;
		}

		/**
		 * addEventListener with multiple events at once
		 * @param {EventTarget} target
		 * @param {String} types
		 * @param {Function} handler
		 */
		function addEventListeners(target, types, handler) {
		    each(splitStr(types), function(type) {
		        target.addEventListener(type, handler, false);
		    });
		}

		/**
		 * removeEventListener with multiple events at once
		 * @param {EventTarget} target
		 * @param {String} types
		 * @param {Function} handler
		 */
		function removeEventListeners(target, types, handler) {
		    each(splitStr(types), function(type) {
		        target.removeEventListener(type, handler, false);
		    });
		}

		/**
		 * find if a node is in the given parent
		 * @method hasParent
		 * @param {HTMLElement} node
		 * @param {HTMLElement} parent
		 * @return {Boolean} found
		 */
		function hasParent(node, parent) {
		    while (node) {
		        if (node == parent) {
		            return true;
		        }
		        node = node.parentNode;
		    }
		    return false;
		}

		/**
		 * small indexOf wrapper
		 * @param {String} str
		 * @param {String} find
		 * @returns {Boolean} found
		 */
		function inStr(str, find) {
		    return str.indexOf(find) > -1;
		}

		/**
		 * split string on whitespace
		 * @param {String} str
		 * @returns {Array} words
		 */
		function splitStr(str) {
		    return str.trim().split(/\s+/g);
		}

		/**
		 * find if a array contains the object using indexOf or a simple polyFill
		 * @param {Array} src
		 * @param {String} find
		 * @param {String} [findByKey]
		 * @return {Boolean|Number} false when not found, or the index
		 */
		function inArray(src, find, findByKey) {
		    if (src.indexOf && !findByKey) {
		        return src.indexOf(find);
		    } else {
		        var i = 0;
		        while (i < src.length) {
		            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
		                return i;
		            }
		            i++;
		        }
		        return -1;
		    }
		}

		/**
		 * convert array-like objects to real arrays
		 * @param {Object} obj
		 * @returns {Array}
		 */
		function toArray(obj) {
		    return Array.prototype.slice.call(obj, 0);
		}

		/**
		 * unique array with objects based on a key (like 'id') or just by the array's value
		 * @param {Array} src [{id:1},{id:2},{id:1}]
		 * @param {String} [key]
		 * @param {Boolean} [sort=False]
		 * @returns {Array} [{id:1},{id:2}]
		 */
		function uniqueArray(src, key, sort) {
		    var results = [];
		    var values = [];
		    var i = 0;

		    while (i < src.length) {
		        var val = key ? src[i][key] : src[i];
		        if (inArray(values, val) < 0) {
		            results.push(src[i]);
		        }
		        values[i] = val;
		        i++;
		    }

		    if (sort) {
		        if (!key) {
		            results = results.sort();
		        } else {
		            results = results.sort(function sortUniqueArray(a, b) {
		                return a[key] > b[key];
		            });
		        }
		    }

		    return results;
		}

		/**
		 * get the prefixed property
		 * @param {Object} obj
		 * @param {String} property
		 * @returns {String|Undefined} prefixed
		 */
		function prefixed(obj, property) {
		    var prefix, prop;
		    var camelProp = property[0].toUpperCase() + property.slice(1);

		    var i = 0;
		    while (i < VENDOR_PREFIXES.length) {
		        prefix = VENDOR_PREFIXES[i];
		        prop = (prefix) ? prefix + camelProp : property;

		        if (prop in obj) {
		            return prop;
		        }
		        i++;
		    }
		    return undefined$1;
		}

		/**
		 * get a unique id
		 * @returns {number} uniqueId
		 */
		var _uniqueId = 1;
		function uniqueId() {
		    return _uniqueId++;
		}

		/**
		 * get the window object of an element
		 * @param {HTMLElement} element
		 * @returns {DocumentView|Window}
		 */
		function getWindowForElement(element) {
		    var doc = element.ownerDocument || element;
		    return (doc.defaultView || doc.parentWindow || window);
		}

		var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

		var SUPPORT_TOUCH = ('ontouchstart' in window);
		var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined$1;
		var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

		var INPUT_TYPE_TOUCH = 'touch';
		var INPUT_TYPE_PEN = 'pen';
		var INPUT_TYPE_MOUSE = 'mouse';
		var INPUT_TYPE_KINECT = 'kinect';

		var COMPUTE_INTERVAL = 25;

		var INPUT_START = 1;
		var INPUT_MOVE = 2;
		var INPUT_END = 4;
		var INPUT_CANCEL = 8;

		var DIRECTION_NONE = 1;
		var DIRECTION_LEFT = 2;
		var DIRECTION_RIGHT = 4;
		var DIRECTION_UP = 8;
		var DIRECTION_DOWN = 16;

		var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
		var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
		var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

		var PROPS_XY = ['x', 'y'];
		var PROPS_CLIENT_XY = ['clientX', 'clientY'];

		/**
		 * create new input type manager
		 * @param {Manager} manager
		 * @param {Function} callback
		 * @returns {Input}
		 * @constructor
		 */
		function Input(manager, callback) {
		    var self = this;
		    this.manager = manager;
		    this.callback = callback;
		    this.element = manager.element;
		    this.target = manager.options.inputTarget;

		    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
		    // so when disabled the input events are completely bypassed.
		    this.domHandler = function(ev) {
		        if (boolOrFn(manager.options.enable, [manager])) {
		            self.handler(ev);
		        }
		    };

		    this.init();

		}

		Input.prototype = {
		    /**
		     * should handle the inputEvent data and trigger the callback
		     * @virtual
		     */
		    handler: function() { },

		    /**
		     * bind the events
		     */
		    init: function() {
		        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
		        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
		        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
		    },

		    /**
		     * unbind the events
		     */
		    destroy: function() {
		        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
		        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
		        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
		    }
		};

		/**
		 * create new input type manager
		 * called by the Manager constructor
		 * @param {Hammer} manager
		 * @returns {Input}
		 */
		function createInputInstance(manager) {
		    var Type;
		    var inputClass = manager.options.inputClass;

		    if (inputClass) {
		        Type = inputClass;
		    } else if (SUPPORT_POINTER_EVENTS) {
		        Type = PointerEventInput;
		    } else if (SUPPORT_ONLY_TOUCH) {
		        Type = TouchInput;
		    } else if (!SUPPORT_TOUCH) {
		        Type = MouseInput;
		    } else {
		        Type = TouchMouseInput;
		    }
		    return new (Type)(manager, inputHandler);
		}

		/**
		 * handle input events
		 * @param {Manager} manager
		 * @param {String} eventType
		 * @param {Object} input
		 */
		function inputHandler(manager, eventType, input) {
		    var pointersLen = input.pointers.length;
		    var changedPointersLen = input.changedPointers.length;
		    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
		    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

		    input.isFirst = !!isFirst;
		    input.isFinal = !!isFinal;

		    if (isFirst) {
		        manager.session = {};
		    }

		    // source event is the normalized value of the domEvents
		    // like 'touchstart, mouseup, pointerdown'
		    input.eventType = eventType;

		    // compute scale, rotation etc
		    computeInputData(manager, input);

		    // emit secret event
		    manager.emit('hammer.input', input);

		    manager.recognize(input);
		    manager.session.prevInput = input;
		}

		/**
		 * extend the data with some usable properties like scale, rotate, velocity etc
		 * @param {Object} manager
		 * @param {Object} input
		 */
		function computeInputData(manager, input) {
		    var session = manager.session;
		    var pointers = input.pointers;
		    var pointersLength = pointers.length;

		    // store the first input to calculate the distance and direction
		    if (!session.firstInput) {
		        session.firstInput = simpleCloneInputData(input);
		    }

		    // to compute scale and rotation we need to store the multiple touches
		    if (pointersLength > 1 && !session.firstMultiple) {
		        session.firstMultiple = simpleCloneInputData(input);
		    } else if (pointersLength === 1) {
		        session.firstMultiple = false;
		    }

		    var firstInput = session.firstInput;
		    var firstMultiple = session.firstMultiple;
		    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

		    var center = input.center = getCenter(pointers);
		    input.timeStamp = now();
		    input.deltaTime = input.timeStamp - firstInput.timeStamp;

		    input.angle = getAngle(offsetCenter, center);
		    input.distance = getDistance(offsetCenter, center);

		    computeDeltaXY(session, input);
		    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

		    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
		    input.overallVelocityX = overallVelocity.x;
		    input.overallVelocityY = overallVelocity.y;
		    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

		    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
		    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

		    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
		        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

		    computeIntervalInputData(session, input);

		    // find the correct target
		    var target = manager.element;
		    if (hasParent(input.srcEvent.target, target)) {
		        target = input.srcEvent.target;
		    }
		    input.target = target;
		}

		function computeDeltaXY(session, input) {
		    var center = input.center;
		    var offset = session.offsetDelta || {};
		    var prevDelta = session.prevDelta || {};
		    var prevInput = session.prevInput || {};

		    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
		        prevDelta = session.prevDelta = {
		            x: prevInput.deltaX || 0,
		            y: prevInput.deltaY || 0
		        };

		        offset = session.offsetDelta = {
		            x: center.x,
		            y: center.y
		        };
		    }

		    input.deltaX = prevDelta.x + (center.x - offset.x);
		    input.deltaY = prevDelta.y + (center.y - offset.y);
		}

		/**
		 * velocity is calculated every x ms
		 * @param {Object} session
		 * @param {Object} input
		 */
		function computeIntervalInputData(session, input) {
		    var last = session.lastInterval || input,
		        deltaTime = input.timeStamp - last.timeStamp,
		        velocity, velocityX, velocityY, direction;

		    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined$1)) {
		        var deltaX = input.deltaX - last.deltaX;
		        var deltaY = input.deltaY - last.deltaY;

		        var v = getVelocity(deltaTime, deltaX, deltaY);
		        velocityX = v.x;
		        velocityY = v.y;
		        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
		        direction = getDirection(deltaX, deltaY);

		        session.lastInterval = input;
		    } else {
		        // use latest velocity info if it doesn't overtake a minimum period
		        velocity = last.velocity;
		        velocityX = last.velocityX;
		        velocityY = last.velocityY;
		        direction = last.direction;
		    }

		    input.velocity = velocity;
		    input.velocityX = velocityX;
		    input.velocityY = velocityY;
		    input.direction = direction;
		}

		/**
		 * create a simple clone from the input used for storage of firstInput and firstMultiple
		 * @param {Object} input
		 * @returns {Object} clonedInputData
		 */
		function simpleCloneInputData(input) {
		    // make a simple copy of the pointers because we will get a reference if we don't
		    // we only need clientXY for the calculations
		    var pointers = [];
		    var i = 0;
		    while (i < input.pointers.length) {
		        pointers[i] = {
		            clientX: round(input.pointers[i].clientX),
		            clientY: round(input.pointers[i].clientY)
		        };
		        i++;
		    }

		    return {
		        timeStamp: now(),
		        pointers: pointers,
		        center: getCenter(pointers),
		        deltaX: input.deltaX,
		        deltaY: input.deltaY
		    };
		}

		/**
		 * get the center of all the pointers
		 * @param {Array} pointers
		 * @return {Object} center contains `x` and `y` properties
		 */
		function getCenter(pointers) {
		    var pointersLength = pointers.length;

		    // no need to loop when only one touch
		    if (pointersLength === 1) {
		        return {
		            x: round(pointers[0].clientX),
		            y: round(pointers[0].clientY)
		        };
		    }

		    var x = 0, y = 0, i = 0;
		    while (i < pointersLength) {
		        x += pointers[i].clientX;
		        y += pointers[i].clientY;
		        i++;
		    }

		    return {
		        x: round(x / pointersLength),
		        y: round(y / pointersLength)
		    };
		}

		/**
		 * calculate the velocity between two points. unit is in px per ms.
		 * @param {Number} deltaTime
		 * @param {Number} x
		 * @param {Number} y
		 * @return {Object} velocity `x` and `y`
		 */
		function getVelocity(deltaTime, x, y) {
		    return {
		        x: x / deltaTime || 0,
		        y: y / deltaTime || 0
		    };
		}

		/**
		 * get the direction between two points
		 * @param {Number} x
		 * @param {Number} y
		 * @return {Number} direction
		 */
		function getDirection(x, y) {
		    if (x === y) {
		        return DIRECTION_NONE;
		    }

		    if (abs(x) >= abs(y)) {
		        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
		    }
		    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
		}

		/**
		 * calculate the absolute distance between two points
		 * @param {Object} p1 {x, y}
		 * @param {Object} p2 {x, y}
		 * @param {Array} [props] containing x and y keys
		 * @return {Number} distance
		 */
		function getDistance(p1, p2, props) {
		    if (!props) {
		        props = PROPS_XY;
		    }
		    var x = p2[props[0]] - p1[props[0]],
		        y = p2[props[1]] - p1[props[1]];

		    return Math.sqrt((x * x) + (y * y));
		}

		/**
		 * calculate the angle between two coordinates
		 * @param {Object} p1
		 * @param {Object} p2
		 * @param {Array} [props] containing x and y keys
		 * @return {Number} angle
		 */
		function getAngle(p1, p2, props) {
		    if (!props) {
		        props = PROPS_XY;
		    }
		    var x = p2[props[0]] - p1[props[0]],
		        y = p2[props[1]] - p1[props[1]];
		    return Math.atan2(y, x) * 180 / Math.PI;
		}

		/**
		 * calculate the rotation degrees between two pointersets
		 * @param {Array} start array of pointers
		 * @param {Array} end array of pointers
		 * @return {Number} rotation
		 */
		function getRotation(start, end) {
		    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
		}

		/**
		 * calculate the scale factor between two pointersets
		 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
		 * @param {Array} start array of pointers
		 * @param {Array} end array of pointers
		 * @return {Number} scale
		 */
		function getScale(start, end) {
		    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
		}

		var MOUSE_INPUT_MAP = {
		    mousedown: INPUT_START,
		    mousemove: INPUT_MOVE,
		    mouseup: INPUT_END
		};

		var MOUSE_ELEMENT_EVENTS = 'mousedown';
		var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

		/**
		 * Mouse events input
		 * @constructor
		 * @extends Input
		 */
		function MouseInput() {
		    this.evEl = MOUSE_ELEMENT_EVENTS;
		    this.evWin = MOUSE_WINDOW_EVENTS;

		    this.pressed = false; // mousedown state

		    Input.apply(this, arguments);
		}

		inherit(MouseInput, Input, {
		    /**
		     * handle mouse events
		     * @param {Object} ev
		     */
		    handler: function MEhandler(ev) {
		        var eventType = MOUSE_INPUT_MAP[ev.type];

		        // on start we want to have the left mouse button down
		        if (eventType & INPUT_START && ev.button === 0) {
		            this.pressed = true;
		        }

		        if (eventType & INPUT_MOVE && ev.which !== 1) {
		            eventType = INPUT_END;
		        }

		        // mouse must be down
		        if (!this.pressed) {
		            return;
		        }

		        if (eventType & INPUT_END) {
		            this.pressed = false;
		        }

		        this.callback(this.manager, eventType, {
		            pointers: [ev],
		            changedPointers: [ev],
		            pointerType: INPUT_TYPE_MOUSE,
		            srcEvent: ev
		        });
		    }
		});

		var POINTER_INPUT_MAP = {
		    pointerdown: INPUT_START,
		    pointermove: INPUT_MOVE,
		    pointerup: INPUT_END,
		    pointercancel: INPUT_CANCEL,
		    pointerout: INPUT_CANCEL
		};

		// in IE10 the pointer types is defined as an enum
		var IE10_POINTER_TYPE_ENUM = {
		    2: INPUT_TYPE_TOUCH,
		    3: INPUT_TYPE_PEN,
		    4: INPUT_TYPE_MOUSE,
		    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
		};

		var POINTER_ELEMENT_EVENTS = 'pointerdown';
		var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

		// IE10 has prefixed support, and case-sensitive
		if (window.MSPointerEvent && !window.PointerEvent) {
		    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
		    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
		}

		/**
		 * Pointer events input
		 * @constructor
		 * @extends Input
		 */
		function PointerEventInput() {
		    this.evEl = POINTER_ELEMENT_EVENTS;
		    this.evWin = POINTER_WINDOW_EVENTS;

		    Input.apply(this, arguments);

		    this.store = (this.manager.session.pointerEvents = []);
		}

		inherit(PointerEventInput, Input, {
		    /**
		     * handle mouse events
		     * @param {Object} ev
		     */
		    handler: function PEhandler(ev) {
		        var store = this.store;
		        var removePointer = false;

		        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
		        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
		        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

		        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

		        // get index of the event in the store
		        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

		        // start and mouse must be down
		        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
		            if (storeIndex < 0) {
		                store.push(ev);
		                storeIndex = store.length - 1;
		            }
		        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
		            removePointer = true;
		        }

		        // it not found, so the pointer hasn't been down (so it's probably a hover)
		        if (storeIndex < 0) {
		            return;
		        }

		        // update the event in the store
		        store[storeIndex] = ev;

		        this.callback(this.manager, eventType, {
		            pointers: store,
		            changedPointers: [ev],
		            pointerType: pointerType,
		            srcEvent: ev
		        });

		        if (removePointer) {
		            // remove from the store
		            store.splice(storeIndex, 1);
		        }
		    }
		});

		var SINGLE_TOUCH_INPUT_MAP = {
		    touchstart: INPUT_START,
		    touchmove: INPUT_MOVE,
		    touchend: INPUT_END,
		    touchcancel: INPUT_CANCEL
		};

		var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
		var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

		/**
		 * Touch events input
		 * @constructor
		 * @extends Input
		 */
		function SingleTouchInput() {
		    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
		    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
		    this.started = false;

		    Input.apply(this, arguments);
		}

		inherit(SingleTouchInput, Input, {
		    handler: function TEhandler(ev) {
		        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

		        // should we handle the touch events?
		        if (type === INPUT_START) {
		            this.started = true;
		        }

		        if (!this.started) {
		            return;
		        }

		        var touches = normalizeSingleTouches.call(this, ev, type);

		        // when done, reset the started state
		        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
		            this.started = false;
		        }

		        this.callback(this.manager, type, {
		            pointers: touches[0],
		            changedPointers: touches[1],
		            pointerType: INPUT_TYPE_TOUCH,
		            srcEvent: ev
		        });
		    }
		});

		/**
		 * @this {TouchInput}
		 * @param {Object} ev
		 * @param {Number} type flag
		 * @returns {undefined|Array} [all, changed]
		 */
		function normalizeSingleTouches(ev, type) {
		    var all = toArray(ev.touches);
		    var changed = toArray(ev.changedTouches);

		    if (type & (INPUT_END | INPUT_CANCEL)) {
		        all = uniqueArray(all.concat(changed), 'identifier', true);
		    }

		    return [all, changed];
		}

		var TOUCH_INPUT_MAP = {
		    touchstart: INPUT_START,
		    touchmove: INPUT_MOVE,
		    touchend: INPUT_END,
		    touchcancel: INPUT_CANCEL
		};

		var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

		/**
		 * Multi-user touch events input
		 * @constructor
		 * @extends Input
		 */
		function TouchInput() {
		    this.evTarget = TOUCH_TARGET_EVENTS;
		    this.targetIds = {};

		    Input.apply(this, arguments);
		}

		inherit(TouchInput, Input, {
		    handler: function MTEhandler(ev) {
		        var type = TOUCH_INPUT_MAP[ev.type];
		        var touches = getTouches.call(this, ev, type);
		        if (!touches) {
		            return;
		        }

		        this.callback(this.manager, type, {
		            pointers: touches[0],
		            changedPointers: touches[1],
		            pointerType: INPUT_TYPE_TOUCH,
		            srcEvent: ev
		        });
		    }
		});

		/**
		 * @this {TouchInput}
		 * @param {Object} ev
		 * @param {Number} type flag
		 * @returns {undefined|Array} [all, changed]
		 */
		function getTouches(ev, type) {
		    var allTouches = toArray(ev.touches);
		    var targetIds = this.targetIds;

		    // when there is only one touch, the process can be simplified
		    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
		        targetIds[allTouches[0].identifier] = true;
		        return [allTouches, allTouches];
		    }

		    var i,
		        targetTouches,
		        changedTouches = toArray(ev.changedTouches),
		        changedTargetTouches = [],
		        target = this.target;

		    // get target touches from touches
		    targetTouches = allTouches.filter(function(touch) {
		        return hasParent(touch.target, target);
		    });

		    // collect touches
		    if (type === INPUT_START) {
		        i = 0;
		        while (i < targetTouches.length) {
		            targetIds[targetTouches[i].identifier] = true;
		            i++;
		        }
		    }

		    // filter changed touches to only contain touches that exist in the collected target ids
		    i = 0;
		    while (i < changedTouches.length) {
		        if (targetIds[changedTouches[i].identifier]) {
		            changedTargetTouches.push(changedTouches[i]);
		        }

		        // cleanup removed touches
		        if (type & (INPUT_END | INPUT_CANCEL)) {
		            delete targetIds[changedTouches[i].identifier];
		        }
		        i++;
		    }

		    if (!changedTargetTouches.length) {
		        return;
		    }

		    return [
		        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
		        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
		        changedTargetTouches
		    ];
		}

		/**
		 * Combined touch and mouse input
		 *
		 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
		 * This because touch devices also emit mouse events while doing a touch.
		 *
		 * @constructor
		 * @extends Input
		 */

		var DEDUP_TIMEOUT = 2500;
		var DEDUP_DISTANCE = 25;

		function TouchMouseInput() {
		    Input.apply(this, arguments);

		    var handler = bindFn(this.handler, this);
		    this.touch = new TouchInput(this.manager, handler);
		    this.mouse = new MouseInput(this.manager, handler);

		    this.primaryTouch = null;
		    this.lastTouches = [];
		}

		inherit(TouchMouseInput, Input, {
		    /**
		     * handle mouse and touch events
		     * @param {Hammer} manager
		     * @param {String} inputEvent
		     * @param {Object} inputData
		     */
		    handler: function TMEhandler(manager, inputEvent, inputData) {
		        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
		            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

		        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
		            return;
		        }

		        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
		        if (isTouch) {
		            recordTouches.call(this, inputEvent, inputData);
		        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
		            return;
		        }

		        this.callback(manager, inputEvent, inputData);
		    },

		    /**
		     * remove the event listeners
		     */
		    destroy: function destroy() {
		        this.touch.destroy();
		        this.mouse.destroy();
		    }
		});

		function recordTouches(eventType, eventData) {
		    if (eventType & INPUT_START) {
		        this.primaryTouch = eventData.changedPointers[0].identifier;
		        setLastTouch.call(this, eventData);
		    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
		        setLastTouch.call(this, eventData);
		    }
		}

		function setLastTouch(eventData) {
		    var touch = eventData.changedPointers[0];

		    if (touch.identifier === this.primaryTouch) {
		        var lastTouch = {x: touch.clientX, y: touch.clientY};
		        this.lastTouches.push(lastTouch);
		        var lts = this.lastTouches;
		        var removeLastTouch = function() {
		            var i = lts.indexOf(lastTouch);
		            if (i > -1) {
		                lts.splice(i, 1);
		            }
		        };
		        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
		    }
		}

		function isSyntheticEvent(eventData) {
		    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
		    for (var i = 0; i < this.lastTouches.length; i++) {
		        var t = this.lastTouches[i];
		        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
		        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
		            return true;
		        }
		    }
		    return false;
		}

		var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
		var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined$1;

		// magical touchAction value
		var TOUCH_ACTION_COMPUTE = 'compute';
		var TOUCH_ACTION_AUTO = 'auto';
		var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
		var TOUCH_ACTION_NONE = 'none';
		var TOUCH_ACTION_PAN_X = 'pan-x';
		var TOUCH_ACTION_PAN_Y = 'pan-y';
		var TOUCH_ACTION_MAP = getTouchActionProps();

		/**
		 * Touch Action
		 * sets the touchAction property or uses the js alternative
		 * @param {Manager} manager
		 * @param {String} value
		 * @constructor
		 */
		function TouchAction(manager, value) {
		    this.manager = manager;
		    this.set(value);
		}

		TouchAction.prototype = {
		    /**
		     * set the touchAction value on the element or enable the polyfill
		     * @param {String} value
		     */
		    set: function(value) {
		        // find out the touch-action by the event handlers
		        if (value == TOUCH_ACTION_COMPUTE) {
		            value = this.compute();
		        }

		        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
		            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
		        }
		        this.actions = value.toLowerCase().trim();
		    },

		    /**
		     * just re-set the touchAction value
		     */
		    update: function() {
		        this.set(this.manager.options.touchAction);
		    },

		    /**
		     * compute the value for the touchAction property based on the recognizer's settings
		     * @returns {String} value
		     */
		    compute: function() {
		        var actions = [];
		        each(this.manager.recognizers, function(recognizer) {
		            if (boolOrFn(recognizer.options.enable, [recognizer])) {
		                actions = actions.concat(recognizer.getTouchAction());
		            }
		        });
		        return cleanTouchActions(actions.join(' '));
		    },

		    /**
		     * this method is called on each input cycle and provides the preventing of the browser behavior
		     * @param {Object} input
		     */
		    preventDefaults: function(input) {
		        var srcEvent = input.srcEvent;
		        var direction = input.offsetDirection;

		        // if the touch action did prevented once this session
		        if (this.manager.session.prevented) {
		            srcEvent.preventDefault();
		            return;
		        }

		        var actions = this.actions;
		        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
		        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
		        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

		        if (hasNone) {
		            //do not prevent defaults if this is a tap gesture

		            var isTapPointer = input.pointers.length === 1;
		            var isTapMovement = input.distance < 2;
		            var isTapTouchTime = input.deltaTime < 250;

		            if (isTapPointer && isTapMovement && isTapTouchTime) {
		                return;
		            }
		        }

		        if (hasPanX && hasPanY) {
		            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
		            return;
		        }

		        if (hasNone ||
		            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
		            (hasPanX && direction & DIRECTION_VERTICAL)) {
		            return this.preventSrc(srcEvent);
		        }
		    },

		    /**
		     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
		     * @param {Object} srcEvent
		     */
		    preventSrc: function(srcEvent) {
		        this.manager.session.prevented = true;
		        srcEvent.preventDefault();
		    }
		};

		/**
		 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
		 * @param {String} actions
		 * @returns {*}
		 */
		function cleanTouchActions(actions) {
		    // none
		    if (inStr(actions, TOUCH_ACTION_NONE)) {
		        return TOUCH_ACTION_NONE;
		    }

		    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
		    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

		    // if both pan-x and pan-y are set (different recognizers
		    // for different directions, e.g. horizontal pan but vertical swipe?)
		    // we need none (as otherwise with pan-x pan-y combined none of these
		    // recognizers will work, since the browser would handle all panning
		    if (hasPanX && hasPanY) {
		        return TOUCH_ACTION_NONE;
		    }

		    // pan-x OR pan-y
		    if (hasPanX || hasPanY) {
		        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
		    }

		    // manipulation
		    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
		        return TOUCH_ACTION_MANIPULATION;
		    }

		    return TOUCH_ACTION_AUTO;
		}

		function getTouchActionProps() {
		    if (!NATIVE_TOUCH_ACTION) {
		        return false;
		    }
		    var touchMap = {};
		    var cssSupports = window.CSS && window.CSS.supports;
		    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

		        // If css.supports is not supported but there is native touch-action assume it supports
		        // all values. This is the case for IE 10 and 11.
		        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
		    });
		    return touchMap;
		}

		/**
		 * Recognizer flow explained; *
		 * All recognizers have the initial state of POSSIBLE when a input session starts.
		 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
		 * Example session for mouse-input: mousedown -> mousemove -> mouseup
		 *
		 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
		 * which determines with state it should be.
		 *
		 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
		 * POSSIBLE to give it another change on the next cycle.
		 *
		 *               Possible
		 *                  |
		 *            +-----+---------------+
		 *            |                     |
		 *      +-----+-----+               |
		 *      |           |               |
		 *   Failed      Cancelled          |
		 *                          +-------+------+
		 *                          |              |
		 *                      Recognized       Began
		 *                                         |
		 *                                      Changed
		 *                                         |
		 *                                  Ended/Recognized
		 */
		var STATE_POSSIBLE = 1;
		var STATE_BEGAN = 2;
		var STATE_CHANGED = 4;
		var STATE_ENDED = 8;
		var STATE_RECOGNIZED = STATE_ENDED;
		var STATE_CANCELLED = 16;
		var STATE_FAILED = 32;

		/**
		 * Recognizer
		 * Every recognizer needs to extend from this class.
		 * @constructor
		 * @param {Object} options
		 */
		function Recognizer(options) {
		    this.options = assign({}, this.defaults, options || {});

		    this.id = uniqueId();

		    this.manager = null;

		    // default is enable true
		    this.options.enable = ifUndefined(this.options.enable, true);

		    this.state = STATE_POSSIBLE;

		    this.simultaneous = {};
		    this.requireFail = [];
		}

		Recognizer.prototype = {
		    /**
		     * @virtual
		     * @type {Object}
		     */
		    defaults: {},

		    /**
		     * set options
		     * @param {Object} options
		     * @return {Recognizer}
		     */
		    set: function(options) {
		        assign(this.options, options);

		        // also update the touchAction, in case something changed about the directions/enabled state
		        this.manager && this.manager.touchAction.update();
		        return this;
		    },

		    /**
		     * recognize simultaneous with an other recognizer.
		     * @param {Recognizer} otherRecognizer
		     * @returns {Recognizer} this
		     */
		    recognizeWith: function(otherRecognizer) {
		        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
		            return this;
		        }

		        var simultaneous = this.simultaneous;
		        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
		        if (!simultaneous[otherRecognizer.id]) {
		            simultaneous[otherRecognizer.id] = otherRecognizer;
		            otherRecognizer.recognizeWith(this);
		        }
		        return this;
		    },

		    /**
		     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
		     * @param {Recognizer} otherRecognizer
		     * @returns {Recognizer} this
		     */
		    dropRecognizeWith: function(otherRecognizer) {
		        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
		            return this;
		        }

		        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
		        delete this.simultaneous[otherRecognizer.id];
		        return this;
		    },

		    /**
		     * recognizer can only run when an other is failing
		     * @param {Recognizer} otherRecognizer
		     * @returns {Recognizer} this
		     */
		    requireFailure: function(otherRecognizer) {
		        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
		            return this;
		        }

		        var requireFail = this.requireFail;
		        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
		        if (inArray(requireFail, otherRecognizer) === -1) {
		            requireFail.push(otherRecognizer);
		            otherRecognizer.requireFailure(this);
		        }
		        return this;
		    },

		    /**
		     * drop the requireFailure link. it does not remove the link on the other recognizer.
		     * @param {Recognizer} otherRecognizer
		     * @returns {Recognizer} this
		     */
		    dropRequireFailure: function(otherRecognizer) {
		        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
		            return this;
		        }

		        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
		        var index = inArray(this.requireFail, otherRecognizer);
		        if (index > -1) {
		            this.requireFail.splice(index, 1);
		        }
		        return this;
		    },

		    /**
		     * has require failures boolean
		     * @returns {boolean}
		     */
		    hasRequireFailures: function() {
		        return this.requireFail.length > 0;
		    },

		    /**
		     * if the recognizer can recognize simultaneous with an other recognizer
		     * @param {Recognizer} otherRecognizer
		     * @returns {Boolean}
		     */
		    canRecognizeWith: function(otherRecognizer) {
		        return !!this.simultaneous[otherRecognizer.id];
		    },

		    /**
		     * You should use `tryEmit` instead of `emit` directly to check
		     * that all the needed recognizers has failed before emitting.
		     * @param {Object} input
		     */
		    emit: function(input) {
		        var self = this;
		        var state = this.state;

		        function emit(event) {
		            self.manager.emit(event, input);
		        }

		        // 'panstart' and 'panmove'
		        if (state < STATE_ENDED) {
		            emit(self.options.event + stateStr(state));
		        }

		        emit(self.options.event); // simple 'eventName' events

		        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
		            emit(input.additionalEvent);
		        }

		        // panend and pancancel
		        if (state >= STATE_ENDED) {
		            emit(self.options.event + stateStr(state));
		        }
		    },

		    /**
		     * Check that all the require failure recognizers has failed,
		     * if true, it emits a gesture event,
		     * otherwise, setup the state to FAILED.
		     * @param {Object} input
		     */
		    tryEmit: function(input) {
		        if (this.canEmit()) {
		            return this.emit(input);
		        }
		        // it's failing anyway
		        this.state = STATE_FAILED;
		    },

		    /**
		     * can we emit?
		     * @returns {boolean}
		     */
		    canEmit: function() {
		        var i = 0;
		        while (i < this.requireFail.length) {
		            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
		                return false;
		            }
		            i++;
		        }
		        return true;
		    },

		    /**
		     * update the recognizer
		     * @param {Object} inputData
		     */
		    recognize: function(inputData) {
		        // make a new copy of the inputData
		        // so we can change the inputData without messing up the other recognizers
		        var inputDataClone = assign({}, inputData);

		        // is is enabled and allow recognizing?
		        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
		            this.reset();
		            this.state = STATE_FAILED;
		            return;
		        }

		        // reset when we've reached the end
		        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
		            this.state = STATE_POSSIBLE;
		        }

		        this.state = this.process(inputDataClone);

		        // the recognizer has recognized a gesture
		        // so trigger an event
		        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
		            this.tryEmit(inputDataClone);
		        }
		    },

		    /**
		     * return the state of the recognizer
		     * the actual recognizing happens in this method
		     * @virtual
		     * @param {Object} inputData
		     * @returns {Const} STATE
		     */
		    process: function(inputData) { }, // jshint ignore:line

		    /**
		     * return the preferred touch-action
		     * @virtual
		     * @returns {Array}
		     */
		    getTouchAction: function() { },

		    /**
		     * called when the gesture isn't allowed to recognize
		     * like when another is being recognized or it is disabled
		     * @virtual
		     */
		    reset: function() { }
		};

		/**
		 * get a usable string, used as event postfix
		 * @param {Const} state
		 * @returns {String} state
		 */
		function stateStr(state) {
		    if (state & STATE_CANCELLED) {
		        return 'cancel';
		    } else if (state & STATE_ENDED) {
		        return 'end';
		    } else if (state & STATE_CHANGED) {
		        return 'move';
		    } else if (state & STATE_BEGAN) {
		        return 'start';
		    }
		    return '';
		}

		/**
		 * direction cons to string
		 * @param {Const} direction
		 * @returns {String}
		 */
		function directionStr(direction) {
		    if (direction == DIRECTION_DOWN) {
		        return 'down';
		    } else if (direction == DIRECTION_UP) {
		        return 'up';
		    } else if (direction == DIRECTION_LEFT) {
		        return 'left';
		    } else if (direction == DIRECTION_RIGHT) {
		        return 'right';
		    }
		    return '';
		}

		/**
		 * get a recognizer by name if it is bound to a manager
		 * @param {Recognizer|String} otherRecognizer
		 * @param {Recognizer} recognizer
		 * @returns {Recognizer}
		 */
		function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
		    var manager = recognizer.manager;
		    if (manager) {
		        return manager.get(otherRecognizer);
		    }
		    return otherRecognizer;
		}

		/**
		 * This recognizer is just used as a base for the simple attribute recognizers.
		 * @constructor
		 * @extends Recognizer
		 */
		function AttrRecognizer() {
		    Recognizer.apply(this, arguments);
		}

		inherit(AttrRecognizer, Recognizer, {
		    /**
		     * @namespace
		     * @memberof AttrRecognizer
		     */
		    defaults: {
		        /**
		         * @type {Number}
		         * @default 1
		         */
		        pointers: 1
		    },

		    /**
		     * Used to check if it the recognizer receives valid input, like input.distance > 10.
		     * @memberof AttrRecognizer
		     * @param {Object} input
		     * @returns {Boolean} recognized
		     */
		    attrTest: function(input) {
		        var optionPointers = this.options.pointers;
		        return optionPointers === 0 || input.pointers.length === optionPointers;
		    },

		    /**
		     * Process the input and return the state for the recognizer
		     * @memberof AttrRecognizer
		     * @param {Object} input
		     * @returns {*} State
		     */
		    process: function(input) {
		        var state = this.state;
		        var eventType = input.eventType;

		        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
		        var isValid = this.attrTest(input);

		        // on cancel input and we've recognized before, return STATE_CANCELLED
		        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
		            return state | STATE_CANCELLED;
		        } else if (isRecognized || isValid) {
		            if (eventType & INPUT_END) {
		                return state | STATE_ENDED;
		            } else if (!(state & STATE_BEGAN)) {
		                return STATE_BEGAN;
		            }
		            return state | STATE_CHANGED;
		        }
		        return STATE_FAILED;
		    }
		});

		/**
		 * Pan
		 * Recognized when the pointer is down and moved in the allowed direction.
		 * @constructor
		 * @extends AttrRecognizer
		 */
		function PanRecognizer() {
		    AttrRecognizer.apply(this, arguments);

		    this.pX = null;
		    this.pY = null;
		}

		inherit(PanRecognizer, AttrRecognizer, {
		    /**
		     * @namespace
		     * @memberof PanRecognizer
		     */
		    defaults: {
		        event: 'pan',
		        threshold: 10,
		        pointers: 1,
		        direction: DIRECTION_ALL
		    },

		    getTouchAction: function() {
		        var direction = this.options.direction;
		        var actions = [];
		        if (direction & DIRECTION_HORIZONTAL) {
		            actions.push(TOUCH_ACTION_PAN_Y);
		        }
		        if (direction & DIRECTION_VERTICAL) {
		            actions.push(TOUCH_ACTION_PAN_X);
		        }
		        return actions;
		    },

		    directionTest: function(input) {
		        var options = this.options;
		        var hasMoved = true;
		        var distance = input.distance;
		        var direction = input.direction;
		        var x = input.deltaX;
		        var y = input.deltaY;

		        // lock to axis?
		        if (!(direction & options.direction)) {
		            if (options.direction & DIRECTION_HORIZONTAL) {
		                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
		                hasMoved = x != this.pX;
		                distance = Math.abs(input.deltaX);
		            } else {
		                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
		                hasMoved = y != this.pY;
		                distance = Math.abs(input.deltaY);
		            }
		        }
		        input.direction = direction;
		        return hasMoved && distance > options.threshold && direction & options.direction;
		    },

		    attrTest: function(input) {
		        return AttrRecognizer.prototype.attrTest.call(this, input) &&
		            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
		    },

		    emit: function(input) {

		        this.pX = input.deltaX;
		        this.pY = input.deltaY;

		        var direction = directionStr(input.direction);

		        if (direction) {
		            input.additionalEvent = this.options.event + direction;
		        }
		        this._super.emit.call(this, input);
		    }
		});

		/**
		 * Pinch
		 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
		 * @constructor
		 * @extends AttrRecognizer
		 */
		function PinchRecognizer() {
		    AttrRecognizer.apply(this, arguments);
		}

		inherit(PinchRecognizer, AttrRecognizer, {
		    /**
		     * @namespace
		     * @memberof PinchRecognizer
		     */
		    defaults: {
		        event: 'pinch',
		        threshold: 0,
		        pointers: 2
		    },

		    getTouchAction: function() {
		        return [TOUCH_ACTION_NONE];
		    },

		    attrTest: function(input) {
		        return this._super.attrTest.call(this, input) &&
		            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
		    },

		    emit: function(input) {
		        if (input.scale !== 1) {
		            var inOut = input.scale < 1 ? 'in' : 'out';
		            input.additionalEvent = this.options.event + inOut;
		        }
		        this._super.emit.call(this, input);
		    }
		});

		/**
		 * Press
		 * Recognized when the pointer is down for x ms without any movement.
		 * @constructor
		 * @extends Recognizer
		 */
		function PressRecognizer() {
		    Recognizer.apply(this, arguments);

		    this._timer = null;
		    this._input = null;
		}

		inherit(PressRecognizer, Recognizer, {
		    /**
		     * @namespace
		     * @memberof PressRecognizer
		     */
		    defaults: {
		        event: 'press',
		        pointers: 1,
		        time: 251, // minimal time of the pointer to be pressed
		        threshold: 9 // a minimal movement is ok, but keep it low
		    },

		    getTouchAction: function() {
		        return [TOUCH_ACTION_AUTO];
		    },

		    process: function(input) {
		        var options = this.options;
		        var validPointers = input.pointers.length === options.pointers;
		        var validMovement = input.distance < options.threshold;
		        var validTime = input.deltaTime > options.time;

		        this._input = input;

		        // we only allow little movement
		        // and we've reached an end event, so a tap is possible
		        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
		            this.reset();
		        } else if (input.eventType & INPUT_START) {
		            this.reset();
		            this._timer = setTimeoutContext(function() {
		                this.state = STATE_RECOGNIZED;
		                this.tryEmit();
		            }, options.time, this);
		        } else if (input.eventType & INPUT_END) {
		            return STATE_RECOGNIZED;
		        }
		        return STATE_FAILED;
		    },

		    reset: function() {
		        clearTimeout(this._timer);
		    },

		    emit: function(input) {
		        if (this.state !== STATE_RECOGNIZED) {
		            return;
		        }

		        if (input && (input.eventType & INPUT_END)) {
		            this.manager.emit(this.options.event + 'up', input);
		        } else {
		            this._input.timeStamp = now();
		            this.manager.emit(this.options.event, this._input);
		        }
		    }
		});

		/**
		 * Rotate
		 * Recognized when two or more pointer are moving in a circular motion.
		 * @constructor
		 * @extends AttrRecognizer
		 */
		function RotateRecognizer() {
		    AttrRecognizer.apply(this, arguments);
		}

		inherit(RotateRecognizer, AttrRecognizer, {
		    /**
		     * @namespace
		     * @memberof RotateRecognizer
		     */
		    defaults: {
		        event: 'rotate',
		        threshold: 0,
		        pointers: 2
		    },

		    getTouchAction: function() {
		        return [TOUCH_ACTION_NONE];
		    },

		    attrTest: function(input) {
		        return this._super.attrTest.call(this, input) &&
		            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
		    }
		});

		/**
		 * Swipe
		 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
		 * @constructor
		 * @extends AttrRecognizer
		 */
		function SwipeRecognizer() {
		    AttrRecognizer.apply(this, arguments);
		}

		inherit(SwipeRecognizer, AttrRecognizer, {
		    /**
		     * @namespace
		     * @memberof SwipeRecognizer
		     */
		    defaults: {
		        event: 'swipe',
		        threshold: 10,
		        velocity: 0.3,
		        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
		        pointers: 1
		    },

		    getTouchAction: function() {
		        return PanRecognizer.prototype.getTouchAction.call(this);
		    },

		    attrTest: function(input) {
		        var direction = this.options.direction;
		        var velocity;

		        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
		            velocity = input.overallVelocity;
		        } else if (direction & DIRECTION_HORIZONTAL) {
		            velocity = input.overallVelocityX;
		        } else if (direction & DIRECTION_VERTICAL) {
		            velocity = input.overallVelocityY;
		        }

		        return this._super.attrTest.call(this, input) &&
		            direction & input.offsetDirection &&
		            input.distance > this.options.threshold &&
		            input.maxPointers == this.options.pointers &&
		            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
		    },

		    emit: function(input) {
		        var direction = directionStr(input.offsetDirection);
		        if (direction) {
		            this.manager.emit(this.options.event + direction, input);
		        }

		        this.manager.emit(this.options.event, input);
		    }
		});

		/**
		 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
		 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
		 * a single tap.
		 *
		 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
		 * multi-taps being recognized.
		 * @constructor
		 * @extends Recognizer
		 */
		function TapRecognizer() {
		    Recognizer.apply(this, arguments);

		    // previous time and center,
		    // used for tap counting
		    this.pTime = false;
		    this.pCenter = false;

		    this._timer = null;
		    this._input = null;
		    this.count = 0;
		}

		inherit(TapRecognizer, Recognizer, {
		    /**
		     * @namespace
		     * @memberof PinchRecognizer
		     */
		    defaults: {
		        event: 'tap',
		        pointers: 1,
		        taps: 1,
		        interval: 300, // max time between the multi-tap taps
		        time: 250, // max time of the pointer to be down (like finger on the screen)
		        threshold: 9, // a minimal movement is ok, but keep it low
		        posThreshold: 10 // a multi-tap can be a bit off the initial position
		    },

		    getTouchAction: function() {
		        return [TOUCH_ACTION_MANIPULATION];
		    },

		    process: function(input) {
		        var options = this.options;

		        var validPointers = input.pointers.length === options.pointers;
		        var validMovement = input.distance < options.threshold;
		        var validTouchTime = input.deltaTime < options.time;

		        this.reset();

		        if ((input.eventType & INPUT_START) && (this.count === 0)) {
		            return this.failTimeout();
		        }

		        // we only allow little movement
		        // and we've reached an end event, so a tap is possible
		        if (validMovement && validTouchTime && validPointers) {
		            if (input.eventType != INPUT_END) {
		                return this.failTimeout();
		            }

		            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
		            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

		            this.pTime = input.timeStamp;
		            this.pCenter = input.center;

		            if (!validMultiTap || !validInterval) {
		                this.count = 1;
		            } else {
		                this.count += 1;
		            }

		            this._input = input;

		            // if tap count matches we have recognized it,
		            // else it has began recognizing...
		            var tapCount = this.count % options.taps;
		            if (tapCount === 0) {
		                // no failing requirements, immediately trigger the tap event
		                // or wait as long as the multitap interval to trigger
		                if (!this.hasRequireFailures()) {
		                    return STATE_RECOGNIZED;
		                } else {
		                    this._timer = setTimeoutContext(function() {
		                        this.state = STATE_RECOGNIZED;
		                        this.tryEmit();
		                    }, options.interval, this);
		                    return STATE_BEGAN;
		                }
		            }
		        }
		        return STATE_FAILED;
		    },

		    failTimeout: function() {
		        this._timer = setTimeoutContext(function() {
		            this.state = STATE_FAILED;
		        }, this.options.interval, this);
		        return STATE_FAILED;
		    },

		    reset: function() {
		        clearTimeout(this._timer);
		    },

		    emit: function() {
		        if (this.state == STATE_RECOGNIZED) {
		            this._input.tapCount = this.count;
		            this.manager.emit(this.options.event, this._input);
		        }
		    }
		});

		/**
		 * Simple way to create a manager with a default set of recognizers.
		 * @param {HTMLElement} element
		 * @param {Object} [options]
		 * @constructor
		 */
		function Hammer(element, options) {
		    options = options || {};
		    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
		    return new Manager(element, options);
		}

		/**
		 * @const {string}
		 */
		Hammer.VERSION = '2.0.7';

		/**
		 * default settings
		 * @namespace
		 */
		Hammer.defaults = {
		    /**
		     * set if DOM events are being triggered.
		     * But this is slower and unused by simple implementations, so disabled by default.
		     * @type {Boolean}
		     * @default false
		     */
		    domEvents: false,

		    /**
		     * The value for the touchAction property/fallback.
		     * When set to `compute` it will magically set the correct value based on the added recognizers.
		     * @type {String}
		     * @default compute
		     */
		    touchAction: TOUCH_ACTION_COMPUTE,

		    /**
		     * @type {Boolean}
		     * @default true
		     */
		    enable: true,

		    /**
		     * EXPERIMENTAL FEATURE -- can be removed/changed
		     * Change the parent input target element.
		     * If Null, then it is being set the to main element.
		     * @type {Null|EventTarget}
		     * @default null
		     */
		    inputTarget: null,

		    /**
		     * force an input class
		     * @type {Null|Function}
		     * @default null
		     */
		    inputClass: null,

		    /**
		     * Default recognizer setup when calling `Hammer()`
		     * When creating a new Manager these will be skipped.
		     * @type {Array}
		     */
		    preset: [
		        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
		        [RotateRecognizer, {enable: false}],
		        [PinchRecognizer, {enable: false}, ['rotate']],
		        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
		        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
		        [TapRecognizer],
		        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
		        [PressRecognizer]
		    ],

		    /**
		     * Some CSS properties can be used to improve the working of Hammer.
		     * Add them to this method and they will be set when creating a new Manager.
		     * @namespace
		     */
		    cssProps: {
		        /**
		         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
		         * @type {String}
		         * @default 'none'
		         */
		        userSelect: 'none',

		        /**
		         * Disable the Windows Phone grippers when pressing an element.
		         * @type {String}
		         * @default 'none'
		         */
		        touchSelect: 'none',

		        /**
		         * Disables the default callout shown when you touch and hold a touch target.
		         * On iOS, when you touch and hold a touch target such as a link, Safari displays
		         * a callout containing information about the link. This property allows you to disable that callout.
		         * @type {String}
		         * @default 'none'
		         */
		        touchCallout: 'none',

		        /**
		         * Specifies whether zooming is enabled. Used by IE10>
		         * @type {String}
		         * @default 'none'
		         */
		        contentZooming: 'none',

		        /**
		         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
		         * @type {String}
		         * @default 'none'
		         */
		        userDrag: 'none',

		        /**
		         * Overrides the highlight color shown when the user taps a link or a JavaScript
		         * clickable element in iOS. This property obeys the alpha value, if specified.
		         * @type {String}
		         * @default 'rgba(0,0,0,0)'
		         */
		        tapHighlightColor: 'rgba(0,0,0,0)'
		    }
		};

		var STOP = 1;
		var FORCED_STOP = 2;

		/**
		 * Manager
		 * @param {HTMLElement} element
		 * @param {Object} [options]
		 * @constructor
		 */
		function Manager(element, options) {
		    this.options = assign({}, Hammer.defaults, options || {});

		    this.options.inputTarget = this.options.inputTarget || element;

		    this.handlers = {};
		    this.session = {};
		    this.recognizers = [];
		    this.oldCssProps = {};

		    this.element = element;
		    this.input = createInputInstance(this);
		    this.touchAction = new TouchAction(this, this.options.touchAction);

		    toggleCssProps(this, true);

		    each(this.options.recognizers, function(item) {
		        var recognizer = this.add(new (item[0])(item[1]));
		        item[2] && recognizer.recognizeWith(item[2]);
		        item[3] && recognizer.requireFailure(item[3]);
		    }, this);
		}

		Manager.prototype = {
		    /**
		     * set options
		     * @param {Object} options
		     * @returns {Manager}
		     */
		    set: function(options) {
		        assign(this.options, options);

		        // Options that need a little more setup
		        if (options.touchAction) {
		            this.touchAction.update();
		        }
		        if (options.inputTarget) {
		            // Clean up existing event listeners and reinitialize
		            this.input.destroy();
		            this.input.target = options.inputTarget;
		            this.input.init();
		        }
		        return this;
		    },

		    /**
		     * stop recognizing for this session.
		     * This session will be discarded, when a new [input]start event is fired.
		     * When forced, the recognizer cycle is stopped immediately.
		     * @param {Boolean} [force]
		     */
		    stop: function(force) {
		        this.session.stopped = force ? FORCED_STOP : STOP;
		    },

		    /**
		     * run the recognizers!
		     * called by the inputHandler function on every movement of the pointers (touches)
		     * it walks through all the recognizers and tries to detect the gesture that is being made
		     * @param {Object} inputData
		     */
		    recognize: function(inputData) {
		        var session = this.session;
		        if (session.stopped) {
		            return;
		        }

		        // run the touch-action polyfill
		        this.touchAction.preventDefaults(inputData);

		        var recognizer;
		        var recognizers = this.recognizers;

		        // this holds the recognizer that is being recognized.
		        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
		        // if no recognizer is detecting a thing, it is set to `null`
		        var curRecognizer = session.curRecognizer;

		        // reset when the last recognizer is recognized
		        // or when we're in a new session
		        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
		            curRecognizer = session.curRecognizer = null;
		        }

		        var i = 0;
		        while (i < recognizers.length) {
		            recognizer = recognizers[i];

		            // find out if we are allowed try to recognize the input for this one.
		            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
		            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
		            //      that is being recognized.
		            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
		            //      this can be setup with the `recognizeWith()` method on the recognizer.
		            if (session.stopped !== FORCED_STOP && ( // 1
		                    !curRecognizer || recognizer == curRecognizer || // 2
		                    recognizer.canRecognizeWith(curRecognizer))) { // 3
		                recognizer.recognize(inputData);
		            } else {
		                recognizer.reset();
		            }

		            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
		            // current active recognizer. but only if we don't already have an active recognizer
		            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
		                curRecognizer = session.curRecognizer = recognizer;
		            }
		            i++;
		        }
		    },

		    /**
		     * get a recognizer by its event name.
		     * @param {Recognizer|String} recognizer
		     * @returns {Recognizer|Null}
		     */
		    get: function(recognizer) {
		        if (recognizer instanceof Recognizer) {
		            return recognizer;
		        }

		        var recognizers = this.recognizers;
		        for (var i = 0; i < recognizers.length; i++) {
		            if (recognizers[i].options.event == recognizer) {
		                return recognizers[i];
		            }
		        }
		        return null;
		    },

		    /**
		     * add a recognizer to the manager
		     * existing recognizers with the same event name will be removed
		     * @param {Recognizer} recognizer
		     * @returns {Recognizer|Manager}
		     */
		    add: function(recognizer) {
		        if (invokeArrayArg(recognizer, 'add', this)) {
		            return this;
		        }

		        // remove existing
		        var existing = this.get(recognizer.options.event);
		        if (existing) {
		            this.remove(existing);
		        }

		        this.recognizers.push(recognizer);
		        recognizer.manager = this;

		        this.touchAction.update();
		        return recognizer;
		    },

		    /**
		     * remove a recognizer by name or instance
		     * @param {Recognizer|String} recognizer
		     * @returns {Manager}
		     */
		    remove: function(recognizer) {
		        if (invokeArrayArg(recognizer, 'remove', this)) {
		            return this;
		        }

		        recognizer = this.get(recognizer);

		        // let's make sure this recognizer exists
		        if (recognizer) {
		            var recognizers = this.recognizers;
		            var index = inArray(recognizers, recognizer);

		            if (index !== -1) {
		                recognizers.splice(index, 1);
		                this.touchAction.update();
		            }
		        }

		        return this;
		    },

		    /**
		     * bind event
		     * @param {String} events
		     * @param {Function} handler
		     * @returns {EventEmitter} this
		     */
		    on: function(events, handler) {
		        if (events === undefined$1) {
		            return;
		        }
		        if (handler === undefined$1) {
		            return;
		        }

		        var handlers = this.handlers;
		        each(splitStr(events), function(event) {
		            handlers[event] = handlers[event] || [];
		            handlers[event].push(handler);
		        });
		        return this;
		    },

		    /**
		     * unbind event, leave emit blank to remove all handlers
		     * @param {String} events
		     * @param {Function} [handler]
		     * @returns {EventEmitter} this
		     */
		    off: function(events, handler) {
		        if (events === undefined$1) {
		            return;
		        }

		        var handlers = this.handlers;
		        each(splitStr(events), function(event) {
		            if (!handler) {
		                delete handlers[event];
		            } else {
		                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
		            }
		        });
		        return this;
		    },

		    /**
		     * emit event to the listeners
		     * @param {String} event
		     * @param {Object} data
		     */
		    emit: function(event, data) {
		        // we also want to trigger dom events
		        if (this.options.domEvents) {
		            triggerDomEvent(event, data);
		        }

		        // no handlers, so skip it all
		        var handlers = this.handlers[event] && this.handlers[event].slice();
		        if (!handlers || !handlers.length) {
		            return;
		        }

		        data.type = event;
		        data.preventDefault = function() {
		            data.srcEvent.preventDefault();
		        };

		        var i = 0;
		        while (i < handlers.length) {
		            handlers[i](data);
		            i++;
		        }
		    },

		    /**
		     * destroy the manager and unbinds all events
		     * it doesn't unbind dom events, that is the user own responsibility
		     */
		    destroy: function() {
		        this.element && toggleCssProps(this, false);

		        this.handlers = {};
		        this.session = {};
		        this.input.destroy();
		        this.element = null;
		    }
		};

		/**
		 * add/remove the css properties as defined in manager.options.cssProps
		 * @param {Manager} manager
		 * @param {Boolean} add
		 */
		function toggleCssProps(manager, add) {
		    var element = manager.element;
		    if (!element.style) {
		        return;
		    }
		    var prop;
		    each(manager.options.cssProps, function(value, name) {
		        prop = prefixed(element.style, name);
		        if (add) {
		            manager.oldCssProps[prop] = element.style[prop];
		            element.style[prop] = value;
		        } else {
		            element.style[prop] = manager.oldCssProps[prop] || '';
		        }
		    });
		    if (!add) {
		        manager.oldCssProps = {};
		    }
		}

		/**
		 * trigger dom event
		 * @param {String} event
		 * @param {Object} data
		 */
		function triggerDomEvent(event, data) {
		    var gestureEvent = document.createEvent('Event');
		    gestureEvent.initEvent(event, true, true);
		    gestureEvent.gesture = data;
		    data.target.dispatchEvent(gestureEvent);
		}

		assign(Hammer, {
		    INPUT_START: INPUT_START,
		    INPUT_MOVE: INPUT_MOVE,
		    INPUT_END: INPUT_END,
		    INPUT_CANCEL: INPUT_CANCEL,

		    STATE_POSSIBLE: STATE_POSSIBLE,
		    STATE_BEGAN: STATE_BEGAN,
		    STATE_CHANGED: STATE_CHANGED,
		    STATE_ENDED: STATE_ENDED,
		    STATE_RECOGNIZED: STATE_RECOGNIZED,
		    STATE_CANCELLED: STATE_CANCELLED,
		    STATE_FAILED: STATE_FAILED,

		    DIRECTION_NONE: DIRECTION_NONE,
		    DIRECTION_LEFT: DIRECTION_LEFT,
		    DIRECTION_RIGHT: DIRECTION_RIGHT,
		    DIRECTION_UP: DIRECTION_UP,
		    DIRECTION_DOWN: DIRECTION_DOWN,
		    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
		    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
		    DIRECTION_ALL: DIRECTION_ALL,

		    Manager: Manager,
		    Input: Input,
		    TouchAction: TouchAction,

		    TouchInput: TouchInput,
		    MouseInput: MouseInput,
		    PointerEventInput: PointerEventInput,
		    TouchMouseInput: TouchMouseInput,
		    SingleTouchInput: SingleTouchInput,

		    Recognizer: Recognizer,
		    AttrRecognizer: AttrRecognizer,
		    Tap: TapRecognizer,
		    Pan: PanRecognizer,
		    Swipe: SwipeRecognizer,
		    Pinch: PinchRecognizer,
		    Rotate: RotateRecognizer,
		    Press: PressRecognizer,

		    on: addEventListeners,
		    off: removeEventListeners,
		    each: each,
		    merge: merge,
		    extend: extend,
		    assign: assign,
		    inherit: inherit,
		    bindFn: bindFn,
		    prefixed: prefixed
		});

		// this prevents errors when Hammer is loaded in the presence of an AMD
		//  style loader but by script tag, not by the loader.
		var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
		freeGlobal.Hammer = Hammer;

		if (typeof undefined$1 === 'function' && undefined$1.amd) {
		    undefined$1(function() {
		        return Hammer;
		    });
		} else if ('object' != 'undefined' && module.exports) {
		    module.exports = Hammer;
		} else {
		    window[exportName] = Hammer;
		}

		})(window, document, 'Hammer');
	} (hammer$1));

	var hammer = hammer$1.exports;

	const ANNOTATION_COUNT_ATTR = 'data-hypothesis-annotation-count';

	/**
	 * Update the elements in the container element with the count data attribute
	 * with the new annotation count. See:
	 * https://h.readthedocs.io/projects/client/en/latest/publishers/host-page-integration/#cmdoption-arg-data-hypothesis-annotation-count
	 *
	 * @param {Element} rootEl - The DOM element which contains the elements that
	 *   display annotation count.
	 * @param {import('../shared/messaging').PortRPC<'publicAnnotationCountChanged', string>} rpc - Channel for host-sidebar communication
	 */
	function annotationCounts(rootEl, rpc) {
	  rpc.on('publicAnnotationCountChanged', updateAnnotationCountElems);

	  /** @param {number} newCount */
	  function updateAnnotationCountElems(newCount) {
	    const elems = rootEl.querySelectorAll('[' + ANNOTATION_COUNT_ATTR + ']');
	    Array.from(elems).forEach(elem => {
	      elem.textContent = newCount.toString();
	    });
	  }
	}

	var _jsxFileName$3 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/Buckets.js";
	function BucketList({
	  children
	}) {
	  return o("ul", {
	    className: classnames(
	    // 2020-11-20: Making bucket bar one pixel wider (23px vs 22px) is an
	    // interim and pragmatic solution for an apparent glitch on
	    // Safari and Chrome. Adding one pixel resolves this issue:
	    // https://github.com/hypothesis/client/pull/2750
	    'absolute w-[23px] left-[-22px] h-full',
	    // The background is set to low opacity when the sidebar is collapsed.
	    'bg-grey-2 sidebar-collapsed:bg-black/[.08]',
	    // Disable pointer events along the sidebar itself; re-enable them in
	    // bucket indicator buttons
	    'pointer-events-none'),
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$3,
	    lineNumber: 18,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * Render a vertically-positioned bucket-list item.
	 *
	 * @param {object} props
	 *  @param {Children} props.children
	 *  @param {number} props.topPosition - The vertical top position, in pixels,
	 *   for this bucket item relative to the top of the containing BucketList
	 */
	function BucketItem({
	  children,
	  topPosition
	}) {
	  return o("li", {
	    className: classnames('absolute right-0',
	    // Re-enable pointer events, which are disabled on the containing list
	    'pointer-events-auto'),
	    style: {
	      top: topPosition
	    },
	    children: children
	  }, void 0, false, {
	    fileName: _jsxFileName$3,
	    lineNumber: 47,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * A list of buckets, including up and down navigation (when applicable) and
	 * on-screen buckets
	 *
	 * This component and its buttons are sized with absolute units such that they
	 * don't scale with changes to the host page's root font size. They will still
	 * properly scale with user/browser zooming.
	 *
	 * @param {object} props
	 *   @param {Bucket} props.above
	 *   @param {Bucket} props.below
	 *   @param {Bucket[]} props.buckets
	 *   @param {(tags: string[]) => void} props.onFocusAnnotations
	 *   @param {(tags: string[], direction: 'down'|'up') => void} props.onScrollToClosestOffScreenAnchor
	 *   @param {(tags: string[], toggle: boolean) => void} props.onSelectAnnotations
	 */
	function Buckets({
	  above,
	  below,
	  buckets,
	  onFocusAnnotations,
	  onScrollToClosestOffScreenAnchor,
	  onSelectAnnotations
	}) {
	  const showUpNavigation = above.tags.size > 0;
	  const showDownNavigation = below.tags.size > 0;
	  return o(BucketList, {
	    children: [showUpNavigation && o(BucketItem, {
	      topPosition: above.position,
	      children: o(LabeledButton, {
	        className: classnames('BucketButton UpBucketButton',
	        // Center the button vertically at `above.position` by pulling
	        // its top margin up by about half the button's height.
	        // This puts it nearer the toolbar's other buttons above the
	        // bucket list.
	        'right-0 mt-[-11px]'),
	        "data-testid": "up-navigation-button",
	        onClick: () => onScrollToClosestOffScreenAnchor([...above.tags], 'up'),
	        onBlur: () => onFocusAnnotations([]),
	        onFocus: () => onFocusAnnotations([...above.tags]),
	        onMouseEnter: () => onFocusAnnotations([...above.tags]),
	        onMouseOut: () => onFocusAnnotations([]),
	        title: `Go up to next annotations (${above.tags.size})`,
	        children: above.tags.size
	      }, void 0, false, {
	        fileName: _jsxFileName$3,
	        lineNumber: 91,
	        columnNumber: 11
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$3,
	      lineNumber: 90,
	      columnNumber: 9
	    }, this), buckets.map((bucket, index) => o(BucketItem, {
	      topPosition: bucket.position,
	      children: o(LabeledButton, {
	        className: classnames('BucketButton LeftBucketButton',
	        // Center the bucket indicator button vertically on `bucket.position`
	        // by pulling it by half the height of the button
	        'right-0 mt-[-8px]'),
	        onClick: event => onSelectAnnotations([...bucket.tags], event.metaKey || event.ctrlKey),
	        onBlur: () => onFocusAnnotations([]),
	        onFocus: () => onFocusAnnotations([...bucket.tags]),
	        onMouseEnter: () => onFocusAnnotations([...bucket.tags]),
	        onMouseOut: () => onFocusAnnotations([]),
	        title: `Select nearby annotations (${bucket.tags.size})`,
	        children: bucket.tags.size
	      }, void 0, false, {
	        fileName: _jsxFileName$3,
	        lineNumber: 116,
	        columnNumber: 11
	      }, this)
	    }, index, false, {
	      fileName: _jsxFileName$3,
	      lineNumber: 115,
	      columnNumber: 9
	    }, this)), showDownNavigation && o(BucketItem, {
	      topPosition: below.position,
	      children: o(LabeledButton, {
	        className: "BucketButton DownBucketButton right-0",
	        "data-testid": "down-navigation-button",
	        onClick: () => onScrollToClosestOffScreenAnchor([...below.tags], 'down'),
	        onBlur: () => onFocusAnnotations([]),
	        onFocus: () => onFocusAnnotations([...below.tags]),
	        onMouseEnter: () => onFocusAnnotations([...below.tags]),
	        onMouseOut: () => onFocusAnnotations([]),
	        title: `Go up to next annotations (${below.tags.size})`,
	        children: below.tags.size
	      }, void 0, false, {
	        fileName: _jsxFileName$3,
	        lineNumber: 141,
	        columnNumber: 11
	      }, this)
	    }, void 0, false, {
	      fileName: _jsxFileName$3,
	      lineNumber: 140,
	      columnNumber: 9
	    }, this)]
	  }, void 0, true, {
	    fileName: _jsxFileName$3,
	    lineNumber: 88,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName$2 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/bucket-bar.js";
	class BucketBar {
	  /**
	   * @param {HTMLElement} container
	   * @param {object} options
	   *   @param {(tags: string[]) => void} options.onFocusAnnotations
	   *   @param {(tags: string[], direction: 'down'|'up') => void} options.onScrollToClosestOffScreenAnchor
	   *   @param {(tags: string[], toggle: boolean) => void} options.onSelectAnnotations
	   */
	  constructor(container, {
	    onFocusAnnotations,
	    onScrollToClosestOffScreenAnchor,
	    onSelectAnnotations
	  }) {
	    this._bucketsContainer = document.createElement('div');
	    container.appendChild(this._bucketsContainer);
	    this._onFocusAnnotations = onFocusAnnotations;
	    this._onScrollToClosestOffScreenAnchor = onScrollToClosestOffScreenAnchor;
	    this._onSelectAnnotations = onSelectAnnotations;

	    // Immediately render the bucket bar
	    this.update([]);
	  }
	  destroy() {
	    P$1(null, this._bucketsContainer);
	    this._bucketsContainer.remove();
	  }

	  /**
	   * @param {AnchorPosition[]} positions
	   */
	  update(positions) {
	    const buckets = computeBuckets(positions);
	    P$1(o(Buckets, {
	      above: buckets.above,
	      below: buckets.below,
	      buckets: buckets.buckets,
	      onFocusAnnotations: tags => this._onFocusAnnotations(tags),
	      onScrollToClosestOffScreenAnchor: (tags, direction) => this._onScrollToClosestOffScreenAnchor(tags, direction),
	      onSelectAnnotations: (tags, toogle) => this._onSelectAnnotations(tags, toogle)
	    }, void 0, false, {
	      fileName: _jsxFileName$2,
	      lineNumber: 55,
	      columnNumber: 7
	    }, this), this._bucketsContainer);
	  }
	}

	const SIDEBAR_TRIGGER_BTN_ATTR = 'data-hypothesis-trigger';

	/**
	 * Show the sidebar when user clicks on an element with the
	 * trigger data attribute.
	 *
	 * @param {Element} rootEl - The DOM element which contains the trigger elements.
	 * @param {() => void} showFn - Function which shows the sidebar.
	 */
	function sidebarTrigger(rootEl, showFn) {
	  const triggerElems = rootEl.querySelectorAll('[' + SIDEBAR_TRIGGER_BTN_ATTR + ']');
	  Array.from(triggerElems).forEach(triggerElem => {
	    triggerElem.addEventListener('click', e => {
	      showFn();
	      e.stopPropagation();
	    });
	  });
	}

	var _jsxFileName$1 = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/components/Toolbar.js";
	function ToolbarButton({
	  ...buttonProps
	}) {
	  const {
	    icon,
	    title,
	    ...restProps
	  } = buttonProps;
	  return o(IconButton, {
	    className: classnames('w-[30px] h-[30px]',
	    // These buttons have precise dimensions
	    'rounded-px',
	    // size of border radius in absolute units
	    'flex items-center justify-center', 'border bg-white text-grey-6 hover:text-grey-9', 'shadow transition-colors'),
	    icon: icon,
	    title: title,
	    ...restProps
	  }, void 0, false, {
	    fileName: _jsxFileName$1,
	    lineNumber: 18,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * @typedef StatusNotifierProps
	 * @prop {boolean} highlightsVisible
	 */

	/**
	 * Hidden component that announces certain Hypothesis states.
	 *
	 * This is useful to inform assistive technology users when these states
	 * have been changed (eg. whether highlights are visible), given that they can
	 * be changed in multiple ways (keyboard shortcuts, toolbar button) etc.
	 *
	 * @param {StatusNotifierProps} props
	 */
	function StatusNotifier({
	  highlightsVisible
	}) {
	  return o("div", {
	    className: "sr-only",
	    role: "status",
	    "data-testid": "toolbar-status",
	    children: highlightsVisible ? 'Highlights visible' : 'Highlights hidden'
	  }, void 0, false, {
	    fileName: _jsxFileName$1,
	    lineNumber: 49,
	    columnNumber: 5
	  }, this);
	}

	/**
	 * @typedef ToolbarProps
	 *
	 * @prop {() => void} closeSidebar -
	 *   Callback for the "Close sidebar" button. This button is only shown when
	 *   `useMinimalControls` is true and the sidebar is open.
	 * @prop {() => void} createAnnotation -
	 *   Callback for the "Create annotation" / "Create page note" button. The type
	 *   of annotation depends on whether there is a text selection and is decided
	 *   by the caller.
	 * @prop {boolean} isSidebarOpen - Is the sidebar currently visible?
	 * @prop {'annotation'|'note'} newAnnotationType -
	 *   Icon to show on the "Create annotation" button indicating what kind of annotation
	 *   will be created.
	 * @prop {boolean} showHighlights - Are highlights currently visible in the document?
	 * @prop {() => void} toggleHighlights -
	 *   Callback to toggle visibility of highlights in the document.
	 * @prop {() => void} toggleSidebar -
	 *   Callback to toggle the visibility of the sidebar.
	 * @prop {import("preact").Ref<HTMLButtonElement>} [toggleSidebarRef] -
	 *   Ref that gets set to the toolbar button for toggling the sidebar.
	 *   This is exposed to enable the drag-to-resize functionality of this
	 *   button.
	 * @prop {boolean} [useMinimalControls] -
	 *   If true, all controls are hidden except for the "Close sidebar" button
	 *   when the sidebar is open. This is enabled in the "clean" theme.
	 */

	/**
	 * Controls on the edge of the sidebar for opening/closing the sidebar,
	 * controlling highlight visibility and creating new page notes.
	 *
	 * This component and its buttons are sized with absolute units such that they
	 * don't scale with changes to the host page's root font size. They will still
	 * properly scale with user/browser zooming.
	 *
	 * @param {ToolbarProps} props
	 */
	function Toolbar({
	  closeSidebar,
	  createAnnotation,
	  isSidebarOpen,
	  newAnnotationType,
	  showHighlights,
	  toggleHighlights,
	  toggleSidebar,
	  toggleSidebarRef,
	  useMinimalControls = false
	}) {
	  return o("div", {
	    className: classnames('absolute left-[-33px] w-[33px] z-2', 'text-px-base leading-none' // non-scaling sizing
	    ),
	    children: [useMinimalControls && isSidebarOpen && o(IconButton, {
	      className: classnames('w-[27px] h-[27px] mt-[140px] ml-px-1.5', 'flex items-center justify-center bg-white border', 'text-grey-6 hover:text-grey-9 transition-colors',
	      // Turn off right border to blend with sidebar
	      'border-r-0',
	      // A more intense shadow than other ToolbarButtons, to match that
	      // of the edge of the sidebar in clean theme
	      'shadow-sidebar'),
	      title: "\u0627\u063A\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062C\u0627\u0646\u0628\u064A\u0629 \u0644\u0644\u062A\u0648\u0633\u064A\u0645",
	      icon: "cancel",
	      onClick: closeSidebar
	    }, void 0, false, {
	      fileName: _jsxFileName$1,
	      lineNumber: 117,
	      columnNumber: 9
	    }, this), !useMinimalControls && o(p$2, {
	      children: [o(IconButton, {
	        className: classnames(
	        // Height and width to align with the sidebar's top bar
	        'h-[40px] w-[33px] pl-px-1.5', 'bg-white text-grey-5 hover:text-grey-9',
	        // Turn on left and bottom borders to continue the
	        // border of the sidebar's top bar
	        'border-l border-b'),
	        buttonRef: toggleSidebarRef,
	        title: "\u0639\u0631\u0636 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062C\u0627\u0646\u0628\u064A\u0629 \u0644\u0644\u062A\u0648\u0633\u064A\u0645",
	        icon: isSidebarOpen ? 'caret-right' : 'caret-left',
	        expanded: isSidebarOpen,
	        pressed: isSidebarOpen,
	        onClick: toggleSidebar
	      }, void 0, false, {
	        fileName: _jsxFileName$1,
	        lineNumber: 135,
	        columnNumber: 11
	      }, this), o("div", {
	        className: "space-y-px-1.5 mt-px-2",
	        children: [o(ToolbarButton, {
	          title: "\u0627\u0638\u0647\u0627\u0631 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0638\u0644\u0644\u0629 ",
	          icon: showHighlights ? 'show' : 'hide',
	          selected: showHighlights,
	          onClick: toggleHighlights
	        }, void 0, false, {
	          fileName: _jsxFileName$1,
	          lineNumber: 152,
	          columnNumber: 13
	        }, this), o(ToolbarButton, {
	          title: newAnnotationType === 'note' ? 'ملاحظة جديدة للصفحة ' : 'توسيم جديد',
	          icon: newAnnotationType === 'note' ? 'note' : 'annotate',
	          onClick: createAnnotation
	        }, void 0, false, {
	          fileName: _jsxFileName$1,
	          lineNumber: 158,
	          columnNumber: 13
	        }, this)]
	      }, void 0, true, {
	        fileName: _jsxFileName$1,
	        lineNumber: 151,
	        columnNumber: 11
	      }, this), o(StatusNotifier, {
	        highlightsVisible: showHighlights
	      }, void 0, false, {
	        fileName: _jsxFileName$1,
	        lineNumber: 168,
	        columnNumber: 11
	      }, this)]
	    }, void 0, true)]
	  }, void 0, true, {
	    fileName: _jsxFileName$1,
	    lineNumber: 105,
	    columnNumber: 5
	  }, this);
	}

	var _jsxFileName = "/Users/abbander/dev/ksaa-nlp/hypothesis-client/src/annotator/toolbar.js";
	class ToolbarController {
	  /**
	   * @param {HTMLElement} container - Element into which the toolbar is rendered
	   * @param {ToolbarOptions} options
	   */
	  constructor(container, options) {
	    const {
	      createAnnotation,
	      setSidebarOpen,
	      setHighlightsVisible
	    } = options;
	    this._container = container;
	    this._useMinimalControls = false;

	    /** @type {'annotation'|'note'} */
	    this._newAnnotationType = 'note';
	    this._highlightsVisible = false;
	    this._sidebarOpen = false;
	    this._closeSidebar = () => setSidebarOpen(false);
	    this._toggleSidebar = () => setSidebarOpen(!this._sidebarOpen);
	    this._toggleHighlights = () => setHighlightsVisible(!this._highlightsVisible);
	    this._createAnnotation = () => {
	      createAnnotation();
	      setSidebarOpen(true);
	    };

	    /** Reference to the sidebar toggle button. */
	    this._sidebarToggleButton = y$2();
	    this.render();
	  }
	  getWidth() {
	    const content = /** @type {HTMLElement} */this._container.firstChild;
	    return content.getBoundingClientRect().width;
	  }

	  /**
	   * Set whether the toolbar is in the "minimal controls" mode where
	   * only the "Close" button is shown.
	   */
	  set useMinimalControls(minimal) {
	    this._useMinimalControls = minimal;
	    this.render();
	  }
	  get useMinimalControls() {
	    return this._useMinimalControls;
	  }

	  /**
	   * Update the toolbar to reflect whether the sidebar is open or not.
	   */
	  set sidebarOpen(open) {
	    this._sidebarOpen = open;
	    this.render();
	  }
	  get sidebarOpen() {
	    return this._sidebarOpen;
	  }

	  /**
	   * Update the toolbar to reflect whether the "Create annotation" button will
	   * create a page note (if there is no selection) or an annotation (if there is
	   * a selection).
	   */
	  set newAnnotationType(type) {
	    this._newAnnotationType = type;
	    this.render();
	  }
	  get newAnnotationType() {
	    return this._newAnnotationType;
	  }

	  /**
	   * Update the toolbar to reflect whether highlights are currently visible.
	   */
	  set highlightsVisible(visible) {
	    this._highlightsVisible = visible;
	    this.render();
	  }
	  get highlightsVisible() {
	    return this._highlightsVisible;
	  }

	  /**
	   * Return the DOM element that toggles the sidebar's visibility.
	   *
	   * @type {HTMLButtonElement}
	   */
	  get sidebarToggleButton() {
	    return this._sidebarToggleButton.current;
	  }
	  render() {
	    P$1(o(Toolbar, {
	      closeSidebar: this._closeSidebar,
	      createAnnotation: this._createAnnotation,
	      newAnnotationType: this._newAnnotationType,
	      isSidebarOpen: this._sidebarOpen,
	      showHighlights: this._highlightsVisible,
	      toggleHighlights: this._toggleHighlights,
	      toggleSidebar: this._toggleSidebar,
	      toggleSidebarRef: this._sidebarToggleButton,
	      useMinimalControls: this.useMinimalControls
	    }, void 0, false, {
	      fileName: _jsxFileName,
	      lineNumber: 118,
	      columnNumber: 7
	    }, this), this._container);
	  }
	}

	/**
	 * @typedef {import('./guest').Guest} Guest
	 * @typedef {import('../types/annotator').AnchorPosition} AnchorPosition
	 * @typedef {import('../types/annotator').SidebarLayout} SidebarLayout
	 * @typedef {import('../types/annotator').Destroyable} Destroyable
	 * @typedef {import('../types/config').Service} Service
	 * @typedef {import('../types/port-rpc-events').GuestToHostEvent} GuestToHostEvent
	 * @typedef {import('../types/port-rpc-events').HostToGuestEvent} HostToGuestEvent
	 * @typedef {import('../types/port-rpc-events').HostToSidebarEvent} HostToSidebarEvent
	 * @typedef {import('../types/port-rpc-events').SidebarToHostEvent} SidebarToHostEvent
	 */

	// Minimum width to which the iframeContainer can be resized.
	const MIN_RESIZE = 280;

	/**
	 * Client configuration used to launch the sidebar application.
	 *
	 * This includes the URL for the iframe and configuration to pass to the
	 * application on launch.
	 *
	 * @typedef {{ sidebarAppUrl: string } & Record<string, unknown>} SidebarConfig
	 */

	/**
	 * Client configuration used by the sidebar container ({@link Sidebar}).
	 *
	 * @typedef SidebarContainerConfig
	 * @prop {Service[]} [services] - Details of the annotation service the
	 *   client should connect to. This includes callbacks provided by the host
	 *   page to handle certain actions in the sidebar (eg. the Login button).
	 * @prop {string} [externalContainerSelector] - CSS selector of a container
	 *   element in the host page which the sidebar should be added into, instead
	 *   of creating a new container.
	 * @prop {(layout: SidebarLayout) => void} [onLayoutChange] - Callback that
	 *   allows the host page to react to the sidebar being opened, closed or
	 *   resized
	 */

	/**
	 * Create the iframe that will load the sidebar application.
	 *
	 * @param {SidebarConfig} config
	 * @return {HTMLIFrameElement}
	 */
	function createSidebarIframe(config) {
	  const sidebarURL = /** @type {string} */config.sidebarAppUrl;
	  const sidebarAppSrc = addConfigFragment(sidebarURL, createAppConfig(sidebarURL, config));
	  const sidebarFrame = document.createElement('iframe');

	  // Enable media in annotations to be shown fullscreen
	  sidebarFrame.setAttribute('allowfullscreen', '');
	  sidebarFrame.src = sidebarAppSrc;
	  sidebarFrame.title = 'Hypothesis annotation viewer';
	  sidebarFrame.className = 'sidebar-frame';
	  return sidebarFrame;
	}

	/**
	 * The `Sidebar` class creates (1) the sidebar application iframe, (2) its container,
	 * as well as (3) the adjacent controls.
	 *
	 * @implements {Destroyable}
	 */
	class Sidebar {
	  /**
	   * @param {HTMLElement} element
	   * @param {import('./util/emitter').EventBus} eventBus -
	   *   Enables communication between components sharing the same eventBus
	   * @param {SidebarContainerConfig & SidebarConfig} config
	   */
	  constructor(element, eventBus, config) {
	    this._emitter = eventBus.createEmitter();

	    /**
	     * Tracks which `Guest` has a text selection. `null` indicates to default
	     * to the first connected guest frame.
	     *
	     * @type {PortRPC<GuestToHostEvent, HostToGuestEvent>|null}
	     */
	    this._guestWithSelection = null;

	    /**
	     * Channels for host-guest communication.
	     *
	     * @type {PortRPC<GuestToHostEvent, HostToGuestEvent>[]}
	     */
	    this._guestRPC = [];

	    /**
	     * Channel for host-sidebar communication.
	     *
	     * @type {PortRPC<SidebarToHostEvent, HostToSidebarEvent>}
	     */
	    this._sidebarRPC = new PortRPC();

	    /**
	     * The `<iframe>` element containing the sidebar application.
	     */
	    this.iframe = createSidebarIframe(config);
	    this._config = config;

	    /** @type {BucketBar|null} */
	    this.bucketBar = null;
	    this.features = new FeatureFlags();
	    if (config.externalContainerSelector) {
	      var _document$querySelect;
	      this.externalFrame = /** @type {HTMLElement} */(_document$querySelect = document.querySelector(config.externalContainerSelector)) !== null && _document$querySelect !== void 0 ? _document$querySelect : element;
	      this.externalFrame.appendChild(this.iframe);
	    } else {
	      this.iframeContainer = document.createElement('div');
	      this.iframeContainer.style.display = 'none';
	      this.iframeContainer.className = 'sidebar-container';
	      if (config.theme === 'clean') {
	        this.iframeContainer.classList.add('theme-clean');
	      } else {
	        this.bucketBar = new BucketBar(this.iframeContainer, {
	          onFocusAnnotations: tags => this._guestRPC.forEach(rpc => rpc.call('hoverAnnotations', tags)),
	          onScrollToClosestOffScreenAnchor: (tags, direction) => this._guestRPC.forEach(rpc => rpc.call('scrollToClosestOffScreenAnchor', tags, direction)),
	          onSelectAnnotations: (tags, toggle) => this._guestRPC.forEach(rpc => rpc.call('selectAnnotations', tags, toggle))
	        });
	      }
	      this.iframeContainer.appendChild(this.iframe);

	      // Wrap up the 'iframeContainer' element into a shadow DOM so it is not affected by host CSS styles
	      this.hypothesisSidebar = document.createElement('hypothesis-sidebar');
	      const shadowRoot = createShadowRoot(this.hypothesisSidebar);
	      shadowRoot.appendChild(this.iframeContainer);
	      element.appendChild(this.hypothesisSidebar);
	    }

	    // Register the sidebar as a handler for Hypothesis errors in this frame.
	    if (this.iframe.contentWindow) {
	      sendErrorsTo(this.iframe.contentWindow);
	    }
	    this._listeners = new ListenerCollection$1();

	    // Set up the toolbar on the left edge of the sidebar.
	    const toolbarContainer = document.createElement('div');
	    this.toolbar = new ToolbarController(toolbarContainer, {
	      createAnnotation: () => {
	        var _this$_guestWithSelec;
	        if (this._guestRPC.length === 0) {
	          return;
	        }
	        const rpc = (_this$_guestWithSelec = this._guestWithSelection) !== null && _this$_guestWithSelec !== void 0 ? _this$_guestWithSelec : this._guestRPC[0];
	        rpc.call('createAnnotation');
	      },
	      setSidebarOpen: open => open ? this.open() : this.close(),
	      setHighlightsVisible: show => this.setHighlightsVisible(show)
	    });
	    if (config.theme === 'clean') {
	      this.toolbar.useMinimalControls = true;
	    } else {
	      this.toolbar.useMinimalControls = false;
	    }
	    if (this.iframeContainer) {
	      // If using our own container frame for the sidebar, add the toolbar to it.
	      this.iframeContainer.prepend(toolbarContainer);
	      this.toolbarWidth = this.toolbar.getWidth();
	    } else {
	      // If using a host-page provided container for the sidebar, the toolbar is
	      // not shown.
	      this.toolbarWidth = 0;
	    }
	    this._listeners.add(window, 'resize', () => this._onResize());
	    this._gestureState = {
	      // Initial position at the start of a drag/pan resize event (in pixels).
	      initial: /** @type {number|null} */null,
	      // Final position at end of drag resize event.
	      final: /** @type {number|null} */null
	    };
	    this._setupGestures();
	    this.close();

	    // Publisher-provided callback functions
	    const [serviceConfig] = config.services || [];
	    if (serviceConfig) {
	      this.onLoginRequest = serviceConfig.onLoginRequest;
	      this.onLogoutRequest = serviceConfig.onLogoutRequest;
	      this.onSignupRequest = serviceConfig.onSignupRequest;
	      this.onProfileRequest = serviceConfig.onProfileRequest;
	      this.onHelpRequest = serviceConfig.onHelpRequest;
	    }
	    this.onLayoutChange = config.onLayoutChange;

	    /** @type {SidebarLayout} */
	    this._layoutState = {
	      expanded: false,
	      width: 0,
	      toolbarWidth: 0
	    };

	    // Initial layout notification
	    this._updateLayoutState(false);
	    this._setupSidebarEvents();
	  }
	  destroy() {
	    var _this$bucketBar, _this$_hammerManager;
	    this._guestRPC.forEach(rpc => rpc.destroy());
	    this._sidebarRPC.destroy();
	    (_this$bucketBar = this.bucketBar) === null || _this$bucketBar === void 0 ? void 0 : _this$bucketBar.destroy();
	    this._listeners.removeAll();
	    (_this$_hammerManager = this._hammerManager) === null || _this$_hammerManager === void 0 ? void 0 : _this$_hammerManager.destroy();
	    if (this.hypothesisSidebar) {
	      this.hypothesisSidebar.remove();
	    } else {
	      this.iframe.remove();
	    }
	    this._emitter.destroy();

	    // Unregister the sidebar iframe as a handler for errors in this frame.
	    sendErrorsTo(null);
	  }

	  /**
	   * Setup communication with a frame that has connected to the host.
	   *
	   * @param {'guest'|'sidebar'} source
	   * @param {MessagePort} port
	   */
	  onFrameConnected(source, port) {
	    switch (source) {
	      case 'guest':
	        this._connectGuest(port);
	        break;
	      case 'sidebar':
	        this._sidebarRPC.connect(port);
	        break;
	    }
	  }

	  /**
	   * @param {MessagePort} port
	   */
	  _connectGuest(port) {
	    /** @type {PortRPC<GuestToHostEvent, HostToGuestEvent>} */
	    const guestRPC = new PortRPC();
	    guestRPC.on('textSelected', () => {
	      this._guestWithSelection = guestRPC;
	      this.toolbar.newAnnotationType = 'annotation';
	      this._guestRPC.filter(port => port !== guestRPC).forEach(rpc => rpc.call('clearSelection'));
	    });
	    guestRPC.on('textUnselected', () => {
	      this._guestWithSelection = null;
	      this.toolbar.newAnnotationType = 'note';
	      this._guestRPC.filter(port => port !== guestRPC).forEach(rpc => rpc.call('clearSelection'));
	    });
	    guestRPC.on('highlightsVisibleChanged', /** @param {boolean} visible */
	    visible => {
	      this.setHighlightsVisible(visible);
	    });

	    // The listener will do nothing if the sidebar doesn't have a bucket bar
	    // (clean theme)
	    const bucketBar = this.bucketBar;
	    // Currently, we ignore `anchorsChanged` for all the guests except the first connected guest.
	    if (bucketBar) {
	      guestRPC.on('anchorsChanged', /** @param {AnchorPosition[]} positions  */
	      positions => {
	        if (this._guestRPC.indexOf(guestRPC) === 0) {
	          bucketBar.update(positions);
	        }
	      });
	    }
	    guestRPC.on('close', () => {
	      guestRPC.destroy();
	      if (guestRPC === this._guestWithSelection) {
	        this._guestWithSelection = null;
	      }
	      this._guestRPC = this._guestRPC.filter(rpc => rpc !== guestRPC);
	    });
	    guestRPC.connect(port);
	    this._guestRPC.push(guestRPC);
	    guestRPC.call('sidebarLayoutChanged', this._layoutState);
	  }
	  _setupSidebarEvents() {
	    annotationCounts(document.body, this._sidebarRPC);
	    sidebarTrigger(document.body, () => this.open());
	    this._sidebarRPC.on('featureFlagsUpdated', /** @param {Record<string, boolean>} flags */flags => this.features.update(flags));
	    this._sidebarRPC.on('connect', () => {
	      // Show the UI
	      if (this.iframeContainer) {
	        this.iframeContainer.style.display = '';
	      }
	      const showHighlights = this._config.showHighlights === 'always';
	      this.setHighlightsVisible(showHighlights);
	      if (this._config.openSidebar || this._config.annotations || this._config.query || this._config.group) {
	        this.open();
	      }
	    });
	    this._sidebarRPC.on('showHighlights', () => this.setHighlightsVisible(true));
	    this._sidebarRPC.on('openSidebar', () => this.open());
	    this._sidebarRPC.on('closeSidebar', () => this.close());

	    // Sidebar listens to the `openNotebook` event coming from the sidebar's
	    // iframe and re-publishes it via the emitter to the Notebook
	    this._sidebarRPC.on('openNotebook', /** @param {string} groupId */
	    groupId => {
	      this.hide();
	      this._emitter.publish('openNotebook', groupId);
	    });
	    this._emitter.subscribe('closeNotebook', () => {
	      this.show();
	    });

	    /** @type {Array<[SidebarToHostEvent, Function|undefined]>} */
	    const eventHandlers = [['loginRequested', this.onLoginRequest], ['logoutRequested', this.onLogoutRequest], ['signupRequested', this.onSignupRequest], ['profileRequested', this.onProfileRequest], ['helpRequested', this.onHelpRequest]];
	    eventHandlers.forEach(([event, handler]) => {
	      if (handler) {
	        this._sidebarRPC.on(event, () => handler());
	      }
	    });
	  }
	  _resetGestureState() {
	    this._gestureState = {
	      initial: null,
	      final: null
	    };
	  }
	  _setupGestures() {
	    const toggleButton = this.toolbar.sidebarToggleButton;
	    if (toggleButton) {
	      this._hammerManager = new hammer$1.exports.Manager(toggleButton);
	      this._hammerManager.on('panstart panend panleft panright', /* istanbul ignore next */
	      event => this._onPan(event));
	      this._hammerManager.add(new hammer$1.exports.Pan({
	        direction: hammer$1.exports.DIRECTION_HORIZONTAL
	      }));
	    }
	  }

	  // Schedule any changes needed to update the sidebar layout.
	  _updateLayout() {
	    // Only schedule one frame at a time.
	    if (this.renderFrame) {
	      return;
	    }

	    // Schedule a frame.
	    this.renderFrame = requestAnimationFrame(() => {
	      this.renderFrame = null;
	      if (this._gestureState.final !== this._gestureState.initial && this.iframeContainer) {
	        const margin = /** @type {number} */this._gestureState.final;
	        const width = -margin;
	        this.iframeContainer.style.marginLeft = `${margin}px`;
	        if (width >= MIN_RESIZE) {
	          this.iframeContainer.style.width = `${width}px`;
	        }
	        this._updateLayoutState();
	      }
	    });
	  }

	  /**
	   * Update the current layout state and notify the embedder if they provided
	   * an `onLayoutChange` callback in the Hypothesis config, as well as guests
	   * so they can enable/adapt side-by-side mode.
	   *
	   * This is called when the sidebar is opened, closed or resized.
	   *
	   * @param {boolean} [expanded] -
	   *   `true` or `false` if the sidebar is being directly opened or closed, as
	   *   opposed to being resized via the sidebar's drag handles
	   */
	  _updateLayoutState(expanded) {
	    var _this$iframeContainer;
	    // The sidebar structure is:
	    //
	    // [ Toolbar    ][                                   ]
	    // [ ---------- ][ Sidebar iframe container (@frame) ]
	    // [ Bucket Bar ][                                   ]
	    //
	    // The sidebar iframe is hidden or shown by adjusting the left margin of
	    // its container.

	    const toolbarWidth = this.iframeContainer && this.toolbar.getWidth() || 0;
	    const frame = /** @type {HTMLElement} */(_this$iframeContainer = this.iframeContainer) !== null && _this$iframeContainer !== void 0 ? _this$iframeContainer : this.externalFrame;
	    const rect = frame.getBoundingClientRect();
	    const computedStyle = window.getComputedStyle(frame);
	    const width = parseInt(computedStyle.width);
	    const leftMargin = parseInt(computedStyle.marginLeft);

	    // The width of the sidebar that is visible on screen, including the
	    // toolbar, which is always visible.
	    let frameVisibleWidth = toolbarWidth;
	    if (typeof expanded === 'boolean') {
	      if (expanded) {
	        frameVisibleWidth += width;
	      }
	    } else {
	      if (leftMargin < MIN_RESIZE) {
	        frameVisibleWidth -= leftMargin;
	      } else {
	        frameVisibleWidth += width;
	      }

	      // Infer expanded state based on whether at least part of the sidebar
	      // frame is visible.
	      expanded = frameVisibleWidth > toolbarWidth;
	    }
	    const layoutState = /** @type {SidebarLayout} */{
	      expanded,
	      width: expanded ? frameVisibleWidth : toolbarWidth,
	      height: rect.height,
	      toolbarWidth
	    };
	    this._layoutState = layoutState;
	    if (this.onLayoutChange) {
	      this.onLayoutChange(layoutState);
	    }
	    this._guestRPC.forEach(rpc => rpc.call('sidebarLayoutChanged', layoutState));
	  }

	  /**
	   *  On window resize events, update the marginLeft of the sidebar by calling hide/show methods.
	   */
	  _onResize() {
	    if (this.toolbar.sidebarOpen === true) {
	      if (window.innerWidth < MIN_RESIZE) {
	        this.close();
	      } else {
	        this.open();
	      }
	    }
	  }

	  /** @param {HammerInput} event */
	  _onPan(event) {
	    const frame = this.iframeContainer;
	    if (!frame) {
	      return;
	    }
	    switch (event.type) {
	      case 'panstart':
	        this._resetGestureState();

	        // Disable animated transition of sidebar position
	        frame.classList.add('sidebar-no-transition');

	        // Disable pointer events on the iframe.
	        frame.style.pointerEvents = 'none';
	        this._gestureState.initial = parseInt(getComputedStyle(frame).marginLeft);
	        break;
	      case 'panend':
	        frame.classList.remove('sidebar-no-transition');

	        // Re-enable pointer events on the iframe.
	        frame.style.pointerEvents = '';

	        // Snap open or closed.
	        if (this._gestureState.final === null || this._gestureState.final <= -MIN_RESIZE) {
	          this.open();
	        } else {
	          this.close();
	        }
	        this._resetGestureState();
	        break;
	      case 'panleft':
	      case 'panright':
	        {
	          if (typeof this._gestureState.initial !== 'number') {
	            return;
	          }
	          const margin = this._gestureState.initial;
	          const delta = event.deltaX;
	          this._gestureState.final = Math.min(Math.round(margin + delta), 0);
	          this._updateLayout();
	          break;
	        }
	    }
	  }
	  open() {
	    this._sidebarRPC.call('sidebarOpened');
	    if (this.iframeContainer) {
	      const width = this.iframeContainer.getBoundingClientRect().width;
	      this.iframeContainer.style.marginLeft = `${-1 * width}px`;
	      this.iframeContainer.classList.remove('sidebar-collapsed');
	    }
	    this.toolbar.sidebarOpen = true;
	    if (this._config.showHighlights === 'whenSidebarOpen') {
	      this.setHighlightsVisible(true);
	    }
	    this._updateLayoutState(true);
	  }
	  close() {
	    if (this.iframeContainer) {
	      this.iframeContainer.style.marginLeft = '';
	      this.iframeContainer.classList.add('sidebar-collapsed');
	    }
	    this.toolbar.sidebarOpen = false;
	    if (this._config.showHighlights === 'whenSidebarOpen') {
	      this.setHighlightsVisible(false);
	    }
	    this._updateLayoutState(false);
	  }

	  /**
	   * Set whether highlights are visible in guest frames.
	   *
	   * @param {boolean} visible
	   */
	  setHighlightsVisible(visible) {
	    this.toolbar.highlightsVisible = visible;

	    // Notify sidebar app of change which will in turn reflect state to guest frames.
	    this._sidebarRPC.call('setHighlightsVisible', visible);
	  }

	  /**
	   * Shows the sidebar's controls
	   */
	  show() {
	    if (this.iframeContainer) {
	      this.iframeContainer.classList.remove('is-hidden');
	    }
	  }

	  /**
	   * Hides the sidebar's controls
	   */
	  hide() {
	    if (this.iframeContainer) {
	      this.iframeContainer.classList.add('is-hidden');
	    }
	  }
	}

	/** @typedef {import('../../types/annotator').Destroyable} Destroyable */

	/**
	 * Emitter is a communication class that implements the publisher/subscriber
	 * pattern. It allows sending and listening events through a shared EventBus.
	 * The different elements of the application can communicate with each other
	 * without being tightly coupled.
	 *
	 * @implements {Destroyable}
	 */
	class Emitter {
	  /**
	   * @param {TinyEmitter} emitter
	   */
	  constructor(emitter) {
	    this._emitter = emitter;

	    /** @type {[event: string, callback: Function][]} */
	    this._subscriptions = [];
	  }

	  /**
	   * Fire an event.
	   *
	   * @param {string} event
	   * @param {unknown[]} args
	   */
	  publish(event, ...args) {
	    this._emitter.emit(event, ...args);
	  }

	  /**
	   * Register an event listener.
	   *
	   * @param {string} event
	   * @param {Function} callback
	   */
	  subscribe(event, callback) {
	    this._emitter.on(event, callback);
	    this._subscriptions.push([event, callback]);
	  }

	  /**
	   * Remove an event listener.
	   *
	   * @param {string} event
	   * @param {Function} callback
	   */
	  unsubscribe(event, callback) {
	    this._emitter.off(event, callback);
	    this._subscriptions = this._subscriptions.filter(([subEvent, subCallback]) => subEvent !== event || subCallback !== callback);
	  }

	  /**
	   * Remove all event listeners.
	   */
	  destroy() {
	    for (let [event, callback] of this._subscriptions) {
	      this._emitter.off(event, callback);
	    }
	    this._subscriptions = [];
	  }
	}
	class EventBus {
	  constructor() {
	    this._emitter = new TinyEmitter();
	  }
	  createEmitter() {
	    return new Emitter(this._emitter);
	  }
	}

	// Load polyfill for :focus-visible pseudo-class.
	registerIcons(annotatorIcons);

	/** @typedef {import('../types/annotator').Destroyable} Destroyable */

	// Look up the URL of the sidebar. This element is added to the page by the
	// boot script before the "annotator" bundle loads.
	const sidebarLinkElement = /** @type {HTMLLinkElement} */
	document.querySelector('link[type="application/annotator+html"][rel="sidebar"]');

	/**
	 * @typedef {import('./components/NotebookModal').NotebookConfig} NotebookConfig
	 * @typedef {import('./guest').GuestConfig} GuestConfig
	 * @typedef {import('./hypothesis-injector').InjectConfig} InjectConfig
	 * @typedef {import('./sidebar').SidebarConfig} SidebarConfig
	 * @typedef {import('./sidebar').SidebarContainerConfig} SidebarContainerConfig
	 */

	/**
	 * Entry point for the part of the Hypothesis client that runs in the page being
	 * annotated.
	 *
	 * Depending on the client configuration in the current frame, this can
	 * initialize different functionality. In "host" frames the sidebar controls and
	 * iframe containing the sidebar application are created. In "guest" frames the
	 * functionality to support anchoring and creating annotations is loaded. An
	 * instance of Hypothesis will have one host frame, one sidebar frame and one or
	 * more guest frames. The most common case is that the host frame, where the
	 * client is initially loaded, is also the only guest frame.
	 */
	function init() {
	  const annotatorConfig = /** @type {GuestConfig & InjectConfig} */
	  getConfig('annotator');
	  const hostFrame = annotatorConfig.subFrameIdentifier ? window.parent : window;

	  /** @type {Destroyable[]} */
	  const destroyables = [];
	  if (hostFrame === window) {
	    // Ensure port "close" notifications from eg. guest frames are delivered properly.
	    const removeWorkaround = installPortCloseWorkaroundForSafari();
	    destroyables.push({
	      destroy: removeWorkaround
	    });
	    const sidebarConfig = /** @type {SidebarConfig} */getConfig('sidebar');
	    const hypothesisAppsOrigin = new URL(sidebarConfig.sidebarAppUrl).origin;
	    const portProvider = new PortProvider(hypothesisAppsOrigin);
	    const eventBus = new EventBus();
	    const sidebar = new Sidebar(document.body, eventBus, sidebarConfig);
	    const notebook = new Notebook(document.body, eventBus, /** @type {NotebookConfig} */getConfig('notebook'));
	    portProvider.on('frameConnected', (source, port) => sidebar.onFrameConnected(source, port));
	    destroyables.push(portProvider, sidebar, notebook);
	  }
	  const vsFrameRole = vitalSourceFrameRole();
	  if (vsFrameRole === 'container') {
	    const vitalSourceInjector = new VitalSourceInjector(annotatorConfig);
	    destroyables.push(vitalSourceInjector);
	  } else {
	    // Set up automatic injection of the client into iframes in this frame.
	    const hypothesisInjector = new HypothesisInjector(document.body, annotatorConfig);
	    // Create the guest that handles creating annotations and displaying highlights.
	    const guest = new Guest(document.body, annotatorConfig, hostFrame);
	    destroyables.push(hypothesisInjector, guest);
	  }
	  sidebarLinkElement.addEventListener('destroy', () => {
	    destroyables.forEach(instance => instance.destroy());

	    // Remove all the `<link>`, `<script>` and `<style>` elements added to the
	    // page by the boot script.
	    const clientAssets = document.querySelectorAll('[data-hypothesis-asset]');
	    clientAssets.forEach(el => el.remove());
	  });
	}

	/**
	 * Returns a Promise that resolves when the document has loaded (but subresources
	 * may still be loading).
	 *
	 * @return {Promise<void>}
	 */
	function documentReady() {
	  return new Promise(resolve => {
	    if (document.readyState !== 'loading') {
	      resolve();
	    }
	    // nb. `readystatechange` may be emitted twice, but `resolve` only resolves
	    // on the first call.
	    document.addEventListener('readystatechange', () => resolve());
	  });
	}
	documentReady().then(init);

})();
//# sourceMappingURL=annotator.bundle.js.map
