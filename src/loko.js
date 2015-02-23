var LokoJS;
(function (LokoJS) {
    var lokoEngine = (function () {
        function lokoEngine(settings) {
            var _this = this;
            /* --- Promises --- */
            this._readyDeferred = jQuery.Deferred();
            /* --- Runtime Settings --- */
            this._currentLocale = ko.observable(null);
            this._currentLocaleProxy = ko.computed({
                read: function () {
                    return _this._currentLocale();
                },
                write: function (value) {
                    if (value !== _this._currentLocale() && _this.availableLocales.indexOf(value) >= 0)
                        _this._currentLocale(value);
                }
            });
            this._isReady = ko.observable(false);
            this._isReadyProxy = ko.computed(function () {
                return _this._isReady();
            });
            this._resources = {};
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
            var currentLocale = (this._settings.CookieName && Fn.getCookie(this._settings.CookieName)) || (Fn.isValidLocale(window.navigator.userLanguage) ? window.navigator.userLanguage : null) || (Fn.isValidLocale(window.navigator["language"]) ? window.navigator["language"] : null) || this._settings.DefaultLocale || this._settings.FallbackLocale;
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
            if (this._settings.Debug)
                console.info("[LokoJS.Engine] Current Locale: '" + this._currentLocale() + "'");
            // Filter out falsy and double values
            preloadLocales = $.grep(preloadLocales, function (loc, i) {
                return loc && preloadLocales.indexOf(loc) == i;
            });
            // Start Preloading
            this._preload(preloadLocales).done(function () {
                // Debug info
                if (_this._settings.Debug)
                    console.info("[LokoJS.Engine] Preload finished");
                _this._isReady(true);
                _this._readyDeferred.resolve();
            });
        }
        Object.defineProperty(lokoEngine, "defaultSettings", {
            /* --- Default Settings --- */
            get: function () {
                return {
                    FallbackLocale: "en",
                    ResourceProvider: undefined,
                    Debug: false,
                    Strict: false,
                    DefaultOnMissingVariant: true,
                    CookieName: 'lokoJS'
                };
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(lokoEngine.prototype, "readyPromise", {
            get: function () {
                return this._readyDeferred.promise();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(lokoEngine.prototype, "currentLocale", {
            get: function () {
                return this._currentLocaleProxy;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(lokoEngine.prototype, "isReady", {
            get: function () {
                return this._isReadyProxy;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(lokoEngine.prototype, "availableLocales", {
            /* --- Getter --- */
            get: function () {
                return Object.keys(this._resources);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(lokoEngine.prototype, "fallbackLocale", {
            get: function () {
                return this._settings.FallbackLocale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(lokoEngine.prototype, "Fn", {
            /* --- Refs --- */
            get: function () {
                return Fn;
            },
            enumerable: true,
            configurable: true
        });
        lokoEngine.prototype.preload = function (locales) {
            // Find valid Locales
            var validLocales = $.grep(locales, function (locale) {
                return Fn.isValidLocale(locale);
            });
            // if we have invalid locals (and actually care about them...)
            if ((this._settings.Strict || this._settings.Debug) && locales.length != locales.length) {
                // get list
                var invalidLocales = $.grep(locales, function (locale) {
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
        };
        lokoEngine.prototype._preload = function (locales) {
            var _this = this;
            var promises = [];
            // Opt Out on empty list
            if (!locales.length) {
                console.error("Error on preload. Locales list is empty.");
            }
            // Gather Promises
            var promises = [];
            $.each(locales, function (index, locale) {
                // Get Load Promise
                var p = _this._loadResource(locale);
                // Debug info
                if (_this._settings.Debug) {
                    console.info("[LokoJS.Engine] Preloading '" + locale + "'");
                    p.done(function () {
                        console.info("[LokoJS.Engine] Finished preloading '" + locale + "'");
                    }).fail(function () {
                        console.error("[LokoJS.Engine] Failed preloading '" + locale + "'\r\n", arguments);
                    });
                }
                promises.push(p);
            });
            // Group promises and return.
            return $.when.apply($.when, promises);
        };
        lokoEngine.prototype.loadResource = function (locale) {
            Fn.isValidLocaleOrDie(locale);
            return this._loadResource(locale);
        };
        lokoEngine.prototype._loadResource = function (locale) {
            var _this = this;
            // Only load if not yet loaded...
            // TODO: At a later point we may add reload/update functionalities, but as of now its unnecessary
            if (!this.hasResource(locale)) {
                var deferred = jQuery.Deferred();
                var loadPromise = this._settings.ResourceProvider.load(locale);
                loadPromise.always(function (resource) {
                    // Resource? Save and Resolve
                    if (resource && resource.locale === locale) {
                        _this._resources[locale] = resource;
                        deferred.resolve(resource);
                    }
                    else if (locale === _this.fallbackLocale) {
                        deferred.reject(resource);
                    }
                    else {
                        deferred.resolve();
                    }
                });
                return deferred.promise();
            }
            return null;
        };
        lokoEngine.prototype.getResource = function (locale) {
            Fn.isValidLocaleOrDie(locale);
            return this._resources[locale];
        };
        lokoEngine.prototype.updateRandomVariantCount = function (value) {
            // Variant Counter
            var rvCount = 0;
            // Only count if value says we should AND variants do actually exist...
            if (value.variants && value.randomizeDefault === true) {
                while (rvCount < 100) {
                    if (!value.variants[rvCount + 1 + ""])
                        break;
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
        };
        lokoEngine.prototype.get = function (key, variant, locale) {
            var value = this.getValue(key, locale);
            return this.getFromValue(value);
        };
        lokoEngine.prototype.getRandomVariantFromValue = function (value) {
            if (!value)
                return null;
            // Randomize Variant?
            if (value.randomVariants > 0 || this.updateRandomVariantCount(value)) {
                var varKey = (Math.floor(Math.random() * (value.randomVariants + 1)));
                // Increase by 1 if its the same as last time
                if (value.randomVariantLast !== undefined && value.randomVariantLast == varKey) {
                    varKey = (varKey + 1) % (value.randomVariants + 1);
                }
                value.randomVariantLast = varKey;
                // Return result
                return varKey > 0 ? varKey + "" : "default";
            }
            return null;
        };
        lokoEngine.prototype.getFromValue = function (value, variant) {
            if (!value)
                return null;
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
        };
        lokoEngine.prototype.getValue = function (key, locale) {
            // If locale is set... opt out on error
            if (locale !== undefined)
                Fn.isValidLocaleOrDie(locale);
            else
                locale = this._currentLocale();
            return this._getValue(key, locale);
        };
        lokoEngine.prototype._getValue = function (key, locale) {
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
                    default: this._settings.Debug ? key : ""
                };
            }
            throw new Error("Localisation value not found! \r\nKey:" + key + "\r\nLocale+" + locale);
        };
        lokoEngine.prototype.hasResource = function (locale) {
            return !locale ? false : !!this._resources[locale];
        };
        lokoEngine.prototype.getFallbackLocale = function (locale) {
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
        };
        return lokoEngine;
    })();
    LokoJS.lokoEngine = lokoEngine;
    var lokoResource = (function () {
        function lokoResource(locale) {
            this._store = {};
            Fn.isValidLocaleOrDie(locale);
            this._locale = locale;
        }
        Object.defineProperty(lokoResource.prototype, "locale", {
            get: function () {
                return this._locale;
            },
            enumerable: true,
            configurable: true
        });
        lokoResource.prototype.get = function (key) {
            return this._store[key];
        };
        lokoResource.prototype.add = function (value) {
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
        };
        return lokoResource;
    })();
    LokoJS.lokoResource = lokoResource;
    var lokoProvider = (function () {
        function lokoProvider(settings) {
            this._resources = {};
            this._deferredResources = {};
            this._deferredCalls = {};
            if (!settings || typeof settings.getFileName !== "function" || typeof settings.parseResult !== "function" || (typeof settings.resourcePath !== "string" && !(settings.resourcePath instanceof String))) {
                throw new Error("Invalid settings format");
            }
            this._settings = settings;
        }
        lokoProvider.prototype.load = function (locale) {
            // Opt Out
            Fn.isValidLocaleOrDie(locale);
            // Get Or Return Resource
            return this.getResource(locale);
        };
        lokoProvider.prototype.parseResult = function (locale, result) {
            return this._settings.parseResult.call(this, locale, result);
        };
        lokoProvider.prototype.getResource = function (locale) {
            var _this = this;
            if (!this._deferredResources[locale]) {
                var deferredResource = jQuery.Deferred();
                var call = this.getCall(locale);
                call.done(function (result) {
                    try {
                        var resource = _this.parseResult(locale, result);
                        deferredResource.resolve(resource);
                    }
                    catch (e) {
                        deferredResource.reject(e);
                    }
                });
                call.fail(function (e) {
                    deferredResource.reject(e);
                });
                this._deferredResources[locale] = deferredResource;
            }
            return this._deferredResources[locale].promise();
        };
        lokoProvider.prototype.getCall = function (locale) {
            if (!this._deferredCalls[locale]) {
                // Construct Ajax Settings
                var ajaxSettings = this._settings.ajaxSettings ? $.extend({}, this._settings.ajaxSettings) : {};
                // Replace URL
                ajaxSettings.url = this._settings.resourcePath + this._settings.getFileName(locale);
                // Call & Store
                this._deferredCalls[locale] = $.ajax(ajaxSettings);
            }
            return this._deferredCalls[locale];
        };
        return lokoProvider;
    })();
    LokoJS.lokoProvider = lokoProvider;
    var Fn = (function () {
        function Fn() {
        }
        Fn.isValidLocale = function (locale) {
            // Return false on non-string values.
            if (typeof locale !== "string" && !(locale instanceof String))
                return false;
            // Valid locals are in "xx" or "xx-XX" format
            return locale.length == 2 ? !!locale.match(/^[a-z]{2}$/) : !!locale.match(/^[a-z]{2}-[A-Z]{2}$/);
        };
        Fn.isValidKey = function (key) {
            if (typeof key !== "string" && !(key instanceof String))
                return false;
            return !!key.match(/^[a-zA-Z0-9_.]+$/);
        };
        Fn.isValidVariant = function (variant) {
            return this.isValidKey(variant);
        };
        Fn.isValidVariantOrDie = function (variant) {
            if (!Fn.isValidVariant(variant))
                throw new Error("Invalid variant: '" + variant + "'");
        };
        Fn.isValidKeyOrDie = function (key) {
            if (!Fn.isValidKey(key))
                throw new Error("Invalid key: '" + key + "'");
        };
        Fn.isValidLocaleOrDie = function (locale) {
            if (!Fn.isValidLocale(locale))
                throw new Error("Invalid locale: '" + locale + "'");
        };
        Fn.getCookie = function (name) {
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
        };
        return Fn;
    })();
    LokoJS.Fn = Fn;
})(LokoJS || (LokoJS = {}));
window["loko"] = LokoJS;
//export = LokoJS; 
//# sourceMappingURL=loko.js.map