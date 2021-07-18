import { action, setProperties } from '@ember/object';
import Component from '@glimmer/component';

/**
 * The container of the form to be validated, maintain the validation result map
 * @param {boolean} [validating=true] - A boolean to determine if validation mode is active or not
 * @param {Function} checkForm - a function to examine if the entire form is valid, return boolean
 *
 * yield properties
 * @param {Component} validity - A wrapper component of validity-wrapper, connect the validator
 *                               and the actual form field, share the context within container
 * @param {boolean} isValid - True if everything on the form is valid
 * @param {boolean} validating - A boolean to determine if validation mode is active or not, this reflect the current validating status
 */
export default class ValidatorContainer extends Component {
  validating = false;
  wrapperMap = {};

  get isValid() {
    for (const key in this.wrapperMap) {
      if (!this.wrapperMap[key]) return false;
    }
    return true;
  }

  constructor() {
    super(...arguments);
    this.validating = this.args.validating;
  }

  @action
  registerElement(element) {
    this.element = element;
  }

  @action
  onWrapperValidate(id, isValid) {
    this.wrapperMap[id] = isValid;
  }

  @action
  checkForm(saveForm, event) {
    event.preventDefault();
    const invalidSelector = ':invalid,[aria-invalid="true"]';

    setProperties(this, { validating: true });
    if (this.isValid) {
      saveForm();
    } else {
      this.element.querySelector(invalidSelector).focus();
    }
  }
}
