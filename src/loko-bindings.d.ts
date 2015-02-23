
interface LokoBindingValue {
	key: string;
	locale?: string;
	variant?: string;
	params?: { [key: string]: any };
	element?: HTMLElement;
}

interface LokoBindingValueContainer {
	[key: string]: LokoBindingValue;
}
