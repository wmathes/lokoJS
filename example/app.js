var Application = (function () {
    function Application() {
        this.isLoaded = ko.observable(false);
        // Set up Test Vars
        this.nameInput = ko.observable("Alice");
        // Make noise
        console.log("new app()");
        // Engine Settings
        var lokoSettings = {
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
    Application.prototype.start = function () {
        // Make noise
        console.log("app.start()");
        // Start Knockout
        ko.applyBindings(this);
    };
    Application.prototype.getProvider = function () {
        // Create baseUrl for all resources to load
        var getPath = function (url) {
            return url.substr(0, url.lastIndexOf("/") + 1);
        };
        var baseUrl = getPath(location.href) + "resources/";
        // Construct settings.
        var settings = {
            ajaxSettings: {
                dataType: "json"
            },
            getFileName: function (locale) {
                return locale + ".json";
            },
            resourcePath: baseUrl,
            parseResult: function (locale, result) {
                // Get/Create BaseResource
                var resource = this._resources[locale] || new LokoJS.lokoResource(locale);
                for (var key in result) {
                    var ajaxValue = result[key];
                    if (typeof ajaxValue === "string") {
                        ajaxValue = {
                            default: ajaxValue
                        };
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
    };
    return Application;
})();
// On DOM ready
var app = null;
$(function () {
    // Create viewModel
    app = new Application();
    // Fire Start when Loko finished preloading
    app.loko.readyPromise.done(function () {
        // Start
        app.start();
    });
});
//# sourceMappingURL=app.js.map