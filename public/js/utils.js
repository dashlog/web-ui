/**
 * Create a DOM element with given attributes, children, and classes.
 * @param {keyof HTMLElementTagNameMap} kind - The type of element to create.
 * @param {object} [options] - Options for the element.
 * @param {string[]} [options.classList] - CSS classes to apply.
 * @param {HTMLElement[]} [options.childs] - Child elements to append.
 * @param {Record<string, any>} [options.attributes] - Attributes to set on the element.
 * @param {string | null} [options.text] - Text content to insert.
 * @param {string | null} [options.className] - CSS class name.
 * @returns {HTMLElement} The created DOM element.
 */
export function createDOMElement(kind = "div", options = {}) {
  const { classList = [], childs = [], attributes = {}, text = null, className = null } = options;

  const el = document.createElement(kind);
  if (className !== null) {
    el.className = className;
  }
  classList.forEach((name) => el.classList.add(name));

  childs.filter((child) => child !== null).forEach((child) => el.appendChild(child));

  for (const [key, value] of Object.entries(attributes)) {
    el.setAttribute(key, value);
  }

  if (text !== null) {
    el.textContent = text;
  }

  return el;
}

/**
 * Debounce a function, ensuring it is only executed after a certain delay.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle a function, ensuring it is only executed at most once per interval.
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The interval in milliseconds.
 * @returns {Function} The throttled function.
 */
export function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this, args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}
