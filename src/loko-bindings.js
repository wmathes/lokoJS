var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LokoJSBindings;
(function (LokoJSBindings) {
    function initialize(engine) {
        Fn.initialize(engine);
    }
    LokoJSBindings.initialize = initialize;
    function register() {
        Fn.register("loctext", new LokoJSBindings.lokoTextBinding());
        Fn.register("lochtml", new LokoJSBindings.lokoHtmlBinding());
        Fn.register("locattr", new LokoJSBindings.lokoAttrBinding());
    }
    LokoJSBindings.register = register;
    /**
    * Base class for all LokoBindings. Will crash if initialize has not been called
    * prior to instancing.
    */
    var lokoBaseBinding = (function () {
        function lokoBaseBinding() {
            if (!Fn.getEngine())
                throw new Error("Required LokoJS.Engine not found. Call initialize() first!");
        }
        return lokoBaseBinding;
    })();
    LokoJSBindings.lokoBaseBinding = lokoBaseBinding;
    /**
    * Localizes the innerHTML of an element.
    */
    var lokoTextBinding = (function (_super) {
        __extends(lokoTextBinding, _super);
        function lokoTextBinding() {
            _super.apply(this, arguments);
        }
        lokoTextBinding.prototype.init = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return { controlsDescendantBindings: true };
        };
        lokoTextBinding.prototype.update = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // Get Clean value (or die trying!)
            var value = Fn.getCleanValue(valueAccessor, element);
            // Get Computed Text
            var computedText = Fn.getComputedText(value);
            // Call Text-Binding
            ko.bindingHandlers.text.update(element, function () {
                return computedText;
            }, allBindingsAccessor, viewModel, bindingContext);
        };
        return lokoTextBinding;
    })(lokoBaseBinding);
    LokoJSBindings.lokoTextBinding = lokoTextBinding;
    /**
    * Localizes the html content of an element.
    */
    var lokoHtmlBinding = (function (_super) {
        __extends(lokoHtmlBinding, _super);
        function lokoHtmlBinding() {
            _super.apply(this, arguments);
        }
        lokoHtmlBinding.prototype.update = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // Get Clean value (or die trying!)
            var value = Fn.getCleanValue(valueAccessor);
            // Get Computed Text
            var computedText = Fn.getComputedText(value);
            // Call Text-Binding
            ko.bindingHandlers.html.update(element, function () {
                return computedText;
            }, allBindingsAccessor, viewModel, bindingContext);
        };
        return lokoHtmlBinding;
    })(lokoBaseBinding);
    LokoJSBindings.lokoHtmlBinding = lokoHtmlBinding;
    /**
    * Localizes any attributes of an element. (Including 'title', 'href', 'class' and others)
    */
    var lokoAttrBinding = (function (_super) {
        __extends(lokoAttrBinding, _super);
        function lokoAttrBinding() {
            _super.apply(this, arguments);
        }
        lokoAttrBinding.prototype.update = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            /*
            * TODO: This whole script might well work with a single
            * preconstructed object and therefor a single call to
            * ko.bindingHandlers.attr.
            * (most times only 1 attr is specified anyway. in RARE
            * cases it might be two.... so for now we dont care ;P)
            */
            var attrValue = ko.utils.unwrapObservable(valueAccessor());
            for (var attrKey in attrValue) {
                // Get Value
                var value = Fn.getCleanValue(function () {
                    return attrValue[attrKey];
                });
                // Get Computed Text
                var computedText = Fn.getComputedText(value);
                // Call Attr-Binding
                ko.bindingHandlers.attr.update(element, function () {
                    var x = {};
                    x[attrKey] = computedText;
                    return x;
                }, allBindingsAccessor, viewModel, bindingContext);
            }
        };
        return lokoAttrBinding;
    })(lokoBaseBinding);
    LokoJSBindings.lokoAttrBinding = lokoAttrBinding;
    /**
    * Formats and localizes a supplied Date-object.
    */
    var lokoDateBinding = (function (_super) {
        __extends(lokoDateBinding, _super);
        function lokoDateBinding() {
            _super.apply(this, arguments);
        }
        lokoDateBinding.prototype.update = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            throw new Error("Not implemented yet");
        };
        return lokoDateBinding;
    })(lokoBaseBinding);
    LokoJSBindings.lokoDateBinding = lokoDateBinding;
    /**
    * Localizes the Options of a select form element.
    */
    var lokoOptionsBinding = (function (_super) {
        __extends(lokoOptionsBinding, _super);
        function lokoOptionsBinding() {
            _super.apply(this, arguments);
        }
        lokoOptionsBinding.prototype.update = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            throw new Error("Not implemented yet");
        };
        return lokoOptionsBinding;
    })(lokoBaseBinding);
    LokoJSBindings.lokoOptionsBinding = lokoOptionsBinding;
    /**
    * Static Functions for formatting and parsing binding and localisation values.
    */
    var Fn = (function () {
        function Fn() {
        }
        Fn.initialize = function (engine) {
            if (this._engine) {
                console.error("[LokoJS.Bindings] Already initialized");
            }
            if (!engine || typeof engine !== "object") {
                console.error("[LokoJS.Bindings] Provided engine is invalid");
            }
            this._engine = engine;
        };
        /**
        * Registers the Binding with KnockoutJS.
        *
        * @param bindingName
        */
        Fn.register = function (bindingName, binding, allowVirtualBindings) {
            if (allowVirtualBindings === void 0) { allowVirtualBindings = false; }
            ko.bindingHandlers[bindingName] = binding;
            ko.virtualElements.allowedBindings[bindingName] = !!allowVirtualBindings;
            return this;
        };
        Fn.getEngine = function () {
            return this._engine;
        };
        Fn.getCleanValue = function (valueAccessor, element) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            // Encapsulate Value if its a string
            if (typeof value === "string" || value instanceof String) {
                value = {
                    key: value
                };
            }
            // Opt Out - Invalid Value 
            if (typeof value !== "object" || !value.key)
                throw new TypeError("Value invalid");
            // Params - Unwrap if needed
            if (ko.isObservable(value.params)) {
                value.params = ko.utils.unwrapObservable(value.params());
            }
            // Element
            value.element = value.element || element;
            // Default Params
            if (value.params === undefined) {
                value.params = {};
            }
            else if (typeof value.params !== "object") {
                throw new TypeError("Params invalid");
            }
            // Locale - Unwrap if needed
            if (ko.isObservable(value.locale)) {
                value.locale = ko.utils.unwrapObservable(value.locale());
            }
            // Opt Out - Invalid Locale
            if (value.locale !== undefined && !LokoJSBindings.Fn.getEngine().Fn.isValidLocale(value.locale))
                throw new TypeError("Locale invalid");
            return value;
        };
        Fn.getComputedLocale = function (locale) {
            var _this = this;
            return ko.computed(function () {
                return locale || _this._engine.currentLocale();
            });
        };
        Fn.getComputedText = function (value) {
            var _this = this;
            // Get Target Locale
            var targetLocale = this.getComputedLocale(value.locale);
            return ko.pureComputed(function () {
                // Get Key
                var key = ko.isObservable(value.key) ? ko.utils.unwrapObservable(value.key()) : value.key;
                // Get Variant
                var unwrappedVariant = ko.isObservable(value.variant) ? ko.utils.unwrapObservable(value.variant()) : value.variant;
                var variant;
                // Get Value
                var locValue = _this._engine.getValue(key, targetLocale());
                // Should be randomized and the html container element was provided?
                if (locValue.randomizeDefault === true && value.element) {
                    // Get/Cache a random variant key and store it locale depended into element.
                    var hiddenKey = "_locVariant_" + targetLocale();
                    if (!value.element[hiddenKey]) {
                        variant = _this._engine.getRandomVariantFromValue(locValue);
                        value.element[hiddenKey] = variant;
                    }
                    else {
                        variant = value.element[hiddenKey];
                    }
                }
                // Get Text
                var text = _this._engine.getFromValue(locValue, variant);
                // If there are no parameters, we're done!
                if (value.params === undefined)
                    return text;
                for (var paramKey in value.params) {
                    var replacement = typeof value.params[paramKey] !== "function" ? value.params[paramKey] : ko.utils.unwrapObservable(value.params[paramKey]());
                    // Replacement might be a value itself? Try to localise it.
                    if (_this._engine.Fn.isValidKey(replacement)) {
                        replacement = _this._engine.get(replacement, variant, targetLocale());
                    }
                    // Normal replace
                    text = text.replace("%" + paramKey.toUpperCase() + "%", replacement);
                }
                return text;
            });
        };
        return Fn;
    })();
    LokoJSBindings.Fn = Fn;
})(LokoJSBindings || (LokoJSBindings = {}));
//# sourceMappingURL=loko-bindings.js.map