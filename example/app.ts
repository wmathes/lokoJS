

class Application {
	isLoaded = ko.observable(false);

	public loko: LokoJS.lokoEngine;

	// Set up Test Vars
	nameInput = ko.observable("Alice");

	constructor() {
		// Make noise
		console.log("new app()");

		// Engine Settings
		var lokoSettings: LokoEngineSettings = {
			Debug: true,
			Preload: ["de"],
			ResourceProvider: this.getProvider(),
			FallbackLocale: "en"
		};

		// Get Engine
		this.loko = new LokoJS.lokoEngine(lokoSettings);

		// Set Up LokoBindings
		LokoJSBindings.initialize(this.loko);

		// Register Bindings with KO
		LokoJSBindings.register();
	}

	start() {
		// Make noise
		console.log("app.start()");

		// Start Knockout
		ko.applyBindings(this);
	}

	getProvider(): LokoJS.lokoProvider<LokoResource> {

		// Create baseUrl for all resources to load
		var getPath = function (url: string) {
			return url.substr(0, url.lastIndexOf("/") + 1);
		}
		var baseUrl = getPath(location.href) + "resources/";

		// Construct settings.
		var settings: LokoProviderSettings<LokoResource> = {
			ajaxSettings: {
				dataType: "json"
			},
			getFileName: (locale) => {
				return locale + ".json";
			},
			resourcePath: baseUrl,
			parseResult: function (locale: string, result: LokoAjaxResource) {

				// Get/Create BaseResource
				var resource: LokoResource = this._resources[locale] || new LokoJS.lokoResource(locale);

				// Add all Values provided
				for (var key in result) {

					var ajaxValue = result[key];
					if (typeof ajaxValue === "string") {
						ajaxValue = {
							default: <any>ajaxValue
						}
					}

					resource.add({
						key: key,
						default: ajaxValue.default,
						randomizeDefault: ajaxValue.randomizeDefault,
						variants: ajaxValue.variants,
						locale: locale
					});
				}

				return resource;
			}
		};

		// Create and return Provider
		return new LokoJS.lokoProvider(settings);
	}
}

// On DOM ready
var app: Application = null;
$(() => {
	// Create viewModel
	app = new Application();

	// Fire Start when Loko finished preloading
	app.loko.readyPromise.done(() => {
		// Start
		app.start();
	});
});