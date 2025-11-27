import '@testing-library/jest-dom/vitest';

class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

if (!global.ResizeObserver) {
	global.ResizeObserver = ResizeObserver;
}

if (!window.matchMedia) {
	window.matchMedia = () => ({
		matches: false,
		addListener() {},
		removeListener() {},
		addEventListener() {},
		removeEventListener() {},
		dispatchEvent() { return false; }
	});
}

window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || function scrollIntoView() {};
