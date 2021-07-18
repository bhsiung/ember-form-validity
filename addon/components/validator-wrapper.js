import Component from '@glimmer/component';
import { action, setProperties } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { intersection } from 'ember-form-validation/utils/array-helpers';
import { assert, warn } from '@ember/debug';
import {
  FORM_ELEMENT_WITHOUT_NAME_ATTR,
  MALFORMED_CUSTOM_VALIDATOR_RETURN,
  VALIDATOR_ERROR_MISMATCH_ELEMENT_NAME,
} from 'ember-form-validation/constants/warning-id';
import {
  isEmptyValidationError,
  isValidValidationError,
  isValidationKeyMatch,
} from 'ember-form-validation/utils/validate-error';
import { isEmpty } from '@ember/utils';

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
 * This callback represents the custom validation such as max length check
 * @callback CustomValidatorCallback
 * @param {ModelForValidation} model
 * @return {ErrorObject}
 */

/**
 * @param {boolean} validating - determine if the form is in validating mode
 * @param {ModelForValidation} model - immutable model to be used for validation
 * @param {CustomValidatorCallback[]} [validators] - a set of validator to be test against
 * @param {Function} [onWrapperValidate] - trigger and report the validation result to the container
 * @param {Function} [registerId] - assigned an ID from the container for tracking
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
    return (
      this.args.validators ?? (this.args.validator ? [this.args.validator] : [])
    );
  }

  constructor() {
    super(...arguments);
    if (isEmpty(this.args.model))
      throw new Error('model prop is required for validator wrapper');
  }

  /**
   * @returns {ValidationError}
   */
  _customValidate() {
    for (const validator of this.validators) {
      const result = validator(this.args.model);
      if (!isValidValidationError(result)) {
        warn(
          'The error result need to conform the key-value pair format. e.g { "input-name": "error message" }',
          false,
          { id: MALFORMED_CUSTOM_VALIDATOR_RETURN }
        );
      } else if (!isValidationKeyMatch(result, this.targetInputNames)) {
        warn('The error key mismatches the input element name', false, {
          id: VALIDATOR_ERROR_MISMATCH_ELEMENT_NAME,
        });
      } else if (!isEmptyValidationError(result)) {
        return result;
      }
    }
    return {};
  }

  /**
   * @param {DOMNode} element - the wrapper element
   * @returns {ValidationError}
   */
  _collectCustomViolation(element) {
    if (this.validators.length === 0) return {};

    const error = this._customValidate(element);

    if (!error) {
      this.hadCustomError = false;
      return {};
    } else if (typeof error === 'object') {
      this._setCustomValidity(element, error, /** isAriaInvalid*/ true);
      this.hadCustomError = true;

      return error;
    }

    return {};
  }

  /**
   * Helper function to set or clear the error attributes on the element. It
   * handles the error differently based on whether or not `setCustomValidity`
   * is available function on this element.
   * @param {Element} rootElement
   * @param {ValidationError} error
   * @param {Boolean} isAriaInvalid
   */
  _setCustomValidity(rootElement, error, isAriaInvalid) {
    for (const inputName of this.targetInputNames) {
      const inputElement = rootElement.querySelector(`[name=${inputName}]`);
      if (!inputElement.setCustomValidity) {
        isAriaInvalid;
        // TODO bear - work on artificial validation later
        // invalidElement.dataset.errorMessage = errorMessage;
        // invalidElement.setAttribute('aria-invalid', isAriaInvalid);
      } else {
        inputElement.setCustomValidity(error[inputName] ?? '');
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
        // TODO @bear
        // if (element.validity.valueMissing) {
        // } else if (element.validity.typeMismatch) {
        // } else if (element.validity.patternMismatch) {
        // }
        // TODO bhsiung - support min (rangeUnderflow) & max (rangeOverflow) for type=number
        // TODO bhsiung - support minlength (tooShort) & maxlength (tooLong)
        error[element.name] = element.validationMessage;
      }
    }

    if (this.args.onWrapperValidate)
      this.args.onWrapperValidate(
        this.wrapperId,
        isEmptyValidationError(error)
      );

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
    this.contextualValidator(element);
  }

  @action
  onInsert(element) {
    if (typeof this.args.registerId === 'function') {
      this.wrapperId = this.args.registerId();
    }
    this._collectInputNames(element);
    this.contextualValidator(element);
  }

  /**
   * @param {DOMNode} rootElement
   * @return {ValidationError}
   */
  @action
  contextualValidator(rootElement) {
    if (this.hadCustomError) {
      // this is needed for a corner case. assume both constraint and custom validator exists, a
      // node failed on custom validation from the last execution, user fixed it but violate the
      // constraint validation immediately. There is no easy way to tell if there is constraint
      // validation without rest the custom error first
      this._setCustomValidity(
        rootElement,
        /** errorMessage */ {},
        /** isAriaInvalid*/ false
      );
    }

    let error = {};
    const errorFromConstraintValidation =
      this._collectConstraintViolation(rootElement);
    const anyFieldPassedConstraintValidation =
      this.targetInputNames.length >
      Object.keys(errorFromConstraintValidation).length;
    if (anyFieldPassedConstraintValidation) {
      error = {
        ...this._collectCustomViolation(rootElement),
        ...errorFromConstraintValidation,
      };
    } else {
      error = errorFromConstraintValidation;
    }
    return setProperties(this, { error });
  }
}
