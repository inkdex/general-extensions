var source = (function(exports) {

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp$1 = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) {
			__defProp$1(target, name, {
				get: all[name],
				enumerable: true
			});
		}
		if (!no_symbols) {
			__defProp$1(target, Symbol.toStringTag, { value: "Module" });
		}
		return target;
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) {
					__defProp$1(to, key, {
						get: ((k) => from[k]).bind(null, key),
						enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
					});
				}
			}
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp$1(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));

//#endregion

//#region \0@oxc-project+runtime@0.129.0/helpers/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}

//#endregion
//#region \0@oxc-project+runtime@0.129.0/helpers/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}

//#endregion
//#region \0@oxc-project+runtime@0.129.0/helpers/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}

//#endregion
//#region \0@oxc-project+runtime@0.129.0/helpers/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}

//#endregion
//#region node_modules/@paperback/types/lib/impl/SettingsUI/Form.js
	var Form = class {
		constructor() {
			_defineProperty(
				this,
				/**
				* When this is true, the app enables the `Submit` and `Cancel` buttons
				* that call {@link Form.formDidSubmit} and {@link Form.formDidCancel} respectively
				*
				* Notes: updating this after the form appears requires a call to {@link Form.reloadForm}
				*/
				"requiresExplicitSubmission",
				false
			);
		}
		reloadForm() {
			const formId = this["__underlying_formId"];
			if (!formId) return;
			Application.formDidChange(formId);
		}
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/Selector.js
	function closureSelector(base, closureId, closure) {
		base["__closure_selector-" + closureId] = closure;
		return Application.Selector(base, "__closure_selector-" + closureId);
	}

//#endregion
//#region node_modules/@paperback/types/lib/impl/SettingsUI/FormSection.js
	function Section(params, items) {
		let info;
		if (typeof params === "string") info = { id: params };
		else info = params;
		return {
			type: "listSection",
			...info,
			items: items.filter((x) => x),
			allowAddition: false,
			allowDeletion: false,
			allowReorder: false
		};
	}
	function FlowSection(params, items) {
		let info;
		if (typeof params === "string") info = { id: params };
		else info = params;
		return {
			type: "flowSection",
			...info,
			items: items.filter((x) => x)
		};
	}
	function SelectSection(form, params) {
		if (params.maxItemCount < 1) throw new Error(`[${params.id}] maxItemCount must not be less than one`);
		if (params.minItemCount < 0) throw new Error(`[${params.id}] minItemCount must not be less than zero`);
		if (params.minItemCount >= params.maxItemCount && params.maxItemCount > 1) throw new Error(`[${params.id}] minItemCount must be less than maxItemCount, or both must be one`);
		if (params.value.length < params.minItemCount) throw new Error(`[${params.id}] value count must not be less than minItemCount`);
		if (!params.value.every((item) => params.items.some((option) => option.id === item))) throw new Error(`[${params.id}] All provided values must be inside items`);
		const selectedOptionsLength = Object.keys(params.value).length;
		return (params.layout == "flow" ? FlowSection : Section)({
			id: params.id,
			header: params.header,
			footer: params.footer
		}, params.items.map((item) => {
			const selectedIndex = params.value.indexOf(item.id);
			const isSelected = selectedIndex !== -1;
			return LabelRow(item.id, {
				title: item.title,
				value: isSelected ? {
					symbol: "checkmark",
					style: "success"
				} : void 0,
				onSelect: closureSelector(form, `__select_${params.id}#${item.id}`, async () => {
					if (isSelected) {
						if (selectedOptionsLength > params.minItemCount) params.value.splice(selectedIndex, 1);
					} else if (params.maxItemCount == 1) params.value.splice(0, params.value.length, item.id);
					else if (selectedOptionsLength < params.maxItemCount) params.value.push(item.id);
					else return;
					if (params.onValueChange) await Application.SelectorRegistry.selector(params.onValueChange)();
					form.reloadForm();
				})
			});
		}));
	}
	function TriStateSelectSection(form, params) {
		const selectedOptionsLength = Object.keys(params.value).length;
		return (params.layout == "flow" ? FlowSection : Section)({
			id: params.id,
			header: params.header,
			footer: params.footer
		}, params.items.map((item) => {
			const currentState = params.value[item.id];
			let value;
			let style;
			switch (currentState) {
				case "included":
					if (params.layout == "flow") {
						style = "success";
						value = void 0;
					} else {
						style = void 0;
						value = {
							symbol: "checkmark",
							style: "success"
						};
					}
					break;
				case "excluded":
					if (params.layout == "flow") {
						style = "error";
						value = void 0;
					} else {
						style = void 0;
						value = {
							symbol: "xmark",
							style: "error"
						};
					}
					break;
				default:
					value = void 0;
					style = void 0;
					break;
			}
			return LabelRow(item.id, {
				style,
				title: item.title,
				value,
				onSelect: closureSelector(form, `__multiselect_${params.id}#${item.id}`, async () => {
					let nextState;
					const canSelect = !params.maximum || selectedOptionsLength < params.maximum;
					const canDeselect = params.allowEmptySelection && selectedOptionsLength == 1 || selectedOptionsLength > 1;
					switch (currentState) {
						case "included":
							if (params.allowExclusion) {
								nextState = "excluded";
								break;
							}
							if (canDeselect) {
								nextState = void 0;
								break;
							} else return;
						case "excluded": if (canDeselect) {
							nextState = void 0;
							break;
						} else return;
						case void 0: if (canSelect) {
							nextState = "included";
							break;
						} else return;
					}
					if (nextState == void 0) delete params.value[item.id];
					else params.value[item.id] = nextState;
					if (params.onValueChange) await Application.SelectorRegistry.selector(params.onValueChange)();
					form.reloadForm();
				})
			});
		}));
	}

//#endregion
//#region node_modules/@paperback/types/lib/impl/SettingsUI/FormItemElement.js
	function LabelRow(id, props) {
		return {
			...props,
			id,
			type: "labelRow",
			isHidden: props.isHidden ?? false,
			isSelectable: props.onSelect != void 0
		};
	}
	function InputRow(id, props) {
		return {
			...props,
			id,
			type: "inputRow",
			isHidden: props.isHidden ?? false
		};
	}
	function TriStateSelectRow(id, props) {
		return NavigationRow(id, {
			form: new TriStateSelectForm(props.title, props),
			title: props.title,
			subtitle: props.subtitle,
			value: `${Object.keys(props.value).length} items`,
			isHidden: props.isHidden
		});
	}
	function NavigationRow(id, props) {
		return {
			...props,
			id,
			type: "navigationRow",
			isHidden: props.isHidden ?? false
		};
	}
	var TriStateSelectForm = class extends Form {
		constructor(title, params) {
			super();
			_defineProperty(this, "title", void 0);
			_defineProperty(this, "params", void 0);
			_defineProperty(this, "states", {});
			_defineProperty(this, "requiresExplicitSubmission", true);
			this.title = title;
			this.params = params;
			this.states = { ...params.value };
		}
		getSections() {
			return [TriStateSelectSection(this, {
				id: "multiselect",
				value: this.states,
				items: this.params.items,
				allowExclusion: this.params.allowExclusion,
				allowEmptySelection: this.params.allowEmptySelection,
				maximum: this.params.maximum,
				layout: this.params.layout
			})];
		}
		async formDidSubmit() {
			await Application.SelectorRegistry.selector(this.params.onValueChange)(this.states);
		}
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/interfaces/ChapterProviding.js
	function implementsChapterProviding(extension) {
		return hasPropertiesOf(["getChapters", "getMangaDetails"], extension);
	}

//#endregion
//#region node_modules/@paperback/types/lib/impl/interfaces/SearchResultsProviding.js
	function implementsSearchResultsProviding(extension) {
		return hasPropertiesOf(["getSearchResults"], extension);
	}
	var AdvancedSearchForm = class extends Form {
		constructor(..._args) {
			super(..._args);
			_defineProperty(
				this,
				/**
				* This is always true
				*/
				"requiresExplicitSubmission",
				true
			);
		}
		async formDidSubmit() {}
		formDidCancel() {}
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/interfaces/index.js
	function hasPropertiesOf(properties, obj) {
		return properties.every((k) => k in obj);
	}

//#endregion
//#region node_modules/@paperback/types/lib/impl/PaperbackInterceptor.js
	var PaperbackInterceptor = class {
		constructor(id) {
			_defineProperty(this, "id", void 0);
			this.id = id;
		}
		registerInterceptor() {
			Application.registerInterceptor(this.id, Application.Selector(this, "interceptRequest"), Application.Selector(this, "interceptResponse"));
		}
		unregisterInterceptor() {
			Application.unregisterInterceptor(this.id);
		}
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/Lock.js
	const promises = {}, resolvers = {};
	const lock = async (uid) => {
		if (promises[uid]) {
			await promises[uid];
			await lock(uid);
			return;
		}
		promises[uid] = new Promise((resolve) => resolvers[uid] = () => {
			delete promises[uid];
			resolve();
		});
	};
	const unlock = (uid) => {
		if (resolvers[uid]) resolvers[uid]();
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/BasicRateLimiter.js
	var BasicRateLimiter = class extends PaperbackInterceptor {
		constructor(id, options) {
			super(id);
			_defineProperty(this, "options", void 0);
			_defineProperty(this, "promise", void 0);
			_defineProperty(this, "currentRequestsMade", 0);
			_defineProperty(this, "lastReset", Date.now());
			_defineProperty(this, "imageRegex", /* @__PURE__ */ new RegExp(/\.(avif|gif|jpeg|jpg|jxl|png|webp)(\?|$)/i));
			this.options = options;
		}
		async interceptRequest(request) {
			if (this.options.ignoreImages && this.imageRegex.test(request.url)) return request;
			await lock(this.id);
			await this.incrementRequestCount();
			unlock(this.id);
			return request;
		}
		async interceptResponse(request, response, data) {
			return data;
		}
		async incrementRequestCount() {
			await this.promise;
			if ((Date.now() - this.lastReset) / 1e3 > this.options.bufferInterval) {
				this.currentRequestsMade = 0;
				this.lastReset = Date.now();
			}
			this.currentRequestsMade += 1;
			if (this.currentRequestsMade >= this.options.numberOfRequests) {
				const secondsSinceLastReset = (Date.now() - this.lastReset) / 1e3;
				if (secondsSinceLastReset <= this.options.bufferInterval) {
					const sleepTime = this.options.bufferInterval - secondsSinceLastReset;
					console.log(`[BasicRateLimiter] rate limit hit, sleeping for ${sleepTime}`);
					this.promise = Application.sleep(sleepTime);
				}
			}
		}
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/CloudflareError.js
/**
	* The app catches this request and displays a banner at the top that initiates cloudflare bypass
	*
	* NOTE: You must have {@link SourceIntents.CLOUDFLARE_BYPASS_PROVIDING} for this to work
	*/
	var CloudflareError = class extends Error {
		constructor(resolutionRequest, message = "Cloudflare bypass is required") {
			super(message);
			_defineProperty(this, "resolutionRequest", void 0);
			_defineProperty(this, "type", "cloudflareError");
			this.resolutionRequest = resolutionRequest;
		}
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/URL.js
/**
	* Internal method to parse a URL string and update the current components.
	*
	* @param url - The URL string to parse.
	* @param partial - If true, only update components present in the input.
	*/
	function parseURL(url) {
		const components = {};
		const match = url.match(/^(?:([a-zA-Z][a-zA-Z\d+\-.]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/);
		if (!match) throw new Error("Invalid URL string provided.");
		if (match[1] !== void 0 && match[1] !== "") components.protocol = match[1];
		if (match[2] !== void 0 && match[2] !== "") {
			const authority = match[2];
			let userInfo = "";
			let hostPort = "";
			const atIndex = authority.indexOf("@");
			if (atIndex !== -1) {
				userInfo = authority.substring(0, atIndex);
				hostPort = authority.substring(atIndex + 1);
				if (userInfo !== "") {
					const colonIndex = userInfo.indexOf(":");
					if (colonIndex !== -1) {
						components.username = userInfo.substring(0, colonIndex);
						components.password = userInfo.substring(colonIndex + 1);
					} else {
						components.username = userInfo;
						components.password = "";
					}
				}
			} else hostPort = authority;
			if (hostPort !== "") if (hostPort.startsWith("[")) {
				const closingBracketIndex = hostPort.indexOf("]");
				if (closingBracketIndex === -1) throw new Error("Invalid IPv6 address in URL update.");
				components.hostname = hostPort.substring(0, closingBracketIndex + 1);
				const portPart = hostPort.substring(closingBracketIndex + 1);
				if (portPart.startsWith(":")) components.port = portPart.substring(1);
			} else {
				const colonIndex = hostPort.lastIndexOf(":");
				if (colonIndex !== -1 && hostPort.indexOf(":") === colonIndex) {
					components.hostname = hostPort.substring(0, colonIndex);
					components.port = hostPort.substring(colonIndex + 1);
				} else {
					components.hostname = hostPort;
					components.port = "";
				}
			}
		}
		if (match[3] !== void 0 && match[3] !== "") components.path = match[3].startsWith("/") ? match[3] : `/${match[3]}`;
		if (match[4] !== void 0) {
			const query = {};
			const pairs = match[4].split("&");
			for (const pair of pairs) {
				if (!pair) continue;
				const [rawKey, rawValue = ""] = pair.split("=");
				if (rawKey === void 0) continue;
				const key = decodeURIComponent(rawKey);
				const value = decodeURIComponent(rawValue);
				if (key in query) {
					const existing = query[key];
					if (Array.isArray(existing)) existing.push(value);
					else query[key] = [existing, value];
				} else query[key] = value;
			}
			components.queryItems = query;
		}
		if (match[5] !== void 0) components.fragment = match[5];
		return components;
	}
	/**
	* A class for parsing, updating, and building URLs.
	*
	* The class does not use the built‑in URL class or named regex capture groups.
	*/
	var URL$1 = class {
		/**
		* Creates a new SimpleURL instance.
		* @param url - (Optional) A URL string to initialize the instance.
		*/
		constructor(url) {
			_defineProperty(this, "protocol", void 0);
			_defineProperty(this, "hostname", void 0);
			_defineProperty(this, "path", void 0);
			_defineProperty(this, "username", void 0);
			_defineProperty(this, "password", void 0);
			_defineProperty(this, "port", void 0);
			_defineProperty(this, "queryItems", void 0);
			_defineProperty(this, "fragment", void 0);
			const components = parseURL(url);
			if (!components.hostname || !components.protocol) throw new Error("URL Hostname and Protocol are required");
			this.hostname = components.hostname;
			this.protocol = components.protocol;
			this.path = components.path ?? "";
			this.username = components.username;
			this.password = components.password;
			this.port = components.port;
			this.queryItems = components.queryItems;
			this.fragment = components.fragment;
		}
		/**
		* Returns the full URL string built from the current components.
		*/
		toString() {
			let url = `${this.protocol}://`;
			if (this.username !== void 0 && this.username !== "") {
				url += this.username;
				if (this.password !== void 0 && this.password !== "") url += `:${this.password}`;
				url += "@";
			}
			url += this.hostname;
			if (this.port !== void 0 && this.port !== "") url += `:${this.port}`;
			if (this.path !== "") url += this.path.startsWith("/") ? this.path : `/${this.path}`;
			if (this.queryItems !== void 0) {
				const queryKeys = Object.keys(this.queryItems);
				const params = [];
				if (queryKeys.length > 0) for (const key of queryKeys) {
					const value = this.queryItems[key];
					if (Array.isArray(value)) for (const v of value) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
					else if (value !== void 0) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
				}
				url += `?${params.join("&")}`;
			}
			if (this.fragment !== void 0) url += `#${this.fragment}`;
			return url;
		}
		/**
		* Convenience method to update the protocol.
		*/
		setProtocol(newProtocol) {
			if (newProtocol === "") throw new Error("Protocol is required");
			this.protocol = newProtocol;
			return this;
		}
		/**
		* Convenience method to update the username.
		*/
		setUsername(newUsername) {
			if (newUsername === "") this.username = void 0;
			else this.username = newUsername;
			return this;
		}
		/**
		* Convenience method to update the password.
		*/
		setPassword(newPassword) {
			if (newPassword === "") this.password = void 0;
			else this.password = newPassword;
			return this;
		}
		/**
		* Convenience method to update the hostname.
		*/
		setHostname(newHostname) {
			if (newHostname === "") throw new Error("Hostname is required");
			this.hostname = newHostname;
			return this;
		}
		/**
		* Convenience method to update the port.
		*/
		setPort(newPort) {
			if (newPort === "") this.port = void 0;
			else this.port = newPort;
			return this;
		}
		/**
		* Convenience method to update the pathname.
		*/
		setPath(newPathname) {
			this.path = newPathname.startsWith("/") ? newPathname : `/${newPathname}`;
			return this;
		}
		addPathComponent(component) {
			this.path = (this.path ?? "") + (component.startsWith("/") ? component : `/${component}`);
			return this;
		}
		/**
		* Replace the entire query object.
		*/
		setQueryItems(newQuery) {
			this.queryItems = newQuery;
			return this;
		}
		/**
		* Update or add a single query parameter.
		*/
		setQueryItem(key, value) {
			if (this.queryItems === void 0) this.queryItems = {};
			this.queryItems[key] = value;
			return this;
		}
		/**
		* Remove a query parameter.
		*/
		removeQueryItem(key) {
			delete this.queryItems?.[key];
			return this;
		}
		/**
		* Convenience method to update the hash (fragment).
		*/
		setFragment(newHash) {
			this.fragment = newHash;
			return this;
		}
		/**
		* Update the current URL components.
		*
		* Accepts either:
		* - A URL string, which may be a full URL (e.g., "https://example.com/path?foo=bar")
		*   or a partial URL (e.g., "/new/path?foo=bar#section"). In this case, only the components
		*   present in the string will be updated.
		* - A partial UrlComponents object.
		*
		* @param input - A URL string or a partial UrlComponents object.
		*/
		update(input) {
			let components;
			if (typeof input === "string") components = parseURL(input);
			else components = input;
			if (components.protocol !== void 0) this.setProtocol(components.protocol);
			if (components.username !== void 0) this.setUsername(components.username);
			if (components.password !== void 0) this.setPassword(components.password);
			if (components.hostname !== void 0) this.setHostname(components.hostname);
			if (components.port !== void 0) this.setPort(components.port);
			if (components.path !== void 0) this.setPath(components.path);
			if (components.queryItems !== void 0) this.setQueryItems(components.queryItems);
			if (components.fragment !== void 0) this.setFragment(components.fragment);
			return this;
		}
	};

//#endregion
//#region node_modules/@paperback/types/lib/impl/CookieStorageInterceptor.js
	const cookieStateKey = "cookie_store_cookies";
	var CookieStorageInterceptor = class extends PaperbackInterceptor {
		get cookies() {
			return Object.freeze(Object.values(this._cookies));
		}
		set cookies(newValue) {
			const cookies = {};
			for (const cookie of newValue) {
				if (this.isCookieExpired(cookie)) continue;
				cookies[this.cookieIdentifier(cookie)] = cookie;
			}
			this._cookies = cookies;
			this.saveCookiesToStorage();
		}
		constructor(options) {
			super("cookie_store");
			_defineProperty(this, "options", void 0);
			_defineProperty(this, "_cookies", {});
			this.options = options;
			this.loadCookiesFromStorage();
		}
		async interceptRequest(request) {
			request.cookies = {
				...request.cookies ?? {},
				...this.cookiesForUrl(request.url).reduce((v, c) => {
					v[c.name] = c.value;
					return v;
				}, {})
			};
			return request;
		}
		async interceptResponse(request, response, data) {
			const cookies = this._cookies;
			for (const cookie of response.cookies) {
				const identifier = this.cookieIdentifier(cookie);
				if (this.isCookieExpired(cookie)) {
					delete cookies[identifier];
					continue;
				}
				cookies[identifier] = cookie;
			}
			this._cookies = cookies;
			this.saveCookiesToStorage();
			return data;
		}
		setCookie(cookie) {
			if (this.isCookieExpired(cookie)) return;
			this._cookies[this.cookieIdentifier(cookie)] = cookie;
			this.saveCookiesToStorage();
		}
		deleteCookie(cookie) {
			delete this._cookies[this.cookieIdentifier(cookie)];
		}
		cookiesForUrl(urlString) {
			const url = new URL$1(urlString);
			const hostname = url.hostname;
			if (!hostname) return [];
			const matchedCookies = {};
			const pathname = url.path.startsWith("/") ? url.path : `/${url.path}`;
			const splitHostname = hostname.split(".");
			const splitUrlPath = pathname.split("/");
			splitUrlPath.shift();
			const cookies = this.cookies;
			for (const cookie of cookies) {
				if (this.isCookieExpired(cookie)) {
					delete this._cookies[this.cookieIdentifier(cookie)];
					continue;
				}
				const splitCookieDomain = this.cookieSanitizedDomain(cookie).split(".");
				if (splitHostname.length < splitCookieDomain.length || splitCookieDomain.length == 0) continue;
				let cookieDomainMatches = true;
				for (let i = 0; i < splitCookieDomain.length; i++) {
					const splitCookieIndex = splitCookieDomain.length - 1 - i;
					const splitHostnameIndex = splitHostname.length - 1 - i;
					if (splitCookieDomain[splitCookieIndex] != splitHostname[splitHostnameIndex]) {
						cookieDomainMatches = false;
						break;
					}
				}
				if (!cookieDomainMatches) continue;
				const cookiePath = this.cookieSanitizedPath(cookie);
				const splitCookiePath = cookiePath.split("/");
				splitCookiePath.shift();
				let pathMatches = 0;
				if (pathname === cookiePath) pathMatches = Number.MAX_SAFE_INTEGER;
				else if (splitCookiePath.length === 0 || cookiePath === "/") pathMatches = 1;
				else if (pathname.startsWith(cookiePath) && splitUrlPath.length >= splitCookiePath.length) for (let i = 0; i < splitCookiePath.length; i++) if (splitCookiePath[i] === splitUrlPath[i]) pathMatches += 1;
				else break;
				if (pathMatches <= 0) continue;
				if ((matchedCookies[cookie.name]?.pathMatches ?? 0) < pathMatches) matchedCookies[cookie.name] = {
					cookie,
					pathMatches
				};
			}
			return Object.values(matchedCookies).map((x) => x.cookie);
		}
		cookieIdentifier(cookie) {
			return `${cookie.name}-${this.cookieSanitizedDomain(cookie)}-${this.cookieSanitizedPath(cookie)}`;
		}
		cookieSanitizedPath(cookie) {
			return cookie.path?.startsWith("/") ? cookie.path : "/" + (cookie.path ?? "");
		}
		cookieSanitizedDomain(cookie) {
			return cookie.domain.replace(/^(www)?\.?/gi, "").toLowerCase();
		}
		isCookieExpired(cookie) {
			if (cookie.expires && cookie.expires.getTime() <= Date.now()) return true;
			else return false;
		}
		loadCookiesFromStorage() {
			if (this.options.storage == "memory") return;
			const cookieData = Application.getState(cookieStateKey);
			if (!cookieData) {
				this._cookies = {};
				return;
			}
			const cookies = {};
			for (const cookie of cookieData) {
				if (!cookie.expires || this.isCookieExpired(cookie)) continue;
				cookies[this.cookieIdentifier(cookie)] = cookie;
			}
			this._cookies = cookies;
		}
		saveCookiesToStorage() {
			if (this.options.storage == "memory") return;
			Application.setState(this.cookies.filter((x) => x.expires), cookieStateKey);
		}
	};
	/**
	*
	*  Test cases for testing cookies are behaving as expected
	*
	
	function assert(a: boolean, msg: string) {
	if(!a) {
	throw msg
	}
	}
	
	(function runTests() {
	const cookieStorage = new CookieStorageInterceptor();
	const now = Date.now();
	
	// Test 1: Basic set and retrieval
	const cookie1: Cookie = {
	name: "sessionId",
	value: "abc123",
	domain: "example.com",
	path: "/",
	expires: new Date(now + 10000) // expires in 10 seconds
	};
	cookieStorage.setCookie(cookie1);
	let cookies = cookieStorage.cookiesForUrl("http://example.com/");
	assert(cookies.length === 1, "Should retrieve one cookie for example.com root");
	
	// Test 2: Domain matching with subdomain (RFC 6265: domain-match)
	const cookie2: Cookie = {
	name: "user",
	value: "john",
	domain: "example.com",
	path: "/",
	expires: new Date(now + 10000)
	};
	cookieStorage.setCookie(cookie2);
	cookies = cookieStorage.cookiesForUrl("http://www.example.com/");
	assert(
	cookies.some(c => c.name === "user"),
	"Cookie with domain example.com should match www.example.com"
	);
	
	// Test 3: Path matching
	const cookie3: Cookie = {
	name: "pref",
	value: "dark",
	domain: "example.com",
	path: "/docs",
	expires: new Date(now + 10000)
	};
	cookieStorage.setCookie(cookie3);
	cookies = cookieStorage.cookiesForUrl("http://example.com/docs/index.html");
	assert(
	cookies.some(c => c.name === "pref"),
	"Cookie with path /docs should match /docs/index.html"
	);
	cookies = cookieStorage.cookiesForUrl("http://example.com/about");
	assert(
	!cookies.some(c => c.name === "pref"),
	"Cookie with path /docs should not match /about"
	);
	
	// Test 4: Expired cookie should not be stored or returned
	const cookie4: Cookie = {
	name: "expired",
	value: "old",
	domain: "example.com",
	path: "/",
	expires: new Date(now - 10000) // expired 10 seconds ago
	};
	cookieStorage.setCookie(cookie4);
	cookies = cookieStorage.cookiesForUrl("http://example.com/");
	assert(
	!cookies.some(c => c.name === "expired"),
	"Expired cookie should not be returned"
	);
	
	// Test 5: Cookie overwriting based on path specificity
	// Cookie with name "id" and path "/" (less specific)
	const cookieA: Cookie = {
	name: "id",
	value: "A",
	domain: "example.com",
	path: "/",
	expires: new Date(now + 10000)
	};
	// Cookie with the same name but a more specific path "/docs"
	const cookieB: Cookie = {
	name: "id",
	value: "B",
	domain: "example.com",
	path: "/docs",
	expires: new Date(now + 10000)
	};
	cookieStorage.setCookie(cookieA);
	cookieStorage.setCookie(cookieB);
	cookies = cookieStorage.cookiesForUrl("http://example.com/docs");
	const cookieId = cookies.find(c => c.name === "id");
	assert(
	cookieId?.value === "B",
	"More specific cookie should be returned for URL /docs"
	);
	
	// Test 6: Deleting a cookie
	cookieStorage.deleteCookie(cookieB);
	cookies = cookieStorage.cookiesForUrl("http://example.com/docs");
	const cookieIdAfterDelete = cookies.find(c => c.name === "id");
	assert(
	cookieIdAfterDelete?.value === "A",
	"After deletion of the specific cookie, the less specific cookie should be returned"
	);
	
	// Test 7: Using the cookies setter (expired cookies filtered out)
	cookieStorage.cookies = [cookie1, cookie4]; // cookie4 is expired
	const storedCookies = cookieStorage.cookies;
	assert(
	storedCookies.some(c => c.name === "sessionId"),
	"sessionId cookie should be stored via setter"
	);
	assert(
	!storedCookies.some(c => c.name === "expired"),
	"Expired cookie should be filtered out in the setter"
	);
	
	console.log("All tests passed successfully.");
	})();
	*/

//#endregion
//#region node_modules/@paperback/types/lib/impl/SourceInfo.js
	var SourceIntents$1;
	(function(SourceIntents) {
		SourceIntents[SourceIntents["NONE"] = 0] = "NONE";
		/**
		* @deprecated use {@link CHAPTER_PROVIDING}
		*/
		SourceIntents[SourceIntents["MANGA_CHAPTERS"] = 1] = "MANGA_CHAPTERS";
		SourceIntents[SourceIntents["CHAPTER_PROVIDING"] = 1] = "CHAPTER_PROVIDING";
		/**
		* @deprecated use {@link PROGRESS_PROVIDING}
		*/
		SourceIntents[SourceIntents["MANGA_PROGRESS"] = 2] = "MANGA_PROGRESS";
		/**
		* @deprecated use {@link PROGRESS_PROVIDING}
		*/
		SourceIntents[SourceIntents["MANGA_PROGRESS_PROVIDING"] = 2] = "MANGA_PROGRESS_PROVIDING";
		SourceIntents[SourceIntents["PROGRESS_PROVIDING"] = 2] = "PROGRESS_PROVIDING";
		/**
		* @deprecated use {@link DISCOVER_SECTION_PROVIDING}
		*/
		SourceIntents[SourceIntents["DISCOVER_SECIONS"] = 4] = "DISCOVER_SECIONS";
		/**
		* @deprecated use {@link DISCOVER_SECTION_PROVIDING}
		*/
		SourceIntents[SourceIntents["DISCOVER_SECIONS_PROVIDING"] = 4] = "DISCOVER_SECIONS_PROVIDING";
		SourceIntents[SourceIntents["DISCOVER_SECTION_PROVIDING"] = 4] = "DISCOVER_SECTION_PROVIDING";
		/**
		* @deprecated use {@link MANAGED_COLLECTION_PROVIDING}
		*/
		SourceIntents[SourceIntents["COLLECTION_MANAGEMENT"] = 8] = "COLLECTION_MANAGEMENT";
		SourceIntents[SourceIntents["MANAGED_COLLECTION_PROVIDING"] = 8] = "MANAGED_COLLECTION_PROVIDING";
		/**
		* @deprecated use {@link CLOUDFLARE_BYPASS_PROVIDING}
		*/
		SourceIntents[SourceIntents["CLOUDFLARE_BYPASS_REQUIRED"] = 16] = "CLOUDFLARE_BYPASS_REQUIRED";
		SourceIntents[SourceIntents["CLOUDFLARE_BYPASS_PROVIDING"] = 16] = "CLOUDFLARE_BYPASS_PROVIDING";
		/**
		* @deprecated use {@link SETTINGS_FORM_PROVIDING}
		*/
		SourceIntents[SourceIntents["SETTINGS_UI"] = 32] = "SETTINGS_UI";
		SourceIntents[SourceIntents["SETTINGS_FORM_PROVIDING"] = 32] = "SETTINGS_FORM_PROVIDING";
		/**
		* @deprecated use {@link SEARCH_RESULT_PROVIDING}
		*/
		SourceIntents[SourceIntents["MANGA_SEARCH"] = 64] = "MANGA_SEARCH";
		/**
		* @deprecated use {@link SEARCH_RESULT_PROVIDING}
		*/
		SourceIntents[SourceIntents["SEARCH_RESULTS_PROVIDING"] = 64] = "SEARCH_RESULTS_PROVIDING";
		SourceIntents[SourceIntents["SEARCH_RESULT_PROVIDING"] = 64] = "SEARCH_RESULT_PROVIDING";
	})(SourceIntents$1 || (SourceIntents$1 = {}));
	/**
	* A content rating to be attributed to each source.
	*/
	var ContentRating$1;
	(function(ContentRating) {
		ContentRating["EVERYONE"] = "SAFE";
		ContentRating["MATURE"] = "MATURE";
		ContentRating["ADULT"] = "ADULT";
	})(ContentRating$1 || (ContentRating$1 = {}));

//#endregion
//#region node_modules/@paperback/types/lib/DiscoverSectionType.js
	var DiscoverSectionType;
	(function(DiscoverSectionType) {
		DiscoverSectionType[DiscoverSectionType["featured"] = 0] = "featured";
		DiscoverSectionType[DiscoverSectionType["simpleCarousel"] = 1] = "simpleCarousel";
		DiscoverSectionType[DiscoverSectionType["prominentCarousel"] = 2] = "prominentCarousel";
		DiscoverSectionType[DiscoverSectionType["chapterUpdates"] = 3] = "chapterUpdates";
		DiscoverSectionType[DiscoverSectionType["genres"] = 4] = "genres";
	})(DiscoverSectionType || (DiscoverSectionType = {}));

//#endregion
//#region node_modules/@paperback/types/lib/PagedResults.js
	const EndOfPageResults = Object.freeze({
		items: [],
		metadata: void 0
	});

//#endregion
//#region node_modules/@paperback/types/lib/compat/0.8/types.js
	var HomeSectionType;
	(function(HomeSectionType) {
		HomeSectionType["singleRowNormal"] = "singleRowNormal";
		HomeSectionType["singleRowLarge"] = "singleRowLarge";
		HomeSectionType["doubleRow"] = "doubleRow";
		HomeSectionType["featured"] = "featured";
	})(HomeSectionType || (HomeSectionType = {}));
	var SourceIntents;
	(function(SourceIntents) {
		SourceIntents[SourceIntents["MANGA_CHAPTERS"] = 1] = "MANGA_CHAPTERS";
		SourceIntents[SourceIntents["MANGA_TRACKING"] = 2] = "MANGA_TRACKING";
		SourceIntents[SourceIntents["HOMEPAGE_SECTIONS"] = 4] = "HOMEPAGE_SECTIONS";
		SourceIntents[SourceIntents["COLLECTION_MANAGEMENT"] = 8] = "COLLECTION_MANAGEMENT";
		SourceIntents[SourceIntents["CLOUDFLARE_BYPASS_REQUIRED"] = 16] = "CLOUDFLARE_BYPASS_REQUIRED";
		SourceIntents[SourceIntents["SETTINGS_UI"] = 32] = "SETTINGS_UI";
	})(SourceIntents || (SourceIntents = {}));
	/**
	* A content rating to be attributed to each source.
	*/
	var ContentRating;
	(function(ContentRating) {
		ContentRating["EVERYONE"] = "EVERYONE";
		ContentRating["MATURE"] = "MATURE";
		ContentRating["ADULT"] = "ADULT";
	})(ContentRating || (ContentRating = {}));
	var BadgeColor;
	(function(BadgeColor) {
		BadgeColor["BLUE"] = "default";
		BadgeColor["GREEN"] = "success";
		BadgeColor["GREY"] = "info";
		BadgeColor["YELLOW"] = "warning";
		BadgeColor["RED"] = "danger";
	})(BadgeColor || (BadgeColor = {}));
	const AppCompat = {};
	AppCompat.createSourceStateManager = function() {
		return {
			keychain: {
				async store(key, value) {
					Application.setSecureState(value, key);
				},
				async retrieve(key) {
					return Application.getSecureState(key);
				}
			},
			async store(key, value) {
				Application.setState(value, key);
			},
			async retrieve(key) {
				return Application.getState(key);
			}
		};
	};
	function convert08RequestTo09Request(request) {
		let url = request.url;
		if (request.param) url += request.param;
		const cookies = {};
		for (const cookie of request.cookies ?? []) cookies[cookie.name] = cookie.value;
		return {
			url,
			method: request.method,
			body: request.data,
			headers: request.headers,
			cookies
		};
	}
	function convert09RequestTo08Request(request) {
		return {
			url: request.url,
			method: request.method,
			headers: request.headers ?? {},
			cookies: Object.keys(request.cookies ?? {}).map((x) => ({
				name: x,
				value: request.cookies[x],
				domain: ""
			})),
			data: request.body
		};
	}
	AppCompat.createRequestManager = function(info) {
		const interceptor = new class extends PaperbackInterceptor {
			constructor(legacyInterceptor) {
				super("main");
				_defineProperty(this, "legacyInterceptor", void 0);
				this.legacyInterceptor = legacyInterceptor;
			}
			async interceptRequest(request) {
				if (!this.legacyInterceptor) return request;
				const oldRequest = convert09RequestTo08Request(request);
				return convert08RequestTo09Request(await this.legacyInterceptor.interceptRequest(oldRequest));
			}
			async interceptResponse(request, response, data) {
				if (!this.legacyInterceptor) return data;
				return data;
			}
		}(info.interceptor);
		const rateLimiter = new BasicRateLimiter("rateLimit", {
			numberOfRequests: info.requestsPerSecond ?? 2,
			bufferInterval: 1,
			ignoreImages: true
		});
		const cookieStore = new CookieStorageInterceptor({ storage: "memory" });
		interceptor.registerInterceptor();
		rateLimiter.registerInterceptor();
		cookieStore.registerInterceptor();
		return {
			__backing_interceptor: interceptor,
			__backing_rateLimit: rateLimiter,
			__backing_cookieStore: cookieStore,
			interceptor: info.interceptor,
			cookieStore: {
				getAllCookies() {
					return cookieStore.cookies;
				},
				addCookie(cookies) {
					cookieStore.setCookie(cookies);
				},
				removeCookie(cookie) {
					cookieStore.deleteCookie(cookie);
				}
			},
			async getDefaultUserAgent() {
				return Application.getDefaultUserAgent();
			},
			requestsPerSecond: info.requestsPerSecond ?? 2,
			requestTimeout: info.requestTimeout ?? 3e4,
			async schedule(request) {
				const finalRequest = convert08RequestTo09Request(request);
				console.log("[COMPAT] SCHEDULING REQUEST TO " + finalRequest.url);
				const [response, data] = await Application.scheduleRequest(finalRequest);
				return {
					request,
					headers: response.headers,
					status: response.status,
					data: Application.arrayBufferToUTF8String(data),
					get rawData() {
						return new Uint8Array(data);
					}
				};
			}
		};
	};
	globalThis.App = new Proxy(AppCompat, { get(target, p) {
		if (target[p]) return target[p];
		if (typeof p === "string" && p.startsWith("create")) {
			if (p.startsWith("createDUI")) {
				const type = p.slice(6);
				return (anyProps) => {
					return Object.defineProperty(anyProps, "type", {
						enumerable: true,
						value: type
					});
				};
			}
			return (anyProps) => anyProps;
		}
	} });

//#endregion
//#region node_modules/@paperback/types/lib/compat/0.8/searchFilters.js
	var SearchFilterForm = class extends AdvancedSearchForm {
		constructor(values, filters) {
			super();
			_defineProperty(this, "filters", void 0);
			_defineProperty(this, "selectedFilterValues", void 0);
			this.selectedFilterValues = {};
			for (const value of values ?? []) this.selectedFilterValues[value.id] = value.value;
			if (filters instanceof Promise) {
				this.filters = void 0;
				filters.then((filters) => this.filters = filters).catch((error) => this.filters = error).finally(() => this.reloadForm());
			} else this.filters = filters;
		}
		getSections() {
			if (!this.filters) return [Section("loading", [LabelRow("loading", { title: "Loading Filters" })])];
			else if (this.filters instanceof Error) return [Section("error", [LabelRow("error", {
				title: "Error loading search filters",
				subtitle: this.filters.message
			})])];
			else return this.filters.map((filter) => {
				switch (filter.type) {
					case "dropdown": {
						const selectedOptionId = [this.selectedFilterValues[filter.id] ?? filter.value];
						return SelectSection(this, {
							id: filter.id,
							header: filter.title,
							value: selectedOptionId,
							onValueChange: closureSelector(this, filter.id, async () => {
								this.selectedFilterValues[filter.id] = selectedOptionId[0];
							}),
							layout: "list",
							items: filter.options.map((option) => ({
								id: option.id,
								title: option.value
							})),
							minItemCount: 1,
							maxItemCount: 1
						});
					}
					case "multiselect": {
						const selectedOptions = this.selectedFilterValues[filter.id] ?? filter.value;
						return Section({ id: filter.id }, [TriStateSelectRow(filter.id, {
							title: filter.title,
							layout: "flow",
							value: selectedOptions,
							items: filter.options.map((x) => ({
								id: x.id,
								title: x.value
							})),
							allowExclusion: filter.allowExclusion,
							allowEmptySelection: filter.allowEmptySelection,
							maximum: filter.maximum,
							onValueChange: closureSelector(this, filter.id, async (newValue) => {
								this.selectedFilterValues[filter.id] = newValue;
								this.reloadForm();
							})
						})]);
					}
					case "input": {
						const value = this.selectedFilterValues[filter.id] ?? filter.value;
						return Section({
							id: filter.id,
							header: filter.title
						}, [InputRow(filter.id, {
							title: filter.title,
							value,
							onValueChange: closureSelector(this, filter.id, async (newValue) => {
								this.selectedFilterValues[filter.id] = newValue;
								this.reloadForm();
							})
						})]);
					}
				}
			});
		}
		getSearchQueryMetadata() {
			if (this.filters && !(this.filters instanceof Error)) return this.filters.map((filter) => {
				return {
					id: filter.id,
					value: this.selectedFilterValues[filter.id] ?? filter.value
				};
			});
			else return [];
		}
		async formDidSubmit() {
			if (!this.filters) throw new Error("Search filters are loading");
			else if (this.filters instanceof Error) throw this.filters;
		}
	};

//#endregion
//#region node_modules/domelementtype/lib/esm/index.js
/** Types of elements found in htmlparser2's DOM */
	var ElementType;
	(function(ElementType) {
		/** Type for the root element of a document */
		ElementType["Root"] = "root";
		/** Type for Text */
		ElementType["Text"] = "text";
		/** Type for <? ... ?> */
		ElementType["Directive"] = "directive";
		/** Type for <!-- ... --> */
		ElementType["Comment"] = "comment";
		/** Type for <script> tags */
		ElementType["Script"] = "script";
		/** Type for <style> tags */
		ElementType["Style"] = "style";
		/** Type for Any tag */
		ElementType["Tag"] = "tag";
		/** Type for <![CDATA[ ... ]]> */
		ElementType["CDATA"] = "cdata";
		/** Type for <!doctype ...> */
		ElementType["Doctype"] = "doctype";
	})(ElementType || (ElementType = {}));
	/**
	* Tests whether an element is a tag or not.
	*
	* @param elem Element to test
	*/
	function isTag$1(elem) {
		return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
	}
	/** Type for the root element of a document */
	const Root = ElementType.Root;
	/** Type for Text */
	const Text$1 = ElementType.Text;
	/** Type for <? ... ?> */
	const Directive = ElementType.Directive;
	/** Type for <!-- ... --> */
	const Comment$1 = ElementType.Comment;
	/** Type for <script> tags */
	const Script = ElementType.Script;
	/** Type for <style> tags */
	const Style = ElementType.Style;
	/** Type for Any tag */
	const Tag = ElementType.Tag;
	/** Type for <![CDATA[ ... ]]> */
	const CDATA$1 = ElementType.CDATA;
	/** Type for <!doctype ...> */
	const Doctype = ElementType.Doctype;

//#endregion
//#region node_modules/domhandler/lib/esm/node.js
/**
	* This object will be used as the prototype for Nodes when creating a
	* DOM-Level-1-compliant structure.
	*/
	var Node = class {
		constructor() {
			/** Parent of the node */
			this.parent = null;
			/** Previous sibling */
			this.prev = null;
			/** Next sibling */
			this.next = null;
			/** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
			this.startIndex = null;
			/** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
			this.endIndex = null;
		}
		/**
		* Same as {@link parent}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get parentNode() {
			return this.parent;
		}
		set parentNode(parent) {
			this.parent = parent;
		}
		/**
		* Same as {@link prev}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get previousSibling() {
			return this.prev;
		}
		set previousSibling(prev) {
			this.prev = prev;
		}
		/**
		* Same as {@link next}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get nextSibling() {
			return this.next;
		}
		set nextSibling(next) {
			this.next = next;
		}
		/**
		* Clone this node, and optionally its children.
		*
		* @param recursive Clone child nodes as well.
		* @returns A clone of the node.
		*/
		cloneNode(recursive = false) {
			return cloneNode(this, recursive);
		}
	};
	/**
	* A node that contains some data.
	*/
	var DataNode = class extends Node {
		/**
		* @param data The content of the data node
		*/
		constructor(data) {
			super();
			this.data = data;
		}
		/**
		* Same as {@link data}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get nodeValue() {
			return this.data;
		}
		set nodeValue(data) {
			this.data = data;
		}
	};
	/**
	* Text within the document.
	*/
	var Text = class extends DataNode {
		constructor() {
			super(...arguments);
			this.type = ElementType.Text;
		}
		get nodeType() {
			return 3;
		}
	};
	/**
	* Comments within the document.
	*/
	var Comment = class extends DataNode {
		constructor() {
			super(...arguments);
			this.type = ElementType.Comment;
		}
		get nodeType() {
			return 8;
		}
	};
	/**
	* Processing instructions, including doc types.
	*/
	var ProcessingInstruction = class extends DataNode {
		constructor(name, data) {
			super(data);
			this.name = name;
			this.type = ElementType.Directive;
		}
		get nodeType() {
			return 1;
		}
	};
	/**
	* A `Node` that can have children.
	*/
	var NodeWithChildren = class extends Node {
		/**
		* @param children Children of the node. Only certain node types can have children.
		*/
		constructor(children) {
			super();
			this.children = children;
		}
		/** First child of the node. */
		get firstChild() {
			var _a;
			return (_a = this.children[0]) !== null && _a !== void 0 ? _a : null;
		}
		/** Last child of the node. */
		get lastChild() {
			return this.children.length > 0 ? this.children[this.children.length - 1] : null;
		}
		/**
		* Same as {@link children}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get childNodes() {
			return this.children;
		}
		set childNodes(children) {
			this.children = children;
		}
	};
	var CDATA = class extends NodeWithChildren {
		constructor() {
			super(...arguments);
			this.type = ElementType.CDATA;
		}
		get nodeType() {
			return 4;
		}
	};
	/**
	* The root node of the document.
	*/
	var Document = class extends NodeWithChildren {
		constructor() {
			super(...arguments);
			this.type = ElementType.Root;
		}
		get nodeType() {
			return 9;
		}
	};
	/**
	* An element within the DOM.
	*/
	var Element = class extends NodeWithChildren {
		/**
		* @param name Name of the tag, eg. `div`, `span`.
		* @param attribs Object mapping attribute names to attribute values.
		* @param children Children of the node.
		*/
		constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
			super(children);
			this.name = name;
			this.attribs = attribs;
			this.type = type;
		}
		get nodeType() {
			return 1;
		}
		/**
		* Same as {@link name}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get tagName() {
			return this.name;
		}
		set tagName(name) {
			this.name = name;
		}
		get attributes() {
			return Object.keys(this.attribs).map((name) => {
				var _a, _b;
				return {
					name,
					value: this.attribs[name],
					namespace: (_a = this["x-attribsNamespace"]) === null || _a === void 0 ? void 0 : _a[name],
					prefix: (_b = this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name]
				};
			});
		}
	};
	/**
	* @param node Node to check.
	* @returns `true` if the node is a `Element`, `false` otherwise.
	*/
	function isTag(node) {
		return isTag$1(node);
	}
	/**
	* @param node Node to check.
	* @returns `true` if the node has the type `CDATA`, `false` otherwise.
	*/
	function isCDATA(node) {
		return node.type === ElementType.CDATA;
	}
	/**
	* @param node Node to check.
	* @returns `true` if the node has the type `Text`, `false` otherwise.
	*/
	function isText(node) {
		return node.type === ElementType.Text;
	}
	/**
	* @param node Node to check.
	* @returns `true` if the node has the type `Comment`, `false` otherwise.
	*/
	function isComment(node) {
		return node.type === ElementType.Comment;
	}
	/**
	* @param node Node to check.
	* @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
	*/
	function isDirective(node) {
		return node.type === ElementType.Directive;
	}
	/**
	* @param node Node to check.
	* @returns `true` if the node has the type `ProcessingInstruction`, `false` otherwise.
	*/
	function isDocument(node) {
		return node.type === ElementType.Root;
	}
	/**
	* @param node Node to check.
	* @returns `true` if the node has children, `false` otherwise.
	*/
	function hasChildren(node) {
		return Object.prototype.hasOwnProperty.call(node, "children");
	}
	/**
	* Clone a node, and optionally its children.
	*
	* @param recursive Clone child nodes as well.
	* @returns A clone of the node.
	*/
	function cloneNode(node, recursive = false) {
		let result;
		if (isText(node)) result = new Text(node.data);
		else if (isComment(node)) result = new Comment(node.data);
		else if (isTag(node)) {
			const children = recursive ? cloneChildren(node.children) : [];
			const clone = new Element(node.name, { ...node.attribs }, children);
			children.forEach((child) => child.parent = clone);
			if (node.namespace != null) clone.namespace = node.namespace;
			if (node["x-attribsNamespace"]) clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
			if (node["x-attribsPrefix"]) clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
			result = clone;
		} else if (isCDATA(node)) {
			const children = recursive ? cloneChildren(node.children) : [];
			const clone = new CDATA(children);
			children.forEach((child) => child.parent = clone);
			result = clone;
		} else if (isDocument(node)) {
			const children = recursive ? cloneChildren(node.children) : [];
			const clone = new Document(children);
			children.forEach((child) => child.parent = clone);
			if (node["x-mode"]) clone["x-mode"] = node["x-mode"];
			result = clone;
		} else if (isDirective(node)) {
			const instruction = new ProcessingInstruction(node.name, node.data);
			if (node["x-name"] != null) {
				instruction["x-name"] = node["x-name"];
				instruction["x-publicId"] = node["x-publicId"];
				instruction["x-systemId"] = node["x-systemId"];
			}
			result = instruction;
		} else throw new Error(`Not implemented yet: ${node.type}`);
		result.startIndex = node.startIndex;
		result.endIndex = node.endIndex;
		if (node.sourceCodeLocation != null) result.sourceCodeLocation = node.sourceCodeLocation;
		return result;
	}
	function cloneChildren(childs) {
		const children = childs.map((child) => cloneNode(child, true));
		for (let i = 1; i < children.length; i++) {
			children[i].prev = children[i - 1];
			children[i - 1].next = children[i];
		}
		return children;
	}

//#endregion
//#region node_modules/domhandler/lib/esm/index.js
	const defaultOpts$2 = {
		withStartIndices: false,
		withEndIndices: false,
		xmlMode: false
	};
	var DomHandler = class {
		/**
		* @param callback Called once parsing has completed.
		* @param options Settings for the handler.
		* @param elementCB Callback whenever a tag is closed.
		*/
		constructor(callback, options, elementCB) {
			/** The elements of the DOM */
			this.dom = [];
			/** The root element for the DOM */
			this.root = new Document(this.dom);
			/** Indicated whether parsing has been completed. */
			this.done = false;
			/** Stack of open tags. */
			this.tagStack = [this.root];
			/** A data node that is still being written to. */
			this.lastNode = null;
			/** Reference to the parser instance. Used for location information. */
			this.parser = null;
			if (typeof options === "function") {
				elementCB = options;
				options = defaultOpts$2;
			}
			if (typeof callback === "object") {
				options = callback;
				callback = void 0;
			}
			this.callback = callback !== null && callback !== void 0 ? callback : null;
			this.options = options !== null && options !== void 0 ? options : defaultOpts$2;
			this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
		}
		onparserinit(parser) {
			this.parser = parser;
		}
		onreset() {
			this.dom = [];
			this.root = new Document(this.dom);
			this.done = false;
			this.tagStack = [this.root];
			this.lastNode = null;
			this.parser = null;
		}
		onend() {
			if (this.done) return;
			this.done = true;
			this.parser = null;
			this.handleCallback(null);
		}
		onerror(error) {
			this.handleCallback(error);
		}
		onclosetag() {
			this.lastNode = null;
			const elem = this.tagStack.pop();
			if (this.options.withEndIndices) elem.endIndex = this.parser.endIndex;
			if (this.elementCB) this.elementCB(elem);
		}
		onopentag(name, attribs) {
			const element = new Element(name, attribs, void 0, this.options.xmlMode ? ElementType.Tag : void 0);
			this.addNode(element);
			this.tagStack.push(element);
		}
		ontext(data) {
			const { lastNode } = this;
			if (lastNode && lastNode.type === ElementType.Text) {
				lastNode.data += data;
				if (this.options.withEndIndices) lastNode.endIndex = this.parser.endIndex;
			} else {
				const node = new Text(data);
				this.addNode(node);
				this.lastNode = node;
			}
		}
		oncomment(data) {
			if (this.lastNode && this.lastNode.type === ElementType.Comment) {
				this.lastNode.data += data;
				return;
			}
			const node = new Comment(data);
			this.addNode(node);
			this.lastNode = node;
		}
		oncommentend() {
			this.lastNode = null;
		}
		oncdatastart() {
			const text = new Text("");
			const node = new CDATA([text]);
			this.addNode(node);
			text.parent = node;
			this.lastNode = text;
		}
		oncdataend() {
			this.lastNode = null;
		}
		onprocessinginstruction(name, data) {
			const node = new ProcessingInstruction(name, data);
			this.addNode(node);
		}
		handleCallback(error) {
			if (typeof this.callback === "function") this.callback(error, this.dom);
			else if (error) throw error;
		}
		addNode(node) {
			const parent = this.tagStack[this.tagStack.length - 1];
			const previousSibling = parent.children[parent.children.length - 1];
			if (this.options.withStartIndices) node.startIndex = this.parser.startIndex;
			if (this.options.withEndIndices) node.endIndex = this.parser.endIndex;
			parent.children.push(node);
			if (previousSibling) {
				node.prev = previousSibling;
				previousSibling.next = node;
			}
			node.parent = parent;
			this.lastNode = null;
		}
	};

//#endregion
//#region node_modules/dom-serializer/node_modules/entities/lib/esm/escape.js
	const xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
	const xmlCodeMap = new Map([
		[34, "&quot;"],
		[38, "&amp;"],
		[39, "&apos;"],
		[60, "&lt;"],
		[62, "&gt;"]
	]);
	const getCodePoint$1 = String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index);
	/**
	* Encodes all non-ASCII characters, as well as characters not valid in XML
	* documents using XML entities.
	*
	* If a character has no equivalent entity, a
	* numeric hexadecimal reference (eg. `&#xfc;`) will be used.
	*/
	function encodeXML(str) {
		let ret = "";
		let lastIdx = 0;
		let match;
		while ((match = xmlReplacer.exec(str)) !== null) {
			const i = match.index;
			const char = str.charCodeAt(i);
			const next = xmlCodeMap.get(char);
			if (next !== void 0) {
				ret += str.substring(lastIdx, i) + next;
				lastIdx = i + 1;
			} else {
				ret += `${str.substring(lastIdx, i)}&#x${getCodePoint$1(str, i).toString(16)};`;
				lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
			}
		}
		return ret + str.substr(lastIdx);
	}
	/**
	* Creates a function that escapes all characters matched by the given regular
	* expression using the given map of characters to escape to their entities.
	*
	* @param regex Regular expression to match characters to escape.
	* @param map Map of characters to escape to their entities.
	*
	* @returns Function that escapes all characters matched by the given regular
	* expression using the given map of characters to escape to their entities.
	*/
	function getEscaper$1(regex, map) {
		return function escape(data) {
			let match;
			let lastIdx = 0;
			let result = "";
			while (match = regex.exec(data)) {
				if (lastIdx !== match.index) result += data.substring(lastIdx, match.index);
				result += map.get(match[0].charCodeAt(0));
				lastIdx = match.index + 1;
			}
			return result + data.substring(lastIdx);
		};
	}
	/**
	* Encodes all characters not valid in XML documents using XML entities.
	*
	* Note that the output will be character-set dependent.
	*
	* @param data String to escape.
	*/
	const escapeUTF8 = getEscaper$1(/[&<>'"]/g, xmlCodeMap);
	/**
	* Encodes all characters that have to be escaped in HTML attributes,
	* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
	*
	* @param data String to escape.
	*/
	const escapeAttribute$1 = getEscaper$1(/["&\u00A0]/g, new Map([
		[34, "&quot;"],
		[38, "&amp;"],
		[160, "&nbsp;"]
	]));
	/**
	* Encodes all characters that have to be escaped in HTML text,
	* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
	*
	* @param data String to escape.
	*/
	const escapeText$1 = getEscaper$1(/[&<>\u00A0]/g, new Map([
		[38, "&amp;"],
		[60, "&lt;"],
		[62, "&gt;"],
		[160, "&nbsp;"]
	]));

//#endregion
//#region node_modules/dom-serializer/lib/esm/foreignNames.js
	const elementNames = new Map([
		"altGlyph",
		"altGlyphDef",
		"altGlyphItem",
		"animateColor",
		"animateMotion",
		"animateTransform",
		"clipPath",
		"feBlend",
		"feColorMatrix",
		"feComponentTransfer",
		"feComposite",
		"feConvolveMatrix",
		"feDiffuseLighting",
		"feDisplacementMap",
		"feDistantLight",
		"feDropShadow",
		"feFlood",
		"feFuncA",
		"feFuncB",
		"feFuncG",
		"feFuncR",
		"feGaussianBlur",
		"feImage",
		"feMerge",
		"feMergeNode",
		"feMorphology",
		"feOffset",
		"fePointLight",
		"feSpecularLighting",
		"feSpotLight",
		"feTile",
		"feTurbulence",
		"foreignObject",
		"glyphRef",
		"linearGradient",
		"radialGradient",
		"textPath"
	].map((val) => [val.toLowerCase(), val]));
	const attributeNames = new Map([
		"definitionURL",
		"attributeName",
		"attributeType",
		"baseFrequency",
		"baseProfile",
		"calcMode",
		"clipPathUnits",
		"diffuseConstant",
		"edgeMode",
		"filterUnits",
		"glyphRef",
		"gradientTransform",
		"gradientUnits",
		"kernelMatrix",
		"kernelUnitLength",
		"keyPoints",
		"keySplines",
		"keyTimes",
		"lengthAdjust",
		"limitingConeAngle",
		"markerHeight",
		"markerUnits",
		"markerWidth",
		"maskContentUnits",
		"maskUnits",
		"numOctaves",
		"pathLength",
		"patternContentUnits",
		"patternTransform",
		"patternUnits",
		"pointsAtX",
		"pointsAtY",
		"pointsAtZ",
		"preserveAlpha",
		"preserveAspectRatio",
		"primitiveUnits",
		"refX",
		"refY",
		"repeatCount",
		"repeatDur",
		"requiredExtensions",
		"requiredFeatures",
		"specularConstant",
		"specularExponent",
		"spreadMethod",
		"startOffset",
		"stdDeviation",
		"stitchTiles",
		"surfaceScale",
		"systemLanguage",
		"tableValues",
		"targetX",
		"targetY",
		"textLength",
		"viewBox",
		"viewTarget",
		"xChannelSelector",
		"yChannelSelector",
		"zoomAndPan"
	].map((val) => [val.toLowerCase(), val]));

//#endregion
//#region node_modules/dom-serializer/lib/esm/index.js
/**
	* Mixed-case SVG and MathML tags & attributes
	* recognized by the HTML parser.
	*
	* @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
	*/
	const unencodedElements = new Set([
		"style",
		"script",
		"xmp",
		"iframe",
		"noembed",
		"noframes",
		"plaintext",
		"noscript"
	]);
	function replaceQuotes(value) {
		return value.replace(/"/g, "&quot;");
	}
	/**
	* Format attributes
	*/
	function formatAttributes(attributes, opts) {
		var _a;
		if (!attributes) return;
		const encode = ((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute$1;
		return Object.keys(attributes).map((key) => {
			var _a, _b;
			const value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
			if (opts.xmlMode === "foreign") key = (_b = attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
			if (!opts.emptyAttrs && !opts.xmlMode && value === "") return key;
			return `${key}="${encode(value)}"`;
		}).join(" ");
	}
	/**
	* Self-enclosing tags
	*/
	const singleTag = new Set([
		"area",
		"base",
		"basefont",
		"br",
		"col",
		"command",
		"embed",
		"frame",
		"hr",
		"img",
		"input",
		"isindex",
		"keygen",
		"link",
		"meta",
		"param",
		"source",
		"track",
		"wbr"
	]);
	/**
	* Renders a DOM node or an array of DOM nodes to a string.
	*
	* Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
	*
	* @param node Node to be rendered.
	* @param options Changes serialization behavior
	*/
	function render$1(node, options = {}) {
		const nodes = "length" in node ? node : [node];
		let output = "";
		for (let i = 0; i < nodes.length; i++) output += renderNode(nodes[i], options);
		return output;
	}
	function renderNode(node, options) {
		switch (node.type) {
			case Root: return render$1(node.children, options);
			case Doctype:
			case Directive: return renderDirective(node);
			case Comment$1: return renderComment(node);
			case CDATA$1: return renderCdata(node);
			case Script:
			case Style:
			case Tag: return renderTag(node, options);
			case Text$1: return renderText(node, options);
		}
	}
	const foreignModeIntegrationPoints = new Set([
		"mi",
		"mo",
		"mn",
		"ms",
		"mtext",
		"annotation-xml",
		"foreignObject",
		"desc",
		"title"
	]);
	const foreignElements = new Set(["svg", "math"]);
	function renderTag(elem, opts) {
		var _a;
		if (opts.xmlMode === "foreign") {
			elem.name = (_a = elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
			if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) opts = {
				...opts,
				xmlMode: false
			};
		}
		if (!opts.xmlMode && foreignElements.has(elem.name)) opts = {
			...opts,
			xmlMode: "foreign"
		};
		let tag = `<${elem.name}`;
		const attribs = formatAttributes(elem.attribs, opts);
		if (attribs) tag += ` ${attribs}`;
		if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
			if (!opts.xmlMode) tag += " ";
			tag += "/>";
		} else {
			tag += ">";
			if (elem.children.length > 0) tag += render$1(elem.children, opts);
			if (opts.xmlMode || !singleTag.has(elem.name)) tag += `</${elem.name}>`;
		}
		return tag;
	}
	function renderDirective(elem) {
		return `<${elem.data}>`;
	}
	function renderText(elem, opts) {
		var _a;
		let data = elem.data || "";
		if (((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText$1(data);
		return data;
	}
	function renderCdata(elem) {
		return `<![CDATA[${elem.children[0].data}]]>`;
	}
	function renderComment(elem) {
		return `<!--${elem.data}-->`;
	}

//#endregion
//#region node_modules/domutils/lib/esm/stringify.js
/**
	* @category Stringify
	* @deprecated Use the `dom-serializer` module directly.
	* @param node Node to get the outer HTML of.
	* @param options Options for serialization.
	* @returns `node`'s outer HTML.
	*/
	function getOuterHTML(node, options) {
		return render$1(node, options);
	}
	/**
	* @category Stringify
	* @deprecated Use the `dom-serializer` module directly.
	* @param node Node to get the inner HTML of.
	* @param options Options for serialization.
	* @returns `node`'s inner HTML.
	*/
	function getInnerHTML(node, options) {
		return hasChildren(node) ? node.children.map((node) => getOuterHTML(node, options)).join("") : "";
	}
	/**
	* Get a node's inner text. Same as `textContent`, but inserts newlines for `<br>` tags. Ignores comments.
	*
	* @category Stringify
	* @deprecated Use `textContent` instead.
	* @param node Node to get the inner text of.
	* @returns `node`'s inner text.
	*/
	function getText(node) {
		if (Array.isArray(node)) return node.map(getText).join("");
		if (isTag(node)) return node.name === "br" ? "\n" : getText(node.children);
		if (isCDATA(node)) return getText(node.children);
		if (isText(node)) return node.data;
		return "";
	}
	/**
	* Get a node's text content. Ignores comments.
	*
	* @category Stringify
	* @param node Node to get the text content of.
	* @returns `node`'s text content.
	* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent}
	*/
	function textContent(node) {
		if (Array.isArray(node)) return node.map(textContent).join("");
		if (hasChildren(node) && !isComment(node)) return textContent(node.children);
		if (isText(node)) return node.data;
		return "";
	}
	/**
	* Get a node's inner text, ignoring `<script>` and `<style>` tags. Ignores comments.
	*
	* @category Stringify
	* @param node Node to get the inner text of.
	* @returns `node`'s inner text.
	* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/innerText}
	*/
	function innerText(node) {
		if (Array.isArray(node)) return node.map(innerText).join("");
		if (hasChildren(node) && (node.type === ElementType.Tag || isCDATA(node))) return innerText(node.children);
		if (isText(node)) return node.data;
		return "";
	}

//#endregion
//#region node_modules/domutils/lib/esm/traversal.js
/**
	* Get a node's children.
	*
	* @category Traversal
	* @param elem Node to get the children of.
	* @returns `elem`'s children, or an empty array.
	*/
	function getChildren(elem) {
		return hasChildren(elem) ? elem.children : [];
	}
	/**
	* Get a node's parent.
	*
	* @category Traversal
	* @param elem Node to get the parent of.
	* @returns `elem`'s parent node, or `null` if `elem` is a root node.
	*/
	function getParent(elem) {
		return elem.parent || null;
	}
	/**
	* Gets an elements siblings, including the element itself.
	*
	* Attempts to get the children through the element's parent first. If we don't
	* have a parent (the element is a root node), we walk the element's `prev` &
	* `next` to get all remaining nodes.
	*
	* @category Traversal
	* @param elem Element to get the siblings of.
	* @returns `elem`'s siblings, including `elem`.
	*/
	function getSiblings(elem) {
		const parent = getParent(elem);
		if (parent != null) return getChildren(parent);
		const siblings = [elem];
		let { prev, next } = elem;
		while (prev != null) {
			siblings.unshift(prev);
			({prev} = prev);
		}
		while (next != null) {
			siblings.push(next);
			({next} = next);
		}
		return siblings;
	}
	/**
	* Gets an attribute from an element.
	*
	* @category Traversal
	* @param elem Element to check.
	* @param name Attribute name to retrieve.
	* @returns The element's attribute value, or `undefined`.
	*/
	function getAttributeValue(elem, name) {
		var _a;
		return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
	}
	/**
	* Checks whether an element has an attribute.
	*
	* @category Traversal
	* @param elem Element to check.
	* @param name Attribute name to look for.
	* @returns Returns whether `elem` has the attribute `name`.
	*/
	function hasAttrib(elem, name) {
		return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
	}
	/**
	* Get the tag name of an element.
	*
	* @category Traversal
	* @param elem The element to get the name for.
	* @returns The tag name of `elem`.
	*/
	function getName$1(elem) {
		return elem.name;
	}
	/**
	* Returns the next element sibling of a node.
	*
	* @category Traversal
	* @param elem The element to get the next sibling of.
	* @returns `elem`'s next sibling that is a tag, or `null` if there is no next
	* sibling.
	*/
	function nextElementSibling(elem) {
		let { next } = elem;
		while (next !== null && !isTag(next)) ({next} = next);
		return next;
	}
	/**
	* Returns the previous element sibling of a node.
	*
	* @category Traversal
	* @param elem The element to get the previous sibling of.
	* @returns `elem`'s previous sibling that is a tag, or `null` if there is no
	* previous sibling.
	*/
	function prevElementSibling(elem) {
		let { prev } = elem;
		while (prev !== null && !isTag(prev)) ({prev} = prev);
		return prev;
	}

//#endregion
//#region node_modules/domutils/lib/esm/manipulation.js
/**
	* Remove an element from the dom
	*
	* @category Manipulation
	* @param elem The element to be removed
	*/
	function removeElement(elem) {
		if (elem.prev) elem.prev.next = elem.next;
		if (elem.next) elem.next.prev = elem.prev;
		if (elem.parent) {
			const childs = elem.parent.children;
			const childsIndex = childs.lastIndexOf(elem);
			if (childsIndex >= 0) childs.splice(childsIndex, 1);
		}
		elem.next = null;
		elem.prev = null;
		elem.parent = null;
	}
	/**
	* Replace an element in the dom
	*
	* @category Manipulation
	* @param elem The element to be replaced
	* @param replacement The element to be added
	*/
	function replaceElement(elem, replacement) {
		const prev = replacement.prev = elem.prev;
		if (prev) prev.next = replacement;
		const next = replacement.next = elem.next;
		if (next) next.prev = replacement;
		const parent = replacement.parent = elem.parent;
		if (parent) {
			const childs = parent.children;
			childs[childs.lastIndexOf(elem)] = replacement;
			elem.parent = null;
		}
	}
	/**
	* Append a child to an element.
	*
	* @category Manipulation
	* @param parent The element to append to.
	* @param child The element to be added as a child.
	*/
	function appendChild(parent, child) {
		removeElement(child);
		child.next = null;
		child.parent = parent;
		if (parent.children.push(child) > 1) {
			const sibling = parent.children[parent.children.length - 2];
			sibling.next = child;
			child.prev = sibling;
		} else child.prev = null;
	}
	/**
	* Append an element after another.
	*
	* @category Manipulation
	* @param elem The element to append after.
	* @param next The element be added.
	*/
	function append$1(elem, next) {
		removeElement(next);
		const { parent } = elem;
		const currNext = elem.next;
		next.next = currNext;
		next.prev = elem;
		elem.next = next;
		next.parent = parent;
		if (currNext) {
			currNext.prev = next;
			if (parent) {
				const childs = parent.children;
				childs.splice(childs.lastIndexOf(currNext), 0, next);
			}
		} else if (parent) parent.children.push(next);
	}
	/**
	* Prepend a child to an element.
	*
	* @category Manipulation
	* @param parent The element to prepend before.
	* @param child The element to be added as a child.
	*/
	function prependChild(parent, child) {
		removeElement(child);
		child.parent = parent;
		child.prev = null;
		if (parent.children.unshift(child) !== 1) {
			const sibling = parent.children[1];
			sibling.prev = child;
			child.next = sibling;
		} else child.next = null;
	}
	/**
	* Prepend an element before another.
	*
	* @category Manipulation
	* @param elem The element to prepend before.
	* @param prev The element be added.
	*/
	function prepend$1(elem, prev) {
		removeElement(prev);
		const { parent } = elem;
		if (parent) {
			const childs = parent.children;
			childs.splice(childs.indexOf(elem), 0, prev);
		}
		if (elem.prev) elem.prev.next = prev;
		prev.parent = parent;
		prev.prev = elem.prev;
		prev.next = elem;
		elem.prev = prev;
	}

//#endregion
//#region node_modules/domutils/lib/esm/querying.js
/**
	* Search a node and its children for nodes passing a test function. If `node` is not an array, it will be wrapped in one.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param node Node to search. Will be included in the result set if it matches.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes passing `test`.
	*/
	function filter$2(test, node, recurse = true, limit = Infinity) {
		return find$2(test, Array.isArray(node) ? node : [node], recurse, limit);
	}
	/**
	* Search an array of nodes and their children for nodes passing a test function.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Array of nodes to search.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes passing `test`.
	*/
	function find$2(test, nodes, recurse, limit) {
		const result = [];
		/** Stack of the arrays we are looking at. */
		const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
		/** Stack of the indices within the arrays. */
		const indexStack = [0];
		for (;;) {
			if (indexStack[0] >= nodeStack[0].length) {
				if (indexStack.length === 1) return result;
				nodeStack.shift();
				indexStack.shift();
				continue;
			}
			const elem = nodeStack[0][indexStack[0]++];
			if (test(elem)) {
				result.push(elem);
				if (--limit <= 0) return result;
			}
			if (recurse && hasChildren(elem) && elem.children.length > 0) {
				indexStack.unshift(0);
				nodeStack.unshift(elem.children);
			}
		}
	}
	/**
	* Finds the first element inside of an array that matches a test function. This is an alias for `Array.prototype.find`.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Array of nodes to search.
	* @returns The first node in the array that passes `test`.
	* @deprecated Use `Array.prototype.find` directly.
	*/
	function findOneChild(test, nodes) {
		return nodes.find(test);
	}
	/**
	* Finds one element in a tree that passes a test.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Node or array of nodes to search.
	* @param recurse Also consider child nodes.
	* @returns The first node that passes `test`.
	*/
	function findOne(test, nodes, recurse = true) {
		const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
		for (let i = 0; i < searchedNodes.length; i++) {
			const node = searchedNodes[i];
			if (isTag(node) && test(node)) return node;
			if (recurse && hasChildren(node) && node.children.length > 0) {
				const found = findOne(test, node.children, true);
				if (found) return found;
			}
		}
		return null;
	}
	/**
	* Checks if a tree of nodes contains at least one node passing a test.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Array of nodes to search.
	* @returns Whether a tree of nodes contains at least one node passing the test.
	*/
	function existsOne(test, nodes) {
		return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag(node) && test(node) || hasChildren(node) && existsOne(test, node.children));
	}
	/**
	* Search an array of nodes and their children for elements passing a test function.
	*
	* Same as `find`, but limited to elements and with less options, leading to reduced complexity.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Array of nodes to search.
	* @returns All nodes passing `test`.
	*/
	function findAll(test, nodes) {
		const result = [];
		const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
		const indexStack = [0];
		for (;;) {
			if (indexStack[0] >= nodeStack[0].length) {
				if (nodeStack.length === 1) return result;
				nodeStack.shift();
				indexStack.shift();
				continue;
			}
			const elem = nodeStack[0][indexStack[0]++];
			if (isTag(elem) && test(elem)) result.push(elem);
			if (hasChildren(elem) && elem.children.length > 0) {
				indexStack.unshift(0);
				nodeStack.unshift(elem.children);
			}
		}
	}

//#endregion
//#region node_modules/domutils/lib/esm/legacy.js
/**
	* A map of functions to check nodes against.
	*/
	const Checks = {
		tag_name(name) {
			if (typeof name === "function") return (elem) => isTag(elem) && name(elem.name);
			else if (name === "*") return isTag;
			return (elem) => isTag(elem) && elem.name === name;
		},
		tag_type(type) {
			if (typeof type === "function") return (elem) => type(elem.type);
			return (elem) => elem.type === type;
		},
		tag_contains(data) {
			if (typeof data === "function") return (elem) => isText(elem) && data(elem.data);
			return (elem) => isText(elem) && elem.data === data;
		}
	};
	/**
	* Returns a function to check whether a node has an attribute with a particular
	* value.
	*
	* @param attrib Attribute to check.
	* @param value Attribute value to look for.
	* @returns A function to check whether the a node has an attribute with a
	*   particular value.
	*/
	function getAttribCheck(attrib, value) {
		if (typeof value === "function") return (elem) => isTag(elem) && value(elem.attribs[attrib]);
		return (elem) => isTag(elem) && elem.attribs[attrib] === value;
	}
	/**
	* Returns a function that returns `true` if either of the input functions
	* returns `true` for a node.
	*
	* @param a First function to combine.
	* @param b Second function to combine.
	* @returns A function taking a node and returning `true` if either of the input
	*   functions returns `true` for the node.
	*/
	function combineFuncs(a, b) {
		return (elem) => a(elem) || b(elem);
	}
	/**
	* Returns a function that executes all checks in `options` and returns `true`
	* if any of them match a node.
	*
	* @param options An object describing nodes to look for.
	* @returns A function that executes all checks in `options` and returns `true`
	*   if any of them match a node.
	*/
	function compileTest(options) {
		const funcs = Object.keys(options).map((key) => {
			const value = options[key];
			return Object.prototype.hasOwnProperty.call(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
		});
		return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
	}
	/**
	* Checks whether a node matches the description in `options`.
	*
	* @category Legacy Query Functions
	* @param options An object describing nodes to look for.
	* @param node The element to test.
	* @returns Whether the element matches the description in `options`.
	*/
	function testElement(options, node) {
		const test = compileTest(options);
		return test ? test(node) : true;
	}
	/**
	* Returns all nodes that match `options`.
	*
	* @category Legacy Query Functions
	* @param options An object describing nodes to look for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes that match `options`.
	*/
	function getElements(options, nodes, recurse, limit = Infinity) {
		const test = compileTest(options);
		return test ? filter$2(test, nodes, recurse, limit) : [];
	}
	/**
	* Returns the node with the supplied ID.
	*
	* @category Legacy Query Functions
	* @param id The unique ID attribute value to look for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @returns The node with the supplied ID.
	*/
	function getElementById(id, nodes, recurse = true) {
		if (!Array.isArray(nodes)) nodes = [nodes];
		return findOne(getAttribCheck("id", id), nodes, recurse);
	}
	/**
	* Returns all nodes with the supplied `tagName`.
	*
	* @category Legacy Query Functions
	* @param tagName Tag name to search for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes with the supplied `tagName`.
	*/
	function getElementsByTagName(tagName, nodes, recurse = true, limit = Infinity) {
		return filter$2(Checks["tag_name"](tagName), nodes, recurse, limit);
	}
	/**
	* Returns all nodes with the supplied `className`.
	*
	* @category Legacy Query Functions
	* @param className Class name to search for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes with the supplied `className`.
	*/
	function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
		return filter$2(getAttribCheck("class", className), nodes, recurse, limit);
	}
	/**
	* Returns all nodes with the supplied `type`.
	*
	* @category Legacy Query Functions
	* @param type Element type to look for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes with the supplied `type`.
	*/
	function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
		return filter$2(Checks["tag_type"](type), nodes, recurse, limit);
	}

//#endregion
//#region node_modules/domutils/lib/esm/helpers.js
/**
	* Given an array of nodes, remove any member that is contained by another
	* member.
	*
	* @category Helpers
	* @param nodes Nodes to filter.
	* @returns Remaining nodes that aren't contained by other nodes.
	*/
	function removeSubsets(nodes) {
		let idx = nodes.length;
		while (--idx >= 0) {
			const node = nodes[idx];
			if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
				nodes.splice(idx, 1);
				continue;
			}
			for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) if (nodes.includes(ancestor)) {
				nodes.splice(idx, 1);
				break;
			}
		}
		return nodes;
	}
	/**
	* @category Helpers
	* @see {@link http://dom.spec.whatwg.org/#dom-node-comparedocumentposition}
	*/
	var DocumentPosition;
	(function(DocumentPosition) {
		DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
		DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
		DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
		DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
		DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
	})(DocumentPosition || (DocumentPosition = {}));
	/**
	* Compare the position of one node against another node in any other document,
	* returning a bitmask with the values from {@link DocumentPosition}.
	*
	* Document order:
	* > There is an ordering, document order, defined on all the nodes in the
	* > document corresponding to the order in which the first character of the
	* > XML representation of each node occurs in the XML representation of the
	* > document after expansion of general entities. Thus, the document element
	* > node will be the first node. Element nodes occur before their children.
	* > Thus, document order orders element nodes in order of the occurrence of
	* > their start-tag in the XML (after expansion of entities). The attribute
	* > nodes of an element occur after the element and before its children. The
	* > relative order of attribute nodes is implementation-dependent.
	*
	* Source:
	* http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
	*
	* @category Helpers
	* @param nodeA The first node to use in the comparison
	* @param nodeB The second node to use in the comparison
	* @returns A bitmask describing the input nodes' relative position.
	*
	* See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
	* a description of these values.
	*/
	function compareDocumentPosition(nodeA, nodeB) {
		const aParents = [];
		const bParents = [];
		if (nodeA === nodeB) return 0;
		let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
		while (current) {
			aParents.unshift(current);
			current = current.parent;
		}
		current = hasChildren(nodeB) ? nodeB : nodeB.parent;
		while (current) {
			bParents.unshift(current);
			current = current.parent;
		}
		const maxIdx = Math.min(aParents.length, bParents.length);
		let idx = 0;
		while (idx < maxIdx && aParents[idx] === bParents[idx]) idx++;
		if (idx === 0) return DocumentPosition.DISCONNECTED;
		const sharedParent = aParents[idx - 1];
		const siblings = sharedParent.children;
		const aSibling = aParents[idx];
		const bSibling = bParents[idx];
		if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
			if (sharedParent === nodeB) return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
			return DocumentPosition.FOLLOWING;
		}
		if (sharedParent === nodeA) return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
		return DocumentPosition.PRECEDING;
	}
	/**
	* Sort an array of nodes based on their relative position in the document,
	* removing any duplicate nodes. If the array contains nodes that do not belong
	* to the same document, sort order is unspecified.
	*
	* @category Helpers
	* @param nodes Array of DOM nodes.
	* @returns Collection of unique nodes, sorted in document order.
	*/
	function uniqueSort(nodes) {
		nodes = nodes.filter((node, i, arr) => !arr.includes(node, i + 1));
		nodes.sort((a, b) => {
			const relative = compareDocumentPosition(a, b);
			if (relative & DocumentPosition.PRECEDING) return -1;
			else if (relative & DocumentPosition.FOLLOWING) return 1;
			return 0;
		});
		return nodes;
	}

//#endregion
//#region node_modules/domutils/lib/esm/feeds.js
/**
	* Get the feed object from the root of a DOM tree.
	*
	* @category Feeds
	* @param doc - The DOM to to extract the feed from.
	* @returns The feed.
	*/
	function getFeed(doc) {
		const feedRoot = getOneElement(isValidFeed, doc);
		return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
	}
	/**
	* Parse an Atom feed.
	*
	* @param feedRoot The root of the feed.
	* @returns The parsed feed.
	*/
	function getAtomFeed(feedRoot) {
		var _a;
		const childs = feedRoot.children;
		const feed = {
			type: "atom",
			items: getElementsByTagName("entry", childs).map((item) => {
				var _a;
				const { children } = item;
				const entry = { media: getMediaElements(children) };
				addConditionally(entry, "id", "id", children);
				addConditionally(entry, "title", "title", children);
				const href = (_a = getOneElement("link", children)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
				if (href) entry.link = href;
				const description = fetch("summary", children) || fetch("content", children);
				if (description) entry.description = description;
				const pubDate = fetch("updated", children);
				if (pubDate) entry.pubDate = new Date(pubDate);
				return entry;
			})
		};
		addConditionally(feed, "id", "id", childs);
		addConditionally(feed, "title", "title", childs);
		const href = (_a = getOneElement("link", childs)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
		if (href) feed.link = href;
		addConditionally(feed, "description", "subtitle", childs);
		const updated = fetch("updated", childs);
		if (updated) feed.updated = new Date(updated);
		addConditionally(feed, "author", "email", childs, true);
		return feed;
	}
	/**
	* Parse a RSS feed.
	*
	* @param feedRoot The root of the feed.
	* @returns The parsed feed.
	*/
	function getRssFeed(feedRoot) {
		var _a, _b;
		const childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [];
		const feed = {
			type: feedRoot.name.substr(0, 3),
			id: "",
			items: getElementsByTagName("item", feedRoot.children).map((item) => {
				const { children } = item;
				const entry = { media: getMediaElements(children) };
				addConditionally(entry, "id", "guid", children);
				addConditionally(entry, "title", "title", children);
				addConditionally(entry, "link", "link", children);
				addConditionally(entry, "description", "description", children);
				const pubDate = fetch("pubDate", children) || fetch("dc:date", children);
				if (pubDate) entry.pubDate = new Date(pubDate);
				return entry;
			})
		};
		addConditionally(feed, "title", "title", childs);
		addConditionally(feed, "link", "link", childs);
		addConditionally(feed, "description", "description", childs);
		const updated = fetch("lastBuildDate", childs);
		if (updated) feed.updated = new Date(updated);
		addConditionally(feed, "author", "managingEditor", childs, true);
		return feed;
	}
	const MEDIA_KEYS_STRING = [
		"url",
		"type",
		"lang"
	];
	const MEDIA_KEYS_INT = [
		"fileSize",
		"bitrate",
		"framerate",
		"samplingrate",
		"channels",
		"duration",
		"height",
		"width"
	];
	/**
	* Get all media elements of a feed item.
	*
	* @param where Nodes to search in.
	* @returns Media elements.
	*/
	function getMediaElements(where) {
		return getElementsByTagName("media:content", where).map((elem) => {
			const { attribs } = elem;
			const media = {
				medium: attribs["medium"],
				isDefault: !!attribs["isDefault"]
			};
			for (const attrib of MEDIA_KEYS_STRING) if (attribs[attrib]) media[attrib] = attribs[attrib];
			for (const attrib of MEDIA_KEYS_INT) if (attribs[attrib]) media[attrib] = parseInt(attribs[attrib], 10);
			if (attribs["expression"]) media.expression = attribs["expression"];
			return media;
		});
	}
	/**
	* Get one element by tag name.
	*
	* @param tagName Tag name to look for
	* @param node Node to search in
	* @returns The element or null
	*/
	function getOneElement(tagName, node) {
		return getElementsByTagName(tagName, node, true, 1)[0];
	}
	/**
	* Get the text content of an element with a certain tag name.
	*
	* @param tagName Tag name to look for.
	* @param where Node to search in.
	* @param recurse Whether to recurse into child nodes.
	* @returns The text content of the element.
	*/
	function fetch(tagName, where, recurse = false) {
		return textContent(getElementsByTagName(tagName, where, recurse, 1)).trim();
	}
	/**
	* Adds a property to an object if it has a value.
	*
	* @param obj Object to be extended
	* @param prop Property name
	* @param tagName Tag name that contains the conditionally added property
	* @param where Element to search for the property
	* @param recurse Whether to recurse into child nodes.
	*/
	function addConditionally(obj, prop, tagName, where, recurse = false) {
		const val = fetch(tagName, where, recurse);
		if (val) obj[prop] = val;
	}
	/**
	* Checks if an element is a feed root node.
	*
	* @param value The name of the element to check.
	* @returns Whether an element is a feed root node.
	*/
	function isValidFeed(value) {
		return value === "rss" || value === "feed" || value === "rdf:RDF";
	}

//#endregion
//#region node_modules/domutils/lib/esm/index.js
	var esm_exports = /* @__PURE__ */ __exportAll({
		DocumentPosition: () => DocumentPosition,
		append: () => append$1,
		appendChild: () => appendChild,
		compareDocumentPosition: () => compareDocumentPosition,
		existsOne: () => existsOne,
		filter: () => filter$2,
		find: () => find$2,
		findAll: () => findAll,
		findOne: () => findOne,
		findOneChild: () => findOneChild,
		getAttributeValue: () => getAttributeValue,
		getChildren: () => getChildren,
		getElementById: () => getElementById,
		getElements: () => getElements,
		getElementsByClassName: () => getElementsByClassName,
		getElementsByTagName: () => getElementsByTagName,
		getElementsByTagType: () => getElementsByTagType,
		getFeed: () => getFeed,
		getInnerHTML: () => getInnerHTML,
		getName: () => getName$1,
		getOuterHTML: () => getOuterHTML,
		getParent: () => getParent,
		getSiblings: () => getSiblings,
		getText: () => getText,
		hasAttrib: () => hasAttrib,
		hasChildren: () => hasChildren,
		innerText: () => innerText,
		isCDATA: () => isCDATA,
		isComment: () => isComment,
		isDocument: () => isDocument,
		isTag: () => isTag,
		isText: () => isText,
		nextElementSibling: () => nextElementSibling,
		prepend: () => prepend$1,
		prependChild: () => prependChild,
		prevElementSibling: () => prevElementSibling,
		removeElement: () => removeElement,
		removeSubsets: () => removeSubsets,
		replaceElement: () => replaceElement,
		testElement: () => testElement,
		textContent: () => textContent,
		uniqueSort: () => uniqueSort
	});

//#endregion
//#region node_modules/cheerio/dist/browser/options.js
	const defaultOpts$1 = { _useHtmlParser2: false };
	/**
	* Flatten the options for Cheerio.
	*
	* This will set `_useHtmlParser2` to true if `xml` is set to true.
	*
	* @param options - The options to flatten.
	* @param baseOptions - The base options to use.
	* @returns The flattened options.
	*/
	function flattenOptions(options, baseOptions) {
		if (!options) return baseOptions !== null && baseOptions !== void 0 ? baseOptions : defaultOpts$1;
		const opts = {
			_useHtmlParser2: !!options.xmlMode,
			...baseOptions,
			...options
		};
		if (options.xml) {
			opts._useHtmlParser2 = true;
			opts.xmlMode = true;
			if (options.xml !== true) Object.assign(opts, options.xml);
		} else if (options.xmlMode) opts._useHtmlParser2 = true;
		return opts;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/static.js
	var static_exports = /* @__PURE__ */ __exportAll({
		contains: () => contains,
		extract: () => extract$1,
		html: () => html$1,
		merge: () => merge,
		parseHTML: () => parseHTML,
		root: () => root,
		text: () => text$1,
		xml: () => xml
	});
	/**
	* Helper function to render a DOM.
	*
	* @param that - Cheerio instance to render.
	* @param dom - The DOM to render. Defaults to `that`'s root.
	* @param options - Options for rendering.
	* @returns The rendered document.
	*/
	function render(that, dom, options) {
		if (!that) return "";
		return that(dom !== null && dom !== void 0 ? dom : that._root.children, null, void 0, options).toString();
	}
	/**
	* Checks if a passed object is an options object.
	*
	* @param dom - Object to check if it is an options object.
	* @param options - Options object.
	* @returns Whether the object is an options object.
	*/
	function isOptions(dom, options) {
		return !options && typeof dom === "object" && dom != null && !("length" in dom) && !("type" in dom);
	}
	function html$1(dom, options) {
		const toRender = isOptions(dom) ? (options = dom, void 0) : dom;
		const opts = {
			...this === null || this === void 0 ? void 0 : this._options,
			...flattenOptions(options)
		};
		return render(this, toRender, opts);
	}
	/**
	* Render the document as XML.
	*
	* @category Static
	* @param dom - Element to render.
	* @returns THe rendered document.
	*/
	function xml(dom) {
		const options = {
			...this._options,
			xmlMode: true
		};
		return render(this, dom, options);
	}
	/**
	* Render the document as text.
	*
	* This returns the `textContent` of the passed elements. The result will
	* include the contents of `<script>` and `<style>` elements. To avoid this, use
	* `.prop('innerText')` instead.
	*
	* @category Static
	* @param elements - Elements to render.
	* @returns The rendered document.
	*/
	function text$1(elements) {
		const elems = elements !== null && elements !== void 0 ? elements : this ? this.root() : [];
		let ret = "";
		for (let i = 0; i < elems.length; i++) ret += textContent(elems[i]);
		return ret;
	}
	function parseHTML(data, context, keepScripts = typeof context === "boolean" ? context : false) {
		if (!data || typeof data !== "string") return null;
		if (typeof context === "boolean") keepScripts = context;
		const parsed = this.load(data, this._options, false);
		if (!keepScripts) parsed("script").remove();
		return [...parsed.root()[0].children];
	}
	/**
	* Sometimes you need to work with the top-level root element. To query it, you
	* can use `$.root()`.
	*
	* @category Static
	* @example
	*
	* ```js
	* $.root().append('<ul id="vegetables"></ul>').html();
	* //=> <ul id="fruits">...</ul><ul id="vegetables"></ul>
	* ```
	*
	* @returns Cheerio instance wrapping the root node.
	* @alias Cheerio.root
	*/
	function root() {
		return this(this._root);
	}
	/**
	* Checks to see if the `contained` DOM element is a descendant of the
	* `container` DOM element.
	*
	* @category Static
	* @param container - Potential parent node.
	* @param contained - Potential child node.
	* @returns Indicates if the nodes contain one another.
	* @alias Cheerio.contains
	* @see {@link https://api.jquery.com/jQuery.contains/}
	*/
	function contains(container, contained) {
		if (contained === container) return false;
		let next = contained;
		while (next && next !== next.parent) {
			next = next.parent;
			if (next === container) return true;
		}
		return false;
	}
	/**
	* Extract multiple values from a document, and store them in an object.
	*
	* @category Static
	* @param map - An object containing key-value pairs. The keys are the names of
	*   the properties to be created on the object, and the values are the
	*   selectors to be used to extract the values.
	* @returns An object containing the extracted values.
	*/
	function extract$1(map) {
		return this.root().extract(map);
	}
	/**
	* $.merge().
	*
	* @category Static
	* @param arr1 - First array.
	* @param arr2 - Second array.
	* @returns `arr1`, with elements of `arr2` inserted.
	* @alias Cheerio.merge
	* @see {@link https://api.jquery.com/jQuery.merge/}
	*/
	function merge(arr1, arr2) {
		if (!isArrayLike(arr1) || !isArrayLike(arr2)) return;
		let newLength = arr1.length;
		const len = +arr2.length;
		for (let i = 0; i < len; i++) arr1[newLength++] = arr2[i];
		arr1.length = newLength;
		return arr1;
	}
	/**
	* Checks if an object is array-like.
	*
	* @category Static
	* @param item - Item to check.
	* @returns Indicates if the item is array-like.
	*/
	function isArrayLike(item) {
		if (Array.isArray(item)) return true;
		if (typeof item !== "object" || item === null || !("length" in item) || typeof item.length !== "number" || item.length < 0) return false;
		for (let i = 0; i < item.length; i++) if (!(i in item)) return false;
		return true;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/utils.js
/**
	* Checks if an object is a Cheerio instance.
	*
	* @category Utils
	* @param maybeCheerio - The object to check.
	* @returns Whether the object is a Cheerio instance.
	*/
	function isCheerio(maybeCheerio) {
		return maybeCheerio.cheerio != null;
	}
	/**
	* Convert a string to camel case notation.
	*
	* @private
	* @category Utils
	* @param str - The string to be converted.
	* @returns String in camel case notation.
	*/
	function camelCase(str) {
		return str.replace(/[._-](\w|$)/g, (_, x) => x.toUpperCase());
	}
	/**
	* Convert a string from camel case to "CSS case", where word boundaries are
	* described by hyphens ("-") and all characters are lower-case.
	*
	* @private
	* @category Utils
	* @param str - The string to be converted.
	* @returns String in "CSS case".
	*/
	function cssCase(str) {
		return str.replace(/[A-Z]/g, "-$&").toLowerCase();
	}
	/**
	* Iterate over each DOM element without creating intermediary Cheerio
	* instances.
	*
	* This is indented for use internally to avoid otherwise unnecessary memory
	* pressure introduced by _make.
	*
	* @category Utils
	* @param array - The array to iterate over.
	* @param fn - Function to call.
	* @returns The original instance.
	*/
	function domEach(array, fn) {
		const len = array.length;
		for (let i = 0; i < len; i++) fn(array[i], i);
		return array;
	}
	var CharacterCode;
	(function(CharacterCode) {
		CharacterCode[CharacterCode["LowerA"] = 97] = "LowerA";
		CharacterCode[CharacterCode["LowerZ"] = 122] = "LowerZ";
		CharacterCode[CharacterCode["UpperA"] = 65] = "UpperA";
		CharacterCode[CharacterCode["UpperZ"] = 90] = "UpperZ";
		CharacterCode[CharacterCode["Exclamation"] = 33] = "Exclamation";
	})(CharacterCode || (CharacterCode = {}));
	/**
	* Check if string is HTML.
	*
	* Tests for a `<` within a string, immediate followed by a letter and
	* eventually followed by a `>`.
	*
	* @private
	* @category Utils
	* @param str - The string to check.
	* @returns Indicates if `str` is HTML.
	*/
	function isHtml(str) {
		if (typeof str !== "string") return false;
		const tagStart = str.indexOf("<");
		if (tagStart === -1 || tagStart > str.length - 3) return false;
		const tagChar = str.charCodeAt(tagStart + 1);
		return (tagChar >= CharacterCode.LowerA && tagChar <= CharacterCode.LowerZ || tagChar >= CharacterCode.UpperA && tagChar <= CharacterCode.UpperZ || tagChar === CharacterCode.Exclamation) && str.includes(">", tagStart + 2);
	}

//#endregion
//#region node_modules/htmlparser2/node_modules/entities/dist/esm/decode-codepoint.js
	var _a$2;
	const decodeMap$1 = new Map([
		[0, 65533],
		[128, 8364],
		[130, 8218],
		[131, 402],
		[132, 8222],
		[133, 8230],
		[134, 8224],
		[135, 8225],
		[136, 710],
		[137, 8240],
		[138, 352],
		[139, 8249],
		[140, 338],
		[142, 381],
		[145, 8216],
		[146, 8217],
		[147, 8220],
		[148, 8221],
		[149, 8226],
		[150, 8211],
		[151, 8212],
		[152, 732],
		[153, 8482],
		[154, 353],
		[155, 8250],
		[156, 339],
		[158, 382],
		[159, 376]
	]);
	/**
	* Polyfill for `String.fromCodePoint`. It is used to create a string from a Unicode code point.
	*/
	const fromCodePoint$1 = (_a$2 = String.fromCodePoint) !== null && _a$2 !== void 0 ? _a$2 : ((codePoint) => {
		let output = "";
		if (codePoint > 65535) {
			codePoint -= 65536;
			output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
			codePoint = 56320 | codePoint & 1023;
		}
		output += String.fromCharCode(codePoint);
		return output;
	});
	/**
	* Replace the given code point with a replacement character if it is a
	* surrogate or is outside the valid range. Otherwise return the code
	* point unchanged.
	*/
	function replaceCodePoint$1(codePoint) {
		var _a;
		if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) return 65533;
		return (_a = decodeMap$1.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint;
	}

//#endregion
//#region node_modules/htmlparser2/node_modules/entities/dist/esm/internal/decode-shared.js
	function decodeBase64(input) {
		const binary = typeof atob === "function" ? atob(input) : typeof Buffer.from === "function" ? Buffer.from(input, "base64").toString("binary") : new Buffer(input, "base64").toString("binary");
		const evenLength = binary.length & -2;
		const out = new Uint16Array(evenLength / 2);
		for (let index = 0, outIndex = 0; index < evenLength; index += 2) {
			const lo = binary.charCodeAt(index);
			const hi = binary.charCodeAt(index + 1);
			out[outIndex++] = lo | hi << 8;
		}
		return out;
	}

//#endregion
//#region node_modules/htmlparser2/node_modules/entities/dist/esm/generated/decode-data-html.js
	const htmlDecodeTree$1 = /* @__PURE__ */ decodeBase64("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IAAOA12J/c8iFvaxBhAAhOVGFjZGZnbG1vcHFzdHV4owOlA6kDsAO/A8IDxgPNA9ID8gP9AwEEFAQeBCAEJQRHAEphSAA7gNAA0EBjAHUAdABlADuAyQDJQIABYWl5ALYDuQO+A/Ihb24aYXIAYwA7gMoAykAtZG8AdAAWYXIAAOA12AjdcgBhAHYAZQA7gMgAyEDlIm1lbnQAoAgiAAFhcNYD2QNjAHIAEmF0AHkAUwLhAwAAAADpA20lYWxsU3F1YXJlAACg+yVlJ3J5U21hbGxTcXVhcmUAAKCrJQABZ3D2A/kDbwBuABhhZgAA4DXYPN3zImlsb26VY3UAAAFhaQYEDgRsAFSgdSppImxkZQAAoEIi7CNpYnJpdW0AoMwhAAFjaRgEGwRyAACgMCFtAACgcyphAJdjbQBsADuAywDLQAABaXApBC0E8yF0cwCgAyLvJG5lbnRpYWxFAKBHIYACY2Zpb3MAPQQ/BEMEXQRyBHkAJGRyAADgNdgJ3WwibGVkAFMCTAQAAAAAVARtJWFsbFNxdWFyZQAAoPwlZSdyeVNtYWxsU3F1YXJlAACgqiVwA2UEAABpBAAAAABtBGYAAOA12D3dwSFsbACgACLyI2llcnRyZgCgMSFjAPIAcQQABkpUYWJjZGZnb3JzdIgEiwSOBJMElwSkBKcEqwStBLIE5QTqBGMAeQADZDuAPgA+QO0hbWFkoJMD3GNyImV2ZQAeYYABZWl5AJ0EoASjBOQhaWwiYXIAYwAcYRNkbwB0ACBhcgAA4DXYCt0AoNkicABmAADgNdg+3eUiYXRlcgADRUZHTFNUvwTIBM8E1QTZBOAEcSJ1YWwATKBlIuUhc3MAoNsidSRsbEVxdWFsAACgZyJyI2VhdGVyAACgoirlIXNzAKB3IuwkYW50RXF1YWwAoH4qaSJsZGUAAKBzImMAcgAA4DXYotwAoGsiAARBYWNmaW9zdfkE/QQFBQgFCwUTBSIFKwVSIkRjeQAqZAABY3QBBQQFZQBrAMdiXmDpIXJjJGFyAACgDCFsJWJlcnRTcGFjZQAAoAsh8AEYBQAAGwVmAACgDSHpJXpvbnRhbExpbmUAoAAlAAFjdCYFKAXyABIF8iFvayZhbQBwAEQBMQU5BW8AdwBuAEgAdQBtAPAAAAFxInVhbAAAoE8iAAdFSk9hY2RmZ21ub3N0dVMFVgVZBVwFYwVtBXAFcwV6BZAFtgXFBckFzQVjAHkAFWTsIWlnMmFjAHkAAWRjAHUAdABlADuAzQDNQAABaXlnBWwFcgBjADuAzgDOQBhkbwB0ADBhcgAAoBEhcgBhAHYAZQA7gMwAzEAAoREhYXB/BYsFAAFjZ4MFhQVyACphaSNuYXJ5SQAAoEghbABpAGUA8wD6AvQBlQUAAKUFZaAsIgABZ3KaBZ4F8iFhbACgKyLzI2VjdGlvbgCgwiJpI3NpYmxlAAABQ1SsBbEFbyJtbWEAAKBjIGkibWVzAACgYiCAAWdwdAC8Bb8FwwVvAG4ALmFmAADgNdhA3WEAmWNjAHIAAKAQIWkibGRlAChh6wHSBQAA1QVjAHkABmRsADuAzwDPQIACY2Zvc3UA4QXpBe0F8gX9BQABaXnlBegFcgBjADRhGWRyAADgNdgN3XAAZgAA4DXYQd3jAfcFAAD7BXIAAOA12KXc8iFjeQhk6yFjeQRkgANISmFjZm9zAAwGDwYSBhUGHQYhBiYGYwB5ACVkYwB5AAxk8CFwYZpjAAFleRkGHAbkIWlsNmEaZHIAAOA12A7dcABmAADgNdhC3WMAcgAA4DXYptyABUpUYWNlZmxtb3N0AD0GQAZDBl4GawZkB2gHcAd0B80H2gdjAHkACWQ7gDwAPECAAmNtbnByAEwGTwZSBlUGWwb1IXRlOWHiIWRhm2NnAACg6ifsI2FjZXRyZgCgEiFyAACgniGAAWFleQBkBmcGagbyIW9uPWHkIWlsO2EbZAABZnNvBjQHdAAABUFDREZSVFVWYXKABp4GpAbGBssG3AYDByEHwQIqBwABbnKEBowGZyVsZUJyYWNrZXQAAKDoJ/Ihb3cAoZAhQlKTBpcGYQByAACg5CHpJGdodEFycm93AKDGIWUjaWxpbmcAAKAII28A9QGqBgAAsgZiJWxlQnJhY2tldAAAoOYnbgDUAbcGAAC+BmUkZVZlY3RvcgAAoGEp5SJjdG9yQqDDIWEAcgAAoFkpbCJvb3IAAKAKI2kiZ2h0AAABQVbSBtcGciJyb3cAAKCUIeUiY3RvcgCgTikAAWVy4AbwBmUAAKGjIkFW5gbrBnIicm93AACgpCHlImN0b3IAoFopaSNhbmdsZQBCorIi+wYAAAAA/wZhAHIAAKDPKXEidWFsAACgtCJwAIABRFRWAAoHEQcYB+8kd25WZWN0b3IAoFEpZSRlVmVjdG9yAACgYCnlImN0b3JCoL8hYQByAACgWCnlImN0b3JCoLwhYQByAACgUilpAGcAaAB0AGEAcgByAG8A9wDMAnMAAANFRkdMU1Q/B0cHTgdUB1gHXwfxJXVhbEdyZWF0ZXIAoNoidSRsbEVxdWFsAACgZiJyI2VhdGVyAACgdiLlIXNzAKChKuwkYW50RXF1YWwAoH0qaSJsZGUAAKByInIAAOA12A/dZaDYIuYjdGFycm93AKDaIWkiZG90AD9hgAFucHcAege1B7kHZwAAAkxSbHKCB5QHmwerB+UhZnQAAUFSiAeNB3Iicm93AACg9SfpJGdodEFycm93AKD3J+kkZ2h0QXJyb3cAoPYn5SFmdAABYXLcAqEHaQBnAGgAdABhAHIAcgBvAPcA5wJpAGcAaAB0AGEAcgByAG8A9wDuAmYAAOA12EPdZQByAAABTFK/B8YHZSRmdEFycm93AACgmSHpJGdodEFycm93AKCYIYABY2h0ANMH1QfXB/IAWgYAoLAh8iFva0FhAKBqIgAEYWNlZmlvc3XpB+wH7gf/BwMICQgOCBEIcAAAoAUpeQAcZAABZGzyB/kHaSR1bVNwYWNlAACgXyBsI2ludHJmAACgMyFyAADgNdgQ3e4jdXNQbHVzAKATInAAZgAA4DXYRN1jAPIA/gecY4AESmFjZWZvc3R1ACEIJAgoCDUIgQiFCDsKQApHCmMAeQAKZGMidXRlAENhgAFhZXkALggxCDQI8iFvbkdh5CFpbEVhHWSAAWdzdwA7CGEIfQjhInRpdmWAAU1UVgBECEwIWQhlJWRpdW1TcGFjZQAAoAsgaABpAAABY25SCFMIawBTAHAAYQBjAOUASwhlAHIAeQBUAGgAaQDuAFQI9CFlZAABR0xnCHUIcgBlAGEAdABlAHIARwByAGUAYQB0AGUA8gDrBGUAcwBzAEwAZQBzAPMA2wdMImluZQAKYHIAAOA12BHdAAJCbnB0jAiRCJkInAhyImVhawAAoGAgwiZyZWFraW5nU3BhY2WgYGYAAKAVIUOq7CqzCMIIzQgAAOcIGwkAAAAAAAAtCQAAbwkAAIcJAACdCcAJGQoAADQKAAFvdbYIvAjuI2dydWVudACgYiJwIkNhcAAAoG0ibyh1YmxlVmVydGljYWxCYXIAAKAmIoABbHF4ANII1wjhCOUibWVudACgCSL1IWFsVKBgImkibGRlAADgQiI4A2kic3RzAACgBCJyI2VhdGVyAACjbyJFRkdMU1T1CPoIAgkJCQ0JFQlxInVhbAAAoHEidSRsbEVxdWFsAADgZyI4A3IjZWF0ZXIAAOBrIjgD5SFzcwCgeSLsJGFudEVxdWFsAOB+KjgDaSJsZGUAAKB1IvUhbXBEASAJJwnvI3duSHVtcADgTiI4A3EidWFsAADgTyI4A2UAAAFmczEJRgn0JFRyaWFuZ2xlQqLqIj0JAAAAAEIJYQByAADgzyk4A3EidWFsAACg7CJzAICibiJFR0xTVABRCVYJXAlhCWkJcSJ1YWwAAKBwInIjZWF0ZXIAAKB4IuUhc3MA4GoiOAPsJGFudEVxdWFsAOB9KjgDaSJsZGUAAKB0IuUic3RlZAABR0x1CX8J8iZlYXRlckdyZWF0ZXIA4KIqOAPlI3NzTGVzcwDgoSo4A/IjZWNlZGVzAKGAIkVTjwmVCXEidWFsAADgryo4A+wkYW50RXF1YWwAoOAiAAFlaaAJqQl2JmVyc2VFbGVtZW50AACgDCLnJWh0VHJpYW5nbGVCousitgkAAAAAuwlhAHIAAODQKTgDcSJ1YWwAAKDtIgABcXXDCeAJdSNhcmVTdQAAAWJwywnVCfMhZXRF4I8iOANxInVhbAAAoOIi5SJyc2V0ReCQIjgDcSJ1YWwAAKDjIoABYmNwAOYJ8AkNCvMhZXRF4IIi0iBxInVhbAAAoIgi4yJlZWRzgKGBIkVTVAD6CQAKBwpxInVhbAAA4LAqOAPsJGFudEVxdWFsAKDhImkibGRlAADgfyI4A+UicnNldEXggyLSIHEidWFsAACgiSJpImxkZQCAoUEiRUZUACIKJwouCnEidWFsAACgRCJ1JGxsRXF1YWwAAKBHImkibGRlAACgSSJlJXJ0aWNhbEJhcgAAoCQiYwByAADgNdip3GkAbABkAGUAO4DRANFAnWMAB0VhY2RmZ21vcHJzdHV2XgphCmgKcgp2CnoKgQqRCpYKqwqtCrsKyArNCuwhaWdSYWMAdQB0AGUAO4DTANNAAAFpeWwKcQpyAGMAO4DUANRAHmRiImxhYwBQYXIAAOA12BLdcgBhAHYAZQA7gNIA0kCAAWFlaQCHCooKjQpjAHIATGFnAGEAqWNjInJvbgCfY3AAZgAA4DXYRt3lI25DdXJseQABRFGeCqYKbyV1YmxlUXVvdGUAAKAcIHUib3RlAACgGCAAoFQqAAFjbLEKtQpyAADgNdiq3GEAcwBoADuA2ADYQGkAbAHACsUKZABlADuA1QDVQGUAcwAAoDcqbQBsADuA1gDWQGUAcgAAAUJQ0wrmCgABYXLXCtoKcgAAoD4gYQBjAAABZWvgCuIKAKDeI2UAdAAAoLQjYSVyZW50aGVzaXMAAKDcI4AEYWNmaGlsb3JzAP0KAwsFCwkLCwsMCxELIwtaC3IjdGlhbEQAAKACInkAH2RyAADgNdgT3WkApmOgY/Ujc01pbnVzsWAAAWlwFQsgC24AYwBhAHIAZQBwAGwAYQBuAOUACgVmAACgGSGAobsqZWlvACoLRQtJC+MiZWRlc4CheiJFU1QANAs5C0ALcSJ1YWwAAKCvKuwkYW50RXF1YWwAoHwiaSJsZGUAAKB+Im0AZQAAoDMgAAFkcE0LUQv1IWN0AKAPIm8jcnRpb24AYaA3ImwAAKAdIgABY2leC2ILcgAA4DXYq9yoYwACVWZvc2oLbwtzC3cLTwBUADuAIgAiQHIAAOA12BTdcABmAACgGiFjAHIAAOA12KzcAAZCRWFjZWZoaW9yc3WPC5MLlwupC7YL2AvbC90LhQyTDJoMowzhIXJyAKAQKUcAO4CuAK5AgAFjbnIAnQugC6ML9SF0ZVRhZwAAoOsncgB0oKAhbAAAoBYpgAFhZXkArwuyC7UL8iFvblhh5CFpbFZhIGR2oBwhZSJyc2UAAAFFVb8LzwsAAWxxwwvIC+UibWVudACgCyL1JGlsaWJyaXVtAKDLIXAmRXF1aWxpYnJpdW0AAKBvKXIAAKAcIW8AoWPnIWh0AARBQ0RGVFVWYewLCgwQDDIMNwxeDHwM9gIAAW5y8Av4C2clbGVCcmFja2V0AACg6SfyIW93AKGSIUJM/wsDDGEAcgAAoOUhZSRmdEFycm93AACgxCFlI2lsaW5nAACgCSNvAPUBFgwAAB4MYiVsZUJyYWNrZXQAAKDnJ24A1AEjDAAAKgxlJGVWZWN0b3IAAKBdKeUiY3RvckKgwiFhAHIAAKBVKWwib29yAACgCyMAAWVyOwxLDGUAAKGiIkFWQQxGDHIicm93AACgpiHlImN0b3IAoFspaSNhbmdsZQBCorMiVgwAAAAAWgxhAHIAAKDQKXEidWFsAACgtSJwAIABRFRWAGUMbAxzDO8kd25WZWN0b3IAoE8pZSRlVmVjdG9yAACgXCnlImN0b3JCoL4hYQByAACgVCnlImN0b3JCoMAhYQByAACgUykAAXB1iQyMDGYAAKAdIe4kZEltcGxpZXMAoHAp6SRnaHRhcnJvdwCg2yEAAWNongyhDHIAAKAbIQCgsSHsJGVEZWxheWVkAKD0KYAGSE9hY2ZoaW1vcXN0dQC/DMgMzAzQDOIM5gwKDQ0NFA0ZDU8NVA1YDQABQ2PDDMYMyCFjeSlkeQAoZEYiVGN5ACxkYyJ1dGUAWmEAorwqYWVpedgM2wzeDOEM8iFvbmBh5CFpbF5hcgBjAFxhIWRyAADgNdgW3e8hcnQAAkRMUlXvDPYM/QwEDW8kd25BcnJvdwAAoJMhZSRmdEFycm93AACgkCHpJGdodEFycm93AKCSIXAjQXJyb3cAAKCRIechbWGjY+EkbGxDaXJjbGUAoBgicABmAADgNdhK3XICHw0AAAAAIg10AACgGiLhIXJlgKGhJUlTVQAqDTINSg3uJXRlcnNlY3Rpb24AoJMidQAAAWJwNw1ADfMhZXRFoI8icSJ1YWwAAKCRIuUicnNldEWgkCJxInVhbAAAoJIibiJpb24AAKCUImMAcgAA4DXYrtxhAHIAAKDGIgACYmNtcF8Nag2ODZANc6DQImUAdABFoNAicSJ1YWwAAKCGIgABY2huDYkNZSJlZHMAgKF7IkVTVAB4DX0NhA1xInVhbAAAoLAq7CRhbnRFcXVhbACgfSJpImxkZQAAoH8iVABoAGEA9ADHCwCgESIAodEiZXOVDZ8NciJzZXQARaCDInEidWFsAACghyJlAHQAAKDRIoAFSFJTYWNmaGlvcnMAtQ27Db8NyA3ODdsN3w3+DRgOHQ4jDk8AUgBOADuA3gDeQMEhREUAoCIhAAFIY8MNxg1jAHkAC2R5ACZkAAFidcwNzQ0JYKRjgAFhZXkA1A3XDdoN8iFvbmRh5CFpbGJhImRyAADgNdgX3QABZWnjDe4N8gHoDQAA7Q3lImZvcmUAoDQiYQCYYwABY27yDfkNayNTcGFjZQAA4F8gCiDTInBhY2UAoAkg7CFkZYChPCJFRlQABw4MDhMOcSJ1YWwAAKBDInUkbGxFcXVhbAAAoEUiaSJsZGUAAKBIInAAZgAA4DXYS93pI3BsZURvdACg2yAAAWN0Jw4rDnIAAOA12K/c8iFva2Zh4QpFDlYOYA5qDgAAbg5yDgAAAAAAAAAAAAB5DnwOqA6zDgAADg8RDxYPGg8AAWNySA5ODnUAdABlADuA2gDaQHIAb6CfIeMhaXIAoEkpcgDjAVsOAABdDnkADmR2AGUAbGEAAWl5Yw5oDnIAYwA7gNsA20AjZGIibGFjAHBhcgAA4DXYGN1yAGEAdgBlADuA2QDZQOEhY3JqYQABZGl/Dp8OZQByAAABQlCFDpcOAAFhcokOiw5yAF9gYQBjAAABZWuRDpMOAKDfI2UAdAAAoLUjYSVyZW50aGVzaXMAAKDdI28AbgBQoMMi7CF1cwCgjiIAAWdwqw6uDm8AbgByYWYAAOA12EzdAARBREVUYWRwc78O0g7ZDuEOBQPqDvMOBw9yInJvdwDCoZEhyA4AAMwOYQByAACgEilvJHduQXJyb3cAAKDFIW8kd25BcnJvdwAAoJUhcSV1aWxpYnJpdW0AAKBuKWUAZQBBoKUiciJyb3cAAKClIW8AdwBuAGEAcgByAG8A9wAQA2UAcgAAAUxS+Q4AD2UkZnRBcnJvdwAAoJYh6SRnaHRBcnJvdwCglyFpAGyg0gNvAG4ApWPpIW5nbmFjAHIAAOA12LDcaSJsZGUAaGFtAGwAO4DcANxAgAREYmNkZWZvc3YALQ8xDzUPNw89D3IPdg97D4AP4SFzaACgqyJhAHIAAKDrKnkAEmThIXNobKCpIgCg5ioAAWVyQQ9DDwCgwSKAAWJ0eQBJD00Paw9hAHIAAKAWIGmgFiDjIWFsAAJCTFNUWA9cD18PZg9hAHIAAKAjIukhbmV8YGUkcGFyYXRvcgAAoFgnaSJsZGUAAKBAItQkaGluU3BhY2UAoAogcgAA4DXYGd1wAGYAAOA12E3dYwByAADgNdix3GQiYXNoAACgqiKAAmNlZm9zAI4PkQ+VD5kPng/pIXJjdGHkIWdlAKDAInIAAOA12BrdcABmAADgNdhO3WMAcgAA4DXYstwAAmZpb3OqD64Prw+0D3IAAOA12BvdnmNwAGYAAOA12E/dYwByAADgNdiz3IAEQUlVYWNmb3N1AMgPyw/OD9EP2A/gD+QP6Q/uD2MAeQAvZGMAeQAHZGMAeQAuZGMAdQB0AGUAO4DdAN1AAAFpedwP3w9yAGMAdmErZHIAAOA12BzdcABmAADgNdhQ3WMAcgAA4DXYtNxtAGwAeGEABEhhY2RlZm9z/g8BEAUQDRAQEB0QIBAkEGMAeQAWZGMidXRlAHlhAAFheQkQDBDyIW9ufWEXZG8AdAB7YfIBFRAAABwQbwBXAGkAZAB0AOgAVAhhAJZjcgAAoCghcABmAACgJCFjAHIAAOA12LXc4QtCEEkQTRAAAGcQbRByEAAAAAAAAAAAeRCKEJcQ8hD9EAAAGxEhETIROREAAD4RYwB1AHQAZQA7gOEA4UByImV2ZQADYYCiPiJFZGl1eQBWEFkQWxBgEGUQAOA+IjMDAKA/InIAYwA7gOIA4kB0AGUAO4C0ALRAMGRsAGkAZwA7gOYA5kByoGEgAOA12B7dcgBhAHYAZQA7gOAA4EAAAWVwfBCGEAABZnCAEIQQ8yF5bQCgNSHoAIMQaABhALFjAAFhcI0QWwAAAWNskRCTEHIAAWFnAACgPypkApwQAAAAALEQAKInImFkc3ajEKcQqRCuEG4AZAAAoFUqAKBcKmwib3BlAACgWCoAoFoqAKMgImVsbXJzersQvRDAEN0Q5RDtEACgpCllAACgICJzAGQAYaAhImEEzhDQENIQ1BDWENgQ2hDcEACgqCkAoKkpAKCqKQCgqykAoKwpAKCtKQCgrikAoK8pdAB2oB8iYgBkoL4iAKCdKQABcHTpEOwQaAAAoCIixWDhIXJyAKB8IwABZ3D1EPgQbwBuAAVhZgAA4DXYUt0Ao0giRWFlaW9wBxEJEQ0RDxESERQRAKBwKuMhaXIAoG8qAKBKImQAAKBLInMAJ2DyIW94ZaBIIvEADhFpAG4AZwA7gOUA5UCAAWN0eQAmESoRKxFyAADgNdi23CpgbQBwAGWgSCLxAPgBaQBsAGQAZQA7gOMA40BtAGwAO4DkAORAAAFjaUERRxFvAG4AaQBuAPQA6AFuAHQAAKARKgAITmFiY2RlZmlrbG5vcHJzdWQRaBGXEZ8RpxGrEdIR1hErEjASexKKEn0RThNbE3oTbwB0AACg7SoAAWNybBGJEWsAAAJjZXBzdBF4EX0RghHvIW5nAKBMInAjc2lsb24A9mNyImltZQAAoDUgaQBtAGWgPSJxAACgzSJ2AY0RkRFlAGUAAKC9ImUAZABnoAUjZQAAoAUjcgBrAHSgtSPiIXJrAKC2IwABb3mjEaYRbgDnAHcRMWTxIXVvAKAeIIACY21wcnQAtBG5Eb4RwRHFEeEhdXPloDUi5ABwInR5dgAAoLApcwDpAH0RbgBvAPUA6gCAAWFodwDLEcwRzhGyYwCgNiHlIWVuAKBsInIAAOA12B/dZwCAA2Nvc3R1dncA4xHyEQUSEhIhEiYSKRKAAWFpdQDpEesR7xHwAKMFcgBjAACg7yVwAACgwyKAAWRwdAD4EfwRABJvAHQAAKAAKuwhdXMAoAEqaSJtZXMAAKACKnECCxIAAAAADxLjIXVwAKAGKmEAcgAAoAUm8iNpYW5nbGUAAWR1GhIeEu8hd24AoL0lcAAAoLMlcCJsdXMAAKAEKmUA5QBCD+UAkg9hInJvdwAAoA0pgAFha28ANhJoEncSAAFjbjoSZRJrAIABbHN0AEESRxJNEm8jemVuZ2UAAKDrKXEAdQBhAHIA5QBcBPIjaWFuZ2xlgKG0JWRscgBYElwSYBLvIXduAKC+JeUhZnQAoMIlaSJnaHQAAKC4JWsAAKAjJLEBbRIAAHUSsgFxEgAAcxIAoJIlAKCRJTQAAKCTJWMAawAAoIglAAFlb38ShxJx4D0A5SD1IWl2AOBhIuUgdAAAoBAjAAJwdHd4kRKVEpsSnxJmAADgNdhT3XSgpSJvAG0AAKClIvQhaWUAoMgiAAZESFVWYmRobXB0dXayEsES0RLgEvcS+xIKExoTHxMjEygTNxMAAkxSbHK5ErsSvRK/EgCgVyUAoFQlAKBWJQCgUyUAolAlRFVkdckSyxLNEs8SAKBmJQCgaSUAoGQlAKBnJQACTFJsctgS2hLcEt4SAKBdJQCgWiUAoFwlAKBZJQCjUSVITFJobHLrEu0S7xLxEvMS9RIAoGwlAKBjJQCgYCUAoGslAKBiJQCgXyVvAHgAAKDJKQACTFJscgITBBMGEwgTAKBVJQCgUiUAoBAlAKAMJQCiACVEVWR1EhMUExYTGBMAoGUlAKBoJQCgLCUAoDQlaSJudXMAAKCfIuwhdXMAoJ4iaSJtZXMAAKCgIgACTFJsci8TMRMzEzUTAKBbJQCgWCUAoBglAKAUJQCjAiVITFJobHJCE0QTRhNIE0oTTBMAoGolAKBhJQCgXiUAoDwlAKAkJQCgHCUAAWV2UhNVE3YA5QD5AGIAYQByADuApgCmQAACY2Vpb2ITZhNqE24TcgAA4DXYt9xtAGkAAKBPIG0A5aA9IogRbAAAoVwAYmh0E3YTAKDFKfMhdWIAoMgnbAF+E4QTbABloCIgdAAAoCIgcAAAoU4iRWWJE4sTAKCuKvGgTyI8BeEMqRMAAN8TABQDFB8UAAAjFDQUAAAAAIUUAAAAAI0UAAAAANcU4xT3FPsUAACIFQAAlhWAAWNwcgCuE7ET1RP1IXRlB2GAoikiYWJjZHMAuxO/E8QTzhPSE24AZAAAoEQqciJjdXAAAKBJKgABYXXIE8sTcAAAoEsqcAAAoEcqbwB0AACgQCoA4CkiAP4AAWVv2RPcE3QAAKBBIO4ABAUAAmFlaXXlE+8T9RP4E/AB6hMAAO0TcwAAoE0qbwBuAA1hZABpAGwAO4DnAOdAcgBjAAlhcABzAHOgTCptAACgUCpvAHQAC2GAAWRtbgAIFA0UEhRpAGwAO4C4ALhAcCJ0eXYAAKCyKXQAAIGiADtlGBQZFKJAcgBkAG8A9ABiAXIAAOA12CDdgAFjZWkAKBQqFDIUeQBHZGMAawBtoBMn4SFyawCgEyfHY3IAAKPLJUVjZWZtcz8UQRRHFHcUfBSAFACgwykAocYCZWxGFEkUcQAAoFciZQBhAlAUAAAAAGAUciJyb3cAAAFsclYUWhTlIWZ0AKC6IWkiZ2h0AACguyGAAlJTYWNkAGgUaRRrFG8UcxSuYACgyCRzAHQAAKCbIukhcmMAoJoi4SFzaACgnSJuImludAAAoBAqaQBkAACg7yrjIWlyAKDCKfUhYnN1oGMmaQB0AACgYybsApMUmhS2FAAAwxRvAG4AZaA6APGgVCKrAG0CnxQAAAAAoxRhAHSgLABAYAChASJmbKcUqRTuABMNZQAAAW14rhSyFOUhbnQAoAEiZQDzANIB5wG6FAAAwBRkoEUibwB0AACgbSpuAPQAzAGAAWZyeQDIFMsUzhQA4DXYVN1vAOQA1wEAgakAO3MeAdMUcgAAoBchAAFhb9oU3hRyAHIAAKC1IXMAcwAAoBcnAAFjdeYU6hRyAADgNdi43AABYnDuFPIUZaDPKgCg0SploNAqAKDSKuQhb3QAoO8igANkZWxwcnZ3AAYVEBUbFSEVRBVlFYQV4SFycgABbHIMFQ4VAKA4KQCgNSlwAhYVAAAAABkVcgAAoN4iYwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWlsN2E6ZHIAAOA12CjdciJlZW4AOGFjAHkARWRjAHkAXGRwAGYAAOA12FzdYwByAADgNdjA3IALQUJFSGFiY2RlZmdoamxtbm9wcnN0dXYAXhxtHHEcdRx5HN8cBx0dHTwd3B3tHfEdAR4EHh0eLB5FHrwewx7hHgkfPR9LH4ABYXJ0AGQcZxxpHHIA8gBvB/IAxQLhIWlsAKAbKeEhcnIAoA4pZ6BmIgCgiyphAHIAAKBiKWMJjRwAAJAcAACVHAAAAAAAAAAAAACZHJwcAACmHKgcrRwAANIc9SF0ZTph7SJwdHl2AKC0KXIAYQDuAFoG4iFkYbtjZwAAoegnZGyhHKMcAKCRKeUAiwYAoIUqdQBvADuAqwCrQHIAgKOQIWJmaGxwc3QAuhy/HMIcxBzHHMoczhxmoOQhcwAAoB8pcwAAoB0p6wCyGnAAAKCrIWwAAKA5KWkAbQAAoHMpbAAAoKIhAKGrKmFl1hzaHGkAbAAAoBkpc6CtKgDgrSoA/oABYWJyAOUc6RztHHIAcgAAoAwpcgBrAACgcicAAWFr8Rz4HGMAAAFla/Yc9xx7YFtgAAFlc/wc/hwAoIspbAAAAWR1Ax0FHQCgjykAoI0pAAJhZXV5Dh0RHRodHB3yIW9uPmEAAWRpFR0YHWkAbAA8YewAowbiAPccO2QAAmNxcnMkHScdLB05HWEAAKA2KXUAbwDyoBwgqhEAAWR1MB00HeghYXIAoGcpcyJoYXIAAKBLKWgAAKCyIQCiZCJmZ3FzRB1FB5Qdnh10AIACYWhscnQATh1WHWUdbB2NHXIicm93AHSgkCFhAOkAzxxhI3Jwb29uAAABZHVeHWId7yF3bgCgvSFwAACgvCHlJGZ0YXJyb3dzAKDHIWkiZ2h0AIABYWhzAHUdex2DHXIicm93APOglCGdBmEAcgBwAG8AbwBuAPMAzgtxAHUAaQBnAGEAcgByAG8A9wBlGugkcmVldGltZXMAoMsi8aFkIk0HAACaHWwAYQBuAPQAXgcAon0qY2Rnc6YdqR2xHbcdYwAAoKgqbwB0AG+gfypyoIEqAKCDKmXg2iIA/nMAAKCTKoACYWRlZ3MAwB3GHcod1h3ZHXAAcAByAG8A+ACmHG8AdAAAoNYicQAAAWdxzx3SHXQA8gBGB2cAdADyAHQcdADyAFMHaQDtAGMHgAFpbHIA4h3mHeod8yFodACgfClvAG8A8gDKBgDgNdgp3UWgdiIAoJEqYQH1Hf4dcgAAAWR1YB35HWygvCEAoGopbABrAACghCVjAHkAWWQAomoiYWNodAweDx4VHhkecgDyAGsdbwByAG4AZQDyAGAW4SFyZACgaylyAGkAAKD6JQABaW8hHiQe5CFvdEBh9SFzdGGgsCPjIWhlAKCwIwACRWFlczMeNR48HkEeAKBoInAAcKCJKvIhb3gAoIkqcaCHKvGghyo0HmkAbQAAoOYiAARhYm5vcHR3elIeXB5fHoUelh6mHqsetB4AAW5yVh5ZHmcAAKDsJ3IAAKD9IXIA6wCwBmcAgAFsbXIAZh52Hnse5SFmdAABYXKIB2weaQBnAGgAdABhAHIAcgBvAPcAkwfhInBzdG8AoPwnaQBnAGgAdABhAHIAcgBvAPcAmgdwI2Fycm93AAABbHKNHpEeZQBmAPQAxhxpImdodAAAoKwhgAFhZmwAnB6fHqIecgAAoIUpAOA12F3ddQBzAACgLSppIm1lcwAAoDQqYQGvHrMecwB0AACgFyLhAIoOZaHKJbkeRhLuIWdlAKDKJWEAcgBsoCgAdAAAoJMpgAJhY2htdADMHs8e1R7bHt0ecgDyAJ0GbwByAG4AZQDyANYWYQByAGSgyyEAoG0pAKAOIHIAaQAAoL8iAANhY2hpcXTrHu8e1QfzHv0eBh/xIXVvAKA5IHIAAOA12MHcbQDloXIi+h4AAPweAKCNKgCgjyoAAWJ19xwBH28AcqAYIACgGiDyIW9rQmEAhDwAO2NkaGlscXJCBhcfxh0gHyQfKB8sHzEfAAFjaRsfHR8AoKYqcgAAoHkqcgBlAOUAkx3tIWVzAKDJIuEhcnIAoHYpdSJlc3QAAKB7KgABUGk1HzkfYQByAACglillocMlAgdfEnIAAAFkdUIfRx9zImhhcgAAoEop6CFhcgCgZikAAWVuTx9WH3IjdG5lcXEAAOBoIgD+xQBUHwAHRGFjZGVmaGlsbm9wc3VuH3Ifoh+rH68ftx+7H74f5h/uH/MfBwj/HwsgxCFvdACgOiIAAmNscHJ5H30fiR+eH3IAO4CvAK9AAAFldIEfgx8AoEImZaAgJ3MAZQAAoCAnc6CmIXQAbwCAoaYhZGx1AJQfmB+cH28AdwDuAHkDZQBmAPQA6gbwAOkO6yFlcgCgriUAAW95ph+qH+0hbWEAoCkqPGThIXNoAKAUIOElc3VyZWRhbmdsZQCgISJyAADgNdgq3W8AAKAnIYABY2RuAMQfyR/bH3IAbwA7gLUAtUBhoiMi0B8AANMf1x9zAPQAKxFpAHIAAKDwKm8AdAA7gLcAt0B1AHMA4qESIh4TAADjH3WgOCIAoCoqYwHqH+0fcAAAoNsq8gB+GnAAbAB1APMACAgAAWRw9x/7H+UhbHMAoKciZgAA4DXYXt0AAWN0AyAHIHIAAOA12MLc8CFvcwCgPiJsobwDECAVIPQiaW1hcACguCJhAPAAEyAADEdMUlZhYmNkZWZnaGlqbG1vcHJzdHV2dzwgRyBmIG0geSCqILgg2iDeIBEhFSEyIUMhTSFQIZwhnyHSIQAiIyKLIrEivyIUIwABZ3RAIEMgAODZIjgD9uBrItIgBwmAAWVsdABNIF8gYiBmAHQAAAFhclMgWCByInJvdwAAoM0h6SRnaHRhcnJvdwCgziEA4NgiOAP24Goi0iBfCekkZ2h0YXJyb3cAoM8hAAFEZHEgdSDhIXNoAKCvIuEhc2gAoK4igAJiY25wdACCIIYgiSCNIKIgbABhAACgByL1IXRlRGFnAADgICLSIACiSSJFaW9wlSCYIJwgniAA4HAqOANkAADgSyI4A3MASWFyAG8A+AAyCnUAcgBhoG4mbADzoG4mmwjzAa8gAACzIHAAO4CgAKBAbQBwAOXgTiI4AyoJgAJhZW91eQDBIMogzSDWINkg8AHGIAAAyCAAoEMqbwBuAEhh5CFpbEZhbgBnAGSgRyJvAHQAAOBtKjgDcAAAoEIqPWThIXNoAKATIACjYCJBYWRxc3jpIO0g+SD+IAIhDCFyAHIAAKDXIXIAAAFocvIg9SBrAACgJClvoJch9wAGD28AdAAA4FAiOAN1AGkA9gC7CAABZWkGIQohYQByAACgKCntAN8I6SFzdPOgBCLlCHIAAOA12CvdAAJFZXN0/wgcISshLiHxoXEiIiEAABMJ8aFxIgAJAAAnIWwAYQBuAPQAEwlpAO0AGQlyoG8iAKBvIoABQWFwADghOyE/IXIA8gBeIHIAcgAAoK4hYQByAACg8ipzogsiSiEAAAAAxwtkoPwiAKD6ImMAeQBaZIADQUVhZGVzdABcIV8hYiFmIWkhkyGWIXIA8gBXIADgZiI4A3IAcgAAoJohcgAAoCUggKFwImZxcwBwIYQhjiF0AAABYXJ1IXohcgByAG8A9wBlIWkAZwBoAHQAYQByAHIAbwD3AD4h8aFwImAhAACKIWwAYQBuAPQAZwlz4H0qOAMAoG4iaQDtAG0JcqBuImkA5aDqIkUJaQDkADoKAAFwdKMhpyFmAADgNdhf3YCBrAA7aW4AriGvIcchrEBuAIChCSJFZHYAtyG6Ib8hAOD5IjgDbwB0AADg9SI4A+EB1gjEIcYhAKD3IgCg9iJpAHagDCLhAagJzyHRIQCg/iIAoP0igAFhb3IA2CHsIfEhcgCAoSYiYXN0AOAh5SHpIWwAbABlAOwAywhsAADg/SrlIADgAiI4A2wiaW50AACgFCrjoYAi9yEAAPohdQDlAJsJY+CvKjgDZaCAIvEAkwkAAkFhaXQHIgoiFyIeInIA8gBsIHIAcgAAoZshY3cRIhQiAOAzKTgDAOCdITgDZyRodGFycm93AACgmyFyAGkA5aDrIr4JgANjaGltcHF1AC8iPCJHIpwhTSJQIloigKGBImNlcgA2Iv0JOSJ1AOUABgoA4DXYw9zvIXJ0bQKdIQAAAABEImEAcgDhAOEhbQBloEEi8aBEIiYKYQDyAMsIcwB1AAABYnBWIlgi5QDUCeUA3wmAAWJjcABgInMieCKAoYQiRWVzAGci7glqIgDgxSo4A2UAdABl4IIi0iBxAPGgiCJoImMAZaCBIvEA/gmAoYUiRWVzAH8iFgqCIgDgxio4A2UAdABl4IMi0iBxAPGgiSKAIgACZ2lscpIilCKaIpwi7AAMCWwAZABlADuA8QDxQOcAWwlpI2FuZ2xlAAABbHKkIqoi5SFmdGWg6iLxAEUJaSJnaHQAZaDrIvEAvgltoL0DAKEjAGVzuCK8InIAbwAAoBYhcAAAoAcggARESGFkZ2lscnMAziLSItYi2iLeIugi7SICIw8j4SFzaACgrSLhIXJyAKAEKXAAAOBNItIg4SFzaACgrCIAAWV04iLlIgDgZSLSIADgPgDSIG4iZmluAACg3imAAUFldADzIvci+iJyAHIAAKACKQDgZCLSIHLgPADSIGkAZQAA4LQi0iAAAUF0BiMKI3IAcgAAoAMp8iFpZQDgtSLSIGkAbQAA4Dwi0iCAAUFhbgAaIx4jKiNyAHIAAKDWIXIAAAFociMjJiNrAACgIylvoJYh9wD/DuUhYXIAoCcpUxJqFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVCMAAF4jaSN/I4IjjSOeI8AUAAAAAKYjwCMAANoj3yMAAO8jHiQvJD8kRCQAAWNzVyNsFHUAdABlADuA8wDzQAABaXlhI2cjcgBjoJoiO4D0APRAPmSAAmFiaW9zAHEjdCN3I3EBeiNzAOgAdhTsIWFjUWF2AACgOCrvIWxkAKC8KewhaWdTYQABY3KFI4kjaQByAACgvykA4DXYLN1vA5QjAAAAAJYjAACcI24A22JhAHYAZQA7gPIA8kAAoMEpAAFibaEjjAphAHIAAKC1KQACYWNpdKwjryO6I70jcgDyAFkUAAFpcrMjtiNyAACgvinvIXNzAKC7KW4A5QDZCgCgwCmAAWFlaQDFI8gjyyNjAHIATWFnAGEAyWOAAWNkbgDRI9Qj1iPyIW9uv2MAoLYpdQDzAHgBcABmAADgNdhg3YABYWVsAOQj5yPrI3IAAKC3KXIAcAAAoLkpdQDzAHwBAKMoImFkaW9zdvkj/CMPJBMkFiQbJHIA8gBeFIChXSplZm0AAyQJJAwkcgBvoDQhZgAAoDQhO4CqAKpAO4C6ALpA5yFvZgCgtiJyAACgVipsIm9wZQAAoFcqAKBbKoABY2xvACMkJSQrJPIACCRhAHMAaAA7gPgA+EBsAACgmCJpAGwBMyQ4JGQAZQA7gPUA9UBlAHMAYaCXInMAAKA2Km0AbAA7gPYA9kDiIWFyAKA9I+EKXiQAAHokAAB8JJQkAACYJKkkAAAAALUkEQsAAPAkAAAAAAQleiUAAIMlcgCAoSUiYXN0AGUkbyQBCwCBtgA7bGokayS2QGwAZQDsABgDaQJ1JAAAAAB4JG0AAKDzKgCg/Sp5AD9kcgCAAmNpbXB0AIUkiCSLJJkSjyRuAHQAJWBvAGQALmBpAGwAAKAwIOUhbmsAoDEgcgAA4DXYLd2AAWltbwCdJKAkpCR2oMYD1WNtAGEA9AD+B24AZQAAoA4m9KHAA64kAAC0JGMjaGZvcmsAAKDUItZjAAFhdbgkxCRuAAABY2u9JMIkawBooA8hAKAOIfYAaRpzAACkKwBhYmNkZW1zdNMkIRPXJNsk4STjJOck6yTjIWlyAKAjKmkAcgAAoCIqAAFvdYsW3yQAoCUqAKByKm4AO4CxALFAaQBtAACgJip3AG8AAKAnKoABaXB1APUk+iT+JO4idGludACgFSpmAADgNdhh3W4AZAA7gKMAo0CApHoiRWFjZWlub3N1ABMlFSUYJRslTCVRJVklSSV1JQCgsypwAACgtyp1AOUAPwtjoK8qgKJ6ImFjZW5zACclLSU0JTYlSSVwAHAAcgBvAPgAFyV1AHIAbAB5AGUA8QA/C/EAOAuAAWFlcwA8JUElRSXwInByb3gAoLkqcQBxAACgtSppAG0AAKDoImkA7QBEC20AZQDzoDIgIguAAUVhcwBDJVclRSXwAEAlgAFkZnAATwtfJXElgAFhbHMAZSVpJW0l7CFhcgCgLiPpIW5lAKASI/UhcmYAoBMjdKAdIu8AWQvyIWVsAKCwIgABY2l9JYElcgAA4DXYxdzIY24iY3NwAACgCCAAA2Zpb3BzdZElKxuVJZolnyWkJXIAAOA12C7dcABmAADgNdhi3XIiaW1lAACgVyBjAHIAAOA12MbcgAFhZW8AqiW6JcAldAAAAWVpryW2JXIAbgBpAG8AbgDzABkFbgB0AACgFipzAHQAZaA/APEACRj0AG0LgApBQkhhYmNkZWZoaWxtbm9wcnN0dXgA4yXyJfYl+iVpJpAmpia9JtUm5ib4JlonaCdxJ3UnnietJ7EnyCfiJ+cngAFhcnQA6SXsJe4lcgDyAJkM8gD6AuEhaWwAoBwpYQByAPIA3BVhAHIAAKBkKYADY2RlbnFydAAGJhAmEyYYJiYmKyZaJgABZXUKJg0mAOA9IjEDdABlAFVhaQDjACAN7SJwdHl2AKCzKWcAgKHpJ2RlbAAgJiImJCYAoJIpAKClKeUA9wt1AG8AO4C7ALtAcgAApZIhYWJjZmhscHN0dz0mQCZFJkcmSiZMJk4mUSZVJlgmcAAAoHUpZqDlIXMAAKAgKQCgMylzAACgHinrALka8ACVHmwAAKBFKWkAbQAAoHQpbAAAoKMhAKCdIQABYWleJmImaQBsAACgGilvAG6gNiJhAGwA8wB2C4ABYWJyAG8mciZ2JnIA8gAvEnIAawAAoHMnAAFha3omgSZjAAABZWt/JoAmfWBdYAABZXOFJocmAKCMKWwAAAFkdYwmjiYAoI4pAKCQKQACYWV1eZcmmiajJqUm8iFvbllhAAFkaZ4moSZpAGwAV2HsAA8M4gCAJkBkAAJjbHFzrSawJrUmuiZhAACgNylkImhhcgAAoGkpdQBvAPKgHSCjAWgAAKCzIYABYWNnAMMm0iaUC2wAgKEcIWlwcwDLJs4migxuAOUAoAxhAHIA9ADaC3QAAKCtJYABaWxyANsm3ybjJvMhaHQAoH0pbwBvAPIANgwA4DXYL90AAWFv6ib1JnIAAAFkde8m8SYAoMEhbKDAIQCgbCl2oMED8WOAAWducwD+Jk4nUCdoAHQAAANhaGxyc3QKJxInISc1Jz0nRydyInJvdwB0oJIhYQDpAFYmYSNycG9vbgAAAWR1GiceJ28AdwDuAPAmcAAAoMAh5SFmdAABYWgnJy0ncgByAG8AdwDzAAkMYQByAHAAbwBvAG4A8wATBGklZ2h0YXJyb3dzAACgySFxAHUAaQBnAGEAcgByAG8A9wBZJugkcmVldGltZXMAoMwiZwDaYmkAbgBnAGQAbwB0AHMAZQDxABwYgAFhaG0AYCdjJ2YncgDyAAkMYQDyABMEAKAPIG8idXN0AGGgsSPjIWhlAKCxI+0haWQAoO4qAAJhYnB0fCeGJ4knmScAAW5ygCeDJ2cAAKDtJ3IAAKD+IXIA6wAcDIABYWZsAI8nkieVJ3IAAKCGKQDgNdhj3XUAcwAAoC4qaSJtZXMAAKA1KgABYXCiJ6gncgBnoCkAdAAAoJQp7yJsaW50AKASKmEAcgDyADwnAAJhY2hxuCe8J6EMwCfxIXVvAKA6IHIAAOA12MfcAAFidYAmxCdvAPKgGSCoAYABaGlyAM4n0ifWJ3IAZQDlAE0n7SFlcwCgyiJpAIChuSVlZmwAXAxjEt4n9CFyaQCgzinsInVoYXIAoGgpAKAeIWENBSgJKA0oSyhVKIYoAACLKLAoAAAAAOMo5ygAABApJCkxKW0pcSmHKaYpAACYKgAAAACxKmMidXRlAFthcQB1AO8ABR+ApHsiRWFjZWlucHN5ABwoHignKCooLygyKEEoRihJKACgtCrwASMoAAAlKACguCpvAG4AYWF1AOUAgw1koLAqaQBsAF9hcgBjAF1hgAFFYXMAOCg6KD0oAKC2KnAAAKC6KmkAbQAAoOki7yJsaW50AKATKmkA7QCIDUFkbwB0AGKixSKRFgAAAABTKACgZiqAA0FhY21zdHgAYChkKG8ocyh1KHkogihyAHIAAKDYIXIAAAFocmkoayjrAJAab6CYIfcAzAd0ADuApwCnQGkAO2D3IWFyAKApKW0AAAFpbn4ozQBuAHUA8wDOAHQAAKA2J3IA7+A12DDdIxkAAmFjb3mRKJUonSisKHIAcAAAoG8mAAFoeZkonChjAHkASWRIZHIAdABtAqUoAAAAAKgoaQDkAFsPYQByAGEA7ABsJDuArQCtQAABZ22zKLsobQBhAAChwwNmdroouijCY4CjPCJkZWdsbnByAMgozCjPKNMo1yjaKN4obwB0AACgairxoEMiCw5FoJ4qAKCgKkWgnSoAoJ8qZQAAoEYi7CF1cwCgJCrhIXJyAKByKWEAcgDyAPwMAAJhZWl07Sj8KAEpCCkAAWxz8Sj4KGwAcwBlAHQAbQDpAH8oaABwAACgMyrwImFyc2wAoOQpAAFkbFoPBSllAACgIyNloKoqc6CsKgDgrCoA/oABZmxwABUpGCkfKfQhY3lMZGKgLwBhoMQpcgAAoD8jZgAA4DXYZN1hAAABZHIoKRcDZQBzAHWgYCZpAHQAAKBgJoABY3N1ADYpRilhKQABYXU6KUApcABzoJMiAOCTIgD+cABzoJQiAOCUIgD+dQAAAWJwSylWKQChjyJlcz4NUCllAHQAZaCPIvEAPw0AoZAiZXNIDVspZQB0AGWgkCLxAEkNAKGhJWFmZilbBHIAZQFrKVwEAKChJWEAcgDyAAMNAAJjZW10dyl7KX8pgilyAADgNdjI3HQAbQDuAM4AaQDsAAYpYQByAOYAVw0AAWFyiimOKXIA5qAGJhESAAFhbpIpoylpImdodAAAAWVwmSmgKXAAcwBpAGwAbwDuANkXaADpAKAkcwCvYIACYmNtbnAArin8KY4NJSooKgCkgiJFZGVtbnByc7wpvinCKcgpzCnUKdgp3CkAoMUqbwB0AACgvSpkoIYibwB0AACgwyr1IWx0AKDBKgABRWXQKdIpAKDLKgCgiiLsIXVzAKC/KuEhcnIAoHkpgAFlaXUA4inxKfQpdAAAoYIiZW7oKewpcQDxoIYivSllAHEA8aCKItEpbQAAoMcqAAFicPgp+ikAoNUqAKDTKmMAgKJ7ImFjZW5zAAcqDSoUKhYqRihwAHAAcgBvAPgAIyh1AHIAbAB5AGUA8QCDDfEAfA2AAWFlcwAcKiIqPShwAHAAcgBvAPgAPChxAPEAOShnAACgaiYApoMiMTIzRWRlaGxtbnBzPCo/KkIqRSpHKlIqWCpjKmcqaypzKncqO4C5ALlAO4CyALJAO4CzALNAAKDGKgABb3NLKk4qdAAAoL4qdQBiAACg2CpkoIcibwB0AACgxCpzAAABb3VdKmAqbAAAoMknYgAAoNcq4SFycgCgeyn1IWx0AKDCKgABRWVvKnEqAKDMKgCgiyLsIXVzAKDAKoABZWl1AH0qjCqPKnQAAKGDImVugyqHKnEA8aCHIkYqZQBxAPGgiyJwKm0AAKDIKgABYnCTKpUqAKDUKgCg1iqAAUFhbgCdKqEqrCpyAHIAAKDZIXIAAAFocqYqqCrrAJUab6CZIfcAxQf3IWFyAKAqKWwAaQBnADuA3wDfQOELzyrZKtwq6SrsKvEqAAD1KjQrAAAAAAAAAAAAAEwrbCsAAHErvSsAAAAAAADRK3IC1CoAAAAA2CrnIWV0AKAWI8RjcgDrAOUKgAFhZXkA4SrkKucq8iFvbmVh5CFpbGNhQmRvAPQAIg5sInJlYwAAoBUjcgAA4DXYMd0AAmVpa2/7KhIrKCsuK/IBACsAAAkrZQAAATRm6g0EK28AcgDlAOsNYQBzorgDECsAAAAAEit5AG0A0WMAAWNuFislK2sAAAFhcxsrIStwAHAAcgBvAPgAFw5pAG0AAKA8InMA8AD9DQABYXMsKyEr8AAXDnIAbgA7gP4A/kDsATgrOyswG2QA5QBnAmUAcwCAgdcAO2JkAEMrRCtJK9dAYaCgInIAAKAxKgCgMCqAAWVwcwBRK1MraSvhAAkh4qKkIlsrXysAAAAAYytvAHQAAKA2I2kAcgAAoPEqb+A12GXdcgBrAACg2irhAHgociJpbWUAAKA0IIABYWlwAHYreSu3K2QA5QC+DYADYWRlbXBzdACFK6MrmiunK6wrsCuzK24iZ2xlAACitSVkbHFykCuUK5ornCvvIXduAKC/JeUhZnRloMMl8QACBwCgXCJpImdodABloLkl8QBdDG8AdAAAoOwlaSJudXMAAKA6KuwhdXMAoDkqYgAAoM0p6SFtZQCgOyrlInppdW0AoOIjgAFjaHQAwivKK80rAAFyecYrySsA4DXYydxGZGMAeQBbZPIhb2tnYQABaW/UK9creAD0ANERaCJlYWQAAAFsct4r5ytlAGYAdABhAHIAcgBvAPcAXQbpJGdodGFycm93AKCgIQAJQUhhYmNkZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");

//#endregion
//#region node_modules/htmlparser2/node_modules/entities/dist/esm/generated/decode-data-xml.js
	const xmlDecodeTree = /* @__PURE__ */ decodeBase64("AAJhZ2xxBwARABMAFQBtAg0AAAAAAA8AcAAmYG8AcwAnYHQAPmB0ADxg9SFvdCJg");

//#endregion
//#region node_modules/htmlparser2/node_modules/entities/dist/esm/internal/bin-trie-flags.js
/**
	* Bit flags & masks for the binary trie encoding used for entity decoding.
	*
	* Bit layout (16 bits total):
	* 15..14 VALUE_LENGTH   (+1 encoding; 0 => no value)
	* 13     FLAG13.        If valueLength>0: semicolon required flag (implicit ';').
	*                       If valueLength==0: compact run flag.
	* 12..7  BRANCH_LENGTH  Branch length (0 => single branch in 6..0 if jumpOffset==char) OR run length (when compact run)
	* 6..0   JUMP_TABLE     Jump offset (jump table) OR single-branch char code OR first run char
	*/
	var BinTrieFlags$1;
	(function(BinTrieFlags) {
		BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
		BinTrieFlags[BinTrieFlags["FLAG13"] = 8192] = "FLAG13";
		BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
		BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
	})(BinTrieFlags$1 || (BinTrieFlags$1 = {}));

//#endregion
//#region node_modules/htmlparser2/node_modules/entities/dist/esm/decode.js
	var CharCodes$2;
	(function(CharCodes) {
		CharCodes[CharCodes["NUM"] = 35] = "NUM";
		CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
		CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
		CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
		CharCodes[CharCodes["NINE"] = 57] = "NINE";
		CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
		CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
		CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
		CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
		CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
		CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
		CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
	})(CharCodes$2 || (CharCodes$2 = {}));
	/** Bit that needs to be set to convert an upper case ASCII character to lower case */
	const TO_LOWER_BIT$1 = 32;
	function isNumber$1(code) {
		return code >= CharCodes$2.ZERO && code <= CharCodes$2.NINE;
	}
	function isHexadecimalCharacter$1(code) {
		return code >= CharCodes$2.UPPER_A && code <= CharCodes$2.UPPER_F || code >= CharCodes$2.LOWER_A && code <= CharCodes$2.LOWER_F;
	}
	function isAsciiAlphaNumeric$2(code) {
		return code >= CharCodes$2.UPPER_A && code <= CharCodes$2.UPPER_Z || code >= CharCodes$2.LOWER_A && code <= CharCodes$2.LOWER_Z || isNumber$1(code);
	}
	/**
	* Checks if the given character is a valid end character for an entity in an attribute.
	*
	* Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
	* See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
	*/
	function isEntityInAttributeInvalidEnd$1(code) {
		return code === CharCodes$2.EQUALS || isAsciiAlphaNumeric$2(code);
	}
	var EntityDecoderState$1;
	(function(EntityDecoderState) {
		EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
		EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
		EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
		EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
		EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
	})(EntityDecoderState$1 || (EntityDecoderState$1 = {}));
	var DecodingMode$1;
	(function(DecodingMode) {
		/** Entities in text nodes that can end with any character. */
		DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
		/** Only allow entities terminated with a semicolon. */
		DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
		/** Entities in attributes have limitations on ending characters. */
		DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
	})(DecodingMode$1 || (DecodingMode$1 = {}));
	/**
	* Token decoder with support of writing partial entities.
	*/
	var EntityDecoder$1 = class {
		constructor(decodeTree, emitCodePoint, errors) {
			this.decodeTree = decodeTree;
			this.emitCodePoint = emitCodePoint;
			this.errors = errors;
			/** The current state of the decoder. */
			this.state = EntityDecoderState$1.EntityStart;
			/** Characters that were consumed while parsing an entity. */
			this.consumed = 1;
			/**
			* The result of the entity.
			*
			* Either the result index of a numeric entity, or the codepoint of a
			* numeric entity.
			*/
			this.result = 0;
			/** The current index in the decode tree. */
			this.treeIndex = 0;
			/** The number of characters that were consumed in excess. */
			this.excess = 1;
			/** The mode in which the decoder is operating. */
			this.decodeMode = DecodingMode$1.Strict;
			/** The number of characters that have been consumed in the current run. */
			this.runConsumed = 0;
		}
		/** Resets the instance to make it reusable. */
		startEntity(decodeMode) {
			this.decodeMode = decodeMode;
			this.state = EntityDecoderState$1.EntityStart;
			this.result = 0;
			this.treeIndex = 0;
			this.excess = 1;
			this.consumed = 1;
			this.runConsumed = 0;
		}
		/**
		* Write an entity to the decoder. This can be called multiple times with partial entities.
		* If the entity is incomplete, the decoder will return -1.
		*
		* Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
		* entity is incomplete, and resume when the next string is written.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		write(input, offset) {
			switch (this.state) {
				case EntityDecoderState$1.EntityStart:
					if (input.charCodeAt(offset) === CharCodes$2.NUM) {
						this.state = EntityDecoderState$1.NumericStart;
						this.consumed += 1;
						return this.stateNumericStart(input, offset + 1);
					}
					this.state = EntityDecoderState$1.NamedEntity;
					return this.stateNamedEntity(input, offset);
				case EntityDecoderState$1.NumericStart: return this.stateNumericStart(input, offset);
				case EntityDecoderState$1.NumericDecimal: return this.stateNumericDecimal(input, offset);
				case EntityDecoderState$1.NumericHex: return this.stateNumericHex(input, offset);
				case EntityDecoderState$1.NamedEntity: return this.stateNamedEntity(input, offset);
			}
		}
		/**
		* Switches between the numeric decimal and hexadecimal states.
		*
		* Equivalent to the `Numeric character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericStart(input, offset) {
			if (offset >= input.length) return -1;
			if ((input.charCodeAt(offset) | TO_LOWER_BIT$1) === CharCodes$2.LOWER_X) {
				this.state = EntityDecoderState$1.NumericHex;
				this.consumed += 1;
				return this.stateNumericHex(input, offset + 1);
			}
			this.state = EntityDecoderState$1.NumericDecimal;
			return this.stateNumericDecimal(input, offset);
		}
		/**
		* Parses a hexadecimal numeric entity.
		*
		* Equivalent to the `Hexademical character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericHex(input, offset) {
			while (offset < input.length) {
				const char = input.charCodeAt(offset);
				if (isNumber$1(char) || isHexadecimalCharacter$1(char)) {
					const digit = char <= CharCodes$2.NINE ? char - CharCodes$2.ZERO : (char | TO_LOWER_BIT$1) - CharCodes$2.LOWER_A + 10;
					this.result = this.result * 16 + digit;
					this.consumed++;
					offset++;
				} else return this.emitNumericEntity(char, 3);
			}
			return -1;
		}
		/**
		* Parses a decimal numeric entity.
		*
		* Equivalent to the `Decimal character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericDecimal(input, offset) {
			while (offset < input.length) {
				const char = input.charCodeAt(offset);
				if (isNumber$1(char)) {
					this.result = this.result * 10 + (char - CharCodes$2.ZERO);
					this.consumed++;
					offset++;
				} else return this.emitNumericEntity(char, 2);
			}
			return -1;
		}
		/**
		* Validate and emit a numeric entity.
		*
		* Implements the logic from the `Hexademical character reference start
		* state` and `Numeric character reference end state` in the HTML spec.
		*
		* @param lastCp The last code point of the entity. Used to see if the
		*               entity was terminated with a semicolon.
		* @param expectedLength The minimum number of characters that should be
		*                       consumed. Used to validate that at least one digit
		*                       was consumed.
		* @returns The number of characters that were consumed.
		*/
		emitNumericEntity(lastCp, expectedLength) {
			var _a;
			if (this.consumed <= expectedLength) {
				(_a = this.errors) === null || _a === void 0 || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
				return 0;
			}
			if (lastCp === CharCodes$2.SEMI) this.consumed += 1;
			else if (this.decodeMode === DecodingMode$1.Strict) return 0;
			this.emitCodePoint(replaceCodePoint$1(this.result), this.consumed);
			if (this.errors) {
				if (lastCp !== CharCodes$2.SEMI) this.errors.missingSemicolonAfterCharacterReference();
				this.errors.validateNumericCharacterReference(this.result);
			}
			return this.consumed;
		}
		/**
		* Parses a named entity.
		*
		* Equivalent to the `Named character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNamedEntity(input, offset) {
			const { decodeTree } = this;
			let current = decodeTree[this.treeIndex];
			let valueLength = (current & BinTrieFlags$1.VALUE_LENGTH) >> 14;
			while (offset < input.length) {
				if (valueLength === 0 && (current & BinTrieFlags$1.FLAG13) !== 0) {
					const runLength = (current & BinTrieFlags$1.BRANCH_LENGTH) >> 7;
					if (this.runConsumed === 0) {
						const firstChar = current & BinTrieFlags$1.JUMP_TABLE;
						if (input.charCodeAt(offset) !== firstChar) return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
						offset++;
						this.excess++;
						this.runConsumed++;
					}
					while (this.runConsumed < runLength) {
						if (offset >= input.length) return -1;
						const charIndexInPacked = this.runConsumed - 1;
						const packedWord = decodeTree[this.treeIndex + 1 + (charIndexInPacked >> 1)];
						const expectedChar = charIndexInPacked % 2 === 0 ? packedWord & 255 : packedWord >> 8 & 255;
						if (input.charCodeAt(offset) !== expectedChar) {
							this.runConsumed = 0;
							return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
						}
						offset++;
						this.excess++;
						this.runConsumed++;
					}
					this.runConsumed = 0;
					this.treeIndex += 1 + (runLength >> 1);
					current = decodeTree[this.treeIndex];
					valueLength = (current & BinTrieFlags$1.VALUE_LENGTH) >> 14;
				}
				if (offset >= input.length) break;
				const char = input.charCodeAt(offset);
				if (char === CharCodes$2.SEMI && valueLength !== 0 && (current & BinTrieFlags$1.FLAG13) !== 0) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
				this.treeIndex = determineBranch$1(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
				if (this.treeIndex < 0) return this.result === 0 || this.decodeMode === DecodingMode$1.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd$1(char)) ? 0 : this.emitNotTerminatedNamedEntity();
				current = decodeTree[this.treeIndex];
				valueLength = (current & BinTrieFlags$1.VALUE_LENGTH) >> 14;
				if (valueLength !== 0) {
					if (char === CharCodes$2.SEMI) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
					if (this.decodeMode !== DecodingMode$1.Strict && (current & BinTrieFlags$1.FLAG13) === 0) {
						this.result = this.treeIndex;
						this.consumed += this.excess;
						this.excess = 0;
					}
				}
				offset++;
				this.excess++;
			}
			return -1;
		}
		/**
		* Emit a named entity that was not terminated with a semicolon.
		*
		* @returns The number of characters consumed.
		*/
		emitNotTerminatedNamedEntity() {
			var _a;
			const { result, decodeTree } = this;
			const valueLength = (decodeTree[result] & BinTrieFlags$1.VALUE_LENGTH) >> 14;
			this.emitNamedEntityData(result, valueLength, this.consumed);
			(_a = this.errors) === null || _a === void 0 || _a.missingSemicolonAfterCharacterReference();
			return this.consumed;
		}
		/**
		* Emit a named entity.
		*
		* @param result The index of the entity in the decode tree.
		* @param valueLength The number of bytes in the entity.
		* @param consumed The number of characters consumed.
		*
		* @returns The number of characters consumed.
		*/
		emitNamedEntityData(result, valueLength, consumed) {
			const { decodeTree } = this;
			this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~(BinTrieFlags$1.VALUE_LENGTH | BinTrieFlags$1.FLAG13) : decodeTree[result + 1], consumed);
			if (valueLength === 3) this.emitCodePoint(decodeTree[result + 2], consumed);
			return consumed;
		}
		/**
		* Signal to the parser that the end of the input was reached.
		*
		* Remaining data will be emitted and relevant errors will be produced.
		*
		* @returns The number of characters consumed.
		*/
		end() {
			var _a;
			switch (this.state) {
				case EntityDecoderState$1.NamedEntity: return this.result !== 0 && (this.decodeMode !== DecodingMode$1.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
				case EntityDecoderState$1.NumericDecimal: return this.emitNumericEntity(0, 2);
				case EntityDecoderState$1.NumericHex: return this.emitNumericEntity(0, 3);
				case EntityDecoderState$1.NumericStart:
					(_a = this.errors) === null || _a === void 0 || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
					return 0;
				case EntityDecoderState$1.EntityStart: return 0;
			}
		}
	};
	/**
	* Determines the branch of the current node that is taken given the current
	* character. This function is used to traverse the trie.
	*
	* @param decodeTree The trie.
	* @param current The current node.
	* @param nodeIdx The index right after the current node and its value.
	* @param char The current character.
	* @returns The index of the next node, or -1 if no branch is taken.
	*/
	function determineBranch$1(decodeTree, current, nodeIndex, char) {
		const branchCount = (current & BinTrieFlags$1.BRANCH_LENGTH) >> 7;
		const jumpOffset = current & BinTrieFlags$1.JUMP_TABLE;
		if (branchCount === 0) return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
		if (jumpOffset) {
			const value = char - jumpOffset;
			return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIndex + value] - 1;
		}
		const packedKeySlots = branchCount + 1 >> 1;
		let lo = 0;
		let hi = branchCount - 1;
		while (lo <= hi) {
			const mid = lo + hi >>> 1;
			const midKey = decodeTree[nodeIndex + (mid >> 1)] >> (mid & 1) * 8 & 255;
			if (midKey < char) lo = mid + 1;
			else if (midKey > char) hi = mid - 1;
			else return decodeTree[nodeIndex + packedKeySlots + mid];
		}
		return -1;
	}

//#endregion
//#region node_modules/htmlparser2/dist/esm/Tokenizer.js
	var CharCodes$1;
	(function(CharCodes) {
		CharCodes[CharCodes["Tab"] = 9] = "Tab";
		CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
		CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
		CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
		CharCodes[CharCodes["Space"] = 32] = "Space";
		CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
		CharCodes[CharCodes["Number"] = 35] = "Number";
		CharCodes[CharCodes["Amp"] = 38] = "Amp";
		CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
		CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
		CharCodes[CharCodes["Dash"] = 45] = "Dash";
		CharCodes[CharCodes["Slash"] = 47] = "Slash";
		CharCodes[CharCodes["Zero"] = 48] = "Zero";
		CharCodes[CharCodes["Nine"] = 57] = "Nine";
		CharCodes[CharCodes["Semi"] = 59] = "Semi";
		CharCodes[CharCodes["Lt"] = 60] = "Lt";
		CharCodes[CharCodes["Eq"] = 61] = "Eq";
		CharCodes[CharCodes["Gt"] = 62] = "Gt";
		CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
		CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
		CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
		CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
		CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
		CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
		CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
		CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
		CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
	})(CharCodes$1 || (CharCodes$1 = {}));
	/** All the states the tokenizer can be in. */
	var State$1;
	(function(State) {
		State[State["Text"] = 1] = "Text";
		State[State["BeforeTagName"] = 2] = "BeforeTagName";
		State[State["InTagName"] = 3] = "InTagName";
		State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
		State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
		State[State["InClosingTagName"] = 6] = "InClosingTagName";
		State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
		State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
		State[State["InAttributeName"] = 9] = "InAttributeName";
		State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
		State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
		State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
		State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
		State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
		State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
		State[State["InDeclaration"] = 16] = "InDeclaration";
		State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
		State[State["BeforeComment"] = 18] = "BeforeComment";
		State[State["CDATASequence"] = 19] = "CDATASequence";
		State[State["InSpecialComment"] = 20] = "InSpecialComment";
		State[State["InCommentLike"] = 21] = "InCommentLike";
		State[State["BeforeSpecialS"] = 22] = "BeforeSpecialS";
		State[State["BeforeSpecialT"] = 23] = "BeforeSpecialT";
		State[State["SpecialStartSequence"] = 24] = "SpecialStartSequence";
		State[State["InSpecialTag"] = 25] = "InSpecialTag";
		State[State["InEntity"] = 26] = "InEntity";
	})(State$1 || (State$1 = {}));
	function isWhitespace$2(c) {
		return c === CharCodes$1.Space || c === CharCodes$1.NewLine || c === CharCodes$1.Tab || c === CharCodes$1.FormFeed || c === CharCodes$1.CarriageReturn;
	}
	function isEndOfTagSection(c) {
		return c === CharCodes$1.Slash || c === CharCodes$1.Gt || isWhitespace$2(c);
	}
	function isASCIIAlpha(c) {
		return c >= CharCodes$1.LowerA && c <= CharCodes$1.LowerZ || c >= CharCodes$1.UpperA && c <= CharCodes$1.UpperZ;
	}
	var QuoteType;
	(function(QuoteType) {
		QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
		QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
		QuoteType[QuoteType["Single"] = 2] = "Single";
		QuoteType[QuoteType["Double"] = 3] = "Double";
	})(QuoteType || (QuoteType = {}));
	/**
	* Sequences used to match longer strings.
	*
	* We don't have `Script`, `Style`, or `Title` here. Instead, we re-use the *End
	* sequences with an increased offset.
	*/
	const Sequences = {
		Cdata: new Uint8Array([
			67,
			68,
			65,
			84,
			65,
			91
		]),
		CdataEnd: new Uint8Array([
			93,
			93,
			62
		]),
		CommentEnd: new Uint8Array([
			45,
			45,
			62
		]),
		ScriptEnd: new Uint8Array([
			60,
			47,
			115,
			99,
			114,
			105,
			112,
			116
		]),
		StyleEnd: new Uint8Array([
			60,
			47,
			115,
			116,
			121,
			108,
			101
		]),
		TitleEnd: new Uint8Array([
			60,
			47,
			116,
			105,
			116,
			108,
			101
		]),
		TextareaEnd: new Uint8Array([
			60,
			47,
			116,
			101,
			120,
			116,
			97,
			114,
			101,
			97
		]),
		XmpEnd: new Uint8Array([
			60,
			47,
			120,
			109,
			112
		])
	};
	var Tokenizer$1 = class {
		constructor({ xmlMode = false, decodeEntities = true }, cbs) {
			this.cbs = cbs;
			/** The current state the tokenizer is in. */
			this.state = State$1.Text;
			/** The read buffer. */
			this.buffer = "";
			/** The beginning of the section that is currently being read. */
			this.sectionStart = 0;
			/** The index within the buffer that we are currently looking at. */
			this.index = 0;
			/** The start of the last entity. */
			this.entityStart = 0;
			/** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
			this.baseState = State$1.Text;
			/** For special parsing behavior inside of script and style tags. */
			this.isSpecial = false;
			/** Indicates whether the tokenizer has been paused. */
			this.running = true;
			/** The offset of the current buffer. */
			this.offset = 0;
			this.currentSequence = void 0;
			this.sequenceIndex = 0;
			this.xmlMode = xmlMode;
			this.decodeEntities = decodeEntities;
			this.entityDecoder = new EntityDecoder$1(xmlMode ? xmlDecodeTree : htmlDecodeTree$1, (cp, consumed) => this.emitCodePoint(cp, consumed));
		}
		reset() {
			this.state = State$1.Text;
			this.buffer = "";
			this.sectionStart = 0;
			this.index = 0;
			this.baseState = State$1.Text;
			this.currentSequence = void 0;
			this.running = true;
			this.offset = 0;
		}
		write(chunk) {
			this.offset += this.buffer.length;
			this.buffer = chunk;
			this.parse();
		}
		end() {
			if (this.running) this.finish();
		}
		pause() {
			this.running = false;
		}
		resume() {
			this.running = true;
			if (this.index < this.buffer.length + this.offset) this.parse();
		}
		stateText(c) {
			if (c === CharCodes$1.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes$1.Lt)) {
				if (this.index > this.sectionStart) this.cbs.ontext(this.sectionStart, this.index);
				this.state = State$1.BeforeTagName;
				this.sectionStart = this.index;
			} else if (this.decodeEntities && c === CharCodes$1.Amp) this.startEntity();
		}
		stateSpecialStartSequence(c) {
			const isEnd = this.sequenceIndex === this.currentSequence.length;
			if (!(isEnd ? isEndOfTagSection(c) : (c | 32) === this.currentSequence[this.sequenceIndex])) this.isSpecial = false;
			else if (!isEnd) {
				this.sequenceIndex++;
				return;
			}
			this.sequenceIndex = 0;
			this.state = State$1.InTagName;
			this.stateInTagName(c);
		}
		/** Look for an end tag. For <title> tags, also decode entities. */
		stateInSpecialTag(c) {
			if (this.sequenceIndex === this.currentSequence.length) {
				if (c === CharCodes$1.Gt || isWhitespace$2(c)) {
					const endOfText = this.index - this.currentSequence.length;
					if (this.sectionStart < endOfText) {
						const actualIndex = this.index;
						this.index = endOfText;
						this.cbs.ontext(this.sectionStart, endOfText);
						this.index = actualIndex;
					}
					this.isSpecial = false;
					this.sectionStart = endOfText + 2;
					this.stateInClosingTagName(c);
					return;
				}
				this.sequenceIndex = 0;
			}
			if ((c | 32) === this.currentSequence[this.sequenceIndex]) this.sequenceIndex += 1;
			else if (this.sequenceIndex === 0) {
				if (this.currentSequence === Sequences.TitleEnd) {
					if (this.decodeEntities && c === CharCodes$1.Amp) this.startEntity();
				} else if (this.fastForwardTo(CharCodes$1.Lt)) this.sequenceIndex = 1;
			} else this.sequenceIndex = Number(c === CharCodes$1.Lt);
		}
		stateCDATASequence(c) {
			if (c === Sequences.Cdata[this.sequenceIndex]) {
				if (++this.sequenceIndex === Sequences.Cdata.length) {
					this.state = State$1.InCommentLike;
					this.currentSequence = Sequences.CdataEnd;
					this.sequenceIndex = 0;
					this.sectionStart = this.index + 1;
				}
			} else {
				this.sequenceIndex = 0;
				this.state = State$1.InDeclaration;
				this.stateInDeclaration(c);
			}
		}
		/**
		* When we wait for one specific character, we can speed things up
		* by skipping through the buffer until we find it.
		*
		* @returns Whether the character was found.
		*/
		fastForwardTo(c) {
			while (++this.index < this.buffer.length + this.offset) if (this.buffer.charCodeAt(this.index - this.offset) === c) return true;
			this.index = this.buffer.length + this.offset - 1;
			return false;
		}
		/**
		* Comments and CDATA end with `-->` and `]]>`.
		*
		* Their common qualities are:
		* - Their end sequences have a distinct character they start with.
		* - That character is then repeated, so we have to check multiple repeats.
		* - All characters but the start character of the sequence can be skipped.
		*/
		stateInCommentLike(c) {
			if (c === this.currentSequence[this.sequenceIndex]) {
				if (++this.sequenceIndex === this.currentSequence.length) {
					if (this.currentSequence === Sequences.CdataEnd) this.cbs.oncdata(this.sectionStart, this.index, 2);
					else this.cbs.oncomment(this.sectionStart, this.index, 2);
					this.sequenceIndex = 0;
					this.sectionStart = this.index + 1;
					this.state = State$1.Text;
				}
			} else if (this.sequenceIndex === 0) {
				if (this.fastForwardTo(this.currentSequence[0])) this.sequenceIndex = 1;
			} else if (c !== this.currentSequence[this.sequenceIndex - 1]) this.sequenceIndex = 0;
		}
		/**
		* HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
		*
		* XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
		* We allow anything that wouldn't end the tag.
		*/
		isTagStartChar(c) {
			return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
		}
		startSpecial(sequence, offset) {
			this.isSpecial = true;
			this.currentSequence = sequence;
			this.sequenceIndex = offset;
			this.state = State$1.SpecialStartSequence;
		}
		stateBeforeTagName(c) {
			if (c === CharCodes$1.ExclamationMark) {
				this.state = State$1.BeforeDeclaration;
				this.sectionStart = this.index + 1;
			} else if (c === CharCodes$1.Questionmark) {
				this.state = State$1.InProcessingInstruction;
				this.sectionStart = this.index + 1;
			} else if (this.isTagStartChar(c)) {
				const lower = c | 32;
				this.sectionStart = this.index;
				if (this.xmlMode) this.state = State$1.InTagName;
				else if (lower === Sequences.ScriptEnd[2]) this.state = State$1.BeforeSpecialS;
				else if (lower === Sequences.TitleEnd[2] || lower === Sequences.XmpEnd[2]) this.state = State$1.BeforeSpecialT;
				else this.state = State$1.InTagName;
			} else if (c === CharCodes$1.Slash) this.state = State$1.BeforeClosingTagName;
			else {
				this.state = State$1.Text;
				this.stateText(c);
			}
		}
		stateInTagName(c) {
			if (isEndOfTagSection(c)) {
				this.cbs.onopentagname(this.sectionStart, this.index);
				this.sectionStart = -1;
				this.state = State$1.BeforeAttributeName;
				this.stateBeforeAttributeName(c);
			}
		}
		stateBeforeClosingTagName(c) {
			if (isWhitespace$2(c)) {} else if (c === CharCodes$1.Gt) this.state = State$1.Text;
			else {
				this.state = this.isTagStartChar(c) ? State$1.InClosingTagName : State$1.InSpecialComment;
				this.sectionStart = this.index;
			}
		}
		stateInClosingTagName(c) {
			if (c === CharCodes$1.Gt || isWhitespace$2(c)) {
				this.cbs.onclosetag(this.sectionStart, this.index);
				this.sectionStart = -1;
				this.state = State$1.AfterClosingTagName;
				this.stateAfterClosingTagName(c);
			}
		}
		stateAfterClosingTagName(c) {
			if (c === CharCodes$1.Gt || this.fastForwardTo(CharCodes$1.Gt)) {
				this.state = State$1.Text;
				this.sectionStart = this.index + 1;
			}
		}
		stateBeforeAttributeName(c) {
			if (c === CharCodes$1.Gt) {
				this.cbs.onopentagend(this.index);
				if (this.isSpecial) {
					this.state = State$1.InSpecialTag;
					this.sequenceIndex = 0;
				} else this.state = State$1.Text;
				this.sectionStart = this.index + 1;
			} else if (c === CharCodes$1.Slash) this.state = State$1.InSelfClosingTag;
			else if (!isWhitespace$2(c)) {
				this.state = State$1.InAttributeName;
				this.sectionStart = this.index;
			}
		}
		stateInSelfClosingTag(c) {
			if (c === CharCodes$1.Gt) {
				this.cbs.onselfclosingtag(this.index);
				this.state = State$1.Text;
				this.sectionStart = this.index + 1;
				this.isSpecial = false;
			} else if (!isWhitespace$2(c)) {
				this.state = State$1.BeforeAttributeName;
				this.stateBeforeAttributeName(c);
			}
		}
		stateInAttributeName(c) {
			if (c === CharCodes$1.Eq || isEndOfTagSection(c)) {
				this.cbs.onattribname(this.sectionStart, this.index);
				this.sectionStart = this.index;
				this.state = State$1.AfterAttributeName;
				this.stateAfterAttributeName(c);
			}
		}
		stateAfterAttributeName(c) {
			if (c === CharCodes$1.Eq) this.state = State$1.BeforeAttributeValue;
			else if (c === CharCodes$1.Slash || c === CharCodes$1.Gt) {
				this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
				this.sectionStart = -1;
				this.state = State$1.BeforeAttributeName;
				this.stateBeforeAttributeName(c);
			} else if (!isWhitespace$2(c)) {
				this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
				this.state = State$1.InAttributeName;
				this.sectionStart = this.index;
			}
		}
		stateBeforeAttributeValue(c) {
			if (c === CharCodes$1.DoubleQuote) {
				this.state = State$1.InAttributeValueDq;
				this.sectionStart = this.index + 1;
			} else if (c === CharCodes$1.SingleQuote) {
				this.state = State$1.InAttributeValueSq;
				this.sectionStart = this.index + 1;
			} else if (!isWhitespace$2(c)) {
				this.sectionStart = this.index;
				this.state = State$1.InAttributeValueNq;
				this.stateInAttributeValueNoQuotes(c);
			}
		}
		handleInAttributeValue(c, quote) {
			if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
				this.cbs.onattribdata(this.sectionStart, this.index);
				this.sectionStart = -1;
				this.cbs.onattribend(quote === CharCodes$1.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index + 1);
				this.state = State$1.BeforeAttributeName;
			} else if (this.decodeEntities && c === CharCodes$1.Amp) this.startEntity();
		}
		stateInAttributeValueDoubleQuotes(c) {
			this.handleInAttributeValue(c, CharCodes$1.DoubleQuote);
		}
		stateInAttributeValueSingleQuotes(c) {
			this.handleInAttributeValue(c, CharCodes$1.SingleQuote);
		}
		stateInAttributeValueNoQuotes(c) {
			if (isWhitespace$2(c) || c === CharCodes$1.Gt) {
				this.cbs.onattribdata(this.sectionStart, this.index);
				this.sectionStart = -1;
				this.cbs.onattribend(QuoteType.Unquoted, this.index);
				this.state = State$1.BeforeAttributeName;
				this.stateBeforeAttributeName(c);
			} else if (this.decodeEntities && c === CharCodes$1.Amp) this.startEntity();
		}
		stateBeforeDeclaration(c) {
			if (c === CharCodes$1.OpeningSquareBracket) {
				this.state = State$1.CDATASequence;
				this.sequenceIndex = 0;
			} else this.state = c === CharCodes$1.Dash ? State$1.BeforeComment : State$1.InDeclaration;
		}
		stateInDeclaration(c) {
			if (c === CharCodes$1.Gt || this.fastForwardTo(CharCodes$1.Gt)) {
				this.cbs.ondeclaration(this.sectionStart, this.index);
				this.state = State$1.Text;
				this.sectionStart = this.index + 1;
			}
		}
		stateInProcessingInstruction(c) {
			if (c === CharCodes$1.Gt || this.fastForwardTo(CharCodes$1.Gt)) {
				this.cbs.onprocessinginstruction(this.sectionStart, this.index);
				this.state = State$1.Text;
				this.sectionStart = this.index + 1;
			}
		}
		stateBeforeComment(c) {
			if (c === CharCodes$1.Dash) {
				this.state = State$1.InCommentLike;
				this.currentSequence = Sequences.CommentEnd;
				this.sequenceIndex = 2;
				this.sectionStart = this.index + 1;
			} else this.state = State$1.InDeclaration;
		}
		stateInSpecialComment(c) {
			if (c === CharCodes$1.Gt || this.fastForwardTo(CharCodes$1.Gt)) {
				this.cbs.oncomment(this.sectionStart, this.index, 0);
				this.state = State$1.Text;
				this.sectionStart = this.index + 1;
			}
		}
		stateBeforeSpecialS(c) {
			const lower = c | 32;
			if (lower === Sequences.ScriptEnd[3]) this.startSpecial(Sequences.ScriptEnd, 4);
			else if (lower === Sequences.StyleEnd[3]) this.startSpecial(Sequences.StyleEnd, 4);
			else {
				this.state = State$1.InTagName;
				this.stateInTagName(c);
			}
		}
		stateBeforeSpecialT(c) {
			switch (c | 32) {
				case Sequences.TitleEnd[3]:
					this.startSpecial(Sequences.TitleEnd, 4);
					break;
				case Sequences.TextareaEnd[3]:
					this.startSpecial(Sequences.TextareaEnd, 4);
					break;
				case Sequences.XmpEnd[3]:
					this.startSpecial(Sequences.XmpEnd, 4);
					break;
				default:
					this.state = State$1.InTagName;
					this.stateInTagName(c);
			}
		}
		startEntity() {
			this.baseState = this.state;
			this.state = State$1.InEntity;
			this.entityStart = this.index;
			this.entityDecoder.startEntity(this.xmlMode ? DecodingMode$1.Strict : this.baseState === State$1.Text || this.baseState === State$1.InSpecialTag ? DecodingMode$1.Legacy : DecodingMode$1.Attribute);
		}
		stateInEntity() {
			const indexInBuffer = this.index - this.offset;
			const length = this.entityDecoder.write(this.buffer, indexInBuffer);
			if (length >= 0) {
				this.state = this.baseState;
				if (length === 0) this.index -= 1;
			} else {
				if (indexInBuffer < this.buffer.length && this.buffer.charCodeAt(indexInBuffer) === CharCodes$1.Amp) {
					this.state = this.baseState;
					this.index -= 1;
					return;
				}
				this.index = this.offset + this.buffer.length - 1;
			}
		}
		/**
		* Remove data that has already been consumed from the buffer.
		*/
		cleanup() {
			if (this.running && this.sectionStart !== this.index) {
				if (this.state === State$1.Text || this.state === State$1.InSpecialTag && this.sequenceIndex === 0) {
					this.cbs.ontext(this.sectionStart, this.index);
					this.sectionStart = this.index;
				} else if (this.state === State$1.InAttributeValueDq || this.state === State$1.InAttributeValueSq || this.state === State$1.InAttributeValueNq) {
					this.cbs.onattribdata(this.sectionStart, this.index);
					this.sectionStart = this.index;
				}
			}
		}
		shouldContinue() {
			return this.index < this.buffer.length + this.offset && this.running;
		}
		/**
		* Iterates through the buffer, calling the function corresponding to the current state.
		*
		* States that are more likely to be hit are higher up, as a performance improvement.
		*/
		parse() {
			while (this.shouldContinue()) {
				const c = this.buffer.charCodeAt(this.index - this.offset);
				switch (this.state) {
					case State$1.Text:
						this.stateText(c);
						break;
					case State$1.SpecialStartSequence:
						this.stateSpecialStartSequence(c);
						break;
					case State$1.InSpecialTag:
						this.stateInSpecialTag(c);
						break;
					case State$1.CDATASequence:
						this.stateCDATASequence(c);
						break;
					case State$1.InAttributeValueDq:
						this.stateInAttributeValueDoubleQuotes(c);
						break;
					case State$1.InAttributeName:
						this.stateInAttributeName(c);
						break;
					case State$1.InCommentLike:
						this.stateInCommentLike(c);
						break;
					case State$1.InSpecialComment:
						this.stateInSpecialComment(c);
						break;
					case State$1.BeforeAttributeName:
						this.stateBeforeAttributeName(c);
						break;
					case State$1.InTagName:
						this.stateInTagName(c);
						break;
					case State$1.InClosingTagName:
						this.stateInClosingTagName(c);
						break;
					case State$1.BeforeTagName:
						this.stateBeforeTagName(c);
						break;
					case State$1.AfterAttributeName:
						this.stateAfterAttributeName(c);
						break;
					case State$1.InAttributeValueSq:
						this.stateInAttributeValueSingleQuotes(c);
						break;
					case State$1.BeforeAttributeValue:
						this.stateBeforeAttributeValue(c);
						break;
					case State$1.BeforeClosingTagName:
						this.stateBeforeClosingTagName(c);
						break;
					case State$1.AfterClosingTagName:
						this.stateAfterClosingTagName(c);
						break;
					case State$1.BeforeSpecialS:
						this.stateBeforeSpecialS(c);
						break;
					case State$1.BeforeSpecialT:
						this.stateBeforeSpecialT(c);
						break;
					case State$1.InAttributeValueNq:
						this.stateInAttributeValueNoQuotes(c);
						break;
					case State$1.InSelfClosingTag:
						this.stateInSelfClosingTag(c);
						break;
					case State$1.InDeclaration:
						this.stateInDeclaration(c);
						break;
					case State$1.BeforeDeclaration:
						this.stateBeforeDeclaration(c);
						break;
					case State$1.BeforeComment:
						this.stateBeforeComment(c);
						break;
					case State$1.InProcessingInstruction:
						this.stateInProcessingInstruction(c);
						break;
					case State$1.InEntity:
						this.stateInEntity();
						break;
				}
				this.index++;
			}
			this.cleanup();
		}
		finish() {
			if (this.state === State$1.InEntity) {
				this.entityDecoder.end();
				this.state = this.baseState;
			}
			this.handleTrailingData();
			this.cbs.onend();
		}
		/** Handle any trailing data. */
		handleTrailingData() {
			const endIndex = this.buffer.length + this.offset;
			if (this.sectionStart >= endIndex) return;
			if (this.state === State$1.InCommentLike) if (this.currentSequence === Sequences.CdataEnd) this.cbs.oncdata(this.sectionStart, endIndex, 0);
			else this.cbs.oncomment(this.sectionStart, endIndex, 0);
			else if (this.state === State$1.InTagName || this.state === State$1.BeforeAttributeName || this.state === State$1.BeforeAttributeValue || this.state === State$1.AfterAttributeName || this.state === State$1.InAttributeName || this.state === State$1.InAttributeValueSq || this.state === State$1.InAttributeValueDq || this.state === State$1.InAttributeValueNq || this.state === State$1.InClosingTagName) {} else this.cbs.ontext(this.sectionStart, endIndex);
		}
		emitCodePoint(cp, consumed) {
			if (this.baseState !== State$1.Text && this.baseState !== State$1.InSpecialTag) {
				if (this.sectionStart < this.entityStart) this.cbs.onattribdata(this.sectionStart, this.entityStart);
				this.sectionStart = this.entityStart + consumed;
				this.index = this.sectionStart - 1;
				this.cbs.onattribentity(cp);
			} else {
				if (this.sectionStart < this.entityStart) this.cbs.ontext(this.sectionStart, this.entityStart);
				this.sectionStart = this.entityStart + consumed;
				this.index = this.sectionStart - 1;
				this.cbs.ontextentity(cp, this.sectionStart);
			}
		}
	};

//#endregion
//#region node_modules/htmlparser2/dist/esm/Parser.js
	const formTags = new Set([
		"input",
		"option",
		"optgroup",
		"select",
		"button",
		"datalist",
		"textarea"
	]);
	const pTag = new Set(["p"]);
	const tableSectionTags = new Set(["thead", "tbody"]);
	const ddtTags = new Set(["dd", "dt"]);
	const rtpTags = new Set(["rt", "rp"]);
	const openImpliesClose = new Map([
		["tr", new Set([
			"tr",
			"th",
			"td"
		])],
		["th", new Set(["th"])],
		["td", new Set([
			"thead",
			"th",
			"td"
		])],
		["body", new Set([
			"head",
			"link",
			"script"
		])],
		["li", new Set(["li"])],
		["p", pTag],
		["h1", pTag],
		["h2", pTag],
		["h3", pTag],
		["h4", pTag],
		["h5", pTag],
		["h6", pTag],
		["select", formTags],
		["input", formTags],
		["output", formTags],
		["button", formTags],
		["datalist", formTags],
		["textarea", formTags],
		["option", new Set(["option"])],
		["optgroup", new Set(["optgroup", "option"])],
		["dd", ddtTags],
		["dt", ddtTags],
		["address", pTag],
		["article", pTag],
		["aside", pTag],
		["blockquote", pTag],
		["details", pTag],
		["div", pTag],
		["dl", pTag],
		["fieldset", pTag],
		["figcaption", pTag],
		["figure", pTag],
		["footer", pTag],
		["form", pTag],
		["header", pTag],
		["hr", pTag],
		["main", pTag],
		["nav", pTag],
		["ol", pTag],
		["pre", pTag],
		["section", pTag],
		["table", pTag],
		["ul", pTag],
		["rt", rtpTags],
		["rp", rtpTags],
		["tbody", tableSectionTags],
		["tfoot", tableSectionTags]
	]);
	const voidElements = new Set([
		"area",
		"base",
		"basefont",
		"br",
		"col",
		"command",
		"embed",
		"frame",
		"hr",
		"img",
		"input",
		"isindex",
		"keygen",
		"link",
		"meta",
		"param",
		"source",
		"track",
		"wbr"
	]);
	const foreignContextElements = new Set(["math", "svg"]);
	const htmlIntegrationElements = new Set([
		"mi",
		"mo",
		"mn",
		"ms",
		"mtext",
		"annotation-xml",
		"foreignobject",
		"desc",
		"title"
	]);
	const reNameEnd = /\s|\//;
	var Parser$1 = class {
		constructor(cbs, options = {}) {
			var _a, _b, _c, _d, _e, _f;
			this.options = options;
			/** The start index of the last event. */
			this.startIndex = 0;
			/** The end index of the last event. */
			this.endIndex = 0;
			/**
			* Store the start index of the current open tag,
			* so we can update the start index for attributes.
			*/
			this.openTagStart = 0;
			this.tagname = "";
			this.attribname = "";
			this.attribvalue = "";
			this.attribs = null;
			this.stack = [];
			this.buffers = [];
			this.bufferOffset = 0;
			/** The index of the last written buffer. Used when resuming after a `pause()`. */
			this.writeIndex = 0;
			/** Indicates whether the parser has finished running / `.end` has been called. */
			this.ended = false;
			this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
			this.htmlMode = !this.options.xmlMode;
			this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : this.htmlMode;
			this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : this.htmlMode;
			this.recognizeSelfClosing = (_c = options.recognizeSelfClosing) !== null && _c !== void 0 ? _c : !this.htmlMode;
			this.tokenizer = new ((_d = options.Tokenizer) !== null && _d !== void 0 ? _d : Tokenizer$1)(this.options, this);
			this.foreignContext = [!this.htmlMode];
			(_f = (_e = this.cbs).onparserinit) === null || _f === void 0 || _f.call(_e, this);
		}
		/** @internal */
		ontext(start, endIndex) {
			var _a, _b;
			const data = this.getSlice(start, endIndex);
			this.endIndex = endIndex - 1;
			(_b = (_a = this.cbs).ontext) === null || _b === void 0 || _b.call(_a, data);
			this.startIndex = endIndex;
		}
		/** @internal */
		ontextentity(cp, endIndex) {
			var _a, _b;
			this.endIndex = endIndex - 1;
			(_b = (_a = this.cbs).ontext) === null || _b === void 0 || _b.call(_a, fromCodePoint$1(cp));
			this.startIndex = endIndex;
		}
		/**
		* Checks if the current tag is a void element. Override this if you want
		* to specify your own additional void elements.
		*/
		isVoidElement(name) {
			return this.htmlMode && voidElements.has(name);
		}
		/** @internal */
		onopentagname(start, endIndex) {
			this.endIndex = endIndex;
			let name = this.getSlice(start, endIndex);
			if (this.lowerCaseTagNames) name = name.toLowerCase();
			this.emitOpenTag(name);
		}
		emitOpenTag(name) {
			var _a, _b, _c, _d;
			this.openTagStart = this.startIndex;
			this.tagname = name;
			const impliesClose = this.htmlMode && openImpliesClose.get(name);
			if (impliesClose) while (this.stack.length > 0 && impliesClose.has(this.stack[0])) {
				const element = this.stack.shift();
				(_b = (_a = this.cbs).onclosetag) === null || _b === void 0 || _b.call(_a, element, true);
			}
			if (!this.isVoidElement(name)) {
				this.stack.unshift(name);
				if (this.htmlMode) {
					if (foreignContextElements.has(name)) this.foreignContext.unshift(true);
					else if (htmlIntegrationElements.has(name)) this.foreignContext.unshift(false);
				}
			}
			(_d = (_c = this.cbs).onopentagname) === null || _d === void 0 || _d.call(_c, name);
			if (this.cbs.onopentag) this.attribs = {};
		}
		endOpenTag(isImplied) {
			var _a, _b;
			this.startIndex = this.openTagStart;
			if (this.attribs) {
				(_b = (_a = this.cbs).onopentag) === null || _b === void 0 || _b.call(_a, this.tagname, this.attribs, isImplied);
				this.attribs = null;
			}
			if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) this.cbs.onclosetag(this.tagname, true);
			this.tagname = "";
		}
		/** @internal */
		onopentagend(endIndex) {
			this.endIndex = endIndex;
			this.endOpenTag(false);
			this.startIndex = endIndex + 1;
		}
		/** @internal */
		onclosetag(start, endIndex) {
			var _a, _b, _c, _d, _e, _f, _g, _h;
			this.endIndex = endIndex;
			let name = this.getSlice(start, endIndex);
			if (this.lowerCaseTagNames) name = name.toLowerCase();
			if (this.htmlMode && (foreignContextElements.has(name) || htmlIntegrationElements.has(name))) this.foreignContext.shift();
			if (!this.isVoidElement(name)) {
				const pos = this.stack.indexOf(name);
				if (pos !== -1) for (let index = 0; index <= pos; index++) {
					const element = this.stack.shift();
					(_b = (_a = this.cbs).onclosetag) === null || _b === void 0 || _b.call(_a, element, index !== pos);
				}
				else if (this.htmlMode && name === "p") {
					this.emitOpenTag("p");
					this.closeCurrentTag(true);
				}
			} else if (this.htmlMode && name === "br") {
				(_d = (_c = this.cbs).onopentagname) === null || _d === void 0 || _d.call(_c, "br");
				(_f = (_e = this.cbs).onopentag) === null || _f === void 0 || _f.call(_e, "br", {}, true);
				(_h = (_g = this.cbs).onclosetag) === null || _h === void 0 || _h.call(_g, "br", false);
			}
			this.startIndex = endIndex + 1;
		}
		/** @internal */
		onselfclosingtag(endIndex) {
			this.endIndex = endIndex;
			if (this.recognizeSelfClosing || this.foreignContext[0]) {
				this.closeCurrentTag(false);
				this.startIndex = endIndex + 1;
			} else this.onopentagend(endIndex);
		}
		closeCurrentTag(isOpenImplied) {
			var _a, _b;
			const name = this.tagname;
			this.endOpenTag(isOpenImplied);
			if (this.stack[0] === name) {
				(_b = (_a = this.cbs).onclosetag) === null || _b === void 0 || _b.call(_a, name, !isOpenImplied);
				this.stack.shift();
			}
		}
		/** @internal */
		onattribname(start, endIndex) {
			this.startIndex = start;
			const name = this.getSlice(start, endIndex);
			this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
		}
		/** @internal */
		onattribdata(start, endIndex) {
			this.attribvalue += this.getSlice(start, endIndex);
		}
		/** @internal */
		onattribentity(cp) {
			this.attribvalue += fromCodePoint$1(cp);
		}
		/** @internal */
		onattribend(quote, endIndex) {
			var _a, _b;
			this.endIndex = endIndex;
			(_b = (_a = this.cbs).onattribute) === null || _b === void 0 || _b.call(_a, this.attribname, this.attribvalue, quote === QuoteType.Double ? "\"" : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? void 0 : null);
			if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) this.attribs[this.attribname] = this.attribvalue;
			this.attribvalue = "";
		}
		getInstructionName(value) {
			const index = value.search(reNameEnd);
			let name = index < 0 ? value : value.substr(0, index);
			if (this.lowerCaseTagNames) name = name.toLowerCase();
			return name;
		}
		/** @internal */
		ondeclaration(start, endIndex) {
			this.endIndex = endIndex;
			const value = this.getSlice(start, endIndex);
			if (this.cbs.onprocessinginstruction) {
				const name = this.getInstructionName(value);
				this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
			}
			this.startIndex = endIndex + 1;
		}
		/** @internal */
		onprocessinginstruction(start, endIndex) {
			this.endIndex = endIndex;
			const value = this.getSlice(start, endIndex);
			if (this.cbs.onprocessinginstruction) {
				const name = this.getInstructionName(value);
				this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
			}
			this.startIndex = endIndex + 1;
		}
		/** @internal */
		oncomment(start, endIndex, offset) {
			var _a, _b, _c, _d;
			this.endIndex = endIndex;
			(_b = (_a = this.cbs).oncomment) === null || _b === void 0 || _b.call(_a, this.getSlice(start, endIndex - offset));
			(_d = (_c = this.cbs).oncommentend) === null || _d === void 0 || _d.call(_c);
			this.startIndex = endIndex + 1;
		}
		/** @internal */
		oncdata(start, endIndex, offset) {
			var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
			this.endIndex = endIndex;
			const value = this.getSlice(start, endIndex - offset);
			if (!this.htmlMode || this.options.recognizeCDATA) {
				(_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 || _b.call(_a);
				(_d = (_c = this.cbs).ontext) === null || _d === void 0 || _d.call(_c, value);
				(_f = (_e = this.cbs).oncdataend) === null || _f === void 0 || _f.call(_e);
			} else {
				(_h = (_g = this.cbs).oncomment) === null || _h === void 0 || _h.call(_g, `[CDATA[${value}]]`);
				(_k = (_j = this.cbs).oncommentend) === null || _k === void 0 || _k.call(_j);
			}
			this.startIndex = endIndex + 1;
		}
		/** @internal */
		onend() {
			var _a, _b;
			if (this.cbs.onclosetag) {
				this.endIndex = this.startIndex;
				for (let index = 0; index < this.stack.length; index++) this.cbs.onclosetag(this.stack[index], true);
			}
			(_b = (_a = this.cbs).onend) === null || _b === void 0 || _b.call(_a);
		}
		/**
		* Resets the parser to a blank state, ready to parse a new HTML document
		*/
		reset() {
			var _a, _b, _c, _d;
			(_b = (_a = this.cbs).onreset) === null || _b === void 0 || _b.call(_a);
			this.tokenizer.reset();
			this.tagname = "";
			this.attribname = "";
			this.attribs = null;
			this.stack.length = 0;
			this.startIndex = 0;
			this.endIndex = 0;
			(_d = (_c = this.cbs).onparserinit) === null || _d === void 0 || _d.call(_c, this);
			this.buffers.length = 0;
			this.foreignContext.length = 0;
			this.foreignContext.unshift(!this.htmlMode);
			this.bufferOffset = 0;
			this.writeIndex = 0;
			this.ended = false;
		}
		/**
		* Resets the parser, then parses a complete document and
		* pushes it to the handler.
		*
		* @param data Document to parse.
		*/
		parseComplete(data) {
			this.reset();
			this.end(data);
		}
		getSlice(start, end) {
			while (start - this.bufferOffset >= this.buffers[0].length) this.shiftBuffer();
			let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
			while (end - this.bufferOffset > this.buffers[0].length) {
				this.shiftBuffer();
				slice += this.buffers[0].slice(0, end - this.bufferOffset);
			}
			return slice;
		}
		shiftBuffer() {
			this.bufferOffset += this.buffers[0].length;
			this.writeIndex--;
			this.buffers.shift();
		}
		/**
		* Parses a chunk of data and calls the corresponding callbacks.
		*
		* @param chunk Chunk to parse.
		*/
		write(chunk) {
			var _a, _b;
			if (this.ended) {
				(_b = (_a = this.cbs).onerror) === null || _b === void 0 || _b.call(_a, /* @__PURE__ */ new Error(".write() after done!"));
				return;
			}
			this.buffers.push(chunk);
			if (this.tokenizer.running) {
				this.tokenizer.write(chunk);
				this.writeIndex++;
			}
		}
		/**
		* Parses the end of the buffer and clears the stack, calls onend.
		*
		* @param chunk Optional final chunk to parse.
		*/
		end(chunk) {
			var _a, _b;
			if (this.ended) {
				(_b = (_a = this.cbs).onerror) === null || _b === void 0 || _b.call(_a, /* @__PURE__ */ new Error(".end() after done!"));
				return;
			}
			if (chunk) this.write(chunk);
			this.ended = true;
			this.tokenizer.end();
		}
		/**
		* Pauses parsing. The parser won't emit events until `resume` is called.
		*/
		pause() {
			this.tokenizer.pause();
		}
		/**
		* Resumes parsing after `pause` was called.
		*/
		resume() {
			this.tokenizer.resume();
			while (this.tokenizer.running && this.writeIndex < this.buffers.length) this.tokenizer.write(this.buffers[this.writeIndex++]);
			if (this.ended) this.tokenizer.end();
		}
		/**
		* Alias of `write`, for backwards compatibility.
		*
		* @param chunk Chunk to parse.
		* @deprecated
		*/
		parseChunk(chunk) {
			this.write(chunk);
		}
		/**
		* Alias of `end`, for backwards compatibility.
		*
		* @param chunk Optional final chunk to parse.
		* @deprecated
		*/
		done(chunk) {
			this.end(chunk);
		}
	};

//#endregion
//#region node_modules/htmlparser2/dist/esm/index.js
/**
	* Parses the data, returns the resulting document.
	*
	* @param data The data that should be parsed.
	* @param options Optional options for the parser and DOM handler.
	*/
	function parseDocument(data, options) {
		const handler = new DomHandler(void 0, options);
		new Parser$1(handler, options).end(data);
		return handler.root;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/api/attributes.js
	var attributes_exports = /* @__PURE__ */ __exportAll({
		addClass: () => addClass,
		attr: () => attr,
		data: () => data,
		hasClass: () => hasClass,
		prop: () => prop,
		removeAttr: () => removeAttr,
		removeClass: () => removeClass,
		toggleClass: () => toggleClass,
		val: () => val
	});
	/**
	* Methods for getting and modifying attributes.
	*
	* @module cheerio/attributes
	*/
	var _a$1;
	const hasOwn = (_a$1 = Object.hasOwn) !== null && _a$1 !== void 0 ? _a$1 : ((object, prop) => Object.prototype.hasOwnProperty.call(object, prop));
	const rspace = /\s+/;
	const dataAttrPrefix = "data-";
	const rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i;
	const rbrace = /^{[^]*}$|^\[[^]*]$/;
	function getAttr(elem, name, xmlMode) {
		var _a;
		if (!elem || !isTag(elem)) return void 0;
		(_a = elem.attribs) !== null && _a !== void 0 || (elem.attribs = {});
		if (!name) return elem.attribs;
		if (hasOwn(elem.attribs, name)) return !xmlMode && rboolean.test(name) ? name : elem.attribs[name];
		if (elem.name === "option" && name === "value") return text$1(elem.children);
		if (elem.name === "input" && (elem.attribs["type"] === "radio" || elem.attribs["type"] === "checkbox") && name === "value") return "on";
	}
	/**
	* Sets the value of an attribute. The attribute will be deleted if the value is
	* `null`.
	*
	* @private
	* @param el - The element to set the attribute on.
	* @param name - The attribute's name.
	* @param value - The attribute's value.
	*/
	function setAttr(el, name, value) {
		if (value === null) removeAttribute(el, name);
		else el.attribs[name] = `${value}`;
	}
	function attr(name, value) {
		if (typeof name === "object" || value !== void 0) {
			if (typeof value === "function") {
				if (typeof name !== "string") throw new Error("Bad combination of arguments.");
				return domEach(this, (el, i) => {
					if (isTag(el)) setAttr(el, name, value.call(el, i, el.attribs[name]));
				});
			}
			return domEach(this, (el) => {
				if (!isTag(el)) return;
				if (typeof name === "object") for (const objName of Object.keys(name)) {
					const objValue = name[objName];
					setAttr(el, objName, objValue);
				}
				else setAttr(el, name, value);
			});
		}
		return arguments.length > 1 ? this : getAttr(this[0], name, this.options.xmlMode);
	}
	/**
	* Gets a node's prop.
	*
	* @private
	* @category Attributes
	* @param el - Element to get the prop of.
	* @param name - Name of the prop.
	* @param xmlMode - Disable handling of special HTML attributes.
	* @returns The prop's value.
	*/
	function getProp(el, name, xmlMode) {
		return name in el ? el[name] : !xmlMode && rboolean.test(name) ? getAttr(el, name, false) !== void 0 : getAttr(el, name, xmlMode);
	}
	/**
	* Sets the value of a prop.
	*
	* @private
	* @param el - The element to set the prop on.
	* @param name - The prop's name.
	* @param value - The prop's value.
	* @param xmlMode - Disable handling of special HTML attributes.
	*/
	function setProp(el, name, value, xmlMode) {
		if (name in el) el[name] = value;
		else setAttr(el, name, !xmlMode && rboolean.test(name) ? value ? "" : null : `${value}`);
	}
	function prop(name, value) {
		var _a;
		if (typeof name === "string" && value === void 0) {
			const el = this[0];
			if (!el) return void 0;
			switch (name) {
				case "style": {
					const property = this.css();
					const keys = Object.keys(property);
					for (let i = 0; i < keys.length; i++) property[i] = keys[i];
					property.length = keys.length;
					return property;
				}
				case "tagName":
				case "nodeName":
					if (!isTag(el)) return void 0;
					return el.name.toUpperCase();
				case "href":
				case "src": {
					if (!isTag(el)) return void 0;
					const prop = (_a = el.attribs) === null || _a === void 0 ? void 0 : _a[name];
					if (typeof URL !== "undefined" && (name === "href" && (el.tagName === "a" || el.tagName === "link") || name === "src" && (el.tagName === "img" || el.tagName === "iframe" || el.tagName === "audio" || el.tagName === "video" || el.tagName === "source")) && prop !== void 0 && this.options.baseURI) return new URL(prop, this.options.baseURI).href;
					return prop;
				}
				case "innerText": return innerText(el);
				case "textContent": return textContent(el);
				case "outerHTML":
					if (el.type === Root) return this.html();
					return this.clone().wrap("<container />").parent().html();
				case "innerHTML": return this.html();
				default:
					if (!isTag(el)) return void 0;
					return getProp(el, name, this.options.xmlMode);
			}
		}
		if (typeof name === "object" || value !== void 0) {
			if (typeof value === "function") {
				if (typeof name === "object") throw new TypeError("Bad combination of arguments.");
				return domEach(this, (el, i) => {
					if (isTag(el)) setProp(el, name, value.call(el, i, getProp(el, name, this.options.xmlMode)), this.options.xmlMode);
				});
			}
			return domEach(this, (el) => {
				if (!isTag(el)) return;
				if (typeof name === "object") for (const key of Object.keys(name)) {
					const val = name[key];
					setProp(el, key, val, this.options.xmlMode);
				}
				else setProp(el, name, value, this.options.xmlMode);
			});
		}
	}
	/**
	* Sets the value of a data attribute.
	*
	* @private
	* @param elem - The element to set the data attribute on.
	* @param name - The data attribute's name.
	* @param value - The data attribute's value.
	*/
	function setData(elem, name, value) {
		var _a;
		(_a = elem.data) !== null && _a !== void 0 || (elem.data = {});
		if (typeof name === "object") Object.assign(elem.data, name);
		else if (typeof name === "string" && value !== void 0) elem.data[name] = value;
	}
	/**
	* Read _all_ HTML5 `data-*` attributes from the equivalent HTML5 `data-*`
	* attribute, and cache the value in the node's internal data store.
	*
	* @private
	* @category Attributes
	* @param el - Element to get the data attribute of.
	* @returns A map with all of the data attributes.
	*/
	function readAllData(el) {
		for (const domName of Object.keys(el.attribs)) {
			if (!domName.startsWith(dataAttrPrefix)) continue;
			const jsName = camelCase(domName.slice(5));
			if (!hasOwn(el.data, jsName)) el.data[jsName] = parseDataValue(el.attribs[domName]);
		}
		return el.data;
	}
	/**
	* Read the specified attribute from the equivalent HTML5 `data-*` attribute,
	* and (if present) cache the value in the node's internal data store.
	*
	* @private
	* @category Attributes
	* @param el - Element to get the data attribute of.
	* @param name - Name of the data attribute.
	* @returns The data attribute's value.
	*/
	function readData(el, name) {
		const domName = dataAttrPrefix + cssCase(name);
		const data = el.data;
		if (hasOwn(data, name)) return data[name];
		if (hasOwn(el.attribs, domName)) return data[name] = parseDataValue(el.attribs[domName]);
	}
	/**
	* Coerce string data-* attributes to their corresponding JavaScript primitives.
	*
	* @private
	* @category Attributes
	* @param value - The value to parse.
	* @returns The parsed value.
	*/
	function parseDataValue(value) {
		if (value === "null") return null;
		if (value === "true") return true;
		if (value === "false") return false;
		const num = Number(value);
		if (value === String(num)) return num;
		if (rbrace.test(value)) try {
			return JSON.parse(value);
		} catch {}
		return value;
	}
	function data(name, value) {
		var _a;
		const elem = this[0];
		if (!elem || !isTag(elem)) return;
		const dataEl = elem;
		(_a = dataEl.data) !== null && _a !== void 0 || (dataEl.data = {});
		if (name == null) return readAllData(dataEl);
		if (typeof name === "object" || value !== void 0) {
			domEach(this, (el) => {
				if (isTag(el)) if (typeof name === "object") setData(el, name);
				else setData(el, name, value);
			});
			return this;
		}
		return readData(dataEl, name);
	}
	function val(value) {
		const querying = arguments.length === 0;
		const element = this[0];
		if (!element || !isTag(element)) return querying ? void 0 : this;
		switch (element.name) {
			case "textarea": return this.text(value);
			case "select": {
				const option = this.find("option:selected");
				if (!querying) {
					if (this.attr("multiple") == null && typeof value === "object") return this;
					this.find("option").removeAttr("selected");
					const values = typeof value === "object" ? value : [value];
					for (const val of values) this.find(`option[value="${val}"]`).attr("selected", "");
					return this;
				}
				return this.attr("multiple") ? option.toArray().map((el) => text$1(el.children)) : option.attr("value");
			}
			case "button":
			case "input":
			case "option": return querying ? this.attr("value") : this.attr("value", value);
		}
	}
	/**
	* Remove an attribute.
	*
	* @private
	* @param elem - Node to remove attribute from.
	* @param name - Name of the attribute to remove.
	*/
	function removeAttribute(elem, name) {
		if (!elem.attribs || !hasOwn(elem.attribs, name)) return;
		delete elem.attribs[name];
	}
	/**
	* Splits a space-separated list of names to individual names.
	*
	* @category Attributes
	* @param names - Names to split.
	* @returns - Split names.
	*/
	function splitNames(names) {
		return names ? names.trim().split(rspace) : [];
	}
	/**
	* Method for removing attributes by `name`.
	*
	* @category Attributes
	* @example
	*
	* ```js
	* $('.pear').removeAttr('class').prop('outerHTML');
	* //=> <li>Pear</li>
	*
	* $('.apple').attr('id', 'favorite');
	* $('.apple').removeAttr('id class').prop('outerHTML');
	* //=> <li>Apple</li>
	* ```
	*
	* @param name - Name of the attribute.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/removeAttr/}
	*/
	function removeAttr(name) {
		const attrNames = splitNames(name);
		for (const attrName of attrNames) domEach(this, (elem) => {
			if (isTag(elem)) removeAttribute(elem, attrName);
		});
		return this;
	}
	/**
	* Check to see if _any_ of the matched elements have the given `className`.
	*
	* @category Attributes
	* @example
	*
	* ```js
	* $('.pear').hasClass('pear');
	* //=> true
	*
	* $('apple').hasClass('fruit');
	* //=> false
	*
	* $('li').hasClass('pear');
	* //=> true
	* ```
	*
	* @param className - Name of the class.
	* @returns Indicates if an element has the given `className`.
	* @see {@link https://api.jquery.com/hasClass/}
	*/
	function hasClass(className) {
		return this.toArray().some((elem) => {
			const clazz = isTag(elem) && elem.attribs["class"];
			let idx = -1;
			if (clazz && className.length > 0) while ((idx = clazz.indexOf(className, idx + 1)) > -1) {
				const end = idx + className.length;
				if ((idx === 0 || rspace.test(clazz[idx - 1])) && (end === clazz.length || rspace.test(clazz[end]))) return true;
			}
			return false;
		});
	}
	/**
	* Adds class(es) to all of the matched elements. Also accepts a `function`.
	*
	* @category Attributes
	* @example
	*
	* ```js
	* $('.pear').addClass('fruit').prop('outerHTML');
	* //=> <li class="pear fruit">Pear</li>
	*
	* $('.apple').addClass('fruit red').prop('outerHTML');
	* //=> <li class="apple fruit red">Apple</li>
	* ```
	*
	* @param value - Name of new class.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/addClass/}
	*/
	function addClass(value) {
		if (typeof value === "function") return domEach(this, (el, i) => {
			if (isTag(el)) {
				const className = el.attribs["class"] || "";
				addClass.call([el], value.call(el, i, className));
			}
		});
		if (!value || typeof value !== "string") return this;
		const classNames = value.split(rspace);
		const numElements = this.length;
		for (let i = 0; i < numElements; i++) {
			const el = this[i];
			if (!isTag(el)) continue;
			const className = getAttr(el, "class", false);
			if (className) {
				let setClass = ` ${className} `;
				for (const cn of classNames) {
					const appendClass = `${cn} `;
					if (!setClass.includes(` ${appendClass}`)) setClass += appendClass;
				}
				setAttr(el, "class", setClass.trim());
			} else setAttr(el, "class", classNames.join(" ").trim());
		}
		return this;
	}
	/**
	* Removes one or more space-separated classes from the selected elements. If no
	* `className` is defined, all classes will be removed. Also accepts a
	* `function`.
	*
	* @category Attributes
	* @example
	*
	* ```js
	* $('.pear').removeClass('pear').prop('outerHTML');
	* //=> <li class="">Pear</li>
	*
	* $('.apple').addClass('red').removeClass().prop('outerHTML');
	* //=> <li class="">Apple</li>
	* ```
	*
	* @param name - Name of the class. If not specified, removes all elements.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/removeClass/}
	*/
	function removeClass(name) {
		if (typeof name === "function") return domEach(this, (el, i) => {
			if (isTag(el)) removeClass.call([el], name.call(el, i, el.attribs["class"] || ""));
		});
		const classes = splitNames(name);
		const numClasses = classes.length;
		const removeAll = arguments.length === 0;
		return domEach(this, (el) => {
			if (!isTag(el)) return;
			if (removeAll) el.attribs["class"] = "";
			else {
				const elClasses = splitNames(el.attribs["class"]);
				let changed = false;
				for (let j = 0; j < numClasses; j++) {
					const index = elClasses.indexOf(classes[j]);
					if (index !== -1) {
						elClasses.splice(index, 1);
						changed = true;
						j--;
					}
				}
				if (changed) el.attribs["class"] = elClasses.join(" ");
			}
		});
	}
	/**
	* Add or remove class(es) from the matched elements, depending on either the
	* class's presence or the value of the switch argument. Also accepts a
	* `function`.
	*
	* @category Attributes
	* @example
	*
	* ```js
	* $('.apple.green').toggleClass('fruit green red').prop('outerHTML');
	* //=> <li class="apple fruit red">Apple</li>
	*
	* $('.apple.green').toggleClass('fruit green red', true).prop('outerHTML');
	* //=> <li class="apple green fruit red">Apple</li>
	* ```
	*
	* @param value - Name of the class. Can also be a function.
	* @param stateVal - If specified the state of the class.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/toggleClass/}
	*/
	function toggleClass(value, stateVal) {
		if (typeof value === "function") return domEach(this, (el, i) => {
			if (isTag(el)) toggleClass.call([el], value.call(el, i, el.attribs["class"] || "", stateVal), stateVal);
		});
		if (!value || typeof value !== "string") return this;
		const classNames = value.split(rspace);
		const numClasses = classNames.length;
		const state = typeof stateVal === "boolean" ? stateVal ? 1 : -1 : 0;
		const numElements = this.length;
		for (let i = 0; i < numElements; i++) {
			const el = this[i];
			if (!isTag(el)) continue;
			const elementClasses = splitNames(el.attribs["class"]);
			for (let j = 0; j < numClasses; j++) {
				const index = elementClasses.indexOf(classNames[j]);
				if (state >= 0 && index === -1) elementClasses.push(classNames[j]);
				else if (state <= 0 && index !== -1) elementClasses.splice(index, 1);
			}
			el.attribs["class"] = elementClasses.join(" ");
		}
		return this;
	}

//#endregion
//#region node_modules/css-what/lib/es/types.js
	var SelectorType;
	(function(SelectorType) {
		SelectorType["Attribute"] = "attribute";
		SelectorType["Pseudo"] = "pseudo";
		SelectorType["PseudoElement"] = "pseudo-element";
		SelectorType["Tag"] = "tag";
		SelectorType["Universal"] = "universal";
		SelectorType["Adjacent"] = "adjacent";
		SelectorType["Child"] = "child";
		SelectorType["Descendant"] = "descendant";
		SelectorType["Parent"] = "parent";
		SelectorType["Sibling"] = "sibling";
		SelectorType["ColumnCombinator"] = "column-combinator";
	})(SelectorType || (SelectorType = {}));
	var AttributeAction;
	(function(AttributeAction) {
		AttributeAction["Any"] = "any";
		AttributeAction["Element"] = "element";
		AttributeAction["End"] = "end";
		AttributeAction["Equals"] = "equals";
		AttributeAction["Exists"] = "exists";
		AttributeAction["Hyphen"] = "hyphen";
		AttributeAction["Not"] = "not";
		AttributeAction["Start"] = "start";
	})(AttributeAction || (AttributeAction = {}));

//#endregion
//#region node_modules/css-what/lib/es/parse.js
	const reName = /^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/;
	const reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
	const actionTypes = new Map([
		[126, AttributeAction.Element],
		[94, AttributeAction.Start],
		[36, AttributeAction.End],
		[42, AttributeAction.Any],
		[33, AttributeAction.Not],
		[124, AttributeAction.Hyphen]
	]);
	const unpackPseudos = new Set([
		"has",
		"not",
		"matches",
		"is",
		"where",
		"host",
		"host-context"
	]);
	/**
	* Checks whether a specific selector is a traversal.
	* This is useful eg. in swapping the order of elements that
	* are not traversals.
	*
	* @param selector Selector to check.
	*/
	function isTraversal$1(selector) {
		switch (selector.type) {
			case SelectorType.Adjacent:
			case SelectorType.Child:
			case SelectorType.Descendant:
			case SelectorType.Parent:
			case SelectorType.Sibling:
			case SelectorType.ColumnCombinator: return true;
			default: return false;
		}
	}
	const stripQuotesFromPseudos = new Set(["contains", "icontains"]);
	function funescape(_, escaped, escapedWhitespace) {
		const high = parseInt(escaped, 16) - 65536;
		return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
	}
	function unescapeCSS(str) {
		return str.replace(reEscape, funescape);
	}
	function isQuote(c) {
		return c === 39 || c === 34;
	}
	function isWhitespace$1(c) {
		return c === 32 || c === 9 || c === 10 || c === 12 || c === 13;
	}
	/**
	* Parses `selector`, optionally with the passed `options`.
	*
	* @param selector Selector to parse.
	* @param options Options for parsing.
	* @returns Returns a two-dimensional array.
	* The first dimension represents selectors separated by commas (eg. `sub1, sub2`),
	* the second contains the relevant tokens for that selector.
	*/
	function parse$4(selector) {
		const subselects = [];
		const endIndex = parseSelector(subselects, `${selector}`, 0);
		if (endIndex < selector.length) throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`);
		return subselects;
	}
	function parseSelector(subselects, selector, selectorIndex) {
		let tokens = [];
		function getName(offset) {
			const match = selector.slice(selectorIndex + offset).match(reName);
			if (!match) throw new Error(`Expected name, found ${selector.slice(selectorIndex)}`);
			const [name] = match;
			selectorIndex += offset + name.length;
			return unescapeCSS(name);
		}
		function stripWhitespace(offset) {
			selectorIndex += offset;
			while (selectorIndex < selector.length && isWhitespace$1(selector.charCodeAt(selectorIndex))) selectorIndex++;
		}
		function readValueWithParenthesis() {
			selectorIndex += 1;
			const start = selectorIndex;
			let counter = 1;
			for (; counter > 0 && selectorIndex < selector.length; selectorIndex++) if (selector.charCodeAt(selectorIndex) === 40 && !isEscaped(selectorIndex)) counter++;
			else if (selector.charCodeAt(selectorIndex) === 41 && !isEscaped(selectorIndex)) counter--;
			if (counter) throw new Error("Parenthesis not matched");
			return unescapeCSS(selector.slice(start, selectorIndex - 1));
		}
		function isEscaped(pos) {
			let slashCount = 0;
			while (selector.charCodeAt(--pos) === 92) slashCount++;
			return (slashCount & 1) === 1;
		}
		function ensureNotTraversal() {
			if (tokens.length > 0 && isTraversal$1(tokens[tokens.length - 1])) throw new Error("Did not expect successive traversals.");
		}
		function addTraversal(type) {
			if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) {
				tokens[tokens.length - 1].type = type;
				return;
			}
			ensureNotTraversal();
			tokens.push({ type });
		}
		function addSpecialAttribute(name, action) {
			tokens.push({
				type: SelectorType.Attribute,
				name,
				action,
				value: getName(1),
				namespace: null,
				ignoreCase: "quirks"
			});
		}
		/**
		* We have finished parsing the current part of the selector.
		*
		* Remove descendant tokens at the end if they exist,
		* and return the last index, so that parsing can be
		* picked up from here.
		*/
		function finalizeSubselector() {
			if (tokens.length && tokens[tokens.length - 1].type === SelectorType.Descendant) tokens.pop();
			if (tokens.length === 0) throw new Error("Empty sub-selector");
			subselects.push(tokens);
		}
		stripWhitespace(0);
		if (selector.length === selectorIndex) return selectorIndex;
		loop: while (selectorIndex < selector.length) {
			const firstChar = selector.charCodeAt(selectorIndex);
			switch (firstChar) {
				case 32:
				case 9:
				case 10:
				case 12:
				case 13:
					if (tokens.length === 0 || tokens[0].type !== SelectorType.Descendant) {
						ensureNotTraversal();
						tokens.push({ type: SelectorType.Descendant });
					}
					stripWhitespace(1);
					break;
				case 62:
					addTraversal(SelectorType.Child);
					stripWhitespace(1);
					break;
				case 60:
					addTraversal(SelectorType.Parent);
					stripWhitespace(1);
					break;
				case 126:
					addTraversal(SelectorType.Sibling);
					stripWhitespace(1);
					break;
				case 43:
					addTraversal(SelectorType.Adjacent);
					stripWhitespace(1);
					break;
				case 46:
					addSpecialAttribute("class", AttributeAction.Element);
					break;
				case 35:
					addSpecialAttribute("id", AttributeAction.Equals);
					break;
				case 91: {
					stripWhitespace(1);
					let name;
					let namespace = null;
					if (selector.charCodeAt(selectorIndex) === 124) name = getName(1);
					else if (selector.startsWith("*|", selectorIndex)) {
						namespace = "*";
						name = getName(2);
					} else {
						name = getName(0);
						if (selector.charCodeAt(selectorIndex) === 124 && selector.charCodeAt(selectorIndex + 1) !== 61) {
							namespace = name;
							name = getName(1);
						}
					}
					stripWhitespace(0);
					let action = AttributeAction.Exists;
					const possibleAction = actionTypes.get(selector.charCodeAt(selectorIndex));
					if (possibleAction) {
						action = possibleAction;
						if (selector.charCodeAt(selectorIndex + 1) !== 61) throw new Error("Expected `=`");
						stripWhitespace(2);
					} else if (selector.charCodeAt(selectorIndex) === 61) {
						action = AttributeAction.Equals;
						stripWhitespace(1);
					}
					let value = "";
					let ignoreCase = null;
					if (action !== "exists") {
						if (isQuote(selector.charCodeAt(selectorIndex))) {
							const quote = selector.charCodeAt(selectorIndex);
							let sectionEnd = selectorIndex + 1;
							while (sectionEnd < selector.length && (selector.charCodeAt(sectionEnd) !== quote || isEscaped(sectionEnd))) sectionEnd += 1;
							if (selector.charCodeAt(sectionEnd) !== quote) throw new Error("Attribute value didn't end");
							value = unescapeCSS(selector.slice(selectorIndex + 1, sectionEnd));
							selectorIndex = sectionEnd + 1;
						} else {
							const valueStart = selectorIndex;
							while (selectorIndex < selector.length && (!isWhitespace$1(selector.charCodeAt(selectorIndex)) && selector.charCodeAt(selectorIndex) !== 93 || isEscaped(selectorIndex))) selectorIndex += 1;
							value = unescapeCSS(selector.slice(valueStart, selectorIndex));
						}
						stripWhitespace(0);
						const forceIgnore = selector.charCodeAt(selectorIndex) | 32;
						if (forceIgnore === 115) {
							ignoreCase = false;
							stripWhitespace(1);
						} else if (forceIgnore === 105) {
							ignoreCase = true;
							stripWhitespace(1);
						}
					}
					if (selector.charCodeAt(selectorIndex) !== 93) throw new Error("Attribute selector didn't terminate");
					selectorIndex += 1;
					const attributeSelector = {
						type: SelectorType.Attribute,
						name,
						action,
						value,
						namespace,
						ignoreCase
					};
					tokens.push(attributeSelector);
					break;
				}
				case 58: {
					if (selector.charCodeAt(selectorIndex + 1) === 58) {
						tokens.push({
							type: SelectorType.PseudoElement,
							name: getName(2).toLowerCase(),
							data: selector.charCodeAt(selectorIndex) === 40 ? readValueWithParenthesis() : null
						});
						continue;
					}
					const name = getName(1).toLowerCase();
					let data = null;
					if (selector.charCodeAt(selectorIndex) === 40) if (unpackPseudos.has(name)) {
						if (isQuote(selector.charCodeAt(selectorIndex + 1))) throw new Error(`Pseudo-selector ${name} cannot be quoted`);
						data = [];
						selectorIndex = parseSelector(data, selector, selectorIndex + 1);
						if (selector.charCodeAt(selectorIndex) !== 41) throw new Error(`Missing closing parenthesis in :${name} (${selector})`);
						selectorIndex += 1;
					} else {
						data = readValueWithParenthesis();
						if (stripQuotesFromPseudos.has(name)) {
							const quot = data.charCodeAt(0);
							if (quot === data.charCodeAt(data.length - 1) && isQuote(quot)) data = data.slice(1, -1);
						}
						data = unescapeCSS(data);
					}
					tokens.push({
						type: SelectorType.Pseudo,
						name,
						data
					});
					break;
				}
				case 44:
					finalizeSubselector();
					tokens = [];
					stripWhitespace(1);
					break;
				default: {
					if (selector.startsWith("/*", selectorIndex)) {
						const endIndex = selector.indexOf("*/", selectorIndex + 2);
						if (endIndex < 0) throw new Error("Comment was not terminated");
						selectorIndex = endIndex + 2;
						if (tokens.length === 0) stripWhitespace(0);
						break;
					}
					let namespace = null;
					let name;
					if (firstChar === 42) {
						selectorIndex += 1;
						name = "*";
					} else if (firstChar === 124) {
						name = "";
						if (selector.charCodeAt(selectorIndex + 1) === 124) {
							addTraversal(SelectorType.ColumnCombinator);
							stripWhitespace(2);
							break;
						}
					} else if (reName.test(selector.slice(selectorIndex))) name = getName(0);
					else break loop;
					if (selector.charCodeAt(selectorIndex) === 124 && selector.charCodeAt(selectorIndex + 1) !== 124) {
						namespace = name;
						if (selector.charCodeAt(selectorIndex + 1) === 42) {
							name = "*";
							selectorIndex += 2;
						} else name = getName(1);
					}
					tokens.push(name === "*" ? {
						type: SelectorType.Universal,
						namespace
					} : {
						type: SelectorType.Tag,
						name,
						namespace
					});
				}
			}
		}
		finalizeSubselector();
		return selectorIndex;
	}

//#endregion
//#region node_modules/boolbase/index.js
	var require_boolbase = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		module.exports = {
			trueFunc: function trueFunc() {
				return true;
			},
			falseFunc: function falseFunc() {
				return false;
			}
		};
	}));

//#endregion
//#region node_modules/css-select/lib/esm/sort.js
var import_boolbase = /* @__PURE__ */ __toESM(require_boolbase(), 1);
	const procedure = new Map([
		[SelectorType.Universal, 50],
		[SelectorType.Tag, 30],
		[SelectorType.Attribute, 1],
		[SelectorType.Pseudo, 0]
	]);
	function isTraversal(token) {
		return !procedure.has(token.type);
	}
	const attributes = new Map([
		[AttributeAction.Exists, 10],
		[AttributeAction.Equals, 8],
		[AttributeAction.Not, 7],
		[AttributeAction.Start, 6],
		[AttributeAction.End, 6],
		[AttributeAction.Any, 5]
	]);
	/**
	* Sort the parts of the passed selector,
	* as there is potential for optimization
	* (some types of selectors are faster than others)
	*
	* @param arr Selector to sort
	*/
	function sortByProcedure(arr) {
		const procs = arr.map(getProcedure);
		for (let i = 1; i < arr.length; i++) {
			const procNew = procs[i];
			if (procNew < 0) continue;
			for (let j = i - 1; j >= 0 && procNew < procs[j]; j--) {
				const token = arr[j + 1];
				arr[j + 1] = arr[j];
				arr[j] = token;
				procs[j + 1] = procs[j];
				procs[j] = procNew;
			}
		}
	}
	function getProcedure(token) {
		var _a, _b;
		let proc = (_a = procedure.get(token.type)) !== null && _a !== void 0 ? _a : -1;
		if (token.type === SelectorType.Attribute) {
			proc = (_b = attributes.get(token.action)) !== null && _b !== void 0 ? _b : 4;
			if (token.action === AttributeAction.Equals && token.name === "id") proc = 9;
			if (token.ignoreCase) proc >>= 1;
		} else if (token.type === SelectorType.Pseudo) if (!token.data) proc = 3;
		else if (token.name === "has" || token.name === "contains") proc = 0;
		else if (Array.isArray(token.data)) {
			proc = Math.min(...token.data.map((d) => Math.min(...d.map(getProcedure))));
			if (proc < 0) proc = 0;
		} else proc = 2;
		return proc;
	}

//#endregion
//#region node_modules/css-select/lib/esm/attributes.js
/**
	* All reserved characters in a regex, used for escaping.
	*
	* Taken from XRegExp, (c) 2007-2020 Steven Levithan under the MIT license
	* https://github.com/slevithan/xregexp/blob/95eeebeb8fac8754d54eafe2b4743661ac1cf028/src/xregexp.js#L794
	*/
	const reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
	function escapeRegex(value) {
		return value.replace(reChars, "\\$&");
	}
	/**
	* Attributes that are case-insensitive in HTML.
	*
	* @private
	* @see https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-of-selectors
	*/
	const caseInsensitiveAttributes = new Set([
		"accept",
		"accept-charset",
		"align",
		"alink",
		"axis",
		"bgcolor",
		"charset",
		"checked",
		"clear",
		"codetype",
		"color",
		"compact",
		"declare",
		"defer",
		"dir",
		"direction",
		"disabled",
		"enctype",
		"face",
		"frame",
		"hreflang",
		"http-equiv",
		"lang",
		"language",
		"link",
		"media",
		"method",
		"multiple",
		"nohref",
		"noresize",
		"noshade",
		"nowrap",
		"readonly",
		"rel",
		"rev",
		"rules",
		"scope",
		"scrolling",
		"selected",
		"shape",
		"target",
		"text",
		"type",
		"valign",
		"valuetype",
		"vlink"
	]);
	function shouldIgnoreCase(selector, options) {
		return typeof selector.ignoreCase === "boolean" ? selector.ignoreCase : selector.ignoreCase === "quirks" ? !!options.quirksMode : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
	}
	/**
	* Attribute selectors
	*/
	const attributeRules = {
		equals(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (elem) => {
					const attr = adapter.getAttributeValue(elem, name);
					return attr != null && attr.length === value.length && attr.toLowerCase() === value && next(elem);
				};
			}
			return (elem) => adapter.getAttributeValue(elem, name) === value && next(elem);
		},
		hyphen(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			const len = value.length;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return function hyphenIC(elem) {
					const attr = adapter.getAttributeValue(elem, name);
					return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len).toLowerCase() === value && next(elem);
				};
			}
			return function hyphen(elem) {
				const attr = adapter.getAttributeValue(elem, name);
				return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len) === value && next(elem);
			};
		},
		element(next, data, options) {
			const { adapter } = options;
			const { name, value } = data;
			if (/\s/.test(value)) return import_boolbase.default.falseFunc;
			const regex = new RegExp(`(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`, shouldIgnoreCase(data, options) ? "i" : "");
			return function element(elem) {
				const attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
			};
		},
		exists(next, { name }, { adapter }) {
			return (elem) => adapter.hasAttrib(elem, name) && next(elem);
		},
		start(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			const len = value.length;
			if (len === 0) return import_boolbase.default.falseFunc;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (elem) => {
					const attr = adapter.getAttributeValue(elem, name);
					return attr != null && attr.length >= len && attr.substr(0, len).toLowerCase() === value && next(elem);
				};
			}
			return (elem) => {
				var _a;
				return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.startsWith(value)) && next(elem);
			};
		},
		end(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			const len = -value.length;
			if (len === 0) return import_boolbase.default.falseFunc;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (elem) => {
					var _a;
					return ((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.substr(len).toLowerCase()) === value && next(elem);
				};
			}
			return (elem) => {
				var _a;
				return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.endsWith(value)) && next(elem);
			};
		},
		any(next, data, options) {
			const { adapter } = options;
			const { name, value } = data;
			if (value === "") return import_boolbase.default.falseFunc;
			if (shouldIgnoreCase(data, options)) {
				const regex = new RegExp(escapeRegex(value), "i");
				return function anyIC(elem) {
					const attr = adapter.getAttributeValue(elem, name);
					return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
				};
			}
			return (elem) => {
				var _a;
				return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.includes(value)) && next(elem);
			};
		},
		not(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			if (value === "") return (elem) => !!adapter.getAttributeValue(elem, name) && next(elem);
			else if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (elem) => {
					const attr = adapter.getAttributeValue(elem, name);
					return (attr == null || attr.length !== value.length || attr.toLowerCase() !== value) && next(elem);
				};
			}
			return (elem) => adapter.getAttributeValue(elem, name) !== value && next(elem);
		}
	};

//#endregion
//#region node_modules/nth-check/lib/esm/parse.js
	const whitespace = new Set([
		9,
		10,
		12,
		13,
		32
	]);
	const ZERO = "0".charCodeAt(0);
	const NINE = "9".charCodeAt(0);
	/**
	* Parses an expression.
	*
	* @throws An `Error` if parsing fails.
	* @returns An array containing the integer step size and the integer offset of the nth rule.
	* @example nthCheck.parse("2n+3"); // returns [2, 3]
	*/
	function parse$3(formula) {
		formula = formula.trim().toLowerCase();
		if (formula === "even") return [2, 0];
		else if (formula === "odd") return [2, 1];
		let idx = 0;
		let a = 0;
		let sign = readSign();
		let number = readNumber();
		if (idx < formula.length && formula.charAt(idx) === "n") {
			idx++;
			a = sign * (number !== null && number !== void 0 ? number : 1);
			skipWhitespace();
			if (idx < formula.length) {
				sign = readSign();
				skipWhitespace();
				number = readNumber();
			} else sign = number = 0;
		}
		if (number === null || idx < formula.length) throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
		return [a, sign * number];
		function readSign() {
			if (formula.charAt(idx) === "-") {
				idx++;
				return -1;
			}
			if (formula.charAt(idx) === "+") idx++;
			return 1;
		}
		function readNumber() {
			const start = idx;
			let value = 0;
			while (idx < formula.length && formula.charCodeAt(idx) >= ZERO && formula.charCodeAt(idx) <= NINE) {
				value = value * 10 + (formula.charCodeAt(idx) - ZERO);
				idx++;
			}
			return idx === start ? null : value;
		}
		function skipWhitespace() {
			while (idx < formula.length && whitespace.has(formula.charCodeAt(idx))) idx++;
		}
	}

//#endregion
//#region node_modules/nth-check/lib/esm/compile.js
/**
	* Returns a function that checks if an elements index matches the given rule
	* highly optimized to return the fastest solution.
	*
	* @param parsed A tuple [a, b], as returned by `parse`.
	* @returns A highly optimized function that returns whether an index matches the nth-check.
	* @example
	*
	* ```js
	* const check = nthCheck.compile([2, 3]);
	*
	* check(0); // `false`
	* check(1); // `false`
	* check(2); // `true`
	* check(3); // `false`
	* check(4); // `true`
	* check(5); // `false`
	* check(6); // `true`
	* ```
	*/
	function compile$2(parsed) {
		const a = parsed[0];
		const b = parsed[1] - 1;
		if (b < 0 && a <= 0) return import_boolbase.default.falseFunc;
		if (a === -1) return (index) => index <= b;
		if (a === 0) return (index) => index === b;
		if (a === 1) return b < 0 ? import_boolbase.default.trueFunc : (index) => index >= b;
		const absA = Math.abs(a);
		const bMod = (b % absA + absA) % absA;
		return a > 1 ? (index) => index >= b && index % absA === bMod : (index) => index <= b && index % absA === bMod;
	}

//#endregion
//#region node_modules/nth-check/lib/esm/index.js
/**
	* Parses and compiles a formula to a highly optimized function.
	* Combination of {@link parse} and {@link compile}.
	*
	* If the formula doesn't match any elements,
	* it returns [`boolbase`](https://github.com/fb55/boolbase)'s `falseFunc`.
	* Otherwise, a function accepting an _index_ is returned, which returns
	* whether or not the passed _index_ matches the formula.
	*
	* Note: The nth-rule starts counting at `1`, the returned function at `0`.
	*
	* @param formula The formula to compile.
	* @example
	* const check = nthCheck("2n+3");
	*
	* check(0); // `false`
	* check(1); // `false`
	* check(2); // `true`
	* check(3); // `false`
	* check(4); // `true`
	* check(5); // `false`
	* check(6); // `true`
	*/
	function nthCheck(formula) {
		return compile$2(parse$3(formula));
	}

//#endregion
//#region node_modules/css-select/lib/esm/pseudo-selectors/filters.js
	function getChildFunc(next, adapter) {
		return (elem) => {
			const parent = adapter.getParent(elem);
			return parent != null && adapter.isTag(parent) && next(elem);
		};
	}
	const filters = {
		contains(next, text, { adapter }) {
			return function contains(elem) {
				return next(elem) && adapter.getText(elem).includes(text);
			};
		},
		icontains(next, text, { adapter }) {
			const itext = text.toLowerCase();
			return function icontains(elem) {
				return next(elem) && adapter.getText(elem).toLowerCase().includes(itext);
			};
		},
		"nth-child"(next, rule, { adapter, equals }) {
			const func = nthCheck(rule);
			if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
			if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
			return function nthChild(elem) {
				const siblings = adapter.getSiblings(elem);
				let pos = 0;
				for (let i = 0; i < siblings.length; i++) {
					if (equals(elem, siblings[i])) break;
					if (adapter.isTag(siblings[i])) pos++;
				}
				return func(pos) && next(elem);
			};
		},
		"nth-last-child"(next, rule, { adapter, equals }) {
			const func = nthCheck(rule);
			if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
			if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
			return function nthLastChild(elem) {
				const siblings = adapter.getSiblings(elem);
				let pos = 0;
				for (let i = siblings.length - 1; i >= 0; i--) {
					if (equals(elem, siblings[i])) break;
					if (adapter.isTag(siblings[i])) pos++;
				}
				return func(pos) && next(elem);
			};
		},
		"nth-of-type"(next, rule, { adapter, equals }) {
			const func = nthCheck(rule);
			if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
			if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
			return function nthOfType(elem) {
				const siblings = adapter.getSiblings(elem);
				let pos = 0;
				for (let i = 0; i < siblings.length; i++) {
					const currentSibling = siblings[i];
					if (equals(elem, currentSibling)) break;
					if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) pos++;
				}
				return func(pos) && next(elem);
			};
		},
		"nth-last-of-type"(next, rule, { adapter, equals }) {
			const func = nthCheck(rule);
			if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
			if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
			return function nthLastOfType(elem) {
				const siblings = adapter.getSiblings(elem);
				let pos = 0;
				for (let i = siblings.length - 1; i >= 0; i--) {
					const currentSibling = siblings[i];
					if (equals(elem, currentSibling)) break;
					if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) pos++;
				}
				return func(pos) && next(elem);
			};
		},
		root(next, _rule, { adapter }) {
			return (elem) => {
				const parent = adapter.getParent(elem);
				return (parent == null || !adapter.isTag(parent)) && next(elem);
			};
		},
		scope(next, rule, options, context) {
			const { equals } = options;
			if (!context || context.length === 0) return filters["root"](next, rule, options);
			if (context.length === 1) return (elem) => equals(context[0], elem) && next(elem);
			return (elem) => context.includes(elem) && next(elem);
		},
		hover: dynamicStatePseudo("isHovered"),
		visited: dynamicStatePseudo("isVisited"),
		active: dynamicStatePseudo("isActive")
	};
	/**
	* Dynamic state pseudos. These depend on optional Adapter methods.
	*
	* @param name The name of the adapter method to call.
	* @returns Pseudo for the `filters` object.
	*/
	function dynamicStatePseudo(name) {
		return function dynamicPseudo(next, _rule, { adapter }) {
			const func = adapter[name];
			if (typeof func !== "function") return import_boolbase.default.falseFunc;
			return function active(elem) {
				return func(elem) && next(elem);
			};
		};
	}

//#endregion
//#region node_modules/css-select/lib/esm/pseudo-selectors/pseudos.js
	const pseudos = {
		empty(elem, { adapter }) {
			return !adapter.getChildren(elem).some((elem) => adapter.isTag(elem) || adapter.getText(elem) !== "");
		},
		"first-child"(elem, { adapter, equals }) {
			if (adapter.prevElementSibling) return adapter.prevElementSibling(elem) == null;
			const firstChild = adapter.getSiblings(elem).find((elem) => adapter.isTag(elem));
			return firstChild != null && equals(elem, firstChild);
		},
		"last-child"(elem, { adapter, equals }) {
			const siblings = adapter.getSiblings(elem);
			for (let i = siblings.length - 1; i >= 0; i--) {
				if (equals(elem, siblings[i])) return true;
				if (adapter.isTag(siblings[i])) break;
			}
			return false;
		},
		"first-of-type"(elem, { adapter, equals }) {
			const siblings = adapter.getSiblings(elem);
			const elemName = adapter.getName(elem);
			for (let i = 0; i < siblings.length; i++) {
				const currentSibling = siblings[i];
				if (equals(elem, currentSibling)) return true;
				if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) break;
			}
			return false;
		},
		"last-of-type"(elem, { adapter, equals }) {
			const siblings = adapter.getSiblings(elem);
			const elemName = adapter.getName(elem);
			for (let i = siblings.length - 1; i >= 0; i--) {
				const currentSibling = siblings[i];
				if (equals(elem, currentSibling)) return true;
				if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) break;
			}
			return false;
		},
		"only-of-type"(elem, { adapter, equals }) {
			const elemName = adapter.getName(elem);
			return adapter.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter.isTag(sibling) || adapter.getName(sibling) !== elemName);
		},
		"only-child"(elem, { adapter, equals }) {
			return adapter.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter.isTag(sibling));
		}
	};
	function verifyPseudoArgs(func, name, subselect, argIndex) {
		if (subselect === null) {
			if (func.length > argIndex) throw new Error(`Pseudo-class :${name} requires an argument`);
		} else if (func.length === argIndex) throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
	}

//#endregion
//#region node_modules/css-select/lib/esm/pseudo-selectors/aliases.js
/**
	* Aliases are pseudos that are expressed as selectors.
	*/
	const aliases = {
		"any-link": ":is(a, area, link)[href]",
		link: ":any-link:not(:visited)",
		disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
		enabled: ":not(:disabled)",
		checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",
		required: ":is(input, select, textarea)[required]",
		optional: ":is(input, select, textarea):not([required])",
		selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
		checkbox: "[type=checkbox]",
		file: "[type=file]",
		password: "[type=password]",
		radio: "[type=radio]",
		reset: "[type=reset]",
		image: "[type=image]",
		submit: "[type=submit]",
		parent: ":not(:empty)",
		header: ":is(h1, h2, h3, h4, h5, h6)",
		button: ":is(button, input[type=button])",
		input: ":is(input, textarea, select, button)",
		text: "input:is(:not([type!='']), [type=text])"
	};

//#endregion
//#region node_modules/css-select/lib/esm/pseudo-selectors/subselects.js
/** Used as a placeholder for :has. Will be replaced with the actual element. */
	const PLACEHOLDER_ELEMENT = {};
	function ensureIsTag(next, adapter) {
		if (next === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
		return (elem) => adapter.isTag(elem) && next(elem);
	}
	function getNextSiblings(elem, adapter) {
		const siblings = adapter.getSiblings(elem);
		if (siblings.length <= 1) return [];
		const elemIndex = siblings.indexOf(elem);
		if (elemIndex < 0 || elemIndex === siblings.length - 1) return [];
		return siblings.slice(elemIndex + 1).filter(adapter.isTag);
	}
	function copyOptions(options) {
		return {
			xmlMode: !!options.xmlMode,
			lowerCaseAttributeNames: !!options.lowerCaseAttributeNames,
			lowerCaseTags: !!options.lowerCaseTags,
			quirksMode: !!options.quirksMode,
			cacheResults: !!options.cacheResults,
			pseudos: options.pseudos,
			adapter: options.adapter,
			equals: options.equals
		};
	}
	const is$2 = (next, token, options, context, compileToken) => {
		const func = compileToken(token, copyOptions(options), context);
		return func === import_boolbase.default.trueFunc ? next : func === import_boolbase.default.falseFunc ? import_boolbase.default.falseFunc : (elem) => func(elem) && next(elem);
	};
	const subselects = {
		is: is$2,
		/**
		* `:matches` and `:where` are aliases for `:is`.
		*/
		matches: is$2,
		where: is$2,
		not(next, token, options, context, compileToken) {
			const func = compileToken(token, copyOptions(options), context);
			return func === import_boolbase.default.falseFunc ? next : func === import_boolbase.default.trueFunc ? import_boolbase.default.falseFunc : (elem) => !func(elem) && next(elem);
		},
		has(next, subselect, options, _context, compileToken) {
			const { adapter } = options;
			const opts = copyOptions(options);
			opts.relativeSelector = true;
			const context = subselect.some((s) => s.some(isTraversal)) ? [PLACEHOLDER_ELEMENT] : void 0;
			const compiled = compileToken(subselect, opts, context);
			if (compiled === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
			const hasElement = ensureIsTag(compiled, adapter);
			if (context && compiled !== import_boolbase.default.trueFunc) {
				const { shouldTestNextSiblings = false } = compiled;
				return (elem) => {
					if (!next(elem)) return false;
					context[0] = elem;
					const childs = adapter.getChildren(elem);
					const nextElements = shouldTestNextSiblings ? [...childs, ...getNextSiblings(elem, adapter)] : childs;
					return adapter.existsOne(hasElement, nextElements);
				};
			}
			return (elem) => next(elem) && adapter.existsOne(hasElement, adapter.getChildren(elem));
		}
	};

//#endregion
//#region node_modules/css-select/lib/esm/pseudo-selectors/index.js
	function compilePseudoSelector(next, selector, options, context, compileToken) {
		var _a;
		const { name, data } = selector;
		if (Array.isArray(data)) {
			if (!(name in subselects)) throw new Error(`Unknown pseudo-class :${name}(${data})`);
			return subselects[name](next, data, options, context, compileToken);
		}
		const userPseudo = (_a = options.pseudos) === null || _a === void 0 ? void 0 : _a[name];
		const stringPseudo = typeof userPseudo === "string" ? userPseudo : aliases[name];
		if (typeof stringPseudo === "string") {
			if (data != null) throw new Error(`Pseudo ${name} doesn't have any arguments`);
			const alias = parse$4(stringPseudo);
			return subselects["is"](next, alias, options, context, compileToken);
		}
		if (typeof userPseudo === "function") {
			verifyPseudoArgs(userPseudo, name, data, 1);
			return (elem) => userPseudo(elem, data) && next(elem);
		}
		if (name in filters) return filters[name](next, data, options, context);
		if (name in pseudos) {
			const pseudo = pseudos[name];
			verifyPseudoArgs(pseudo, name, data, 2);
			return (elem) => pseudo(elem, options, data) && next(elem);
		}
		throw new Error(`Unknown pseudo-class :${name}`);
	}

//#endregion
//#region node_modules/css-select/lib/esm/general.js
	function getElementParent(node, adapter) {
		const parent = adapter.getParent(node);
		if (parent && adapter.isTag(parent)) return parent;
		return null;
	}
	function compileGeneralSelector(next, selector, options, context, compileToken) {
		const { adapter, equals } = options;
		switch (selector.type) {
			case SelectorType.PseudoElement: throw new Error("Pseudo-elements are not supported by css-select");
			case SelectorType.ColumnCombinator: throw new Error("Column combinators are not yet supported by css-select");
			case SelectorType.Attribute:
				if (selector.namespace != null) throw new Error("Namespaced attributes are not yet supported by css-select");
				if (!options.xmlMode || options.lowerCaseAttributeNames) selector.name = selector.name.toLowerCase();
				return attributeRules[selector.action](next, selector, options);
			case SelectorType.Pseudo: return compilePseudoSelector(next, selector, options, context, compileToken);
			case SelectorType.Tag: {
				if (selector.namespace != null) throw new Error("Namespaced tag names are not yet supported by css-select");
				let { name } = selector;
				if (!options.xmlMode || options.lowerCaseTags) name = name.toLowerCase();
				return function tag(elem) {
					return adapter.getName(elem) === name && next(elem);
				};
			}
			case SelectorType.Descendant: {
				if (options.cacheResults === false || typeof WeakSet === "undefined") return function descendant(elem) {
					let current = elem;
					while (current = getElementParent(current, adapter)) if (next(current)) return true;
					return false;
				};
				const isFalseCache = /* @__PURE__ */ new WeakSet();
				return function cachedDescendant(elem) {
					let current = elem;
					while (current = getElementParent(current, adapter)) if (!isFalseCache.has(current)) {
						if (adapter.isTag(current) && next(current)) return true;
						isFalseCache.add(current);
					}
					return false;
				};
			}
			case "_flexibleDescendant": return function flexibleDescendant(elem) {
				let current = elem;
				do
					if (next(current)) return true;
				while (current = getElementParent(current, adapter));
				return false;
			};
			case SelectorType.Parent: return function parent(elem) {
				return adapter.getChildren(elem).some((elem) => adapter.isTag(elem) && next(elem));
			};
			case SelectorType.Child: return function child(elem) {
				const parent = adapter.getParent(elem);
				return parent != null && adapter.isTag(parent) && next(parent);
			};
			case SelectorType.Sibling: return function sibling(elem) {
				const siblings = adapter.getSiblings(elem);
				for (let i = 0; i < siblings.length; i++) {
					const currentSibling = siblings[i];
					if (equals(elem, currentSibling)) break;
					if (adapter.isTag(currentSibling) && next(currentSibling)) return true;
				}
				return false;
			};
			case SelectorType.Adjacent:
				if (adapter.prevElementSibling) return function adjacent(elem) {
					const previous = adapter.prevElementSibling(elem);
					return previous != null && next(previous);
				};
				return function adjacent(elem) {
					const siblings = adapter.getSiblings(elem);
					let lastElement;
					for (let i = 0; i < siblings.length; i++) {
						const currentSibling = siblings[i];
						if (equals(elem, currentSibling)) break;
						if (adapter.isTag(currentSibling)) lastElement = currentSibling;
					}
					return !!lastElement && next(lastElement);
				};
			case SelectorType.Universal:
				if (selector.namespace != null && selector.namespace !== "*") throw new Error("Namespaced universal selectors are not yet supported by css-select");
				return next;
		}
	}

//#endregion
//#region node_modules/css-select/lib/esm/compile.js
/**
	* Compiles a selector to an executable function.
	*
	* @param selector Selector to compile.
	* @param options Compilation options.
	* @param context Optional context for the selector.
	*/
	function compile$1(selector, options, context) {
		return ensureIsTag(compileUnsafe(selector, options, context), options.adapter);
	}
	function compileUnsafe(selector, options, context) {
		return compileToken(typeof selector === "string" ? parse$4(selector) : selector, options, context);
	}
	function includesScopePseudo(t) {
		return t.type === SelectorType.Pseudo && (t.name === "scope" || Array.isArray(t.data) && t.data.some((data) => data.some(includesScopePseudo)));
	}
	const DESCENDANT_TOKEN = { type: SelectorType.Descendant };
	const FLEXIBLE_DESCENDANT_TOKEN = { type: "_flexibleDescendant" };
	const SCOPE_TOKEN = {
		type: SelectorType.Pseudo,
		name: "scope",
		data: null
	};
	function absolutize(token, { adapter }, context) {
		const hasContext = !!(context === null || context === void 0 ? void 0 : context.every((e) => {
			const parent = adapter.isTag(e) && adapter.getParent(e);
			return e === PLACEHOLDER_ELEMENT || parent && adapter.isTag(parent);
		}));
		for (const t of token) {
			if (t.length > 0 && isTraversal(t[0]) && t[0].type !== SelectorType.Descendant) {} else if (hasContext && !t.some(includesScopePseudo)) t.unshift(DESCENDANT_TOKEN);
			else continue;
			t.unshift(SCOPE_TOKEN);
		}
	}
	function compileToken(token, options, context) {
		var _a;
		token.forEach(sortByProcedure);
		context = (_a = options.context) !== null && _a !== void 0 ? _a : context;
		const isArrayContext = Array.isArray(context);
		const finalContext = context && (Array.isArray(context) ? context : [context]);
		if (options.relativeSelector !== false) absolutize(token, options, finalContext);
		else if (token.some((t) => t.length > 0 && isTraversal(t[0]))) throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");
		let shouldTestNextSiblings = false;
		const query = token.map((rules) => {
			if (rules.length >= 2) {
				const [first, second] = rules;
				if (first.type !== SelectorType.Pseudo || first.name !== "scope") {} else if (isArrayContext && second.type === SelectorType.Descendant) rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
				else if (second.type === SelectorType.Adjacent || second.type === SelectorType.Sibling) shouldTestNextSiblings = true;
			}
			return compileRules(rules, options, finalContext);
		}).reduce(reduceRules, import_boolbase.default.falseFunc);
		query.shouldTestNextSiblings = shouldTestNextSiblings;
		return query;
	}
	function compileRules(rules, options, context) {
		var _a;
		return rules.reduce((previous, rule) => previous === import_boolbase.default.falseFunc ? import_boolbase.default.falseFunc : compileGeneralSelector(previous, rule, options, context, compileToken), (_a = options.rootFunc) !== null && _a !== void 0 ? _a : import_boolbase.default.trueFunc);
	}
	function reduceRules(a, b) {
		if (b === import_boolbase.default.falseFunc || a === import_boolbase.default.trueFunc) return a;
		if (a === import_boolbase.default.falseFunc || b === import_boolbase.default.trueFunc) return b;
		return function combine(elem) {
			return a(elem) || b(elem);
		};
	}

//#endregion
//#region node_modules/css-select/lib/esm/index.js
	const defaultEquals = (a, b) => a === b;
	const defaultOptions = {
		adapter: esm_exports,
		equals: defaultEquals
	};
	function convertOptionFormats(options) {
		var _a, _b, _c, _d;
		const opts = options !== null && options !== void 0 ? options : defaultOptions;
		(_a = opts.adapter) !== null && _a !== void 0 || (opts.adapter = esm_exports);
		(_b = opts.equals) !== null && _b !== void 0 || (opts.equals = (_d = (_c = opts.adapter) === null || _c === void 0 ? void 0 : _c.equals) !== null && _d !== void 0 ? _d : defaultEquals);
		return opts;
	}
	function wrapCompile(func) {
		return function addAdapter(selector, options, context) {
			return func(selector, convertOptionFormats(options), context);
		};
	}
	/**
	* Compiles the query, returns a function.
	*/
	const compile = wrapCompile(compile$1);
	const _compileUnsafe = wrapCompile(compileUnsafe);
	const _compileToken = wrapCompile(compileToken);
	function getSelectorFunc(searchFunc) {
		return function select(query, elements, options) {
			const opts = convertOptionFormats(options);
			if (typeof query !== "function") query = compileUnsafe(query, opts, elements);
			const filteredElements = prepareContext(elements, opts.adapter, query.shouldTestNextSiblings);
			return searchFunc(query, filteredElements, opts);
		};
	}
	function prepareContext(elems, adapter, shouldTestNextSiblings = false) {
		if (shouldTestNextSiblings) elems = appendNextSiblings(elems, adapter);
		return Array.isArray(elems) ? adapter.removeSubsets(elems) : adapter.getChildren(elems);
	}
	function appendNextSiblings(elem, adapter) {
		const elems = Array.isArray(elem) ? elem.slice(0) : [elem];
		const elemsLength = elems.length;
		for (let i = 0; i < elemsLength; i++) {
			const nextSiblings = getNextSiblings(elems[i], adapter);
			elems.push(...nextSiblings);
		}
		return elems;
	}
	/**
	* @template Node The generic Node type for the DOM adapter being used.
	* @template ElementNode The Node type for elements for the DOM adapter being used.
	* @param elems Elements to query. If it is an element, its children will be queried..
	* @param query can be either a CSS selector string or a compiled query function.
	* @param [options] options for querying the document.
	* @see compile for supported selector queries.
	* @returns All matching elements.
	*
	*/
	const selectAll = getSelectorFunc((query, elems, options) => query === import_boolbase.default.falseFunc || !elems || elems.length === 0 ? [] : options.adapter.findAll(query, elems));
	/**
	* @template Node The generic Node type for the DOM adapter being used.
	* @template ElementNode The Node type for elements for the DOM adapter being used.
	* @param elems Elements to query. If it is an element, its children will be queried..
	* @param query can be either a CSS selector string or a compiled query function.
	* @param [options] options for querying the document.
	* @see compile for supported selector queries.
	* @returns the first match, or null if there was no match.
	*/
	const selectOne = getSelectorFunc((query, elems, options) => query === import_boolbase.default.falseFunc || !elems || elems.length === 0 ? null : options.adapter.findOne(query, elems));

//#endregion
//#region node_modules/cheerio-select/lib/esm/positionals.js
	const filterNames = new Set([
		"first",
		"last",
		"eq",
		"gt",
		"nth",
		"lt",
		"even",
		"odd"
	]);
	function isFilter(s) {
		if (s.type !== "pseudo") return false;
		if (filterNames.has(s.name)) return true;
		if (s.name === "not" && Array.isArray(s.data)) return s.data.some((s) => s.some(isFilter));
		return false;
	}
	function getLimit(filter, data, partLimit) {
		const num = data != null ? parseInt(data, 10) : NaN;
		switch (filter) {
			case "first": return 1;
			case "nth":
			case "eq": return isFinite(num) ? num >= 0 ? num + 1 : Infinity : 0;
			case "lt": return isFinite(num) ? num >= 0 ? Math.min(num, partLimit) : Infinity : 0;
			case "gt": return isFinite(num) ? Infinity : 0;
			case "odd": return 2 * partLimit;
			case "even": return 2 * partLimit - 1;
			case "last":
			case "not": return Infinity;
		}
	}

//#endregion
//#region node_modules/cheerio-select/lib/esm/helpers.js
	function getDocumentRoot(node) {
		while (node.parent) node = node.parent;
		return node;
	}
	function groupSelectors(selectors) {
		const filteredSelectors = [];
		const plainSelectors = [];
		for (const selector of selectors) if (selector.some(isFilter)) filteredSelectors.push(selector);
		else plainSelectors.push(selector);
		return [plainSelectors, filteredSelectors];
	}

//#endregion
//#region node_modules/cheerio-select/lib/esm/index.js
	const UNIVERSAL_SELECTOR = {
		type: SelectorType.Universal,
		namespace: null
	};
	const SCOPE_PSEUDO = {
		type: SelectorType.Pseudo,
		name: "scope",
		data: null
	};
	function is$1(element, selector, options = {}) {
		return some([element], selector, options);
	}
	function some(elements, selector, options = {}) {
		if (typeof selector === "function") return elements.some(selector);
		const [plain, filtered] = groupSelectors(parse$4(selector));
		return plain.length > 0 && elements.some(_compileToken(plain, options)) || filtered.some((sel) => filterBySelector(sel, elements, options).length > 0);
	}
	function filterByPosition(filter, elems, data, options) {
		const num = typeof data === "string" ? parseInt(data, 10) : NaN;
		switch (filter) {
			case "first":
			case "lt": return elems;
			case "last": return elems.length > 0 ? [elems[elems.length - 1]] : elems;
			case "nth":
			case "eq": return isFinite(num) && Math.abs(num) < elems.length ? [num < 0 ? elems[elems.length + num] : elems[num]] : [];
			case "gt": return isFinite(num) ? elems.slice(num + 1) : [];
			case "even": return elems.filter((_, i) => i % 2 === 0);
			case "odd": return elems.filter((_, i) => i % 2 === 1);
			case "not": {
				const filtered = new Set(filterParsed(data, elems, options));
				return elems.filter((e) => !filtered.has(e));
			}
		}
	}
	function filter$1(selector, elements, options = {}) {
		return filterParsed(parse$4(selector), elements, options);
	}
	/**
	* Filter a set of elements by a selector.
	*
	* Will return elements in the original order.
	*
	* @param selector Selector to filter by.
	* @param elements Elements to filter.
	* @param options Options for selector.
	*/
	function filterParsed(selector, elements, options) {
		if (elements.length === 0) return [];
		const [plainSelectors, filteredSelectors] = groupSelectors(selector);
		let found;
		if (plainSelectors.length) {
			const filtered = filterElements(elements, plainSelectors, options);
			if (filteredSelectors.length === 0) return filtered;
			if (filtered.length) found = new Set(filtered);
		}
		for (let i = 0; i < filteredSelectors.length && (found === null || found === void 0 ? void 0 : found.size) !== elements.length; i++) {
			const filteredSelector = filteredSelectors[i];
			if ((found ? elements.filter((e) => isTag(e) && !found.has(e)) : elements).length === 0) break;
			const filtered = filterBySelector(filteredSelector, elements, options);
			if (filtered.length) if (!found) {
				if (i === filteredSelectors.length - 1) return filtered;
				found = new Set(filtered);
			} else filtered.forEach((el) => found.add(el));
		}
		return typeof found !== "undefined" ? found.size === elements.length ? elements : elements.filter((el) => found.has(el)) : [];
	}
	function filterBySelector(selector, elements, options) {
		var _a;
		if (selector.some(isTraversal$1)) {
			const root = (_a = options.root) !== null && _a !== void 0 ? _a : getDocumentRoot(elements[0]);
			const opts = {
				...options,
				context: elements,
				relativeSelector: false
			};
			selector.push(SCOPE_PSEUDO);
			return findFilterElements(root, selector, opts, true, elements.length);
		}
		return findFilterElements(elements, selector, options, false, elements.length);
	}
	function select(selector, root, options = {}, limit = Infinity) {
		if (typeof selector === "function") return find$1(root, selector);
		const [plain, filtered] = groupSelectors(parse$4(selector));
		const results = filtered.map((sel) => findFilterElements(root, sel, options, true, limit));
		if (plain.length) results.push(findElements(root, plain, options, limit));
		if (results.length === 0) return [];
		if (results.length === 1) return results[0];
		return uniqueSort(results.reduce((a, b) => [...a, ...b]));
	}
	/**
	*
	* @param root Element(s) to search from.
	* @param selector Selector to look for.
	* @param options Options for querying.
	* @param queryForSelector Query multiple levels deep for the initial selector, even if it doesn't contain a traversal.
	*/
	function findFilterElements(root, selector, options, queryForSelector, totalLimit) {
		const filterIndex = selector.findIndex(isFilter);
		const sub = selector.slice(0, filterIndex);
		const filter = selector[filterIndex];
		const partLimit = selector.length - 1 === filterIndex ? totalLimit : Infinity;
		const limit = getLimit(filter.name, filter.data, partLimit);
		if (limit === 0) return [];
		const elems = (sub.length === 0 && !Array.isArray(root) ? getChildren(root).filter(isTag) : sub.length === 0 ? (Array.isArray(root) ? root : [root]).filter(isTag) : queryForSelector || sub.some(isTraversal$1) ? findElements(root, [sub], options, limit) : filterElements(root, [sub], options)).slice(0, limit);
		let result = filterByPosition(filter.name, elems, filter.data, options);
		if (result.length === 0 || selector.length === filterIndex + 1) return result;
		const remainingSelector = selector.slice(filterIndex + 1);
		const remainingHasTraversal = remainingSelector.some(isTraversal$1);
		if (remainingHasTraversal) {
			if (isTraversal$1(remainingSelector[0])) {
				const { type } = remainingSelector[0];
				if (type === SelectorType.Sibling || type === SelectorType.Adjacent) result = prepareContext(result, esm_exports, true);
				remainingSelector.unshift(UNIVERSAL_SELECTOR);
			}
			options = {
				...options,
				relativeSelector: false,
				rootFunc: (el) => result.includes(el)
			};
		} else if (options.rootFunc && options.rootFunc !== import_boolbase.trueFunc) options = {
			...options,
			rootFunc: import_boolbase.trueFunc
		};
		return remainingSelector.some(isFilter) ? findFilterElements(result, remainingSelector, options, false, totalLimit) : remainingHasTraversal ? findElements(result, [remainingSelector], options, totalLimit) : filterElements(result, [remainingSelector], options);
	}
	function findElements(root, sel, options, limit) {
		return find$1(root, _compileToken(sel, options, root), limit);
	}
	function find$1(root, query, limit = Infinity) {
		const elems = prepareContext(root, esm_exports, query.shouldTestNextSiblings);
		return find$2((node) => isTag(node) && query(node), elems, true, limit);
	}
	function filterElements(elements, sel, options) {
		const els = (Array.isArray(elements) ? elements : [elements]).filter(isTag);
		if (els.length === 0) return els;
		const query = _compileToken(sel, options);
		return query === import_boolbase.trueFunc ? els : els.filter(query);
	}

//#endregion
//#region node_modules/cheerio/dist/browser/api/traversing.js
/**
	* Methods for traversing the DOM structure.
	*
	* @module cheerio/traversing
	*/
	var traversing_exports = /* @__PURE__ */ __exportAll({
		_findBySelector: () => _findBySelector,
		add: () => add,
		addBack: () => addBack,
		children: () => children,
		closest: () => closest,
		contents: () => contents,
		each: () => each,
		end: () => end,
		eq: () => eq,
		filter: () => filter,
		filterArray: () => filterArray,
		find: () => find,
		first: () => first,
		get: () => get,
		has: () => has,
		index: () => index,
		is: () => is,
		last: () => last,
		map: () => map,
		next: () => next,
		nextAll: () => nextAll,
		nextUntil: () => nextUntil,
		not: () => not,
		parent: () => parent,
		parents: () => parents,
		parentsUntil: () => parentsUntil,
		prev: () => prev,
		prevAll: () => prevAll,
		prevUntil: () => prevUntil,
		siblings: () => siblings,
		slice: () => slice,
		toArray: () => toArray
	});
	const reContextSelector = /^\s*(?:[+~]|:scope\b)/;
	/**
	* Get the descendants of each element in the current set of matched elements,
	* filtered by a selector, jQuery object, or element.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('#fruits').find('li').length;
	* //=> 3
	* $('#fruits').find($('.apple')).length;
	* //=> 1
	* ```
	*
	* @param selectorOrHaystack - Element to look for.
	* @returns The found elements.
	* @see {@link https://api.jquery.com/find/}
	*/
	function find(selectorOrHaystack) {
		if (!selectorOrHaystack) return this._make([]);
		if (typeof selectorOrHaystack !== "string") {
			const haystack = isCheerio(selectorOrHaystack) ? selectorOrHaystack.toArray() : [selectorOrHaystack];
			const context = this.toArray();
			return this._make(haystack.filter((elem) => context.some((node) => contains(node, elem))));
		}
		return this._findBySelector(selectorOrHaystack, Number.POSITIVE_INFINITY);
	}
	/**
	* Find elements by a specific selector.
	*
	* @private
	* @category Traversing
	* @param selector - Selector to filter by.
	* @param limit - Maximum number of elements to match.
	* @returns The found elements.
	*/
	function _findBySelector(selector, limit) {
		var _a;
		const context = this.toArray();
		const elems = reContextSelector.test(selector) ? context : this.children().toArray();
		const options = {
			context,
			root: (_a = this._root) === null || _a === void 0 ? void 0 : _a[0],
			xmlMode: this.options.xmlMode,
			lowerCaseTags: this.options.lowerCaseTags,
			lowerCaseAttributeNames: this.options.lowerCaseAttributeNames,
			pseudos: this.options.pseudos,
			quirksMode: this.options.quirksMode
		};
		return this._make(select(selector, elems, options, limit));
	}
	/**
	* Creates a matcher, using a particular mapping function. Matchers provide a
	* function that finds elements using a generating function, supporting
	* filtering.
	*
	* @private
	* @param matchMap - Mapping function.
	* @returns - Function for wrapping generating functions.
	*/
	function _getMatcher(matchMap) {
		return function(fn, ...postFns) {
			return function(selector) {
				var _a;
				let matched = matchMap(fn, this);
				if (selector) matched = filterArray(matched, selector, this.options.xmlMode, (_a = this._root) === null || _a === void 0 ? void 0 : _a[0]);
				return this._make(this.length > 1 && matched.length > 1 ? postFns.reduce((elems, fn) => fn(elems), matched) : matched);
			};
		};
	}
	/** Matcher that adds multiple elements for each entry in the input. */
	const _matcher = _getMatcher((fn, elems) => {
		let ret = [];
		for (let i = 0; i < elems.length; i++) {
			const value = fn(elems[i]);
			if (value.length > 0) ret = ret.concat(value);
		}
		return ret;
	});
	/** Matcher that adds at most one element for each entry in the input. */
	const _singleMatcher = _getMatcher((fn, elems) => {
		const ret = [];
		for (let i = 0; i < elems.length; i++) {
			const value = fn(elems[i]);
			if (value !== null) ret.push(value);
		}
		return ret;
	});
	/**
	* Matcher that supports traversing until a condition is met.
	*
	* @param nextElem - Function that returns the next element.
	* @param postFns - Post processing functions.
	* @returns A function usable for `*Until` methods.
	*/
	function _matchUntil(nextElem, ...postFns) {
		let matches = null;
		const innerMatcher = _getMatcher((nextElem, elems) => {
			const matched = [];
			domEach(elems, (elem) => {
				for (let next; next = nextElem(elem); elem = next) {
					if (matches === null || matches === void 0 ? void 0 : matches(next, matched.length)) break;
					matched.push(next);
				}
			});
			return matched;
		})(nextElem, ...postFns);
		return function(selector, filterSelector) {
			matches = typeof selector === "string" ? (elem) => is$1(elem, selector, this.options) : selector ? getFilterFn(selector) : null;
			const ret = innerMatcher.call(this, filterSelector);
			matches = null;
			return ret;
		};
	}
	function _removeDuplicates(elems) {
		return elems.length > 1 ? Array.from(new Set(elems)) : elems;
	}
	/**
	* Get the parent of each element in the current set of matched elements,
	* optionally filtered by a selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.pear').parent().attr('id');
	* //=> fruits
	* ```
	*
	* @param selector - If specified filter for parent.
	* @returns The parents.
	* @see {@link https://api.jquery.com/parent/}
	*/
	const parent = _singleMatcher(({ parent }) => parent && !isDocument(parent) ? parent : null, _removeDuplicates);
	/**
	* Get a set of parents filtered by `selector` of each element in the current
	* set of match elements.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.orange').parents().length;
	* //=> 2
	* $('.orange').parents('#fruits').length;
	* //=> 1
	* ```
	*
	* @param selector - If specified filter for parents.
	* @returns The parents.
	* @see {@link https://api.jquery.com/parents/}
	*/
	const parents = _matcher((elem) => {
		const matched = [];
		while (elem.parent && !isDocument(elem.parent)) {
			matched.push(elem.parent);
			elem = elem.parent;
		}
		return matched;
	}, uniqueSort, (elems) => elems.reverse());
	/**
	* Get the ancestors of each element in the current set of matched elements, up
	* to but not including the element matched by the selector, DOM node, or
	* cheerio object.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.orange').parentsUntil('#food').length;
	* //=> 1
	* ```
	*
	* @param selector - Selector for element to stop at.
	* @param filterSelector - Optional filter for parents.
	* @returns The parents.
	* @see {@link https://api.jquery.com/parentsUntil/}
	*/
	const parentsUntil = _matchUntil(({ parent }) => parent && !isDocument(parent) ? parent : null, uniqueSort, (elems) => elems.reverse());
	/**
	* For each element in the set, get the first element that matches the selector
	* by testing the element itself and traversing up through its ancestors in the
	* DOM tree.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.orange').closest();
	* //=> []
	*
	* $('.orange').closest('.apple');
	* // => []
	*
	* $('.orange').closest('li');
	* //=> [<li class="orange">Orange</li>]
	*
	* $('.orange').closest('#fruits');
	* //=> [<ul id="fruits"> ... </ul>]
	* ```
	*
	* @param selector - Selector for the element to find.
	* @returns The closest nodes.
	* @see {@link https://api.jquery.com/closest/}
	*/
	function closest(selector) {
		var _a;
		const set = [];
		if (!selector) return this._make(set);
		const selectOpts = {
			xmlMode: this.options.xmlMode,
			root: (_a = this._root) === null || _a === void 0 ? void 0 : _a[0]
		};
		const selectFn = typeof selector === "string" ? (elem) => is$1(elem, selector, selectOpts) : getFilterFn(selector);
		domEach(this, (elem) => {
			if (elem && !isDocument(elem) && !isTag(elem)) elem = elem.parent;
			while (elem && isTag(elem)) {
				if (selectFn(elem, 0)) {
					if (!set.includes(elem)) set.push(elem);
					break;
				}
				elem = elem.parent;
			}
		});
		return this._make(set);
	}
	/**
	* Gets the next sibling of each selected element, optionally filtered by a
	* selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.apple').next().hasClass('orange');
	* //=> true
	* ```
	*
	* @param selector - If specified filter for sibling.
	* @returns The next nodes.
	* @see {@link https://api.jquery.com/next/}
	*/
	const next = _singleMatcher((elem) => nextElementSibling(elem));
	/**
	* Gets all the following siblings of the each selected element, optionally
	* filtered by a selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.apple').nextAll();
	* //=> [<li class="orange">Orange</li>, <li class="pear">Pear</li>]
	* $('.apple').nextAll('.orange');
	* //=> [<li class="orange">Orange</li>]
	* ```
	*
	* @param selector - If specified filter for siblings.
	* @returns The next nodes.
	* @see {@link https://api.jquery.com/nextAll/}
	*/
	const nextAll = _matcher((elem) => {
		const matched = [];
		while (elem.next) {
			elem = elem.next;
			if (isTag(elem)) matched.push(elem);
		}
		return matched;
	}, _removeDuplicates);
	/**
	* Gets all the following siblings up to but not including the element matched
	* by the selector, optionally filtered by another selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.apple').nextUntil('.pear');
	* //=> [<li class="orange">Orange</li>]
	* ```
	*
	* @param selector - Selector for element to stop at.
	* @param filterSelector - If specified filter for siblings.
	* @returns The next nodes.
	* @see {@link https://api.jquery.com/nextUntil/}
	*/
	const nextUntil = _matchUntil((el) => nextElementSibling(el), _removeDuplicates);
	/**
	* Gets the previous sibling of each selected element optionally filtered by a
	* selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.orange').prev().hasClass('apple');
	* //=> true
	* ```
	*
	* @param selector - If specified filter for siblings.
	* @returns The previous nodes.
	* @see {@link https://api.jquery.com/prev/}
	*/
	const prev = _singleMatcher((elem) => prevElementSibling(elem));
	/**
	* Gets all the preceding siblings of each selected element, optionally filtered
	* by a selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.pear').prevAll();
	* //=> [<li class="orange">Orange</li>, <li class="apple">Apple</li>]
	*
	* $('.pear').prevAll('.orange');
	* //=> [<li class="orange">Orange</li>]
	* ```
	*
	* @param selector - If specified filter for siblings.
	* @returns The previous nodes.
	* @see {@link https://api.jquery.com/prevAll/}
	*/
	const prevAll = _matcher((elem) => {
		const matched = [];
		while (elem.prev) {
			elem = elem.prev;
			if (isTag(elem)) matched.push(elem);
		}
		return matched;
	}, _removeDuplicates);
	/**
	* Gets all the preceding siblings up to but not including the element matched
	* by the selector, optionally filtered by another selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.pear').prevUntil('.apple');
	* //=> [<li class="orange">Orange</li>]
	* ```
	*
	* @param selector - Selector for element to stop at.
	* @param filterSelector - If specified filter for siblings.
	* @returns The previous nodes.
	* @see {@link https://api.jquery.com/prevUntil/}
	*/
	const prevUntil = _matchUntil((el) => prevElementSibling(el), _removeDuplicates);
	/**
	* Get the siblings of each element (excluding the element) in the set of
	* matched elements, optionally filtered by a selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.pear').siblings().length;
	* //=> 2
	*
	* $('.pear').siblings('.orange').length;
	* //=> 1
	* ```
	*
	* @param selector - If specified filter for siblings.
	* @returns The siblings.
	* @see {@link https://api.jquery.com/siblings/}
	*/
	const siblings = _matcher((elem) => getSiblings(elem).filter((el) => isTag(el) && el !== elem), uniqueSort);
	/**
	* Gets the element children of each element in the set of matched elements.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('#fruits').children().length;
	* //=> 3
	*
	* $('#fruits').children('.pear').text();
	* //=> Pear
	* ```
	*
	* @param selector - If specified filter for children.
	* @returns The children.
	* @see {@link https://api.jquery.com/children/}
	*/
	const children = _matcher((elem) => getChildren(elem).filter(isTag), _removeDuplicates);
	/**
	* Gets the children of each element in the set of matched elements, including
	* text and comment nodes.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('#fruits').contents().length;
	* //=> 3
	* ```
	*
	* @returns The children.
	* @see {@link https://api.jquery.com/contents/}
	*/
	function contents() {
		const elems = this.toArray().reduce((newElems, elem) => hasChildren(elem) ? newElems.concat(elem.children) : newElems, []);
		return this._make(elems);
	}
	/**
	* Iterates over a cheerio object, executing a function for each matched
	* element. When the callback is fired, the function is fired in the context of
	* the DOM element, so `this` refers to the current element, which is equivalent
	* to the function parameter `element`. To break out of the `each` loop early,
	* return with `false`.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* const fruits = [];
	*
	* $('li').each(function (i, elem) {
	*   fruits[i] = $(this).text();
	* });
	*
	* fruits.join(', ');
	* //=> Apple, Orange, Pear
	* ```
	*
	* @param fn - Function to execute.
	* @returns The instance itself, useful for chaining.
	* @see {@link https://api.jquery.com/each/}
	*/
	function each(fn) {
		let i = 0;
		const len = this.length;
		while (i < len && fn.call(this[i], i, this[i]) !== false) ++i;
		return this;
	}
	/**
	* Pass each element in the current matched set through a function, producing a
	* new Cheerio object containing the return values. The function can return an
	* individual data item or an array of data items to be inserted into the
	* resulting set. If an array is returned, the elements inside the array are
	* inserted into the set. If the function returns null or undefined, no element
	* will be inserted.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('li')
	*   .map(function (i, el) {
	*     // this === el
	*     return $(this).text();
	*   })
	*   .toArray()
	*   .join(' ');
	* //=> "apple orange pear"
	* ```
	*
	* @param fn - Function to execute.
	* @returns The mapped elements, wrapped in a Cheerio collection.
	* @see {@link https://api.jquery.com/map/}
	*/
	function map(fn) {
		let elems = [];
		for (let i = 0; i < this.length; i++) {
			const el = this[i];
			const val = fn.call(el, i, el);
			if (val != null) elems = elems.concat(val);
		}
		return this._make(elems);
	}
	/**
	* Creates a function to test if a filter is matched.
	*
	* @param match - A filter.
	* @returns A function that determines if a filter has been matched.
	*/
	function getFilterFn(match) {
		if (typeof match === "function") return (el, i) => match.call(el, i, el);
		if (isCheerio(match)) return (el) => Array.prototype.includes.call(match, el);
		return function(el) {
			return match === el;
		};
	}
	function filter(match) {
		var _a;
		return this._make(filterArray(this.toArray(), match, this.options.xmlMode, (_a = this._root) === null || _a === void 0 ? void 0 : _a[0]));
	}
	function filterArray(nodes, match, xmlMode, root) {
		return typeof match === "string" ? filter$1(match, nodes, {
			xmlMode,
			root
		}) : nodes.filter(getFilterFn(match));
	}
	/**
	* Checks the current list of elements and returns `true` if _any_ of the
	* elements match the selector. If using an element or Cheerio selection,
	* returns `true` if _any_ of the elements match. If using a predicate function,
	* the function is executed in the context of the selected element, so `this`
	* refers to the current element.
	*
	* @category Traversing
	* @param selector - Selector for the selection.
	* @returns Whether or not the selector matches an element of the instance.
	* @see {@link https://api.jquery.com/is/}
	*/
	function is(selector) {
		const nodes = this.toArray();
		return typeof selector === "string" ? some(nodes.filter(isTag), selector, this.options) : selector ? nodes.some(getFilterFn(selector)) : false;
	}
	/**
	* Remove elements from the set of matched elements. Given a Cheerio object that
	* represents a set of DOM elements, the `.not()` method constructs a new
	* Cheerio object from a subset of the matching elements. The supplied selector
	* is tested against each element; the elements that don't match the selector
	* will be included in the result.
	*
	* The `.not()` method can take a function as its argument in the same way that
	* `.filter()` does. Elements for which the function returns `true` are excluded
	* from the filtered set; all other elements are included.
	*
	* @category Traversing
	* @example <caption>Selector</caption>
	*
	* ```js
	* $('li').not('.apple').length;
	* //=> 2
	* ```
	*
	* @example <caption>Function</caption>
	*
	* ```js
	* $('li').not(function (i, el) {
	*   // this === el
	*   return $(this).attr('class') === 'orange';
	* }).length; //=> 2
	* ```
	*
	* @param match - Value to look for, following the rules above.
	* @returns The filtered collection.
	* @see {@link https://api.jquery.com/not/}
	*/
	function not(match) {
		let nodes = this.toArray();
		if (typeof match === "string") {
			const matches = new Set(filter$1(match, nodes, this.options));
			nodes = nodes.filter((el) => !matches.has(el));
		} else {
			const filterFn = getFilterFn(match);
			nodes = nodes.filter((el, i) => !filterFn(el, i));
		}
		return this._make(nodes);
	}
	/**
	* Filters the set of matched elements to only those which have the given DOM
	* element as a descendant or which have a descendant that matches the given
	* selector. Equivalent to `.filter(':has(selector)')`.
	*
	* @category Traversing
	* @example <caption>Selector</caption>
	*
	* ```js
	* $('ul').has('.pear').attr('id');
	* //=> fruits
	* ```
	*
	* @example <caption>Element</caption>
	*
	* ```js
	* $('ul').has($('.pear')[0]).attr('id');
	* //=> fruits
	* ```
	*
	* @param selectorOrHaystack - Element to look for.
	* @returns The filtered collection.
	* @see {@link https://api.jquery.com/has/}
	*/
	function has(selectorOrHaystack) {
		return this.filter(typeof selectorOrHaystack === "string" ? `:has(${selectorOrHaystack})` : (_, el) => this._make(el).find(selectorOrHaystack).length > 0);
	}
	/**
	* Will select the first element of a cheerio object.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('#fruits').children().first().text();
	* //=> Apple
	* ```
	*
	* @returns The first element.
	* @see {@link https://api.jquery.com/first/}
	*/
	function first() {
		return this.length > 1 ? this._make(this[0]) : this;
	}
	/**
	* Will select the last element of a cheerio object.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('#fruits').children().last().text();
	* //=> Pear
	* ```
	*
	* @returns The last element.
	* @see {@link https://api.jquery.com/last/}
	*/
	function last() {
		return this.length > 0 ? this._make(this[this.length - 1]) : this;
	}
	/**
	* Reduce the set of matched elements to the one at the specified index. Use
	* `.eq(-i)` to count backwards from the last selected element.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('li').eq(0).text();
	* //=> Apple
	*
	* $('li').eq(-1).text();
	* //=> Pear
	* ```
	*
	* @param i - Index of the element to select.
	* @returns The element at the `i`th position.
	* @see {@link https://api.jquery.com/eq/}
	*/
	function eq(i) {
		var _a;
		i = +i;
		if (i === 0 && this.length <= 1) return this;
		if (i < 0) i = this.length + i;
		return this._make((_a = this[i]) !== null && _a !== void 0 ? _a : []);
	}
	function get(i) {
		if (i == null) return this.toArray();
		return this[i < 0 ? this.length + i : i];
	}
	/**
	* Retrieve all the DOM elements contained in the jQuery set as an array.
	*
	* @example
	*
	* ```js
	* $('li').toArray();
	* //=> [ {...}, {...}, {...} ]
	* ```
	*
	* @returns The contained items.
	*/
	function toArray() {
		return Array.prototype.slice.call(this);
	}
	/**
	* Search for a given element from among the matched elements.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.pear').index();
	* //=> 2 $('.orange').index('li');
	* //=> 1
	* $('.apple').index($('#fruit, li'));
	* //=> 1
	* ```
	*
	* @param selectorOrNeedle - Element to look for.
	* @returns The index of the element.
	* @see {@link https://api.jquery.com/index/}
	*/
	function index(selectorOrNeedle) {
		let $haystack;
		let needle;
		if (selectorOrNeedle == null) {
			$haystack = this.parent().children();
			needle = this[0];
		} else if (typeof selectorOrNeedle === "string") {
			$haystack = this._make(selectorOrNeedle);
			needle = this[0];
		} else {
			$haystack = this;
			needle = isCheerio(selectorOrNeedle) ? selectorOrNeedle[0] : selectorOrNeedle;
		}
		return Array.prototype.indexOf.call($haystack, needle);
	}
	/**
	* Gets the elements matching the specified range (0-based position).
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('li').slice(1).eq(0).text();
	* //=> 'Orange'
	*
	* $('li').slice(1, 2).length;
	* //=> 1
	* ```
	*
	* @param start - A position at which the elements begin to be selected. If
	*   negative, it indicates an offset from the end of the set.
	* @param end - A position at which the elements stop being selected. If
	*   negative, it indicates an offset from the end of the set. If omitted, the
	*   range continues until the end of the set.
	* @returns The elements matching the specified range.
	* @see {@link https://api.jquery.com/slice/}
	*/
	function slice(start, end) {
		return this._make(Array.prototype.slice.call(this, start, end));
	}
	/**
	* End the most recent filtering operation in the current chain and return the
	* set of matched elements to its previous state.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('li').eq(0).end().length;
	* //=> 3
	* ```
	*
	* @returns The previous state of the set of matched elements.
	* @see {@link https://api.jquery.com/end/}
	*/
	function end() {
		var _a;
		return (_a = this.prevObject) !== null && _a !== void 0 ? _a : this._make([]);
	}
	/**
	* Add elements to the set of matched elements.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('.apple').add('.orange').length;
	* //=> 2
	* ```
	*
	* @param other - Elements to add.
	* @param context - Optionally the context of the new selection.
	* @returns The combined set.
	* @see {@link https://api.jquery.com/add/}
	*/
	function add(other, context) {
		const selection = this._make(other, context);
		const contents = uniqueSort([...this.get(), ...selection.get()]);
		return this._make(contents);
	}
	/**
	* Add the previous set of elements on the stack to the current set, optionally
	* filtered by a selector.
	*
	* @category Traversing
	* @example
	*
	* ```js
	* $('li').eq(0).addBack('.orange').length;
	* //=> 2
	* ```
	*
	* @param selector - Selector for the elements to add.
	* @returns The combined set.
	* @see {@link https://api.jquery.com/addBack/}
	*/
	function addBack(selector) {
		return this.prevObject ? this.add(selector ? this.prevObject.filter(selector) : this.prevObject) : this;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/parse.js
/**
	* Get the parse function with options.
	*
	* @param parser - The parser function.
	* @returns The parse function with options.
	*/
	function getParse(parser) {
		/**
		* Parse a HTML string or a node.
		*
		* @param content - The HTML string or node.
		* @param options - The parser options.
		* @param isDocument - If `content` is a document.
		* @param context - The context node in the DOM tree.
		* @returns The parsed document node.
		*/
		return function parse(content, options, isDocument$1, context) {
			if (typeof Buffer !== "undefined" && Buffer.isBuffer(content)) content = content.toString();
			if (typeof content === "string") return parser(content, options, isDocument$1, context);
			const doc = content;
			if (!Array.isArray(doc) && isDocument(doc)) return doc;
			const root = new Document([]);
			update(doc, root);
			return root;
		};
	}
	/**
	* Update the dom structure, for one changed layer.
	*
	* @param newChilds - The new children.
	* @param parent - The new parent.
	* @returns The parent node.
	*/
	function update(newChilds, parent) {
		const arr = Array.isArray(newChilds) ? newChilds : [newChilds];
		if (parent) parent.children = arr;
		else parent = null;
		for (let i = 0; i < arr.length; i++) {
			const node = arr[i];
			if (node.parent && node.parent.children !== arr) removeElement(node);
			if (parent) {
				node.prev = arr[i - 1] || null;
				node.next = arr[i + 1] || null;
			} else node.prev = node.next = null;
			node.parent = parent;
		}
		return parent;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/api/manipulation.js
/**
	* Methods for modifying the DOM structure.
	*
	* @module cheerio/manipulation
	*/
	var manipulation_exports = /* @__PURE__ */ __exportAll({
		_makeDomArray: () => _makeDomArray,
		after: () => after,
		append: () => append,
		appendTo: () => appendTo,
		before: () => before,
		clone: () => clone,
		empty: () => empty,
		html: () => html,
		insertAfter: () => insertAfter,
		insertBefore: () => insertBefore,
		prepend: () => prepend,
		prependTo: () => prependTo,
		remove: () => remove,
		replaceWith: () => replaceWith,
		text: () => text,
		toString: () => toString$1,
		unwrap: () => unwrap,
		wrap: () => wrap,
		wrapAll: () => wrapAll,
		wrapInner: () => wrapInner
	});
	/**
	* Create an array of nodes, recursing into arrays and parsing strings if
	* necessary.
	*
	* @private
	* @category Manipulation
	* @param elem - Elements to make an array of.
	* @param clone - Optionally clone nodes.
	* @returns The array of nodes.
	*/
	function _makeDomArray(elem, clone) {
		if (elem == null) return [];
		if (typeof elem === "string") return this._parse(elem, this.options, false, null).children.slice(0);
		if ("length" in elem) {
			if (elem.length === 1) return this._makeDomArray(elem[0], clone);
			const result = [];
			for (let i = 0; i < elem.length; i++) {
				const el = elem[i];
				if (typeof el === "object") {
					if (el == null) continue;
					if (!("length" in el)) {
						result.push(clone ? cloneNode(el, true) : el);
						continue;
					}
				}
				result.push(...this._makeDomArray(el, clone));
			}
			return result;
		}
		return [clone ? cloneNode(elem, true) : elem];
	}
	function _insert(concatenator) {
		return function(...elems) {
			const lastIdx = this.length - 1;
			return domEach(this, (el, i) => {
				if (!hasChildren(el)) return;
				const domSrc = typeof elems[0] === "function" ? elems[0].call(el, i, this._render(el.children)) : elems;
				concatenator(this._makeDomArray(domSrc, i < lastIdx), el.children, el);
			});
		};
	}
	/**
	* Modify an array in-place, removing some number of elements and adding new
	* elements directly following them.
	*
	* @private
	* @category Manipulation
	* @param array - Target array to splice.
	* @param spliceIdx - Index at which to begin changing the array.
	* @param spliceCount - Number of elements to remove from the array.
	* @param newElems - Elements to insert into the array.
	* @param parent - The parent of the node.
	* @returns The spliced array.
	*/
	function uniqueSplice(array, spliceIdx, spliceCount, newElems, parent) {
		var _a, _b;
		const spliceArgs = [
			spliceIdx,
			spliceCount,
			...newElems
		];
		const prev = spliceIdx === 0 ? null : array[spliceIdx - 1];
		const next = spliceIdx + spliceCount >= array.length ? null : array[spliceIdx + spliceCount];
		for (let idx = 0; idx < newElems.length; ++idx) {
			const node = newElems[idx];
			const oldParent = node.parent;
			if (oldParent) {
				const prevIdx = oldParent.children.indexOf(node);
				if (prevIdx !== -1) {
					oldParent.children.splice(prevIdx, 1);
					if (parent === oldParent && spliceIdx > prevIdx) spliceArgs[0]--;
				}
			}
			node.parent = parent;
			if (node.prev) node.prev.next = (_a = node.next) !== null && _a !== void 0 ? _a : null;
			if (node.next) node.next.prev = (_b = node.prev) !== null && _b !== void 0 ? _b : null;
			node.prev = idx === 0 ? prev : newElems[idx - 1];
			node.next = idx === newElems.length - 1 ? next : newElems[idx + 1];
		}
		if (prev) prev.next = newElems[0];
		if (next) next.prev = newElems[newElems.length - 1];
		return array.splice(...spliceArgs);
	}
	/**
	* Insert every element in the set of matched elements to the end of the target.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('<li class="plum">Plum</li>').appendTo('#fruits');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="apple">Apple</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //      <li class="plum">Plum</li>
	* //    </ul>
	* ```
	*
	* @param target - Element to append elements to.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/appendTo/}
	*/
	function appendTo(target) {
		(isCheerio(target) ? target : this._make(target)).append(this);
		return this;
	}
	/**
	* Insert every element in the set of matched elements to the beginning of the
	* target.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('<li class="plum">Plum</li>').prependTo('#fruits');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="plum">Plum</li>
	* //      <li class="apple">Apple</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //    </ul>
	* ```
	*
	* @param target - Element to prepend elements to.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/prependTo/}
	*/
	function prependTo(target) {
		(isCheerio(target) ? target : this._make(target)).prepend(this);
		return this;
	}
	/**
	* Inserts content as the _last_ child of each of the selected elements.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('ul').append('<li class="plum">Plum</li>');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="apple">Apple</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //      <li class="plum">Plum</li>
	* //    </ul>
	* ```
	*
	* @see {@link https://api.jquery.com/append/}
	*/
	const append = _insert((dom, children, parent) => {
		uniqueSplice(children, children.length, 0, dom, parent);
	});
	/**
	* Inserts content as the _first_ child of each of the selected elements.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('ul').prepend('<li class="plum">Plum</li>');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="plum">Plum</li>
	* //      <li class="apple">Apple</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //    </ul>
	* ```
	*
	* @see {@link https://api.jquery.com/prepend/}
	*/
	const prepend = _insert((dom, children, parent) => {
		uniqueSplice(children, 0, 0, dom, parent);
	});
	function _wrap(insert) {
		return function(wrapper) {
			const lastIdx = this.length - 1;
			const lastParent = this.parents().last();
			for (let i = 0; i < this.length; i++) {
				const el = this[i];
				const wrap = typeof wrapper === "function" ? wrapper.call(el, i, el) : typeof wrapper === "string" && !isHtml(wrapper) ? lastParent.find(wrapper).clone() : wrapper;
				const [wrapperDom] = this._makeDomArray(wrap, i < lastIdx);
				if (!wrapperDom || !hasChildren(wrapperDom)) continue;
				let elInsertLocation = wrapperDom;
				let j = 0;
				while (j < elInsertLocation.children.length) {
					const child = elInsertLocation.children[j];
					if (isTag(child)) {
						elInsertLocation = child;
						j = 0;
					} else j++;
				}
				insert(el, elInsertLocation, [wrapperDom]);
			}
			return this;
		};
	}
	/**
	* The .wrap() function can take any string or object that could be passed to
	* the $() factory function to specify a DOM structure. This structure may be
	* nested several levels deep, but should contain only one inmost element. A
	* copy of this structure will be wrapped around each of the elements in the set
	* of matched elements. This method returns the original set of elements for
	* chaining purposes.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* const redFruit = $('<div class="red-fruit"></div>');
	* $('.apple').wrap(redFruit);
	*
	* //=> <ul id="fruits">
	* //     <div class="red-fruit">
	* //      <li class="apple">Apple</li>
	* //     </div>
	* //     <li class="orange">Orange</li>
	* //     <li class="plum">Plum</li>
	* //   </ul>
	*
	* const healthy = $('<div class="healthy"></div>');
	* $('li').wrap(healthy);
	*
	* //=> <ul id="fruits">
	* //     <div class="healthy">
	* //       <li class="apple">Apple</li>
	* //     </div>
	* //     <div class="healthy">
	* //       <li class="orange">Orange</li>
	* //     </div>
	* //     <div class="healthy">
	* //        <li class="plum">Plum</li>
	* //     </div>
	* //   </ul>
	* ```
	*
	* @param wrapper - The DOM structure to wrap around each element in the
	*   selection.
	* @see {@link https://api.jquery.com/wrap/}
	*/
	const wrap = _wrap((el, elInsertLocation, wrapperDom) => {
		const { parent } = el;
		if (!parent) return;
		const siblings = parent.children;
		const index = siblings.indexOf(el);
		update([el], elInsertLocation);
		uniqueSplice(siblings, index, 0, wrapperDom, parent);
	});
	/**
	* The .wrapInner() function can take any string or object that could be passed
	* to the $() factory function to specify a DOM structure. This structure may be
	* nested several levels deep, but should contain only one inmost element. The
	* structure will be wrapped around the content of each of the elements in the
	* set of matched elements.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* const redFruit = $('<div class="red-fruit"></div>');
	* $('.apple').wrapInner(redFruit);
	*
	* //=> <ul id="fruits">
	* //     <li class="apple">
	* //       <div class="red-fruit">Apple</div>
	* //     </li>
	* //     <li class="orange">Orange</li>
	* //     <li class="pear">Pear</li>
	* //   </ul>
	*
	* const healthy = $('<div class="healthy"></div>');
	* $('li').wrapInner(healthy);
	*
	* //=> <ul id="fruits">
	* //     <li class="apple">
	* //       <div class="healthy">Apple</div>
	* //     </li>
	* //     <li class="orange">
	* //       <div class="healthy">Orange</div>
	* //     </li>
	* //     <li class="pear">
	* //       <div class="healthy">Pear</div>
	* //     </li>
	* //   </ul>
	* ```
	*
	* @param wrapper - The DOM structure to wrap around the content of each element
	*   in the selection.
	* @returns The instance itself, for chaining.
	* @see {@link https://api.jquery.com/wrapInner/}
	*/
	const wrapInner = _wrap((el, elInsertLocation, wrapperDom) => {
		if (!hasChildren(el)) return;
		update(el.children, elInsertLocation);
		update(wrapperDom, el);
	});
	/**
	* The .unwrap() function, removes the parents of the set of matched elements
	* from the DOM, leaving the matched elements in their place.
	*
	* @category Manipulation
	* @example <caption>without selector</caption>
	*
	* ```js
	* const $ = cheerio.load(
	*   '<div id=test>\n  <div><p>Hello</p></div>\n  <div><p>World</p></div>\n</div>',
	* );
	* $('#test p').unwrap();
	*
	* //=> <div id=test>
	* //     <p>Hello</p>
	* //     <p>World</p>
	* //   </div>
	* ```
	*
	* @example <caption>with selector</caption>
	*
	* ```js
	* const $ = cheerio.load(
	*   '<div id=test>\n  <p>Hello</p>\n  <b><p>World</p></b>\n</div>',
	* );
	* $('#test p').unwrap('b');
	*
	* //=> <div id=test>
	* //     <p>Hello</p>
	* //     <p>World</p>
	* //   </div>
	* ```
	*
	* @param selector - A selector to check the parent element against. If an
	*   element's parent does not match the selector, the element won't be
	*   unwrapped.
	* @returns The instance itself, for chaining.
	* @see {@link https://api.jquery.com/unwrap/}
	*/
	function unwrap(selector) {
		this.parent(selector).not("body").each((_, el) => {
			this._make(el).replaceWith(el.children);
		});
		return this;
	}
	/**
	* The .wrapAll() function can take any string or object that could be passed to
	* the $() function to specify a DOM structure. This structure may be nested
	* several levels deep, but should contain only one inmost element. The
	* structure will be wrapped around all of the elements in the set of matched
	* elements, as a single group.
	*
	* @category Manipulation
	* @example <caption>With markup passed to `wrapAll`</caption>
	*
	* ```js
	* const $ = cheerio.load(
	*   '<div class="container"><div class="inner">First</div><div class="inner">Second</div></div>',
	* );
	* $('.inner').wrapAll("<div class='new'></div>");
	*
	* //=> <div class="container">
	* //     <div class='new'>
	* //       <div class="inner">First</div>
	* //       <div class="inner">Second</div>
	* //     </div>
	* //   </div>
	* ```
	*
	* @example <caption>With an existing cheerio instance</caption>
	*
	* ```js
	* const $ = cheerio.load(
	*   '<span>Span 1</span><strong>Strong</strong><span>Span 2</span>',
	* );
	* const wrap = $('<div><p><em><b></b></em></p></div>');
	* $('span').wrapAll(wrap);
	*
	* //=> <div>
	* //     <p>
	* //       <em>
	* //         <b>
	* //           <span>Span 1</span>
	* //           <span>Span 2</span>
	* //         </b>
	* //       </em>
	* //     </p>
	* //   </div>
	* //   <strong>Strong</strong>
	* ```
	*
	* @param wrapper - The DOM structure to wrap around all matched elements in the
	*   selection.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/wrapAll/}
	*/
	function wrapAll(wrapper) {
		const el = this[0];
		if (el) {
			const wrap = this._make(typeof wrapper === "function" ? wrapper.call(el, 0, el) : wrapper).insertBefore(el);
			let elInsertLocation;
			for (let i = 0; i < wrap.length; i++) if (wrap[i].type === Tag) elInsertLocation = wrap[i];
			let j = 0;
			while (elInsertLocation && j < elInsertLocation.children.length) {
				const child = elInsertLocation.children[j];
				if (child.type === Tag) {
					elInsertLocation = child;
					j = 0;
				} else j++;
			}
			if (elInsertLocation) this._make(elInsertLocation).append(this);
		}
		return this;
	}
	/**
	* Insert content next to each element in the set of matched elements.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('.apple').after('<li class="plum">Plum</li>');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="apple">Apple</li>
	* //      <li class="plum">Plum</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //    </ul>
	* ```
	*
	* @param elems - HTML string, DOM element, array of DOM elements or Cheerio to
	*   insert after each element in the set of matched elements.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/after/}
	*/
	function after(...elems) {
		const lastIdx = this.length - 1;
		return domEach(this, (el, i) => {
			if (!hasChildren(el) || !el.parent) return;
			const siblings = el.parent.children;
			const index = siblings.indexOf(el);
			/* istanbul ignore next */
			if (index === -1) return;
			const domSrc = typeof elems[0] === "function" ? elems[0].call(el, i, this._render(el.children)) : elems;
			const dom = this._makeDomArray(domSrc, i < lastIdx);
			uniqueSplice(siblings, index + 1, 0, dom, el.parent);
		});
	}
	/**
	* Insert every element in the set of matched elements after the target.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('<li class="plum">Plum</li>').insertAfter('.apple');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="apple">Apple</li>
	* //      <li class="plum">Plum</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //    </ul>
	* ```
	*
	* @param target - Element to insert elements after.
	* @returns The set of newly inserted elements.
	* @see {@link https://api.jquery.com/insertAfter/}
	*/
	function insertAfter(target) {
		if (typeof target === "string") target = this._make(target);
		this.remove();
		const clones = [];
		for (const el of this._makeDomArray(target)) {
			const clonedSelf = this.clone().toArray();
			const { parent } = el;
			if (!parent) continue;
			const siblings = parent.children;
			const index = siblings.indexOf(el);
			/* istanbul ignore next */
			if (index === -1) continue;
			uniqueSplice(siblings, index + 1, 0, clonedSelf, parent);
			clones.push(...clonedSelf);
		}
		return this._make(clones);
	}
	/**
	* Insert content previous to each element in the set of matched elements.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('.apple').before('<li class="plum">Plum</li>');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="plum">Plum</li>
	* //      <li class="apple">Apple</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //    </ul>
	* ```
	*
	* @param elems - HTML string, DOM element, array of DOM elements or Cheerio to
	*   insert before each element in the set of matched elements.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/before/}
	*/
	function before(...elems) {
		const lastIdx = this.length - 1;
		return domEach(this, (el, i) => {
			if (!hasChildren(el) || !el.parent) return;
			const siblings = el.parent.children;
			const index = siblings.indexOf(el);
			/* istanbul ignore next */
			if (index === -1) return;
			const domSrc = typeof elems[0] === "function" ? elems[0].call(el, i, this._render(el.children)) : elems;
			uniqueSplice(siblings, index, 0, this._makeDomArray(domSrc, i < lastIdx), el.parent);
		});
	}
	/**
	* Insert every element in the set of matched elements before the target.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('<li class="plum">Plum</li>').insertBefore('.apple');
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="plum">Plum</li>
	* //      <li class="apple">Apple</li>
	* //      <li class="orange">Orange</li>
	* //      <li class="pear">Pear</li>
	* //    </ul>
	* ```
	*
	* @param target - Element to insert elements before.
	* @returns The set of newly inserted elements.
	* @see {@link https://api.jquery.com/insertBefore/}
	*/
	function insertBefore(target) {
		const targetArr = this._make(target);
		this.remove();
		const clones = [];
		domEach(targetArr, (el) => {
			const clonedSelf = this.clone().toArray();
			const { parent } = el;
			if (!parent) return;
			const siblings = parent.children;
			const index = siblings.indexOf(el);
			/* istanbul ignore next */
			if (index === -1) return;
			uniqueSplice(siblings, index, 0, clonedSelf, parent);
			clones.push(...clonedSelf);
		});
		return this._make(clones);
	}
	/**
	* Removes the set of matched elements from the DOM and all their children.
	* `selector` filters the set of matched elements to be removed.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('.pear').remove();
	* $.html();
	* //=>  <ul id="fruits">
	* //      <li class="apple">Apple</li>
	* //      <li class="orange">Orange</li>
	* //    </ul>
	* ```
	*
	* @param selector - Optional selector for elements to remove.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/remove/}
	*/
	function remove(selector) {
		domEach(selector ? this.filter(selector) : this, (el) => {
			removeElement(el);
			el.prev = el.next = el.parent = null;
		});
		return this;
	}
	/**
	* Replaces matched elements with `content`.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* const plum = $('<li class="plum">Plum</li>');
	* $('.pear').replaceWith(plum);
	* $.html();
	* //=> <ul id="fruits">
	* //     <li class="apple">Apple</li>
	* //     <li class="orange">Orange</li>
	* //     <li class="plum">Plum</li>
	* //   </ul>
	* ```
	*
	* @param content - Replacement for matched elements.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/replaceWith/}
	*/
	function replaceWith(content) {
		return domEach(this, (el, i) => {
			const { parent } = el;
			if (!parent) return;
			const siblings = parent.children;
			const cont = typeof content === "function" ? content.call(el, i, el) : content;
			const dom = this._makeDomArray(cont);
			update(dom, null);
			uniqueSplice(siblings, siblings.indexOf(el), 1, dom, parent);
			if (!dom.includes(el)) el.parent = el.prev = el.next = null;
		});
	}
	/**
	* Removes all children from each item in the selection. Text nodes and comment
	* nodes are left as is.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* $('ul').empty();
	* $.html();
	* //=>  <ul id="fruits"></ul>
	* ```
	*
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/empty/}
	*/
	function empty() {
		return domEach(this, (el) => {
			if (!hasChildren(el)) return;
			for (const child of el.children) child.next = child.prev = child.parent = null;
			el.children.length = 0;
		});
	}
	function html(str) {
		if (str === void 0) {
			const el = this[0];
			if (!el || !hasChildren(el)) return null;
			return this._render(el.children);
		}
		return domEach(this, (el) => {
			if (!hasChildren(el)) return;
			for (const child of el.children) child.next = child.prev = child.parent = null;
			update(isCheerio(str) ? str.toArray() : this._parse(`${str}`, this.options, false, el).children, el);
		});
	}
	/**
	* Turns the collection to a string. Alias for `.html()`.
	*
	* @category Manipulation
	* @returns The rendered document.
	*/
	function toString$1() {
		return this._render(this);
	}
	function text(str) {
		if (str === void 0) return text$1(this);
		if (typeof str === "function") return domEach(this, (el, i) => this._make(el).text(str.call(el, i, text$1([el]))));
		return domEach(this, (el) => {
			if (!hasChildren(el)) return;
			for (const child of el.children) child.next = child.prev = child.parent = null;
			update(new Text(`${str}`), el);
		});
	}
	/**
	* Clone the cheerio object.
	*
	* @category Manipulation
	* @example
	*
	* ```js
	* const moreFruit = $('#fruits').clone();
	* ```
	*
	* @returns The cloned object.
	* @see {@link https://api.jquery.com/clone/}
	*/
	function clone() {
		const clone = Array.prototype.map.call(this.get(), (el) => cloneNode(el, true));
		const root = new Document(clone);
		for (const node of clone) node.parent = root;
		return this._make(clone);
	}

//#endregion
//#region node_modules/cheerio/dist/browser/api/css.js
	var css_exports = /* @__PURE__ */ __exportAll({ css: () => css });
	/**
	* Set multiple CSS properties for every matched element.
	*
	* @category CSS
	* @param prop - The names of the properties.
	* @param val - The new values.
	* @returns The instance itself.
	* @see {@link https://api.jquery.com/css/}
	*/
	function css(prop, val) {
		if (prop != null && val != null || typeof prop === "object" && !Array.isArray(prop)) return domEach(this, (el, i) => {
			if (isTag(el)) setCss(el, prop, val, i);
		});
		if (this.length === 0) return;
		return getCss(this[0], prop);
	}
	/**
	* Set styles of all elements.
	*
	* @private
	* @param el - Element to set style of.
	* @param prop - Name of property.
	* @param value - Value to set property to.
	* @param idx - Optional index within the selection.
	*/
	function setCss(el, prop, value, idx) {
		if (typeof prop === "string") {
			const styles = getCss(el);
			const val = typeof value === "function" ? value.call(el, idx, styles[prop]) : value;
			if (val === "") delete styles[prop];
			else if (val != null) styles[prop] = val;
			el.attribs["style"] = stringify(styles);
		} else if (typeof prop === "object") {
			const keys = Object.keys(prop);
			for (let i = 0; i < keys.length; i++) {
				const k = keys[i];
				setCss(el, k, prop[k], i);
			}
		}
	}
	function getCss(el, prop) {
		if (!el || !isTag(el)) return;
		const styles = parse$2(el.attribs["style"]);
		if (typeof prop === "string") return styles[prop];
		if (Array.isArray(prop)) {
			const newStyles = {};
			for (const item of prop) if (styles[item] != null) newStyles[item] = styles[item];
			return newStyles;
		}
		return styles;
	}
	/**
	* Stringify `obj` to styles.
	*
	* @private
	* @category CSS
	* @param obj - Object to stringify.
	* @returns The serialized styles.
	*/
	function stringify(obj) {
		return Object.keys(obj).reduce((str, prop) => `${str}${str ? " " : ""}${prop}: ${obj[prop]};`, "");
	}
	/**
	* Parse `styles`.
	*
	* @private
	* @category CSS
	* @param styles - Styles to be parsed.
	* @returns The parsed styles.
	*/
	function parse$2(styles) {
		styles = (styles || "").trim();
		if (!styles) return {};
		const obj = {};
		let key;
		for (const str of styles.split(";")) {
			const n = str.indexOf(":");
			if (n < 1 || n === str.length - 1) {
				const trimmed = str.trimEnd();
				if (trimmed.length > 0 && key !== void 0) obj[key] += `;${trimmed}`;
			} else {
				key = str.slice(0, n).trim();
				obj[key] = str.slice(n + 1).trim();
			}
		}
		return obj;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/api/forms.js
	var forms_exports = /* @__PURE__ */ __exportAll({
		serialize: () => serialize,
		serializeArray: () => serializeArray
	});
	const submittableSelector = "input,select,textarea,keygen";
	const r20 = /%20/g;
	const rCRLF = /\r?\n/g;
	/**
	* Encode a set of form elements as a string for submission.
	*
	* @category Forms
	* @example
	*
	* ```js
	* $('<form><input name="foo" value="bar" /></form>').serialize();
	* //=> 'foo=bar'
	* ```
	*
	* @returns The serialized form.
	* @see {@link https://api.jquery.com/serialize/}
	*/
	function serialize() {
		return this.serializeArray().map((data) => `${encodeURIComponent(data.name)}=${encodeURIComponent(data.value)}`).join("&").replace(r20, "+");
	}
	/**
	* Encode a set of form elements as an array of names and values.
	*
	* @category Forms
	* @example
	*
	* ```js
	* $('<form><input name="foo" value="bar" /></form>').serializeArray();
	* //=> [ { name: 'foo', value: 'bar' } ]
	* ```
	*
	* @returns The serialized form.
	* @see {@link https://api.jquery.com/serializeArray/}
	*/
	function serializeArray() {
		return this.map((_, elem) => {
			const $elem = this._make(elem);
			if (isTag(elem) && elem.name === "form") return $elem.find(submittableSelector).toArray();
			return $elem.filter(submittableSelector).toArray();
		}).filter("[name!=\"\"]:enabled:not(:submit, :button, :image, :reset, :file):matches([checked], :not(:checkbox, :radio))").map((_, elem) => {
			var _a;
			const $elem = this._make(elem);
			const name = $elem.attr("name");
			const value = (_a = $elem.val()) !== null && _a !== void 0 ? _a : "";
			if (Array.isArray(value)) return value.map((val) => ({
				name,
				value: val.replace(rCRLF, "\r\n")
			}));
			return {
				name,
				value: value.replace(rCRLF, "\r\n")
			};
		}).toArray();
	}

//#endregion
//#region node_modules/cheerio/dist/browser/api/extract.js
	var extract_exports = /* @__PURE__ */ __exportAll({ extract: () => extract });
	function getExtractDescr(descr) {
		var _a;
		if (typeof descr === "string") return {
			selector: descr,
			value: "textContent"
		};
		return {
			selector: descr.selector,
			value: (_a = descr.value) !== null && _a !== void 0 ? _a : "textContent"
		};
	}
	/**
	* Extract multiple values from a document, and store them in an object.
	*
	* @param map - An object containing key-value pairs. The keys are the names of
	*   the properties to be created on the object, and the values are the
	*   selectors to be used to extract the values.
	* @returns An object containing the extracted values.
	*/
	function extract(map) {
		const ret = {};
		for (const key in map) {
			const descr = map[key];
			const isArray = Array.isArray(descr);
			const { selector, value } = getExtractDescr(isArray ? descr[0] : descr);
			const fn = typeof value === "function" ? value : typeof value === "string" ? (el) => this._make(el).prop(value) : (el) => this._make(el).extract(value);
			if (isArray) ret[key] = this._findBySelector(selector, Number.POSITIVE_INFINITY).map((_, el) => fn(el, key, ret)).get();
			else {
				const $ = this._findBySelector(selector, 1);
				ret[key] = $.length > 0 ? fn($[0], key, ret) : void 0;
			}
		}
		return ret;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/cheerio.js
/**
	* The cheerio class is the central class of the library. It wraps a set of
	* elements and provides an API for traversing, modifying, and interacting with
	* the set.
	*
	* Loading a document will return the Cheerio class bound to the root element of
	* the document. The class will be instantiated when querying the document (when
	* calling `$('selector')`).
	*
	* @example This is the HTML markup we will be using in all of the API examples:
	*
	* ```html
	* <ul id="fruits">
	*   <li class="apple">Apple</li>
	*   <li class="orange">Orange</li>
	*   <li class="pear">Pear</li>
	* </ul>
	* ```
	*/
	var Cheerio = class {
		/**
		* Instance of cheerio. Methods are specified in the modules. Usage of this
		* constructor is not recommended. Please use `$.load` instead.
		*
		* @private
		* @param elements - The new selection.
		* @param root - Sets the root node.
		* @param options - Options for the instance.
		*/
		constructor(elements, root, options) {
			this.length = 0;
			this.options = options;
			this._root = root;
			if (elements) {
				for (let idx = 0; idx < elements.length; idx++) this[idx] = elements[idx];
				this.length = elements.length;
			}
		}
	};
	/** Set a signature of the object. */
	Cheerio.prototype.cheerio = "[cheerio object]";
	Cheerio.prototype.splice = Array.prototype.splice;
	Cheerio.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
	Object.assign(Cheerio.prototype, attributes_exports, traversing_exports, manipulation_exports, css_exports, forms_exports, extract_exports);

//#endregion
//#region node_modules/cheerio/dist/browser/load.js
	function getLoad(parse, render) {
		/**
		* Create a querying function, bound to a document created from the provided
		* markup.
		*
		* Note that similar to web browser contexts, this operation may introduce
		* `<html>`, `<head>`, and `<body>` elements; set `isDocument` to `false` to
		* switch to fragment mode and disable this.
		*
		* @param content - Markup to be loaded.
		* @param options - Options for the created instance.
		* @param isDocument - Allows parser to be switched to fragment mode.
		* @returns The loaded document.
		* @see {@link https://cheerio.js.org/docs/basics/loading#load} for additional usage information.
		*/
		return function load(content, options, isDocument = true) {
			if (content == null) throw new Error("cheerio.load() expects a string");
			const internalOpts = flattenOptions(options);
			const initialRoot = parse(content, internalOpts, isDocument, null);
			/**
			* Create an extended class here, so that extensions only live on one
			* instance.
			*/
			class LoadedCheerio extends Cheerio {
				_make(selector, context) {
					const cheerio = initialize(selector, context);
					cheerio.prevObject = this;
					return cheerio;
				}
				_parse(content, options, isDocument, context) {
					return parse(content, options, isDocument, context);
				}
				_render(dom) {
					return render(dom, this.options);
				}
			}
			function initialize(selector, context, root = initialRoot, opts) {
				if (selector && isCheerio(selector)) return selector;
				const options = flattenOptions(opts, internalOpts);
				const r = typeof root === "string" ? [parse(root, options, false, null)] : "length" in root ? root : [root];
				const rootInstance = isCheerio(r) ? r : new LoadedCheerio(r, null, options);
				rootInstance._root = rootInstance;
				if (!selector) return new LoadedCheerio(void 0, rootInstance, options);
				const elements = typeof selector === "string" && isHtml(selector) ? parse(selector, options, false, null).children : isNode(selector) ? [selector] : Array.isArray(selector) ? selector : void 0;
				const instance = new LoadedCheerio(elements, rootInstance, options);
				if (elements) return instance;
				if (typeof selector !== "string") throw new TypeError("Unexpected type of selector");
				let search = selector;
				const searchContext = context ? typeof context === "string" ? isHtml(context) ? new LoadedCheerio([parse(context, options, false, null)], rootInstance, options) : (search = `${context} ${search}`, rootInstance) : isCheerio(context) ? context : new LoadedCheerio(Array.isArray(context) ? context : [context], rootInstance, options) : rootInstance;
				if (!searchContext) return instance;
				return searchContext.find(search);
			}
			Object.assign(initialize, static_exports, {
				load,
				_root: initialRoot,
				_options: internalOpts,
				fn: LoadedCheerio.prototype,
				prototype: LoadedCheerio.prototype
			});
			return initialize;
		};
	}
	function isNode(obj) {
		return !!obj.name || obj.type === Root || obj.type === Text$1 || obj.type === Comment$1;
	}

//#endregion
//#region node_modules/parse5/dist/common/unicode.js
	const UNDEFINED_CODE_POINTS = new Set([
		65534,
		65535,
		131070,
		131071,
		196606,
		196607,
		262142,
		262143,
		327678,
		327679,
		393214,
		393215,
		458750,
		458751,
		524286,
		524287,
		589822,
		589823,
		655358,
		655359,
		720894,
		720895,
		786430,
		786431,
		851966,
		851967,
		917502,
		917503,
		983038,
		983039,
		1048574,
		1048575,
		1114110,
		1114111
	]);
	const REPLACEMENT_CHARACTER = "�";
	var CODE_POINTS;
	(function(CODE_POINTS) {
		CODE_POINTS[CODE_POINTS["EOF"] = -1] = "EOF";
		CODE_POINTS[CODE_POINTS["NULL"] = 0] = "NULL";
		CODE_POINTS[CODE_POINTS["TABULATION"] = 9] = "TABULATION";
		CODE_POINTS[CODE_POINTS["CARRIAGE_RETURN"] = 13] = "CARRIAGE_RETURN";
		CODE_POINTS[CODE_POINTS["LINE_FEED"] = 10] = "LINE_FEED";
		CODE_POINTS[CODE_POINTS["FORM_FEED"] = 12] = "FORM_FEED";
		CODE_POINTS[CODE_POINTS["SPACE"] = 32] = "SPACE";
		CODE_POINTS[CODE_POINTS["EXCLAMATION_MARK"] = 33] = "EXCLAMATION_MARK";
		CODE_POINTS[CODE_POINTS["QUOTATION_MARK"] = 34] = "QUOTATION_MARK";
		CODE_POINTS[CODE_POINTS["AMPERSAND"] = 38] = "AMPERSAND";
		CODE_POINTS[CODE_POINTS["APOSTROPHE"] = 39] = "APOSTROPHE";
		CODE_POINTS[CODE_POINTS["HYPHEN_MINUS"] = 45] = "HYPHEN_MINUS";
		CODE_POINTS[CODE_POINTS["SOLIDUS"] = 47] = "SOLIDUS";
		CODE_POINTS[CODE_POINTS["DIGIT_0"] = 48] = "DIGIT_0";
		CODE_POINTS[CODE_POINTS["DIGIT_9"] = 57] = "DIGIT_9";
		CODE_POINTS[CODE_POINTS["SEMICOLON"] = 59] = "SEMICOLON";
		CODE_POINTS[CODE_POINTS["LESS_THAN_SIGN"] = 60] = "LESS_THAN_SIGN";
		CODE_POINTS[CODE_POINTS["EQUALS_SIGN"] = 61] = "EQUALS_SIGN";
		CODE_POINTS[CODE_POINTS["GREATER_THAN_SIGN"] = 62] = "GREATER_THAN_SIGN";
		CODE_POINTS[CODE_POINTS["QUESTION_MARK"] = 63] = "QUESTION_MARK";
		CODE_POINTS[CODE_POINTS["LATIN_CAPITAL_A"] = 65] = "LATIN_CAPITAL_A";
		CODE_POINTS[CODE_POINTS["LATIN_CAPITAL_Z"] = 90] = "LATIN_CAPITAL_Z";
		CODE_POINTS[CODE_POINTS["RIGHT_SQUARE_BRACKET"] = 93] = "RIGHT_SQUARE_BRACKET";
		CODE_POINTS[CODE_POINTS["GRAVE_ACCENT"] = 96] = "GRAVE_ACCENT";
		CODE_POINTS[CODE_POINTS["LATIN_SMALL_A"] = 97] = "LATIN_SMALL_A";
		CODE_POINTS[CODE_POINTS["LATIN_SMALL_Z"] = 122] = "LATIN_SMALL_Z";
	})(CODE_POINTS || (CODE_POINTS = {}));
	const SEQUENCES = {
		DASH_DASH: "--",
		CDATA_START: "[CDATA[",
		DOCTYPE: "doctype",
		SCRIPT: "script",
		PUBLIC: "public",
		SYSTEM: "system"
	};
	function isSurrogate(cp) {
		return cp >= 55296 && cp <= 57343;
	}
	function isSurrogatePair(cp) {
		return cp >= 56320 && cp <= 57343;
	}
	function getSurrogatePairCodePoint(cp1, cp2) {
		return (cp1 - 55296) * 1024 + 9216 + cp2;
	}
	function isControlCodePoint(cp) {
		return cp !== 32 && cp !== 10 && cp !== 13 && cp !== 9 && cp !== 12 && cp >= 1 && cp <= 31 || cp >= 127 && cp <= 159;
	}
	function isUndefinedCodePoint(cp) {
		return cp >= 64976 && cp <= 65007 || UNDEFINED_CODE_POINTS.has(cp);
	}

//#endregion
//#region node_modules/parse5/dist/common/error-codes.js
	var ERR;
	(function(ERR) {
		ERR["controlCharacterInInputStream"] = "control-character-in-input-stream";
		ERR["noncharacterInInputStream"] = "noncharacter-in-input-stream";
		ERR["surrogateInInputStream"] = "surrogate-in-input-stream";
		ERR["nonVoidHtmlElementStartTagWithTrailingSolidus"] = "non-void-html-element-start-tag-with-trailing-solidus";
		ERR["endTagWithAttributes"] = "end-tag-with-attributes";
		ERR["endTagWithTrailingSolidus"] = "end-tag-with-trailing-solidus";
		ERR["unexpectedSolidusInTag"] = "unexpected-solidus-in-tag";
		ERR["unexpectedNullCharacter"] = "unexpected-null-character";
		ERR["unexpectedQuestionMarkInsteadOfTagName"] = "unexpected-question-mark-instead-of-tag-name";
		ERR["invalidFirstCharacterOfTagName"] = "invalid-first-character-of-tag-name";
		ERR["unexpectedEqualsSignBeforeAttributeName"] = "unexpected-equals-sign-before-attribute-name";
		ERR["missingEndTagName"] = "missing-end-tag-name";
		ERR["unexpectedCharacterInAttributeName"] = "unexpected-character-in-attribute-name";
		ERR["unknownNamedCharacterReference"] = "unknown-named-character-reference";
		ERR["missingSemicolonAfterCharacterReference"] = "missing-semicolon-after-character-reference";
		ERR["unexpectedCharacterAfterDoctypeSystemIdentifier"] = "unexpected-character-after-doctype-system-identifier";
		ERR["unexpectedCharacterInUnquotedAttributeValue"] = "unexpected-character-in-unquoted-attribute-value";
		ERR["eofBeforeTagName"] = "eof-before-tag-name";
		ERR["eofInTag"] = "eof-in-tag";
		ERR["missingAttributeValue"] = "missing-attribute-value";
		ERR["missingWhitespaceBetweenAttributes"] = "missing-whitespace-between-attributes";
		ERR["missingWhitespaceAfterDoctypePublicKeyword"] = "missing-whitespace-after-doctype-public-keyword";
		ERR["missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers"] = "missing-whitespace-between-doctype-public-and-system-identifiers";
		ERR["missingWhitespaceAfterDoctypeSystemKeyword"] = "missing-whitespace-after-doctype-system-keyword";
		ERR["missingQuoteBeforeDoctypePublicIdentifier"] = "missing-quote-before-doctype-public-identifier";
		ERR["missingQuoteBeforeDoctypeSystemIdentifier"] = "missing-quote-before-doctype-system-identifier";
		ERR["missingDoctypePublicIdentifier"] = "missing-doctype-public-identifier";
		ERR["missingDoctypeSystemIdentifier"] = "missing-doctype-system-identifier";
		ERR["abruptDoctypePublicIdentifier"] = "abrupt-doctype-public-identifier";
		ERR["abruptDoctypeSystemIdentifier"] = "abrupt-doctype-system-identifier";
		ERR["cdataInHtmlContent"] = "cdata-in-html-content";
		ERR["incorrectlyOpenedComment"] = "incorrectly-opened-comment";
		ERR["eofInScriptHtmlCommentLikeText"] = "eof-in-script-html-comment-like-text";
		ERR["eofInDoctype"] = "eof-in-doctype";
		ERR["nestedComment"] = "nested-comment";
		ERR["abruptClosingOfEmptyComment"] = "abrupt-closing-of-empty-comment";
		ERR["eofInComment"] = "eof-in-comment";
		ERR["incorrectlyClosedComment"] = "incorrectly-closed-comment";
		ERR["eofInCdata"] = "eof-in-cdata";
		ERR["absenceOfDigitsInNumericCharacterReference"] = "absence-of-digits-in-numeric-character-reference";
		ERR["nullCharacterReference"] = "null-character-reference";
		ERR["surrogateCharacterReference"] = "surrogate-character-reference";
		ERR["characterReferenceOutsideUnicodeRange"] = "character-reference-outside-unicode-range";
		ERR["controlCharacterReference"] = "control-character-reference";
		ERR["noncharacterCharacterReference"] = "noncharacter-character-reference";
		ERR["missingWhitespaceBeforeDoctypeName"] = "missing-whitespace-before-doctype-name";
		ERR["missingDoctypeName"] = "missing-doctype-name";
		ERR["invalidCharacterSequenceAfterDoctypeName"] = "invalid-character-sequence-after-doctype-name";
		ERR["duplicateAttribute"] = "duplicate-attribute";
		ERR["nonConformingDoctype"] = "non-conforming-doctype";
		ERR["missingDoctype"] = "missing-doctype";
		ERR["misplacedDoctype"] = "misplaced-doctype";
		ERR["endTagWithoutMatchingOpenElement"] = "end-tag-without-matching-open-element";
		ERR["closingOfElementWithOpenChildElements"] = "closing-of-element-with-open-child-elements";
		ERR["disallowedContentInNoscriptInHead"] = "disallowed-content-in-noscript-in-head";
		ERR["openElementsLeftAfterEof"] = "open-elements-left-after-eof";
		ERR["abandonedHeadElementChild"] = "abandoned-head-element-child";
		ERR["misplacedStartTagForHeadElement"] = "misplaced-start-tag-for-head-element";
		ERR["nestedNoscriptInHead"] = "nested-noscript-in-head";
		ERR["eofInElementThatCanContainOnlyText"] = "eof-in-element-that-can-contain-only-text";
	})(ERR || (ERR = {}));

//#endregion
//#region node_modules/parse5/dist/tokenizer/preprocessor.js
	const DEFAULT_BUFFER_WATERLINE = 65536;
	var Preprocessor = class {
		constructor(handler) {
			this.handler = handler;
			this.html = "";
			this.pos = -1;
			this.lastGapPos = -2;
			this.gapStack = [];
			this.skipNextNewLine = false;
			this.lastChunkWritten = false;
			this.endOfChunkHit = false;
			this.bufferWaterline = DEFAULT_BUFFER_WATERLINE;
			this.isEol = false;
			this.lineStartPos = 0;
			this.droppedBufferSize = 0;
			this.line = 1;
			this.lastErrOffset = -1;
		}
		/** The column on the current line. If we just saw a gap (eg. a surrogate pair), return the index before. */
		get col() {
			return this.pos - this.lineStartPos + Number(this.lastGapPos !== this.pos);
		}
		get offset() {
			return this.droppedBufferSize + this.pos;
		}
		getError(code, cpOffset) {
			const { line, col, offset } = this;
			const startCol = col + cpOffset;
			const startOffset = offset + cpOffset;
			return {
				code,
				startLine: line,
				endLine: line,
				startCol,
				endCol: startCol,
				startOffset,
				endOffset: startOffset
			};
		}
		_err(code) {
			if (this.handler.onParseError && this.lastErrOffset !== this.offset) {
				this.lastErrOffset = this.offset;
				this.handler.onParseError(this.getError(code, 0));
			}
		}
		_addGap() {
			this.gapStack.push(this.lastGapPos);
			this.lastGapPos = this.pos;
		}
		_processSurrogate(cp) {
			if (this.pos !== this.html.length - 1) {
				const nextCp = this.html.charCodeAt(this.pos + 1);
				if (isSurrogatePair(nextCp)) {
					this.pos++;
					this._addGap();
					return getSurrogatePairCodePoint(cp, nextCp);
				}
			} else if (!this.lastChunkWritten) {
				this.endOfChunkHit = true;
				return CODE_POINTS.EOF;
			}
			this._err(ERR.surrogateInInputStream);
			return cp;
		}
		willDropParsedChunk() {
			return this.pos > this.bufferWaterline;
		}
		dropParsedChunk() {
			if (this.willDropParsedChunk()) {
				this.html = this.html.substring(this.pos);
				this.lineStartPos -= this.pos;
				this.droppedBufferSize += this.pos;
				this.pos = 0;
				this.lastGapPos = -2;
				this.gapStack.length = 0;
			}
		}
		write(chunk, isLastChunk) {
			if (this.html.length > 0) this.html += chunk;
			else this.html = chunk;
			this.endOfChunkHit = false;
			this.lastChunkWritten = isLastChunk;
		}
		insertHtmlAtCurrentPos(chunk) {
			this.html = this.html.substring(0, this.pos + 1) + chunk + this.html.substring(this.pos + 1);
			this.endOfChunkHit = false;
		}
		startsWith(pattern, caseSensitive) {
			if (this.pos + pattern.length > this.html.length) {
				this.endOfChunkHit = !this.lastChunkWritten;
				return false;
			}
			if (caseSensitive) return this.html.startsWith(pattern, this.pos);
			for (let i = 0; i < pattern.length; i++) if ((this.html.charCodeAt(this.pos + i) | 32) !== pattern.charCodeAt(i)) return false;
			return true;
		}
		peek(offset) {
			const pos = this.pos + offset;
			if (pos >= this.html.length) {
				this.endOfChunkHit = !this.lastChunkWritten;
				return CODE_POINTS.EOF;
			}
			const code = this.html.charCodeAt(pos);
			return code === CODE_POINTS.CARRIAGE_RETURN ? CODE_POINTS.LINE_FEED : code;
		}
		advance() {
			this.pos++;
			if (this.isEol) {
				this.isEol = false;
				this.line++;
				this.lineStartPos = this.pos;
			}
			if (this.pos >= this.html.length) {
				this.endOfChunkHit = !this.lastChunkWritten;
				return CODE_POINTS.EOF;
			}
			let cp = this.html.charCodeAt(this.pos);
			if (cp === CODE_POINTS.CARRIAGE_RETURN) {
				this.isEol = true;
				this.skipNextNewLine = true;
				return CODE_POINTS.LINE_FEED;
			}
			if (cp === CODE_POINTS.LINE_FEED) {
				this.isEol = true;
				if (this.skipNextNewLine) {
					this.line--;
					this.skipNextNewLine = false;
					this._addGap();
					return this.advance();
				}
			}
			this.skipNextNewLine = false;
			if (isSurrogate(cp)) cp = this._processSurrogate(cp);
			if (!(this.handler.onParseError === null || cp > 31 && cp < 127 || cp === CODE_POINTS.LINE_FEED || cp === CODE_POINTS.CARRIAGE_RETURN || cp > 159 && cp < 64976)) this._checkForProblematicCharacters(cp);
			return cp;
		}
		_checkForProblematicCharacters(cp) {
			if (isControlCodePoint(cp)) this._err(ERR.controlCharacterInInputStream);
			else if (isUndefinedCodePoint(cp)) this._err(ERR.noncharacterInInputStream);
		}
		retreat(count) {
			this.pos -= count;
			while (this.pos < this.lastGapPos) {
				this.lastGapPos = this.gapStack.pop();
				this.pos--;
			}
			this.isEol = false;
		}
	};

//#endregion
//#region node_modules/parse5/dist/common/token.js
	var TokenType;
	(function(TokenType) {
		TokenType[TokenType["CHARACTER"] = 0] = "CHARACTER";
		TokenType[TokenType["NULL_CHARACTER"] = 1] = "NULL_CHARACTER";
		TokenType[TokenType["WHITESPACE_CHARACTER"] = 2] = "WHITESPACE_CHARACTER";
		TokenType[TokenType["START_TAG"] = 3] = "START_TAG";
		TokenType[TokenType["END_TAG"] = 4] = "END_TAG";
		TokenType[TokenType["COMMENT"] = 5] = "COMMENT";
		TokenType[TokenType["DOCTYPE"] = 6] = "DOCTYPE";
		TokenType[TokenType["EOF"] = 7] = "EOF";
		TokenType[TokenType["HIBERNATION"] = 8] = "HIBERNATION";
	})(TokenType || (TokenType = {}));
	function getTokenAttr(token, attrName) {
		for (let i = token.attrs.length - 1; i >= 0; i--) if (token.attrs[i].name === attrName) return token.attrs[i].value;
		return null;
	}

//#endregion
//#region node_modules/parse5/node_modules/entities/dist/esm/generated/decode-data-html.js
	const htmlDecodeTree = /* @__PURE__ */ new Uint16Array(/* @__PURE__ */ "ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻\"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻\xA0ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌".split("").map((c) => c.charCodeAt(0)));

//#endregion
//#region node_modules/parse5/node_modules/entities/dist/esm/decode-codepoint.js
	var _a;
	const decodeMap = new Map([
		[0, 65533],
		[128, 8364],
		[130, 8218],
		[131, 402],
		[132, 8222],
		[133, 8230],
		[134, 8224],
		[135, 8225],
		[136, 710],
		[137, 8240],
		[138, 352],
		[139, 8249],
		[140, 338],
		[142, 381],
		[145, 8216],
		[146, 8217],
		[147, 8220],
		[148, 8221],
		[149, 8226],
		[150, 8211],
		[151, 8212],
		[152, 732],
		[153, 8482],
		[154, 353],
		[155, 8250],
		[156, 339],
		[158, 382],
		[159, 376]
	]);
	/**
	* Polyfill for `String.fromCodePoint`. It is used to create a string from a Unicode code point.
	*/
	const fromCodePoint = (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function(codePoint) {
		let output = "";
		if (codePoint > 65535) {
			codePoint -= 65536;
			output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
			codePoint = 56320 | codePoint & 1023;
		}
		output += String.fromCharCode(codePoint);
		return output;
	};
	/**
	* Replace the given code point with a replacement character if it is a
	* surrogate or is outside the valid range. Otherwise return the code
	* point unchanged.
	*/
	function replaceCodePoint(codePoint) {
		var _a;
		if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) return 65533;
		return (_a = decodeMap.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint;
	}

//#endregion
//#region node_modules/parse5/node_modules/entities/dist/esm/decode.js
	var CharCodes;
	(function(CharCodes) {
		CharCodes[CharCodes["NUM"] = 35] = "NUM";
		CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
		CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
		CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
		CharCodes[CharCodes["NINE"] = 57] = "NINE";
		CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
		CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
		CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
		CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
		CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
		CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
		CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
	})(CharCodes || (CharCodes = {}));
	/** Bit that needs to be set to convert an upper case ASCII character to lower case */
	const TO_LOWER_BIT = 32;
	var BinTrieFlags;
	(function(BinTrieFlags) {
		BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
		BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
		BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
	})(BinTrieFlags || (BinTrieFlags = {}));
	function isNumber(code) {
		return code >= CharCodes.ZERO && code <= CharCodes.NINE;
	}
	function isHexadecimalCharacter(code) {
		return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
	}
	function isAsciiAlphaNumeric$1(code) {
		return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
	}
	/**
	* Checks if the given character is a valid end character for an entity in an attribute.
	*
	* Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
	* See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
	*/
	function isEntityInAttributeInvalidEnd(code) {
		return code === CharCodes.EQUALS || isAsciiAlphaNumeric$1(code);
	}
	var EntityDecoderState;
	(function(EntityDecoderState) {
		EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
		EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
		EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
		EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
		EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
	})(EntityDecoderState || (EntityDecoderState = {}));
	var DecodingMode;
	(function(DecodingMode) {
		/** Entities in text nodes that can end with any character. */
		DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
		/** Only allow entities terminated with a semicolon. */
		DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
		/** Entities in attributes have limitations on ending characters. */
		DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
	})(DecodingMode || (DecodingMode = {}));
	/**
	* Token decoder with support of writing partial entities.
	*/
	var EntityDecoder = class {
		constructor(decodeTree, emitCodePoint, errors) {
			this.decodeTree = decodeTree;
			this.emitCodePoint = emitCodePoint;
			this.errors = errors;
			/** The current state of the decoder. */
			this.state = EntityDecoderState.EntityStart;
			/** Characters that were consumed while parsing an entity. */
			this.consumed = 1;
			/**
			* The result of the entity.
			*
			* Either the result index of a numeric entity, or the codepoint of a
			* numeric entity.
			*/
			this.result = 0;
			/** The current index in the decode tree. */
			this.treeIndex = 0;
			/** The number of characters that were consumed in excess. */
			this.excess = 1;
			/** The mode in which the decoder is operating. */
			this.decodeMode = DecodingMode.Strict;
		}
		/** Resets the instance to make it reusable. */
		startEntity(decodeMode) {
			this.decodeMode = decodeMode;
			this.state = EntityDecoderState.EntityStart;
			this.result = 0;
			this.treeIndex = 0;
			this.excess = 1;
			this.consumed = 1;
		}
		/**
		* Write an entity to the decoder. This can be called multiple times with partial entities.
		* If the entity is incomplete, the decoder will return -1.
		*
		* Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
		* entity is incomplete, and resume when the next string is written.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		write(input, offset) {
			switch (this.state) {
				case EntityDecoderState.EntityStart:
					if (input.charCodeAt(offset) === CharCodes.NUM) {
						this.state = EntityDecoderState.NumericStart;
						this.consumed += 1;
						return this.stateNumericStart(input, offset + 1);
					}
					this.state = EntityDecoderState.NamedEntity;
					return this.stateNamedEntity(input, offset);
				case EntityDecoderState.NumericStart: return this.stateNumericStart(input, offset);
				case EntityDecoderState.NumericDecimal: return this.stateNumericDecimal(input, offset);
				case EntityDecoderState.NumericHex: return this.stateNumericHex(input, offset);
				case EntityDecoderState.NamedEntity: return this.stateNamedEntity(input, offset);
			}
		}
		/**
		* Switches between the numeric decimal and hexadecimal states.
		*
		* Equivalent to the `Numeric character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericStart(input, offset) {
			if (offset >= input.length) return -1;
			if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
				this.state = EntityDecoderState.NumericHex;
				this.consumed += 1;
				return this.stateNumericHex(input, offset + 1);
			}
			this.state = EntityDecoderState.NumericDecimal;
			return this.stateNumericDecimal(input, offset);
		}
		addToNumericResult(input, start, end, base) {
			if (start !== end) {
				const digitCount = end - start;
				this.result = this.result * Math.pow(base, digitCount) + Number.parseInt(input.substr(start, digitCount), base);
				this.consumed += digitCount;
			}
		}
		/**
		* Parses a hexadecimal numeric entity.
		*
		* Equivalent to the `Hexademical character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericHex(input, offset) {
			const startIndex = offset;
			while (offset < input.length) {
				const char = input.charCodeAt(offset);
				if (isNumber(char) || isHexadecimalCharacter(char)) offset += 1;
				else {
					this.addToNumericResult(input, startIndex, offset, 16);
					return this.emitNumericEntity(char, 3);
				}
			}
			this.addToNumericResult(input, startIndex, offset, 16);
			return -1;
		}
		/**
		* Parses a decimal numeric entity.
		*
		* Equivalent to the `Decimal character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericDecimal(input, offset) {
			const startIndex = offset;
			while (offset < input.length) {
				const char = input.charCodeAt(offset);
				if (isNumber(char)) offset += 1;
				else {
					this.addToNumericResult(input, startIndex, offset, 10);
					return this.emitNumericEntity(char, 2);
				}
			}
			this.addToNumericResult(input, startIndex, offset, 10);
			return -1;
		}
		/**
		* Validate and emit a numeric entity.
		*
		* Implements the logic from the `Hexademical character reference start
		* state` and `Numeric character reference end state` in the HTML spec.
		*
		* @param lastCp The last code point of the entity. Used to see if the
		*               entity was terminated with a semicolon.
		* @param expectedLength The minimum number of characters that should be
		*                       consumed. Used to validate that at least one digit
		*                       was consumed.
		* @returns The number of characters that were consumed.
		*/
		emitNumericEntity(lastCp, expectedLength) {
			var _a;
			if (this.consumed <= expectedLength) {
				(_a = this.errors) === null || _a === void 0 || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
				return 0;
			}
			if (lastCp === CharCodes.SEMI) this.consumed += 1;
			else if (this.decodeMode === DecodingMode.Strict) return 0;
			this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
			if (this.errors) {
				if (lastCp !== CharCodes.SEMI) this.errors.missingSemicolonAfterCharacterReference();
				this.errors.validateNumericCharacterReference(this.result);
			}
			return this.consumed;
		}
		/**
		* Parses a named entity.
		*
		* Equivalent to the `Named character reference state` in the HTML spec.
		*
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNamedEntity(input, offset) {
			const { decodeTree } = this;
			let current = decodeTree[this.treeIndex];
			let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
			for (; offset < input.length; offset++, this.excess++) {
				const char = input.charCodeAt(offset);
				this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
				if (this.treeIndex < 0) return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
				current = decodeTree[this.treeIndex];
				valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
				if (valueLength !== 0) {
					if (char === CharCodes.SEMI) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
					if (this.decodeMode !== DecodingMode.Strict) {
						this.result = this.treeIndex;
						this.consumed += this.excess;
						this.excess = 0;
					}
				}
			}
			return -1;
		}
		/**
		* Emit a named entity that was not terminated with a semicolon.
		*
		* @returns The number of characters consumed.
		*/
		emitNotTerminatedNamedEntity() {
			var _a;
			const { result, decodeTree } = this;
			const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
			this.emitNamedEntityData(result, valueLength, this.consumed);
			(_a = this.errors) === null || _a === void 0 || _a.missingSemicolonAfterCharacterReference();
			return this.consumed;
		}
		/**
		* Emit a named entity.
		*
		* @param result The index of the entity in the decode tree.
		* @param valueLength The number of bytes in the entity.
		* @param consumed The number of characters consumed.
		*
		* @returns The number of characters consumed.
		*/
		emitNamedEntityData(result, valueLength, consumed) {
			const { decodeTree } = this;
			this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
			if (valueLength === 3) this.emitCodePoint(decodeTree[result + 2], consumed);
			return consumed;
		}
		/**
		* Signal to the parser that the end of the input was reached.
		*
		* Remaining data will be emitted and relevant errors will be produced.
		*
		* @returns The number of characters consumed.
		*/
		end() {
			var _a;
			switch (this.state) {
				case EntityDecoderState.NamedEntity: return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
				case EntityDecoderState.NumericDecimal: return this.emitNumericEntity(0, 2);
				case EntityDecoderState.NumericHex: return this.emitNumericEntity(0, 3);
				case EntityDecoderState.NumericStart:
					(_a = this.errors) === null || _a === void 0 || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
					return 0;
				case EntityDecoderState.EntityStart: return 0;
			}
		}
	};
	/**
	* Determines the branch of the current node that is taken given the current
	* character. This function is used to traverse the trie.
	*
	* @param decodeTree The trie.
	* @param current The current node.
	* @param nodeIdx The index right after the current node and its value.
	* @param char The current character.
	* @returns The index of the next node, or -1 if no branch is taken.
	*/
	function determineBranch(decodeTree, current, nodeIndex, char) {
		const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
		const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
		if (branchCount === 0) return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
		if (jumpOffset) {
			const value = char - jumpOffset;
			return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIndex + value] - 1;
		}
		let lo = nodeIndex;
		let hi = lo + branchCount - 1;
		while (lo <= hi) {
			const mid = lo + hi >>> 1;
			const midValue = decodeTree[mid];
			if (midValue < char) lo = mid + 1;
			else if (midValue > char) hi = mid - 1;
			else return decodeTree[mid + branchCount];
		}
		return -1;
	}

//#endregion
//#region node_modules/parse5/dist/common/html.js
/** All valid namespaces in HTML. */
	var NS;
	(function(NS) {
		NS["HTML"] = "http://www.w3.org/1999/xhtml";
		NS["MATHML"] = "http://www.w3.org/1998/Math/MathML";
		NS["SVG"] = "http://www.w3.org/2000/svg";
		NS["XLINK"] = "http://www.w3.org/1999/xlink";
		NS["XML"] = "http://www.w3.org/XML/1998/namespace";
		NS["XMLNS"] = "http://www.w3.org/2000/xmlns/";
	})(NS || (NS = {}));
	var ATTRS;
	(function(ATTRS) {
		ATTRS["TYPE"] = "type";
		ATTRS["ACTION"] = "action";
		ATTRS["ENCODING"] = "encoding";
		ATTRS["PROMPT"] = "prompt";
		ATTRS["NAME"] = "name";
		ATTRS["COLOR"] = "color";
		ATTRS["FACE"] = "face";
		ATTRS["SIZE"] = "size";
	})(ATTRS || (ATTRS = {}));
	/**
	* The mode of the document.
	*
	* @see {@link https://dom.spec.whatwg.org/#concept-document-limited-quirks}
	*/
	var DOCUMENT_MODE;
	(function(DOCUMENT_MODE) {
		DOCUMENT_MODE["NO_QUIRKS"] = "no-quirks";
		DOCUMENT_MODE["QUIRKS"] = "quirks";
		DOCUMENT_MODE["LIMITED_QUIRKS"] = "limited-quirks";
	})(DOCUMENT_MODE || (DOCUMENT_MODE = {}));
	var TAG_NAMES;
	(function(TAG_NAMES) {
		TAG_NAMES["A"] = "a";
		TAG_NAMES["ADDRESS"] = "address";
		TAG_NAMES["ANNOTATION_XML"] = "annotation-xml";
		TAG_NAMES["APPLET"] = "applet";
		TAG_NAMES["AREA"] = "area";
		TAG_NAMES["ARTICLE"] = "article";
		TAG_NAMES["ASIDE"] = "aside";
		TAG_NAMES["B"] = "b";
		TAG_NAMES["BASE"] = "base";
		TAG_NAMES["BASEFONT"] = "basefont";
		TAG_NAMES["BGSOUND"] = "bgsound";
		TAG_NAMES["BIG"] = "big";
		TAG_NAMES["BLOCKQUOTE"] = "blockquote";
		TAG_NAMES["BODY"] = "body";
		TAG_NAMES["BR"] = "br";
		TAG_NAMES["BUTTON"] = "button";
		TAG_NAMES["CAPTION"] = "caption";
		TAG_NAMES["CENTER"] = "center";
		TAG_NAMES["CODE"] = "code";
		TAG_NAMES["COL"] = "col";
		TAG_NAMES["COLGROUP"] = "colgroup";
		TAG_NAMES["DD"] = "dd";
		TAG_NAMES["DESC"] = "desc";
		TAG_NAMES["DETAILS"] = "details";
		TAG_NAMES["DIALOG"] = "dialog";
		TAG_NAMES["DIR"] = "dir";
		TAG_NAMES["DIV"] = "div";
		TAG_NAMES["DL"] = "dl";
		TAG_NAMES["DT"] = "dt";
		TAG_NAMES["EM"] = "em";
		TAG_NAMES["EMBED"] = "embed";
		TAG_NAMES["FIELDSET"] = "fieldset";
		TAG_NAMES["FIGCAPTION"] = "figcaption";
		TAG_NAMES["FIGURE"] = "figure";
		TAG_NAMES["FONT"] = "font";
		TAG_NAMES["FOOTER"] = "footer";
		TAG_NAMES["FOREIGN_OBJECT"] = "foreignObject";
		TAG_NAMES["FORM"] = "form";
		TAG_NAMES["FRAME"] = "frame";
		TAG_NAMES["FRAMESET"] = "frameset";
		TAG_NAMES["H1"] = "h1";
		TAG_NAMES["H2"] = "h2";
		TAG_NAMES["H3"] = "h3";
		TAG_NAMES["H4"] = "h4";
		TAG_NAMES["H5"] = "h5";
		TAG_NAMES["H6"] = "h6";
		TAG_NAMES["HEAD"] = "head";
		TAG_NAMES["HEADER"] = "header";
		TAG_NAMES["HGROUP"] = "hgroup";
		TAG_NAMES["HR"] = "hr";
		TAG_NAMES["HTML"] = "html";
		TAG_NAMES["I"] = "i";
		TAG_NAMES["IMG"] = "img";
		TAG_NAMES["IMAGE"] = "image";
		TAG_NAMES["INPUT"] = "input";
		TAG_NAMES["IFRAME"] = "iframe";
		TAG_NAMES["KEYGEN"] = "keygen";
		TAG_NAMES["LABEL"] = "label";
		TAG_NAMES["LI"] = "li";
		TAG_NAMES["LINK"] = "link";
		TAG_NAMES["LISTING"] = "listing";
		TAG_NAMES["MAIN"] = "main";
		TAG_NAMES["MALIGNMARK"] = "malignmark";
		TAG_NAMES["MARQUEE"] = "marquee";
		TAG_NAMES["MATH"] = "math";
		TAG_NAMES["MENU"] = "menu";
		TAG_NAMES["META"] = "meta";
		TAG_NAMES["MGLYPH"] = "mglyph";
		TAG_NAMES["MI"] = "mi";
		TAG_NAMES["MO"] = "mo";
		TAG_NAMES["MN"] = "mn";
		TAG_NAMES["MS"] = "ms";
		TAG_NAMES["MTEXT"] = "mtext";
		TAG_NAMES["NAV"] = "nav";
		TAG_NAMES["NOBR"] = "nobr";
		TAG_NAMES["NOFRAMES"] = "noframes";
		TAG_NAMES["NOEMBED"] = "noembed";
		TAG_NAMES["NOSCRIPT"] = "noscript";
		TAG_NAMES["OBJECT"] = "object";
		TAG_NAMES["OL"] = "ol";
		TAG_NAMES["OPTGROUP"] = "optgroup";
		TAG_NAMES["OPTION"] = "option";
		TAG_NAMES["P"] = "p";
		TAG_NAMES["PARAM"] = "param";
		TAG_NAMES["PLAINTEXT"] = "plaintext";
		TAG_NAMES["PRE"] = "pre";
		TAG_NAMES["RB"] = "rb";
		TAG_NAMES["RP"] = "rp";
		TAG_NAMES["RT"] = "rt";
		TAG_NAMES["RTC"] = "rtc";
		TAG_NAMES["RUBY"] = "ruby";
		TAG_NAMES["S"] = "s";
		TAG_NAMES["SCRIPT"] = "script";
		TAG_NAMES["SEARCH"] = "search";
		TAG_NAMES["SECTION"] = "section";
		TAG_NAMES["SELECT"] = "select";
		TAG_NAMES["SOURCE"] = "source";
		TAG_NAMES["SMALL"] = "small";
		TAG_NAMES["SPAN"] = "span";
		TAG_NAMES["STRIKE"] = "strike";
		TAG_NAMES["STRONG"] = "strong";
		TAG_NAMES["STYLE"] = "style";
		TAG_NAMES["SUB"] = "sub";
		TAG_NAMES["SUMMARY"] = "summary";
		TAG_NAMES["SUP"] = "sup";
		TAG_NAMES["TABLE"] = "table";
		TAG_NAMES["TBODY"] = "tbody";
		TAG_NAMES["TEMPLATE"] = "template";
		TAG_NAMES["TEXTAREA"] = "textarea";
		TAG_NAMES["TFOOT"] = "tfoot";
		TAG_NAMES["TD"] = "td";
		TAG_NAMES["TH"] = "th";
		TAG_NAMES["THEAD"] = "thead";
		TAG_NAMES["TITLE"] = "title";
		TAG_NAMES["TR"] = "tr";
		TAG_NAMES["TRACK"] = "track";
		TAG_NAMES["TT"] = "tt";
		TAG_NAMES["U"] = "u";
		TAG_NAMES["UL"] = "ul";
		TAG_NAMES["SVG"] = "svg";
		TAG_NAMES["VAR"] = "var";
		TAG_NAMES["WBR"] = "wbr";
		TAG_NAMES["XMP"] = "xmp";
	})(TAG_NAMES || (TAG_NAMES = {}));
	/**
	* Tag IDs are numeric IDs for known tag names.
	*
	* We use tag IDs to improve the performance of tag name comparisons.
	*/
	var TAG_ID;
	(function(TAG_ID) {
		TAG_ID[TAG_ID["UNKNOWN"] = 0] = "UNKNOWN";
		TAG_ID[TAG_ID["A"] = 1] = "A";
		TAG_ID[TAG_ID["ADDRESS"] = 2] = "ADDRESS";
		TAG_ID[TAG_ID["ANNOTATION_XML"] = 3] = "ANNOTATION_XML";
		TAG_ID[TAG_ID["APPLET"] = 4] = "APPLET";
		TAG_ID[TAG_ID["AREA"] = 5] = "AREA";
		TAG_ID[TAG_ID["ARTICLE"] = 6] = "ARTICLE";
		TAG_ID[TAG_ID["ASIDE"] = 7] = "ASIDE";
		TAG_ID[TAG_ID["B"] = 8] = "B";
		TAG_ID[TAG_ID["BASE"] = 9] = "BASE";
		TAG_ID[TAG_ID["BASEFONT"] = 10] = "BASEFONT";
		TAG_ID[TAG_ID["BGSOUND"] = 11] = "BGSOUND";
		TAG_ID[TAG_ID["BIG"] = 12] = "BIG";
		TAG_ID[TAG_ID["BLOCKQUOTE"] = 13] = "BLOCKQUOTE";
		TAG_ID[TAG_ID["BODY"] = 14] = "BODY";
		TAG_ID[TAG_ID["BR"] = 15] = "BR";
		TAG_ID[TAG_ID["BUTTON"] = 16] = "BUTTON";
		TAG_ID[TAG_ID["CAPTION"] = 17] = "CAPTION";
		TAG_ID[TAG_ID["CENTER"] = 18] = "CENTER";
		TAG_ID[TAG_ID["CODE"] = 19] = "CODE";
		TAG_ID[TAG_ID["COL"] = 20] = "COL";
		TAG_ID[TAG_ID["COLGROUP"] = 21] = "COLGROUP";
		TAG_ID[TAG_ID["DD"] = 22] = "DD";
		TAG_ID[TAG_ID["DESC"] = 23] = "DESC";
		TAG_ID[TAG_ID["DETAILS"] = 24] = "DETAILS";
		TAG_ID[TAG_ID["DIALOG"] = 25] = "DIALOG";
		TAG_ID[TAG_ID["DIR"] = 26] = "DIR";
		TAG_ID[TAG_ID["DIV"] = 27] = "DIV";
		TAG_ID[TAG_ID["DL"] = 28] = "DL";
		TAG_ID[TAG_ID["DT"] = 29] = "DT";
		TAG_ID[TAG_ID["EM"] = 30] = "EM";
		TAG_ID[TAG_ID["EMBED"] = 31] = "EMBED";
		TAG_ID[TAG_ID["FIELDSET"] = 32] = "FIELDSET";
		TAG_ID[TAG_ID["FIGCAPTION"] = 33] = "FIGCAPTION";
		TAG_ID[TAG_ID["FIGURE"] = 34] = "FIGURE";
		TAG_ID[TAG_ID["FONT"] = 35] = "FONT";
		TAG_ID[TAG_ID["FOOTER"] = 36] = "FOOTER";
		TAG_ID[TAG_ID["FOREIGN_OBJECT"] = 37] = "FOREIGN_OBJECT";
		TAG_ID[TAG_ID["FORM"] = 38] = "FORM";
		TAG_ID[TAG_ID["FRAME"] = 39] = "FRAME";
		TAG_ID[TAG_ID["FRAMESET"] = 40] = "FRAMESET";
		TAG_ID[TAG_ID["H1"] = 41] = "H1";
		TAG_ID[TAG_ID["H2"] = 42] = "H2";
		TAG_ID[TAG_ID["H3"] = 43] = "H3";
		TAG_ID[TAG_ID["H4"] = 44] = "H4";
		TAG_ID[TAG_ID["H5"] = 45] = "H5";
		TAG_ID[TAG_ID["H6"] = 46] = "H6";
		TAG_ID[TAG_ID["HEAD"] = 47] = "HEAD";
		TAG_ID[TAG_ID["HEADER"] = 48] = "HEADER";
		TAG_ID[TAG_ID["HGROUP"] = 49] = "HGROUP";
		TAG_ID[TAG_ID["HR"] = 50] = "HR";
		TAG_ID[TAG_ID["HTML"] = 51] = "HTML";
		TAG_ID[TAG_ID["I"] = 52] = "I";
		TAG_ID[TAG_ID["IMG"] = 53] = "IMG";
		TAG_ID[TAG_ID["IMAGE"] = 54] = "IMAGE";
		TAG_ID[TAG_ID["INPUT"] = 55] = "INPUT";
		TAG_ID[TAG_ID["IFRAME"] = 56] = "IFRAME";
		TAG_ID[TAG_ID["KEYGEN"] = 57] = "KEYGEN";
		TAG_ID[TAG_ID["LABEL"] = 58] = "LABEL";
		TAG_ID[TAG_ID["LI"] = 59] = "LI";
		TAG_ID[TAG_ID["LINK"] = 60] = "LINK";
		TAG_ID[TAG_ID["LISTING"] = 61] = "LISTING";
		TAG_ID[TAG_ID["MAIN"] = 62] = "MAIN";
		TAG_ID[TAG_ID["MALIGNMARK"] = 63] = "MALIGNMARK";
		TAG_ID[TAG_ID["MARQUEE"] = 64] = "MARQUEE";
		TAG_ID[TAG_ID["MATH"] = 65] = "MATH";
		TAG_ID[TAG_ID["MENU"] = 66] = "MENU";
		TAG_ID[TAG_ID["META"] = 67] = "META";
		TAG_ID[TAG_ID["MGLYPH"] = 68] = "MGLYPH";
		TAG_ID[TAG_ID["MI"] = 69] = "MI";
		TAG_ID[TAG_ID["MO"] = 70] = "MO";
		TAG_ID[TAG_ID["MN"] = 71] = "MN";
		TAG_ID[TAG_ID["MS"] = 72] = "MS";
		TAG_ID[TAG_ID["MTEXT"] = 73] = "MTEXT";
		TAG_ID[TAG_ID["NAV"] = 74] = "NAV";
		TAG_ID[TAG_ID["NOBR"] = 75] = "NOBR";
		TAG_ID[TAG_ID["NOFRAMES"] = 76] = "NOFRAMES";
		TAG_ID[TAG_ID["NOEMBED"] = 77] = "NOEMBED";
		TAG_ID[TAG_ID["NOSCRIPT"] = 78] = "NOSCRIPT";
		TAG_ID[TAG_ID["OBJECT"] = 79] = "OBJECT";
		TAG_ID[TAG_ID["OL"] = 80] = "OL";
		TAG_ID[TAG_ID["OPTGROUP"] = 81] = "OPTGROUP";
		TAG_ID[TAG_ID["OPTION"] = 82] = "OPTION";
		TAG_ID[TAG_ID["P"] = 83] = "P";
		TAG_ID[TAG_ID["PARAM"] = 84] = "PARAM";
		TAG_ID[TAG_ID["PLAINTEXT"] = 85] = "PLAINTEXT";
		TAG_ID[TAG_ID["PRE"] = 86] = "PRE";
		TAG_ID[TAG_ID["RB"] = 87] = "RB";
		TAG_ID[TAG_ID["RP"] = 88] = "RP";
		TAG_ID[TAG_ID["RT"] = 89] = "RT";
		TAG_ID[TAG_ID["RTC"] = 90] = "RTC";
		TAG_ID[TAG_ID["RUBY"] = 91] = "RUBY";
		TAG_ID[TAG_ID["S"] = 92] = "S";
		TAG_ID[TAG_ID["SCRIPT"] = 93] = "SCRIPT";
		TAG_ID[TAG_ID["SEARCH"] = 94] = "SEARCH";
		TAG_ID[TAG_ID["SECTION"] = 95] = "SECTION";
		TAG_ID[TAG_ID["SELECT"] = 96] = "SELECT";
		TAG_ID[TAG_ID["SOURCE"] = 97] = "SOURCE";
		TAG_ID[TAG_ID["SMALL"] = 98] = "SMALL";
		TAG_ID[TAG_ID["SPAN"] = 99] = "SPAN";
		TAG_ID[TAG_ID["STRIKE"] = 100] = "STRIKE";
		TAG_ID[TAG_ID["STRONG"] = 101] = "STRONG";
		TAG_ID[TAG_ID["STYLE"] = 102] = "STYLE";
		TAG_ID[TAG_ID["SUB"] = 103] = "SUB";
		TAG_ID[TAG_ID["SUMMARY"] = 104] = "SUMMARY";
		TAG_ID[TAG_ID["SUP"] = 105] = "SUP";
		TAG_ID[TAG_ID["TABLE"] = 106] = "TABLE";
		TAG_ID[TAG_ID["TBODY"] = 107] = "TBODY";
		TAG_ID[TAG_ID["TEMPLATE"] = 108] = "TEMPLATE";
		TAG_ID[TAG_ID["TEXTAREA"] = 109] = "TEXTAREA";
		TAG_ID[TAG_ID["TFOOT"] = 110] = "TFOOT";
		TAG_ID[TAG_ID["TD"] = 111] = "TD";
		TAG_ID[TAG_ID["TH"] = 112] = "TH";
		TAG_ID[TAG_ID["THEAD"] = 113] = "THEAD";
		TAG_ID[TAG_ID["TITLE"] = 114] = "TITLE";
		TAG_ID[TAG_ID["TR"] = 115] = "TR";
		TAG_ID[TAG_ID["TRACK"] = 116] = "TRACK";
		TAG_ID[TAG_ID["TT"] = 117] = "TT";
		TAG_ID[TAG_ID["U"] = 118] = "U";
		TAG_ID[TAG_ID["UL"] = 119] = "UL";
		TAG_ID[TAG_ID["SVG"] = 120] = "SVG";
		TAG_ID[TAG_ID["VAR"] = 121] = "VAR";
		TAG_ID[TAG_ID["WBR"] = 122] = "WBR";
		TAG_ID[TAG_ID["XMP"] = 123] = "XMP";
	})(TAG_ID || (TAG_ID = {}));
	const TAG_NAME_TO_ID = new Map([
		[TAG_NAMES.A, TAG_ID.A],
		[TAG_NAMES.ADDRESS, TAG_ID.ADDRESS],
		[TAG_NAMES.ANNOTATION_XML, TAG_ID.ANNOTATION_XML],
		[TAG_NAMES.APPLET, TAG_ID.APPLET],
		[TAG_NAMES.AREA, TAG_ID.AREA],
		[TAG_NAMES.ARTICLE, TAG_ID.ARTICLE],
		[TAG_NAMES.ASIDE, TAG_ID.ASIDE],
		[TAG_NAMES.B, TAG_ID.B],
		[TAG_NAMES.BASE, TAG_ID.BASE],
		[TAG_NAMES.BASEFONT, TAG_ID.BASEFONT],
		[TAG_NAMES.BGSOUND, TAG_ID.BGSOUND],
		[TAG_NAMES.BIG, TAG_ID.BIG],
		[TAG_NAMES.BLOCKQUOTE, TAG_ID.BLOCKQUOTE],
		[TAG_NAMES.BODY, TAG_ID.BODY],
		[TAG_NAMES.BR, TAG_ID.BR],
		[TAG_NAMES.BUTTON, TAG_ID.BUTTON],
		[TAG_NAMES.CAPTION, TAG_ID.CAPTION],
		[TAG_NAMES.CENTER, TAG_ID.CENTER],
		[TAG_NAMES.CODE, TAG_ID.CODE],
		[TAG_NAMES.COL, TAG_ID.COL],
		[TAG_NAMES.COLGROUP, TAG_ID.COLGROUP],
		[TAG_NAMES.DD, TAG_ID.DD],
		[TAG_NAMES.DESC, TAG_ID.DESC],
		[TAG_NAMES.DETAILS, TAG_ID.DETAILS],
		[TAG_NAMES.DIALOG, TAG_ID.DIALOG],
		[TAG_NAMES.DIR, TAG_ID.DIR],
		[TAG_NAMES.DIV, TAG_ID.DIV],
		[TAG_NAMES.DL, TAG_ID.DL],
		[TAG_NAMES.DT, TAG_ID.DT],
		[TAG_NAMES.EM, TAG_ID.EM],
		[TAG_NAMES.EMBED, TAG_ID.EMBED],
		[TAG_NAMES.FIELDSET, TAG_ID.FIELDSET],
		[TAG_NAMES.FIGCAPTION, TAG_ID.FIGCAPTION],
		[TAG_NAMES.FIGURE, TAG_ID.FIGURE],
		[TAG_NAMES.FONT, TAG_ID.FONT],
		[TAG_NAMES.FOOTER, TAG_ID.FOOTER],
		[TAG_NAMES.FOREIGN_OBJECT, TAG_ID.FOREIGN_OBJECT],
		[TAG_NAMES.FORM, TAG_ID.FORM],
		[TAG_NAMES.FRAME, TAG_ID.FRAME],
		[TAG_NAMES.FRAMESET, TAG_ID.FRAMESET],
		[TAG_NAMES.H1, TAG_ID.H1],
		[TAG_NAMES.H2, TAG_ID.H2],
		[TAG_NAMES.H3, TAG_ID.H3],
		[TAG_NAMES.H4, TAG_ID.H4],
		[TAG_NAMES.H5, TAG_ID.H5],
		[TAG_NAMES.H6, TAG_ID.H6],
		[TAG_NAMES.HEAD, TAG_ID.HEAD],
		[TAG_NAMES.HEADER, TAG_ID.HEADER],
		[TAG_NAMES.HGROUP, TAG_ID.HGROUP],
		[TAG_NAMES.HR, TAG_ID.HR],
		[TAG_NAMES.HTML, TAG_ID.HTML],
		[TAG_NAMES.I, TAG_ID.I],
		[TAG_NAMES.IMG, TAG_ID.IMG],
		[TAG_NAMES.IMAGE, TAG_ID.IMAGE],
		[TAG_NAMES.INPUT, TAG_ID.INPUT],
		[TAG_NAMES.IFRAME, TAG_ID.IFRAME],
		[TAG_NAMES.KEYGEN, TAG_ID.KEYGEN],
		[TAG_NAMES.LABEL, TAG_ID.LABEL],
		[TAG_NAMES.LI, TAG_ID.LI],
		[TAG_NAMES.LINK, TAG_ID.LINK],
		[TAG_NAMES.LISTING, TAG_ID.LISTING],
		[TAG_NAMES.MAIN, TAG_ID.MAIN],
		[TAG_NAMES.MALIGNMARK, TAG_ID.MALIGNMARK],
		[TAG_NAMES.MARQUEE, TAG_ID.MARQUEE],
		[TAG_NAMES.MATH, TAG_ID.MATH],
		[TAG_NAMES.MENU, TAG_ID.MENU],
		[TAG_NAMES.META, TAG_ID.META],
		[TAG_NAMES.MGLYPH, TAG_ID.MGLYPH],
		[TAG_NAMES.MI, TAG_ID.MI],
		[TAG_NAMES.MO, TAG_ID.MO],
		[TAG_NAMES.MN, TAG_ID.MN],
		[TAG_NAMES.MS, TAG_ID.MS],
		[TAG_NAMES.MTEXT, TAG_ID.MTEXT],
		[TAG_NAMES.NAV, TAG_ID.NAV],
		[TAG_NAMES.NOBR, TAG_ID.NOBR],
		[TAG_NAMES.NOFRAMES, TAG_ID.NOFRAMES],
		[TAG_NAMES.NOEMBED, TAG_ID.NOEMBED],
		[TAG_NAMES.NOSCRIPT, TAG_ID.NOSCRIPT],
		[TAG_NAMES.OBJECT, TAG_ID.OBJECT],
		[TAG_NAMES.OL, TAG_ID.OL],
		[TAG_NAMES.OPTGROUP, TAG_ID.OPTGROUP],
		[TAG_NAMES.OPTION, TAG_ID.OPTION],
		[TAG_NAMES.P, TAG_ID.P],
		[TAG_NAMES.PARAM, TAG_ID.PARAM],
		[TAG_NAMES.PLAINTEXT, TAG_ID.PLAINTEXT],
		[TAG_NAMES.PRE, TAG_ID.PRE],
		[TAG_NAMES.RB, TAG_ID.RB],
		[TAG_NAMES.RP, TAG_ID.RP],
		[TAG_NAMES.RT, TAG_ID.RT],
		[TAG_NAMES.RTC, TAG_ID.RTC],
		[TAG_NAMES.RUBY, TAG_ID.RUBY],
		[TAG_NAMES.S, TAG_ID.S],
		[TAG_NAMES.SCRIPT, TAG_ID.SCRIPT],
		[TAG_NAMES.SEARCH, TAG_ID.SEARCH],
		[TAG_NAMES.SECTION, TAG_ID.SECTION],
		[TAG_NAMES.SELECT, TAG_ID.SELECT],
		[TAG_NAMES.SOURCE, TAG_ID.SOURCE],
		[TAG_NAMES.SMALL, TAG_ID.SMALL],
		[TAG_NAMES.SPAN, TAG_ID.SPAN],
		[TAG_NAMES.STRIKE, TAG_ID.STRIKE],
		[TAG_NAMES.STRONG, TAG_ID.STRONG],
		[TAG_NAMES.STYLE, TAG_ID.STYLE],
		[TAG_NAMES.SUB, TAG_ID.SUB],
		[TAG_NAMES.SUMMARY, TAG_ID.SUMMARY],
		[TAG_NAMES.SUP, TAG_ID.SUP],
		[TAG_NAMES.TABLE, TAG_ID.TABLE],
		[TAG_NAMES.TBODY, TAG_ID.TBODY],
		[TAG_NAMES.TEMPLATE, TAG_ID.TEMPLATE],
		[TAG_NAMES.TEXTAREA, TAG_ID.TEXTAREA],
		[TAG_NAMES.TFOOT, TAG_ID.TFOOT],
		[TAG_NAMES.TD, TAG_ID.TD],
		[TAG_NAMES.TH, TAG_ID.TH],
		[TAG_NAMES.THEAD, TAG_ID.THEAD],
		[TAG_NAMES.TITLE, TAG_ID.TITLE],
		[TAG_NAMES.TR, TAG_ID.TR],
		[TAG_NAMES.TRACK, TAG_ID.TRACK],
		[TAG_NAMES.TT, TAG_ID.TT],
		[TAG_NAMES.U, TAG_ID.U],
		[TAG_NAMES.UL, TAG_ID.UL],
		[TAG_NAMES.SVG, TAG_ID.SVG],
		[TAG_NAMES.VAR, TAG_ID.VAR],
		[TAG_NAMES.WBR, TAG_ID.WBR],
		[TAG_NAMES.XMP, TAG_ID.XMP]
	]);
	function getTagID(tagName) {
		var _a;
		return (_a = TAG_NAME_TO_ID.get(tagName)) !== null && _a !== void 0 ? _a : TAG_ID.UNKNOWN;
	}
	const $ = TAG_ID;
	const SPECIAL_ELEMENTS = {
		[NS.HTML]: new Set([
			$.ADDRESS,
			$.APPLET,
			$.AREA,
			$.ARTICLE,
			$.ASIDE,
			$.BASE,
			$.BASEFONT,
			$.BGSOUND,
			$.BLOCKQUOTE,
			$.BODY,
			$.BR,
			$.BUTTON,
			$.CAPTION,
			$.CENTER,
			$.COL,
			$.COLGROUP,
			$.DD,
			$.DETAILS,
			$.DIR,
			$.DIV,
			$.DL,
			$.DT,
			$.EMBED,
			$.FIELDSET,
			$.FIGCAPTION,
			$.FIGURE,
			$.FOOTER,
			$.FORM,
			$.FRAME,
			$.FRAMESET,
			$.H1,
			$.H2,
			$.H3,
			$.H4,
			$.H5,
			$.H6,
			$.HEAD,
			$.HEADER,
			$.HGROUP,
			$.HR,
			$.HTML,
			$.IFRAME,
			$.IMG,
			$.INPUT,
			$.LI,
			$.LINK,
			$.LISTING,
			$.MAIN,
			$.MARQUEE,
			$.MENU,
			$.META,
			$.NAV,
			$.NOEMBED,
			$.NOFRAMES,
			$.NOSCRIPT,
			$.OBJECT,
			$.OL,
			$.P,
			$.PARAM,
			$.PLAINTEXT,
			$.PRE,
			$.SCRIPT,
			$.SECTION,
			$.SELECT,
			$.SOURCE,
			$.STYLE,
			$.SUMMARY,
			$.TABLE,
			$.TBODY,
			$.TD,
			$.TEMPLATE,
			$.TEXTAREA,
			$.TFOOT,
			$.TH,
			$.THEAD,
			$.TITLE,
			$.TR,
			$.TRACK,
			$.UL,
			$.WBR,
			$.XMP
		]),
		[NS.MATHML]: new Set([
			$.MI,
			$.MO,
			$.MN,
			$.MS,
			$.MTEXT,
			$.ANNOTATION_XML
		]),
		[NS.SVG]: new Set([
			$.TITLE,
			$.FOREIGN_OBJECT,
			$.DESC
		]),
		[NS.XLINK]: /* @__PURE__ */ new Set(),
		[NS.XML]: /* @__PURE__ */ new Set(),
		[NS.XMLNS]: /* @__PURE__ */ new Set()
	};
	const NUMBERED_HEADERS = new Set([
		$.H1,
		$.H2,
		$.H3,
		$.H4,
		$.H5,
		$.H6
	]);
	const UNESCAPED_TEXT = new Set([
		TAG_NAMES.STYLE,
		TAG_NAMES.SCRIPT,
		TAG_NAMES.XMP,
		TAG_NAMES.IFRAME,
		TAG_NAMES.NOEMBED,
		TAG_NAMES.NOFRAMES,
		TAG_NAMES.PLAINTEXT
	]);
	function hasUnescapedText(tn, scriptingEnabled) {
		return UNESCAPED_TEXT.has(tn) || scriptingEnabled && tn === TAG_NAMES.NOSCRIPT;
	}

//#endregion
//#region node_modules/parse5/dist/tokenizer/index.js
	var State;
	(function(State) {
		State[State["DATA"] = 0] = "DATA";
		State[State["RCDATA"] = 1] = "RCDATA";
		State[State["RAWTEXT"] = 2] = "RAWTEXT";
		State[State["SCRIPT_DATA"] = 3] = "SCRIPT_DATA";
		State[State["PLAINTEXT"] = 4] = "PLAINTEXT";
		State[State["TAG_OPEN"] = 5] = "TAG_OPEN";
		State[State["END_TAG_OPEN"] = 6] = "END_TAG_OPEN";
		State[State["TAG_NAME"] = 7] = "TAG_NAME";
		State[State["RCDATA_LESS_THAN_SIGN"] = 8] = "RCDATA_LESS_THAN_SIGN";
		State[State["RCDATA_END_TAG_OPEN"] = 9] = "RCDATA_END_TAG_OPEN";
		State[State["RCDATA_END_TAG_NAME"] = 10] = "RCDATA_END_TAG_NAME";
		State[State["RAWTEXT_LESS_THAN_SIGN"] = 11] = "RAWTEXT_LESS_THAN_SIGN";
		State[State["RAWTEXT_END_TAG_OPEN"] = 12] = "RAWTEXT_END_TAG_OPEN";
		State[State["RAWTEXT_END_TAG_NAME"] = 13] = "RAWTEXT_END_TAG_NAME";
		State[State["SCRIPT_DATA_LESS_THAN_SIGN"] = 14] = "SCRIPT_DATA_LESS_THAN_SIGN";
		State[State["SCRIPT_DATA_END_TAG_OPEN"] = 15] = "SCRIPT_DATA_END_TAG_OPEN";
		State[State["SCRIPT_DATA_END_TAG_NAME"] = 16] = "SCRIPT_DATA_END_TAG_NAME";
		State[State["SCRIPT_DATA_ESCAPE_START"] = 17] = "SCRIPT_DATA_ESCAPE_START";
		State[State["SCRIPT_DATA_ESCAPE_START_DASH"] = 18] = "SCRIPT_DATA_ESCAPE_START_DASH";
		State[State["SCRIPT_DATA_ESCAPED"] = 19] = "SCRIPT_DATA_ESCAPED";
		State[State["SCRIPT_DATA_ESCAPED_DASH"] = 20] = "SCRIPT_DATA_ESCAPED_DASH";
		State[State["SCRIPT_DATA_ESCAPED_DASH_DASH"] = 21] = "SCRIPT_DATA_ESCAPED_DASH_DASH";
		State[State["SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN"] = 22] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN";
		State[State["SCRIPT_DATA_ESCAPED_END_TAG_OPEN"] = 23] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN";
		State[State["SCRIPT_DATA_ESCAPED_END_TAG_NAME"] = 24] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPE_START"] = 25] = "SCRIPT_DATA_DOUBLE_ESCAPE_START";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED"] = 26] = "SCRIPT_DATA_DOUBLE_ESCAPED";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH"] = 27] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH"] = 28] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN"] = 29] = "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPE_END"] = 30] = "SCRIPT_DATA_DOUBLE_ESCAPE_END";
		State[State["BEFORE_ATTRIBUTE_NAME"] = 31] = "BEFORE_ATTRIBUTE_NAME";
		State[State["ATTRIBUTE_NAME"] = 32] = "ATTRIBUTE_NAME";
		State[State["AFTER_ATTRIBUTE_NAME"] = 33] = "AFTER_ATTRIBUTE_NAME";
		State[State["BEFORE_ATTRIBUTE_VALUE"] = 34] = "BEFORE_ATTRIBUTE_VALUE";
		State[State["ATTRIBUTE_VALUE_DOUBLE_QUOTED"] = 35] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED";
		State[State["ATTRIBUTE_VALUE_SINGLE_QUOTED"] = 36] = "ATTRIBUTE_VALUE_SINGLE_QUOTED";
		State[State["ATTRIBUTE_VALUE_UNQUOTED"] = 37] = "ATTRIBUTE_VALUE_UNQUOTED";
		State[State["AFTER_ATTRIBUTE_VALUE_QUOTED"] = 38] = "AFTER_ATTRIBUTE_VALUE_QUOTED";
		State[State["SELF_CLOSING_START_TAG"] = 39] = "SELF_CLOSING_START_TAG";
		State[State["BOGUS_COMMENT"] = 40] = "BOGUS_COMMENT";
		State[State["MARKUP_DECLARATION_OPEN"] = 41] = "MARKUP_DECLARATION_OPEN";
		State[State["COMMENT_START"] = 42] = "COMMENT_START";
		State[State["COMMENT_START_DASH"] = 43] = "COMMENT_START_DASH";
		State[State["COMMENT"] = 44] = "COMMENT";
		State[State["COMMENT_LESS_THAN_SIGN"] = 45] = "COMMENT_LESS_THAN_SIGN";
		State[State["COMMENT_LESS_THAN_SIGN_BANG"] = 46] = "COMMENT_LESS_THAN_SIGN_BANG";
		State[State["COMMENT_LESS_THAN_SIGN_BANG_DASH"] = 47] = "COMMENT_LESS_THAN_SIGN_BANG_DASH";
		State[State["COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH"] = 48] = "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH";
		State[State["COMMENT_END_DASH"] = 49] = "COMMENT_END_DASH";
		State[State["COMMENT_END"] = 50] = "COMMENT_END";
		State[State["COMMENT_END_BANG"] = 51] = "COMMENT_END_BANG";
		State[State["DOCTYPE"] = 52] = "DOCTYPE";
		State[State["BEFORE_DOCTYPE_NAME"] = 53] = "BEFORE_DOCTYPE_NAME";
		State[State["DOCTYPE_NAME"] = 54] = "DOCTYPE_NAME";
		State[State["AFTER_DOCTYPE_NAME"] = 55] = "AFTER_DOCTYPE_NAME";
		State[State["AFTER_DOCTYPE_PUBLIC_KEYWORD"] = 56] = "AFTER_DOCTYPE_PUBLIC_KEYWORD";
		State[State["BEFORE_DOCTYPE_PUBLIC_IDENTIFIER"] = 57] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER";
		State[State["DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED"] = 58] = "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED";
		State[State["DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED"] = 59] = "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED";
		State[State["AFTER_DOCTYPE_PUBLIC_IDENTIFIER"] = 60] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER";
		State[State["BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS"] = 61] = "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS";
		State[State["AFTER_DOCTYPE_SYSTEM_KEYWORD"] = 62] = "AFTER_DOCTYPE_SYSTEM_KEYWORD";
		State[State["BEFORE_DOCTYPE_SYSTEM_IDENTIFIER"] = 63] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER";
		State[State["DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED"] = 64] = "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED";
		State[State["DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED"] = 65] = "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED";
		State[State["AFTER_DOCTYPE_SYSTEM_IDENTIFIER"] = 66] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER";
		State[State["BOGUS_DOCTYPE"] = 67] = "BOGUS_DOCTYPE";
		State[State["CDATA_SECTION"] = 68] = "CDATA_SECTION";
		State[State["CDATA_SECTION_BRACKET"] = 69] = "CDATA_SECTION_BRACKET";
		State[State["CDATA_SECTION_END"] = 70] = "CDATA_SECTION_END";
		State[State["CHARACTER_REFERENCE"] = 71] = "CHARACTER_REFERENCE";
		State[State["AMBIGUOUS_AMPERSAND"] = 72] = "AMBIGUOUS_AMPERSAND";
	})(State || (State = {}));
	const TokenizerMode = {
		DATA: State.DATA,
		RCDATA: State.RCDATA,
		RAWTEXT: State.RAWTEXT,
		SCRIPT_DATA: State.SCRIPT_DATA,
		PLAINTEXT: State.PLAINTEXT,
		CDATA_SECTION: State.CDATA_SECTION
	};
	function isAsciiDigit(cp) {
		return cp >= CODE_POINTS.DIGIT_0 && cp <= CODE_POINTS.DIGIT_9;
	}
	function isAsciiUpper(cp) {
		return cp >= CODE_POINTS.LATIN_CAPITAL_A && cp <= CODE_POINTS.LATIN_CAPITAL_Z;
	}
	function isAsciiLower(cp) {
		return cp >= CODE_POINTS.LATIN_SMALL_A && cp <= CODE_POINTS.LATIN_SMALL_Z;
	}
	function isAsciiLetter(cp) {
		return isAsciiLower(cp) || isAsciiUpper(cp);
	}
	function isAsciiAlphaNumeric(cp) {
		return isAsciiLetter(cp) || isAsciiDigit(cp);
	}
	function toAsciiLower(cp) {
		return cp + 32;
	}
	function isWhitespace(cp) {
		return cp === CODE_POINTS.SPACE || cp === CODE_POINTS.LINE_FEED || cp === CODE_POINTS.TABULATION || cp === CODE_POINTS.FORM_FEED;
	}
	function isScriptDataDoubleEscapeSequenceEnd(cp) {
		return isWhitespace(cp) || cp === CODE_POINTS.SOLIDUS || cp === CODE_POINTS.GREATER_THAN_SIGN;
	}
	function getErrorForNumericCharacterReference(code) {
		if (code === CODE_POINTS.NULL) return ERR.nullCharacterReference;
		else if (code > 1114111) return ERR.characterReferenceOutsideUnicodeRange;
		else if (isSurrogate(code)) return ERR.surrogateCharacterReference;
		else if (isUndefinedCodePoint(code)) return ERR.noncharacterCharacterReference;
		else if (isControlCodePoint(code) || code === CODE_POINTS.CARRIAGE_RETURN) return ERR.controlCharacterReference;
		return null;
	}
	var Tokenizer = class {
		constructor(options, handler) {
			this.options = options;
			this.handler = handler;
			this.paused = false;
			/** Ensures that the parsing loop isn't run multiple times at once. */
			this.inLoop = false;
			/**
			* Indicates that the current adjusted node exists, is not an element in the HTML namespace,
			* and that it is not an integration point for either MathML or HTML.
			*
			* @see {@link https://html.spec.whatwg.org/multipage/parsing.html#tree-construction}
			*/
			this.inForeignNode = false;
			this.lastStartTagName = "";
			this.active = false;
			this.state = State.DATA;
			this.returnState = State.DATA;
			this.entityStartPos = 0;
			this.consumedAfterSnapshot = -1;
			this.currentCharacterToken = null;
			this.currentToken = null;
			this.currentAttr = {
				name: "",
				value: ""
			};
			this.preprocessor = new Preprocessor(handler);
			this.currentLocation = this.getCurrentLocation(-1);
			this.entityDecoder = new EntityDecoder(htmlDecodeTree, (cp, consumed) => {
				this.preprocessor.pos = this.entityStartPos + consumed - 1;
				this._flushCodePointConsumedAsCharacterReference(cp);
			}, handler.onParseError ? {
				missingSemicolonAfterCharacterReference: () => {
					this._err(ERR.missingSemicolonAfterCharacterReference, 1);
				},
				absenceOfDigitsInNumericCharacterReference: (consumed) => {
					this._err(ERR.absenceOfDigitsInNumericCharacterReference, this.entityStartPos - this.preprocessor.pos + consumed);
				},
				validateNumericCharacterReference: (code) => {
					const error = getErrorForNumericCharacterReference(code);
					if (error) this._err(error, 1);
				}
			} : void 0);
		}
		_err(code, cpOffset = 0) {
			var _a, _b;
			(_b = (_a = this.handler).onParseError) === null || _b === void 0 || _b.call(_a, this.preprocessor.getError(code, cpOffset));
		}
		getCurrentLocation(offset) {
			if (!this.options.sourceCodeLocationInfo) return null;
			return {
				startLine: this.preprocessor.line,
				startCol: this.preprocessor.col - offset,
				startOffset: this.preprocessor.offset - offset,
				endLine: -1,
				endCol: -1,
				endOffset: -1
			};
		}
		_runParsingLoop() {
			if (this.inLoop) return;
			this.inLoop = true;
			while (this.active && !this.paused) {
				this.consumedAfterSnapshot = 0;
				const cp = this._consume();
				if (!this._ensureHibernation()) this._callState(cp);
			}
			this.inLoop = false;
		}
		pause() {
			this.paused = true;
		}
		resume(writeCallback) {
			if (!this.paused) throw new Error("Parser was already resumed");
			this.paused = false;
			if (this.inLoop) return;
			this._runParsingLoop();
			if (!this.paused) writeCallback === null || writeCallback === void 0 || writeCallback();
		}
		write(chunk, isLastChunk, writeCallback) {
			this.active = true;
			this.preprocessor.write(chunk, isLastChunk);
			this._runParsingLoop();
			if (!this.paused) writeCallback === null || writeCallback === void 0 || writeCallback();
		}
		insertHtmlAtCurrentPos(chunk) {
			this.active = true;
			this.preprocessor.insertHtmlAtCurrentPos(chunk);
			this._runParsingLoop();
		}
		_ensureHibernation() {
			if (this.preprocessor.endOfChunkHit) {
				this.preprocessor.retreat(this.consumedAfterSnapshot);
				this.consumedAfterSnapshot = 0;
				this.active = false;
				return true;
			}
			return false;
		}
		_consume() {
			this.consumedAfterSnapshot++;
			return this.preprocessor.advance();
		}
		_advanceBy(count) {
			this.consumedAfterSnapshot += count;
			for (let i = 0; i < count; i++) this.preprocessor.advance();
		}
		_consumeSequenceIfMatch(pattern, caseSensitive) {
			if (this.preprocessor.startsWith(pattern, caseSensitive)) {
				this._advanceBy(pattern.length - 1);
				return true;
			}
			return false;
		}
		_createStartTagToken() {
			this.currentToken = {
				type: TokenType.START_TAG,
				tagName: "",
				tagID: TAG_ID.UNKNOWN,
				selfClosing: false,
				ackSelfClosing: false,
				attrs: [],
				location: this.getCurrentLocation(1)
			};
		}
		_createEndTagToken() {
			this.currentToken = {
				type: TokenType.END_TAG,
				tagName: "",
				tagID: TAG_ID.UNKNOWN,
				selfClosing: false,
				ackSelfClosing: false,
				attrs: [],
				location: this.getCurrentLocation(2)
			};
		}
		_createCommentToken(offset) {
			this.currentToken = {
				type: TokenType.COMMENT,
				data: "",
				location: this.getCurrentLocation(offset)
			};
		}
		_createDoctypeToken(initialName) {
			this.currentToken = {
				type: TokenType.DOCTYPE,
				name: initialName,
				forceQuirks: false,
				publicId: null,
				systemId: null,
				location: this.currentLocation
			};
		}
		_createCharacterToken(type, chars) {
			this.currentCharacterToken = {
				type,
				chars,
				location: this.currentLocation
			};
		}
		_createAttr(attrNameFirstCh) {
			this.currentAttr = {
				name: attrNameFirstCh,
				value: ""
			};
			this.currentLocation = this.getCurrentLocation(0);
		}
		_leaveAttrName() {
			var _a;
			var _b;
			const token = this.currentToken;
			if (getTokenAttr(token, this.currentAttr.name) === null) {
				token.attrs.push(this.currentAttr);
				if (token.location && this.currentLocation) {
					const attrLocations = (_a = (_b = token.location).attrs) !== null && _a !== void 0 ? _a : _b.attrs = Object.create(null);
					attrLocations[this.currentAttr.name] = this.currentLocation;
					this._leaveAttrValue();
				}
			} else this._err(ERR.duplicateAttribute);
		}
		_leaveAttrValue() {
			if (this.currentLocation) {
				this.currentLocation.endLine = this.preprocessor.line;
				this.currentLocation.endCol = this.preprocessor.col;
				this.currentLocation.endOffset = this.preprocessor.offset;
			}
		}
		prepareToken(ct) {
			this._emitCurrentCharacterToken(ct.location);
			this.currentToken = null;
			if (ct.location) {
				ct.location.endLine = this.preprocessor.line;
				ct.location.endCol = this.preprocessor.col + 1;
				ct.location.endOffset = this.preprocessor.offset + 1;
			}
			this.currentLocation = this.getCurrentLocation(-1);
		}
		emitCurrentTagToken() {
			const ct = this.currentToken;
			this.prepareToken(ct);
			ct.tagID = getTagID(ct.tagName);
			if (ct.type === TokenType.START_TAG) {
				this.lastStartTagName = ct.tagName;
				this.handler.onStartTag(ct);
			} else {
				if (ct.attrs.length > 0) this._err(ERR.endTagWithAttributes);
				if (ct.selfClosing) this._err(ERR.endTagWithTrailingSolidus);
				this.handler.onEndTag(ct);
			}
			this.preprocessor.dropParsedChunk();
		}
		emitCurrentComment(ct) {
			this.prepareToken(ct);
			this.handler.onComment(ct);
			this.preprocessor.dropParsedChunk();
		}
		emitCurrentDoctype(ct) {
			this.prepareToken(ct);
			this.handler.onDoctype(ct);
			this.preprocessor.dropParsedChunk();
		}
		_emitCurrentCharacterToken(nextLocation) {
			if (this.currentCharacterToken) {
				if (nextLocation && this.currentCharacterToken.location) {
					this.currentCharacterToken.location.endLine = nextLocation.startLine;
					this.currentCharacterToken.location.endCol = nextLocation.startCol;
					this.currentCharacterToken.location.endOffset = nextLocation.startOffset;
				}
				switch (this.currentCharacterToken.type) {
					case TokenType.CHARACTER:
						this.handler.onCharacter(this.currentCharacterToken);
						break;
					case TokenType.NULL_CHARACTER:
						this.handler.onNullCharacter(this.currentCharacterToken);
						break;
					case TokenType.WHITESPACE_CHARACTER:
						this.handler.onWhitespaceCharacter(this.currentCharacterToken);
						break;
				}
				this.currentCharacterToken = null;
			}
		}
		_emitEOFToken() {
			const location = this.getCurrentLocation(0);
			if (location) {
				location.endLine = location.startLine;
				location.endCol = location.startCol;
				location.endOffset = location.startOffset;
			}
			this._emitCurrentCharacterToken(location);
			this.handler.onEof({
				type: TokenType.EOF,
				location
			});
			this.active = false;
		}
		_appendCharToCurrentCharacterToken(type, ch) {
			if (this.currentCharacterToken) if (this.currentCharacterToken.type === type) {
				this.currentCharacterToken.chars += ch;
				return;
			} else {
				this.currentLocation = this.getCurrentLocation(0);
				this._emitCurrentCharacterToken(this.currentLocation);
				this.preprocessor.dropParsedChunk();
			}
			this._createCharacterToken(type, ch);
		}
		_emitCodePoint(cp) {
			const type = isWhitespace(cp) ? TokenType.WHITESPACE_CHARACTER : cp === CODE_POINTS.NULL ? TokenType.NULL_CHARACTER : TokenType.CHARACTER;
			this._appendCharToCurrentCharacterToken(type, String.fromCodePoint(cp));
		}
		_emitChars(ch) {
			this._appendCharToCurrentCharacterToken(TokenType.CHARACTER, ch);
		}
		_startCharacterReference() {
			this.returnState = this.state;
			this.state = State.CHARACTER_REFERENCE;
			this.entityStartPos = this.preprocessor.pos;
			this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute() ? DecodingMode.Attribute : DecodingMode.Legacy);
		}
		_isCharacterReferenceInAttribute() {
			return this.returnState === State.ATTRIBUTE_VALUE_DOUBLE_QUOTED || this.returnState === State.ATTRIBUTE_VALUE_SINGLE_QUOTED || this.returnState === State.ATTRIBUTE_VALUE_UNQUOTED;
		}
		_flushCodePointConsumedAsCharacterReference(cp) {
			if (this._isCharacterReferenceInAttribute()) this.currentAttr.value += String.fromCodePoint(cp);
			else this._emitCodePoint(cp);
		}
		_callState(cp) {
			switch (this.state) {
				case State.DATA:
					this._stateData(cp);
					break;
				case State.RCDATA:
					this._stateRcdata(cp);
					break;
				case State.RAWTEXT:
					this._stateRawtext(cp);
					break;
				case State.SCRIPT_DATA:
					this._stateScriptData(cp);
					break;
				case State.PLAINTEXT:
					this._statePlaintext(cp);
					break;
				case State.TAG_OPEN:
					this._stateTagOpen(cp);
					break;
				case State.END_TAG_OPEN:
					this._stateEndTagOpen(cp);
					break;
				case State.TAG_NAME:
					this._stateTagName(cp);
					break;
				case State.RCDATA_LESS_THAN_SIGN:
					this._stateRcdataLessThanSign(cp);
					break;
				case State.RCDATA_END_TAG_OPEN:
					this._stateRcdataEndTagOpen(cp);
					break;
				case State.RCDATA_END_TAG_NAME:
					this._stateRcdataEndTagName(cp);
					break;
				case State.RAWTEXT_LESS_THAN_SIGN:
					this._stateRawtextLessThanSign(cp);
					break;
				case State.RAWTEXT_END_TAG_OPEN:
					this._stateRawtextEndTagOpen(cp);
					break;
				case State.RAWTEXT_END_TAG_NAME:
					this._stateRawtextEndTagName(cp);
					break;
				case State.SCRIPT_DATA_LESS_THAN_SIGN:
					this._stateScriptDataLessThanSign(cp);
					break;
				case State.SCRIPT_DATA_END_TAG_OPEN:
					this._stateScriptDataEndTagOpen(cp);
					break;
				case State.SCRIPT_DATA_END_TAG_NAME:
					this._stateScriptDataEndTagName(cp);
					break;
				case State.SCRIPT_DATA_ESCAPE_START:
					this._stateScriptDataEscapeStart(cp);
					break;
				case State.SCRIPT_DATA_ESCAPE_START_DASH:
					this._stateScriptDataEscapeStartDash(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED:
					this._stateScriptDataEscaped(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_DASH:
					this._stateScriptDataEscapedDash(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_DASH_DASH:
					this._stateScriptDataEscapedDashDash(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
					this._stateScriptDataEscapedLessThanSign(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
					this._stateScriptDataEscapedEndTagOpen(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
					this._stateScriptDataEscapedEndTagName(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPE_START:
					this._stateScriptDataDoubleEscapeStart(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED:
					this._stateScriptDataDoubleEscaped(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:
					this._stateScriptDataDoubleEscapedDash(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:
					this._stateScriptDataDoubleEscapedDashDash(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:
					this._stateScriptDataDoubleEscapedLessThanSign(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPE_END:
					this._stateScriptDataDoubleEscapeEnd(cp);
					break;
				case State.BEFORE_ATTRIBUTE_NAME:
					this._stateBeforeAttributeName(cp);
					break;
				case State.ATTRIBUTE_NAME:
					this._stateAttributeName(cp);
					break;
				case State.AFTER_ATTRIBUTE_NAME:
					this._stateAfterAttributeName(cp);
					break;
				case State.BEFORE_ATTRIBUTE_VALUE:
					this._stateBeforeAttributeValue(cp);
					break;
				case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
					this._stateAttributeValueDoubleQuoted(cp);
					break;
				case State.ATTRIBUTE_VALUE_SINGLE_QUOTED:
					this._stateAttributeValueSingleQuoted(cp);
					break;
				case State.ATTRIBUTE_VALUE_UNQUOTED:
					this._stateAttributeValueUnquoted(cp);
					break;
				case State.AFTER_ATTRIBUTE_VALUE_QUOTED:
					this._stateAfterAttributeValueQuoted(cp);
					break;
				case State.SELF_CLOSING_START_TAG:
					this._stateSelfClosingStartTag(cp);
					break;
				case State.BOGUS_COMMENT:
					this._stateBogusComment(cp);
					break;
				case State.MARKUP_DECLARATION_OPEN:
					this._stateMarkupDeclarationOpen(cp);
					break;
				case State.COMMENT_START:
					this._stateCommentStart(cp);
					break;
				case State.COMMENT_START_DASH:
					this._stateCommentStartDash(cp);
					break;
				case State.COMMENT:
					this._stateComment(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN:
					this._stateCommentLessThanSign(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN_BANG:
					this._stateCommentLessThanSignBang(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN_BANG_DASH:
					this._stateCommentLessThanSignBangDash(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:
					this._stateCommentLessThanSignBangDashDash(cp);
					break;
				case State.COMMENT_END_DASH:
					this._stateCommentEndDash(cp);
					break;
				case State.COMMENT_END:
					this._stateCommentEnd(cp);
					break;
				case State.COMMENT_END_BANG:
					this._stateCommentEndBang(cp);
					break;
				case State.DOCTYPE:
					this._stateDoctype(cp);
					break;
				case State.BEFORE_DOCTYPE_NAME:
					this._stateBeforeDoctypeName(cp);
					break;
				case State.DOCTYPE_NAME:
					this._stateDoctypeName(cp);
					break;
				case State.AFTER_DOCTYPE_NAME:
					this._stateAfterDoctypeName(cp);
					break;
				case State.AFTER_DOCTYPE_PUBLIC_KEYWORD:
					this._stateAfterDoctypePublicKeyword(cp);
					break;
				case State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:
					this._stateBeforeDoctypePublicIdentifier(cp);
					break;
				case State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:
					this._stateDoctypePublicIdentifierDoubleQuoted(cp);
					break;
				case State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:
					this._stateDoctypePublicIdentifierSingleQuoted(cp);
					break;
				case State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:
					this._stateAfterDoctypePublicIdentifier(cp);
					break;
				case State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:
					this._stateBetweenDoctypePublicAndSystemIdentifiers(cp);
					break;
				case State.AFTER_DOCTYPE_SYSTEM_KEYWORD:
					this._stateAfterDoctypeSystemKeyword(cp);
					break;
				case State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:
					this._stateBeforeDoctypeSystemIdentifier(cp);
					break;
				case State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:
					this._stateDoctypeSystemIdentifierDoubleQuoted(cp);
					break;
				case State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:
					this._stateDoctypeSystemIdentifierSingleQuoted(cp);
					break;
				case State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:
					this._stateAfterDoctypeSystemIdentifier(cp);
					break;
				case State.BOGUS_DOCTYPE:
					this._stateBogusDoctype(cp);
					break;
				case State.CDATA_SECTION:
					this._stateCdataSection(cp);
					break;
				case State.CDATA_SECTION_BRACKET:
					this._stateCdataSectionBracket(cp);
					break;
				case State.CDATA_SECTION_END:
					this._stateCdataSectionEnd(cp);
					break;
				case State.CHARACTER_REFERENCE:
					this._stateCharacterReference();
					break;
				case State.AMBIGUOUS_AMPERSAND:
					this._stateAmbiguousAmpersand(cp);
					break;
				default: throw new Error("Unknown state");
			}
		}
		_stateData(cp) {
			switch (cp) {
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.TAG_OPEN;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitCodePoint(cp);
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateRcdata(cp) {
			switch (cp) {
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.RCDATA_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateRawtext(cp) {
			switch (cp) {
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.RAWTEXT_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateScriptData(cp) {
			switch (cp) {
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_statePlaintext(cp) {
			switch (cp) {
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this._createStartTagToken();
				this.state = State.TAG_NAME;
				this._stateTagName(cp);
			} else switch (cp) {
				case CODE_POINTS.EXCLAMATION_MARK:
					this.state = State.MARKUP_DECLARATION_OPEN;
					break;
				case CODE_POINTS.SOLIDUS:
					this.state = State.END_TAG_OPEN;
					break;
				case CODE_POINTS.QUESTION_MARK:
					this._err(ERR.unexpectedQuestionMarkInsteadOfTagName);
					this._createCommentToken(1);
					this.state = State.BOGUS_COMMENT;
					this._stateBogusComment(cp);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofBeforeTagName);
					this._emitChars("<");
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.invalidFirstCharacterOfTagName);
					this._emitChars("<");
					this.state = State.DATA;
					this._stateData(cp);
			}
		}
		_stateEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this._createEndTagToken();
				this.state = State.TAG_NAME;
				this._stateTagName(cp);
			} else switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingEndTagName);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofBeforeTagName);
					this._emitChars("</");
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.invalidFirstCharacterOfTagName);
					this._createCommentToken(2);
					this.state = State.BOGUS_COMMENT;
					this._stateBogusComment(cp);
			}
		}
		_stateTagName(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					break;
				case CODE_POINTS.SOLIDUS:
					this.state = State.SELF_CLOSING_START_TAG;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.tagName += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: token.tagName += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
			}
		}
		_stateRcdataLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) this.state = State.RCDATA_END_TAG_OPEN;
			else {
				this._emitChars("<");
				this.state = State.RCDATA;
				this._stateRcdata(cp);
			}
		}
		_stateRcdataEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.RCDATA_END_TAG_NAME;
				this._stateRcdataEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.RCDATA;
				this._stateRcdata(cp);
			}
		}
		handleSpecialEndTag(_cp) {
			if (!this.preprocessor.startsWith(this.lastStartTagName, false)) return !this._ensureHibernation();
			this._createEndTagToken();
			const token = this.currentToken;
			token.tagName = this.lastStartTagName;
			switch (this.preprocessor.peek(this.lastStartTagName.length)) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this._advanceBy(this.lastStartTagName.length);
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					return false;
				case CODE_POINTS.SOLIDUS:
					this._advanceBy(this.lastStartTagName.length);
					this.state = State.SELF_CLOSING_START_TAG;
					return false;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._advanceBy(this.lastStartTagName.length);
					this.emitCurrentTagToken();
					this.state = State.DATA;
					return false;
				default: return !this._ensureHibernation();
			}
		}
		_stateRcdataEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.RCDATA;
				this._stateRcdata(cp);
			}
		}
		_stateRawtextLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) this.state = State.RAWTEXT_END_TAG_OPEN;
			else {
				this._emitChars("<");
				this.state = State.RAWTEXT;
				this._stateRawtext(cp);
			}
		}
		_stateRawtextEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.RAWTEXT_END_TAG_NAME;
				this._stateRawtextEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.RAWTEXT;
				this._stateRawtext(cp);
			}
		}
		_stateRawtextEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.RAWTEXT;
				this._stateRawtext(cp);
			}
		}
		_stateScriptDataLessThanSign(cp) {
			switch (cp) {
				case CODE_POINTS.SOLIDUS:
					this.state = State.SCRIPT_DATA_END_TAG_OPEN;
					break;
				case CODE_POINTS.EXCLAMATION_MARK:
					this.state = State.SCRIPT_DATA_ESCAPE_START;
					this._emitChars("<!");
					break;
				default:
					this._emitChars("<");
					this.state = State.SCRIPT_DATA;
					this._stateScriptData(cp);
			}
		}
		_stateScriptDataEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.SCRIPT_DATA_END_TAG_NAME;
				this._stateScriptDataEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEscapeStart(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) {
				this.state = State.SCRIPT_DATA_ESCAPE_START_DASH;
				this._emitChars("-");
			} else {
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEscapeStartDash(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) {
				this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
				this._emitChars("-");
			} else {
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEscaped(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_ESCAPED_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateScriptDataEscapedDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataEscapedDashDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.SCRIPT_DATA;
					this._emitChars(">");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataEscapedLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN;
			else if (isAsciiLetter(cp)) {
				this._emitChars("<");
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_START;
				this._stateScriptDataDoubleEscapeStart(cp);
			} else {
				this._emitChars("<");
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataEscapedEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_NAME;
				this._stateScriptDataEscapedEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataEscapedEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataDoubleEscapeStart(cp) {
			if (this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) && isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))) {
				this._emitCodePoint(cp);
				for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) this._emitCodePoint(this._consume());
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
			} else if (!this._ensureHibernation()) {
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataDoubleEscaped(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
					this._emitChars("<");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateScriptDataDoubleEscapedDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
					this._emitChars("<");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataDoubleEscapedDashDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
					this._emitChars("<");
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.SCRIPT_DATA;
					this._emitChars(">");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataDoubleEscapedLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) {
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_END;
				this._emitChars("/");
			} else {
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
				this._stateScriptDataDoubleEscaped(cp);
			}
		}
		_stateScriptDataDoubleEscapeEnd(cp) {
			if (this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) && isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))) {
				this._emitCodePoint(cp);
				for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) this._emitCodePoint(this._consume());
				this.state = State.SCRIPT_DATA_ESCAPED;
			} else if (!this._ensureHibernation()) {
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
				this._stateScriptDataDoubleEscaped(cp);
			}
		}
		_stateBeforeAttributeName(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.SOLIDUS:
				case CODE_POINTS.GREATER_THAN_SIGN:
				case CODE_POINTS.EOF:
					this.state = State.AFTER_ATTRIBUTE_NAME;
					this._stateAfterAttributeName(cp);
					break;
				case CODE_POINTS.EQUALS_SIGN:
					this._err(ERR.unexpectedEqualsSignBeforeAttributeName);
					this._createAttr("=");
					this.state = State.ATTRIBUTE_NAME;
					break;
				default:
					this._createAttr("");
					this.state = State.ATTRIBUTE_NAME;
					this._stateAttributeName(cp);
			}
		}
		_stateAttributeName(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
				case CODE_POINTS.SOLIDUS:
				case CODE_POINTS.GREATER_THAN_SIGN:
				case CODE_POINTS.EOF:
					this._leaveAttrName();
					this.state = State.AFTER_ATTRIBUTE_NAME;
					this._stateAfterAttributeName(cp);
					break;
				case CODE_POINTS.EQUALS_SIGN:
					this._leaveAttrName();
					this.state = State.BEFORE_ATTRIBUTE_VALUE;
					break;
				case CODE_POINTS.QUOTATION_MARK:
				case CODE_POINTS.APOSTROPHE:
				case CODE_POINTS.LESS_THAN_SIGN:
					this._err(ERR.unexpectedCharacterInAttributeName);
					this.currentAttr.name += String.fromCodePoint(cp);
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.name += "�";
					break;
				default: this.currentAttr.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
			}
		}
		_stateAfterAttributeName(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.SOLIDUS:
					this.state = State.SELF_CLOSING_START_TAG;
					break;
				case CODE_POINTS.EQUALS_SIGN:
					this.state = State.BEFORE_ATTRIBUTE_VALUE;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default:
					this._createAttr("");
					this.state = State.ATTRIBUTE_NAME;
					this._stateAttributeName(cp);
			}
		}
		_stateBeforeAttributeValue(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this.state = State.ATTRIBUTE_VALUE_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingAttributeValue);
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				default:
					this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
					this._stateAttributeValueUnquoted(cp);
			}
		}
		_stateAttributeValueDoubleQuoted(cp) {
			switch (cp) {
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.value += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: this.currentAttr.value += String.fromCodePoint(cp);
			}
		}
		_stateAttributeValueSingleQuoted(cp) {
			switch (cp) {
				case CODE_POINTS.APOSTROPHE:
					this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.value += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: this.currentAttr.value += String.fromCodePoint(cp);
			}
		}
		_stateAttributeValueUnquoted(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this._leaveAttrValue();
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._leaveAttrValue();
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.value += "�";
					break;
				case CODE_POINTS.QUOTATION_MARK:
				case CODE_POINTS.APOSTROPHE:
				case CODE_POINTS.LESS_THAN_SIGN:
				case CODE_POINTS.EQUALS_SIGN:
				case CODE_POINTS.GRAVE_ACCENT:
					this._err(ERR.unexpectedCharacterInUnquotedAttributeValue);
					this.currentAttr.value += String.fromCodePoint(cp);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: this.currentAttr.value += String.fromCodePoint(cp);
			}
		}
		_stateAfterAttributeValueQuoted(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this._leaveAttrValue();
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					break;
				case CODE_POINTS.SOLIDUS:
					this._leaveAttrValue();
					this.state = State.SELF_CLOSING_START_TAG;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._leaveAttrValue();
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingWhitespaceBetweenAttributes);
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					this._stateBeforeAttributeName(cp);
			}
		}
		_stateSelfClosingStartTag(cp) {
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN: {
					const token = this.currentToken;
					token.selfClosing = true;
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				}
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.unexpectedSolidusInTag);
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					this._stateBeforeAttributeName(cp);
			}
		}
		_stateBogusComment(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EOF:
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.data += "�";
					break;
				default: token.data += String.fromCodePoint(cp);
			}
		}
		_stateMarkupDeclarationOpen(cp) {
			if (this._consumeSequenceIfMatch(SEQUENCES.DASH_DASH, true)) {
				this._createCommentToken(SEQUENCES.DASH_DASH.length + 1);
				this.state = State.COMMENT_START;
			} else if (this._consumeSequenceIfMatch(SEQUENCES.DOCTYPE, false)) {
				this.currentLocation = this.getCurrentLocation(SEQUENCES.DOCTYPE.length + 1);
				this.state = State.DOCTYPE;
			} else if (this._consumeSequenceIfMatch(SEQUENCES.CDATA_START, true)) if (this.inForeignNode) this.state = State.CDATA_SECTION;
			else {
				this._err(ERR.cdataInHtmlContent);
				this._createCommentToken(SEQUENCES.CDATA_START.length + 1);
				this.currentToken.data = "[CDATA[";
				this.state = State.BOGUS_COMMENT;
			}
			else if (!this._ensureHibernation()) {
				this._err(ERR.incorrectlyOpenedComment);
				this._createCommentToken(2);
				this.state = State.BOGUS_COMMENT;
				this._stateBogusComment(cp);
			}
		}
		_stateCommentStart(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_START_DASH;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN: {
					this._err(ERR.abruptClosingOfEmptyComment);
					this.state = State.DATA;
					const token = this.currentToken;
					this.emitCurrentComment(token);
					break;
				}
				default:
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentStartDash(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_END;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptClosingOfEmptyComment);
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "-";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateComment(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_END_DASH;
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					token.data += "<";
					this.state = State.COMMENT_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.data += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default: token.data += String.fromCodePoint(cp);
			}
		}
		_stateCommentLessThanSign(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.EXCLAMATION_MARK:
					token.data += "!";
					this.state = State.COMMENT_LESS_THAN_SIGN_BANG;
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					token.data += "<";
					break;
				default:
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentLessThanSignBang(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH;
			else {
				this.state = State.COMMENT;
				this._stateComment(cp);
			}
		}
		_stateCommentLessThanSignBangDash(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH;
			else {
				this.state = State.COMMENT_END_DASH;
				this._stateCommentEndDash(cp);
			}
		}
		_stateCommentLessThanSignBangDashDash(cp) {
			if (cp !== CODE_POINTS.GREATER_THAN_SIGN && cp !== CODE_POINTS.EOF) this._err(ERR.nestedComment);
			this.state = State.COMMENT_END;
			this._stateCommentEnd(cp);
		}
		_stateCommentEndDash(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_END;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "-";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentEnd(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EXCLAMATION_MARK:
					this.state = State.COMMENT_END_BANG;
					break;
				case CODE_POINTS.HYPHEN_MINUS:
					token.data += "-";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "--";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentEndBang(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					token.data += "--!";
					this.state = State.COMMENT_END_DASH;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.incorrectlyClosedComment);
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "--!";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateDoctype(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_DOCTYPE_NAME;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.BEFORE_DOCTYPE_NAME;
					this._stateBeforeDoctypeName(cp);
					break;
				case CODE_POINTS.EOF: {
					this._err(ERR.eofInDoctype);
					this._createDoctypeToken(null);
					const token = this.currentToken;
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				}
				default:
					this._err(ERR.missingWhitespaceBeforeDoctypeName);
					this.state = State.BEFORE_DOCTYPE_NAME;
					this._stateBeforeDoctypeName(cp);
			}
		}
		_stateBeforeDoctypeName(cp) {
			if (isAsciiUpper(cp)) {
				this._createDoctypeToken(String.fromCharCode(toAsciiLower(cp)));
				this.state = State.DOCTYPE_NAME;
			} else switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._createDoctypeToken("�");
					this.state = State.DOCTYPE_NAME;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN: {
					this._err(ERR.missingDoctypeName);
					this._createDoctypeToken(null);
					const token = this.currentToken;
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				}
				case CODE_POINTS.EOF: {
					this._err(ERR.eofInDoctype);
					this._createDoctypeToken(null);
					const token = this.currentToken;
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				}
				default:
					this._createDoctypeToken(String.fromCodePoint(cp));
					this.state = State.DOCTYPE_NAME;
			}
		}
		_stateDoctypeName(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.AFTER_DOCTYPE_NAME;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.name += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
			}
		}
		_stateAfterDoctypeName(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: if (this._consumeSequenceIfMatch(SEQUENCES.PUBLIC, false)) this.state = State.AFTER_DOCTYPE_PUBLIC_KEYWORD;
				else if (this._consumeSequenceIfMatch(SEQUENCES.SYSTEM, false)) this.state = State.AFTER_DOCTYPE_SYSTEM_KEYWORD;
				else if (!this._ensureHibernation()) {
					this._err(ERR.invalidCharacterSequenceAfterDoctypeName);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
				}
			}
		}
		_stateAfterDoctypePublicKeyword(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;
					break;
				case CODE_POINTS.QUOTATION_MARK:
					this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBeforeDoctypePublicIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.QUOTATION_MARK:
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateDoctypePublicIdentifierDoubleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.publicId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.publicId += String.fromCodePoint(cp);
			}
		}
		_stateDoctypePublicIdentifierSingleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.APOSTROPHE:
					this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.publicId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.publicId += String.fromCodePoint(cp);
			}
		}
		_stateAfterDoctypePublicIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.QUOTATION_MARK:
					this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBetweenDoctypePublicAndSystemIdentifiers(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.QUOTATION_MARK:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateAfterDoctypeSystemKeyword(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;
					break;
				case CODE_POINTS.QUOTATION_MARK:
					this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBeforeDoctypeSystemIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.QUOTATION_MARK:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateDoctypeSystemIdentifierDoubleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.systemId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.systemId += String.fromCodePoint(cp);
			}
		}
		_stateDoctypeSystemIdentifierSingleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.APOSTROPHE:
					this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.systemId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.systemId += String.fromCodePoint(cp);
			}
		}
		_stateAfterDoctypeSystemIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.unexpectedCharacterAfterDoctypeSystemIdentifier);
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBogusDoctype(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					break;
				case CODE_POINTS.EOF:
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
			}
		}
		_stateCdataSection(cp) {
			switch (cp) {
				case CODE_POINTS.RIGHT_SQUARE_BRACKET:
					this.state = State.CDATA_SECTION_BRACKET;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInCdata);
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateCdataSectionBracket(cp) {
			if (cp === CODE_POINTS.RIGHT_SQUARE_BRACKET) this.state = State.CDATA_SECTION_END;
			else {
				this._emitChars("]");
				this.state = State.CDATA_SECTION;
				this._stateCdataSection(cp);
			}
		}
		_stateCdataSectionEnd(cp) {
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					break;
				case CODE_POINTS.RIGHT_SQUARE_BRACKET:
					this._emitChars("]");
					break;
				default:
					this._emitChars("]]");
					this.state = State.CDATA_SECTION;
					this._stateCdataSection(cp);
			}
		}
		_stateCharacterReference() {
			let length = this.entityDecoder.write(this.preprocessor.html, this.preprocessor.pos);
			if (length < 0) if (this.preprocessor.lastChunkWritten) length = this.entityDecoder.end();
			else {
				this.active = false;
				this.preprocessor.pos = this.preprocessor.html.length - 1;
				this.consumedAfterSnapshot = 0;
				this.preprocessor.endOfChunkHit = true;
				return;
			}
			if (length === 0) {
				this.preprocessor.pos = this.entityStartPos;
				this._flushCodePointConsumedAsCharacterReference(CODE_POINTS.AMPERSAND);
				this.state = !this._isCharacterReferenceInAttribute() && isAsciiAlphaNumeric(this.preprocessor.peek(1)) ? State.AMBIGUOUS_AMPERSAND : this.returnState;
			} else this.state = this.returnState;
		}
		_stateAmbiguousAmpersand(cp) {
			if (isAsciiAlphaNumeric(cp)) this._flushCodePointConsumedAsCharacterReference(cp);
			else {
				if (cp === CODE_POINTS.SEMICOLON) this._err(ERR.unknownNamedCharacterReference);
				this.state = this.returnState;
				this._callState(cp);
			}
		}
	};

//#endregion
//#region node_modules/parse5/dist/parser/open-element-stack.js
	const IMPLICIT_END_TAG_REQUIRED = new Set([
		TAG_ID.DD,
		TAG_ID.DT,
		TAG_ID.LI,
		TAG_ID.OPTGROUP,
		TAG_ID.OPTION,
		TAG_ID.P,
		TAG_ID.RB,
		TAG_ID.RP,
		TAG_ID.RT,
		TAG_ID.RTC
	]);
	const IMPLICIT_END_TAG_REQUIRED_THOROUGHLY = new Set([
		...IMPLICIT_END_TAG_REQUIRED,
		TAG_ID.CAPTION,
		TAG_ID.COLGROUP,
		TAG_ID.TBODY,
		TAG_ID.TD,
		TAG_ID.TFOOT,
		TAG_ID.TH,
		TAG_ID.THEAD,
		TAG_ID.TR
	]);
	const SCOPING_ELEMENTS_HTML = new Set([
		TAG_ID.APPLET,
		TAG_ID.CAPTION,
		TAG_ID.HTML,
		TAG_ID.MARQUEE,
		TAG_ID.OBJECT,
		TAG_ID.TABLE,
		TAG_ID.TD,
		TAG_ID.TEMPLATE,
		TAG_ID.TH
	]);
	const SCOPING_ELEMENTS_HTML_LIST = new Set([
		...SCOPING_ELEMENTS_HTML,
		TAG_ID.OL,
		TAG_ID.UL
	]);
	const SCOPING_ELEMENTS_HTML_BUTTON = new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.BUTTON]);
	const SCOPING_ELEMENTS_MATHML = new Set([
		TAG_ID.ANNOTATION_XML,
		TAG_ID.MI,
		TAG_ID.MN,
		TAG_ID.MO,
		TAG_ID.MS,
		TAG_ID.MTEXT
	]);
	const SCOPING_ELEMENTS_SVG = new Set([
		TAG_ID.DESC,
		TAG_ID.FOREIGN_OBJECT,
		TAG_ID.TITLE
	]);
	const TABLE_ROW_CONTEXT = new Set([
		TAG_ID.TR,
		TAG_ID.TEMPLATE,
		TAG_ID.HTML
	]);
	const TABLE_BODY_CONTEXT = new Set([
		TAG_ID.TBODY,
		TAG_ID.TFOOT,
		TAG_ID.THEAD,
		TAG_ID.TEMPLATE,
		TAG_ID.HTML
	]);
	const TABLE_CONTEXT = new Set([
		TAG_ID.TABLE,
		TAG_ID.TEMPLATE,
		TAG_ID.HTML
	]);
	const TABLE_CELLS = new Set([TAG_ID.TD, TAG_ID.TH]);
	var OpenElementStack = class {
		get currentTmplContentOrNode() {
			return this._isInTemplate() ? this.treeAdapter.getTemplateContent(this.current) : this.current;
		}
		constructor(document, treeAdapter, handler) {
			this.treeAdapter = treeAdapter;
			this.handler = handler;
			this.items = [];
			this.tagIDs = [];
			this.stackTop = -1;
			this.tmplCount = 0;
			this.currentTagId = TAG_ID.UNKNOWN;
			this.current = document;
		}
		_indexOf(element) {
			return this.items.lastIndexOf(element, this.stackTop);
		}
		_isInTemplate() {
			return this.currentTagId === TAG_ID.TEMPLATE && this.treeAdapter.getNamespaceURI(this.current) === NS.HTML;
		}
		_updateCurrentElement() {
			this.current = this.items[this.stackTop];
			this.currentTagId = this.tagIDs[this.stackTop];
		}
		push(element, tagID) {
			this.stackTop++;
			this.items[this.stackTop] = element;
			this.current = element;
			this.tagIDs[this.stackTop] = tagID;
			this.currentTagId = tagID;
			if (this._isInTemplate()) this.tmplCount++;
			this.handler.onItemPush(element, tagID, true);
		}
		pop() {
			const popped = this.current;
			if (this.tmplCount > 0 && this._isInTemplate()) this.tmplCount--;
			this.stackTop--;
			this._updateCurrentElement();
			this.handler.onItemPop(popped, true);
		}
		replace(oldElement, newElement) {
			const idx = this._indexOf(oldElement);
			this.items[idx] = newElement;
			if (idx === this.stackTop) this.current = newElement;
		}
		insertAfter(referenceElement, newElement, newElementID) {
			const insertionIdx = this._indexOf(referenceElement) + 1;
			this.items.splice(insertionIdx, 0, newElement);
			this.tagIDs.splice(insertionIdx, 0, newElementID);
			this.stackTop++;
			if (insertionIdx === this.stackTop) this._updateCurrentElement();
			if (this.current && this.currentTagId !== void 0) this.handler.onItemPush(this.current, this.currentTagId, insertionIdx === this.stackTop);
		}
		popUntilTagNamePopped(tagName) {
			let targetIdx = this.stackTop + 1;
			do
				targetIdx = this.tagIDs.lastIndexOf(tagName, targetIdx - 1);
			while (targetIdx > 0 && this.treeAdapter.getNamespaceURI(this.items[targetIdx]) !== NS.HTML);
			this.shortenToLength(Math.max(targetIdx, 0));
		}
		shortenToLength(idx) {
			while (this.stackTop >= idx) {
				const popped = this.current;
				if (this.tmplCount > 0 && this._isInTemplate()) this.tmplCount -= 1;
				this.stackTop--;
				this._updateCurrentElement();
				this.handler.onItemPop(popped, this.stackTop < idx);
			}
		}
		popUntilElementPopped(element) {
			const idx = this._indexOf(element);
			this.shortenToLength(Math.max(idx, 0));
		}
		popUntilPopped(tagNames, targetNS) {
			const idx = this._indexOfTagNames(tagNames, targetNS);
			this.shortenToLength(Math.max(idx, 0));
		}
		popUntilNumberedHeaderPopped() {
			this.popUntilPopped(NUMBERED_HEADERS, NS.HTML);
		}
		popUntilTableCellPopped() {
			this.popUntilPopped(TABLE_CELLS, NS.HTML);
		}
		popAllUpToHtmlElement() {
			this.tmplCount = 0;
			this.shortenToLength(1);
		}
		_indexOfTagNames(tagNames, namespace) {
			for (let i = this.stackTop; i >= 0; i--) if (tagNames.has(this.tagIDs[i]) && this.treeAdapter.getNamespaceURI(this.items[i]) === namespace) return i;
			return -1;
		}
		clearBackTo(tagNames, targetNS) {
			const idx = this._indexOfTagNames(tagNames, targetNS);
			this.shortenToLength(idx + 1);
		}
		clearBackToTableContext() {
			this.clearBackTo(TABLE_CONTEXT, NS.HTML);
		}
		clearBackToTableBodyContext() {
			this.clearBackTo(TABLE_BODY_CONTEXT, NS.HTML);
		}
		clearBackToTableRowContext() {
			this.clearBackTo(TABLE_ROW_CONTEXT, NS.HTML);
		}
		remove(element) {
			const idx = this._indexOf(element);
			if (idx >= 0) if (idx === this.stackTop) this.pop();
			else {
				this.items.splice(idx, 1);
				this.tagIDs.splice(idx, 1);
				this.stackTop--;
				this._updateCurrentElement();
				this.handler.onItemPop(element, false);
			}
		}
		tryPeekProperlyNestedBodyElement() {
			return this.stackTop >= 1 && this.tagIDs[1] === TAG_ID.BODY ? this.items[1] : null;
		}
		contains(element) {
			return this._indexOf(element) > -1;
		}
		getCommonAncestor(element) {
			const elementIdx = this._indexOf(element) - 1;
			return elementIdx >= 0 ? this.items[elementIdx] : null;
		}
		isRootHtmlElementCurrent() {
			return this.stackTop === 0 && this.tagIDs[0] === TAG_ID.HTML;
		}
		hasInDynamicScope(tagName, htmlScope) {
			for (let i = this.stackTop; i >= 0; i--) {
				const tn = this.tagIDs[i];
				switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
					case NS.HTML:
						if (tn === tagName) return true;
						if (htmlScope.has(tn)) return false;
						break;
					case NS.SVG:
						if (SCOPING_ELEMENTS_SVG.has(tn)) return false;
						break;
					case NS.MATHML:
						if (SCOPING_ELEMENTS_MATHML.has(tn)) return false;
						break;
				}
			}
			return true;
		}
		hasInScope(tagName) {
			return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML);
		}
		hasInListItemScope(tagName) {
			return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_LIST);
		}
		hasInButtonScope(tagName) {
			return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_BUTTON);
		}
		hasNumberedHeaderInScope() {
			for (let i = this.stackTop; i >= 0; i--) {
				const tn = this.tagIDs[i];
				switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
					case NS.HTML:
						if (NUMBERED_HEADERS.has(tn)) return true;
						if (SCOPING_ELEMENTS_HTML.has(tn)) return false;
						break;
					case NS.SVG:
						if (SCOPING_ELEMENTS_SVG.has(tn)) return false;
						break;
					case NS.MATHML:
						if (SCOPING_ELEMENTS_MATHML.has(tn)) return false;
						break;
				}
			}
			return true;
		}
		hasInTableScope(tagName) {
			for (let i = this.stackTop; i >= 0; i--) {
				if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
				switch (this.tagIDs[i]) {
					case tagName: return true;
					case TAG_ID.TABLE:
					case TAG_ID.HTML: return false;
				}
			}
			return true;
		}
		hasTableBodyContextInTableScope() {
			for (let i = this.stackTop; i >= 0; i--) {
				if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
				switch (this.tagIDs[i]) {
					case TAG_ID.TBODY:
					case TAG_ID.THEAD:
					case TAG_ID.TFOOT: return true;
					case TAG_ID.TABLE:
					case TAG_ID.HTML: return false;
				}
			}
			return true;
		}
		hasInSelectScope(tagName) {
			for (let i = this.stackTop; i >= 0; i--) {
				if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
				switch (this.tagIDs[i]) {
					case tagName: return true;
					case TAG_ID.OPTION:
					case TAG_ID.OPTGROUP: break;
					default: return false;
				}
			}
			return true;
		}
		generateImpliedEndTags() {
			while (this.currentTagId !== void 0 && IMPLICIT_END_TAG_REQUIRED.has(this.currentTagId)) this.pop();
		}
		generateImpliedEndTagsThoroughly() {
			while (this.currentTagId !== void 0 && IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)) this.pop();
		}
		generateImpliedEndTagsWithExclusion(exclusionId) {
			while (this.currentTagId !== void 0 && this.currentTagId !== exclusionId && IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)) this.pop();
		}
	};

//#endregion
//#region node_modules/parse5/dist/parser/formatting-element-list.js
	const NOAH_ARK_CAPACITY = 3;
	var EntryType;
	(function(EntryType) {
		EntryType[EntryType["Marker"] = 0] = "Marker";
		EntryType[EntryType["Element"] = 1] = "Element";
	})(EntryType || (EntryType = {}));
	const MARKER = { type: EntryType.Marker };
	var FormattingElementList = class {
		constructor(treeAdapter) {
			this.treeAdapter = treeAdapter;
			this.entries = [];
			this.bookmark = null;
		}
		_getNoahArkConditionCandidates(newElement, neAttrs) {
			const candidates = [];
			const neAttrsLength = neAttrs.length;
			const neTagName = this.treeAdapter.getTagName(newElement);
			const neNamespaceURI = this.treeAdapter.getNamespaceURI(newElement);
			for (let i = 0; i < this.entries.length; i++) {
				const entry = this.entries[i];
				if (entry.type === EntryType.Marker) break;
				const { element } = entry;
				if (this.treeAdapter.getTagName(element) === neTagName && this.treeAdapter.getNamespaceURI(element) === neNamespaceURI) {
					const elementAttrs = this.treeAdapter.getAttrList(element);
					if (elementAttrs.length === neAttrsLength) candidates.push({
						idx: i,
						attrs: elementAttrs
					});
				}
			}
			return candidates;
		}
		_ensureNoahArkCondition(newElement) {
			if (this.entries.length < NOAH_ARK_CAPACITY) return;
			const neAttrs = this.treeAdapter.getAttrList(newElement);
			const candidates = this._getNoahArkConditionCandidates(newElement, neAttrs);
			if (candidates.length < NOAH_ARK_CAPACITY) return;
			const neAttrsMap = new Map(neAttrs.map((neAttr) => [neAttr.name, neAttr.value]));
			let validCandidates = 0;
			for (let i = 0; i < candidates.length; i++) {
				const candidate = candidates[i];
				if (candidate.attrs.every((cAttr) => neAttrsMap.get(cAttr.name) === cAttr.value)) {
					validCandidates += 1;
					if (validCandidates >= NOAH_ARK_CAPACITY) this.entries.splice(candidate.idx, 1);
				}
			}
		}
		insertMarker() {
			this.entries.unshift(MARKER);
		}
		pushElement(element, token) {
			this._ensureNoahArkCondition(element);
			this.entries.unshift({
				type: EntryType.Element,
				element,
				token
			});
		}
		insertElementAfterBookmark(element, token) {
			const bookmarkIdx = this.entries.indexOf(this.bookmark);
			this.entries.splice(bookmarkIdx, 0, {
				type: EntryType.Element,
				element,
				token
			});
		}
		removeEntry(entry) {
			const entryIndex = this.entries.indexOf(entry);
			if (entryIndex !== -1) this.entries.splice(entryIndex, 1);
		}
		/**
		* Clears the list of formatting elements up to the last marker.
		*
		* @see https://html.spec.whatwg.org/multipage/parsing.html#clear-the-list-of-active-formatting-elements-up-to-the-last-marker
		*/
		clearToLastMarker() {
			const markerIdx = this.entries.indexOf(MARKER);
			if (markerIdx === -1) this.entries.length = 0;
			else this.entries.splice(0, markerIdx + 1);
		}
		getElementEntryInScopeWithTagName(tagName) {
			const entry = this.entries.find((entry) => entry.type === EntryType.Marker || this.treeAdapter.getTagName(entry.element) === tagName);
			return entry && entry.type === EntryType.Element ? entry : null;
		}
		getElementEntry(element) {
			return this.entries.find((entry) => entry.type === EntryType.Element && entry.element === element);
		}
	};

//#endregion
//#region node_modules/parse5/dist/tree-adapters/default.js
	const defaultTreeAdapter = {
		createDocument() {
			return {
				nodeName: "#document",
				mode: DOCUMENT_MODE.NO_QUIRKS,
				childNodes: []
			};
		},
		createDocumentFragment() {
			return {
				nodeName: "#document-fragment",
				childNodes: []
			};
		},
		createElement(tagName, namespaceURI, attrs) {
			return {
				nodeName: tagName,
				tagName,
				attrs,
				namespaceURI,
				childNodes: [],
				parentNode: null
			};
		},
		createCommentNode(data) {
			return {
				nodeName: "#comment",
				data,
				parentNode: null
			};
		},
		createTextNode(value) {
			return {
				nodeName: "#text",
				value,
				parentNode: null
			};
		},
		appendChild(parentNode, newNode) {
			parentNode.childNodes.push(newNode);
			newNode.parentNode = parentNode;
		},
		insertBefore(parentNode, newNode, referenceNode) {
			const insertionIdx = parentNode.childNodes.indexOf(referenceNode);
			parentNode.childNodes.splice(insertionIdx, 0, newNode);
			newNode.parentNode = parentNode;
		},
		setTemplateContent(templateElement, contentElement) {
			templateElement.content = contentElement;
		},
		getTemplateContent(templateElement) {
			return templateElement.content;
		},
		setDocumentType(document, name, publicId, systemId) {
			const doctypeNode = document.childNodes.find((node) => node.nodeName === "#documentType");
			if (doctypeNode) {
				doctypeNode.name = name;
				doctypeNode.publicId = publicId;
				doctypeNode.systemId = systemId;
			} else {
				const node = {
					nodeName: "#documentType",
					name,
					publicId,
					systemId,
					parentNode: null
				};
				defaultTreeAdapter.appendChild(document, node);
			}
		},
		setDocumentMode(document, mode) {
			document.mode = mode;
		},
		getDocumentMode(document) {
			return document.mode;
		},
		detachNode(node) {
			if (node.parentNode) {
				const idx = node.parentNode.childNodes.indexOf(node);
				node.parentNode.childNodes.splice(idx, 1);
				node.parentNode = null;
			}
		},
		insertText(parentNode, text) {
			if (parentNode.childNodes.length > 0) {
				const prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];
				if (defaultTreeAdapter.isTextNode(prevNode)) {
					prevNode.value += text;
					return;
				}
			}
			defaultTreeAdapter.appendChild(parentNode, defaultTreeAdapter.createTextNode(text));
		},
		insertTextBefore(parentNode, text, referenceNode) {
			const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];
			if (prevNode && defaultTreeAdapter.isTextNode(prevNode)) prevNode.value += text;
			else defaultTreeAdapter.insertBefore(parentNode, defaultTreeAdapter.createTextNode(text), referenceNode);
		},
		adoptAttributes(recipient, attrs) {
			const recipientAttrsMap = new Set(recipient.attrs.map((attr) => attr.name));
			for (let j = 0; j < attrs.length; j++) if (!recipientAttrsMap.has(attrs[j].name)) recipient.attrs.push(attrs[j]);
		},
		getFirstChild(node) {
			return node.childNodes[0];
		},
		getChildNodes(node) {
			return node.childNodes;
		},
		getParentNode(node) {
			return node.parentNode;
		},
		getAttrList(element) {
			return element.attrs;
		},
		getTagName(element) {
			return element.tagName;
		},
		getNamespaceURI(element) {
			return element.namespaceURI;
		},
		getTextNodeContent(textNode) {
			return textNode.value;
		},
		getCommentNodeContent(commentNode) {
			return commentNode.data;
		},
		getDocumentTypeNodeName(doctypeNode) {
			return doctypeNode.name;
		},
		getDocumentTypeNodePublicId(doctypeNode) {
			return doctypeNode.publicId;
		},
		getDocumentTypeNodeSystemId(doctypeNode) {
			return doctypeNode.systemId;
		},
		isTextNode(node) {
			return node.nodeName === "#text";
		},
		isCommentNode(node) {
			return node.nodeName === "#comment";
		},
		isDocumentTypeNode(node) {
			return node.nodeName === "#documentType";
		},
		isElementNode(node) {
			return Object.prototype.hasOwnProperty.call(node, "tagName");
		},
		setNodeSourceCodeLocation(node, location) {
			node.sourceCodeLocation = location;
		},
		getNodeSourceCodeLocation(node) {
			return node.sourceCodeLocation;
		},
		updateNodeSourceCodeLocation(node, endLocation) {
			node.sourceCodeLocation = {
				...node.sourceCodeLocation,
				...endLocation
			};
		}
	};

//#endregion
//#region node_modules/parse5/dist/common/doctype.js
	const VALID_DOCTYPE_NAME = "html";
	const VALID_SYSTEM_ID = "about:legacy-compat";
	const QUIRKS_MODE_SYSTEM_ID = "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd";
	const QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
		"+//silmaril//dtd html pro v0r11 19970101//",
		"-//as//dtd html 3.0 aswedit + extensions//",
		"-//advasoft ltd//dtd html 3.0 aswedit + extensions//",
		"-//ietf//dtd html 2.0 level 1//",
		"-//ietf//dtd html 2.0 level 2//",
		"-//ietf//dtd html 2.0 strict level 1//",
		"-//ietf//dtd html 2.0 strict level 2//",
		"-//ietf//dtd html 2.0 strict//",
		"-//ietf//dtd html 2.0//",
		"-//ietf//dtd html 2.1e//",
		"-//ietf//dtd html 3.0//",
		"-//ietf//dtd html 3.2 final//",
		"-//ietf//dtd html 3.2//",
		"-//ietf//dtd html 3//",
		"-//ietf//dtd html level 0//",
		"-//ietf//dtd html level 1//",
		"-//ietf//dtd html level 2//",
		"-//ietf//dtd html level 3//",
		"-//ietf//dtd html strict level 0//",
		"-//ietf//dtd html strict level 1//",
		"-//ietf//dtd html strict level 2//",
		"-//ietf//dtd html strict level 3//",
		"-//ietf//dtd html strict//",
		"-//ietf//dtd html//",
		"-//metrius//dtd metrius presentational//",
		"-//microsoft//dtd internet explorer 2.0 html strict//",
		"-//microsoft//dtd internet explorer 2.0 html//",
		"-//microsoft//dtd internet explorer 2.0 tables//",
		"-//microsoft//dtd internet explorer 3.0 html strict//",
		"-//microsoft//dtd internet explorer 3.0 html//",
		"-//microsoft//dtd internet explorer 3.0 tables//",
		"-//netscape comm. corp.//dtd html//",
		"-//netscape comm. corp.//dtd strict html//",
		"-//o'reilly and associates//dtd html 2.0//",
		"-//o'reilly and associates//dtd html extended 1.0//",
		"-//o'reilly and associates//dtd html extended relaxed 1.0//",
		"-//sq//dtd html 2.0 hotmetal + extensions//",
		"-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//",
		"-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//",
		"-//spyglass//dtd html 2.0 extended//",
		"-//sun microsystems corp.//dtd hotjava html//",
		"-//sun microsystems corp.//dtd hotjava strict html//",
		"-//w3c//dtd html 3 1995-03-24//",
		"-//w3c//dtd html 3.2 draft//",
		"-//w3c//dtd html 3.2 final//",
		"-//w3c//dtd html 3.2//",
		"-//w3c//dtd html 3.2s draft//",
		"-//w3c//dtd html 4.0 frameset//",
		"-//w3c//dtd html 4.0 transitional//",
		"-//w3c//dtd html experimental 19960712//",
		"-//w3c//dtd html experimental 970421//",
		"-//w3c//dtd w3 html//",
		"-//w3o//dtd w3 html 3.0//",
		"-//webtechs//dtd mozilla html 2.0//",
		"-//webtechs//dtd mozilla html//"
	];
	const QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
		...QUIRKS_MODE_PUBLIC_ID_PREFIXES,
		"-//w3c//dtd html 4.01 frameset//",
		"-//w3c//dtd html 4.01 transitional//"
	];
	const QUIRKS_MODE_PUBLIC_IDS = new Set([
		"-//w3o//dtd w3 html strict 3.0//en//",
		"-/w3c/dtd html 4.0 transitional/en",
		"html"
	]);
	const LIMITED_QUIRKS_PUBLIC_ID_PREFIXES = ["-//w3c//dtd xhtml 1.0 frameset//", "-//w3c//dtd xhtml 1.0 transitional//"];
	const LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
		...LIMITED_QUIRKS_PUBLIC_ID_PREFIXES,
		"-//w3c//dtd html 4.01 frameset//",
		"-//w3c//dtd html 4.01 transitional//"
	];
	function hasPrefix(publicId, prefixes) {
		return prefixes.some((prefix) => publicId.startsWith(prefix));
	}
	function isConforming(token) {
		return token.name === VALID_DOCTYPE_NAME && token.publicId === null && (token.systemId === null || token.systemId === VALID_SYSTEM_ID);
	}
	function getDocumentMode(token) {
		if (token.name !== VALID_DOCTYPE_NAME) return DOCUMENT_MODE.QUIRKS;
		const { systemId } = token;
		if (systemId && systemId.toLowerCase() === QUIRKS_MODE_SYSTEM_ID) return DOCUMENT_MODE.QUIRKS;
		let { publicId } = token;
		if (publicId !== null) {
			publicId = publicId.toLowerCase();
			if (QUIRKS_MODE_PUBLIC_IDS.has(publicId)) return DOCUMENT_MODE.QUIRKS;
			let prefixes = systemId === null ? QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES : QUIRKS_MODE_PUBLIC_ID_PREFIXES;
			if (hasPrefix(publicId, prefixes)) return DOCUMENT_MODE.QUIRKS;
			prefixes = systemId === null ? LIMITED_QUIRKS_PUBLIC_ID_PREFIXES : LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES;
			if (hasPrefix(publicId, prefixes)) return DOCUMENT_MODE.LIMITED_QUIRKS;
		}
		return DOCUMENT_MODE.NO_QUIRKS;
	}

//#endregion
//#region node_modules/parse5/dist/common/foreign-content.js
	const MIME_TYPES = {
		TEXT_HTML: "text/html",
		APPLICATION_XML: "application/xhtml+xml"
	};
	const DEFINITION_URL_ATTR = "definitionurl";
	const ADJUSTED_DEFINITION_URL_ATTR = "definitionURL";
	const SVG_ATTRS_ADJUSTMENT_MAP = new Map([
		"attributeName",
		"attributeType",
		"baseFrequency",
		"baseProfile",
		"calcMode",
		"clipPathUnits",
		"diffuseConstant",
		"edgeMode",
		"filterUnits",
		"glyphRef",
		"gradientTransform",
		"gradientUnits",
		"kernelMatrix",
		"kernelUnitLength",
		"keyPoints",
		"keySplines",
		"keyTimes",
		"lengthAdjust",
		"limitingConeAngle",
		"markerHeight",
		"markerUnits",
		"markerWidth",
		"maskContentUnits",
		"maskUnits",
		"numOctaves",
		"pathLength",
		"patternContentUnits",
		"patternTransform",
		"patternUnits",
		"pointsAtX",
		"pointsAtY",
		"pointsAtZ",
		"preserveAlpha",
		"preserveAspectRatio",
		"primitiveUnits",
		"refX",
		"refY",
		"repeatCount",
		"repeatDur",
		"requiredExtensions",
		"requiredFeatures",
		"specularConstant",
		"specularExponent",
		"spreadMethod",
		"startOffset",
		"stdDeviation",
		"stitchTiles",
		"surfaceScale",
		"systemLanguage",
		"tableValues",
		"targetX",
		"targetY",
		"textLength",
		"viewBox",
		"viewTarget",
		"xChannelSelector",
		"yChannelSelector",
		"zoomAndPan"
	].map((attr) => [attr.toLowerCase(), attr]));
	const XML_ATTRS_ADJUSTMENT_MAP = new Map([
		["xlink:actuate", {
			prefix: "xlink",
			name: "actuate",
			namespace: NS.XLINK
		}],
		["xlink:arcrole", {
			prefix: "xlink",
			name: "arcrole",
			namespace: NS.XLINK
		}],
		["xlink:href", {
			prefix: "xlink",
			name: "href",
			namespace: NS.XLINK
		}],
		["xlink:role", {
			prefix: "xlink",
			name: "role",
			namespace: NS.XLINK
		}],
		["xlink:show", {
			prefix: "xlink",
			name: "show",
			namespace: NS.XLINK
		}],
		["xlink:title", {
			prefix: "xlink",
			name: "title",
			namespace: NS.XLINK
		}],
		["xlink:type", {
			prefix: "xlink",
			name: "type",
			namespace: NS.XLINK
		}],
		["xml:lang", {
			prefix: "xml",
			name: "lang",
			namespace: NS.XML
		}],
		["xml:space", {
			prefix: "xml",
			name: "space",
			namespace: NS.XML
		}],
		["xmlns", {
			prefix: "",
			name: "xmlns",
			namespace: NS.XMLNS
		}],
		["xmlns:xlink", {
			prefix: "xmlns",
			name: "xlink",
			namespace: NS.XMLNS
		}]
	]);
	const SVG_TAG_NAMES_ADJUSTMENT_MAP = new Map([
		"altGlyph",
		"altGlyphDef",
		"altGlyphItem",
		"animateColor",
		"animateMotion",
		"animateTransform",
		"clipPath",
		"feBlend",
		"feColorMatrix",
		"feComponentTransfer",
		"feComposite",
		"feConvolveMatrix",
		"feDiffuseLighting",
		"feDisplacementMap",
		"feDistantLight",
		"feFlood",
		"feFuncA",
		"feFuncB",
		"feFuncG",
		"feFuncR",
		"feGaussianBlur",
		"feImage",
		"feMerge",
		"feMergeNode",
		"feMorphology",
		"feOffset",
		"fePointLight",
		"feSpecularLighting",
		"feSpotLight",
		"feTile",
		"feTurbulence",
		"foreignObject",
		"glyphRef",
		"linearGradient",
		"radialGradient",
		"textPath"
	].map((tn) => [tn.toLowerCase(), tn]));
	const EXITS_FOREIGN_CONTENT = new Set([
		TAG_ID.B,
		TAG_ID.BIG,
		TAG_ID.BLOCKQUOTE,
		TAG_ID.BODY,
		TAG_ID.BR,
		TAG_ID.CENTER,
		TAG_ID.CODE,
		TAG_ID.DD,
		TAG_ID.DIV,
		TAG_ID.DL,
		TAG_ID.DT,
		TAG_ID.EM,
		TAG_ID.EMBED,
		TAG_ID.H1,
		TAG_ID.H2,
		TAG_ID.H3,
		TAG_ID.H4,
		TAG_ID.H5,
		TAG_ID.H6,
		TAG_ID.HEAD,
		TAG_ID.HR,
		TAG_ID.I,
		TAG_ID.IMG,
		TAG_ID.LI,
		TAG_ID.LISTING,
		TAG_ID.MENU,
		TAG_ID.META,
		TAG_ID.NOBR,
		TAG_ID.OL,
		TAG_ID.P,
		TAG_ID.PRE,
		TAG_ID.RUBY,
		TAG_ID.S,
		TAG_ID.SMALL,
		TAG_ID.SPAN,
		TAG_ID.STRONG,
		TAG_ID.STRIKE,
		TAG_ID.SUB,
		TAG_ID.SUP,
		TAG_ID.TABLE,
		TAG_ID.TT,
		TAG_ID.U,
		TAG_ID.UL,
		TAG_ID.VAR
	]);
	function causesExit(startTagToken) {
		const tn = startTagToken.tagID;
		return tn === TAG_ID.FONT && startTagToken.attrs.some(({ name }) => name === ATTRS.COLOR || name === ATTRS.SIZE || name === ATTRS.FACE) || EXITS_FOREIGN_CONTENT.has(tn);
	}
	function adjustTokenMathMLAttrs(token) {
		for (let i = 0; i < token.attrs.length; i++) if (token.attrs[i].name === DEFINITION_URL_ATTR) {
			token.attrs[i].name = ADJUSTED_DEFINITION_URL_ATTR;
			break;
		}
	}
	function adjustTokenSVGAttrs(token) {
		for (let i = 0; i < token.attrs.length; i++) {
			const adjustedAttrName = SVG_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
			if (adjustedAttrName != null) token.attrs[i].name = adjustedAttrName;
		}
	}
	function adjustTokenXMLAttrs(token) {
		for (let i = 0; i < token.attrs.length; i++) {
			const adjustedAttrEntry = XML_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
			if (adjustedAttrEntry) {
				token.attrs[i].prefix = adjustedAttrEntry.prefix;
				token.attrs[i].name = adjustedAttrEntry.name;
				token.attrs[i].namespace = adjustedAttrEntry.namespace;
			}
		}
	}
	function adjustTokenSVGTagName(token) {
		const adjustedTagName = SVG_TAG_NAMES_ADJUSTMENT_MAP.get(token.tagName);
		if (adjustedTagName != null) {
			token.tagName = adjustedTagName;
			token.tagID = getTagID(token.tagName);
		}
	}
	function isMathMLTextIntegrationPoint(tn, ns) {
		return ns === NS.MATHML && (tn === TAG_ID.MI || tn === TAG_ID.MO || tn === TAG_ID.MN || tn === TAG_ID.MS || tn === TAG_ID.MTEXT);
	}
	function isHtmlIntegrationPoint(tn, ns, attrs) {
		if (ns === NS.MATHML && tn === TAG_ID.ANNOTATION_XML) {
			for (let i = 0; i < attrs.length; i++) if (attrs[i].name === ATTRS.ENCODING) {
				const value = attrs[i].value.toLowerCase();
				return value === MIME_TYPES.TEXT_HTML || value === MIME_TYPES.APPLICATION_XML;
			}
		}
		return ns === NS.SVG && (tn === TAG_ID.FOREIGN_OBJECT || tn === TAG_ID.DESC || tn === TAG_ID.TITLE);
	}
	function isIntegrationPoint(tn, ns, attrs, foreignNS) {
		return (!foreignNS || foreignNS === NS.HTML) && isHtmlIntegrationPoint(tn, ns, attrs) || (!foreignNS || foreignNS === NS.MATHML) && isMathMLTextIntegrationPoint(tn, ns);
	}

//#endregion
//#region node_modules/parse5/dist/parser/index.js
	const HIDDEN_INPUT_TYPE = "hidden";
	const AA_OUTER_LOOP_ITER = 8;
	const AA_INNER_LOOP_ITER = 3;
	var InsertionMode;
	(function(InsertionMode) {
		InsertionMode[InsertionMode["INITIAL"] = 0] = "INITIAL";
		InsertionMode[InsertionMode["BEFORE_HTML"] = 1] = "BEFORE_HTML";
		InsertionMode[InsertionMode["BEFORE_HEAD"] = 2] = "BEFORE_HEAD";
		InsertionMode[InsertionMode["IN_HEAD"] = 3] = "IN_HEAD";
		InsertionMode[InsertionMode["IN_HEAD_NO_SCRIPT"] = 4] = "IN_HEAD_NO_SCRIPT";
		InsertionMode[InsertionMode["AFTER_HEAD"] = 5] = "AFTER_HEAD";
		InsertionMode[InsertionMode["IN_BODY"] = 6] = "IN_BODY";
		InsertionMode[InsertionMode["TEXT"] = 7] = "TEXT";
		InsertionMode[InsertionMode["IN_TABLE"] = 8] = "IN_TABLE";
		InsertionMode[InsertionMode["IN_TABLE_TEXT"] = 9] = "IN_TABLE_TEXT";
		InsertionMode[InsertionMode["IN_CAPTION"] = 10] = "IN_CAPTION";
		InsertionMode[InsertionMode["IN_COLUMN_GROUP"] = 11] = "IN_COLUMN_GROUP";
		InsertionMode[InsertionMode["IN_TABLE_BODY"] = 12] = "IN_TABLE_BODY";
		InsertionMode[InsertionMode["IN_ROW"] = 13] = "IN_ROW";
		InsertionMode[InsertionMode["IN_CELL"] = 14] = "IN_CELL";
		InsertionMode[InsertionMode["IN_SELECT"] = 15] = "IN_SELECT";
		InsertionMode[InsertionMode["IN_SELECT_IN_TABLE"] = 16] = "IN_SELECT_IN_TABLE";
		InsertionMode[InsertionMode["IN_TEMPLATE"] = 17] = "IN_TEMPLATE";
		InsertionMode[InsertionMode["AFTER_BODY"] = 18] = "AFTER_BODY";
		InsertionMode[InsertionMode["IN_FRAMESET"] = 19] = "IN_FRAMESET";
		InsertionMode[InsertionMode["AFTER_FRAMESET"] = 20] = "AFTER_FRAMESET";
		InsertionMode[InsertionMode["AFTER_AFTER_BODY"] = 21] = "AFTER_AFTER_BODY";
		InsertionMode[InsertionMode["AFTER_AFTER_FRAMESET"] = 22] = "AFTER_AFTER_FRAMESET";
	})(InsertionMode || (InsertionMode = {}));
	const BASE_LOC = {
		startLine: -1,
		startCol: -1,
		startOffset: -1,
		endLine: -1,
		endCol: -1,
		endOffset: -1
	};
	const TABLE_STRUCTURE_TAGS = new Set([
		TAG_ID.TABLE,
		TAG_ID.TBODY,
		TAG_ID.TFOOT,
		TAG_ID.THEAD,
		TAG_ID.TR
	]);
	const defaultParserOptions = {
		scriptingEnabled: true,
		sourceCodeLocationInfo: false,
		treeAdapter: defaultTreeAdapter,
		onParseError: null
	};
	var Parser = class {
		constructor(options, document, fragmentContext = null, scriptHandler = null) {
			this.fragmentContext = fragmentContext;
			this.scriptHandler = scriptHandler;
			this.currentToken = null;
			this.stopped = false;
			/** @internal */
			this.insertionMode = InsertionMode.INITIAL;
			/** @internal */
			this.originalInsertionMode = InsertionMode.INITIAL;
			/** @internal */
			this.headElement = null;
			/** @internal */
			this.formElement = null;
			/** Indicates that the current node is not an element in the HTML namespace */
			this.currentNotInHTML = false;
			/**
			* The template insertion mode stack is maintained from the left.
			* Ie. the topmost element will always have index 0.
			*
			* @internal
			*/
			this.tmplInsertionModeStack = [];
			/** @internal */
			this.pendingCharacterTokens = [];
			/** @internal */
			this.hasNonWhitespacePendingCharacterToken = false;
			/** @internal */
			this.framesetOk = true;
			/** @internal */
			this.skipNextNewLine = false;
			/** @internal */
			this.fosterParentingEnabled = false;
			this.options = {
				...defaultParserOptions,
				...options
			};
			this.treeAdapter = this.options.treeAdapter;
			this.onParseError = this.options.onParseError;
			if (this.onParseError) this.options.sourceCodeLocationInfo = true;
			this.document = document !== null && document !== void 0 ? document : this.treeAdapter.createDocument();
			this.tokenizer = new Tokenizer(this.options, this);
			this.activeFormattingElements = new FormattingElementList(this.treeAdapter);
			this.fragmentContextID = fragmentContext ? getTagID(this.treeAdapter.getTagName(fragmentContext)) : TAG_ID.UNKNOWN;
			this._setContextModes(fragmentContext !== null && fragmentContext !== void 0 ? fragmentContext : this.document, this.fragmentContextID);
			this.openElements = new OpenElementStack(this.document, this.treeAdapter, this);
		}
		static parse(html, options) {
			const parser = new this(options);
			parser.tokenizer.write(html, true);
			return parser.document;
		}
		static getFragmentParser(fragmentContext, options) {
			const opts = {
				...defaultParserOptions,
				...options
			};
			fragmentContext !== null && fragmentContext !== void 0 || (fragmentContext = opts.treeAdapter.createElement(TAG_NAMES.TEMPLATE, NS.HTML, []));
			const documentMock = opts.treeAdapter.createElement("documentmock", NS.HTML, []);
			const parser = new this(opts, documentMock, fragmentContext);
			if (parser.fragmentContextID === TAG_ID.TEMPLATE) parser.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
			parser._initTokenizerForFragmentParsing();
			parser._insertFakeRootElement();
			parser._resetInsertionMode();
			parser._findFormInFragmentContext();
			return parser;
		}
		getFragment() {
			const rootElement = this.treeAdapter.getFirstChild(this.document);
			const fragment = this.treeAdapter.createDocumentFragment();
			this._adoptNodes(rootElement, fragment);
			return fragment;
		}
		/** @internal */
		_err(token, code, beforeToken) {
			var _a;
			if (!this.onParseError) return;
			const loc = (_a = token.location) !== null && _a !== void 0 ? _a : BASE_LOC;
			const err = {
				code,
				startLine: loc.startLine,
				startCol: loc.startCol,
				startOffset: loc.startOffset,
				endLine: beforeToken ? loc.startLine : loc.endLine,
				endCol: beforeToken ? loc.startCol : loc.endCol,
				endOffset: beforeToken ? loc.startOffset : loc.endOffset
			};
			this.onParseError(err);
		}
		/** @internal */
		onItemPush(node, tid, isTop) {
			var _a, _b;
			(_b = (_a = this.treeAdapter).onItemPush) === null || _b === void 0 || _b.call(_a, node);
			if (isTop && this.openElements.stackTop > 0) this._setContextModes(node, tid);
		}
		/** @internal */
		onItemPop(node, isTop) {
			var _a, _b;
			if (this.options.sourceCodeLocationInfo) this._setEndLocation(node, this.currentToken);
			(_b = (_a = this.treeAdapter).onItemPop) === null || _b === void 0 || _b.call(_a, node, this.openElements.current);
			if (isTop) {
				let current;
				let currentTagId;
				if (this.openElements.stackTop === 0 && this.fragmentContext) {
					current = this.fragmentContext;
					currentTagId = this.fragmentContextID;
				} else ({current, currentTagId} = this.openElements);
				this._setContextModes(current, currentTagId);
			}
		}
		_setContextModes(current, tid) {
			const isHTML = current === this.document || current && this.treeAdapter.getNamespaceURI(current) === NS.HTML;
			this.currentNotInHTML = !isHTML;
			this.tokenizer.inForeignNode = !isHTML && current !== void 0 && tid !== void 0 && !this._isIntegrationPoint(tid, current);
		}
		/** @protected */
		_switchToTextParsing(currentToken, nextTokenizerState) {
			this._insertElement(currentToken, NS.HTML);
			this.tokenizer.state = nextTokenizerState;
			this.originalInsertionMode = this.insertionMode;
			this.insertionMode = InsertionMode.TEXT;
		}
		switchToPlaintextParsing() {
			this.insertionMode = InsertionMode.TEXT;
			this.originalInsertionMode = InsertionMode.IN_BODY;
			this.tokenizer.state = TokenizerMode.PLAINTEXT;
		}
		/** @protected */
		_getAdjustedCurrentElement() {
			return this.openElements.stackTop === 0 && this.fragmentContext ? this.fragmentContext : this.openElements.current;
		}
		/** @protected */
		_findFormInFragmentContext() {
			let node = this.fragmentContext;
			while (node) {
				if (this.treeAdapter.getTagName(node) === TAG_NAMES.FORM) {
					this.formElement = node;
					break;
				}
				node = this.treeAdapter.getParentNode(node);
			}
		}
		_initTokenizerForFragmentParsing() {
			if (!this.fragmentContext || this.treeAdapter.getNamespaceURI(this.fragmentContext) !== NS.HTML) return;
			switch (this.fragmentContextID) {
				case TAG_ID.TITLE:
				case TAG_ID.TEXTAREA:
					this.tokenizer.state = TokenizerMode.RCDATA;
					break;
				case TAG_ID.STYLE:
				case TAG_ID.XMP:
				case TAG_ID.IFRAME:
				case TAG_ID.NOEMBED:
				case TAG_ID.NOFRAMES:
				case TAG_ID.NOSCRIPT:
					this.tokenizer.state = TokenizerMode.RAWTEXT;
					break;
				case TAG_ID.SCRIPT:
					this.tokenizer.state = TokenizerMode.SCRIPT_DATA;
					break;
				case TAG_ID.PLAINTEXT:
					this.tokenizer.state = TokenizerMode.PLAINTEXT;
					break;
				default:
			}
		}
		/** @protected */
		_setDocumentType(token) {
			const name = token.name || "";
			const publicId = token.publicId || "";
			const systemId = token.systemId || "";
			this.treeAdapter.setDocumentType(this.document, name, publicId, systemId);
			if (token.location) {
				const docTypeNode = this.treeAdapter.getChildNodes(this.document).find((node) => this.treeAdapter.isDocumentTypeNode(node));
				if (docTypeNode) this.treeAdapter.setNodeSourceCodeLocation(docTypeNode, token.location);
			}
		}
		/** @protected */
		_attachElementToTree(element, location) {
			if (this.options.sourceCodeLocationInfo) {
				const loc = location && {
					...location,
					startTag: location
				};
				this.treeAdapter.setNodeSourceCodeLocation(element, loc);
			}
			if (this._shouldFosterParentOnInsertion()) this._fosterParentElement(element);
			else {
				const parent = this.openElements.currentTmplContentOrNode;
				this.treeAdapter.appendChild(parent !== null && parent !== void 0 ? parent : this.document, element);
			}
		}
		/**
		* For self-closing tags. Add an element to the tree, but skip adding it
		* to the stack.
		*/
		/** @protected */
		_appendElement(token, namespaceURI) {
			const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);
			this._attachElementToTree(element, token.location);
		}
		/** @protected */
		_insertElement(token, namespaceURI) {
			const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);
			this._attachElementToTree(element, token.location);
			this.openElements.push(element, token.tagID);
		}
		/** @protected */
		_insertFakeElement(tagName, tagID) {
			const element = this.treeAdapter.createElement(tagName, NS.HTML, []);
			this._attachElementToTree(element, null);
			this.openElements.push(element, tagID);
		}
		/** @protected */
		_insertTemplate(token) {
			const tmpl = this.treeAdapter.createElement(token.tagName, NS.HTML, token.attrs);
			const content = this.treeAdapter.createDocumentFragment();
			this.treeAdapter.setTemplateContent(tmpl, content);
			this._attachElementToTree(tmpl, token.location);
			this.openElements.push(tmpl, token.tagID);
			if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(content, null);
		}
		/** @protected */
		_insertFakeRootElement() {
			const element = this.treeAdapter.createElement(TAG_NAMES.HTML, NS.HTML, []);
			if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(element, null);
			this.treeAdapter.appendChild(this.openElements.current, element);
			this.openElements.push(element, TAG_ID.HTML);
		}
		/** @protected */
		_appendCommentNode(token, parent) {
			const commentNode = this.treeAdapter.createCommentNode(token.data);
			this.treeAdapter.appendChild(parent, commentNode);
			if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(commentNode, token.location);
		}
		/** @protected */
		_insertCharacters(token) {
			let parent;
			let beforeElement;
			if (this._shouldFosterParentOnInsertion()) {
				({parent, beforeElement} = this._findFosterParentingLocation());
				if (beforeElement) this.treeAdapter.insertTextBefore(parent, token.chars, beforeElement);
				else this.treeAdapter.insertText(parent, token.chars);
			} else {
				parent = this.openElements.currentTmplContentOrNode;
				this.treeAdapter.insertText(parent, token.chars);
			}
			if (!token.location) return;
			const siblings = this.treeAdapter.getChildNodes(parent);
			const textNode = siblings[(beforeElement ? siblings.lastIndexOf(beforeElement) : siblings.length) - 1];
			if (this.treeAdapter.getNodeSourceCodeLocation(textNode)) {
				const { endLine, endCol, endOffset } = token.location;
				this.treeAdapter.updateNodeSourceCodeLocation(textNode, {
					endLine,
					endCol,
					endOffset
				});
			} else if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(textNode, token.location);
		}
		/** @protected */
		_adoptNodes(donor, recipient) {
			for (let child = this.treeAdapter.getFirstChild(donor); child; child = this.treeAdapter.getFirstChild(donor)) {
				this.treeAdapter.detachNode(child);
				this.treeAdapter.appendChild(recipient, child);
			}
		}
		/** @protected */
		_setEndLocation(element, closingToken) {
			if (this.treeAdapter.getNodeSourceCodeLocation(element) && closingToken.location) {
				const ctLoc = closingToken.location;
				const tn = this.treeAdapter.getTagName(element);
				const endLoc = closingToken.type === TokenType.END_TAG && tn === closingToken.tagName ? {
					endTag: { ...ctLoc },
					endLine: ctLoc.endLine,
					endCol: ctLoc.endCol,
					endOffset: ctLoc.endOffset
				} : {
					endLine: ctLoc.startLine,
					endCol: ctLoc.startCol,
					endOffset: ctLoc.startOffset
				};
				this.treeAdapter.updateNodeSourceCodeLocation(element, endLoc);
			}
		}
		shouldProcessStartTagTokenInForeignContent(token) {
			if (!this.currentNotInHTML) return false;
			let current;
			let currentTagId;
			if (this.openElements.stackTop === 0 && this.fragmentContext) {
				current = this.fragmentContext;
				currentTagId = this.fragmentContextID;
			} else ({current, currentTagId} = this.openElements);
			if (token.tagID === TAG_ID.SVG && this.treeAdapter.getTagName(current) === TAG_NAMES.ANNOTATION_XML && this.treeAdapter.getNamespaceURI(current) === NS.MATHML) return false;
			return this.tokenizer.inForeignNode || (token.tagID === TAG_ID.MGLYPH || token.tagID === TAG_ID.MALIGNMARK) && currentTagId !== void 0 && !this._isIntegrationPoint(currentTagId, current, NS.HTML);
		}
		/** @protected */
		_processToken(token) {
			switch (token.type) {
				case TokenType.CHARACTER:
					this.onCharacter(token);
					break;
				case TokenType.NULL_CHARACTER:
					this.onNullCharacter(token);
					break;
				case TokenType.COMMENT:
					this.onComment(token);
					break;
				case TokenType.DOCTYPE:
					this.onDoctype(token);
					break;
				case TokenType.START_TAG:
					this._processStartTag(token);
					break;
				case TokenType.END_TAG:
					this.onEndTag(token);
					break;
				case TokenType.EOF:
					this.onEof(token);
					break;
				case TokenType.WHITESPACE_CHARACTER:
					this.onWhitespaceCharacter(token);
					break;
			}
		}
		/** @protected */
		_isIntegrationPoint(tid, element, foreignNS) {
			const ns = this.treeAdapter.getNamespaceURI(element);
			const attrs = this.treeAdapter.getAttrList(element);
			return isIntegrationPoint(tid, ns, attrs, foreignNS);
		}
		/** @protected */
		_reconstructActiveFormattingElements() {
			const listLength = this.activeFormattingElements.entries.length;
			if (listLength) {
				const endIndex = this.activeFormattingElements.entries.findIndex((entry) => entry.type === EntryType.Marker || this.openElements.contains(entry.element));
				const unopenIdx = endIndex === -1 ? listLength - 1 : endIndex - 1;
				for (let i = unopenIdx; i >= 0; i--) {
					const entry = this.activeFormattingElements.entries[i];
					this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));
					entry.element = this.openElements.current;
				}
			}
		}
		/** @protected */
		_closeTableCell() {
			this.openElements.generateImpliedEndTags();
			this.openElements.popUntilTableCellPopped();
			this.activeFormattingElements.clearToLastMarker();
			this.insertionMode = InsertionMode.IN_ROW;
		}
		/** @protected */
		_closePElement() {
			this.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.P);
			this.openElements.popUntilTagNamePopped(TAG_ID.P);
		}
		/** @protected */
		_resetInsertionMode() {
			for (let i = this.openElements.stackTop; i >= 0; i--) switch (i === 0 && this.fragmentContext ? this.fragmentContextID : this.openElements.tagIDs[i]) {
				case TAG_ID.TR:
					this.insertionMode = InsertionMode.IN_ROW;
					return;
				case TAG_ID.TBODY:
				case TAG_ID.THEAD:
				case TAG_ID.TFOOT:
					this.insertionMode = InsertionMode.IN_TABLE_BODY;
					return;
				case TAG_ID.CAPTION:
					this.insertionMode = InsertionMode.IN_CAPTION;
					return;
				case TAG_ID.COLGROUP:
					this.insertionMode = InsertionMode.IN_COLUMN_GROUP;
					return;
				case TAG_ID.TABLE:
					this.insertionMode = InsertionMode.IN_TABLE;
					return;
				case TAG_ID.BODY:
					this.insertionMode = InsertionMode.IN_BODY;
					return;
				case TAG_ID.FRAMESET:
					this.insertionMode = InsertionMode.IN_FRAMESET;
					return;
				case TAG_ID.SELECT:
					this._resetInsertionModeForSelect(i);
					return;
				case TAG_ID.TEMPLATE:
					this.insertionMode = this.tmplInsertionModeStack[0];
					return;
				case TAG_ID.HTML:
					this.insertionMode = this.headElement ? InsertionMode.AFTER_HEAD : InsertionMode.BEFORE_HEAD;
					return;
				case TAG_ID.TD:
				case TAG_ID.TH:
					if (i > 0) {
						this.insertionMode = InsertionMode.IN_CELL;
						return;
					}
					break;
				case TAG_ID.HEAD:
					if (i > 0) {
						this.insertionMode = InsertionMode.IN_HEAD;
						return;
					}
					break;
			}
			this.insertionMode = InsertionMode.IN_BODY;
		}
		/** @protected */
		_resetInsertionModeForSelect(selectIdx) {
			if (selectIdx > 0) for (let i = selectIdx - 1; i > 0; i--) {
				const tn = this.openElements.tagIDs[i];
				if (tn === TAG_ID.TEMPLATE) break;
				else if (tn === TAG_ID.TABLE) {
					this.insertionMode = InsertionMode.IN_SELECT_IN_TABLE;
					return;
				}
			}
			this.insertionMode = InsertionMode.IN_SELECT;
		}
		/** @protected */
		_isElementCausesFosterParenting(tn) {
			return TABLE_STRUCTURE_TAGS.has(tn);
		}
		/** @protected */
		_shouldFosterParentOnInsertion() {
			return this.fosterParentingEnabled && this.openElements.currentTagId !== void 0 && this._isElementCausesFosterParenting(this.openElements.currentTagId);
		}
		/** @protected */
		_findFosterParentingLocation() {
			for (let i = this.openElements.stackTop; i >= 0; i--) {
				const openElement = this.openElements.items[i];
				switch (this.openElements.tagIDs[i]) {
					case TAG_ID.TEMPLATE:
						if (this.treeAdapter.getNamespaceURI(openElement) === NS.HTML) return {
							parent: this.treeAdapter.getTemplateContent(openElement),
							beforeElement: null
						};
						break;
					case TAG_ID.TABLE: {
						const parent = this.treeAdapter.getParentNode(openElement);
						if (parent) return {
							parent,
							beforeElement: openElement
						};
						return {
							parent: this.openElements.items[i - 1],
							beforeElement: null
						};
					}
					default:
				}
			}
			return {
				parent: this.openElements.items[0],
				beforeElement: null
			};
		}
		/** @protected */
		_fosterParentElement(element) {
			const location = this._findFosterParentingLocation();
			if (location.beforeElement) this.treeAdapter.insertBefore(location.parent, element, location.beforeElement);
			else this.treeAdapter.appendChild(location.parent, element);
		}
		/** @protected */
		_isSpecialElement(element, id) {
			return SPECIAL_ELEMENTS[this.treeAdapter.getNamespaceURI(element)].has(id);
		}
		/** @internal */
		onCharacter(token) {
			this.skipNextNewLine = false;
			if (this.tokenizer.inForeignNode) {
				characterInForeignContent(this, token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					tokenBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					tokenBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					tokenInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					tokenInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					tokenAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_TEMPLATE:
					characterInBody(this, token);
					break;
				case InsertionMode.TEXT:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
					this._insertCharacters(token);
					break;
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
					characterInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					characterInTableText(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					tokenInColumnGroup(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					tokenAfterBody(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY:
					tokenAfterAfterBody(this, token);
					break;
				default:
			}
		}
		/** @internal */
		onNullCharacter(token) {
			this.skipNextNewLine = false;
			if (this.tokenizer.inForeignNode) {
				nullCharacterInForeignContent(this, token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					tokenBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					tokenBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					tokenInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					tokenInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					tokenAfterHead(this, token);
					break;
				case InsertionMode.TEXT:
					this._insertCharacters(token);
					break;
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
					characterInTable(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					tokenInColumnGroup(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					tokenAfterBody(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY:
					tokenAfterAfterBody(this, token);
					break;
				default:
			}
		}
		/** @internal */
		onComment(token) {
			this.skipNextNewLine = false;
			if (this.currentNotInHTML) {
				appendComment(this, token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
				case InsertionMode.BEFORE_HTML:
				case InsertionMode.BEFORE_HEAD:
				case InsertionMode.IN_HEAD:
				case InsertionMode.IN_HEAD_NO_SCRIPT:
				case InsertionMode.AFTER_HEAD:
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_COLUMN_GROUP:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
				case InsertionMode.IN_TEMPLATE:
				case InsertionMode.IN_FRAMESET:
				case InsertionMode.AFTER_FRAMESET:
					appendComment(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					appendCommentToRootHtmlElement(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY:
				case InsertionMode.AFTER_AFTER_FRAMESET:
					appendCommentToDocument(this, token);
					break;
				default:
			}
		}
		/** @internal */
		onDoctype(token) {
			this.skipNextNewLine = false;
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					doctypeInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
				case InsertionMode.IN_HEAD:
				case InsertionMode.IN_HEAD_NO_SCRIPT:
				case InsertionMode.AFTER_HEAD:
					this._err(token, ERR.misplacedDoctype);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				default:
			}
		}
		/** @internal */
		onStartTag(token) {
			this.skipNextNewLine = false;
			this.currentToken = token;
			this._processStartTag(token);
			if (token.selfClosing && !token.ackSelfClosing) this._err(token, ERR.nonVoidHtmlElementStartTagWithTrailingSolidus);
		}
		/**
		* Processes a given start tag.
		*
		* `onStartTag` checks if a self-closing tag was recognized. When a token
		* is moved inbetween multiple insertion modes, this check for self-closing
		* could lead to false positives. To avoid this, `_processStartTag` is used
		* for nested calls.
		*
		* @param token The token to process.
		* @protected
		*/
		_processStartTag(token) {
			if (this.shouldProcessStartTagTokenInForeignContent(token)) startTagInForeignContent(this, token);
			else this._startTagOutsideForeignContent(token);
		}
		/** @protected */
		_startTagOutsideForeignContent(token) {
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					startTagBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					startTagBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					startTagInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					startTagInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					startTagAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
					startTagInBody(this, token);
					break;
				case InsertionMode.IN_TABLE:
					startTagInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.IN_CAPTION:
					startTagInCaption(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					startTagInColumnGroup(this, token);
					break;
				case InsertionMode.IN_TABLE_BODY:
					startTagInTableBody(this, token);
					break;
				case InsertionMode.IN_ROW:
					startTagInRow(this, token);
					break;
				case InsertionMode.IN_CELL:
					startTagInCell(this, token);
					break;
				case InsertionMode.IN_SELECT:
					startTagInSelect(this, token);
					break;
				case InsertionMode.IN_SELECT_IN_TABLE:
					startTagInSelectInTable(this, token);
					break;
				case InsertionMode.IN_TEMPLATE:
					startTagInTemplate(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					startTagAfterBody(this, token);
					break;
				case InsertionMode.IN_FRAMESET:
					startTagInFrameset(this, token);
					break;
				case InsertionMode.AFTER_FRAMESET:
					startTagAfterFrameset(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY:
					startTagAfterAfterBody(this, token);
					break;
				case InsertionMode.AFTER_AFTER_FRAMESET:
					startTagAfterAfterFrameset(this, token);
					break;
				default:
			}
		}
		/** @internal */
		onEndTag(token) {
			this.skipNextNewLine = false;
			this.currentToken = token;
			if (this.currentNotInHTML) endTagInForeignContent(this, token);
			else this._endTagOutsideForeignContent(token);
		}
		/** @protected */
		_endTagOutsideForeignContent(token) {
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					endTagBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					endTagBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					endTagInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					endTagInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					endTagAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
					endTagInBody(this, token);
					break;
				case InsertionMode.TEXT:
					endTagInText(this, token);
					break;
				case InsertionMode.IN_TABLE:
					endTagInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.IN_CAPTION:
					endTagInCaption(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					endTagInColumnGroup(this, token);
					break;
				case InsertionMode.IN_TABLE_BODY:
					endTagInTableBody(this, token);
					break;
				case InsertionMode.IN_ROW:
					endTagInRow(this, token);
					break;
				case InsertionMode.IN_CELL:
					endTagInCell(this, token);
					break;
				case InsertionMode.IN_SELECT:
					endTagInSelect(this, token);
					break;
				case InsertionMode.IN_SELECT_IN_TABLE:
					endTagInSelectInTable(this, token);
					break;
				case InsertionMode.IN_TEMPLATE:
					endTagInTemplate(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					endTagAfterBody(this, token);
					break;
				case InsertionMode.IN_FRAMESET:
					endTagInFrameset(this, token);
					break;
				case InsertionMode.AFTER_FRAMESET:
					endTagAfterFrameset(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY:
					tokenAfterAfterBody(this, token);
					break;
				default:
			}
		}
		/** @internal */
		onEof(token) {
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					tokenBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					tokenBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					tokenInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					tokenInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					tokenAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_COLUMN_GROUP:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
					eofInBody(this, token);
					break;
				case InsertionMode.TEXT:
					eofInText(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.IN_TEMPLATE:
					eofInTemplate(this, token);
					break;
				case InsertionMode.AFTER_BODY:
				case InsertionMode.IN_FRAMESET:
				case InsertionMode.AFTER_FRAMESET:
				case InsertionMode.AFTER_AFTER_BODY:
				case InsertionMode.AFTER_AFTER_FRAMESET:
					stopParsing(this, token);
					break;
				default:
			}
		}
		/** @internal */
		onWhitespaceCharacter(token) {
			if (this.skipNextNewLine) {
				this.skipNextNewLine = false;
				if (token.chars.charCodeAt(0) === CODE_POINTS.LINE_FEED) {
					if (token.chars.length === 1) return;
					token.chars = token.chars.substr(1);
				}
			}
			if (this.tokenizer.inForeignNode) {
				this._insertCharacters(token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.IN_HEAD:
				case InsertionMode.IN_HEAD_NO_SCRIPT:
				case InsertionMode.AFTER_HEAD:
				case InsertionMode.TEXT:
				case InsertionMode.IN_COLUMN_GROUP:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
				case InsertionMode.IN_FRAMESET:
				case InsertionMode.AFTER_FRAMESET:
					this._insertCharacters(token);
					break;
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_TEMPLATE:
				case InsertionMode.AFTER_BODY:
				case InsertionMode.AFTER_AFTER_BODY:
				case InsertionMode.AFTER_AFTER_FRAMESET:
					whitespaceCharacterInBody(this, token);
					break;
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
					characterInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					whitespaceCharacterInTableText(this, token);
					break;
				default:
			}
		}
	};
	function aaObtainFormattingElementEntry(p, token) {
		let formattingElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(token.tagName);
		if (formattingElementEntry) {
			if (!p.openElements.contains(formattingElementEntry.element)) {
				p.activeFormattingElements.removeEntry(formattingElementEntry);
				formattingElementEntry = null;
			} else if (!p.openElements.hasInScope(token.tagID)) formattingElementEntry = null;
		} else genericEndTagInBody(p, token);
		return formattingElementEntry;
	}
	function aaObtainFurthestBlock(p, formattingElementEntry) {
		let furthestBlock = null;
		let idx = p.openElements.stackTop;
		for (; idx >= 0; idx--) {
			const element = p.openElements.items[idx];
			if (element === formattingElementEntry.element) break;
			if (p._isSpecialElement(element, p.openElements.tagIDs[idx])) furthestBlock = element;
		}
		if (!furthestBlock) {
			p.openElements.shortenToLength(Math.max(idx, 0));
			p.activeFormattingElements.removeEntry(formattingElementEntry);
		}
		return furthestBlock;
	}
	function aaInnerLoop(p, furthestBlock, formattingElement) {
		let lastElement = furthestBlock;
		let nextElement = p.openElements.getCommonAncestor(furthestBlock);
		for (let i = 0, element = nextElement; element !== formattingElement; i++, element = nextElement) {
			nextElement = p.openElements.getCommonAncestor(element);
			const elementEntry = p.activeFormattingElements.getElementEntry(element);
			const counterOverflow = elementEntry && i >= AA_INNER_LOOP_ITER;
			if (!elementEntry || counterOverflow) {
				if (counterOverflow) p.activeFormattingElements.removeEntry(elementEntry);
				p.openElements.remove(element);
			} else {
				element = aaRecreateElementFromEntry(p, elementEntry);
				if (lastElement === furthestBlock) p.activeFormattingElements.bookmark = elementEntry;
				p.treeAdapter.detachNode(lastElement);
				p.treeAdapter.appendChild(element, lastElement);
				lastElement = element;
			}
		}
		return lastElement;
	}
	function aaRecreateElementFromEntry(p, elementEntry) {
		const ns = p.treeAdapter.getNamespaceURI(elementEntry.element);
		const newElement = p.treeAdapter.createElement(elementEntry.token.tagName, ns, elementEntry.token.attrs);
		p.openElements.replace(elementEntry.element, newElement);
		elementEntry.element = newElement;
		return newElement;
	}
	function aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement) {
		const tid = getTagID(p.treeAdapter.getTagName(commonAncestor));
		if (p._isElementCausesFosterParenting(tid)) p._fosterParentElement(lastElement);
		else {
			const ns = p.treeAdapter.getNamespaceURI(commonAncestor);
			if (tid === TAG_ID.TEMPLATE && ns === NS.HTML) commonAncestor = p.treeAdapter.getTemplateContent(commonAncestor);
			p.treeAdapter.appendChild(commonAncestor, lastElement);
		}
	}
	function aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry) {
		const ns = p.treeAdapter.getNamespaceURI(formattingElementEntry.element);
		const { token } = formattingElementEntry;
		const newElement = p.treeAdapter.createElement(token.tagName, ns, token.attrs);
		p._adoptNodes(furthestBlock, newElement);
		p.treeAdapter.appendChild(furthestBlock, newElement);
		p.activeFormattingElements.insertElementAfterBookmark(newElement, token);
		p.activeFormattingElements.removeEntry(formattingElementEntry);
		p.openElements.remove(formattingElementEntry.element);
		p.openElements.insertAfter(furthestBlock, newElement, token.tagID);
	}
	function callAdoptionAgency(p, token) {
		for (let i = 0; i < AA_OUTER_LOOP_ITER; i++) {
			const formattingElementEntry = aaObtainFormattingElementEntry(p, token);
			if (!formattingElementEntry) break;
			const furthestBlock = aaObtainFurthestBlock(p, formattingElementEntry);
			if (!furthestBlock) break;
			p.activeFormattingElements.bookmark = formattingElementEntry;
			const lastElement = aaInnerLoop(p, furthestBlock, formattingElementEntry.element);
			const commonAncestor = p.openElements.getCommonAncestor(formattingElementEntry.element);
			p.treeAdapter.detachNode(lastElement);
			if (commonAncestor) aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement);
			aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry);
		}
	}
	function appendComment(p, token) {
		p._appendCommentNode(token, p.openElements.currentTmplContentOrNode);
	}
	function appendCommentToRootHtmlElement(p, token) {
		p._appendCommentNode(token, p.openElements.items[0]);
	}
	function appendCommentToDocument(p, token) {
		p._appendCommentNode(token, p.document);
	}
	function stopParsing(p, token) {
		p.stopped = true;
		if (token.location) {
			const target = p.fragmentContext ? 0 : 2;
			for (let i = p.openElements.stackTop; i >= target; i--) p._setEndLocation(p.openElements.items[i], token);
			if (!p.fragmentContext && p.openElements.stackTop >= 0) {
				const htmlElement = p.openElements.items[0];
				const htmlLocation = p.treeAdapter.getNodeSourceCodeLocation(htmlElement);
				if (htmlLocation && !htmlLocation.endTag) {
					p._setEndLocation(htmlElement, token);
					if (p.openElements.stackTop >= 1) {
						const bodyElement = p.openElements.items[1];
						const bodyLocation = p.treeAdapter.getNodeSourceCodeLocation(bodyElement);
						if (bodyLocation && !bodyLocation.endTag) p._setEndLocation(bodyElement, token);
					}
				}
			}
		}
	}
	function doctypeInInitialMode(p, token) {
		p._setDocumentType(token);
		const mode = token.forceQuirks ? DOCUMENT_MODE.QUIRKS : getDocumentMode(token);
		if (!isConforming(token)) p._err(token, ERR.nonConformingDoctype);
		p.treeAdapter.setDocumentMode(p.document, mode);
		p.insertionMode = InsertionMode.BEFORE_HTML;
	}
	function tokenInInitialMode(p, token) {
		p._err(token, ERR.missingDoctype, true);
		p.treeAdapter.setDocumentMode(p.document, DOCUMENT_MODE.QUIRKS);
		p.insertionMode = InsertionMode.BEFORE_HTML;
		p._processToken(token);
	}
	function startTagBeforeHtml(p, token) {
		if (token.tagID === TAG_ID.HTML) {
			p._insertElement(token, NS.HTML);
			p.insertionMode = InsertionMode.BEFORE_HEAD;
		} else tokenBeforeHtml(p, token);
	}
	function endTagBeforeHtml(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.HTML || tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.BR) tokenBeforeHtml(p, token);
	}
	function tokenBeforeHtml(p, token) {
		p._insertFakeRootElement();
		p.insertionMode = InsertionMode.BEFORE_HEAD;
		p._processToken(token);
	}
	function startTagBeforeHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.HEAD:
				p._insertElement(token, NS.HTML);
				p.headElement = p.openElements.current;
				p.insertionMode = InsertionMode.IN_HEAD;
				break;
			default: tokenBeforeHead(p, token);
		}
	}
	function endTagBeforeHead(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.HTML || tn === TAG_ID.BR) tokenBeforeHead(p, token);
		else p._err(token, ERR.endTagWithoutMatchingOpenElement);
	}
	function tokenBeforeHead(p, token) {
		p._insertFakeElement(TAG_NAMES.HEAD, TAG_ID.HEAD);
		p.headElement = p.openElements.current;
		p.insertionMode = InsertionMode.IN_HEAD;
		p._processToken(token);
	}
	function startTagInHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.BASE:
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.LINK:
			case TAG_ID.META:
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.TITLE:
				p._switchToTextParsing(token, TokenizerMode.RCDATA);
				break;
			case TAG_ID.NOSCRIPT:
				if (p.options.scriptingEnabled) p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
				else {
					p._insertElement(token, NS.HTML);
					p.insertionMode = InsertionMode.IN_HEAD_NO_SCRIPT;
				}
				break;
			case TAG_ID.NOFRAMES:
			case TAG_ID.STYLE:
				p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
				break;
			case TAG_ID.SCRIPT:
				p._switchToTextParsing(token, TokenizerMode.SCRIPT_DATA);
				break;
			case TAG_ID.TEMPLATE:
				p._insertTemplate(token);
				p.activeFormattingElements.insertMarker();
				p.framesetOk = false;
				p.insertionMode = InsertionMode.IN_TEMPLATE;
				p.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
				break;
			case TAG_ID.HEAD:
				p._err(token, ERR.misplacedStartTagForHeadElement);
				break;
			default: tokenInHead(p, token);
		}
	}
	function endTagInHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HEAD:
				p.openElements.pop();
				p.insertionMode = InsertionMode.AFTER_HEAD;
				break;
			case TAG_ID.BODY:
			case TAG_ID.BR:
			case TAG_ID.HTML:
				tokenInHead(p, token);
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			default: p._err(token, ERR.endTagWithoutMatchingOpenElement);
		}
	}
	function templateEndTagInHead(p, token) {
		if (p.openElements.tmplCount > 0) {
			p.openElements.generateImpliedEndTagsThoroughly();
			if (p.openElements.currentTagId !== TAG_ID.TEMPLATE) p._err(token, ERR.closingOfElementWithOpenChildElements);
			p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
			p.activeFormattingElements.clearToLastMarker();
			p.tmplInsertionModeStack.shift();
			p._resetInsertionMode();
		} else p._err(token, ERR.endTagWithoutMatchingOpenElement);
	}
	function tokenInHead(p, token) {
		p.openElements.pop();
		p.insertionMode = InsertionMode.AFTER_HEAD;
		p._processToken(token);
	}
	function startTagInHeadNoScript(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.HEAD:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.NOFRAMES:
			case TAG_ID.STYLE:
				startTagInHead(p, token);
				break;
			case TAG_ID.NOSCRIPT:
				p._err(token, ERR.nestedNoscriptInHead);
				break;
			default: tokenInHeadNoScript(p, token);
		}
	}
	function endTagInHeadNoScript(p, token) {
		switch (token.tagID) {
			case TAG_ID.NOSCRIPT:
				p.openElements.pop();
				p.insertionMode = InsertionMode.IN_HEAD;
				break;
			case TAG_ID.BR:
				tokenInHeadNoScript(p, token);
				break;
			default: p._err(token, ERR.endTagWithoutMatchingOpenElement);
		}
	}
	function tokenInHeadNoScript(p, token) {
		const errCode = token.type === TokenType.EOF ? ERR.openElementsLeftAfterEof : ERR.disallowedContentInNoscriptInHead;
		p._err(token, errCode);
		p.openElements.pop();
		p.insertionMode = InsertionMode.IN_HEAD;
		p._processToken(token);
	}
	function startTagAfterHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.BODY:
				p._insertElement(token, NS.HTML);
				p.framesetOk = false;
				p.insertionMode = InsertionMode.IN_BODY;
				break;
			case TAG_ID.FRAMESET:
				p._insertElement(token, NS.HTML);
				p.insertionMode = InsertionMode.IN_FRAMESET;
				break;
			case TAG_ID.BASE:
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.NOFRAMES:
			case TAG_ID.SCRIPT:
			case TAG_ID.STYLE:
			case TAG_ID.TEMPLATE:
			case TAG_ID.TITLE:
				p._err(token, ERR.abandonedHeadElementChild);
				p.openElements.push(p.headElement, TAG_ID.HEAD);
				startTagInHead(p, token);
				p.openElements.remove(p.headElement);
				break;
			case TAG_ID.HEAD:
				p._err(token, ERR.misplacedStartTagForHeadElement);
				break;
			default: tokenAfterHead(p, token);
		}
	}
	function endTagAfterHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.BODY:
			case TAG_ID.HTML:
			case TAG_ID.BR:
				tokenAfterHead(p, token);
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			default: p._err(token, ERR.endTagWithoutMatchingOpenElement);
		}
	}
	function tokenAfterHead(p, token) {
		p._insertFakeElement(TAG_NAMES.BODY, TAG_ID.BODY);
		p.insertionMode = InsertionMode.IN_BODY;
		modeInBody(p, token);
	}
	function modeInBody(p, token) {
		switch (token.type) {
			case TokenType.CHARACTER:
				characterInBody(p, token);
				break;
			case TokenType.WHITESPACE_CHARACTER:
				whitespaceCharacterInBody(p, token);
				break;
			case TokenType.COMMENT:
				appendComment(p, token);
				break;
			case TokenType.START_TAG:
				startTagInBody(p, token);
				break;
			case TokenType.END_TAG:
				endTagInBody(p, token);
				break;
			case TokenType.EOF:
				eofInBody(p, token);
				break;
			default:
		}
	}
	function whitespaceCharacterInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertCharacters(token);
	}
	function characterInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertCharacters(token);
		p.framesetOk = false;
	}
	function htmlStartTagInBody(p, token) {
		if (p.openElements.tmplCount === 0) p.treeAdapter.adoptAttributes(p.openElements.items[0], token.attrs);
	}
	function bodyStartTagInBody(p, token) {
		const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
		if (bodyElement && p.openElements.tmplCount === 0) {
			p.framesetOk = false;
			p.treeAdapter.adoptAttributes(bodyElement, token.attrs);
		}
	}
	function framesetStartTagInBody(p, token) {
		const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
		if (p.framesetOk && bodyElement) {
			p.treeAdapter.detachNode(bodyElement);
			p.openElements.popAllUpToHtmlElement();
			p._insertElement(token, NS.HTML);
			p.insertionMode = InsertionMode.IN_FRAMESET;
		}
	}
	function addressStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
	}
	function numberedHeaderStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		if (p.openElements.currentTagId !== void 0 && NUMBERED_HEADERS.has(p.openElements.currentTagId)) p.openElements.pop();
		p._insertElement(token, NS.HTML);
	}
	function preStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
		p.skipNextNewLine = true;
		p.framesetOk = false;
	}
	function formStartTagInBody(p, token) {
		const inTemplate = p.openElements.tmplCount > 0;
		if (!p.formElement || inTemplate) {
			if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
			p._insertElement(token, NS.HTML);
			if (!inTemplate) p.formElement = p.openElements.current;
		}
	}
	function listItemStartTagInBody(p, token) {
		p.framesetOk = false;
		const tn = token.tagID;
		for (let i = p.openElements.stackTop; i >= 0; i--) {
			const elementId = p.openElements.tagIDs[i];
			if (tn === TAG_ID.LI && elementId === TAG_ID.LI || (tn === TAG_ID.DD || tn === TAG_ID.DT) && (elementId === TAG_ID.DD || elementId === TAG_ID.DT)) {
				p.openElements.generateImpliedEndTagsWithExclusion(elementId);
				p.openElements.popUntilTagNamePopped(elementId);
				break;
			}
			if (elementId !== TAG_ID.ADDRESS && elementId !== TAG_ID.DIV && elementId !== TAG_ID.P && p._isSpecialElement(p.openElements.items[i], elementId)) break;
		}
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
	}
	function plaintextStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
		p.tokenizer.state = TokenizerMode.PLAINTEXT;
	}
	function buttonStartTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.BUTTON)) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilTagNamePopped(TAG_ID.BUTTON);
		}
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.framesetOk = false;
	}
	function aStartTagInBody(p, token) {
		const activeElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(TAG_NAMES.A);
		if (activeElementEntry) {
			callAdoptionAgency(p, token);
			p.openElements.remove(activeElementEntry.element);
			p.activeFormattingElements.removeEntry(activeElementEntry);
		}
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.pushElement(p.openElements.current, token);
	}
	function bStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.pushElement(p.openElements.current, token);
	}
	function nobrStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		if (p.openElements.hasInScope(TAG_ID.NOBR)) {
			callAdoptionAgency(p, token);
			p._reconstructActiveFormattingElements();
		}
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.pushElement(p.openElements.current, token);
	}
	function appletStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.insertMarker();
		p.framesetOk = false;
	}
	function tableStartTagInBody(p, token) {
		if (p.treeAdapter.getDocumentMode(p.document) !== DOCUMENT_MODE.QUIRKS && p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
		p.framesetOk = false;
		p.insertionMode = InsertionMode.IN_TABLE;
	}
	function areaStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._appendElement(token, NS.HTML);
		p.framesetOk = false;
		token.ackSelfClosing = true;
	}
	function isHiddenInput(token) {
		const inputType = getTokenAttr(token, ATTRS.TYPE);
		return inputType != null && inputType.toLowerCase() === HIDDEN_INPUT_TYPE;
	}
	function inputStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._appendElement(token, NS.HTML);
		if (!isHiddenInput(token)) p.framesetOk = false;
		token.ackSelfClosing = true;
	}
	function paramStartTagInBody(p, token) {
		p._appendElement(token, NS.HTML);
		token.ackSelfClosing = true;
	}
	function hrStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._appendElement(token, NS.HTML);
		p.framesetOk = false;
		token.ackSelfClosing = true;
	}
	function imageStartTagInBody(p, token) {
		token.tagName = TAG_NAMES.IMG;
		token.tagID = TAG_ID.IMG;
		areaStartTagInBody(p, token);
	}
	function textareaStartTagInBody(p, token) {
		p._insertElement(token, NS.HTML);
		p.skipNextNewLine = true;
		p.tokenizer.state = TokenizerMode.RCDATA;
		p.originalInsertionMode = p.insertionMode;
		p.framesetOk = false;
		p.insertionMode = InsertionMode.TEXT;
	}
	function xmpStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._reconstructActiveFormattingElements();
		p.framesetOk = false;
		p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
	}
	function iframeStartTagInBody(p, token) {
		p.framesetOk = false;
		p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
	}
	function rawTextStartTagInBody(p, token) {
		p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
	}
	function selectStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.framesetOk = false;
		p.insertionMode = p.insertionMode === InsertionMode.IN_TABLE || p.insertionMode === InsertionMode.IN_CAPTION || p.insertionMode === InsertionMode.IN_TABLE_BODY || p.insertionMode === InsertionMode.IN_ROW || p.insertionMode === InsertionMode.IN_CELL ? InsertionMode.IN_SELECT_IN_TABLE : InsertionMode.IN_SELECT;
	}
	function optgroupStartTagInBody(p, token) {
		if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
	}
	function rbStartTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.RUBY)) p.openElements.generateImpliedEndTags();
		p._insertElement(token, NS.HTML);
	}
	function rtStartTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.RUBY)) p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.RTC);
		p._insertElement(token, NS.HTML);
	}
	function mathStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		adjustTokenMathMLAttrs(token);
		adjustTokenXMLAttrs(token);
		if (token.selfClosing) p._appendElement(token, NS.MATHML);
		else p._insertElement(token, NS.MATHML);
		token.ackSelfClosing = true;
	}
	function svgStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		adjustTokenSVGAttrs(token);
		adjustTokenXMLAttrs(token);
		if (token.selfClosing) p._appendElement(token, NS.SVG);
		else p._insertElement(token, NS.SVG);
		token.ackSelfClosing = true;
	}
	function genericStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
	}
	function startTagInBody(p, token) {
		switch (token.tagID) {
			case TAG_ID.I:
			case TAG_ID.S:
			case TAG_ID.B:
			case TAG_ID.U:
			case TAG_ID.EM:
			case TAG_ID.TT:
			case TAG_ID.BIG:
			case TAG_ID.CODE:
			case TAG_ID.FONT:
			case TAG_ID.SMALL:
			case TAG_ID.STRIKE:
			case TAG_ID.STRONG:
				bStartTagInBody(p, token);
				break;
			case TAG_ID.A:
				aStartTagInBody(p, token);
				break;
			case TAG_ID.H1:
			case TAG_ID.H2:
			case TAG_ID.H3:
			case TAG_ID.H4:
			case TAG_ID.H5:
			case TAG_ID.H6:
				numberedHeaderStartTagInBody(p, token);
				break;
			case TAG_ID.P:
			case TAG_ID.DL:
			case TAG_ID.OL:
			case TAG_ID.UL:
			case TAG_ID.DIV:
			case TAG_ID.DIR:
			case TAG_ID.NAV:
			case TAG_ID.MAIN:
			case TAG_ID.MENU:
			case TAG_ID.ASIDE:
			case TAG_ID.CENTER:
			case TAG_ID.FIGURE:
			case TAG_ID.FOOTER:
			case TAG_ID.HEADER:
			case TAG_ID.HGROUP:
			case TAG_ID.DIALOG:
			case TAG_ID.DETAILS:
			case TAG_ID.ADDRESS:
			case TAG_ID.ARTICLE:
			case TAG_ID.SEARCH:
			case TAG_ID.SECTION:
			case TAG_ID.SUMMARY:
			case TAG_ID.FIELDSET:
			case TAG_ID.BLOCKQUOTE:
			case TAG_ID.FIGCAPTION:
				addressStartTagInBody(p, token);
				break;
			case TAG_ID.LI:
			case TAG_ID.DD:
			case TAG_ID.DT:
				listItemStartTagInBody(p, token);
				break;
			case TAG_ID.BR:
			case TAG_ID.IMG:
			case TAG_ID.WBR:
			case TAG_ID.AREA:
			case TAG_ID.EMBED:
			case TAG_ID.KEYGEN:
				areaStartTagInBody(p, token);
				break;
			case TAG_ID.HR:
				hrStartTagInBody(p, token);
				break;
			case TAG_ID.RB:
			case TAG_ID.RTC:
				rbStartTagInBody(p, token);
				break;
			case TAG_ID.RT:
			case TAG_ID.RP:
				rtStartTagInBody(p, token);
				break;
			case TAG_ID.PRE:
			case TAG_ID.LISTING:
				preStartTagInBody(p, token);
				break;
			case TAG_ID.XMP:
				xmpStartTagInBody(p, token);
				break;
			case TAG_ID.SVG:
				svgStartTagInBody(p, token);
				break;
			case TAG_ID.HTML:
				htmlStartTagInBody(p, token);
				break;
			case TAG_ID.BASE:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.STYLE:
			case TAG_ID.TITLE:
			case TAG_ID.SCRIPT:
			case TAG_ID.BGSOUND:
			case TAG_ID.BASEFONT:
			case TAG_ID.TEMPLATE:
				startTagInHead(p, token);
				break;
			case TAG_ID.BODY:
				bodyStartTagInBody(p, token);
				break;
			case TAG_ID.FORM:
				formStartTagInBody(p, token);
				break;
			case TAG_ID.NOBR:
				nobrStartTagInBody(p, token);
				break;
			case TAG_ID.MATH:
				mathStartTagInBody(p, token);
				break;
			case TAG_ID.TABLE:
				tableStartTagInBody(p, token);
				break;
			case TAG_ID.INPUT:
				inputStartTagInBody(p, token);
				break;
			case TAG_ID.PARAM:
			case TAG_ID.TRACK:
			case TAG_ID.SOURCE:
				paramStartTagInBody(p, token);
				break;
			case TAG_ID.IMAGE:
				imageStartTagInBody(p, token);
				break;
			case TAG_ID.BUTTON:
				buttonStartTagInBody(p, token);
				break;
			case TAG_ID.APPLET:
			case TAG_ID.OBJECT:
			case TAG_ID.MARQUEE:
				appletStartTagInBody(p, token);
				break;
			case TAG_ID.IFRAME:
				iframeStartTagInBody(p, token);
				break;
			case TAG_ID.SELECT:
				selectStartTagInBody(p, token);
				break;
			case TAG_ID.OPTION:
			case TAG_ID.OPTGROUP:
				optgroupStartTagInBody(p, token);
				break;
			case TAG_ID.NOEMBED:
			case TAG_ID.NOFRAMES:
				rawTextStartTagInBody(p, token);
				break;
			case TAG_ID.FRAMESET:
				framesetStartTagInBody(p, token);
				break;
			case TAG_ID.TEXTAREA:
				textareaStartTagInBody(p, token);
				break;
			case TAG_ID.NOSCRIPT:
				if (p.options.scriptingEnabled) rawTextStartTagInBody(p, token);
				else genericStartTagInBody(p, token);
				break;
			case TAG_ID.PLAINTEXT:
				plaintextStartTagInBody(p, token);
				break;
			case TAG_ID.COL:
			case TAG_ID.TH:
			case TAG_ID.TD:
			case TAG_ID.TR:
			case TAG_ID.HEAD:
			case TAG_ID.FRAME:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
			case TAG_ID.CAPTION:
			case TAG_ID.COLGROUP: break;
			default: genericStartTagInBody(p, token);
		}
	}
	function bodyEndTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.BODY)) {
			p.insertionMode = InsertionMode.AFTER_BODY;
			if (p.options.sourceCodeLocationInfo) {
				const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
				if (bodyElement) p._setEndLocation(bodyElement, token);
			}
		}
	}
	function htmlEndTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.BODY)) {
			p.insertionMode = InsertionMode.AFTER_BODY;
			endTagAfterBody(p, token);
		}
	}
	function addressEndTagInBody(p, token) {
		const tn = token.tagID;
		if (p.openElements.hasInScope(tn)) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilTagNamePopped(tn);
		}
	}
	function formEndTagInBody(p) {
		const inTemplate = p.openElements.tmplCount > 0;
		const { formElement } = p;
		if (!inTemplate) p.formElement = null;
		if ((formElement || inTemplate) && p.openElements.hasInScope(TAG_ID.FORM)) {
			p.openElements.generateImpliedEndTags();
			if (inTemplate) p.openElements.popUntilTagNamePopped(TAG_ID.FORM);
			else if (formElement) p.openElements.remove(formElement);
		}
	}
	function pEndTagInBody(p) {
		if (!p.openElements.hasInButtonScope(TAG_ID.P)) p._insertFakeElement(TAG_NAMES.P, TAG_ID.P);
		p._closePElement();
	}
	function liEndTagInBody(p) {
		if (p.openElements.hasInListItemScope(TAG_ID.LI)) {
			p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.LI);
			p.openElements.popUntilTagNamePopped(TAG_ID.LI);
		}
	}
	function ddEndTagInBody(p, token) {
		const tn = token.tagID;
		if (p.openElements.hasInScope(tn)) {
			p.openElements.generateImpliedEndTagsWithExclusion(tn);
			p.openElements.popUntilTagNamePopped(tn);
		}
	}
	function numberedHeaderEndTagInBody(p) {
		if (p.openElements.hasNumberedHeaderInScope()) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilNumberedHeaderPopped();
		}
	}
	function appletEndTagInBody(p, token) {
		const tn = token.tagID;
		if (p.openElements.hasInScope(tn)) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilTagNamePopped(tn);
			p.activeFormattingElements.clearToLastMarker();
		}
	}
	function brEndTagInBody(p) {
		p._reconstructActiveFormattingElements();
		p._insertFakeElement(TAG_NAMES.BR, TAG_ID.BR);
		p.openElements.pop();
		p.framesetOk = false;
	}
	function genericEndTagInBody(p, token) {
		const tn = token.tagName;
		const tid = token.tagID;
		for (let i = p.openElements.stackTop; i > 0; i--) {
			const element = p.openElements.items[i];
			const elementId = p.openElements.tagIDs[i];
			if (tid === elementId && (tid !== TAG_ID.UNKNOWN || p.treeAdapter.getTagName(element) === tn)) {
				p.openElements.generateImpliedEndTagsWithExclusion(tid);
				if (p.openElements.stackTop >= i) p.openElements.shortenToLength(i);
				break;
			}
			if (p._isSpecialElement(element, elementId)) break;
		}
	}
	function endTagInBody(p, token) {
		switch (token.tagID) {
			case TAG_ID.A:
			case TAG_ID.B:
			case TAG_ID.I:
			case TAG_ID.S:
			case TAG_ID.U:
			case TAG_ID.EM:
			case TAG_ID.TT:
			case TAG_ID.BIG:
			case TAG_ID.CODE:
			case TAG_ID.FONT:
			case TAG_ID.NOBR:
			case TAG_ID.SMALL:
			case TAG_ID.STRIKE:
			case TAG_ID.STRONG:
				callAdoptionAgency(p, token);
				break;
			case TAG_ID.P:
				pEndTagInBody(p);
				break;
			case TAG_ID.DL:
			case TAG_ID.UL:
			case TAG_ID.OL:
			case TAG_ID.DIR:
			case TAG_ID.DIV:
			case TAG_ID.NAV:
			case TAG_ID.PRE:
			case TAG_ID.MAIN:
			case TAG_ID.MENU:
			case TAG_ID.ASIDE:
			case TAG_ID.BUTTON:
			case TAG_ID.CENTER:
			case TAG_ID.FIGURE:
			case TAG_ID.FOOTER:
			case TAG_ID.HEADER:
			case TAG_ID.HGROUP:
			case TAG_ID.DIALOG:
			case TAG_ID.ADDRESS:
			case TAG_ID.ARTICLE:
			case TAG_ID.DETAILS:
			case TAG_ID.SEARCH:
			case TAG_ID.SECTION:
			case TAG_ID.SUMMARY:
			case TAG_ID.LISTING:
			case TAG_ID.FIELDSET:
			case TAG_ID.BLOCKQUOTE:
			case TAG_ID.FIGCAPTION:
				addressEndTagInBody(p, token);
				break;
			case TAG_ID.LI:
				liEndTagInBody(p);
				break;
			case TAG_ID.DD:
			case TAG_ID.DT:
				ddEndTagInBody(p, token);
				break;
			case TAG_ID.H1:
			case TAG_ID.H2:
			case TAG_ID.H3:
			case TAG_ID.H4:
			case TAG_ID.H5:
			case TAG_ID.H6:
				numberedHeaderEndTagInBody(p);
				break;
			case TAG_ID.BR:
				brEndTagInBody(p);
				break;
			case TAG_ID.BODY:
				bodyEndTagInBody(p, token);
				break;
			case TAG_ID.HTML:
				htmlEndTagInBody(p, token);
				break;
			case TAG_ID.FORM:
				formEndTagInBody(p);
				break;
			case TAG_ID.APPLET:
			case TAG_ID.OBJECT:
			case TAG_ID.MARQUEE:
				appletEndTagInBody(p, token);
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			default: genericEndTagInBody(p, token);
		}
	}
	function eofInBody(p, token) {
		if (p.tmplInsertionModeStack.length > 0) eofInTemplate(p, token);
		else stopParsing(p, token);
	}
	function endTagInText(p, token) {
		var _a;
		if (token.tagID === TAG_ID.SCRIPT) (_a = p.scriptHandler) === null || _a === void 0 || _a.call(p, p.openElements.current);
		p.openElements.pop();
		p.insertionMode = p.originalInsertionMode;
	}
	function eofInText(p, token) {
		p._err(token, ERR.eofInElementThatCanContainOnlyText);
		p.openElements.pop();
		p.insertionMode = p.originalInsertionMode;
		p.onEof(token);
	}
	function characterInTable(p, token) {
		if (p.openElements.currentTagId !== void 0 && TABLE_STRUCTURE_TAGS.has(p.openElements.currentTagId)) {
			p.pendingCharacterTokens.length = 0;
			p.hasNonWhitespacePendingCharacterToken = false;
			p.originalInsertionMode = p.insertionMode;
			p.insertionMode = InsertionMode.IN_TABLE_TEXT;
			switch (token.type) {
				case TokenType.CHARACTER:
					characterInTableText(p, token);
					break;
				case TokenType.WHITESPACE_CHARACTER:
					whitespaceCharacterInTableText(p, token);
					break;
			}
		} else tokenInTable(p, token);
	}
	function captionStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p.activeFormattingElements.insertMarker();
		p._insertElement(token, NS.HTML);
		p.insertionMode = InsertionMode.IN_CAPTION;
	}
	function colgroupStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertElement(token, NS.HTML);
		p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
	}
	function colStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertFakeElement(TAG_NAMES.COLGROUP, TAG_ID.COLGROUP);
		p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
		startTagInColumnGroup(p, token);
	}
	function tbodyStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertElement(token, NS.HTML);
		p.insertionMode = InsertionMode.IN_TABLE_BODY;
	}
	function tdStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertFakeElement(TAG_NAMES.TBODY, TAG_ID.TBODY);
		p.insertionMode = InsertionMode.IN_TABLE_BODY;
		startTagInTableBody(p, token);
	}
	function tableStartTagInTable(p, token) {
		if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
			p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
			p._resetInsertionMode();
			p._processStartTag(token);
		}
	}
	function inputStartTagInTable(p, token) {
		if (isHiddenInput(token)) p._appendElement(token, NS.HTML);
		else tokenInTable(p, token);
		token.ackSelfClosing = true;
	}
	function formStartTagInTable(p, token) {
		if (!p.formElement && p.openElements.tmplCount === 0) {
			p._insertElement(token, NS.HTML);
			p.formElement = p.openElements.current;
			p.openElements.pop();
		}
	}
	function startTagInTable(p, token) {
		switch (token.tagID) {
			case TAG_ID.TD:
			case TAG_ID.TH:
			case TAG_ID.TR:
				tdStartTagInTable(p, token);
				break;
			case TAG_ID.STYLE:
			case TAG_ID.SCRIPT:
			case TAG_ID.TEMPLATE:
				startTagInHead(p, token);
				break;
			case TAG_ID.COL:
				colStartTagInTable(p, token);
				break;
			case TAG_ID.FORM:
				formStartTagInTable(p, token);
				break;
			case TAG_ID.TABLE:
				tableStartTagInTable(p, token);
				break;
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				tbodyStartTagInTable(p, token);
				break;
			case TAG_ID.INPUT:
				inputStartTagInTable(p, token);
				break;
			case TAG_ID.CAPTION:
				captionStartTagInTable(p, token);
				break;
			case TAG_ID.COLGROUP:
				colgroupStartTagInTable(p, token);
				break;
			default: tokenInTable(p, token);
		}
	}
	function endTagInTable(p, token) {
		switch (token.tagID) {
			case TAG_ID.TABLE:
				if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
					p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
					p._resetInsertionMode();
				}
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TBODY:
			case TAG_ID.TD:
			case TAG_ID.TFOOT:
			case TAG_ID.TH:
			case TAG_ID.THEAD:
			case TAG_ID.TR: break;
			default: tokenInTable(p, token);
		}
	}
	function tokenInTable(p, token) {
		const savedFosterParentingState = p.fosterParentingEnabled;
		p.fosterParentingEnabled = true;
		modeInBody(p, token);
		p.fosterParentingEnabled = savedFosterParentingState;
	}
	function whitespaceCharacterInTableText(p, token) {
		p.pendingCharacterTokens.push(token);
	}
	function characterInTableText(p, token) {
		p.pendingCharacterTokens.push(token);
		p.hasNonWhitespacePendingCharacterToken = true;
	}
	function tokenInTableText(p, token) {
		let i = 0;
		if (p.hasNonWhitespacePendingCharacterToken) for (; i < p.pendingCharacterTokens.length; i++) tokenInTable(p, p.pendingCharacterTokens[i]);
		else for (; i < p.pendingCharacterTokens.length; i++) p._insertCharacters(p.pendingCharacterTokens[i]);
		p.insertionMode = p.originalInsertionMode;
		p._processToken(token);
	}
	const TABLE_VOID_ELEMENTS = new Set([
		TAG_ID.CAPTION,
		TAG_ID.COL,
		TAG_ID.COLGROUP,
		TAG_ID.TBODY,
		TAG_ID.TD,
		TAG_ID.TFOOT,
		TAG_ID.TH,
		TAG_ID.THEAD,
		TAG_ID.TR
	]);
	function startTagInCaption(p, token) {
		const tn = token.tagID;
		if (TABLE_VOID_ELEMENTS.has(tn)) {
			if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
				p.openElements.generateImpliedEndTags();
				p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
				p.activeFormattingElements.clearToLastMarker();
				p.insertionMode = InsertionMode.IN_TABLE;
				startTagInTable(p, token);
			}
		} else startTagInBody(p, token);
	}
	function endTagInCaption(p, token) {
		const tn = token.tagID;
		switch (tn) {
			case TAG_ID.CAPTION:
			case TAG_ID.TABLE:
				if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
					p.openElements.generateImpliedEndTags();
					p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
					p.activeFormattingElements.clearToLastMarker();
					p.insertionMode = InsertionMode.IN_TABLE;
					if (tn === TAG_ID.TABLE) endTagInTable(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TBODY:
			case TAG_ID.TD:
			case TAG_ID.TFOOT:
			case TAG_ID.TH:
			case TAG_ID.THEAD:
			case TAG_ID.TR: break;
			default: endTagInBody(p, token);
		}
	}
	function startTagInColumnGroup(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.COL:
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.TEMPLATE:
				startTagInHead(p, token);
				break;
			default: tokenInColumnGroup(p, token);
		}
	}
	function endTagInColumnGroup(p, token) {
		switch (token.tagID) {
			case TAG_ID.COLGROUP:
				if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
				}
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			case TAG_ID.COL: break;
			default: tokenInColumnGroup(p, token);
		}
	}
	function tokenInColumnGroup(p, token) {
		if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
			p.openElements.pop();
			p.insertionMode = InsertionMode.IN_TABLE;
			p._processToken(token);
		}
	}
	function startTagInTableBody(p, token) {
		switch (token.tagID) {
			case TAG_ID.TR:
				p.openElements.clearBackToTableBodyContext();
				p._insertElement(token, NS.HTML);
				p.insertionMode = InsertionMode.IN_ROW;
				break;
			case TAG_ID.TH:
			case TAG_ID.TD:
				p.openElements.clearBackToTableBodyContext();
				p._insertFakeElement(TAG_NAMES.TR, TAG_ID.TR);
				p.insertionMode = InsertionMode.IN_ROW;
				startTagInRow(p, token);
				break;
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				if (p.openElements.hasTableBodyContextInTableScope()) {
					p.openElements.clearBackToTableBodyContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
					startTagInTable(p, token);
				}
				break;
			default: startTagInTable(p, token);
		}
	}
	function endTagInTableBody(p, token) {
		const tn = token.tagID;
		switch (token.tagID) {
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				if (p.openElements.hasInTableScope(tn)) {
					p.openElements.clearBackToTableBodyContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
				}
				break;
			case TAG_ID.TABLE:
				if (p.openElements.hasTableBodyContextInTableScope()) {
					p.openElements.clearBackToTableBodyContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
					endTagInTable(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TD:
			case TAG_ID.TH:
			case TAG_ID.TR: break;
			default: endTagInTable(p, token);
		}
	}
	function startTagInRow(p, token) {
		switch (token.tagID) {
			case TAG_ID.TH:
			case TAG_ID.TD:
				p.openElements.clearBackToTableRowContext();
				p._insertElement(token, NS.HTML);
				p.insertionMode = InsertionMode.IN_CELL;
				p.activeFormattingElements.insertMarker();
				break;
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
			case TAG_ID.TR:
				if (p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
					startTagInTableBody(p, token);
				}
				break;
			default: startTagInTable(p, token);
		}
	}
	function endTagInRow(p, token) {
		switch (token.tagID) {
			case TAG_ID.TR:
				if (p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
				}
				break;
			case TAG_ID.TABLE:
				if (p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
					endTagInTableBody(p, token);
				}
				break;
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				if (p.openElements.hasInTableScope(token.tagID) || p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
					endTagInTableBody(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TD:
			case TAG_ID.TH: break;
			default: endTagInTable(p, token);
		}
	}
	function startTagInCell(p, token) {
		const tn = token.tagID;
		if (TABLE_VOID_ELEMENTS.has(tn)) {
			if (p.openElements.hasInTableScope(TAG_ID.TD) || p.openElements.hasInTableScope(TAG_ID.TH)) {
				p._closeTableCell();
				startTagInRow(p, token);
			}
		} else startTagInBody(p, token);
	}
	function endTagInCell(p, token) {
		const tn = token.tagID;
		switch (tn) {
			case TAG_ID.TD:
			case TAG_ID.TH:
				if (p.openElements.hasInTableScope(tn)) {
					p.openElements.generateImpliedEndTags();
					p.openElements.popUntilTagNamePopped(tn);
					p.activeFormattingElements.clearToLastMarker();
					p.insertionMode = InsertionMode.IN_ROW;
				}
				break;
			case TAG_ID.TABLE:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
			case TAG_ID.TR:
				if (p.openElements.hasInTableScope(tn)) {
					p._closeTableCell();
					endTagInRow(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML: break;
			default: endTagInBody(p, token);
		}
	}
	function startTagInSelect(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.OPTION:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				p._insertElement(token, NS.HTML);
				break;
			case TAG_ID.OPTGROUP:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
				p._insertElement(token, NS.HTML);
				break;
			case TAG_ID.HR:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.INPUT:
			case TAG_ID.KEYGEN:
			case TAG_ID.TEXTAREA:
			case TAG_ID.SELECT:
				if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
					p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
					p._resetInsertionMode();
					if (token.tagID !== TAG_ID.SELECT) p._processStartTag(token);
				}
				break;
			case TAG_ID.SCRIPT:
			case TAG_ID.TEMPLATE:
				startTagInHead(p, token);
				break;
			default:
		}
	}
	function endTagInSelect(p, token) {
		switch (token.tagID) {
			case TAG_ID.OPTGROUP:
				if (p.openElements.stackTop > 0 && p.openElements.currentTagId === TAG_ID.OPTION && p.openElements.tagIDs[p.openElements.stackTop - 1] === TAG_ID.OPTGROUP) p.openElements.pop();
				if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
				break;
			case TAG_ID.OPTION:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				break;
			case TAG_ID.SELECT:
				if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
					p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
					p._resetInsertionMode();
				}
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			default:
		}
	}
	function startTagInSelectInTable(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.CAPTION || tn === TAG_ID.TABLE || tn === TAG_ID.TBODY || tn === TAG_ID.TFOOT || tn === TAG_ID.THEAD || tn === TAG_ID.TR || tn === TAG_ID.TD || tn === TAG_ID.TH) {
			p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
			p._resetInsertionMode();
			p._processStartTag(token);
		} else startTagInSelect(p, token);
	}
	function endTagInSelectInTable(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.CAPTION || tn === TAG_ID.TABLE || tn === TAG_ID.TBODY || tn === TAG_ID.TFOOT || tn === TAG_ID.THEAD || tn === TAG_ID.TR || tn === TAG_ID.TD || tn === TAG_ID.TH) {
			if (p.openElements.hasInTableScope(tn)) {
				p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
				p._resetInsertionMode();
				p.onEndTag(token);
			}
		} else endTagInSelect(p, token);
	}
	function startTagInTemplate(p, token) {
		switch (token.tagID) {
			case TAG_ID.BASE:
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.NOFRAMES:
			case TAG_ID.SCRIPT:
			case TAG_ID.STYLE:
			case TAG_ID.TEMPLATE:
			case TAG_ID.TITLE:
				startTagInHead(p, token);
				break;
			case TAG_ID.CAPTION:
			case TAG_ID.COLGROUP:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE;
				p.insertionMode = InsertionMode.IN_TABLE;
				startTagInTable(p, token);
				break;
			case TAG_ID.COL:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_COLUMN_GROUP;
				p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
				startTagInColumnGroup(p, token);
				break;
			case TAG_ID.TR:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE_BODY;
				p.insertionMode = InsertionMode.IN_TABLE_BODY;
				startTagInTableBody(p, token);
				break;
			case TAG_ID.TD:
			case TAG_ID.TH:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_ROW;
				p.insertionMode = InsertionMode.IN_ROW;
				startTagInRow(p, token);
				break;
			default:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_BODY;
				p.insertionMode = InsertionMode.IN_BODY;
				startTagInBody(p, token);
		}
	}
	function endTagInTemplate(p, token) {
		if (token.tagID === TAG_ID.TEMPLATE) templateEndTagInHead(p, token);
	}
	function eofInTemplate(p, token) {
		if (p.openElements.tmplCount > 0) {
			p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
			p.activeFormattingElements.clearToLastMarker();
			p.tmplInsertionModeStack.shift();
			p._resetInsertionMode();
			p.onEof(token);
		} else stopParsing(p, token);
	}
	function startTagAfterBody(p, token) {
		if (token.tagID === TAG_ID.HTML) startTagInBody(p, token);
		else tokenAfterBody(p, token);
	}
	function endTagAfterBody(p, token) {
		var _a;
		if (token.tagID === TAG_ID.HTML) {
			if (!p.fragmentContext) p.insertionMode = InsertionMode.AFTER_AFTER_BODY;
			if (p.options.sourceCodeLocationInfo && p.openElements.tagIDs[0] === TAG_ID.HTML) {
				p._setEndLocation(p.openElements.items[0], token);
				const bodyElement = p.openElements.items[1];
				if (bodyElement && !((_a = p.treeAdapter.getNodeSourceCodeLocation(bodyElement)) === null || _a === void 0 ? void 0 : _a.endTag)) p._setEndLocation(bodyElement, token);
			}
		} else tokenAfterBody(p, token);
	}
	function tokenAfterBody(p, token) {
		p.insertionMode = InsertionMode.IN_BODY;
		modeInBody(p, token);
	}
	function startTagInFrameset(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.FRAMESET:
				p._insertElement(token, NS.HTML);
				break;
			case TAG_ID.FRAME:
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.NOFRAMES:
				startTagInHead(p, token);
				break;
			default:
		}
	}
	function endTagInFrameset(p, token) {
		if (token.tagID === TAG_ID.FRAMESET && !p.openElements.isRootHtmlElementCurrent()) {
			p.openElements.pop();
			if (!p.fragmentContext && p.openElements.currentTagId !== TAG_ID.FRAMESET) p.insertionMode = InsertionMode.AFTER_FRAMESET;
		}
	}
	function startTagAfterFrameset(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.NOFRAMES:
				startTagInHead(p, token);
				break;
			default:
		}
	}
	function endTagAfterFrameset(p, token) {
		if (token.tagID === TAG_ID.HTML) p.insertionMode = InsertionMode.AFTER_AFTER_FRAMESET;
	}
	function startTagAfterAfterBody(p, token) {
		if (token.tagID === TAG_ID.HTML) startTagInBody(p, token);
		else tokenAfterAfterBody(p, token);
	}
	function tokenAfterAfterBody(p, token) {
		p.insertionMode = InsertionMode.IN_BODY;
		modeInBody(p, token);
	}
	function startTagAfterAfterFrameset(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.NOFRAMES:
				startTagInHead(p, token);
				break;
			default:
		}
	}
	function nullCharacterInForeignContent(p, token) {
		token.chars = "�";
		p._insertCharacters(token);
	}
	function characterInForeignContent(p, token) {
		p._insertCharacters(token);
		p.framesetOk = false;
	}
	function popUntilHtmlOrIntegrationPoint(p) {
		while (p.treeAdapter.getNamespaceURI(p.openElements.current) !== NS.HTML && p.openElements.currentTagId !== void 0 && !p._isIntegrationPoint(p.openElements.currentTagId, p.openElements.current)) p.openElements.pop();
	}
	function startTagInForeignContent(p, token) {
		if (causesExit(token)) {
			popUntilHtmlOrIntegrationPoint(p);
			p._startTagOutsideForeignContent(token);
		} else {
			const current = p._getAdjustedCurrentElement();
			const currentNs = p.treeAdapter.getNamespaceURI(current);
			if (currentNs === NS.MATHML) adjustTokenMathMLAttrs(token);
			else if (currentNs === NS.SVG) {
				adjustTokenSVGTagName(token);
				adjustTokenSVGAttrs(token);
			}
			adjustTokenXMLAttrs(token);
			if (token.selfClosing) p._appendElement(token, currentNs);
			else p._insertElement(token, currentNs);
			token.ackSelfClosing = true;
		}
	}
	function endTagInForeignContent(p, token) {
		if (token.tagID === TAG_ID.P || token.tagID === TAG_ID.BR) {
			popUntilHtmlOrIntegrationPoint(p);
			p._endTagOutsideForeignContent(token);
			return;
		}
		for (let i = p.openElements.stackTop; i > 0; i--) {
			const element = p.openElements.items[i];
			if (p.treeAdapter.getNamespaceURI(element) === NS.HTML) {
				p._endTagOutsideForeignContent(token);
				break;
			}
			const tagName = p.treeAdapter.getTagName(element);
			if (tagName.toLowerCase() === token.tagName) {
				token.tagName = tagName;
				p.openElements.shortenToLength(i);
				break;
			}
		}
	}

//#endregion
//#region node_modules/parse5/node_modules/entities/dist/esm/escape.js
	const getCodePoint = String.prototype.codePointAt == null ? (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index) : (input, index) => input.codePointAt(index);
	/**
	* Creates a function that escapes all characters matched by the given regular
	* expression using the given map of characters to escape to their entities.
	*
	* @param regex Regular expression to match characters to escape.
	* @param map Map of characters to escape to their entities.
	*
	* @returns Function that escapes all characters matched by the given regular
	* expression using the given map of characters to escape to their entities.
	*/
	function getEscaper(regex, map) {
		return function escape(data) {
			let match;
			let lastIndex = 0;
			let result = "";
			while (match = regex.exec(data)) {
				if (lastIndex !== match.index) result += data.substring(lastIndex, match.index);
				result += map.get(match[0].charCodeAt(0));
				lastIndex = match.index + 1;
			}
			return result + data.substring(lastIndex);
		};
	}
	/**
	* Encodes all characters that have to be escaped in HTML attributes,
	* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
	*
	* @param data String to escape.
	*/
	const escapeAttribute = /* @__PURE__ */ getEscaper(/["&\u00A0]/g, new Map([
		[34, "&quot;"],
		[38, "&amp;"],
		[160, "&nbsp;"]
	]));
	/**
	* Encodes all characters that have to be escaped in HTML text,
	* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
	*
	* @param data String to escape.
	*/
	const escapeText = /* @__PURE__ */ getEscaper(/[&<>\u00A0]/g, new Map([
		[38, "&amp;"],
		[60, "&lt;"],
		[62, "&gt;"],
		[160, "&nbsp;"]
	]));

//#endregion
//#region node_modules/parse5/dist/serializer/index.js
	const VOID_ELEMENTS = new Set([
		TAG_NAMES.AREA,
		TAG_NAMES.BASE,
		TAG_NAMES.BASEFONT,
		TAG_NAMES.BGSOUND,
		TAG_NAMES.BR,
		TAG_NAMES.COL,
		TAG_NAMES.EMBED,
		TAG_NAMES.FRAME,
		TAG_NAMES.HR,
		TAG_NAMES.IMG,
		TAG_NAMES.INPUT,
		TAG_NAMES.KEYGEN,
		TAG_NAMES.LINK,
		TAG_NAMES.META,
		TAG_NAMES.PARAM,
		TAG_NAMES.SOURCE,
		TAG_NAMES.TRACK,
		TAG_NAMES.WBR
	]);
	function isVoidElement(node, options) {
		return options.treeAdapter.isElementNode(node) && options.treeAdapter.getNamespaceURI(node) === NS.HTML && VOID_ELEMENTS.has(options.treeAdapter.getTagName(node));
	}
	const defaultOpts = {
		treeAdapter: defaultTreeAdapter,
		scriptingEnabled: true
	};
	/**
	* Serializes an AST element node to an HTML string, including the element node.
	*
	* @example
	*
	* ```js
	* const parse5 = require('parse5');
	*
	* const document = parse5.parseFragment('<div>Hello, <b>world</b>!</div>');
	*
	* // Serializes the <div> element.
	* const str = parse5.serializeOuter(document.childNodes[0]);
	*
	* console.log(str); //> '<div>Hello, <b>world</b>!</div>'
	* ```
	*
	* @param node Node to serialize.
	* @param options Serialization options.
	*/
	function serializeOuter(node, options) {
		return serializeNode(node, {
			...defaultOpts,
			...options
		});
	}
	function serializeChildNodes(parentNode, options) {
		let html = "";
		const container = options.treeAdapter.isElementNode(parentNode) && options.treeAdapter.getTagName(parentNode) === TAG_NAMES.TEMPLATE && options.treeAdapter.getNamespaceURI(parentNode) === NS.HTML ? options.treeAdapter.getTemplateContent(parentNode) : parentNode;
		const childNodes = options.treeAdapter.getChildNodes(container);
		if (childNodes) for (const currentNode of childNodes) html += serializeNode(currentNode, options);
		return html;
	}
	function serializeNode(node, options) {
		if (options.treeAdapter.isElementNode(node)) return serializeElement(node, options);
		if (options.treeAdapter.isTextNode(node)) return serializeTextNode(node, options);
		if (options.treeAdapter.isCommentNode(node)) return serializeCommentNode(node, options);
		if (options.treeAdapter.isDocumentTypeNode(node)) return serializeDocumentTypeNode(node, options);
		return "";
	}
	function serializeElement(node, options) {
		const tn = options.treeAdapter.getTagName(node);
		return `<${tn}${serializeAttributes(node, options)}>${isVoidElement(node, options) ? "" : `${serializeChildNodes(node, options)}</${tn}>`}`;
	}
	function serializeAttributes(node, { treeAdapter }) {
		let html = "";
		for (const attr of treeAdapter.getAttrList(node)) {
			html += " ";
			if (attr.namespace) switch (attr.namespace) {
				case NS.XML:
					html += `xml:${attr.name}`;
					break;
				case NS.XMLNS:
					if (attr.name !== "xmlns") html += "xmlns:";
					html += attr.name;
					break;
				case NS.XLINK:
					html += `xlink:${attr.name}`;
					break;
				default: html += `${attr.prefix}:${attr.name}`;
			}
			else html += attr.name;
			html += `="${escapeAttribute(attr.value)}"`;
		}
		return html;
	}
	function serializeTextNode(node, options) {
		const { treeAdapter } = options;
		const content = treeAdapter.getTextNodeContent(node);
		const parent = treeAdapter.getParentNode(node);
		const parentTn = parent && treeAdapter.isElementNode(parent) && treeAdapter.getTagName(parent);
		return parentTn && treeAdapter.getNamespaceURI(parent) === NS.HTML && hasUnescapedText(parentTn, options.scriptingEnabled) ? content : escapeText(content);
	}
	function serializeCommentNode(node, { treeAdapter }) {
		return `<!--${treeAdapter.getCommentNodeContent(node)}-->`;
	}
	function serializeDocumentTypeNode(node, { treeAdapter }) {
		return `<!DOCTYPE ${treeAdapter.getDocumentTypeNodeName(node)}>`;
	}

//#endregion
//#region node_modules/parse5/dist/index.js
/**
	* Parses an HTML string.
	*
	* @param html Input HTML string.
	* @param options Parsing options.
	* @returns Document
	*
	* @example
	*
	* ```js
	* const parse5 = require('parse5');
	*
	* const document = parse5.parse('<!DOCTYPE html><html><head></head><body>Hi there!</body></html>');
	*
	* console.log(document.childNodes[1].tagName); //> 'html'
	*```
	*/
	function parse$1(html, options) {
		return Parser.parse(html, options);
	}
	function parseFragment(fragmentContext, html, options) {
		if (typeof fragmentContext === "string") {
			options = html;
			html = fragmentContext;
			fragmentContext = null;
		}
		const parser = Parser.getFragmentParser(fragmentContext, options);
		parser.tokenizer.write(html, true);
		return parser.getFragment();
	}

//#endregion
//#region node_modules/parse5-htmlparser2-tree-adapter/dist/index.js
	function enquoteDoctypeId(id) {
		const quote = id.includes("\"") ? "'" : "\"";
		return quote + id + quote;
	}
	/** @internal */
	function serializeDoctypeContent(name, publicId, systemId) {
		let str = "!DOCTYPE ";
		if (name) str += name;
		if (publicId) str += ` PUBLIC ${enquoteDoctypeId(publicId)}`;
		else if (systemId) str += " SYSTEM";
		if (systemId) str += ` ${enquoteDoctypeId(systemId)}`;
		return str;
	}
	const adapter = {
		isCommentNode: isComment,
		isElementNode: isTag,
		isTextNode: isText,
		createDocument() {
			const node = new Document([]);
			node["x-mode"] = DOCUMENT_MODE.NO_QUIRKS;
			return node;
		},
		createDocumentFragment() {
			return new Document([]);
		},
		createElement(tagName, namespaceURI, attrs) {
			const attribs = Object.create(null);
			const attribsNamespace = Object.create(null);
			const attribsPrefix = Object.create(null);
			for (let i = 0; i < attrs.length; i++) {
				const attrName = attrs[i].name;
				attribs[attrName] = attrs[i].value;
				attribsNamespace[attrName] = attrs[i].namespace;
				attribsPrefix[attrName] = attrs[i].prefix;
			}
			const node = new Element(tagName, attribs, []);
			node.namespace = namespaceURI;
			node["x-attribsNamespace"] = attribsNamespace;
			node["x-attribsPrefix"] = attribsPrefix;
			return node;
		},
		createCommentNode(data) {
			return new Comment(data);
		},
		createTextNode(value) {
			return new Text(value);
		},
		appendChild(parentNode, newNode) {
			const prev = parentNode.children[parentNode.children.length - 1];
			if (prev) {
				prev.next = newNode;
				newNode.prev = prev;
			}
			parentNode.children.push(newNode);
			newNode.parent = parentNode;
		},
		insertBefore(parentNode, newNode, referenceNode) {
			const insertionIdx = parentNode.children.indexOf(referenceNode);
			const { prev } = referenceNode;
			if (prev) {
				prev.next = newNode;
				newNode.prev = prev;
			}
			referenceNode.prev = newNode;
			newNode.next = referenceNode;
			parentNode.children.splice(insertionIdx, 0, newNode);
			newNode.parent = parentNode;
		},
		setTemplateContent(templateElement, contentElement) {
			adapter.appendChild(templateElement, contentElement);
		},
		getTemplateContent(templateElement) {
			return templateElement.children[0];
		},
		setDocumentType(document, name, publicId, systemId) {
			const data = serializeDoctypeContent(name, publicId, systemId);
			let doctypeNode = document.children.find((node) => isDirective(node) && node.name === "!doctype");
			if (doctypeNode) doctypeNode.data = data !== null && data !== void 0 ? data : null;
			else {
				doctypeNode = new ProcessingInstruction("!doctype", data);
				adapter.appendChild(document, doctypeNode);
			}
			doctypeNode["x-name"] = name;
			doctypeNode["x-publicId"] = publicId;
			doctypeNode["x-systemId"] = systemId;
		},
		setDocumentMode(document, mode) {
			document["x-mode"] = mode;
		},
		getDocumentMode(document) {
			return document["x-mode"];
		},
		detachNode(node) {
			if (node.parent) {
				const idx = node.parent.children.indexOf(node);
				const { prev, next } = node;
				node.prev = null;
				node.next = null;
				if (prev) prev.next = next;
				if (next) next.prev = prev;
				node.parent.children.splice(idx, 1);
				node.parent = null;
			}
		},
		insertText(parentNode, text) {
			const lastChild = parentNode.children[parentNode.children.length - 1];
			if (lastChild && isText(lastChild)) lastChild.data += text;
			else adapter.appendChild(parentNode, adapter.createTextNode(text));
		},
		insertTextBefore(parentNode, text, referenceNode) {
			const prevNode = parentNode.children[parentNode.children.indexOf(referenceNode) - 1];
			if (prevNode && isText(prevNode)) prevNode.data += text;
			else adapter.insertBefore(parentNode, adapter.createTextNode(text), referenceNode);
		},
		adoptAttributes(recipient, attrs) {
			for (let i = 0; i < attrs.length; i++) {
				const attrName = attrs[i].name;
				if (recipient.attribs[attrName] === void 0) {
					recipient.attribs[attrName] = attrs[i].value;
					recipient["x-attribsNamespace"][attrName] = attrs[i].namespace;
					recipient["x-attribsPrefix"][attrName] = attrs[i].prefix;
				}
			}
		},
		getFirstChild(node) {
			return node.children[0];
		},
		getChildNodes(node) {
			return node.children;
		},
		getParentNode(node) {
			return node.parent;
		},
		getAttrList(element) {
			return element.attributes;
		},
		getTagName(element) {
			return element.name;
		},
		getNamespaceURI(element) {
			return element.namespace;
		},
		getTextNodeContent(textNode) {
			return textNode.data;
		},
		getCommentNodeContent(commentNode) {
			return commentNode.data;
		},
		getDocumentTypeNodeName(doctypeNode) {
			var _a;
			return (_a = doctypeNode["x-name"]) !== null && _a !== void 0 ? _a : "";
		},
		getDocumentTypeNodePublicId(doctypeNode) {
			var _a;
			return (_a = doctypeNode["x-publicId"]) !== null && _a !== void 0 ? _a : "";
		},
		getDocumentTypeNodeSystemId(doctypeNode) {
			var _a;
			return (_a = doctypeNode["x-systemId"]) !== null && _a !== void 0 ? _a : "";
		},
		isDocumentTypeNode(node) {
			return isDirective(node) && node.name === "!doctype";
		},
		setNodeSourceCodeLocation(node, location) {
			if (location) {
				node.startIndex = location.startOffset;
				node.endIndex = location.endOffset;
			}
			node.sourceCodeLocation = location;
		},
		getNodeSourceCodeLocation(node) {
			return node.sourceCodeLocation;
		},
		updateNodeSourceCodeLocation(node, endLocation) {
			if (endLocation.endOffset != null) node.endIndex = endLocation.endOffset;
			node.sourceCodeLocation = {
				...node.sourceCodeLocation,
				...endLocation
			};
		}
	};

//#endregion
//#region node_modules/cheerio/dist/browser/parsers/parse5-adapter.js
/**
	* Parse the content with `parse5` in the context of the given `ParentNode`.
	*
	* @param content - The content to parse.
	* @param options - A set of options to use to parse.
	* @param isDocument - Whether to parse the content as a full HTML document.
	* @param context - The context in which to parse the content.
	* @returns The parsed content.
	*/
	function parseWithParse5(content, options, isDocument, context) {
		var _a;
		(_a = options.treeAdapter) !== null && _a !== void 0 || (options.treeAdapter = adapter);
		if (options.scriptingEnabled !== false) options.scriptingEnabled = true;
		return isDocument ? parse$1(content, options) : parseFragment(context, content, options);
	}
	const renderOpts = { treeAdapter: adapter };
	/**
	* Renders the given DOM tree with `parse5` and returns the result as a string.
	*
	* @param dom - The DOM tree to render.
	* @returns The rendered document.
	*/
	function renderWithParse5(dom) {
		const nodes = "length" in dom ? dom : [dom];
		for (let index = 0; index < nodes.length; index += 1) {
			const node = nodes[index];
			if (isDocument(node)) Array.prototype.splice.call(nodes, index, 1, ...node.children);
		}
		let result = "";
		for (let index = 0; index < nodes.length; index += 1) {
			const node = nodes[index];
			result += serializeOuter(node, renderOpts);
		}
		return result;
	}

//#endregion
//#region node_modules/cheerio/dist/browser/load-parse.js
	const parse = getParse((content, options, isDocument, context) => options._useHtmlParser2 ? parseDocument(content, options) : parseWithParse5(content, options, isDocument, context));
	/**
	* Create a querying function, bound to a document created from the provided
	* markup.
	*
	* Note that similar to web browser contexts, this operation may introduce
	* `<html>`, `<head>`, and `<body>` elements; set `isDocument` to `false` to
	* switch to fragment mode and disable this.
	*
	* @category Loading
	* @param content - Markup to be loaded.
	* @param options - Options for the created instance.
	* @param isDocument - Allows parser to be switched to fragment mode.
	* @returns The loaded document.
	* @see {@link https://cheerio.js.org/docs/basics/loading#load} for additional usage information.
	*/
	const load = getLoad(parse, (dom, options) => options._useHtmlParser2 ? render$1(dom, options) : renderWithParse5(dom));

//#endregion
//#region src/MangaDemon/models.ts
	const DOMAIN = "https://demonicscans.org";
	const DEFAULT_CONTENT_RATING = ContentRating$1.MATURE;
	const MOST_VIEWED_SECTION_ID = "most_viewed_today";
	const MOST_VIEWED_SECTION_TITLE = "Most Viewed Today";
	const LATEST_TRANSLATION_SECTION_ID = "latest_translation";
	const LATEST_TRANSLATION_SECTION_TITLE = "Latest Translation";
	const LATEST_UPDATES_SECTION_ID = "latest_updates";
	const LATEST_UPDATES_SECTION_TITLE = "Latest Updates";
	const NEW_TITLES_SECTION_ID = "new_titles";
	const NEW_TITLES_SECTION_TITLE = "New Titles";
	const LATEST_NOVEL_SECTION_ID = "latest_novel";
	const LATEST_NOVEL_SECTION_TITLE = "Latest Novel";

//#endregion
//#region src/MangaDemon/network.ts
	var MangaDemonInterceptor = class extends PaperbackInterceptor {
		async interceptRequest(request) {
			return {
				...request,
				headers: {
					...request.headers,
					referer: `${DOMAIN}/`,
					"user-agent": await Application.getDefaultUserAgent()
				}
			};
		}
		async interceptResponse(request, response, data) {
			if (response.headers?.["cf-mitigated"] === "challenge") throw new CloudflareError({
				url: request.url,
				method: request.method ?? "GET",
				headers: { "user-agent": await Application.getDefaultUserAgent() }
			});
			return data;
		}
	};

//#endregion
//#region src/MangaDemon/parsers.ts
	var MangaDemonParser = class {
		/**
		* Parses the "Most Viewed Today" carousel for the discover section.
		* Returns an array of items with mangaId, title, and imageUrl.
		*/
		async parseMostViewedToday($) {
			const items = [];
			$(".owl-carousel#carousel .owl-element").each((_, el) => {
				const anchor = $(el).find("a");
				const title = anchor.attr("title")?.trim() || "";
				const imageUrl = anchor.find("img").attr("src") || "";
				const viewsText = anchor.find("h1 > div").text().replace(/[^0-9]/g, "");
				const views = parseInt(viewsText, 10);
				const href = anchor.attr("href") || "";
				const mangaId = decodeURIComponent(href.replace("/manga/", "").replace(/\/$/, ""));
				items.push({
					type: "simpleCarouselItem",
					mangaId,
					title,
					imageUrl,
					subtitle: `${views.toLocaleString()} views`
				});
			});
			return items;
		}
		/**
		* Parses the "Latest Translation" carousel for the discover section.
		* Returns items and a flag for next page.
		*/
		async parseLatestTranslation($, nextLabel = "Next") {
			const items = [];
			$(".updates-element.border-box").each((_, el) => {
				const imageUrl = $(el).find(".thumb a img").attr("src") || "";
				const titleAnchor = $(el).find(".updates-element-info h2 a");
				const title = titleAnchor.attr("title")?.trim() || titleAnchor.text().trim();
				const topChapter = $(el).find(".chap-date").first().find("div").first().find("a").first().text().trim();
				const href = titleAnchor.attr("href") || "";
				const mangaId = decodeURIComponent(href.replace("/manga/", "").replace(/\/$/, ""));
				items.push({
					type: "simpleCarouselItem",
					mangaId,
					title,
					subtitle: topChapter,
					imageUrl
				});
			});
			let hasNextPage = false;
			if (items.length > 0) $(".pagination a").each((_, el) => {
				if ($(el).text().trim() === nextLabel) hasNextPage = true;
			});
			return {
				items,
				hasNextPage
			};
		}
		/**
		* Parses quick search results (when searching by title).
		*/
		async parseQuickSearch($) {
			const items = [];
			$("a[href^=\"/manga/\"]").each((_, el) => {
				const anchor = $(el);
				const li = anchor.find("li");
				const imageUrl = li.find("img").attr("src") || "";
				const rightDiv = li.find(".seach-right");
				const title = rightDiv.find("div").first().text().trim();
				const views = rightDiv.find("div").eq(1).text().replace(/[^0-9]/g, "") || "";
				const href = anchor.attr("href") || "";
				const mangaId = decodeURIComponent(href.replace("/manga/", "").replace(/\/$/, ""));
				if (title && mangaId) items.push({
					mangaId,
					title,
					imageUrl,
					views
				});
			});
			return items;
		}
		/**
		* Parses advanced search results (with filters/sorting).
		*/
		async parseAdvancedSearchDefault($) {
			const items = [];
			$(".advanced-element").each((_, el) => {
				const anchor = $(el).find("a[href^=\"/manga/\"]");
				const title = anchor.attr("title")?.trim() || "";
				const imageUrl = anchor.find("img").attr("src") || "";
				const views = anchor.find("h1 > div").text().replace(/[^0-9]/g, "") || "";
				const href = anchor.attr("href") || "";
				const mangaId = decodeURIComponent(href.replace("/manga/", "").replace(/\/$/, ""));
				if (title && mangaId) items.push({
					mangaId,
					title,
					imageUrl,
					views
				});
			});
			return items;
		}
		/**
		* Parses manga details and chapter list from the manga details page HTML.
		* Returns an object with all manga info and a list of chapters.
		*/
		async parseMangaDetails($, mangaId) {
			let decodedMangaId = mangaId;
			try {
				decodedMangaId = decodeURIComponent(mangaId);
			} catch {}
			const title = $("h1.big-fat-titles").first().text().trim() || "No title";
			const cover = $("#manga-page img").first().attr("src") || "";
			const genres = [];
			$(".genres-list li").each((_, el) => {
				const genre = $(el).text().trim();
				if (genre) genres.push(genre);
			});
			const description = $(".white-font").first().text().trim() || "No description available";
			let author = "";
			$("#manga-info-stats .flex-row").each((_, el) => {
				const label = $(el).find("li").first().text().trim();
				if (/author/i.test(label)) author = $(el).find("li").eq(1).text().trim();
			});
			if (!author || author.trim().toLowerCase().includes("updating")) author = ".";
			let rating = void 0;
			$("#manga-info-stats .flex-row").each((_, el) => {
				const label = $(el).find("li").first().text().trim();
				if (/rating/i.test(label)) {
					const raw = $(el).find("li").last().text().replace(/[^0-9.]/g, "");
					if (raw) rating = parseFloat(raw) / 100;
				}
			});
			let status = "";
			$("#manga-info-stats .flex-row").each((_, el) => {
				const label = $(el).find("li").first().text().trim();
				if (/status/i.test(label)) status = $(el).find("li").last().text().trim();
			});
			const chapters = [];
			$("#chapters-list li a.chplinks").filter((_, el) => {
				return $(el).text().trim().startsWith("Chapter");
			}).each((_, el) => {
				const href = $(el).attr("href") || "";
				const $el = $(el);
				const span = $el.find("span");
				const chapTitle = $el.clone().children().remove().end().text().replace(/\s+/g, " ").trim();
				const date = span.text().trim();
				if (href && chapTitle && href.includes("/chaptered.php?manga=")) {
					const chapterMatch = href.match(/chapter=(\d+)/);
					if (chapterMatch) {
						const chapterNumber = chapterMatch[1];
						const readingUrl = `/title/${decodedMangaId}/chapter/${chapterNumber}/1`;
						chapters.push({
							chapterId: readingUrl,
							title: chapTitle,
							date
						});
					} else chapters.push({
						chapterId: href,
						title: chapTitle,
						date
					});
				}
			});
			if (!title || !decodedMangaId) throw new Error(`[MangaDemon][parseMangaDetails] Missing required field: title or mangaId. title="${title}", mangaId="${decodedMangaId}"`);
			return {
				mangaId: decodedMangaId,
				title,
				author,
				genres,
				description,
				status,
				rating,
				cover,
				chapters
			};
		}
		/**
		* Parses the chapter list from the manga details page HTML.
		* Returns an array of Chapter objects for Paperback.
		*/
		parseChapterList($, sourceManga) {
			const chapters = [];
			const chapterElements = $("#chapters-list li a.chplinks").filter((_, el) => {
				return $(el).text().trim().startsWith("Chapter");
			});
			if (chapterElements.length > 0) chapterElements.each((index, el) => {
				const href = $(el).attr("href") || "";
				const $el = $(el);
				const span = $el.find("span");
				const title = $el.clone().children().remove().end().text().replace(/\s+/g, " ").trim();
				const date = span.text().trim();
				const chapterMatch = href.match(/chapter=(\d+)/);
				if (chapterMatch) {
					const chapterNumber = chapterMatch[1];
					const chapNum = parseFloat(chapterNumber);
					chapters.push({
						chapterId: href,
						sourceManga,
						langCode: "en",
						chapNum,
						title,
						publishDate: this.parseDate(date),
						sortingIndex: chapterElements.length - index
					});
				}
			});
			else for (const selector of [
				"#chapters-list a.chplinks",
				"#chapters-list li a",
				".chapters-list li a.chplinks",
				".chapters-list a.chplinks"
			]) {
				const elements = $(selector).filter((_, el) => {
					return $(el).text().trim().startsWith("Chapter");
				});
				if (elements.length > 0) {
					elements.each((index, el) => {
						const href = $(el).attr("href") || "";
						const $el = $(el);
						const span = $el.find("span");
						const title = $el.clone().children().remove().end().text().replace(/\s+/g, " ").trim();
						const date = span.text().trim();
						if (href && title && href.includes("/chaptered.php?manga=")) {
							const chapterMatch = href.match(/chapter=(\d+)/);
							const chapNum = chapterMatch ? parseFloat(chapterMatch[1]) : 0;
							chapters.push({
								chapterId: href,
								sourceManga,
								langCode: "en",
								chapNum,
								title,
								publishDate: this.parseDate(date),
								sortingIndex: elements.length - index
							});
						}
					});
					break;
				}
			}
			return chapters;
		}
		/**
		* Parses chapter pages from the chapter reading page HTML.
		* Uses JavaScript-inspired approach that mirrors the website's own fallback logic.
		* Handles multiple domains and file types discovered through analysis.
		*/
		async parseChapterPages($, chapterUrl) {
			if (chapterUrl && chapterUrl.includes("/reader/novel/")) {
				const paragraphs = [];
				$("#nov-chap-container p").each((_, el) => {
					const text = $(el).text().trim();
					if (text) paragraphs.push(text);
				});
				return paragraphs;
			}
			const pages = [];
			$("img.imgholder").each((_, el) => {
				const src = $(el).attr("src");
				if (src && src.trim()) pages.push(src);
			});
			const validDomains = [
				"mangareadon.org",
				"cdn.demoniclibs.com",
				"demoniclibs.com",
				"librarydm.com"
			];
			const validExtensions = [
				".jpg",
				".jpeg",
				".png",
				".webp"
			];
			return [...new Set(pages)].filter((src) => {
				const hasValidDomain = validDomains.some((domain) => src.includes(domain));
				const hasValidExtension = validExtensions.some((ext) => src.includes(ext));
				const isNotAd = !src.includes("free_ads") && !src.includes("logo") && !src.includes("banner") && !src.includes("advertisement");
				return hasValidDomain && hasValidExtension && isNotAd;
			});
		}
		/**
		* Helper method to parse date strings into Date objects.
		* Returns undefined if parsing fails.
		*/
		parseDate(dateString) {
			if (!dateString || dateString.trim() === "") return;
			try {
				const date = new Date(dateString);
				if (!isNaN(date.getTime())) return date;
				return;
			} catch {
				return;
			}
		}
	};

//#endregion
//#region src/MangaDemon/main.ts
	var MangaDemonExtension = class {
		constructor() {
			_defineProperty(this, "parser", new MangaDemonParser());
			_defineProperty(this, "idMap", {});
			_defineProperty(this, "filterOptionsCache", null);
			_defineProperty(this, "sortingOptionsCache", null);
			_defineProperty(this, "filterSortCachePromise", null);
			_defineProperty(this, "cookieStorageInterceptor", new CookieStorageInterceptor({ storage: "stateManager" }));
			_defineProperty(this, "mangaDemonInterceptor", new MangaDemonInterceptor("main"));
		}
		async fetchAndCacheFiltersAndSorts() {
			const [_response, buffer] = await Application.scheduleRequest({
				url: `${DOMAIN}/advanced.php`,
				method: "GET"
			});
			const html = Application.arrayBufferToUTF8String(buffer);
			const $ = load(html);
			const genreOptions = [];
			$("input.genrespick[type=\"checkbox\"][name=\"genres[]\"]").each((_, el) => {
				const id = $(el).val()?.toString() || "";
				const label = $(el).parent().text().replace(/^[\s\xa0]+/, "").trim();
				if (id && label) genreOptions.push({
					id,
					value: label
				});
			});
			const statusOptions = [];
			$("select[name=\"status\"] option").each((_, el) => {
				const id = $(el).val()?.toString() || "";
				const label = $(el).text().trim();
				if (id && label) statusOptions.push({
					id,
					value: label
				});
			});
			this.filterOptionsCache = [{
				type: "multiselect",
				id: "genre",
				title: "Genre",
				options: genreOptions,
				value: {},
				allowExclusion: false,
				allowEmptySelection: true,
				maximum: void 0
			}, {
				type: "dropdown",
				id: "status",
				title: "Status",
				options: statusOptions,
				value: "all"
			}];
			const sortOptions = [];
			$("select[name=\"orderby\"] option").each((_, el) => {
				const id = $(el).val()?.toString() || "";
				const label = $(el).text().trim();
				if (id && label) sortOptions.push({
					id,
					label
				});
			});
			this.sortingOptionsCache = sortOptions;
		}
		async initialise() {
			this.cookieStorageInterceptor.registerInterceptor();
			this.mangaDemonInterceptor.registerInterceptor();
		}
		async getDiscoverSections() {
			return [
				{
					id: MOST_VIEWED_SECTION_ID,
					title: MOST_VIEWED_SECTION_TITLE,
					type: DiscoverSectionType.simpleCarousel
				},
				{
					id: LATEST_TRANSLATION_SECTION_ID,
					title: LATEST_TRANSLATION_SECTION_TITLE,
					type: DiscoverSectionType.simpleCarousel
				},
				{
					id: LATEST_UPDATES_SECTION_ID,
					title: LATEST_UPDATES_SECTION_TITLE,
					type: DiscoverSectionType.simpleCarousel
				},
				{
					id: NEW_TITLES_SECTION_ID,
					title: NEW_TITLES_SECTION_TITLE,
					type: DiscoverSectionType.simpleCarousel
				},
				{
					id: LATEST_NOVEL_SECTION_ID,
					title: LATEST_NOVEL_SECTION_TITLE,
					type: DiscoverSectionType.simpleCarousel
				}
			];
		}
		async getDiscoverSectionItems(section, metadata) {
			if (section.id === "most_viewed_today") {
				const [_response, buffer] = await Application.scheduleRequest({
					url: `${DOMAIN}/index.php`,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const $ = load(html);
				const items = await this.parser.parseMostViewedToday($);
				if (Array.isArray(items)) items.forEach((item) => {
					if (item && "mangaId" in item && item.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items,
					metadata: void 0
				};
			}
			if (section.id === "latest_translation") {
				const page = metadata?.page ?? 1;
				const url = `${DOMAIN}/translationlist.php${page > 1 ? `?list=${page}` : ""}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const $ = load(html);
				const { items, hasNextPage } = await this.parser.parseLatestTranslation($);
				const realHasNextPage = hasNextPage && items.length > 0;
				if (Array.isArray(items)) items.forEach((item) => {
					if (item && "mangaId" in item && item.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items,
					metadata: realHasNextPage ? {
						page: page + 1,
						hasNextPage: true
					} : void 0
				};
			}
			if (section.id === "latest_updates") {
				const page = metadata?.page ?? 1;
				const url = `${DOMAIN}/lastupdates.php${page > 1 ? `?list=${page}` : ""}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const { items, hasNextPage } = await this.parser.parseLatestTranslation(load(html));
				const realHasNextPage = hasNextPage && items.length > 0;
				if (Array.isArray(items)) items.forEach((item) => {
					if (item && "mangaId" in item && item.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items,
					metadata: realHasNextPage ? {
						page: page + 1,
						hasNextPage: true
					} : void 0
				};
			}
			if (section.id === "new_titles") {
				const page = metadata?.page ?? 1;
				const url = `${DOMAIN}/newmangalist.php${page > 1 ? `?list=${page}` : ""}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const { items, hasNextPage } = await this.parser.parseLatestTranslation(load(html));
				const realHasNextPage = hasNextPage && items.length > 0;
				if (Array.isArray(items)) items.forEach((item) => {
					if (item && "mangaId" in item && item.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items,
					metadata: realHasNextPage ? {
						page: page + 1,
						hasNextPage: true
					} : void 0
				};
			}
			if (section.id === "latest_novel") {
				const page = metadata?.page ?? 1;
				const url = `${DOMAIN}/lastnvupdates.php${page > 1 ? `?list=${page}` : ""}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const { items, hasNextPage } = await this.parser.parseLatestTranslation(load(html));
				const realHasNextPage = hasNextPage && items.length > 0;
				if (Array.isArray(items)) items.forEach((item) => {
					if (item && "mangaId" in item && item.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items,
					metadata: realHasNextPage ? {
						page: page + 1,
						hasNextPage: true
					} : void 0
				};
			}
			return {
				items: [],
				metadata: void 0
			};
		}
		async getSearchResults(query, metadata, sortingOption) {
			if (query.title && query.title.trim().length > 0) {
				const url = `${DOMAIN}/search.php?manga=${encodeURIComponent(query.title.trim())}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const $ = load(html);
				const results = await this.parser.parseQuickSearch($);
				if (Array.isArray(results)) results.forEach((item) => {
					if (item?.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items: Array.isArray(results) ? results : [],
					metadata: void 0
				};
			}
			const page = metadata?.page ?? 1;
			let hasGenre = false;
			let statusNotAll = false;
			const genreIds = [];
			let statusValue = void 0;
			if (query.metadata) for (const filter of query.metadata) {
				if (filter.id === "genre" && typeof filter.value === "object") {
					for (const [genreId, state] of Object.entries(filter.value)) if (state === "included") genreIds.push(genreId);
					hasGenre = genreIds.length > 0;
				}
				if (filter.id === "status" && typeof filter.value === "string") {
					statusValue = filter.value;
					if (filter.value !== "all") statusNotAll = true;
				}
			}
			const isDefaultSort = !sortingOption || !sortingOption.id || sortingOption.id === "VIEWS DESC";
			if (!hasGenre && !statusNotAll && isDefaultSort) {
				const url = `${DOMAIN}/advanced.php${page > 1 ? `?list=${page}` : ""}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const $ = load(html);
				const results = await this.parser.parseAdvancedSearchDefault($);
				let hasNextPage = false;
				const nextPage = page + 1;
				let lastPage = page;
				$(".pagination a").each((_, el) => {
					const num = parseInt($(el).text().trim(), 10);
					if (!isNaN(num) && num > lastPage) lastPage = num;
				});
				if ($(".pagination a:contains('Next')").length > 0 && nextPage <= lastPage) hasNextPage = true;
				if (Array.isArray(results)) results.forEach((item) => {
					if (item?.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items: Array.isArray(results) ? results : [],
					metadata: hasNextPage ? { page: nextPage } : void 0
				};
			}
			if (page === 1) {
				const formData = [];
				if (genreIds.length > 0) for (const id of genreIds) formData.push(`genres[]=${encodeURIComponent(id)}`);
				if (typeof statusValue === "string") formData.push(`status=${encodeURIComponent(statusValue)}`);
				if (sortingOption && sortingOption.id) formData.push(`orderby=${encodeURIComponent(sortingOption.id)}`);
				formData.push("submit=Search");
				const url = `${DOMAIN}/advanced.php`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: formData.join("&")
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const $ = load(html);
				const results = await this.parser.parseAdvancedSearchDefault($);
				let hasNextPage = false;
				if ($(".pagination a:contains('Next')").length > 0) hasNextPage = true;
				if (Array.isArray(results)) results.forEach((item) => {
					if (item?.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items: Array.isArray(results) ? results : [],
					metadata: hasNextPage ? { page: page + 1 } : void 0
				};
			} else {
				const params = [];
				if (genreIds.length > 0) for (const id of genreIds) params.push(`genre[]=${encodeURIComponent(id)}`);
				if (typeof statusValue === "string") params.push(`status=${encodeURIComponent(statusValue)}`);
				if (sortingOption && sortingOption.id) params.push(`orderby=${sortingOption.id}`);
				if (page > 1) params.push(`list=${page}`);
				const url = `${DOMAIN}/advanced.php?${params.join("&")}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const html = Application.arrayBufferToUTF8String(buffer);
				const $ = load(html);
				const results = await this.parser.parseAdvancedSearchDefault($);
				let hasNextPage = false;
				if ($(".pagination a:contains('Next')").length > 0) hasNextPage = true;
				if (Array.isArray(results)) results.forEach((item) => {
					if (item?.mangaId) {
						const sanitized = String(item.mangaId).replace(/[^a-zA-Z0-9]/g, "");
						this.idMap[sanitized] = item.mangaId;
					}
				});
				return {
					items: Array.isArray(results) ? results : [],
					metadata: hasNextPage ? { page: page + 1 } : void 0
				};
			}
		}
		async getAdvancedSearchForm(query) {
			return new SearchFilterForm(query.metadata, this.getSearchFilters());
		}
		async getSearchFilters() {
			if (!this.filterOptionsCache || !this.sortingOptionsCache) {
				if (!this.filterSortCachePromise) this.filterSortCachePromise = this.fetchAndCacheFiltersAndSorts();
				await this.filterSortCachePromise;
				this.filterSortCachePromise = null;
			}
			return this.filterOptionsCache;
		}
		async getSortingOptions() {
			if (!this.filterOptionsCache || !this.sortingOptionsCache) {
				if (!this.filterSortCachePromise) this.filterSortCachePromise = this.fetchAndCacheFiltersAndSorts();
				await this.filterSortCachePromise;
				this.filterSortCachePromise = null;
			}
			return this.sortingOptionsCache;
		}
		async getMangaDetails(mangaId) {
			if (!mangaId) throw new Error("[MangaDemon][getMangaDetails] mangaId is required but was not provided");
			const sanitized = typeof mangaId === "string" ? mangaId.replace(/[^a-zA-Z0-9/-]/g, "") : "";
			const realId = this.idMap[sanitized] || mangaId;
			let url = "";
			let cleanId = realId;
			let isNovel = false;
			if (cleanId.startsWith("/novel/")) {
				url = `${DOMAIN}${cleanId}`;
				cleanId = cleanId.replace("/novel/", "");
				isNovel = true;
			} else if (cleanId.startsWith("http")) {
				const match = cleanId.match(/\/manga\/([^/]+)/);
				if (match) cleanId = match[1];
				url = `${DOMAIN}/manga/${encodeURIComponent(cleanId)}`;
			} else if (cleanId.startsWith("/manga/")) {
				cleanId = cleanId.replace("/manga/", "");
				url = `${DOMAIN}/manga/${encodeURIComponent(cleanId)}`;
			} else url = `${DOMAIN}/manga/${encodeURIComponent(cleanId)}`;
			try {
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const $ = load(Application.arrayBufferToUTF8String(buffer));
				if (!$("h1.big-fat-titles").first().text().trim()) throw new Error("No manga title found on manga URL");
				const details = await this.parser.parseMangaDetails($, cleanId);
				if (!details || !details.mangaId || !details.title) throw new Error(`[MangaDemon][getMangaDetails] Invalid manga details: ${JSON.stringify(details)}`);
				return {
					mangaId: isNovel ? `/novel/${cleanId}` : cleanId,
					mangaInfo: {
						primaryTitle: details.title || "No title",
						secondaryTitles: [],
						author: details.author || "Unknown",
						tagGroups: [{
							id: "genres",
							title: "Genres",
							tags: details.genres.map((g) => ({
								id: g.toLowerCase().replace(/\s+/g, "-"),
								title: g
							}))
						}],
						synopsis: details.description || "No description available",
						status: details.status || "Unknown",
						...details.rating !== void 0 ? { rating: details.rating } : {},
						thumbnailUrl: details.cover || "",
						contentRating: ContentRating$1.MATURE
					}
				};
			} catch (error) {
				throw new Error(`[MangaDemon][getMangaDetails] Failed to fetch manga details: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		async getChapters(sourceManga) {
			let cleanMangaId = String(sourceManga.mangaId);
			let url = "";
			if (cleanMangaId.startsWith("/novel/")) {
				url = `${DOMAIN}${cleanMangaId}`;
				cleanMangaId = cleanMangaId.replace("/novel/", "");
			} else if (cleanMangaId.startsWith("http")) {
				const match = cleanMangaId.match(/\/manga\/([^/]+)/);
				if (match) cleanMangaId = match[1];
				url = `${DOMAIN}/manga/${encodeURIComponent(cleanMangaId)}`;
			} else if (cleanMangaId.startsWith("/manga/")) {
				cleanMangaId = cleanMangaId.replace("/manga/", "");
				url = `${DOMAIN}/manga/${encodeURIComponent(cleanMangaId)}`;
			} else url = `${DOMAIN}/manga/${encodeURIComponent(cleanMangaId)}`;
			try {
				const [_response, buffer] = await Application.scheduleRequest({
					url,
					method: "GET"
				});
				const $ = load(Application.arrayBufferToUTF8String(buffer));
				return this.parser.parseChapterList($, sourceManga);
			} catch {
				return [];
			}
		}
		/**
		* Fetches details for a specific chapter (pages/images).
		*/
		async getChapterDetails(chapter) {
			try {
				const chapterUrl = `${DOMAIN}${chapter.chapterId}`;
				const [_response, buffer] = await Application.scheduleRequest({
					url: chapterUrl,
					method: "GET"
				});
				const $ = load(Application.arrayBufferToUTF8String(buffer));
				const pages = await this.parser.parseChapterPages($, chapterUrl);
				return {
					id: chapter.chapterId,
					mangaId: chapter.sourceManga.mangaId,
					pages
				};
			} catch {
				return {
					id: chapter.chapterId,
					mangaId: chapter.sourceManga.mangaId,
					pages: []
				};
			}
		}
		async saveCloudflareBypassCookies(cookies) {
			for (const cookie of cookies) if (cookie.name.startsWith("cf") || cookie.name.startsWith("_cf") || cookie.name.startsWith("__cf")) this.cookieStorageInterceptor.setCookie(cookie);
		}
	};
	const MangaDemon = new MangaDemonExtension();

//#endregion
//#region src/MangaDemon/pbconfig.ts
	var pbconfig_default = {
		name: "MangaDemon",
		description: "Extension that pulls content from demonicscans.org.",
		version: "1.0.0-alpha.13",
		icon: "icon.png",
		language: "en",
		contentRating: ContentRating$1.EVERYONE,
		badges: [],
		capabilities: [
			SourceIntents$1.CHAPTER_PROVIDING,
			SourceIntents$1.CLOUDFLARE_BYPASS_PROVIDING,
			SourceIntents$1.DISCOVER_SECTION_PROVIDING,
			SourceIntents$1.SEARCH_RESULT_PROVIDING,
			SourceIntents$1.SETTINGS_FORM_PROVIDING
		],
		developers: [{
			name: "samipmainali",
			github: "https://github.com/samipmainali"
		}]
	};

//#endregion
//#region node_modules/chai/index.js
	var __defProp = Object.defineProperty;
	var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
		enumerable: true,
		configurable: true,
		writable: true,
		value
	}) : obj[key] = value;
	var __name = (target, value) => __defProp(target, "name", {
		value,
		configurable: true
	});
	var __export = (target, all) => {
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
	};
	var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
	var utils_exports = {};
	__export(utils_exports, {
		addChainableMethod: () => addChainableMethod,
		addLengthGuard: () => addLengthGuard,
		addMethod: () => addMethod,
		addProperty: () => addProperty,
		checkError: () => check_error_exports,
		compareByInspect: () => compareByInspect,
		eql: () => deep_eql_default,
		events: () => events,
		expectTypes: () => expectTypes,
		flag: () => flag,
		getActual: () => getActual,
		getMessage: () => getMessage2,
		getName: () => getName,
		getOperator: () => getOperator,
		getOwnEnumerableProperties: () => getOwnEnumerableProperties,
		getOwnEnumerablePropertySymbols: () => getOwnEnumerablePropertySymbols,
		getPathInfo: () => getPathInfo,
		hasProperty: () => hasProperty,
		inspect: () => inspect2,
		isNaN: () => isNaN2,
		isNumeric: () => isNumeric,
		isProxyEnabled: () => isProxyEnabled,
		isRegExp: () => isRegExp2,
		objDisplay: () => objDisplay,
		overwriteChainableMethod: () => overwriteChainableMethod,
		overwriteMethod: () => overwriteMethod,
		overwriteProperty: () => overwriteProperty,
		proxify: () => proxify,
		test: () => test,
		transferFlags: () => transferFlags,
		type: () => type
	});
	var check_error_exports = {};
	__export(check_error_exports, {
		compatibleConstructor: () => compatibleConstructor,
		compatibleInstance: () => compatibleInstance,
		compatibleMessage: () => compatibleMessage,
		getConstructorName: () => getConstructorName,
		getMessage: () => getMessage
	});
	function isErrorInstance(obj) {
		return obj instanceof Error || Object.prototype.toString.call(obj) === "[object Error]";
	}
	__name(isErrorInstance, "isErrorInstance");
	function isRegExp(obj) {
		return Object.prototype.toString.call(obj) === "[object RegExp]";
	}
	__name(isRegExp, "isRegExp");
	function compatibleInstance(thrown, errorLike) {
		return isErrorInstance(errorLike) && thrown === errorLike;
	}
	__name(compatibleInstance, "compatibleInstance");
	function compatibleConstructor(thrown, errorLike) {
		if (isErrorInstance(errorLike)) return thrown.constructor === errorLike.constructor || thrown instanceof errorLike.constructor;
		else if ((typeof errorLike === "object" || typeof errorLike === "function") && errorLike.prototype) return thrown.constructor === errorLike || thrown instanceof errorLike;
		return false;
	}
	__name(compatibleConstructor, "compatibleConstructor");
	function compatibleMessage(thrown, errMatcher) {
		const comparisonString = typeof thrown === "string" ? thrown : thrown.message;
		if (isRegExp(errMatcher)) return errMatcher.test(comparisonString);
		else if (typeof errMatcher === "string") return comparisonString.indexOf(errMatcher) !== -1;
		return false;
	}
	__name(compatibleMessage, "compatibleMessage");
	function getConstructorName(errorLike) {
		let constructorName = errorLike;
		if (isErrorInstance(errorLike)) constructorName = errorLike.constructor.name;
		else if (typeof errorLike === "function") {
			constructorName = errorLike.name;
			if (constructorName === "") constructorName = new errorLike().name || constructorName;
		}
		return constructorName;
	}
	__name(getConstructorName, "getConstructorName");
	function getMessage(errorLike) {
		let msg = "";
		if (errorLike && errorLike.message) msg = errorLike.message;
		else if (typeof errorLike === "string") msg = errorLike;
		return msg;
	}
	__name(getMessage, "getMessage");
	function flag(obj, key, value) {
		let flags = obj.__flags || (obj.__flags = /* @__PURE__ */ Object.create(null));
		if (arguments.length === 3) flags[key] = value;
		else return flags[key];
	}
	__name(flag, "flag");
	function test(obj, args) {
		let negate = flag(obj, "negate"), expr = args[0];
		return negate ? !expr : expr;
	}
	__name(test, "test");
	function type(obj) {
		if (typeof obj === "undefined") return "undefined";
		if (obj === null) return "null";
		const stringTag = obj[Symbol.toStringTag];
		if (typeof stringTag === "string") return stringTag;
		return Object.prototype.toString.call(obj).slice(8, -1);
	}
	__name(type, "type");
	var canElideFrames = "captureStackTrace" in Error;
	var _AssertionError = class _AssertionError extends Error {
		constructor(message = "Unspecified AssertionError", props, ssf) {
			super(message);
			__publicField(this, "message");
			this.message = message;
			if (canElideFrames) Error.captureStackTrace(this, ssf || _AssertionError);
			for (const key in props) if (!(key in this)) this[key] = props[key];
		}
		get name() {
			return "AssertionError";
		}
		get ok() {
			return false;
		}
		toJSON(stack) {
			return {
				...this,
				name: this.name,
				message: this.message,
				ok: false,
				stack: stack !== false ? this.stack : void 0
			};
		}
	};
	__name(_AssertionError, "AssertionError");
	var AssertionError = _AssertionError;
	function expectTypes(obj, types) {
		let flagMsg = flag(obj, "message");
		let ssfi = flag(obj, "ssfi");
		flagMsg = flagMsg ? flagMsg + ": " : "";
		obj = flag(obj, "object");
		types = types.map(function(t) {
			return t.toLowerCase();
		});
		types.sort();
		let str = types.map(function(t, index) {
			let art = ~[
				"a",
				"e",
				"i",
				"o",
				"u"
			].indexOf(t.charAt(0)) ? "an" : "a";
			return (types.length > 1 && index === types.length - 1 ? "or " : "") + art + " " + t;
		}).join(", ");
		let objType = type(obj).toLowerCase();
		if (!types.some(function(expected) {
			return objType === expected;
		})) throw new AssertionError(flagMsg + "object tested must be " + str + ", but " + objType + " given", void 0, ssfi);
	}
	__name(expectTypes, "expectTypes");
	function getActual(obj, args) {
		return args.length > 4 ? args[4] : obj._obj;
	}
	__name(getActual, "getActual");
	var ansiColors = {
		bold: ["1", "22"],
		dim: ["2", "22"],
		italic: ["3", "23"],
		underline: ["4", "24"],
		inverse: ["7", "27"],
		hidden: ["8", "28"],
		strike: ["9", "29"],
		black: ["30", "39"],
		red: ["31", "39"],
		green: ["32", "39"],
		yellow: ["33", "39"],
		blue: ["34", "39"],
		magenta: ["35", "39"],
		cyan: ["36", "39"],
		white: ["37", "39"],
		brightblack: ["30;1", "39"],
		brightred: ["31;1", "39"],
		brightgreen: ["32;1", "39"],
		brightyellow: ["33;1", "39"],
		brightblue: ["34;1", "39"],
		brightmagenta: ["35;1", "39"],
		brightcyan: ["36;1", "39"],
		brightwhite: ["37;1", "39"],
		grey: ["90", "39"]
	};
	var styles = {
		special: "cyan",
		number: "yellow",
		bigint: "yellow",
		boolean: "yellow",
		undefined: "grey",
		null: "bold",
		string: "green",
		symbol: "green",
		date: "magenta",
		regexp: "red"
	};
	var truncator = "…";
	function colorise(value, styleType) {
		const color = ansiColors[styles[styleType]] || ansiColors[styleType] || "";
		if (!color) return String(value);
		return `\x1B[${color[0]}m${String(value)}\x1B[${color[1]}m`;
	}
	__name(colorise, "colorise");
	function normaliseOptions({ showHidden = false, depth = 2, colors = false, customInspect = true, showProxy = false, maxArrayLength = Infinity, breakLength = Infinity, seen = [], truncate: truncate2 = Infinity, stylize = String } = {}, inspect3) {
		const options = {
			showHidden: Boolean(showHidden),
			depth: Number(depth),
			colors: Boolean(colors),
			customInspect: Boolean(customInspect),
			showProxy: Boolean(showProxy),
			maxArrayLength: Number(maxArrayLength),
			breakLength: Number(breakLength),
			truncate: Number(truncate2),
			seen,
			inspect: inspect3,
			stylize
		};
		if (options.colors) options.stylize = colorise;
		return options;
	}
	__name(normaliseOptions, "normaliseOptions");
	function isHighSurrogate(char) {
		return char >= "\ud800" && char <= "\udbff";
	}
	__name(isHighSurrogate, "isHighSurrogate");
	function truncate(string, length, tail = truncator) {
		string = String(string);
		const tailLength = tail.length;
		const stringLength = string.length;
		if (tailLength > length && stringLength > tailLength) return tail;
		if (stringLength > length && stringLength > tailLength) {
			let end = length - tailLength;
			if (end > 0 && isHighSurrogate(string[end - 1])) end = end - 1;
			return `${string.slice(0, end)}${tail}`;
		}
		return string;
	}
	__name(truncate, "truncate");
	function inspectList(list, options, inspectItem, separator = ", ") {
		inspectItem = inspectItem || options.inspect;
		const size = list.length;
		if (size === 0) return "";
		const originalLength = options.truncate;
		let output = "";
		let peek = "";
		let truncated = "";
		for (let i = 0; i < size; i += 1) {
			const last = i + 1 === list.length;
			const secondToLast = i + 2 === list.length;
			truncated = `${truncator}(${list.length - i})`;
			const value = list[i];
			options.truncate = originalLength - output.length - (last ? 0 : separator.length);
			const string = peek || inspectItem(value, options) + (last ? "" : separator);
			const nextLength = output.length + string.length;
			const truncatedLength = nextLength + truncated.length;
			if (last && nextLength > originalLength && output.length + truncated.length <= originalLength) break;
			if (!last && !secondToLast && truncatedLength > originalLength) break;
			peek = last ? "" : inspectItem(list[i + 1], options) + (secondToLast ? "" : separator);
			if (!last && secondToLast && truncatedLength > originalLength && nextLength + peek.length > originalLength) break;
			output += string;
			if (!last && !secondToLast && nextLength + peek.length >= originalLength) {
				truncated = `${truncator}(${list.length - i - 1})`;
				break;
			}
			truncated = "";
		}
		return `${output}${truncated}`;
	}
	__name(inspectList, "inspectList");
	function quoteComplexKey(key) {
		if (key.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)) return key;
		return JSON.stringify(key).replace(/'/g, "\\'").replace(/\\"/g, "\"").replace(/(^"|"$)/g, "'");
	}
	__name(quoteComplexKey, "quoteComplexKey");
	function inspectProperty([key, value], options) {
		options.truncate -= 2;
		if (typeof key === "string") key = quoteComplexKey(key);
		else if (typeof key !== "number") key = `[${options.inspect(key, options)}]`;
		options.truncate -= key.length;
		value = options.inspect(value, options);
		return `${key}: ${value}`;
	}
	__name(inspectProperty, "inspectProperty");
	function inspectArray(array, options) {
		const nonIndexProperties = Object.keys(array).slice(array.length);
		if (!array.length && !nonIndexProperties.length) return "[]";
		options.truncate -= 4;
		const listContents = inspectList(array, options);
		options.truncate -= listContents.length;
		let propertyContents = "";
		if (nonIndexProperties.length) propertyContents = inspectList(nonIndexProperties.map((key) => [key, array[key]]), options, inspectProperty);
		return `[ ${listContents}${propertyContents ? `, ${propertyContents}` : ""} ]`;
	}
	__name(inspectArray, "inspectArray");
	var getArrayName = /* @__PURE__ */ __name((array) => {
		if (typeof Buffer === "function" && array instanceof Buffer) return "Buffer";
		if (array[Symbol.toStringTag]) return array[Symbol.toStringTag];
		return array.constructor.name;
	}, "getArrayName");
	function inspectTypedArray(array, options) {
		const name = getArrayName(array);
		options.truncate -= name.length + 4;
		const nonIndexProperties = Object.keys(array).slice(array.length);
		if (!array.length && !nonIndexProperties.length) return `${name}[]`;
		let output = "";
		for (let i = 0; i < array.length; i++) {
			const string = `${options.stylize(truncate(array[i], options.truncate), "number")}${i === array.length - 1 ? "" : ", "}`;
			options.truncate -= string.length;
			if (array[i] !== array.length && options.truncate <= 3) {
				output += `${truncator}(${array.length - array[i] + 1})`;
				break;
			}
			output += string;
		}
		let propertyContents = "";
		if (nonIndexProperties.length) propertyContents = inspectList(nonIndexProperties.map((key) => [key, array[key]]), options, inspectProperty);
		return `${name}[ ${output}${propertyContents ? `, ${propertyContents}` : ""} ]`;
	}
	__name(inspectTypedArray, "inspectTypedArray");
	function inspectDate(dateObject, options) {
		const stringRepresentation = dateObject.toJSON();
		if (stringRepresentation === null) return "Invalid Date";
		const split = stringRepresentation.split("T");
		const date = split[0];
		return options.stylize(`${date}T${truncate(split[1], options.truncate - date.length - 1)}`, "date");
	}
	__name(inspectDate, "inspectDate");
	function inspectFunction(func, options) {
		const functionType = func[Symbol.toStringTag] || "Function";
		const name = func.name;
		if (!name) return options.stylize(`[${functionType}]`, "special");
		return options.stylize(`[${functionType} ${truncate(name, options.truncate - 11)}]`, "special");
	}
	__name(inspectFunction, "inspectFunction");
	function inspectMapEntry([key, value], options) {
		options.truncate -= 4;
		key = options.inspect(key, options);
		options.truncate -= key.length;
		value = options.inspect(value, options);
		return `${key} => ${value}`;
	}
	__name(inspectMapEntry, "inspectMapEntry");
	function mapToEntries(map) {
		const entries = [];
		map.forEach((value, key) => {
			entries.push([key, value]);
		});
		return entries;
	}
	__name(mapToEntries, "mapToEntries");
	function inspectMap(map, options) {
		if (map.size === 0) return "Map{}";
		options.truncate -= 7;
		return `Map{ ${inspectList(mapToEntries(map), options, inspectMapEntry)} }`;
	}
	__name(inspectMap, "inspectMap");
	var isNaN$1 = Number.isNaN || ((i) => i !== i);
	function inspectNumber(number, options) {
		if (isNaN$1(number)) return options.stylize("NaN", "number");
		if (number === Infinity) return options.stylize("Infinity", "number");
		if (number === -Infinity) return options.stylize("-Infinity", "number");
		if (number === 0) return options.stylize(1 / number === Infinity ? "+0" : "-0", "number");
		return options.stylize(truncate(String(number), options.truncate), "number");
	}
	__name(inspectNumber, "inspectNumber");
	function inspectBigInt(number, options) {
		let nums = truncate(number.toString(), options.truncate - 1);
		if (nums !== truncator) nums += "n";
		return options.stylize(nums, "bigint");
	}
	__name(inspectBigInt, "inspectBigInt");
	function inspectRegExp(value, options) {
		const flags = value.toString().split("/")[2];
		const sourceLength = options.truncate - (2 + flags.length);
		const source = value.source;
		return options.stylize(`/${truncate(source, sourceLength)}/${flags}`, "regexp");
	}
	__name(inspectRegExp, "inspectRegExp");
	function arrayFromSet(set2) {
		const values = [];
		set2.forEach((value) => {
			values.push(value);
		});
		return values;
	}
	__name(arrayFromSet, "arrayFromSet");
	function inspectSet(set2, options) {
		if (set2.size === 0) return "Set{}";
		options.truncate -= 7;
		return `Set{ ${inspectList(arrayFromSet(set2), options)} }`;
	}
	__name(inspectSet, "inspectSet");
	var stringEscapeChars = /* @__PURE__ */ new RegExp("['\\u0000-\\u001f\\u007f-\\u009f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]", "g");
	var escapeCharacters = {
		"\b": "\\b",
		"	": "\\t",
		"\n": "\\n",
		"\f": "\\f",
		"\r": "\\r",
		"'": "\\'",
		"\\": "\\\\"
	};
	var hex = 16;
	var unicodeLength = 4;
	function escape(char) {
		return escapeCharacters[char] || `\\u${`0000${char.charCodeAt(0).toString(hex)}`.slice(-unicodeLength)}`;
	}
	__name(escape, "escape");
	function inspectString(string, options) {
		if (stringEscapeChars.test(string)) string = string.replace(stringEscapeChars, escape);
		return options.stylize(`'${truncate(string, options.truncate - 2)}'`, "string");
	}
	__name(inspectString, "inspectString");
	function inspectSymbol(value) {
		if ("description" in Symbol.prototype) return value.description ? `Symbol(${value.description})` : "Symbol()";
		return value.toString();
	}
	__name(inspectSymbol, "inspectSymbol");
	var promise_default = /* @__PURE__ */ __name(() => "Promise{…}", "getPromiseValue");
	function inspectObject(object, options) {
		const properties = Object.getOwnPropertyNames(object);
		const symbols = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(object) : [];
		if (properties.length === 0 && symbols.length === 0) return "{}";
		options.truncate -= 4;
		options.seen = options.seen || [];
		if (options.seen.includes(object)) return "[Circular]";
		options.seen.push(object);
		const propertyContents = inspectList(properties.map((key) => [key, object[key]]), options, inspectProperty);
		const symbolContents = inspectList(symbols.map((key) => [key, object[key]]), options, inspectProperty);
		options.seen.pop();
		let sep = "";
		if (propertyContents && symbolContents) sep = ", ";
		return `{ ${propertyContents}${sep}${symbolContents} }`;
	}
	__name(inspectObject, "inspectObject");
	var toStringTag = typeof Symbol !== "undefined" && Symbol.toStringTag ? Symbol.toStringTag : false;
	function inspectClass(value, options) {
		let name = "";
		if (toStringTag && toStringTag in value) name = value[toStringTag];
		name = name || value.constructor.name;
		if (!name || name === "_class") name = "<Anonymous Class>";
		options.truncate -= name.length;
		return `${name}${inspectObject(value, options)}`;
	}
	__name(inspectClass, "inspectClass");
	function inspectArguments(args, options) {
		if (args.length === 0) return "Arguments[]";
		options.truncate -= 13;
		return `Arguments[ ${inspectList(args, options)} ]`;
	}
	__name(inspectArguments, "inspectArguments");
	var errorKeys = [
		"stack",
		"line",
		"column",
		"name",
		"message",
		"fileName",
		"lineNumber",
		"columnNumber",
		"number",
		"description",
		"cause"
	];
	function inspectObject2(error, options) {
		const properties = Object.getOwnPropertyNames(error).filter((key) => errorKeys.indexOf(key) === -1);
		const name = error.name;
		options.truncate -= name.length;
		let message = "";
		if (typeof error.message === "string") message = truncate(error.message, options.truncate);
		else properties.unshift("message");
		message = message ? `: ${message}` : "";
		options.truncate -= message.length + 5;
		options.seen = options.seen || [];
		if (options.seen.includes(error)) return "[Circular]";
		options.seen.push(error);
		const propertyContents = inspectList(properties.map((key) => [key, error[key]]), options, inspectProperty);
		return `${name}${message}${propertyContents ? ` { ${propertyContents} }` : ""}`;
	}
	__name(inspectObject2, "inspectObject");
	function inspectAttribute([key, value], options) {
		options.truncate -= 3;
		if (!value) return `${options.stylize(String(key), "yellow")}`;
		return `${options.stylize(String(key), "yellow")}=${options.stylize(`"${value}"`, "string")}`;
	}
	__name(inspectAttribute, "inspectAttribute");
	function inspectNodeCollection(collection, options) {
		return inspectList(collection, options, inspectNode, "\n");
	}
	__name(inspectNodeCollection, "inspectNodeCollection");
	function inspectNode(node, options) {
		switch (node.nodeType) {
			case 1: return inspectHTML(node, options);
			case 3: return options.inspect(node.data, options);
			default: return options.inspect(node, options);
		}
	}
	__name(inspectNode, "inspectNode");
	function inspectHTML(element, options) {
		const properties = element.getAttributeNames();
		const name = element.tagName.toLowerCase();
		const head = options.stylize(`<${name}`, "special");
		const headClose = options.stylize(`>`, "special");
		const tail = options.stylize(`</${name}>`, "special");
		options.truncate -= name.length * 2 + 5;
		let propertyContents = "";
		if (properties.length > 0) {
			propertyContents += " ";
			propertyContents += inspectList(properties.map((key) => [key, element.getAttribute(key)]), options, inspectAttribute, " ");
		}
		options.truncate -= propertyContents.length;
		const truncate2 = options.truncate;
		let children = inspectNodeCollection(element.children, options);
		if (children && children.length > truncate2) children = `${truncator}(${element.children.length})`;
		return `${head}${propertyContents}${headClose}${children}${tail}`;
	}
	__name(inspectHTML, "inspectHTML");
	var chaiInspect = typeof Symbol === "function" && typeof Symbol.for === "function" ? /* @__PURE__ */ Symbol.for("chai/inspect") : "@@chai/inspect";
	var nodeInspect = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
	var constructorMap = /* @__PURE__ */ new WeakMap();
	var stringTagMap = {};
	var baseTypesMap = {
		undefined: /* @__PURE__ */ __name((value, options) => options.stylize("undefined", "undefined"), "undefined"),
		null: /* @__PURE__ */ __name((value, options) => options.stylize("null", "null"), "null"),
		boolean: /* @__PURE__ */ __name((value, options) => options.stylize(String(value), "boolean"), "boolean"),
		Boolean: /* @__PURE__ */ __name((value, options) => options.stylize(String(value), "boolean"), "Boolean"),
		number: inspectNumber,
		Number: inspectNumber,
		bigint: inspectBigInt,
		BigInt: inspectBigInt,
		string: inspectString,
		String: inspectString,
		function: inspectFunction,
		Function: inspectFunction,
		symbol: inspectSymbol,
		Symbol: inspectSymbol,
		Array: inspectArray,
		Date: inspectDate,
		Map: inspectMap,
		Set: inspectSet,
		RegExp: inspectRegExp,
		Promise: promise_default,
		WeakSet: /* @__PURE__ */ __name((value, options) => options.stylize("WeakSet{…}", "special"), "WeakSet"),
		WeakMap: /* @__PURE__ */ __name((value, options) => options.stylize("WeakMap{…}", "special"), "WeakMap"),
		Arguments: inspectArguments,
		Int8Array: inspectTypedArray,
		Uint8Array: inspectTypedArray,
		Uint8ClampedArray: inspectTypedArray,
		Int16Array: inspectTypedArray,
		Uint16Array: inspectTypedArray,
		Int32Array: inspectTypedArray,
		Uint32Array: inspectTypedArray,
		Float32Array: inspectTypedArray,
		Float64Array: inspectTypedArray,
		Generator: /* @__PURE__ */ __name(() => "", "Generator"),
		DataView: /* @__PURE__ */ __name(() => "", "DataView"),
		ArrayBuffer: /* @__PURE__ */ __name(() => "", "ArrayBuffer"),
		Error: inspectObject2,
		HTMLCollection: inspectNodeCollection,
		NodeList: inspectNodeCollection
	};
	var inspectCustom = /* @__PURE__ */ __name((value, options, type3, inspectFn) => {
		if (chaiInspect in value && typeof value[chaiInspect] === "function") return value[chaiInspect](options);
		if (nodeInspect in value && typeof value[nodeInspect] === "function") return value[nodeInspect](options.depth, options, inspectFn);
		if ("inspect" in value && typeof value.inspect === "function") return value.inspect(options.depth, options);
		if ("constructor" in value && constructorMap.has(value.constructor)) return constructorMap.get(value.constructor)(value, options);
		if (stringTagMap[type3]) return stringTagMap[type3](value, options);
		return "";
	}, "inspectCustom");
	var toString = Object.prototype.toString;
	function inspect(value, opts = {}) {
		const options = normaliseOptions(opts, inspect);
		const { customInspect } = options;
		let type3 = value === null ? "null" : typeof value;
		if (type3 === "object") type3 = toString.call(value).slice(8, -1);
		if (type3 in baseTypesMap) return baseTypesMap[type3](value, options);
		if (customInspect && value) {
			const output = inspectCustom(value, options, type3, inspect);
			if (output) {
				if (typeof output === "string") return output;
				return inspect(output, options);
			}
		}
		const proto = value ? Object.getPrototypeOf(value) : false;
		if (proto === Object.prototype || proto === null) return inspectObject(value, options);
		if (value && typeof HTMLElement === "function" && value instanceof HTMLElement) return inspectHTML(value, options);
		if ("constructor" in value) {
			if (value.constructor !== Object) return inspectClass(value, options);
			return inspectObject(value, options);
		}
		if (value === Object(value)) return inspectObject(value, options);
		return options.stylize(String(value), type3);
	}
	__name(inspect, "inspect");
	var config = {
		/**
		* ### config.includeStack
		*
		* User configurable property, influences whether stack trace
		* is included in Assertion error message. Default of false
		* suppresses stack trace in the error message.
		*
		*     chai.config.includeStack = true;  // enable stack on error
		*
		* @param {boolean}
		* @public
		*/
		includeStack: false,
		/**
		* ### config.showDiff
		*
		* User configurable property, influences whether or not
		* the `showDiff` flag should be included in the thrown
		* AssertionErrors. `false` will always be `false`; `true`
		* will be true when the assertion has requested a diff
		* be shown.
		*
		* @param {boolean}
		* @public
		*/
		showDiff: true,
		/**
		* ### config.truncateThreshold
		*
		* User configurable property, sets length threshold for actual and
		* expected values in assertion errors. If this threshold is exceeded, for
		* example for large data structures, the value is replaced with something
		* like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
		*
		* Set it to zero if you want to disable truncating altogether.
		*
		* This is especially userful when doing assertions on arrays: having this
		* set to a reasonable large value makes the failure messages readily
		* inspectable.
		*
		*     chai.config.truncateThreshold = 0;  // disable truncating
		*
		* @param {number}
		* @public
		*/
		truncateThreshold: 40,
		/**
		* ### config.useProxy
		*
		* User configurable property, defines if chai will use a Proxy to throw
		* an error when a non-existent property is read, which protects users
		* from typos when using property-based assertions.
		*
		* Set it to false if you want to disable this feature.
		*
		*     chai.config.useProxy = false;  // disable use of Proxy
		*
		* This feature is automatically disabled regardless of this config value
		* in environments that don't support proxies.
		*
		* @param {boolean}
		* @public
		*/
		useProxy: true,
		/**
		* ### config.proxyExcludedKeys
		*
		* User configurable property, defines which properties should be ignored
		* instead of throwing an error if they do not exist on the assertion.
		* This is only applied if the environment Chai is running in supports proxies and
		* if the `useProxy` configuration setting is enabled.
		* By default, `then` and `inspect` will not throw an error if they do not exist on the
		* assertion object because the `.inspect` property is read by `util.inspect` (for example, when
		* using `console.log` on the assertion object) and `.then` is necessary for promise type-checking.
		*
		*     // By default these keys will not throw an error if they do not exist on the assertion object
		*     chai.config.proxyExcludedKeys = ['then', 'inspect'];
		*
		* @param {Array}
		* @public
		*/
		proxyExcludedKeys: [
			"then",
			"catch",
			"inspect",
			"toJSON"
		],
		/**
		* ### config.deepEqual
		*
		* User configurable property, defines which a custom function to use for deepEqual
		* comparisons.
		* By default, the function used is the one from the `deep-eql` package without custom comparator.
		*
		*     // use a custom comparator
		*     chai.config.deepEqual = (expected, actual) => {
		*         return chai.util.eql(expected, actual, {
		*             comparator: (expected, actual) => {
		*                 // for non number comparison, use the default behavior
		*                 if(typeof expected !== 'number') return null;
		*                 // allow a difference of 10 between compared numbers
		*                 return typeof actual === 'number' && Math.abs(actual - expected) < 10
		*             }
		*         })
		*     };
		*
		* @param {Function}
		* @public
		*/
		deepEqual: null
	};
	function inspect2(obj, showHidden, depth, colors) {
		return inspect(obj, {
			colors,
			depth: typeof depth === "undefined" ? 2 : depth,
			showHidden,
			truncate: config.truncateThreshold ? config.truncateThreshold : Infinity
		});
	}
	__name(inspect2, "inspect");
	function objDisplay(obj) {
		let str = inspect2(obj), type3 = Object.prototype.toString.call(obj);
		if (config.truncateThreshold && str.length >= config.truncateThreshold) if (type3 === "[object Function]") return !obj.name || obj.name === "" ? "[Function]" : "[Function: " + obj.name + "]";
		else if (type3 === "[object Array]") return "[ Array(" + obj.length + ") ]";
		else if (type3 === "[object Object]") {
			let keys = Object.keys(obj);
			return "{ Object (" + (keys.length > 2 ? keys.splice(0, 2).join(", ") + ", ..." : keys.join(", ")) + ") }";
		} else return str;
		else return str;
	}
	__name(objDisplay, "objDisplay");
	function getMessage2(obj, args) {
		let negate = flag(obj, "negate");
		let val = flag(obj, "object");
		let expected = args[3];
		let actual = getActual(obj, args);
		let msg = negate ? args[2] : args[1];
		let flagMsg = flag(obj, "message");
		if (typeof msg === "function") msg = msg();
		msg = msg || "";
		msg = msg.replace(/#\{this\}/g, function() {
			return objDisplay(val);
		}).replace(/#\{act\}/g, function() {
			return objDisplay(actual);
		}).replace(/#\{exp\}/g, function() {
			return objDisplay(expected);
		});
		return flagMsg ? flagMsg + ": " + msg : msg;
	}
	__name(getMessage2, "getMessage");
	function transferFlags(assertion, object, includeAll) {
		let flags = assertion.__flags || (assertion.__flags = /* @__PURE__ */ Object.create(null));
		if (!object.__flags) object.__flags = /* @__PURE__ */ Object.create(null);
		includeAll = arguments.length === 3 ? includeAll : true;
		for (let flag3 in flags) if (includeAll || flag3 !== "object" && flag3 !== "ssfi" && flag3 !== "lockSsfi" && flag3 != "message") object.__flags[flag3] = flags[flag3];
	}
	__name(transferFlags, "transferFlags");
	function type2(obj) {
		if (typeof obj === "undefined") return "undefined";
		if (obj === null) return "null";
		const stringTag = obj[Symbol.toStringTag];
		if (typeof stringTag === "string") return stringTag;
		return Object.prototype.toString.call(obj).slice(8, -1);
	}
	__name(type2, "type");
	function FakeMap() {
		this._key = "chai/deep-eql__" + Math.random() + Date.now();
	}
	__name(FakeMap, "FakeMap");
	FakeMap.prototype = {
		get: /* @__PURE__ */ __name(function get(key) {
			return key[this._key];
		}, "get"),
		set: /* @__PURE__ */ __name(function set(key, value) {
			if (Object.isExtensible(key)) Object.defineProperty(key, this._key, {
				value,
				configurable: true
			});
		}, "set")
	};
	var MemoizeMap = typeof WeakMap === "function" ? WeakMap : FakeMap;
	function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
		if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) return null;
		var leftHandMap = memoizeMap.get(leftHandOperand);
		if (leftHandMap) {
			var result = leftHandMap.get(rightHandOperand);
			if (typeof result === "boolean") return result;
		}
		return null;
	}
	__name(memoizeCompare, "memoizeCompare");
	function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
		if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) return;
		var leftHandMap = memoizeMap.get(leftHandOperand);
		if (leftHandMap) leftHandMap.set(rightHandOperand, result);
		else {
			leftHandMap = new MemoizeMap();
			leftHandMap.set(rightHandOperand, result);
			memoizeMap.set(leftHandOperand, leftHandMap);
		}
	}
	__name(memoizeSet, "memoizeSet");
	var deep_eql_default = deepEqual;
	function deepEqual(leftHandOperand, rightHandOperand, options) {
		if (options && options.comparator) return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
		var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
		if (simpleResult !== null) return simpleResult;
		return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
	}
	__name(deepEqual, "deepEqual");
	function simpleEqual(leftHandOperand, rightHandOperand) {
		if (leftHandOperand === rightHandOperand) return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
		if (leftHandOperand !== leftHandOperand && rightHandOperand !== rightHandOperand) return true;
		if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) return false;
		return null;
	}
	__name(simpleEqual, "simpleEqual");
	function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
		options = options || {};
		options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
		var comparator = options && options.comparator;
		var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
		if (memoizeResultLeft !== null) return memoizeResultLeft;
		var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
		if (memoizeResultRight !== null) return memoizeResultRight;
		if (comparator) {
			var comparatorResult = comparator(leftHandOperand, rightHandOperand);
			if (comparatorResult === false || comparatorResult === true) {
				memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
				return comparatorResult;
			}
			var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
			if (simpleResult !== null) return simpleResult;
		}
		var leftHandType = type2(leftHandOperand);
		if (leftHandType !== type2(rightHandOperand)) {
			memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
			return false;
		}
		memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);
		var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
		memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
		return result;
	}
	__name(extensiveDeepEqual, "extensiveDeepEqual");
	function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
		switch (leftHandType) {
			case "String":
			case "Number":
			case "Boolean":
			case "Date": return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
			case "Promise":
			case "Symbol":
			case "function":
			case "WeakMap":
			case "WeakSet": return leftHandOperand === rightHandOperand;
			case "Error": return keysEqual(leftHandOperand, rightHandOperand, [
				"name",
				"message",
				"code"
			], options);
			case "Arguments":
			case "Int8Array":
			case "Uint8Array":
			case "Uint8ClampedArray":
			case "Int16Array":
			case "Uint16Array":
			case "Int32Array":
			case "Uint32Array":
			case "Float32Array":
			case "Float64Array":
			case "Array": return iterableEqual(leftHandOperand, rightHandOperand, options);
			case "RegExp": return regexpEqual(leftHandOperand, rightHandOperand);
			case "Generator": return generatorEqual(leftHandOperand, rightHandOperand, options);
			case "DataView": return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
			case "ArrayBuffer": return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
			case "Set": return entriesEqual(leftHandOperand, rightHandOperand, options);
			case "Map": return entriesEqual(leftHandOperand, rightHandOperand, options);
			case "Temporal.PlainDate":
			case "Temporal.PlainTime":
			case "Temporal.PlainDateTime":
			case "Temporal.Instant":
			case "Temporal.ZonedDateTime":
			case "Temporal.PlainYearMonth":
			case "Temporal.PlainMonthDay": return leftHandOperand.equals(rightHandOperand);
			case "Temporal.Duration": return leftHandOperand.total("nanoseconds") === rightHandOperand.total("nanoseconds");
			case "Temporal.TimeZone":
			case "Temporal.Calendar": return leftHandOperand.toString() === rightHandOperand.toString();
			default: return objectEqual(leftHandOperand, rightHandOperand, options);
		}
	}
	__name(extensiveDeepEqualByType, "extensiveDeepEqualByType");
	function regexpEqual(leftHandOperand, rightHandOperand) {
		return leftHandOperand.toString() === rightHandOperand.toString();
	}
	__name(regexpEqual, "regexpEqual");
	function entriesEqual(leftHandOperand, rightHandOperand, options) {
		try {
			if (leftHandOperand.size !== rightHandOperand.size) return false;
			if (leftHandOperand.size === 0) return true;
		} catch (sizeError) {
			return false;
		}
		var leftHandItems = [];
		var rightHandItems = [];
		leftHandOperand.forEach(/* @__PURE__ */ __name(function gatherEntries(key, value) {
			leftHandItems.push([key, value]);
		}, "gatherEntries"));
		rightHandOperand.forEach(/* @__PURE__ */ __name(function gatherEntries(key, value) {
			rightHandItems.push([key, value]);
		}, "gatherEntries"));
		return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
	}
	__name(entriesEqual, "entriesEqual");
	function iterableEqual(leftHandOperand, rightHandOperand, options) {
		var length = leftHandOperand.length;
		if (length !== rightHandOperand.length) return false;
		if (length === 0) return true;
		var index = -1;
		while (++index < length) if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) return false;
		return true;
	}
	__name(iterableEqual, "iterableEqual");
	function generatorEqual(leftHandOperand, rightHandOperand, options) {
		return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
	}
	__name(generatorEqual, "generatorEqual");
	function hasIteratorFunction(target) {
		return typeof Symbol !== "undefined" && typeof target === "object" && typeof Symbol.iterator !== "undefined" && typeof target[Symbol.iterator] === "function";
	}
	__name(hasIteratorFunction, "hasIteratorFunction");
	function getIteratorEntries(target) {
		if (hasIteratorFunction(target)) try {
			return getGeneratorEntries(target[Symbol.iterator]());
		} catch (iteratorError) {
			return [];
		}
		return [];
	}
	__name(getIteratorEntries, "getIteratorEntries");
	function getGeneratorEntries(generator) {
		var generatorResult = generator.next();
		var accumulator = [generatorResult.value];
		while (generatorResult.done === false) {
			generatorResult = generator.next();
			accumulator.push(generatorResult.value);
		}
		return accumulator;
	}
	__name(getGeneratorEntries, "getGeneratorEntries");
	function getEnumerableKeys(target) {
		var keys = [];
		for (var key in target) keys.push(key);
		return keys;
	}
	__name(getEnumerableKeys, "getEnumerableKeys");
	function getEnumerableSymbols(target) {
		var keys = [];
		var allKeys = Object.getOwnPropertySymbols(target);
		for (var i = 0; i < allKeys.length; i += 1) {
			var key = allKeys[i];
			if (Object.getOwnPropertyDescriptor(target, key).enumerable) keys.push(key);
		}
		return keys;
	}
	__name(getEnumerableSymbols, "getEnumerableSymbols");
	function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
		var length = keys.length;
		if (length === 0) return true;
		for (var i = 0; i < length; i += 1) if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) return false;
		return true;
	}
	__name(keysEqual, "keysEqual");
	function objectEqual(leftHandOperand, rightHandOperand, options) {
		var leftHandKeys = getEnumerableKeys(leftHandOperand);
		var rightHandKeys = getEnumerableKeys(rightHandOperand);
		var leftHandSymbols = getEnumerableSymbols(leftHandOperand);
		var rightHandSymbols = getEnumerableSymbols(rightHandOperand);
		leftHandKeys = leftHandKeys.concat(leftHandSymbols);
		rightHandKeys = rightHandKeys.concat(rightHandSymbols);
		if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
			if (iterableEqual(mapSymbols(leftHandKeys).sort(), mapSymbols(rightHandKeys).sort()) === false) return false;
			return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
		}
		var leftHandEntries = getIteratorEntries(leftHandOperand);
		var rightHandEntries = getIteratorEntries(rightHandOperand);
		if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
			leftHandEntries.sort();
			rightHandEntries.sort();
			return iterableEqual(leftHandEntries, rightHandEntries, options);
		}
		if (leftHandKeys.length === 0 && leftHandEntries.length === 0 && rightHandKeys.length === 0 && rightHandEntries.length === 0) return true;
		return false;
	}
	__name(objectEqual, "objectEqual");
	function isPrimitive(value) {
		return value === null || typeof value !== "object";
	}
	__name(isPrimitive, "isPrimitive");
	function mapSymbols(arr) {
		return arr.map(/* @__PURE__ */ __name(function mapSymbol(entry) {
			if (typeof entry === "symbol") return entry.toString();
			return entry;
		}, "mapSymbol"));
	}
	__name(mapSymbols, "mapSymbols");
	function hasProperty(obj, name) {
		if (typeof obj === "undefined" || obj === null) return false;
		return name in Object(obj);
	}
	__name(hasProperty, "hasProperty");
	function parsePath(path) {
		return path.replace(/([^\\])\[/g, "$1.[").match(/(\\\.|[^.]+?)+/g).map((value) => {
			if (value === "constructor" || value === "__proto__" || value === "prototype") return {};
			const mArr = /^\[(\d+)\]$/.exec(value);
			let parsed = null;
			if (mArr) parsed = { i: parseFloat(mArr[1]) };
			else parsed = { p: value.replace(/\\([.[\]])/g, "$1") };
			return parsed;
		});
	}
	__name(parsePath, "parsePath");
	function internalGetPathValue(obj, parsed, pathDepth) {
		let temporaryValue = obj;
		let res = null;
		pathDepth = typeof pathDepth === "undefined" ? parsed.length : pathDepth;
		for (let i = 0; i < pathDepth; i++) {
			const part = parsed[i];
			if (temporaryValue) {
				if (typeof part.p === "undefined") temporaryValue = temporaryValue[part.i];
				else temporaryValue = temporaryValue[part.p];
				if (i === pathDepth - 1) res = temporaryValue;
			}
		}
		return res;
	}
	__name(internalGetPathValue, "internalGetPathValue");
	function getPathInfo(obj, path) {
		const parsed = parsePath(path);
		const last = parsed[parsed.length - 1];
		const info = {
			parent: parsed.length > 1 ? internalGetPathValue(obj, parsed, parsed.length - 1) : obj,
			name: last.p || last.i,
			value: internalGetPathValue(obj, parsed)
		};
		info.exists = hasProperty(info.parent, info.name);
		return info;
	}
	__name(getPathInfo, "getPathInfo");
	var _Assertion = class _Assertion {
		/**
		* Creates object for chaining.
		* `Assertion` objects contain metadata in the form of flags. Three flags can
		* be assigned during instantiation by passing arguments to this constructor:
		*
		* - `object`: This flag contains the target of the assertion. For example, in
		* the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
		* contain `numKittens` so that the `equal` assertion can reference it when
		* needed.
		*
		* - `message`: This flag contains an optional custom error message to be
		* prepended to the error message that's generated by the assertion when it
		* fails.
		*
		* - `ssfi`: This flag stands for "start stack function indicator". It
		* contains a function reference that serves as the starting point for
		* removing frames from the stack trace of the error that's created by the
		* assertion when it fails. The goal is to provide a cleaner stack trace to
		* end users by removing Chai's internal functions. Note that it only works
		* in environments that support `Error.captureStackTrace`, and only when
		* `Chai.config.includeStack` hasn't been set to `false`.
		*
		* - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
		* should retain its current value, even as assertions are chained off of
		* this object. This is usually set to `true` when creating a new assertion
		* from within another assertion. It's also temporarily set to `true` before
		* an overwritten assertion gets called by the overwriting assertion.
		*
		* - `eql`: This flag contains the deepEqual function to be used by the assertion.
		*
		* @param {unknown} obj target of the assertion
		* @param {string} [msg] (optional) custom error message
		* @param {Function} [ssfi] (optional) starting point for removing stack frames
		* @param {boolean} [lockSsfi] (optional) whether or not the ssfi flag is locked
		*/
		constructor(obj, msg, ssfi, lockSsfi) {
			/** @type {{}} */
			__publicField(this, "__flags", {});
			flag(this, "ssfi", ssfi || _Assertion);
			flag(this, "lockSsfi", lockSsfi);
			flag(this, "object", obj);
			flag(this, "message", msg);
			flag(this, "eql", config.deepEqual || deep_eql_default);
			return proxify(this);
		}
		/** @returns {boolean} */
		static get includeStack() {
			console.warn("Assertion.includeStack is deprecated, use chai.config.includeStack instead.");
			return config.includeStack;
		}
		/** @param {boolean} value */
		static set includeStack(value) {
			console.warn("Assertion.includeStack is deprecated, use chai.config.includeStack instead.");
			config.includeStack = value;
		}
		/** @returns {boolean} */
		static get showDiff() {
			console.warn("Assertion.showDiff is deprecated, use chai.config.showDiff instead.");
			return config.showDiff;
		}
		/** @param {boolean} value */
		static set showDiff(value) {
			console.warn("Assertion.showDiff is deprecated, use chai.config.showDiff instead.");
			config.showDiff = value;
		}
		/**
		* @param {string} name
		* @param {Function} fn
		*/
		static addProperty(name, fn) {
			addProperty(this.prototype, name, fn);
		}
		/**
		* @param {string} name
		* @param {Function} fn
		*/
		static addMethod(name, fn) {
			addMethod(this.prototype, name, fn);
		}
		/**
		* @param {string} name
		* @param {Function} fn
		* @param {Function} chainingBehavior
		*/
		static addChainableMethod(name, fn, chainingBehavior) {
			addChainableMethod(this.prototype, name, fn, chainingBehavior);
		}
		/**
		* @param {string} name
		* @param {Function} fn
		*/
		static overwriteProperty(name, fn) {
			overwriteProperty(this.prototype, name, fn);
		}
		/**
		* @param {string} name
		* @param {Function} fn
		*/
		static overwriteMethod(name, fn) {
			overwriteMethod(this.prototype, name, fn);
		}
		/**
		* @param {string} name
		* @param {Function} fn
		* @param {Function} chainingBehavior
		*/
		static overwriteChainableMethod(name, fn, chainingBehavior) {
			overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
		}
		/**
		* ### .assert(expression, message, negateMessage, expected, actual, showDiff)
		*
		* Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
		*
		* @name assert
		* @param {unknown} _expr to be tested
		* @param {string | Function} msg or function that returns message to display if expression fails
		* @param {string | Function} _negateMsg or function that returns negatedMessage to display if negated expression fails
		* @param {unknown} expected value (remember to check for negation)
		* @param {unknown} _actual (optional) will default to `this.obj`
		* @param {boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
		* @returns {void}
		*/
		assert(_expr, msg, _negateMsg, expected, _actual, showDiff) {
			const ok = test(this, arguments);
			if (false !== showDiff) showDiff = true;
			if (void 0 === expected && void 0 === _actual) showDiff = false;
			if (true !== config.showDiff) showDiff = false;
			if (!ok) {
				msg = getMessage2(this, arguments);
				const assertionErrorObjectProperties = {
					actual: getActual(this, arguments),
					expected,
					showDiff
				};
				const operator = getOperator(this, arguments);
				if (operator) assertionErrorObjectProperties.operator = operator;
				throw new AssertionError(msg, assertionErrorObjectProperties, config.includeStack ? this.assert : flag(this, "ssfi"));
			}
		}
		/**
		* Quick reference to stored `actual` value for plugin developers.
		*
		* @returns {unknown}
		*/
		get _obj() {
			return flag(this, "object");
		}
		/**
		* Quick reference to stored `actual` value for plugin developers.
		*
		* @param {unknown} val
		*/
		set _obj(val) {
			flag(this, "object", val);
		}
	};
	__name(_Assertion, "Assertion");
	var Assertion = _Assertion;
	var events = new EventTarget();
	var _PluginEvent = class _PluginEvent extends Event {
		constructor(type3, name, fn) {
			super(type3);
			this.name = String(name);
			this.fn = fn;
		}
	};
	__name(_PluginEvent, "PluginEvent");
	var PluginEvent = _PluginEvent;
	function isProxyEnabled() {
		return config.useProxy && typeof Proxy !== "undefined" && typeof Reflect !== "undefined";
	}
	__name(isProxyEnabled, "isProxyEnabled");
	function addProperty(ctx, name, getter) {
		getter = getter === void 0 ? function() {} : getter;
		Object.defineProperty(ctx, name, {
			get: /* @__PURE__ */ __name(function propertyGetter() {
				if (!isProxyEnabled() && !flag(this, "lockSsfi")) flag(this, "ssfi", propertyGetter);
				let result = getter.call(this);
				if (result !== void 0) return result;
				let newAssertion = new Assertion();
				transferFlags(this, newAssertion);
				return newAssertion;
			}, "propertyGetter"),
			configurable: true
		});
		events.dispatchEvent(new PluginEvent("addProperty", name, getter));
	}
	__name(addProperty, "addProperty");
	var fnLengthDesc = Object.getOwnPropertyDescriptor(function() {}, "length");
	function addLengthGuard(fn, assertionName, isChainable) {
		if (!fnLengthDesc.configurable) return fn;
		Object.defineProperty(fn, "length", { get: /* @__PURE__ */ __name(function() {
			if (isChainable) throw Error("Invalid Chai property: " + assertionName + ".length. Due to a compatibility issue, \"length\" cannot directly follow \"" + assertionName + "\". Use \"" + assertionName + ".lengthOf\" instead.");
			throw Error("Invalid Chai property: " + assertionName + ".length. See docs for proper usage of \"" + assertionName + "\".");
		}, "get") });
		return fn;
	}
	__name(addLengthGuard, "addLengthGuard");
	function getProperties(object) {
		let result = Object.getOwnPropertyNames(object);
		function addProperty2(property) {
			if (result.indexOf(property) === -1) result.push(property);
		}
		__name(addProperty2, "addProperty");
		let proto = Object.getPrototypeOf(object);
		while (proto !== null) {
			Object.getOwnPropertyNames(proto).forEach(addProperty2);
			proto = Object.getPrototypeOf(proto);
		}
		return result;
	}
	__name(getProperties, "getProperties");
	var builtins = [
		"__flags",
		"__methods",
		"_obj",
		"assert"
	];
	function proxify(obj, nonChainableMethodName) {
		if (!isProxyEnabled()) return obj;
		return new Proxy(obj, { get: /* @__PURE__ */ __name(function proxyGetter(target, property) {
			if (typeof property === "string" && config.proxyExcludedKeys.indexOf(property) === -1 && !Reflect.has(target, property)) {
				if (nonChainableMethodName) throw Error("Invalid Chai property: " + nonChainableMethodName + "." + property + ". See docs for proper usage of \"" + nonChainableMethodName + "\".");
				let suggestion = null;
				let suggestionDistance = 4;
				getProperties(target).forEach(function(prop) {
					if (!Object.prototype.hasOwnProperty(prop) && builtins.indexOf(prop) === -1) {
						let dist = stringDistanceCapped(property, prop, suggestionDistance);
						if (dist < suggestionDistance) {
							suggestion = prop;
							suggestionDistance = dist;
						}
					}
				});
				if (suggestion !== null) throw Error("Invalid Chai property: " + property + ". Did you mean \"" + suggestion + "\"?");
				else throw Error("Invalid Chai property: " + property);
			}
			if (builtins.indexOf(property) === -1 && !flag(target, "lockSsfi")) flag(target, "ssfi", proxyGetter);
			return Reflect.get(target, property);
		}, "proxyGetter") });
	}
	__name(proxify, "proxify");
	function stringDistanceCapped(strA, strB, cap) {
		if (Math.abs(strA.length - strB.length) >= cap) return cap;
		let memo = [];
		for (let i = 0; i <= strA.length; i++) {
			memo[i] = Array(strB.length + 1).fill(0);
			memo[i][0] = i;
		}
		for (let j = 0; j < strB.length; j++) memo[0][j] = j;
		for (let i = 1; i <= strA.length; i++) {
			let ch = strA.charCodeAt(i - 1);
			for (let j = 1; j <= strB.length; j++) {
				if (Math.abs(i - j) >= cap) {
					memo[i][j] = cap;
					continue;
				}
				memo[i][j] = Math.min(memo[i - 1][j] + 1, memo[i][j - 1] + 1, memo[i - 1][j - 1] + (ch === strB.charCodeAt(j - 1) ? 0 : 1));
			}
		}
		return memo[strA.length][strB.length];
	}
	__name(stringDistanceCapped, "stringDistanceCapped");
	function addMethod(ctx, name, method) {
		let methodWrapper = /* @__PURE__ */ __name(function() {
			if (!flag(this, "lockSsfi")) flag(this, "ssfi", methodWrapper);
			let result = method.apply(this, arguments);
			if (result !== void 0) return result;
			let newAssertion = new Assertion();
			transferFlags(this, newAssertion);
			return newAssertion;
		}, "methodWrapper");
		addLengthGuard(methodWrapper, name, false);
		ctx[name] = proxify(methodWrapper, name);
		events.dispatchEvent(new PluginEvent("addMethod", name, method));
	}
	__name(addMethod, "addMethod");
	function overwriteProperty(ctx, name, getter) {
		let _get = Object.getOwnPropertyDescriptor(ctx, name), _super = /* @__PURE__ */ __name(function() {}, "_super");
		if (_get && "function" === typeof _get.get) _super = _get.get;
		Object.defineProperty(ctx, name, {
			get: /* @__PURE__ */ __name(function overwritingPropertyGetter() {
				if (!isProxyEnabled() && !flag(this, "lockSsfi")) flag(this, "ssfi", overwritingPropertyGetter);
				let origLockSsfi = flag(this, "lockSsfi");
				flag(this, "lockSsfi", true);
				let result = getter(_super).call(this);
				flag(this, "lockSsfi", origLockSsfi);
				if (result !== void 0) return result;
				let newAssertion = new Assertion();
				transferFlags(this, newAssertion);
				return newAssertion;
			}, "overwritingPropertyGetter"),
			configurable: true
		});
	}
	__name(overwriteProperty, "overwriteProperty");
	function overwriteMethod(ctx, name, method) {
		let _method = ctx[name], _super = /* @__PURE__ */ __name(function() {
			throw new Error(name + " is not a function");
		}, "_super");
		if (_method && "function" === typeof _method) _super = _method;
		let overwritingMethodWrapper = /* @__PURE__ */ __name(function() {
			if (!flag(this, "lockSsfi")) flag(this, "ssfi", overwritingMethodWrapper);
			let origLockSsfi = flag(this, "lockSsfi");
			flag(this, "lockSsfi", true);
			let result = method(_super).apply(this, arguments);
			flag(this, "lockSsfi", origLockSsfi);
			if (result !== void 0) return result;
			let newAssertion = new Assertion();
			transferFlags(this, newAssertion);
			return newAssertion;
		}, "overwritingMethodWrapper");
		addLengthGuard(overwritingMethodWrapper, name, false);
		ctx[name] = proxify(overwritingMethodWrapper, name);
	}
	__name(overwriteMethod, "overwriteMethod");
	var canSetPrototype = typeof Object.setPrototypeOf === "function";
	var testFn = /* @__PURE__ */ __name(function() {}, "testFn");
	var excludeNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
		let propDesc = Object.getOwnPropertyDescriptor(testFn, name);
		if (typeof propDesc !== "object") return true;
		return !propDesc.configurable;
	});
	var call = Function.prototype.call;
	var apply = Function.prototype.apply;
	var _PluginAddChainableMethodEvent = class _PluginAddChainableMethodEvent extends PluginEvent {
		constructor(type3, name, fn, chainingBehavior) {
			super(type3, name, fn);
			this.chainingBehavior = chainingBehavior;
		}
	};
	__name(_PluginAddChainableMethodEvent, "PluginAddChainableMethodEvent");
	var PluginAddChainableMethodEvent = _PluginAddChainableMethodEvent;
	function addChainableMethod(ctx, name, method, chainingBehavior) {
		if (typeof chainingBehavior !== "function") chainingBehavior = /* @__PURE__ */ __name(function() {}, "chainingBehavior");
		let chainableBehavior = {
			method,
			chainingBehavior
		};
		if (!ctx.__methods) ctx.__methods = {};
		ctx.__methods[name] = chainableBehavior;
		Object.defineProperty(ctx, name, {
			get: /* @__PURE__ */ __name(function chainableMethodGetter() {
				chainableBehavior.chainingBehavior.call(this);
				let chainableMethodWrapper = /* @__PURE__ */ __name(function() {
					if (!flag(this, "lockSsfi")) flag(this, "ssfi", chainableMethodWrapper);
					let result = chainableBehavior.method.apply(this, arguments);
					if (result !== void 0) return result;
					let newAssertion = new Assertion();
					transferFlags(this, newAssertion);
					return newAssertion;
				}, "chainableMethodWrapper");
				addLengthGuard(chainableMethodWrapper, name, true);
				if (canSetPrototype) {
					let prototype = Object.create(this);
					prototype.call = call;
					prototype.apply = apply;
					Object.setPrototypeOf(chainableMethodWrapper, prototype);
				} else Object.getOwnPropertyNames(ctx).forEach(function(asserterName) {
					if (excludeNames.indexOf(asserterName) !== -1) return;
					Object.defineProperty(chainableMethodWrapper, asserterName, Object.getOwnPropertyDescriptor(ctx, asserterName));
				});
				transferFlags(this, chainableMethodWrapper);
				return proxify(chainableMethodWrapper);
			}, "chainableMethodGetter"),
			configurable: true
		});
		events.dispatchEvent(new PluginAddChainableMethodEvent("addChainableMethod", name, method, chainingBehavior));
	}
	__name(addChainableMethod, "addChainableMethod");
	function overwriteChainableMethod(ctx, name, method, chainingBehavior) {
		let chainableBehavior = ctx.__methods[name];
		let _chainingBehavior = chainableBehavior.chainingBehavior;
		chainableBehavior.chainingBehavior = /* @__PURE__ */ __name(function overwritingChainableMethodGetter() {
			let result = chainingBehavior(_chainingBehavior).call(this);
			if (result !== void 0) return result;
			let newAssertion = new Assertion();
			transferFlags(this, newAssertion);
			return newAssertion;
		}, "overwritingChainableMethodGetter");
		let _method = chainableBehavior.method;
		chainableBehavior.method = /* @__PURE__ */ __name(function overwritingChainableMethodWrapper() {
			let result = method(_method).apply(this, arguments);
			if (result !== void 0) return result;
			let newAssertion = new Assertion();
			transferFlags(this, newAssertion);
			return newAssertion;
		}, "overwritingChainableMethodWrapper");
	}
	__name(overwriteChainableMethod, "overwriteChainableMethod");
	function compareByInspect(a, b) {
		return inspect2(a) < inspect2(b) ? -1 : 1;
	}
	__name(compareByInspect, "compareByInspect");
	function getOwnEnumerablePropertySymbols(obj) {
		if (typeof Object.getOwnPropertySymbols !== "function") return [];
		return Object.getOwnPropertySymbols(obj).filter(function(sym) {
			return Object.getOwnPropertyDescriptor(obj, sym).enumerable;
		});
	}
	__name(getOwnEnumerablePropertySymbols, "getOwnEnumerablePropertySymbols");
	function getOwnEnumerableProperties(obj) {
		return Object.keys(obj).concat(getOwnEnumerablePropertySymbols(obj));
	}
	__name(getOwnEnumerableProperties, "getOwnEnumerableProperties");
	var isNaN2 = Number.isNaN;
	function isObjectType(obj) {
		let objectType = type(obj);
		return [
			"Array",
			"Object",
			"Function"
		].indexOf(objectType) !== -1;
	}
	__name(isObjectType, "isObjectType");
	function getOperator(obj, args) {
		let operator = flag(obj, "operator");
		let negate = flag(obj, "negate");
		let expected = args[3];
		let msg = negate ? args[2] : args[1];
		if (operator) return operator;
		if (typeof msg === "function") msg = msg();
		msg = msg || "";
		if (!msg) return;
		if (/\shave\s/.test(msg)) return;
		let isObject = isObjectType(expected);
		if (/\snot\s/.test(msg)) return isObject ? "notDeepStrictEqual" : "notStrictEqual";
		return isObject ? "deepStrictEqual" : "strictEqual";
	}
	__name(getOperator, "getOperator");
	function getName(fn) {
		return fn.name;
	}
	__name(getName, "getName");
	function isRegExp2(obj) {
		return Object.prototype.toString.call(obj) === "[object RegExp]";
	}
	__name(isRegExp2, "isRegExp");
	function isNumeric(obj) {
		return ["Number", "BigInt"].includes(type(obj));
	}
	__name(isNumeric, "isNumeric");
	var { flag: flag2 } = utils_exports;
	[
		"to",
		"be",
		"been",
		"is",
		"and",
		"has",
		"have",
		"with",
		"that",
		"which",
		"at",
		"of",
		"same",
		"but",
		"does",
		"still",
		"also"
	].forEach(function(chain) {
		Assertion.addProperty(chain);
	});
	Assertion.addProperty("not", function() {
		flag2(this, "negate", true);
	});
	Assertion.addProperty("deep", function() {
		flag2(this, "deep", true);
	});
	Assertion.addProperty("nested", function() {
		flag2(this, "nested", true);
	});
	Assertion.addProperty("own", function() {
		flag2(this, "own", true);
	});
	Assertion.addProperty("ordered", function() {
		flag2(this, "ordered", true);
	});
	Assertion.addProperty("any", function() {
		flag2(this, "any", true);
		flag2(this, "all", false);
	});
	Assertion.addProperty("all", function() {
		flag2(this, "all", true);
		flag2(this, "any", false);
	});
	var functionTypes = {
		function: [
			"function",
			"asyncfunction",
			"generatorfunction",
			"asyncgeneratorfunction"
		],
		asyncfunction: ["asyncfunction", "asyncgeneratorfunction"],
		generatorfunction: ["generatorfunction", "asyncgeneratorfunction"],
		asyncgeneratorfunction: ["asyncgeneratorfunction"]
	};
	function an(type3, msg) {
		if (msg) flag2(this, "message", msg);
		type3 = type3.toLowerCase();
		let obj = flag2(this, "object"), article = ~[
			"a",
			"e",
			"i",
			"o",
			"u"
		].indexOf(type3.charAt(0)) ? "an " : "a ";
		const detectedType = type(obj).toLowerCase();
		if (functionTypes["function"].includes(type3)) this.assert(functionTypes[type3].includes(detectedType), "expected #{this} to be " + article + type3, "expected #{this} not to be " + article + type3);
		else this.assert(type3 === detectedType, "expected #{this} to be " + article + type3, "expected #{this} not to be " + article + type3);
	}
	__name(an, "an");
	Assertion.addChainableMethod("an", an);
	Assertion.addChainableMethod("a", an);
	function SameValueZero(a, b) {
		return isNaN2(a) && isNaN2(b) || a === b;
	}
	__name(SameValueZero, "SameValueZero");
	function includeChainingBehavior() {
		flag2(this, "contains", true);
	}
	__name(includeChainingBehavior, "includeChainingBehavior");
	function include(val, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), objType = type(obj).toLowerCase(), flagMsg = flag2(this, "message"), negate = flag2(this, "negate"), ssfi = flag2(this, "ssfi"), isDeep = flag2(this, "deep"), descriptor = isDeep ? "deep " : "", isEql = isDeep ? flag2(this, "eql") : SameValueZero;
		flagMsg = flagMsg ? flagMsg + ": " : "";
		let included = false;
		switch (objType) {
			case "string":
				included = obj.indexOf(val) !== -1;
				break;
			case "weakset":
				if (isDeep) throw new AssertionError(flagMsg + "unable to use .deep.include with WeakSet", void 0, ssfi);
				included = obj.has(val);
				break;
			case "map":
				obj.forEach(function(item) {
					included = included || isEql(item, val);
				});
				break;
			case "set":
				if (isDeep) obj.forEach(function(item) {
					included = included || isEql(item, val);
				});
				else included = obj.has(val);
				break;
			case "array":
				if (isDeep) included = obj.some(function(item) {
					return isEql(item, val);
				});
				else included = obj.indexOf(val) !== -1;
				break;
			default: {
				if (val !== Object(val)) throw new AssertionError(flagMsg + "the given combination of arguments (" + objType + " and " + type(val).toLowerCase() + ") is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a " + type(val).toLowerCase(), void 0, ssfi);
				let props = Object.keys(val);
				let firstErr = null;
				let numErrs = 0;
				props.forEach(function(prop) {
					let propAssertion = new Assertion(obj);
					transferFlags(this, propAssertion, true);
					flag2(propAssertion, "lockSsfi", true);
					if (!negate || props.length === 1) {
						propAssertion.property(prop, val[prop]);
						return;
					}
					try {
						propAssertion.property(prop, val[prop]);
					} catch (err) {
						if (!check_error_exports.compatibleConstructor(err, AssertionError)) throw err;
						if (firstErr === null) firstErr = err;
						numErrs++;
					}
				}, this);
				if (negate && props.length > 1 && numErrs === props.length) throw firstErr;
				return;
			}
		}
		this.assert(included, "expected #{this} to " + descriptor + "include " + inspect2(val), "expected #{this} to not " + descriptor + "include " + inspect2(val));
	}
	__name(include, "include");
	Assertion.addChainableMethod("include", include, includeChainingBehavior);
	Assertion.addChainableMethod("contain", include, includeChainingBehavior);
	Assertion.addChainableMethod("contains", include, includeChainingBehavior);
	Assertion.addChainableMethod("includes", include, includeChainingBehavior);
	Assertion.addProperty("ok", function() {
		this.assert(flag2(this, "object"), "expected #{this} to be truthy", "expected #{this} to be falsy");
	});
	Assertion.addProperty("true", function() {
		this.assert(true === flag2(this, "object"), "expected #{this} to be true", "expected #{this} to be false", flag2(this, "negate") ? false : true);
	});
	Assertion.addProperty("numeric", function() {
		const object = flag2(this, "object");
		this.assert(["Number", "BigInt"].includes(type(object)), "expected #{this} to be numeric", "expected #{this} to not be numeric", flag2(this, "negate") ? false : true);
	});
	Assertion.addProperty("callable", function() {
		const val = flag2(this, "object");
		const ssfi = flag2(this, "ssfi");
		const message = flag2(this, "message");
		const msg = message ? `${message}: ` : "";
		const negate = flag2(this, "negate");
		const assertionMessage = negate ? `${msg}expected ${inspect2(val)} not to be a callable function` : `${msg}expected ${inspect2(val)} to be a callable function`;
		const isCallable = [
			"Function",
			"AsyncFunction",
			"GeneratorFunction",
			"AsyncGeneratorFunction"
		].includes(type(val));
		if (isCallable && negate || !isCallable && !negate) throw new AssertionError(assertionMessage, void 0, ssfi);
	});
	Assertion.addProperty("false", function() {
		this.assert(false === flag2(this, "object"), "expected #{this} to be false", "expected #{this} to be true", flag2(this, "negate") ? true : false);
	});
	Assertion.addProperty("null", function() {
		this.assert(null === flag2(this, "object"), "expected #{this} to be null", "expected #{this} not to be null");
	});
	Assertion.addProperty("undefined", function() {
		this.assert(void 0 === flag2(this, "object"), "expected #{this} to be undefined", "expected #{this} not to be undefined");
	});
	Assertion.addProperty("NaN", function() {
		this.assert(isNaN2(flag2(this, "object")), "expected #{this} to be NaN", "expected #{this} not to be NaN");
	});
	function assertExist() {
		let val = flag2(this, "object");
		this.assert(val !== null && val !== void 0, "expected #{this} to exist", "expected #{this} to not exist");
	}
	__name(assertExist, "assertExist");
	Assertion.addProperty("exist", assertExist);
	Assertion.addProperty("exists", assertExist);
	Assertion.addProperty("empty", function() {
		let val = flag2(this, "object"), ssfi = flag2(this, "ssfi"), flagMsg = flag2(this, "message"), itemsCount;
		flagMsg = flagMsg ? flagMsg + ": " : "";
		switch (type(val).toLowerCase()) {
			case "array":
			case "string":
				itemsCount = val.length;
				break;
			case "map":
			case "set":
				itemsCount = val.size;
				break;
			case "weakmap":
			case "weakset": throw new AssertionError(flagMsg + ".empty was passed a weak collection", void 0, ssfi);
			case "function": throw new AssertionError((flagMsg + ".empty was passed a function " + getName(val)).trim(), void 0, ssfi);
			default:
				if (val !== Object(val)) throw new AssertionError(flagMsg + ".empty was passed non-string primitive " + inspect2(val), void 0, ssfi);
				itemsCount = Object.keys(val).length;
		}
		this.assert(0 === itemsCount, "expected #{this} to be empty", "expected #{this} not to be empty");
	});
	function checkArguments() {
		let type3 = type(flag2(this, "object"));
		this.assert("Arguments" === type3, "expected #{this} to be arguments but got " + type3, "expected #{this} to not be arguments");
	}
	__name(checkArguments, "checkArguments");
	Assertion.addProperty("arguments", checkArguments);
	Assertion.addProperty("Arguments", checkArguments);
	function assertEqual(val, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object");
		if (flag2(this, "deep")) {
			let prevLockSsfi = flag2(this, "lockSsfi");
			flag2(this, "lockSsfi", true);
			this.eql(val);
			flag2(this, "lockSsfi", prevLockSsfi);
		} else this.assert(val === obj, "expected #{this} to equal #{exp}", "expected #{this} to not equal #{exp}", val, this._obj, true);
	}
	__name(assertEqual, "assertEqual");
	Assertion.addMethod("equal", assertEqual);
	Assertion.addMethod("equals", assertEqual);
	Assertion.addMethod("eq", assertEqual);
	function assertEql(obj, msg) {
		if (msg) flag2(this, "message", msg);
		let eql = flag2(this, "eql");
		this.assert(eql(obj, flag2(this, "object")), "expected #{this} to deeply equal #{exp}", "expected #{this} to not deeply equal #{exp}", obj, this._obj, true);
	}
	__name(assertEql, "assertEql");
	Assertion.addMethod("eql", assertEql);
	Assertion.addMethod("eqls", assertEql);
	function assertAbove(n, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase();
		if (doLength && objType !== "map" && objType !== "set") new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
		if (!doLength && objType === "date" && nType !== "date") throw new AssertionError(msgPrefix + "the argument to above must be a date", void 0, ssfi);
		else if (!isNumeric(n) && (doLength || isNumeric(obj))) throw new AssertionError(msgPrefix + "the argument to above must be a number", void 0, ssfi);
		else if (!doLength && objType !== "date" && !isNumeric(obj)) {
			let printObj = objType === "string" ? "'" + obj + "'" : obj;
			throw new AssertionError(msgPrefix + "expected " + printObj + " to be a number or a date", void 0, ssfi);
		}
		if (doLength) {
			let descriptor = "length", itemsCount;
			if (objType === "map" || objType === "set") {
				descriptor = "size";
				itemsCount = obj.size;
			} else itemsCount = obj.length;
			this.assert(itemsCount > n, "expected #{this} to have a " + descriptor + " above #{exp} but got #{act}", "expected #{this} to not have a " + descriptor + " above #{exp}", n, itemsCount);
		} else this.assert(obj > n, "expected #{this} to be above #{exp}", "expected #{this} to be at most #{exp}", n);
	}
	__name(assertAbove, "assertAbove");
	Assertion.addMethod("above", assertAbove);
	Assertion.addMethod("gt", assertAbove);
	Assertion.addMethod("greaterThan", assertAbove);
	function assertLeast(n, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase(), errorMessage, shouldThrow = true;
		if (doLength && objType !== "map" && objType !== "set") new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
		if (!doLength && objType === "date" && nType !== "date") errorMessage = msgPrefix + "the argument to least must be a date";
		else if (!isNumeric(n) && (doLength || isNumeric(obj))) errorMessage = msgPrefix + "the argument to least must be a number";
		else if (!doLength && objType !== "date" && !isNumeric(obj)) {
			let printObj = objType === "string" ? "'" + obj + "'" : obj;
			errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
		} else shouldThrow = false;
		if (shouldThrow) throw new AssertionError(errorMessage, void 0, ssfi);
		if (doLength) {
			let descriptor = "length", itemsCount;
			if (objType === "map" || objType === "set") {
				descriptor = "size";
				itemsCount = obj.size;
			} else itemsCount = obj.length;
			this.assert(itemsCount >= n, "expected #{this} to have a " + descriptor + " at least #{exp} but got #{act}", "expected #{this} to have a " + descriptor + " below #{exp}", n, itemsCount);
		} else this.assert(obj >= n, "expected #{this} to be at least #{exp}", "expected #{this} to be below #{exp}", n);
	}
	__name(assertLeast, "assertLeast");
	Assertion.addMethod("least", assertLeast);
	Assertion.addMethod("gte", assertLeast);
	Assertion.addMethod("greaterThanOrEqual", assertLeast);
	function assertBelow(n, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase(), errorMessage, shouldThrow = true;
		if (doLength && objType !== "map" && objType !== "set") new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
		if (!doLength && objType === "date" && nType !== "date") errorMessage = msgPrefix + "the argument to below must be a date";
		else if (!isNumeric(n) && (doLength || isNumeric(obj))) errorMessage = msgPrefix + "the argument to below must be a number";
		else if (!doLength && objType !== "date" && !isNumeric(obj)) {
			let printObj = objType === "string" ? "'" + obj + "'" : obj;
			errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
		} else shouldThrow = false;
		if (shouldThrow) throw new AssertionError(errorMessage, void 0, ssfi);
		if (doLength) {
			let descriptor = "length", itemsCount;
			if (objType === "map" || objType === "set") {
				descriptor = "size";
				itemsCount = obj.size;
			} else itemsCount = obj.length;
			this.assert(itemsCount < n, "expected #{this} to have a " + descriptor + " below #{exp} but got #{act}", "expected #{this} to not have a " + descriptor + " below #{exp}", n, itemsCount);
		} else this.assert(obj < n, "expected #{this} to be below #{exp}", "expected #{this} to be at least #{exp}", n);
	}
	__name(assertBelow, "assertBelow");
	Assertion.addMethod("below", assertBelow);
	Assertion.addMethod("lt", assertBelow);
	Assertion.addMethod("lessThan", assertBelow);
	function assertMost(n, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase(), errorMessage, shouldThrow = true;
		if (doLength && objType !== "map" && objType !== "set") new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
		if (!doLength && objType === "date" && nType !== "date") errorMessage = msgPrefix + "the argument to most must be a date";
		else if (!isNumeric(n) && (doLength || isNumeric(obj))) errorMessage = msgPrefix + "the argument to most must be a number";
		else if (!doLength && objType !== "date" && !isNumeric(obj)) {
			let printObj = objType === "string" ? "'" + obj + "'" : obj;
			errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
		} else shouldThrow = false;
		if (shouldThrow) throw new AssertionError(errorMessage, void 0, ssfi);
		if (doLength) {
			let descriptor = "length", itemsCount;
			if (objType === "map" || objType === "set") {
				descriptor = "size";
				itemsCount = obj.size;
			} else itemsCount = obj.length;
			this.assert(itemsCount <= n, "expected #{this} to have a " + descriptor + " at most #{exp} but got #{act}", "expected #{this} to have a " + descriptor + " above #{exp}", n, itemsCount);
		} else this.assert(obj <= n, "expected #{this} to be at most #{exp}", "expected #{this} to be above #{exp}", n);
	}
	__name(assertMost, "assertMost");
	Assertion.addMethod("most", assertMost);
	Assertion.addMethod("lte", assertMost);
	Assertion.addMethod("lessThanOrEqual", assertMost);
	Assertion.addMethod("within", function(start, finish, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), startType = type(start).toLowerCase(), finishType = type(finish).toLowerCase(), errorMessage, shouldThrow = true, range = startType === "date" && finishType === "date" ? start.toISOString() + ".." + finish.toISOString() : start + ".." + finish;
		if (doLength && objType !== "map" && objType !== "set") new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
		if (!doLength && objType === "date" && (startType !== "date" || finishType !== "date")) errorMessage = msgPrefix + "the arguments to within must be dates";
		else if ((!isNumeric(start) || !isNumeric(finish)) && (doLength || isNumeric(obj))) errorMessage = msgPrefix + "the arguments to within must be numbers";
		else if (!doLength && objType !== "date" && !isNumeric(obj)) {
			let printObj = objType === "string" ? "'" + obj + "'" : obj;
			errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
		} else shouldThrow = false;
		if (shouldThrow) throw new AssertionError(errorMessage, void 0, ssfi);
		if (doLength) {
			let descriptor = "length", itemsCount;
			if (objType === "map" || objType === "set") {
				descriptor = "size";
				itemsCount = obj.size;
			} else itemsCount = obj.length;
			this.assert(itemsCount >= start && itemsCount <= finish, "expected #{this} to have a " + descriptor + " within " + range, "expected #{this} to not have a " + descriptor + " within " + range);
		} else this.assert(obj >= start && obj <= finish, "expected #{this} to be within " + range, "expected #{this} to not be within " + range);
	});
	function assertInstanceOf(constructor, msg) {
		if (msg) flag2(this, "message", msg);
		let target = flag2(this, "object");
		let ssfi = flag2(this, "ssfi");
		let flagMsg = flag2(this, "message");
		let isInstanceOf;
		try {
			isInstanceOf = target instanceof constructor;
		} catch (err) {
			if (err instanceof TypeError) {
				flagMsg = flagMsg ? flagMsg + ": " : "";
				throw new AssertionError(flagMsg + "The instanceof assertion needs a constructor but " + type(constructor) + " was given.", void 0, ssfi);
			}
			throw err;
		}
		let name = getName(constructor);
		if (name == null) name = "an unnamed constructor";
		this.assert(isInstanceOf, "expected #{this} to be an instance of " + name, "expected #{this} to not be an instance of " + name);
	}
	__name(assertInstanceOf, "assertInstanceOf");
	Assertion.addMethod("instanceof", assertInstanceOf);
	Assertion.addMethod("instanceOf", assertInstanceOf);
	function assertProperty(name, val, msg) {
		if (msg) flag2(this, "message", msg);
		let isNested = flag2(this, "nested"), isOwn = flag2(this, "own"), flagMsg = flag2(this, "message"), obj = flag2(this, "object"), ssfi = flag2(this, "ssfi"), nameType = typeof name;
		flagMsg = flagMsg ? flagMsg + ": " : "";
		if (isNested) {
			if (nameType !== "string") throw new AssertionError(flagMsg + "the argument to property must be a string when using nested syntax", void 0, ssfi);
		} else if (nameType !== "string" && nameType !== "number" && nameType !== "symbol") throw new AssertionError(flagMsg + "the argument to property must be a string, number, or symbol", void 0, ssfi);
		if (isNested && isOwn) throw new AssertionError(flagMsg + "The \"nested\" and \"own\" flags cannot be combined.", void 0, ssfi);
		if (obj === null || obj === void 0) throw new AssertionError(flagMsg + "Target cannot be null or undefined.", void 0, ssfi);
		let isDeep = flag2(this, "deep"), negate = flag2(this, "negate"), pathInfo = isNested ? getPathInfo(obj, name) : null, value = isNested ? pathInfo.value : obj[name], isEql = isDeep ? flag2(this, "eql") : (val1, val2) => val1 === val2;
		let descriptor = "";
		if (isDeep) descriptor += "deep ";
		if (isOwn) descriptor += "own ";
		if (isNested) descriptor += "nested ";
		descriptor += "property ";
		let hasProperty2;
		if (isOwn) hasProperty2 = Object.prototype.hasOwnProperty.call(obj, name);
		else if (isNested) hasProperty2 = pathInfo.exists;
		else hasProperty2 = hasProperty(obj, name);
		if (!negate || arguments.length === 1) this.assert(hasProperty2, "expected #{this} to have " + descriptor + inspect2(name), "expected #{this} to not have " + descriptor + inspect2(name));
		if (arguments.length > 1) this.assert(hasProperty2 && isEql(val, value), "expected #{this} to have " + descriptor + inspect2(name) + " of #{exp}, but got #{act}", "expected #{this} to not have " + descriptor + inspect2(name) + " of #{act}", val, value);
		flag2(this, "object", value);
	}
	__name(assertProperty, "assertProperty");
	Assertion.addMethod("property", assertProperty);
	function assertOwnProperty(_name, _value, _msg) {
		flag2(this, "own", true);
		assertProperty.apply(this, arguments);
	}
	__name(assertOwnProperty, "assertOwnProperty");
	Assertion.addMethod("ownProperty", assertOwnProperty);
	Assertion.addMethod("haveOwnProperty", assertOwnProperty);
	function assertOwnPropertyDescriptor(name, descriptor, msg) {
		if (typeof descriptor === "string") {
			msg = descriptor;
			descriptor = null;
		}
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object");
		let actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
		let eql = flag2(this, "eql");
		if (actualDescriptor && descriptor) this.assert(eql(descriptor, actualDescriptor), "expected the own property descriptor for " + inspect2(name) + " on #{this} to match " + inspect2(descriptor) + ", got " + inspect2(actualDescriptor), "expected the own property descriptor for " + inspect2(name) + " on #{this} to not match " + inspect2(descriptor), descriptor, actualDescriptor, true);
		else this.assert(actualDescriptor, "expected #{this} to have an own property descriptor for " + inspect2(name), "expected #{this} to not have an own property descriptor for " + inspect2(name));
		flag2(this, "object", actualDescriptor);
	}
	__name(assertOwnPropertyDescriptor, "assertOwnPropertyDescriptor");
	Assertion.addMethod("ownPropertyDescriptor", assertOwnPropertyDescriptor);
	Assertion.addMethod("haveOwnPropertyDescriptor", assertOwnPropertyDescriptor);
	function assertLengthChain() {
		flag2(this, "doLength", true);
	}
	__name(assertLengthChain, "assertLengthChain");
	function assertLength(n, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), objType = type(obj).toLowerCase(), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi"), descriptor = "length", itemsCount;
		switch (objType) {
			case "map":
			case "set":
				descriptor = "size";
				itemsCount = obj.size;
				break;
			default:
				new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
				itemsCount = obj.length;
		}
		this.assert(itemsCount == n, "expected #{this} to have a " + descriptor + " of #{exp} but got #{act}", "expected #{this} to not have a " + descriptor + " of #{act}", n, itemsCount);
	}
	__name(assertLength, "assertLength");
	Assertion.addChainableMethod("length", assertLength, assertLengthChain);
	Assertion.addChainableMethod("lengthOf", assertLength, assertLengthChain);
	function assertMatch(re, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object");
		this.assert(re.exec(obj), "expected #{this} to match " + re, "expected #{this} not to match " + re);
	}
	__name(assertMatch, "assertMatch");
	Assertion.addMethod("match", assertMatch);
	Assertion.addMethod("matches", assertMatch);
	Assertion.addMethod("string", function(str, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object");
		new Assertion(obj, flag2(this, "message"), flag2(this, "ssfi"), true).is.a("string");
		this.assert(~obj.indexOf(str), "expected #{this} to contain " + inspect2(str), "expected #{this} to not contain " + inspect2(str));
	});
	function assertKeys(keys) {
		let obj = flag2(this, "object"), objType = type(obj), keysType = type(keys), ssfi = flag2(this, "ssfi"), isDeep = flag2(this, "deep"), str, deepStr = "", actual, ok = true, flagMsg = flag2(this, "message");
		flagMsg = flagMsg ? flagMsg + ": " : "";
		let mixedArgsMsg = flagMsg + "when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments";
		if (objType === "Map" || objType === "Set") {
			deepStr = isDeep ? "deeply " : "";
			actual = [];
			obj.forEach(function(val, key) {
				actual.push(key);
			});
			if (keysType !== "Array") keys = Array.prototype.slice.call(arguments);
		} else {
			actual = getOwnEnumerableProperties(obj);
			switch (keysType) {
				case "Array":
					if (arguments.length > 1) throw new AssertionError(mixedArgsMsg, void 0, ssfi);
					break;
				case "Object":
					if (arguments.length > 1) throw new AssertionError(mixedArgsMsg, void 0, ssfi);
					keys = Object.keys(keys);
					break;
				default: keys = Array.prototype.slice.call(arguments);
			}
			keys = keys.map(function(val) {
				return typeof val === "symbol" ? val : String(val);
			});
		}
		if (!keys.length) throw new AssertionError(flagMsg + "keys required", void 0, ssfi);
		let len = keys.length, any = flag2(this, "any"), all = flag2(this, "all"), expected = keys, isEql = isDeep ? flag2(this, "eql") : (val1, val2) => val1 === val2;
		if (!any && !all) all = true;
		if (any) ok = expected.some(function(expectedKey) {
			return actual.some(function(actualKey) {
				return isEql(expectedKey, actualKey);
			});
		});
		if (all) {
			ok = expected.every(function(expectedKey) {
				return actual.some(function(actualKey) {
					return isEql(expectedKey, actualKey);
				});
			});
			if (!flag2(this, "contains")) ok = ok && keys.length == actual.length;
		}
		if (len > 1) {
			keys = keys.map(function(key) {
				return inspect2(key);
			});
			let last = keys.pop();
			if (all) str = keys.join(", ") + ", and " + last;
			if (any) str = keys.join(", ") + ", or " + last;
		} else str = inspect2(keys[0]);
		str = (len > 1 ? "keys " : "key ") + str;
		str = (flag2(this, "contains") ? "contain " : "have ") + str;
		this.assert(ok, "expected #{this} to " + deepStr + str, "expected #{this} to not " + deepStr + str, expected.slice(0).sort(compareByInspect), actual.sort(compareByInspect), true);
	}
	__name(assertKeys, "assertKeys");
	Assertion.addMethod("keys", assertKeys);
	Assertion.addMethod("key", assertKeys);
	function assertThrows(errorLike, errMsgMatcher, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), ssfi = flag2(this, "ssfi"), flagMsg = flag2(this, "message"), negate = flag2(this, "negate") || false;
		new Assertion(obj, flagMsg, ssfi, true).is.a("function");
		if (isRegExp2(errorLike) || typeof errorLike === "string") {
			errMsgMatcher = errorLike;
			errorLike = null;
		}
		let caughtErr;
		let errorWasThrown = false;
		try {
			obj();
		} catch (err) {
			errorWasThrown = true;
			caughtErr = err;
		}
		let everyArgIsUndefined = errorLike === void 0 && errMsgMatcher === void 0;
		let everyArgIsDefined = Boolean(errorLike && errMsgMatcher);
		let errorLikeFail = false;
		let errMsgMatcherFail = false;
		if (everyArgIsUndefined || !everyArgIsUndefined && !negate) {
			let errorLikeString = "an error";
			if (errorLike instanceof Error) errorLikeString = "#{exp}";
			else if (errorLike) errorLikeString = check_error_exports.getConstructorName(errorLike);
			let actual = caughtErr;
			if (caughtErr instanceof Error) actual = caughtErr.toString();
			else if (typeof caughtErr === "string") actual = caughtErr;
			else if (caughtErr && (typeof caughtErr === "object" || typeof caughtErr === "function")) try {
				actual = check_error_exports.getConstructorName(caughtErr);
			} catch (_err) {}
			this.assert(errorWasThrown, "expected #{this} to throw " + errorLikeString, "expected #{this} to not throw an error but #{act} was thrown", errorLike && errorLike.toString(), actual);
		}
		if (errorLike && caughtErr) {
			if (errorLike instanceof Error) {
				if (check_error_exports.compatibleInstance(caughtErr, errorLike) === negate) if (everyArgIsDefined && negate) errorLikeFail = true;
				else this.assert(negate, "expected #{this} to throw #{exp} but #{act} was thrown", "expected #{this} to not throw #{exp}" + (caughtErr && !negate ? " but #{act} was thrown" : ""), errorLike.toString(), caughtErr.toString());
			}
			if (check_error_exports.compatibleConstructor(caughtErr, errorLike) === negate) if (everyArgIsDefined && negate) errorLikeFail = true;
			else this.assert(negate, "expected #{this} to throw #{exp} but #{act} was thrown", "expected #{this} to not throw #{exp}" + (caughtErr ? " but #{act} was thrown" : ""), errorLike instanceof Error ? errorLike.toString() : errorLike && check_error_exports.getConstructorName(errorLike), caughtErr instanceof Error ? caughtErr.toString() : caughtErr && check_error_exports.getConstructorName(caughtErr));
		}
		if (caughtErr && errMsgMatcher !== void 0 && errMsgMatcher !== null) {
			let placeholder = "including";
			if (isRegExp2(errMsgMatcher)) placeholder = "matching";
			if (check_error_exports.compatibleMessage(caughtErr, errMsgMatcher) === negate) if (everyArgIsDefined && negate) errMsgMatcherFail = true;
			else this.assert(negate, "expected #{this} to throw error " + placeholder + " #{exp} but got #{act}", "expected #{this} to throw error not " + placeholder + " #{exp}", errMsgMatcher, check_error_exports.getMessage(caughtErr));
		}
		if (errorLikeFail && errMsgMatcherFail) this.assert(negate, "expected #{this} to throw #{exp} but #{act} was thrown", "expected #{this} to not throw #{exp}" + (caughtErr ? " but #{act} was thrown" : ""), errorLike instanceof Error ? errorLike.toString() : errorLike && check_error_exports.getConstructorName(errorLike), caughtErr instanceof Error ? caughtErr.toString() : caughtErr && check_error_exports.getConstructorName(caughtErr));
		flag2(this, "object", caughtErr);
	}
	__name(assertThrows, "assertThrows");
	Assertion.addMethod("throw", assertThrows);
	Assertion.addMethod("throws", assertThrows);
	Assertion.addMethod("Throw", assertThrows);
	function respondTo(method, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), itself = flag2(this, "itself"), context = "function" === typeof obj && !itself ? obj.prototype[method] : obj[method];
		this.assert("function" === typeof context, "expected #{this} to respond to " + inspect2(method), "expected #{this} to not respond to " + inspect2(method));
	}
	__name(respondTo, "respondTo");
	Assertion.addMethod("respondTo", respondTo);
	Assertion.addMethod("respondsTo", respondTo);
	Assertion.addProperty("itself", function() {
		flag2(this, "itself", true);
	});
	function satisfy(matcher, msg) {
		if (msg) flag2(this, "message", msg);
		let result = matcher(flag2(this, "object"));
		this.assert(result, "expected #{this} to satisfy " + objDisplay(matcher), "expected #{this} to not satisfy" + objDisplay(matcher), flag2(this, "negate") ? false : true, result);
	}
	__name(satisfy, "satisfy");
	Assertion.addMethod("satisfy", satisfy);
	Assertion.addMethod("satisfies", satisfy);
	function closeTo(expected, delta, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
		new Assertion(obj, flagMsg, ssfi, true).is.numeric;
		let message = "A `delta` value is required for `closeTo`";
		if (delta == void 0) throw new AssertionError(flagMsg ? `${flagMsg}: ${message}` : message, void 0, ssfi);
		new Assertion(delta, flagMsg, ssfi, true).is.numeric;
		message = "A `expected` value is required for `closeTo`";
		if (expected == void 0) throw new AssertionError(flagMsg ? `${flagMsg}: ${message}` : message, void 0, ssfi);
		new Assertion(expected, flagMsg, ssfi, true).is.numeric;
		const abs = /* @__PURE__ */ __name((x) => x < 0 ? -x : x, "abs");
		const strip = /* @__PURE__ */ __name((number) => parseFloat(parseFloat(number).toPrecision(12)), "strip");
		this.assert(strip(abs(obj - expected)) <= delta, "expected #{this} to be close to " + expected + " +/- " + delta, "expected #{this} not to be close to " + expected + " +/- " + delta);
	}
	__name(closeTo, "closeTo");
	Assertion.addMethod("closeTo", closeTo);
	Assertion.addMethod("approximately", closeTo);
	function isSubsetOf(_subset, _superset, cmp, contains, ordered) {
		let superset = Array.from(_superset);
		let subset = Array.from(_subset);
		if (!contains) {
			if (subset.length !== superset.length) return false;
			superset = superset.slice();
		}
		return subset.every(function(elem, idx) {
			if (ordered) return cmp ? cmp(elem, superset[idx]) : elem === superset[idx];
			if (!cmp) {
				let matchIdx = superset.indexOf(elem);
				if (matchIdx === -1) return false;
				if (!contains) superset.splice(matchIdx, 1);
				return true;
			}
			return superset.some(function(elem2, matchIdx) {
				if (!cmp(elem, elem2)) return false;
				if (!contains) superset.splice(matchIdx, 1);
				return true;
			});
		});
	}
	__name(isSubsetOf, "isSubsetOf");
	Assertion.addMethod("members", function(subset, msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
		new Assertion(obj, flagMsg, ssfi, true).to.be.iterable;
		new Assertion(subset, flagMsg, ssfi, true).to.be.iterable;
		let contains = flag2(this, "contains");
		let ordered = flag2(this, "ordered");
		let subject, failMsg, failNegateMsg;
		if (contains) {
			subject = ordered ? "an ordered superset" : "a superset";
			failMsg = "expected #{this} to be " + subject + " of #{exp}";
			failNegateMsg = "expected #{this} to not be " + subject + " of #{exp}";
		} else {
			subject = ordered ? "ordered members" : "members";
			failMsg = "expected #{this} to have the same " + subject + " as #{exp}";
			failNegateMsg = "expected #{this} to not have the same " + subject + " as #{exp}";
		}
		let cmp = flag2(this, "deep") ? flag2(this, "eql") : void 0;
		this.assert(isSubsetOf(subset, obj, cmp, contains, ordered), failMsg, failNegateMsg, subset, obj, true);
	});
	Assertion.addProperty("iterable", function(msg) {
		if (msg) flag2(this, "message", msg);
		let obj = flag2(this, "object");
		this.assert(obj != void 0 && obj[Symbol.iterator], "expected #{this} to be an iterable", "expected #{this} to not be an iterable", obj);
	});
	function oneOf(list, msg) {
		if (msg) flag2(this, "message", msg);
		let expected = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi"), contains = flag2(this, "contains"), isDeep = flag2(this, "deep"), eql = flag2(this, "eql");
		new Assertion(list, flagMsg, ssfi, true).to.be.an("array");
		if (contains) this.assert(list.some(function(possibility) {
			return expected.indexOf(possibility) > -1;
		}), "expected #{this} to contain one of #{exp}", "expected #{this} to not contain one of #{exp}", list, expected);
		else if (isDeep) this.assert(list.some(function(possibility) {
			return eql(expected, possibility);
		}), "expected #{this} to deeply equal one of #{exp}", "expected #{this} to deeply equal one of #{exp}", list, expected);
		else this.assert(list.indexOf(expected) > -1, "expected #{this} to be one of #{exp}", "expected #{this} to not be one of #{exp}", list, expected);
	}
	__name(oneOf, "oneOf");
	Assertion.addMethod("oneOf", oneOf);
	function assertChanges(subject, prop, msg) {
		if (msg) flag2(this, "message", msg);
		let fn = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
		new Assertion(fn, flagMsg, ssfi, true).is.a("function");
		let initial;
		if (!prop) {
			new Assertion(subject, flagMsg, ssfi, true).is.a("function");
			initial = subject();
		} else {
			new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
			initial = subject[prop];
		}
		fn();
		let final = prop === void 0 || prop === null ? subject() : subject[prop];
		let msgObj = prop === void 0 || prop === null ? initial : "." + prop;
		flag2(this, "deltaMsgObj", msgObj);
		flag2(this, "initialDeltaValue", initial);
		flag2(this, "finalDeltaValue", final);
		flag2(this, "deltaBehavior", "change");
		flag2(this, "realDelta", final !== initial);
		this.assert(initial !== final, "expected " + msgObj + " to change", "expected " + msgObj + " to not change");
	}
	__name(assertChanges, "assertChanges");
	Assertion.addMethod("change", assertChanges);
	Assertion.addMethod("changes", assertChanges);
	function assertIncreases(subject, prop, msg) {
		if (msg) flag2(this, "message", msg);
		let fn = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
		new Assertion(fn, flagMsg, ssfi, true).is.a("function");
		let initial;
		if (!prop) {
			new Assertion(subject, flagMsg, ssfi, true).is.a("function");
			initial = subject();
		} else {
			new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
			initial = subject[prop];
		}
		new Assertion(initial, flagMsg, ssfi, true).is.a("number");
		fn();
		let final = prop === void 0 || prop === null ? subject() : subject[prop];
		let msgObj = prop === void 0 || prop === null ? initial : "." + prop;
		flag2(this, "deltaMsgObj", msgObj);
		flag2(this, "initialDeltaValue", initial);
		flag2(this, "finalDeltaValue", final);
		flag2(this, "deltaBehavior", "increase");
		flag2(this, "realDelta", final - initial);
		this.assert(final - initial > 0, "expected " + msgObj + " to increase", "expected " + msgObj + " to not increase");
	}
	__name(assertIncreases, "assertIncreases");
	Assertion.addMethod("increase", assertIncreases);
	Assertion.addMethod("increases", assertIncreases);
	function assertDecreases(subject, prop, msg) {
		if (msg) flag2(this, "message", msg);
		let fn = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
		new Assertion(fn, flagMsg, ssfi, true).is.a("function");
		let initial;
		if (!prop) {
			new Assertion(subject, flagMsg, ssfi, true).is.a("function");
			initial = subject();
		} else {
			new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
			initial = subject[prop];
		}
		new Assertion(initial, flagMsg, ssfi, true).is.a("number");
		fn();
		let final = prop === void 0 || prop === null ? subject() : subject[prop];
		let msgObj = prop === void 0 || prop === null ? initial : "." + prop;
		flag2(this, "deltaMsgObj", msgObj);
		flag2(this, "initialDeltaValue", initial);
		flag2(this, "finalDeltaValue", final);
		flag2(this, "deltaBehavior", "decrease");
		flag2(this, "realDelta", initial - final);
		this.assert(final - initial < 0, "expected " + msgObj + " to decrease", "expected " + msgObj + " to not decrease");
	}
	__name(assertDecreases, "assertDecreases");
	Assertion.addMethod("decrease", assertDecreases);
	Assertion.addMethod("decreases", assertDecreases);
	function assertDelta(delta, msg) {
		if (msg) flag2(this, "message", msg);
		let msgObj = flag2(this, "deltaMsgObj");
		let initial = flag2(this, "initialDeltaValue");
		let final = flag2(this, "finalDeltaValue");
		let behavior = flag2(this, "deltaBehavior");
		let realDelta = flag2(this, "realDelta");
		let expression;
		if (behavior === "change") expression = Math.abs(final - initial) === Math.abs(delta);
		else expression = realDelta === Math.abs(delta);
		this.assert(expression, "expected " + msgObj + " to " + behavior + " by " + delta, "expected " + msgObj + " to not " + behavior + " by " + delta);
	}
	__name(assertDelta, "assertDelta");
	Assertion.addMethod("by", assertDelta);
	Assertion.addProperty("extensible", function() {
		let obj = flag2(this, "object");
		let isExtensible = obj === Object(obj) && Object.isExtensible(obj);
		this.assert(isExtensible, "expected #{this} to be extensible", "expected #{this} to not be extensible");
	});
	Assertion.addProperty("sealed", function() {
		let obj = flag2(this, "object");
		let isSealed = obj === Object(obj) ? Object.isSealed(obj) : true;
		this.assert(isSealed, "expected #{this} to be sealed", "expected #{this} to not be sealed");
	});
	Assertion.addProperty("frozen", function() {
		let obj = flag2(this, "object");
		let isFrozen = obj === Object(obj) ? Object.isFrozen(obj) : true;
		this.assert(isFrozen, "expected #{this} to be frozen", "expected #{this} to not be frozen");
	});
	Assertion.addProperty("finite", function(_msg) {
		let obj = flag2(this, "object");
		this.assert(typeof obj === "number" && isFinite(obj), "expected #{this} to be a finite number", "expected #{this} to not be a finite number");
	});
	function compareSubset(expected, actual) {
		if (expected === actual) return true;
		if (typeof actual !== typeof expected) return false;
		if (typeof expected !== "object" || expected === null) return expected === actual;
		if (!actual) return false;
		if (Array.isArray(expected)) {
			if (!Array.isArray(actual)) return false;
			return expected.every(function(exp) {
				return actual.some(function(act) {
					return compareSubset(exp, act);
				});
			});
		}
		if (expected instanceof Date) if (actual instanceof Date) return expected.getTime() === actual.getTime();
		else return false;
		return Object.keys(expected).every(function(key) {
			let expectedValue = expected[key];
			let actualValue = actual[key];
			if (typeof expectedValue === "object" && expectedValue !== null && actualValue !== null) return compareSubset(expectedValue, actualValue);
			if (typeof expectedValue === "function") return expectedValue(actualValue);
			return actualValue === expectedValue;
		});
	}
	__name(compareSubset, "compareSubset");
	Assertion.addMethod("containSubset", function(expected) {
		const actual = flag(this, "object");
		const showDiff = config.showDiff;
		this.assert(compareSubset(expected, actual), "expected #{act} to contain subset #{exp}", "expected #{act} to not contain subset #{exp}", expected, actual, showDiff);
	});
	function expect(val, message) {
		return new Assertion(val, message);
	}
	__name(expect, "expect");
	expect.fail = function(actual, expected, message, operator) {
		if (arguments.length < 2) {
			message = actual;
			actual = void 0;
		}
		message = message || "expect.fail()";
		throw new AssertionError(message, {
			actual,
			expected,
			operator
		}, expect.fail);
	};
	var should_exports = {};
	__export(should_exports, {
		Should: () => Should,
		should: () => should
	});
	function loadShould() {
		function shouldGetter() {
			if (this instanceof String || this instanceof Number || this instanceof Boolean || typeof Symbol === "function" && this instanceof Symbol || typeof BigInt === "function" && this instanceof BigInt) return new Assertion(this.valueOf(), null, shouldGetter);
			return new Assertion(this, null, shouldGetter);
		}
		__name(shouldGetter, "shouldGetter");
		function shouldSetter(value) {
			Object.defineProperty(this, "should", {
				value,
				enumerable: true,
				configurable: true,
				writable: true
			});
		}
		__name(shouldSetter, "shouldSetter");
		Object.defineProperty(Object.prototype, "should", {
			set: shouldSetter,
			get: shouldGetter,
			configurable: true
		});
		let should2 = {};
		should2.fail = function(actual, expected, message, operator) {
			if (arguments.length < 2) {
				message = actual;
				actual = void 0;
			}
			message = message || "should.fail()";
			throw new AssertionError(message, {
				actual,
				expected,
				operator
			}, should2.fail);
		};
		should2.equal = function(actual, expected, message) {
			new Assertion(actual, message).to.equal(expected);
		};
		should2.Throw = function(fn, errt, errs, msg) {
			new Assertion(fn, msg).to.Throw(errt, errs);
		};
		should2.exist = function(val, msg) {
			new Assertion(val, msg).to.exist;
		};
		should2.not = {};
		should2.not.equal = function(actual, expected, msg) {
			new Assertion(actual, msg).to.not.equal(expected);
		};
		should2.not.Throw = function(fn, errt, errs, msg) {
			new Assertion(fn, msg).to.not.Throw(errt, errs);
		};
		should2.not.exist = function(val, msg) {
			new Assertion(val, msg).to.not.exist;
		};
		should2["throw"] = should2["Throw"];
		should2.not["throw"] = should2.not["Throw"];
		return should2;
	}
	__name(loadShould, "loadShould");
	var should = loadShould;
	var Should = loadShould;
	function assert(express, errmsg) {
		new Assertion(null, null, assert, true).assert(express, errmsg, "[ negation message unavailable ]");
	}
	__name(assert, "assert");
	assert.fail = function(actual, expected, message, operator) {
		if (arguments.length < 2) {
			message = actual;
			actual = void 0;
		}
		message = message || "assert.fail()";
		throw new AssertionError(message, {
			actual,
			expected,
			operator
		}, assert.fail);
	};
	assert.isOk = function(val, msg) {
		new Assertion(val, msg, assert.isOk, true).is.ok;
	};
	assert.isNotOk = function(val, msg) {
		new Assertion(val, msg, assert.isNotOk, true).is.not.ok;
	};
	assert.equal = function(act, exp, msg) {
		let test2 = new Assertion(act, msg, assert.equal, true);
		test2.assert(exp == flag(test2, "object"), "expected #{this} to equal #{exp}", "expected #{this} to not equal #{act}", exp, act, true);
	};
	assert.notEqual = function(act, exp, msg) {
		let test2 = new Assertion(act, msg, assert.notEqual, true);
		test2.assert(exp != flag(test2, "object"), "expected #{this} to not equal #{exp}", "expected #{this} to equal #{act}", exp, act, true);
	};
	assert.strictEqual = function(act, exp, msg) {
		new Assertion(act, msg, assert.strictEqual, true).to.equal(exp);
	};
	assert.notStrictEqual = function(act, exp, msg) {
		new Assertion(act, msg, assert.notStrictEqual, true).to.not.equal(exp);
	};
	assert.deepEqual = assert.deepStrictEqual = function(act, exp, msg) {
		new Assertion(act, msg, assert.deepEqual, true).to.eql(exp);
	};
	assert.notDeepEqual = function(act, exp, msg) {
		new Assertion(act, msg, assert.notDeepEqual, true).to.not.eql(exp);
	};
	assert.isAbove = function(val, abv, msg) {
		new Assertion(val, msg, assert.isAbove, true).to.be.above(abv);
	};
	assert.isAtLeast = function(val, atlst, msg) {
		new Assertion(val, msg, assert.isAtLeast, true).to.be.least(atlst);
	};
	assert.isBelow = function(val, blw, msg) {
		new Assertion(val, msg, assert.isBelow, true).to.be.below(blw);
	};
	assert.isAtMost = function(val, atmst, msg) {
		new Assertion(val, msg, assert.isAtMost, true).to.be.most(atmst);
	};
	assert.isTrue = function(val, msg) {
		new Assertion(val, msg, assert.isTrue, true).is["true"];
	};
	assert.isNotTrue = function(val, msg) {
		new Assertion(val, msg, assert.isNotTrue, true).to.not.equal(true);
	};
	assert.isFalse = function(val, msg) {
		new Assertion(val, msg, assert.isFalse, true).is["false"];
	};
	assert.isNotFalse = function(val, msg) {
		new Assertion(val, msg, assert.isNotFalse, true).to.not.equal(false);
	};
	assert.isNull = function(val, msg) {
		new Assertion(val, msg, assert.isNull, true).to.equal(null);
	};
	assert.isNotNull = function(val, msg) {
		new Assertion(val, msg, assert.isNotNull, true).to.not.equal(null);
	};
	assert.isNaN = function(val, msg) {
		new Assertion(val, msg, assert.isNaN, true).to.be.NaN;
	};
	assert.isNotNaN = function(value, message) {
		new Assertion(value, message, assert.isNotNaN, true).not.to.be.NaN;
	};
	assert.exists = function(val, msg) {
		new Assertion(val, msg, assert.exists, true).to.exist;
	};
	assert.notExists = function(val, msg) {
		new Assertion(val, msg, assert.notExists, true).to.not.exist;
	};
	assert.isUndefined = function(val, msg) {
		new Assertion(val, msg, assert.isUndefined, true).to.equal(void 0);
	};
	assert.isDefined = function(val, msg) {
		new Assertion(val, msg, assert.isDefined, true).to.not.equal(void 0);
	};
	assert.isCallable = function(value, message) {
		new Assertion(value, message, assert.isCallable, true).is.callable;
	};
	assert.isNotCallable = function(value, message) {
		new Assertion(value, message, assert.isNotCallable, true).is.not.callable;
	};
	assert.isObject = function(val, msg) {
		new Assertion(val, msg, assert.isObject, true).to.be.a("object");
	};
	assert.isNotObject = function(val, msg) {
		new Assertion(val, msg, assert.isNotObject, true).to.not.be.a("object");
	};
	assert.isArray = function(val, msg) {
		new Assertion(val, msg, assert.isArray, true).to.be.an("array");
	};
	assert.isNotArray = function(val, msg) {
		new Assertion(val, msg, assert.isNotArray, true).to.not.be.an("array");
	};
	assert.isString = function(val, msg) {
		new Assertion(val, msg, assert.isString, true).to.be.a("string");
	};
	assert.isNotString = function(val, msg) {
		new Assertion(val, msg, assert.isNotString, true).to.not.be.a("string");
	};
	assert.isNumber = function(val, msg) {
		new Assertion(val, msg, assert.isNumber, true).to.be.a("number");
	};
	assert.isNotNumber = function(val, msg) {
		new Assertion(val, msg, assert.isNotNumber, true).to.not.be.a("number");
	};
	assert.isNumeric = function(val, msg) {
		new Assertion(val, msg, assert.isNumeric, true).is.numeric;
	};
	assert.isNotNumeric = function(val, msg) {
		new Assertion(val, msg, assert.isNotNumeric, true).is.not.numeric;
	};
	assert.isFinite = function(val, msg) {
		new Assertion(val, msg, assert.isFinite, true).to.be.finite;
	};
	assert.isBoolean = function(val, msg) {
		new Assertion(val, msg, assert.isBoolean, true).to.be.a("boolean");
	};
	assert.isNotBoolean = function(val, msg) {
		new Assertion(val, msg, assert.isNotBoolean, true).to.not.be.a("boolean");
	};
	assert.typeOf = function(val, type3, msg) {
		new Assertion(val, msg, assert.typeOf, true).to.be.a(type3);
	};
	assert.notTypeOf = function(value, type3, message) {
		new Assertion(value, message, assert.notTypeOf, true).to.not.be.a(type3);
	};
	assert.instanceOf = function(val, type3, msg) {
		new Assertion(val, msg, assert.instanceOf, true).to.be.instanceOf(type3);
	};
	assert.notInstanceOf = function(val, type3, msg) {
		new Assertion(val, msg, assert.notInstanceOf, true).to.not.be.instanceOf(type3);
	};
	assert.include = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.include, true).include(inc);
	};
	assert.notInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.notInclude, true).not.include(inc);
	};
	assert.deepInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.deepInclude, true).deep.include(inc);
	};
	assert.notDeepInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.notDeepInclude, true).not.deep.include(inc);
	};
	assert.nestedInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.nestedInclude, true).nested.include(inc);
	};
	assert.notNestedInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.notNestedInclude, true).not.nested.include(inc);
	};
	assert.deepNestedInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.deepNestedInclude, true).deep.nested.include(inc);
	};
	assert.notDeepNestedInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.notDeepNestedInclude, true).not.deep.nested.include(inc);
	};
	assert.ownInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.ownInclude, true).own.include(inc);
	};
	assert.notOwnInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.notOwnInclude, true).not.own.include(inc);
	};
	assert.deepOwnInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.deepOwnInclude, true).deep.own.include(inc);
	};
	assert.notDeepOwnInclude = function(exp, inc, msg) {
		new Assertion(exp, msg, assert.notDeepOwnInclude, true).not.deep.own.include(inc);
	};
	assert.match = function(exp, re, msg) {
		new Assertion(exp, msg, assert.match, true).to.match(re);
	};
	assert.notMatch = function(exp, re, msg) {
		new Assertion(exp, msg, assert.notMatch, true).to.not.match(re);
	};
	assert.property = function(obj, prop, msg) {
		new Assertion(obj, msg, assert.property, true).to.have.property(prop);
	};
	assert.notProperty = function(obj, prop, msg) {
		new Assertion(obj, msg, assert.notProperty, true).to.not.have.property(prop);
	};
	assert.propertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.propertyVal, true).to.have.property(prop, val);
	};
	assert.notPropertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.notPropertyVal, true).to.not.have.property(prop, val);
	};
	assert.deepPropertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.deepPropertyVal, true).to.have.deep.property(prop, val);
	};
	assert.notDeepPropertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.notDeepPropertyVal, true).to.not.have.deep.property(prop, val);
	};
	assert.ownProperty = function(obj, prop, msg) {
		new Assertion(obj, msg, assert.ownProperty, true).to.have.own.property(prop);
	};
	assert.notOwnProperty = function(obj, prop, msg) {
		new Assertion(obj, msg, assert.notOwnProperty, true).to.not.have.own.property(prop);
	};
	assert.ownPropertyVal = function(obj, prop, value, msg) {
		new Assertion(obj, msg, assert.ownPropertyVal, true).to.have.own.property(prop, value);
	};
	assert.notOwnPropertyVal = function(obj, prop, value, msg) {
		new Assertion(obj, msg, assert.notOwnPropertyVal, true).to.not.have.own.property(prop, value);
	};
	assert.deepOwnPropertyVal = function(obj, prop, value, msg) {
		new Assertion(obj, msg, assert.deepOwnPropertyVal, true).to.have.deep.own.property(prop, value);
	};
	assert.notDeepOwnPropertyVal = function(obj, prop, value, msg) {
		new Assertion(obj, msg, assert.notDeepOwnPropertyVal, true).to.not.have.deep.own.property(prop, value);
	};
	assert.nestedProperty = function(obj, prop, msg) {
		new Assertion(obj, msg, assert.nestedProperty, true).to.have.nested.property(prop);
	};
	assert.notNestedProperty = function(obj, prop, msg) {
		new Assertion(obj, msg, assert.notNestedProperty, true).to.not.have.nested.property(prop);
	};
	assert.nestedPropertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.nestedPropertyVal, true).to.have.nested.property(prop, val);
	};
	assert.notNestedPropertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.notNestedPropertyVal, true).to.not.have.nested.property(prop, val);
	};
	assert.deepNestedPropertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.deepNestedPropertyVal, true).to.have.deep.nested.property(prop, val);
	};
	assert.notDeepNestedPropertyVal = function(obj, prop, val, msg) {
		new Assertion(obj, msg, assert.notDeepNestedPropertyVal, true).to.not.have.deep.nested.property(prop, val);
	};
	assert.lengthOf = function(exp, len, msg) {
		new Assertion(exp, msg, assert.lengthOf, true).to.have.lengthOf(len);
	};
	assert.hasAnyKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.hasAnyKeys, true).to.have.any.keys(keys);
	};
	assert.hasAllKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.hasAllKeys, true).to.have.all.keys(keys);
	};
	assert.containsAllKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.containsAllKeys, true).to.contain.all.keys(keys);
	};
	assert.doesNotHaveAnyKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.doesNotHaveAnyKeys, true).to.not.have.any.keys(keys);
	};
	assert.doesNotHaveAllKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.doesNotHaveAllKeys, true).to.not.have.all.keys(keys);
	};
	assert.hasAnyDeepKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.hasAnyDeepKeys, true).to.have.any.deep.keys(keys);
	};
	assert.hasAllDeepKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.hasAllDeepKeys, true).to.have.all.deep.keys(keys);
	};
	assert.containsAllDeepKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.containsAllDeepKeys, true).to.contain.all.deep.keys(keys);
	};
	assert.doesNotHaveAnyDeepKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.doesNotHaveAnyDeepKeys, true).to.not.have.any.deep.keys(keys);
	};
	assert.doesNotHaveAllDeepKeys = function(obj, keys, msg) {
		new Assertion(obj, msg, assert.doesNotHaveAllDeepKeys, true).to.not.have.all.deep.keys(keys);
	};
	assert.throws = function(fn, errorLike, errMsgMatcher, msg) {
		if ("string" === typeof errorLike || errorLike instanceof RegExp) {
			errMsgMatcher = errorLike;
			errorLike = null;
		}
		return flag(new Assertion(fn, msg, assert.throws, true).to.throw(errorLike, errMsgMatcher), "object");
	};
	assert.doesNotThrow = function(fn, errorLike, errMsgMatcher, message) {
		if ("string" === typeof errorLike || errorLike instanceof RegExp) {
			errMsgMatcher = errorLike;
			errorLike = null;
		}
		new Assertion(fn, message, assert.doesNotThrow, true).to.not.throw(errorLike, errMsgMatcher);
	};
	assert.operator = function(val, operator, val2, msg) {
		let ok;
		switch (operator) {
			case "==":
				ok = val == val2;
				break;
			case "===":
				ok = val === val2;
				break;
			case ">":
				ok = val > val2;
				break;
			case ">=":
				ok = val >= val2;
				break;
			case "<":
				ok = val < val2;
				break;
			case "<=":
				ok = val <= val2;
				break;
			case "!=":
				ok = val != val2;
				break;
			case "!==":
				ok = val !== val2;
				break;
			default:
				msg = msg ? msg + ": " : msg;
				throw new AssertionError(msg + "Invalid operator \"" + operator + "\"", void 0, assert.operator);
		}
		let test2 = new Assertion(ok, msg, assert.operator, true);
		test2.assert(true === flag(test2, "object"), "expected " + inspect2(val) + " to be " + operator + " " + inspect2(val2), "expected " + inspect2(val) + " to not be " + operator + " " + inspect2(val2));
	};
	assert.closeTo = function(act, exp, delta, msg) {
		new Assertion(act, msg, assert.closeTo, true).to.be.closeTo(exp, delta);
	};
	assert.approximately = function(act, exp, delta, msg) {
		new Assertion(act, msg, assert.approximately, true).to.be.approximately(exp, delta);
	};
	assert.sameMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.sameMembers, true).to.have.same.members(set2);
	};
	assert.notSameMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.notSameMembers, true).to.not.have.same.members(set2);
	};
	assert.sameDeepMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.sameDeepMembers, true).to.have.same.deep.members(set2);
	};
	assert.notSameDeepMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.notSameDeepMembers, true).to.not.have.same.deep.members(set2);
	};
	assert.sameOrderedMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.sameOrderedMembers, true).to.have.same.ordered.members(set2);
	};
	assert.notSameOrderedMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.notSameOrderedMembers, true).to.not.have.same.ordered.members(set2);
	};
	assert.sameDeepOrderedMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.sameDeepOrderedMembers, true).to.have.same.deep.ordered.members(set2);
	};
	assert.notSameDeepOrderedMembers = function(set1, set2, msg) {
		new Assertion(set1, msg, assert.notSameDeepOrderedMembers, true).to.not.have.same.deep.ordered.members(set2);
	};
	assert.includeMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.includeMembers, true).to.include.members(subset);
	};
	assert.notIncludeMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.notIncludeMembers, true).to.not.include.members(subset);
	};
	assert.includeDeepMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.includeDeepMembers, true).to.include.deep.members(subset);
	};
	assert.notIncludeDeepMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.notIncludeDeepMembers, true).to.not.include.deep.members(subset);
	};
	assert.includeOrderedMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.includeOrderedMembers, true).to.include.ordered.members(subset);
	};
	assert.notIncludeOrderedMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.notIncludeOrderedMembers, true).to.not.include.ordered.members(subset);
	};
	assert.includeDeepOrderedMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.includeDeepOrderedMembers, true).to.include.deep.ordered.members(subset);
	};
	assert.notIncludeDeepOrderedMembers = function(superset, subset, msg) {
		new Assertion(superset, msg, assert.notIncludeDeepOrderedMembers, true).to.not.include.deep.ordered.members(subset);
	};
	assert.oneOf = function(inList, list, msg) {
		new Assertion(inList, msg, assert.oneOf, true).to.be.oneOf(list);
	};
	assert.isIterable = function(obj, msg) {
		if (obj == void 0 || !obj[Symbol.iterator]) {
			msg = msg ? `${msg} expected ${inspect2(obj)} to be an iterable` : `expected ${inspect2(obj)} to be an iterable`;
			throw new AssertionError(msg, void 0, assert.isIterable);
		}
	};
	assert.changes = function(fn, obj, prop, msg) {
		if (arguments.length === 3 && typeof obj === "function") {
			msg = prop;
			prop = null;
		}
		new Assertion(fn, msg, assert.changes, true).to.change(obj, prop);
	};
	assert.changesBy = function(fn, obj, prop, delta, msg) {
		if (arguments.length === 4 && typeof obj === "function") {
			let tmpMsg = delta;
			delta = prop;
			msg = tmpMsg;
		} else if (arguments.length === 3) {
			delta = prop;
			prop = null;
		}
		new Assertion(fn, msg, assert.changesBy, true).to.change(obj, prop).by(delta);
	};
	assert.doesNotChange = function(fn, obj, prop, msg) {
		if (arguments.length === 3 && typeof obj === "function") {
			msg = prop;
			prop = null;
		}
		return new Assertion(fn, msg, assert.doesNotChange, true).to.not.change(obj, prop);
	};
	assert.changesButNotBy = function(fn, obj, prop, delta, msg) {
		if (arguments.length === 4 && typeof obj === "function") {
			let tmpMsg = delta;
			delta = prop;
			msg = tmpMsg;
		} else if (arguments.length === 3) {
			delta = prop;
			prop = null;
		}
		new Assertion(fn, msg, assert.changesButNotBy, true).to.change(obj, prop).but.not.by(delta);
	};
	assert.increases = function(fn, obj, prop, msg) {
		if (arguments.length === 3 && typeof obj === "function") {
			msg = prop;
			prop = null;
		}
		return new Assertion(fn, msg, assert.increases, true).to.increase(obj, prop);
	};
	assert.increasesBy = function(fn, obj, prop, delta, msg) {
		if (arguments.length === 4 && typeof obj === "function") {
			let tmpMsg = delta;
			delta = prop;
			msg = tmpMsg;
		} else if (arguments.length === 3) {
			delta = prop;
			prop = null;
		}
		new Assertion(fn, msg, assert.increasesBy, true).to.increase(obj, prop).by(delta);
	};
	assert.doesNotIncrease = function(fn, obj, prop, msg) {
		if (arguments.length === 3 && typeof obj === "function") {
			msg = prop;
			prop = null;
		}
		return new Assertion(fn, msg, assert.doesNotIncrease, true).to.not.increase(obj, prop);
	};
	assert.increasesButNotBy = function(fn, obj, prop, delta, msg) {
		if (arguments.length === 4 && typeof obj === "function") {
			let tmpMsg = delta;
			delta = prop;
			msg = tmpMsg;
		} else if (arguments.length === 3) {
			delta = prop;
			prop = null;
		}
		new Assertion(fn, msg, assert.increasesButNotBy, true).to.increase(obj, prop).but.not.by(delta);
	};
	assert.decreases = function(fn, obj, prop, msg) {
		if (arguments.length === 3 && typeof obj === "function") {
			msg = prop;
			prop = null;
		}
		return new Assertion(fn, msg, assert.decreases, true).to.decrease(obj, prop);
	};
	assert.decreasesBy = function(fn, obj, prop, delta, msg) {
		if (arguments.length === 4 && typeof obj === "function") {
			let tmpMsg = delta;
			delta = prop;
			msg = tmpMsg;
		} else if (arguments.length === 3) {
			delta = prop;
			prop = null;
		}
		new Assertion(fn, msg, assert.decreasesBy, true).to.decrease(obj, prop).by(delta);
	};
	assert.doesNotDecrease = function(fn, obj, prop, msg) {
		if (arguments.length === 3 && typeof obj === "function") {
			msg = prop;
			prop = null;
		}
		return new Assertion(fn, msg, assert.doesNotDecrease, true).to.not.decrease(obj, prop);
	};
	assert.doesNotDecreaseBy = function(fn, obj, prop, delta, msg) {
		if (arguments.length === 4 && typeof obj === "function") {
			let tmpMsg = delta;
			delta = prop;
			msg = tmpMsg;
		} else if (arguments.length === 3) {
			delta = prop;
			prop = null;
		}
		return new Assertion(fn, msg, assert.doesNotDecreaseBy, true).to.not.decrease(obj, prop).by(delta);
	};
	assert.decreasesButNotBy = function(fn, obj, prop, delta, msg) {
		if (arguments.length === 4 && typeof obj === "function") {
			let tmpMsg = delta;
			delta = prop;
			msg = tmpMsg;
		} else if (arguments.length === 3) {
			delta = prop;
			prop = null;
		}
		new Assertion(fn, msg, assert.decreasesButNotBy, true).to.decrease(obj, prop).but.not.by(delta);
	};
	assert.ifError = function(val) {
		if (val) throw val;
	};
	assert.isExtensible = function(obj, msg) {
		new Assertion(obj, msg, assert.isExtensible, true).to.be.extensible;
	};
	assert.isNotExtensible = function(obj, msg) {
		new Assertion(obj, msg, assert.isNotExtensible, true).to.not.be.extensible;
	};
	assert.isSealed = function(obj, msg) {
		new Assertion(obj, msg, assert.isSealed, true).to.be.sealed;
	};
	assert.isNotSealed = function(obj, msg) {
		new Assertion(obj, msg, assert.isNotSealed, true).to.not.be.sealed;
	};
	assert.isFrozen = function(obj, msg) {
		new Assertion(obj, msg, assert.isFrozen, true).to.be.frozen;
	};
	assert.isNotFrozen = function(obj, msg) {
		new Assertion(obj, msg, assert.isNotFrozen, true).to.not.be.frozen;
	};
	assert.isEmpty = function(val, msg) {
		new Assertion(val, msg, assert.isEmpty, true).to.be.empty;
	};
	assert.isNotEmpty = function(val, msg) {
		new Assertion(val, msg, assert.isNotEmpty, true).to.not.be.empty;
	};
	assert.containsSubset = function(val, exp, msg) {
		new Assertion(val, msg).to.containSubset(exp);
	};
	assert.doesNotContainSubset = function(val, exp, msg) {
		new Assertion(val, msg).to.not.containSubset(exp);
	};
	for (const [name, as] of [
		["isOk", "ok"],
		["isNotOk", "notOk"],
		["throws", "throw"],
		["throws", "Throw"],
		["isExtensible", "extensible"],
		["isNotExtensible", "notExtensible"],
		["isSealed", "sealed"],
		["isNotSealed", "notSealed"],
		["isFrozen", "frozen"],
		["isNotFrozen", "notFrozen"],
		["isEmpty", "empty"],
		["isNotEmpty", "notEmpty"],
		["isCallable", "isFunction"],
		["isNotCallable", "isNotFunction"],
		["containsSubset", "containSubset"]
	]) assert[as] = assert[name];
	var used = [];
	function use(fn) {
		const exports = {
			use,
			AssertionError,
			util: utils_exports,
			config,
			expect,
			assert,
			Assertion,
			...should_exports
		};
		if (!~used.indexOf(fn)) {
			fn(exports, utils_exports);
			used.push(fn);
		}
		return exports;
	}
	__name(use, "use");

//#endregion
//#region src/tests/suite.ts
	var TestSuite = class {
		constructor(name, logger) {
			_defineProperty(this, "state", {});
			_defineProperty(this, "testCases", []);
			_defineProperty(this, "logger", void 0);
			this.logger = logger;
			this.logger.log("name", name);
		}
		test(name, fn) {
			this.testCases.push({
				name,
				fn
			});
		}
		async run() {
			const startTime = Date.now();
			let passed = 0;
			let failed = 0;
			const tests = this.logger.list("tests");
			for (const testCase of this.testCases) {
				const testStartTime = Date.now();
				const testLogger = tests.scope(testCase.name);
				try {
					const returnValue = await testCase.fn(testLogger.scope("runner"));
					const duration = Date.now() - testStartTime;
					passed++;
					testLogger.log("status", "pass");
					testLogger.log("duration", duration);
					testLogger.log("returnValue", returnValue);
				} catch (error) {
					const duration = Date.now() - testStartTime;
					failed++;
					testLogger.log("status", "fail");
					testLogger.log("error", String(error));
					testLogger.log("duration", duration);
				}
			}
			const totalDuration = Date.now() - startTime;
			const suiteResult = {
				passed,
				failed,
				total: this.testCases.length,
				duration: totalDuration
			};
			this.logger.log("summary", suiteResult);
		}
	};
	const registerDefaultTests = function(suite, extension, extensionInfo, testData = {}) {
		registerDefaultInitialisationTests(suite, extension);
		let sourceCapabilities = 0;
		if (Array.isArray(extensionInfo.capabilities)) sourceCapabilities = extensionInfo.capabilities.reduce((a, b) => a | b, sourceCapabilities);
		else sourceCapabilities = extensionInfo.capabilities;
		if (sourceCapabilities & SourceIntents$1.SEARCH_RESULT_PROVIDING && testData.searchResultsProviding !== false) if (implementsSearchResultsProviding(extension)) registerDefaultSearchResultsProvidingSourceTests(suite, extension, testData.searchResultsProviding);
		else throw new Error(`extension does not implement 'SearchResultsProviding' but has the 'SEARCH_RESULTS_PROVIDING' capability`);
		if (testData.mangaProviding !== false) registerDefaultMangaProvidingSourceTests(suite, extension, testData.mangaProviding);
		if (sourceCapabilities & SourceIntents$1.CHAPTER_PROVIDING && testData.chapterProviding !== false) if (implementsChapterProviding(extension)) registerDefaultChapterProvidingSourceTests(suite, extension, testData.chapterProviding);
		else throw new Error(`extension does not implement 'ChapterProviding' but has the 'CHAPTER_PROVIDING' capability`);
	};
	const registerDefaultInitialisationTests = function(suite, extension) {
		suite.test("initialisation", async () => {
			await extension.initialise();
		});
	};
	const STATE_KEY = {
		SearchResultsProviding: {
			getSearchResults: "SearchResultsProviding.getSearchResults",
			getSortingOptions: "SearchResultsProviding.getSortingOptions"
		},
		MangaProviding: { getMangaDetails: "MangaProviding.getMangaDetails" },
		ChapterProviding: {
			getChapters: "ChapterProviding.getChapters",
			getChapterDetails: "ChapterProviding.getChapterDetails"
		}
	};
	const registerDefaultSearchResultsProvidingSourceTests = function(suite, extension, testData) {
		if ("getSortingOptions" in extension && testData?.getSortingOptions !== false) suite.test("getSortingOptions", async () => {
			let params = testData?.getSortingOptions;
			if (!params) params = [{ title: "" }];
			const sortingOptions = await extension.getSortingOptions(...params);
			expect(sortingOptions).not.empty;
			suite.state[STATE_KEY.SearchResultsProviding.getSortingOptions] = sortingOptions;
		});
		if (testData?.getSearchResults !== false) suite.test("getSearchResults", async () => {
			expect(extension).to.have.property("getSearchResults");
			let params = testData?.getSearchResults;
			if (!params) params = [
				{ title: "" },
				void 0,
				suite.state[STATE_KEY.SearchResultsProviding.getSortingOptions]?.[0]
			];
			const searchResults = await extension.getSearchResults(...params);
			expect(searchResults).not.empty;
			expect(searchResults.items).not.be.empty;
			suite.state[STATE_KEY.SearchResultsProviding.getSearchResults] = searchResults;
		});
	};
	const registerDefaultMangaProvidingSourceTests = function(suite, extension, testData) {
		if (testData?.getMangaDetails !== false) suite.test("getMangaDetails", async () => {
			expect(extension).to.have.property("getMangaDetails");
			let params = testData?.getMangaDetails;
			if (!params) {
				const searchResults = suite.state[STATE_KEY.SearchResultsProviding.getSearchResults];
				if (searchResults?.items[0]?.mangaId) params = [searchResults.items[0].mangaId];
				else throw new Error("No `mangaId` provided in test data. Unable to infer from `SearchResultsProviding.getSearchResults`");
			}
			const mangaDetails = await extension.getMangaDetails(...params);
			expect(mangaDetails).to.not.be.undefined;
			expect(mangaDetails.mangaInfo).to.not.be.undefined;
			suite.state[STATE_KEY.MangaProviding.getMangaDetails] = mangaDetails;
		});
	};
	const registerDefaultChapterProvidingSourceTests = function(suite, extension, testData) {
		if (testData?.getChapters !== false) suite.test("getChapters", async () => {
			expect(extension).to.have.property("getChapters");
			let params = testData?.getChapters;
			if (!params) {
				const sourceManga = suite.state[STATE_KEY.MangaProviding.getMangaDetails];
				if (sourceManga) params = [sourceManga];
				else throw new Error("No `sourceManga` provided in test data. Unable to infer from `MangaProviding.getMangaDetails`");
			}
			const chapters = await extension.getChapters(...params);
			expect(chapters).to.not.be.empty;
			suite.state[STATE_KEY.ChapterProviding.getChapters] = chapters;
		});
		if (testData?.getChapterDetails !== false) suite.test("getChapterDetails", async () => {
			expect(extension).to.have.property("getChapterDetails");
			let params = testData?.getChapterDetails;
			if (!params) {
				const chapters = suite.state[STATE_KEY.ChapterProviding.getChapters];
				if (chapters?.[0]) params = [chapters[0]];
				else throw new Error("No `sourceManga` provided in test data. Unable to infer from `MangaProviding.getMangaDetails`");
			}
			const chapterDetails = await extension.getChapterDetails(...params);
			expect(chapterDetails).to.not.be.undefined;
			suite.state[STATE_KEY.ChapterProviding.getChapterDetails] = chapterDetails;
		});
	};

//#endregion
//#region src/tests/MangaDemon.ts
	async function runTests(logger) {
		const suite = new TestSuite("MangaDemon tests", logger);
		registerDefaultTests(suite, MangaDemon, pbconfig_default);
		await suite.run();
	}

//#endregion
exports.runTests = runTests;
return exports;
})({});
//# sourceMappingURL=MangaDemon.js.map