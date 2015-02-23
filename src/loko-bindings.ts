

module LokoJSBindings {

	export function initialize(engine: LokoJS.lokoEngine) {
		Fn.initialize(engine);
	}

	export function register() {
		Fn.register("loctext", new LokoJSBindings.lokoTextBinding());
		Fn.register("lochtml", new LokoJSBindings.lokoHtmlBinding());
		Fn.register("locattr", new LokoJSBindings.lokoAttrBinding());
	}

	/**
	* Base class for all LokoBindings. Will crash if initialize has not been called 
	* prior to instancing.
	*/
	export class lokoBaseBinding {
		constructor() {
			if (!Fn.getEngine())
				throw new Error("Required LokoJS.Engine not found. Call initialize() first!");
		}
    }

	/**
	* Localizes the innerHTML of an element. 
	*/
    export class lokoTextBinding extends lokoBaseBinding {
        public init(element: any, valueAccessor: () => any, allBindingsAccessor: () => any, viewModel: any, bindingContext: KnockoutBindingContext): any {
            return { controlsDescendantBindings: true };
        }

        public update(element: any, valueAccessor: () => KnockoutObservable<LokoBindingValue>, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext): any {

            // Get Clean value (or die trying!)
            var value = Fn.getCleanValue(valueAccessor, element);

            // Get Computed Text
            var computedText = Fn.getComputedText(value);

            // Call Text-Binding
            ko.bindingHandlers.text.update(
                element,
                function () { return computedText; },
                allBindingsAccessor,
                viewModel,
                bindingContext);
        }
    }

	/**
	* Localizes the html content of an element.
	*/
    export class lokoHtmlBinding extends lokoBaseBinding {

        public update(element: any, valueAccessor: () => KnockoutObservable<LokoBindingValue>, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext): any {

            // Get Clean value (or die trying!)
            var value = Fn.getCleanValue(valueAccessor);

            // Get Computed Text
            var computedText = Fn.getComputedText(value);

            // Call Text-Binding
            ko.bindingHandlers.html.update(
                element,
                function () { return computedText; },
                allBindingsAccessor,
                viewModel,
                bindingContext);
        }
    }

	/**
	* Localizes any attributes of an element. (Including 'title', 'href', 'class' and others)
	*/
    export class lokoAttrBinding extends lokoBaseBinding {

        public update(element: any, valueAccessor: () => KnockoutObservable<LokoBindingValueContainer>, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext): any {

            /* 
            * TODO: This whole script might well work with a single 
            * preconstructed object and therefor a single call to 
            * ko.bindingHandlers.attr.
            * (most times only 1 attr is specified anyway. in RARE 
            * cases it might be two.... so for now we dont care ;P)
            */

            var attrValue = ko.utils.unwrapObservable(valueAccessor());

            // For every ATTRIBUTE specified...
            for (var attrKey in attrValue) {

                // Get Value
                var value = Fn.getCleanValue(() => { return <any>attrValue[attrKey]; });

                // Get Computed Text
                var computedText = Fn.getComputedText(value);
                    
                // Call Attr-Binding
                ko.bindingHandlers.attr.update(
                    element,
                    function () {
                        var x = {};
                        x[attrKey] = computedText;
                        return x;
                    },
                    allBindingsAccessor,
                    viewModel,
                    bindingContext);
            }
        }
    }

	/**
	* Formats and localizes a supplied Date-object.
	*/
    export class lokoDateBinding extends lokoBaseBinding {

        public update(element: any, valueAccessor: () => KnockoutObservable<LokoBindingValue>, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext): any {
            throw new Error("Not implemented yet");
        }
    }

	/**
	* Localizes the Options of a select form element.
	*/
    export class lokoOptionsBinding extends lokoBaseBinding {

        public update(element: any, valueAccessor: () => KnockoutObservable<LokoBindingValue>, allBindingsAccessor: KnockoutAllBindingsAccessor, viewModel: any, bindingContext: KnockoutBindingContext): any {
            throw new Error("Not implemented yet");
        }
    }

	/**
	* Static Functions for formatting and parsing binding and localisation values.
	*/
	export class Fn {

		protected static _engine;//: loko.lokoEngine;

		public static initialize(engine) {
			if (this._engine) {
				console.error("[LokoJS.Bindings] Already initialized");
			}
			if (!engine || typeof engine !== "object") {
				console.error("[LokoJS.Bindings] Provided engine is invalid");
			}
			this._engine = engine;
		}

		/**
		* Registers the Binding with KnockoutJS.
		*
		* @param bindingName 
		*/
		public static register(bindingName: string, binding: any, allowVirtualBindings: boolean = false) {
			ko.bindingHandlers[bindingName] = binding;
			ko.virtualElements.allowedBindings[bindingName] = !!allowVirtualBindings;
			return this;
		}

		public static getEngine() {
			return this._engine;
		}

        public static getCleanValue(valueAccessor: () => KnockoutObservable<LokoBindingValue>, element?: HTMLElement): LokoBindingValue {

            var value: LokoBindingValue = ko.utils.unwrapObservable(valueAccessor());

            // Encapsulate Value if its a string
            if (typeof value === "string" || <any>value instanceof String) {
                value = {
                    key: <any>value
                };
            }
            // Opt Out - Invalid Value 
            if (typeof value !== "object" || !value.key)
                throw new TypeError("Value invalid");


            // Params - Unwrap if needed
            if (ko.isObservable(value.params)) {
                value.params = <any>ko.utils.unwrapObservable((<any>value.params)());
            }

            // Element
            value.element = value.element || element;

            // Default Params
            if (value.params === undefined) {
                value.params = {};
            }

            // Opt Out - Invalid Params
            else if (typeof value.params !== "object") {
                throw new TypeError("Params invalid");
            }

            // Locale - Unwrap if needed
            if (ko.isObservable(value.locale)) {
                value.locale = <any>ko.utils.unwrapObservable((<any>value).locale());
            }
            // Opt Out - Invalid Locale
            if (value.locale !== undefined && !LokoJSBindings. Fn.getEngine().Fn.isValidLocale(value.locale))
                throw new TypeError("Locale invalid");

            return value;
        }

        public static getComputedLocale(locale: string): KnockoutComputed<string> {
            return ko.computed(() => {
                return locale || this._engine.currentLocale();
            });
        }

        public static getComputedText(value: LokoBindingValue): KnockoutComputed<string> {

            // Get Target Locale
            var targetLocale = this.getComputedLocale(value.locale);

            return ko.pureComputed(() => {

                // Get Key
                var key: string = ko.isObservable(value.key)
                    ? <string>ko.utils.unwrapObservable((<any>value.key)())
                    : value.key;

                // Get Variant
                var unwrappedVariant: string = ko.isObservable(value.variant)
                    ? <string>ko.utils.unwrapObservable((<any>value.variant)())
                    : value.variant;
                var variant: string;

                // Get Value
                var locValue = this._engine.getValue(key, targetLocale());

                // Should be randomized and the html container element was provided?
                if (locValue.randomizeDefault === true && value.element) { 

                    // Get/Cache a random variant key and store it locale depended into element.
                    var hiddenKey = "_locVariant_" + targetLocale();
                    if (!value.element[hiddenKey]) {
                        variant = this._engine.getRandomVariantFromValue(locValue);
                        value.element[hiddenKey] = variant
                    }
                    else {
                        variant = value.element[hiddenKey];
                    }
                }

                // Get Text
                var text = this._engine.getFromValue(locValue, variant);

                // If there are no parameters, we're done!
                if (value.params === undefined)
                    return text;

                // Handle Parameters
                for (var paramKey in value.params) {

                    var replacement: string = typeof value.params[paramKey] !== "function"
                        ? <any>value.params[paramKey]
                        : ko.utils.unwrapObservable((<any>value.params[paramKey])());

                    // Replacement might be a value itself? Try to localise it.
                    if (this._engine.Fn.isValidKey(replacement)) {
                        replacement = this._engine.get(replacement, variant, targetLocale());
                    }

                    // Normal replace
                    text = text.replace("%" + paramKey.toUpperCase() + "%", replacement);
                }

                return text;
            });
        }
	}
}