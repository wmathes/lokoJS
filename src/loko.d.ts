
interface LokoProviderSettings<T extends LokoResource> {
	resourcePath: string;
	getFileName: (locale: string) => string;
	parseResult: (locale: string, result: any) => T;
	ajaxSettings?: JQueryAjaxSettings;
}

interface LokoAjaxResource {
	[key: string]: {
		default: string;
		variants?: {
			[key: string]: string
		};
		randomizeDefault?: boolean;
	};
}

interface LokoEngineSettings {
	FallbackLocale: string;
	ResourceProvider: LokoProvider<LokoResource>;

	DefaultLocale?: string;

	Preload?: string[];
	Debug?: boolean;
	Strict?: boolean;

	DefaultOnMissingVariant?: boolean;
	CookieName?: string;
}

interface LokoResource {
	locale: string;
	get(key: string): LokoValue;
	add? (value: LokoValue): void;
}

interface LokoProvider<T extends LokoResource> {
	load(locale: string): JQueryPromise<T>;
}

interface LokoValue {
	locale: string;
	key: string;
	default: string;
	randomizeDefault?: boolean;
	randomVariants?: number;
	randomVariantLast?: number;
	variants?: { [key: string]: string };
}

interface ILocalisationResourceProvider<T extends LokoResource> {
	load(locale: string): JQueryPromise<T>;
}
