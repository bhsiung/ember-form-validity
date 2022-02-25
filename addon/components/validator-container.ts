import { action, setProperties } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

interface Args {
  validating: boolean;
}

/**
 * The container of the form to be validated, maintain the validation result map
 * @param {boolean} [validating=true] - A boolean to determine if validation mode is active or not
 *
 * yield properties
 * @param {Component} validity - A wrapper component of validity-wrapper, connect the validator
 * @param {Function} checkForm - a function to examine if the entire form is valid, return boolean
 * @param {boolean} isValid - True if everything on the form is valid
 */
export default class ValidatorContainer extends Component<Args> {
  @tracked isValid = true;
  validating = true;
  wrapperMap: Record<number, boolean> = {};
  wrapperCounter = 0;
  el?: HTMLElement;

  constructor(...args: [unknown, Args]) {
    super(...args);
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
  unregisterId(id: number) {
    delete this.wrapperMap[id];
    this.isValid = this.validateWrappers();
  }

  @action
  registerElement(element: HTMLElement) {
    this.el = element;
  }

  @action
  onWrapperValidate(id: number, isValid: boolean) {
    this.wrapperMap[id] = isValid;
    this.isValid = this.validateWrappers();
  }

  @action
  checkForm(saveForm: () => void, event: MouseEvent) {
    event?.preventDefault();
    const invalidSelector = ':invalid,[aria-invalid="true"]';

    setProperties(this, { validating: true });
    this.isValid = this.validateWrappers();
    if (this.isValid) {
      saveForm();
    } else if (this.el) {
      const invalidChild = this.el.querySelector(
        invalidSelector
      ) as HTMLElement;
      if (invalidChild) invalidChild.focus();
    }
  }
}
