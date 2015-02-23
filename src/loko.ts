

module LokoJS {

	export class lokoEngine {

		/* --- Default Settings --- */
		public static get defaultSettings(): LokoEngineSettings {
			return {
				FallbackLocale: "en",
				ResourceProvider: undefined,
				Debug: false,
				Strict: false,
				DefaultOnMissingVariant: true,
				CookieName: 'lokoJS'
			};
		}

		/* --- Promises --- */
		protected _readyDeferred: JQueryDeferred<void> = jQuery.Deferred();
		public get readyPromise() { return this._readyDeferred.promise(); }

		/* --- Runtime Settings --- */
		protected _currentLocale: KnockoutObservable<string> = ko.observable(null);
		protected _currentLocaleProxy: KnockoutComputed<string> = ko.computed(<any>{
			read: () => {
				return this._currentLocale();
			},
			write: (value) => {
				if (value !== this._currentLocale()
					&& this.availableLocales.indexOf(value) >= 0)
					this._currentLocale(value);

			}
		});
		public get currentLocale() { return this._currentLocaleProxy; }

		protected _isReady = ko.observable(false);
		protected _isReadyProxy = ko.computed(() => { return this._isReady(); });
		public get isReady() { return this._isReadyProxy; }

		/* --- Getter --- */
		public get availableLocales() { return Object.keys(this._resources); }
		public get fallbackLocale() { return this._settings.FallbackLocale; }

		/* --- Storage --- */
		protected _settings: LokoEngineSettings;
		protected _resources: { [locale: string]: LokoResource } = {};

		/* --- Refs --- */
		public get Fn() {
			return Fn;
		}

		constructor(settings: LokoEngineSettings) {

			// Merge Settings with Default Settings
			this._settings = $.extend({}, lokoEngine.defaultSettings, settings || {});

			// Print final settings if debugging
			if (this._settings.Debug)
				console.info("[LokoJS.Engine] Settings:", this._settings);

			// Opt Out on missing Fallback Language
			if (!Fn.isValidLocale(this._settings.FallbackLocale))
				throw new Error("Fallback locale is invalid.");

			// Opt Out on errornous Fallback Locale
			if (this._settings.FallbackLocale.indexOf("-") != -1)
				throw new Error("Fallback language can not be culture bound.");

			// Opt Out on errornous Default Locale
			if (!!this._settings.DefaultLocale && !Fn.isValidLocale(this._settings.DefaultLocale)) {
				throw new Error("Default locale is invalid.");
			}

			// Determine Current Locale
			var currentLocale =
				(this._settings.CookieName && Fn.getCookie(this._settings.CookieName))
				|| (Fn.isValidLocale(window.navigator.userLanguage) ? window.navigator.userLanguage : null)
				|| (Fn.isValidLocale(window.navigator["language"]) ? window.navigator["language"] : null)
				|| this._settings.DefaultLocale
				|| this._settings.FallbackLocale;

			// Opt Out
			if (!currentLocale)
				throw new Error("Current locale could not be determined.");

			// Set Up 
			this._currentLocale(currentLocale);

			// Prepare Preload
			var preloadLocales = this._settings.Preload || [];

			// Add Current and Fallback locale at index 0
			preloadLocales.splice(0, 0, this._currentLocale(), this.fallbackLocale);

			// Debug info
			if (this._settings.Debug) console.info("[LokoJS.Engine] Current Locale: '" + this._currentLocale() + "'");

			// Filter out falsy and double values
			preloadLocales = $.grep(preloadLocales,(loc, i) => {
				return loc && preloadLocales.indexOf(loc) == i;
			});

			// Start Preloading
			this._preload(preloadLocales).done(() => {

				// Debug info
				if (this._settings.Debug) console.info("[LokoJS.Engine] Preload finished");

				this._isReady(true);
				this._readyDeferred.resolve();
			});
		}

		public preload(locales: string[]): JQueryPromise<void> {
			// Find valid Locales
			var validLocales = $.grep(locales,(locale) => {
				return Fn.isValidLocale(locale);
			});

			// if we have invalid locals (and actually care about them...)
			if ((this._settings.Strict || this._settings.Debug) && locales.length != locales.length) {
				// get list
				var invalidLocales = $.grep(locales,(locale) => {
					return !Fn.isValidLocale(locale);
				});
				// Strict
				if (this._settings.Strict)
					throw new Error("Invalid locales: " + invalidLocales.join(", "));
				else
					console.error("Invalid locales: ", invalidLocales);
			}

			// Opt out 
			return this._preload(validLocales);
		}

		protected _preload(locales: string[]): JQueryPromise<void> {
			var promises = [];

			// Opt Out on empty list
			if (!locales.length) {
				console.error("Error on preload. Locales list is empty.");
			}

			// Gather Promises
			var promises = [];
			$.each(locales,(index, locale) => {

				// Get Load Promise
				var p = this._loadResource(locale);

				// Debug info
				if (this._settings.Debug) {
					console.info("[LokoJS.Engine] Preloading '" + locale + "'");
					p.done(() => {
						console.info("[LokoJS.Engine] Finished preloading '" + locale + "'");
					})
						.fail(() => {
						console.error("[LokoJS.Engine] Failed preloading '" + locale + "'\r\n", arguments);
					});
				}

				promises.push(p);
			});

			// Group promises and return.
			return $.when.apply($.when, promises);
		}

		public loadResource(locale: string): JQueryPromise<LokoResource> {
			Fn.isValidLocaleOrDie(locale);
			return this._loadResource(locale);
		}

		private _loadResource(locale: string): JQueryPromise<LokoResource> {

			// Only load if not yet loaded...
			// TODO: At a later point we may add reload/update functionalities, but as of now its unnecessary
			if (!this.hasResource(locale)) {
				var deferred = jQuery.Deferred();
				var loadPromise = this._settings.ResourceProvider.load(locale);

				loadPromise.always((resource: LokoResource) => {
					// Resource? Save and Resolve
					if (resource && resource.locale === locale) {
						this._resources[locale] = resource;
						deferred.resolve(resource);
					}
					// Error and fallback?!
					else if (locale === this.fallbackLocale) {
						deferred.reject(resource);
					}
					// Resolve empty 
					else {
						deferred.resolve();
					}
				});

				return deferred.promise();
			}

			return null;
		}

		public getResource(locale: string): LokoResource {
			Fn.isValidLocaleOrDie(locale);
			return this._resources[locale];
		}

		private updateRandomVariantCount(value: LokoValue) {

			// Variant Counter
			var rvCount = 0;

			// Only count if value says we should AND variants do actually exist...
			if (value.variants && value.randomizeDefault === true) {
				while (rvCount < 100) {
					if (!value.variants[rvCount + 1 + ""]) break;
					rvCount++;
				}
			}
			if (rvCount === 0) {
				value.randomizeDefault = undefined;
				value.randomVariants = undefined;
				return false;
			}

			value.randomVariants = rvCount;
			return true;
		}

		public get(key: string, variant?: string, locale?: string): string {
			var value = this.getValue(key, locale);
			return this.getFromValue(value);
		}

		public getRandomVariantFromValue(value: LokoValue): string {
			if (!value) return null;

			// Randomize Variant?
			if (value.randomVariants > 0 || this.updateRandomVariantCount(value)) {
				var varKey = (Math.floor(Math.random() * (value.randomVariants + 1)));

				// Increase by 1 if its the same as last time
				if (value.randomVariantLast !== undefined && value.randomVariantLast == varKey) {
					varKey = (varKey + 1) % (value.randomVariants + 1);
				}
				value.randomVariantLast = varKey;

				// Return result
				return varKey > 0
					? varKey + ""
					: "default";
			}
			return null;
		}

		public getFromValue(value: LokoValue, variant?: string): string {
			if (!value) return null;

			//if (!value.randomizeDefault && value.key == "hunger.log.nothingToEat") {
			//    value.randomizeDefault = true;
			//    console.log("VARIANT", variant);
			//}

			// Randomize Variant?
			if (!variant && value.randomizeDefault === true) {
				variant = this.getRandomVariantFromValue(value);
			}

			// Check if selected Variant is valid
			if (variant && variant !== "default" && Fn.isValidVariant(variant)) {

				// When missing & Debug... Return something like "key-variant"
				// (this could be for instance "misc.welcome-female")
				if (!this._settings.DefaultOnMissingVariant && (!value.variants || !value.variants[variant])) {
					return value.key + "-" + variant;
				}

				// Return variant or default as fallback
				return (value.variants && value.variants[variant]) || value.default;
			}

			return value.default;
		}

		public getValue(key: string, locale?: string): LokoValue {

			// If locale is set... opt out on error
			if (locale !== undefined)
				Fn.isValidLocaleOrDie(locale);
			// otherwise use default
			else
				locale = this._currentLocale();

			return this._getValue(key, locale);
		}

		private _getValue(key: string, locale: string): LokoValue {

			// Precheck if locale is fallbackLocale
			var localeIsFallback = locale === this.fallbackLocale;

			// No Resources for this Locale... switch to Fallback
			if (!this.hasResource(locale)) {

				// Opt out if its fallback and it does not exist? :/
				if (localeIsFallback) {
					throw new Error("Fallback Locale has not yet been loaded!");
				}

				// Return fallback Locale ("xx-YY" => "xx" => fallbackLocale)
				return this._getValue(key, this.getFallbackLocale(locale));
			}

			// Get Value from Resources
			var value = this._resources[locale].get(key);

			// Value Found!
			if (typeof value === "object") {
				return value;
			}

			// There might be a Fallback Value?
			if (!localeIsFallback) {
				return this._getValue(key, this.getFallbackLocale(locale));
			}

			// Eventually return emptyish fake value 
			if (!this._settings.Strict || this._settings.Debug) {
				return {
					key: key,
					locale: locale,
					default: this._settings.Debug
						? key
						: ""
				}
			}

			// Just give up...
			throw new Error("Localisation value not found! \r\nKey:" + key + "\r\nLocale+" + locale);
		}

		public hasResource(locale: string) {
			return !locale
				? false
				: !!this._resources[locale];
		}

		private getFallbackLocale(locale: string): string {

			Fn.isValidLocaleOrDie(locale);

			if (locale.length == 5) {
				return locale.substr(0, 2);
			}
			else if (this.fallbackLocale !== locale) {
				return this.fallbackLocale;
			}
			else {
				throw new Error("cant get fallback for locale. locale equals fallbackLocale.");
			}
		}
	}


	export class lokoResource implements LokoResource {

		protected _locale: string;
		public get locale() { return this._locale; }

		private _store: { [key: string]: LokoValue } = {};

		constructor(locale?: string) {
			Fn.isValidLocaleOrDie(locale);
			this._locale = locale;
		}

		public get(key: string): LokoValue {
			return this._store[key];
		}

		public add(value: LokoValue): void {
			// Opt Out - Value
			if (!value)
				throw new TypeError("invalid value");

			// Opt Out - Key
			Fn.isValidKeyOrDie(value.key);

			// Set Locale if missing
			value.locale = value.locale || this.locale;
                
			// Opt Out - Locale
			if (value.locale !== this.locale)
				throw new Error("Locale does not match");

			// Store
			this._store[value.key] = value;
		}
	}


	export class lokoProvider<T extends LokoResource> implements LokoProvider<T> {

		private _resources: { [locale: string]: T } = {};

		private _deferredResources: { [locale: string]: JQueryDeferred<T> } = {};

		private _deferredCalls: { [locale: string]: JQueryPromise<T> } = {};

		private _settings: LokoProviderSettings<T>;

		constructor(settings: LokoProviderSettings<T>) {
			if (!settings
				|| typeof settings.getFileName !== "function"
				|| typeof settings.parseResult !== "function"
				|| (typeof settings.resourcePath !== "string" && !(<any>settings.resourcePath instanceof String))
				) {
				throw new Error("Invalid settings format");
			}

			this._settings = settings;
		}

		public load(locale: string) {

			// Opt Out
			Fn.isValidLocaleOrDie(locale);

			// Get Or Return Resource
			return this.getResource(locale);
		}

		protected parseResult(locale: string, result: T): LokoResource {
			return this._settings.parseResult.call(this, locale, result);
		}

		protected getResource(locale: string): JQueryPromise<LokoResource> {

			if (!this._deferredResources[locale]) {

				var deferredResource: JQueryDeferred<LokoResource> = jQuery.Deferred();

				var call = this.getCall(locale);

				call.done((result: T) => {
					try {
						var resource = this.parseResult(locale, result);
						deferredResource.resolve(resource);
					}
					catch (e) {
						deferredResource.reject(e);
					}
				});

				call.fail((e) => {
					deferredResource.reject(e);
				});

				this._deferredResources[locale] = deferredResource;
			}

			return this._deferredResources[locale].promise();
		}

		protected getCall(locale: string): JQueryPromise<T> {

			if (!this._deferredCalls[locale]) {

				// Construct Ajax Settings
				var ajaxSettings = this._settings.ajaxSettings
					? $.extend({}, this._settings.ajaxSettings)
					: {};

				// Replace URL
				ajaxSettings.url = this._settings.resourcePath + this._settings.getFileName(locale);

				// Call & Store
				this._deferredCalls[locale] = $.ajax(ajaxSettings);
			}

			return this._deferredCalls[locale];
		}
	}

	export class Fn {
		public static isValidLocale(locale: string): boolean {
			// Return false on non-string values.
			if (typeof locale !== "string" && !(<any>locale instanceof String))
				return false;

			// Valid locals are in "xx" or "xx-XX" format
			return locale.length == 2
				? !!locale.match(/^[a-z]{2}$/)
				: !!locale.match(/^[a-z]{2}-[A-Z]{2}$/);
		}

		public static isValidKey(key: string): boolean {
			if (typeof key !== "string" && !(<any>key instanceof String))
				return false;

			return !!key.match(/^[a-zA-Z0-9_.]+$/);
		}

		public static isValidVariant(variant: string): boolean {
			return this.isValidKey(variant);
		}

		public static isValidVariantOrDie(variant: string): void {
			if (!Fn.isValidVariant(variant))
				throw new Error("Invalid variant: '" + variant + "'");
		}

		public static isValidKeyOrDie(key: string): void {
			if (!Fn.isValidKey(key))
				throw new Error("Invalid key: '" + key + "'");
		}

		public static isValidLocaleOrDie(locale: string): void {
			if (!Fn.isValidLocale(locale))
				throw new Error("Invalid locale: '" + locale + "'");
		}
		public static getCookie(name: string) {

			// Add '=' to the end of name if there's none
			if (name.slice(-1) != "=")
				name = name + "=";

			// Extract CookieValue from string
			var kvList = document.cookie.split(';');
			for (var i = 0; i < kvList.length; i++) {
				var c = kvList[i].trim();
				if (c.indexOf(name) == 0)
					return c.substring(name.length, c.length);
			}

			// return null if nothing was found
			return null;
		}
	}
}

window["loko"] = LokoJS;
//export = LokoJS;