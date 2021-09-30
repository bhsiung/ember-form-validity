import { action, setProperties } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

/**
 * The container of the form to be validated, maintain the validation result map
 * @param {boolean} [validating=true] - A boolean to determine if validation mode is active or not
 *
 * yield properties
 * @param {Component} validity - A wrapper component of validity-wrapper, connect the validator
 * @param {Function} checkForm - a function to examine if the entire form is valid, return boolean
 * @param {boolean} isValid - True if everything on the form is valid
 */
export default class ValidatorContainer extends Component {
  @tracked isValid = true;
  validating = true;
  wrapperMap = {};
  wrapperCounter = 0;

  constructor() {
    super(...arguments);
    this.validating = this.args.validating ?? true;
  }

  validateWrappers() {
    if (!this.validating) return true;
    for (const key in this.wrapperMap) {
      if (!this.wrapperMap[key]) return false;
    }
    return true;
  }

  @action
  registerId() {
    return this.wrapperCounter++;
  }

  @action
  registerElement(element) {
    this.element = element;
  }

  @action
  onWrapperValidate(id, isValid) {
    this.wrapperMap[id] = isValid;
    this.isValid = this.validateWrappers();
  }

  @action
  checkForm(saveForm, event) {
    event.preventDefault();
    const invalidSelector = ':invalid,[aria-invalid="true"]';

    setProperties(this, { validating: true });
    this.isValid = this.validateWrappers();
    if (this.isValid) {
      saveForm(event);
    } else {
      this.element.querySelector(invalidSelector)?.focus();
    }
  }
}
