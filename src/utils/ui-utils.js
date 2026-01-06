import { onCleanup } from "solid-js";

/**
 * Click outside directive for closing dropdowns/menus
 */
export function clickOutside(el, accessor) {
	const onClick = (e) => !el.contains(e.target) && accessor()?.();
	document.body.addEventListener("click", onClick);
	onCleanup(() => document.body.removeEventListener("click", onClick));
}

/**
 * Handle keyboard navigation in lists
 */
export function handleKeyDown(e, enterCb, cancelCb) {
	e.stopPropagation();
	e.stopImmediatePropagation();
	if (e.key === "Enter") {
		enterCb(e);
	}
	if (e.key === "Escape" && cancelCb) {
		cancelCb(e);
	}
	if (e.key === "ArrowDown" || e.key === "ArrowRight") {
		e.target.nextElementSibling?.focus();
	}
	if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
		e.target.previousElementSibling?.focus();
	}
}

/**
 * Get coordinates for positioning menus
 */
export function getButtonCoordinates(event) {
	event.stopPropagation();
	const btnCoordinates = event.currentTarget.getBoundingClientRect();
	let x = btnCoordinates.x;
	const menuWidth = 90;
	const offsetX =
		x + btnCoordinates.width + menuWidth > window.innerWidth
			? -btnCoordinates.width - menuWidth
			: btnCoordinates.width;
	x += offsetX;
	const y = btnCoordinates.y;
	return { x, y };
}

/**
 * Long press hook for mobile touch
 */
export function useLongPress(callback, pressDuration) {
	let timeout = 0;

	function onLongPressStart(event, currentTarget) {
		clearTimeout(timeout);
		event.stopPropagation();
		timeout = window.setTimeout(() => {
			if (navigator.vibrate) {
				navigator.vibrate(300);
			}
			callback(event, currentTarget);
			clearTimeout(timeout);
		}, pressDuration);
	}

	function onLongPressEnd() {
		if (timeout) {
			clearTimeout(timeout);
		}
	}

	return [onLongPressStart, onLongPressEnd];
}
