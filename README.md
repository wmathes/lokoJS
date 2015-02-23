# Localize KnockoutJS 
LokoJS is a powerful localisation library using [knockoutJS](http://knockoutjs.com/) and [JQuery](http://jquery.com/). It is meant as an modular alternative to frameworks like i18n and out of the box provides the following features.

- Multiple parallel active languages.
- Graceful fallbacks to parent culture or fallback language for missing values.
- Strong use of computed observable allowing the instant change of the current language.
- Preloading and on demand loading of language files.
- Easily localise almost all html use-cases
- Highly modular and extensible
- Written in TypeScript


# LokoJS
LokoJS is split into two components: Core and Bindings. The core consists of lokoEngine, lokoResource and lokoProvider, which together provide async loading, caching and managing of all your language resources.

## lokoEngine
The lokoEngine is the central access point of LokoJS. Using it's resource provider it will fetch and cache lokoResources and offer easy access to localized strings, the localisation values and various comfort and status functions. It will also make sure no invalid data gets through and help you clean up your app using it's Debug and Strict-modes.

## lokoResource
A very basic resource class, which can be extended for more advanced use-cases. In most situation it should suffice however. Normally these get instantiated by a lokoProvider. 

Custom resources need to implement the LokoResource-interface. (see loko.d.ts)

## lokoProvider
The default resource Provider. Using jquery.ajax() it will fetch and cache your resource files. Most of it's function need to be "implemented" via the settings-parameter on instanciaton. 

Custom resources need to implement the very simple LokoProvider-interface (see loko.d.ts). LokoEngine will only call .load(locale: string) and expects a promise in return, which should result in an object implementing the LokoResource interface.

## LokoJS.Fn
A set of useful functions mostly providing validation services for lokoEngine, but may be accessed for other purposes as well.

# LokoJSBindings
LokoJSBindings is a collection of a number of custom knockoutJS Binding Handlers, which offer easy access to your lokoEngine.

The Bindings have to be initialized with a lokoEngine first and then registered.

```javascript
// Set Up LokoBindings
LokoJSBindings.initialize(lokoEngine);

// Register Bindings with KO
LokoJSBindings.register();
```

You can use observables for every parameter supplied to the bindings, which will result in immediate propagation when changes occur. 

## loctext- & lochtml-Binding
loctext localizes the innerHTML of an element, while lochtml localizes the content allowing the use of html within your localisation strings. Internally thes will convert your parameters into an computedObservable<string> and pass it on to a standard knockout text-/html-binding.

Flat Parameters
```html
<p data-bind="loctext: 'hello'"></p>
<p data-bind="lochtml: someVar"></p>
```

Complex parameters
```html
<p data-bind="loctext: { key: 'greeting', locale: 'de' }"></p>
<p data-bind="lochtml: { key: 'greeting', variant: 'female' }"></p>
```

## locattr-Binding
locattr is a binding which allows the parallel localisation of various attributes of an element. Using this you can for example localize the value- and title-attributes of a button to have it display a different text AND a different tooltip for each language. This may also be used to localize style-settings e.g. for image-paths or the href-tag to customize links.

## locdate-Binding
Not yet implemented. This Binding will localize Dates.

## locoption-Binding
Not yet implemented. This Binding will localize the options of a select-form element.

## LokoJSBindings.Fn
A collection of functions to assist the LokoJS knockout binding handlers. The function getComputedText() is the backbone of the LokoJSBindings.

# Example
Check out the example folder. It offers everything you need to start off! Check out the resource files and the app.ts to quickly get going. 




