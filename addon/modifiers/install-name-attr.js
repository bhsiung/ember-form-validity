import Modifier from 'ember-modifier';

/**
 *
 * Add `name` attribute to the input element when it is not supported by the
 * component API (e.g. Typeahead)
 *
 * @example
 * <div {{ember-ts-job-posting$install-name-attribute "the-awesome-name"}}></div>
 * <div {{ember-ts-job-posting$install-name-attribute "the-awesome-name" ".foo input"}}></div>
 */

export default class InstallNameAttribute extends Modifier {
  didInstall() {
    const [name, selector] = this.args.positional;
    let inputElement;
    if (selector) {
      inputElement = this.element.querySelector(selector);
    } else {
      inputElement = this.element.querySelector('input,select');
    }
    if (inputElement) {
      inputElement.setAttribute('name', name);
    }
  }
}
