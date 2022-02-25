import { modifier } from 'ember-modifier';

export default modifier(function registerElement(
  element,
  [onInsert]: [onInsert: (element: Element) => void]
) {
  onInsert(element);
});
