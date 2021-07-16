import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';

/**
 * The error type will be returned when validate against a component with multiple input fields
 * The structure allow identifying the error message to a specific element based on the `name`
 * @typedef ErrorObject
 * @type {object}
 * @property {string} message - the invalid error message
 * @property {string} name - the name of the input element
 */

/**
 * This callback represents the custom validation such as max lenth check
 * @callback CustomValidatorCallback
 * @param {any} params - any value passed in to onValidate in the form control component which is needed by validation
 * @return {ErrorObject}
 */

/**
 * Validate entity which share the context from validator-container, bridge to the actual input component.
 *
 * @param {boolean} validating - determine if the form is in validating mode
 * @param {CustomValidatorCallback[]} [validators] - a set of validator to be test against
 *
 * yield properties
 * @param {Function} validator - a reference to `actions.contextualValidator`
 * @param {string} errorMessage - the error message to be rendered
 *
 * e.g.
 * {{#ember-ts-job-posting$shared/validator-wrapper
 *   validators=(array onValidateApplyMethod)
 *   validating=false
 *   as |validity|
 * }}
 *   {{complex-input
 *     applyMethod=applyMethod
 *     describedById="abc3"
 *     validating=v.validating
 *     onValidate=validity.validator
 *   }}
 *   <p id="abc4">{{validity.error}}</p>
 * {{/v.validity}}
 */
export default class ValidatorWrapper extends Component {
  /**
   * The error message will be used to print the error message
   * @type {string}
   */
  @tracked error = '';

  /**
   * A reference point to the last invalid input field, will be used to reset before a new round of validation
   * @type {DOMNode}
   */
  lastElementWithCustomError = null;

  /**
   * proxied error message based on the `validating` flag
   * @type {string}
   */
  get errorMessage() {
    return this.args.validating ? this.error : '';
  }

  /**
   * Perform custom validating against given list of validators, stop and return as soon as first failure
   *
   * @param {array} ...args - the information needed for validation. this part requires a co-op between
   *   the input component and the custom validator functions
   * @returns {ErrorObject}
   */
  customValidate(...args) {
    if (Array.isArray(this.args.validators)) {
      for (const validator of this.args.validators) {
        const result = validator(...args);

        if (result) return result;
      }
    }

    return null;
  }

  /**
   * 1. perform validation
   * 2. associate error message to input element
   * 3. cache invalid element
   *
   * @param {DOMNode} rootElement - the root element of the input field
   * @param {array} ...args - the information needed for validation. this part requires a co-op between
   *   the input component and the custom validator functions
   * @returns {string}
   */
  _getCustomError(element, ...args) {
    if (!this.args.validators) return '';

    const error = this.customValidate(...args);

    if (!error) {
      this.lastElementWithCustomError = null;

      return '';
    } else if (typeof error === 'string') {
      this._setCustomValidity(element, error, /** isAriaInvalid*/ true);
      this.lastElementWithCustomError = element;

      return error;
    }

    return '';
  }

  /**
   * Helper function to set or clear the error attributes on the element. It handles the error differently
   * based on whether or not `setCustomValidity` is available function on this element.
   * @param {Element} invalidElement
   * @param {String} errorMessage
   * @param {Boolean} isAriaInvalid
   */
  _setCustomValidity(invalidElement, errorMessage, isAriaInvalid) {
    if (!invalidElement.setCustomValidity) {
      invalidElement.dataset.errorMessage = errorMessage;
      invalidElement.setAttribute('aria-invalid', isAriaInvalid);
    } else {
      invalidElement.setCustomValidity(errorMessage);
    }
  }

  /**
   * Recursively collect constraint violation within the given root element
   *
   * @param {DOMNode} rootElement
   * @returns {String} error string, empty string (`''`) if no error
   */
  _collectConstraintViolation(rootElement) {
    const element = rootElement.querySelector('input,select') ?? rootElement;
    if (
      element.validity &&
      !element.validity.customError &&
      !element.validity.valid
    ) {
      // TODO @bear
      // if (element.validity.valueMissing) {
      // } else if (element.validity.typeMismatch) {
      // } else if (element.validity.patternMismatch) {
      // }
      // TODO bhsiung - support min (rangeUnderflow) & max (rangeOverflow) for type=number
      // TODO bhsiung - support minlength (tooShort) & maxlength (tooLong)
      return element.validationMessage;
    }

    return undefined;
  }

  @action
  onUpdate(element) {
    console.log('update');
    this.inputElement = element.querySelector('input,select');
    assert(
      'more than 2 input elements detected within the component, only the first one will be used for validation',
      element.querySelectorAll('input,select').length === 1
    );

    this.contextualValidator(this.inputElement, this.args.value);
  }

  onInsert() {
    console.log('insert');
  }
  /**
   * Perform a series of form validation, will be invoked by form input field (oninput)
   *
   * @param {DOMNode} rootElement - the root element of the input field
   * @param {array} ...args - the information needed for validation. this part requires a co-op between
   *   the input component and the custom validator functions
   * @return {string}
   */
  @action contextualValidator(rootElement, ...args) {
    if (this.lastElementWithCustomError) {
      // this is needed for a corner case. assume both constraint and custom validator exists, a
      // node failed on custom validation from the last execution, user fixed it but violate the
      // constraint validation immediately. There is no easy way to tell if there is constraint
      // validation without rest the custom error first
      this._setCustomValidity(
        this.lastElementWithCustomError,
        /** errorMessage */ '',
        /** isAriaInvalid*/ false
      );
    }

    console.log(
      this._collectConstraintViolation(rootElement) ??
        this._getCustomError(rootElement, ...args)
    );
    return set(
      this,
      'error',
      this._collectConstraintViolation(rootElement) ??
        this._getCustomError(rootElement, ...args)
    );
  }
}
