import Component from '@glimmer/component';
import { setProperties, action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { intersection } from 'ember-form-validity/utils/array-helpers';
import { warn } from '@ember/debug';
import {
  FORM_ELEMENT_WITHOUT_NAME_ATTR,
  MALFORMED_CUSTOM_VALIDATOR_RETURN,
  VALIDATOR_ERROR_MISMATCH_ELEMENT_NAME,
} from 'ember-form-validity/constants/warning-id';
import {
  isEmptyValidationError,
  isValidValidationError,
  isValidationKeyMatch,
} from 'ember-form-validity/utils/validate-error';
import { isEmpty } from '@ember/utils';
import { debounce } from '@ember/runloop';

/**
 * The structured error message will be used to print the error message, using
 * key-value structure that maps the element `name` attribute to the error
 * message it associates to
 * @type {Object.<string, string>} ValidationError
 */

/**
 * The structured model will be used to associates the current value of each
 * input element, using key-value structure that maps the element `name`
 * attribute to its value
 * @type {Object.<string, any>} ModelForValidation
 */

/**
 * This callback produce customized error message for constraint validation
 * @callback CustomErrorFactory
 * @param {DOMNode} element - the target input element
 * @return {String} the designated error message.
 */

/**
 * This callback represents the custom validation such as max length check
 * @callback CustomValidatorCallback
 * @param {ModelForValidation} model
 * @return {ErrorObject}
 */

/**
 * @param {boolean} validating - determine if the form is in validating mode
 * @param {ModelForValidation} model - immutable model to be used for validation
 * @param {CustomValidatorCallback|CustomValidatorCallback[]} [validator] - single or a set of validator to be tested
 * @param {Function} [onWrapperValidate] - trigger and report the validation result to the container
 * @param {Function} [registerId] - assigned an ID from the container for tracking
 * @param {Function} [unregisterId] - unassigned an ID from the container for tracking (used when destroying)
 * @param {CustomErrorFactory} [customErrorFactory]
 *
 * yield properties
 * @param {ValidationError} errorMessage
 *
 * e.g.
 * <ValidatorWrapper
 *   @validator={{this.notLinkedinEmail}}
 *   @validating={{this.validating}}
 *   @onWrapperValidate={{this.onWrapperValidate}}
 *   @registerId={{this.registerId}}
 *   @model={{hash email=this.email}}
 *   @customErrorFactory={{custom-error-message}}
 *   as |v|
 * >
 *   <input
 *     name="email"
 *     value={{this.model.email}}
 *     {{on "input" this.onInput}}
 *     required
 *   />
 *   <p data-test-error>{{v.errorMessage.email}}</p>
 * </ValidatorWrapper>
 */
export default class ValidatorWrapper extends Component {
  /**
   * @type {ValidationError}
   */
  @tracked error = {};

  /**
   * A flag to indicate if there has been a custom error detected from the last round
   * @type {boolean}
   */
  hadCustomError = false;

  /**
   * A flag to indicate if the wrapper is currently loading async validation
   * @type {boolean}
   */
  @tracked loading = false;

  /**
   * proxied error message based on the `validating` flag
   * @readonly
   * @memberof ValidatorWrapper
   * @type {string}
   */
  get errorMessage() {
    return this.args.validating ? this.error : {};
  }
  /**
   * a generic reference point to the array of validator argument
   * @readonly
   * @memberof ValidatorWrapper
   * @type {Function[]}
   */
  get validators() {
    if (!this.args.validator) return [];
    if (Array.isArray(this.args.validator)) {
      return this.args.validator;
    }
    return [this.args.validator];
  }

  constructor() {
    super(...arguments);
    if (isEmpty(this.args.model))
      throw new Error('model prop is required for validator wrapper');
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.args.unregisterId?.(this?.wrapperId);
  }

  /**
   * @returns {ValidationError}
   */
  async _customValidate() {
    this.loading = true;
    for (const validator of this.validators) {
      const result = await validator(this.args.model);
      if (this.isDestroying || this.isDestroyed) return {};
      if (!isValidValidationError(result)) {
        warn(
          'The error result need to conform the key-value pair format. e.g { "input-name": "error message" }',
          false,
          { id: MALFORMED_CUSTOM_VALIDATOR_RETURN }
        );
      } else {
        if (!isValidationKeyMatch(result, this.targetInputNames)) {
          warn('The error key mismatches the input element name', false, {
            id: VALIDATOR_ERROR_MISMATCH_ELEMENT_NAME,
          });
        }
        if (!isEmptyValidationError(result)) {
          this.loading = false;
          return result;
        }
      }
    }
    this.loading = false;
    return {};
  }

  /**
   * @param {DOMNode} element - the wrapper element
   * @returns {ValidationError}
   */
  async _collectCustomViolation(element) {
    if (this.validators.length === 0) return {};

    const error = await this._customValidate(element);
    if (this.isDestroying || this.isDestroyed) return {};
    this._setCustomValidity(element, error);
    this.hadCustomError = true;

    return error;
  }

  /**
   * Helper function to set or clear the error attributes on the element. It
   * handles the error differently based on whether or not `setCustomValidity`
   * is available function on this element.
   * @param {Element} rootElement
   * @param {ValidationError} error
   */
  _setCustomValidity(rootElement, error) {
    if (this.targetInputNames.length) {
      for (const inputName of this.targetInputNames) {
        const inputElement = rootElement.querySelector(`[name=${inputName}]`);
        if (inputElement.setCustomValidity) {
          inputElement.setCustomValidity(error[inputName] ?? '');
        }
      }
    } else {
      const customInputElement = rootElement.querySelector(
        '[contenteditable="true"]'
      );
      if (customInputElement) {
        const isValid = Object.values(error).reduce(
          (valid, errorMessage) => valid && !errorMessage,
          true
        );
        customInputElement.setAttribute(
          'aria-invalid',
          isValid ? 'false' : 'true'
        );
      }
    }
  }

  /**
   * @param {DOMNode} rootElement
   * @returns {ValidationError}
   */
  _collectConstraintViolation(rootElement) {
    const elements = rootElement.querySelectorAll('input,select') ?? [
      rootElement,
    ];
    const error = {};
    for (const element of elements) {
      if (
        this.targetInputNames.indexOf(element.name) > -1 &&
        element.validity &&
        !element.validity.customError &&
        !element.validity.valid
      ) {
        if (this.args.customErrorFactory) {
          error[element.name] = this.args.customErrorFactory(element);
        } else {
          error[element.name] = element.validationMessage;
        }
      }
    }

    return error;
  }

  /**
   * @param {DOMNode} element
   * @memberof ValidatorWrapper
   */
  _collectInputNames(element) {
    const modelKeys = Object.keys(this.args.model);
    const inputElements = [...element.querySelectorAll('input,select')];
    const inputNames = inputElements.reduce(
      (names, element) =>
        names.indexOf(element.name) === -1 ? [...names, element.name] : names,
      []
    );

    this.targetInputNames = intersection(modelKeys, inputNames);
    // TODO @bear - add test coverage
    warn(
      'Discovered some inputs does not have a `name` attribute, they will be ignored while validating',
      !element.querySelectorAll('input:not([name]),select:not([name])').length,
      { id: FORM_ELEMENT_WITHOUT_NAME_ATTR }
    );
  }

  @action
  onReceiveProperties(element) {
    this._collectInputNames(element);
    this.contextualValidator(element);
  }

  @action
  onInsert(element) {
    this.wrapperId = this.args.registerId?.();
    this._collectInputNames(element);
    this.contextualValidator(element);
  }

  /**
   * debounced validation handler
   * @param {DOMNode} rootElement
   * @return {ValidationError}
   */
  @action
  async contextualValidator(rootElement) {
    debounce(this, this._contextualValidator, rootElement, 150);
  }

  /**
   * @param {DOMNode} rootElement
   * @return {ValidationError}
   */
  async _contextualValidator(rootElement) {
    if (this.hadCustomError) {
      // this is needed for a corner case. assume both constraint and custom validator exists, a
      // node failed on custom validation from the last execution, user fixed it but violate the
      // constraint validation immediately. There is no easy way to tell if there is constraint
      // validation without rest the custom error first
      this._setCustomValidity(rootElement, {});
    }

    let error = {};
    const errorFromConstraintValidation =
      this._collectConstraintViolation(rootElement);
    const anyFieldPassedConstraintValidation =
      this.targetInputNames.length === 0 ||
      this.targetInputNames.length >
        Object.keys(errorFromConstraintValidation).length;
    if (anyFieldPassedConstraintValidation) {
      error = {
        ...(await this._collectCustomViolation(rootElement)),
        ...errorFromConstraintValidation,
      };
      if (this.isDestroying || this.isDestroyed) return {};
    } else {
      error = errorFromConstraintValidation;
    }

    if (this.args.onWrapperValidate) {
      this.args.onWrapperValidate(
        this.wrapperId,
        isEmptyValidationError(error)
      );
    }

    if (!this.isDestroying && !this.isDestroyed) {
      return setProperties(this, { error });
    }
  }
}
