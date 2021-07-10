import Component from '@ember/component';
import layout from 'ember-form-validation/components/validator-wrapper';
import { computed, get, set } from '@ember/object';
import { inject as service } from '@ember/service';

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
export default Component.extend({
  i18n: service('i18n'),
  jet: service('jet'),
  layout,

  /**
   * The error message will be used to print the error message
   * @type {string}
   */
  error: '',

  tagName: '',

  /**
   * A reference point to the last invalid input field, will be used to reset before a new round of validation
   * @type {DOMNode}
   */
  lastElementWithCustomError: null,

  /**
   * proxied error message based on the `validating` flag
   * @type {string}
   */
  errorMessage: computed('error', 'validating', function() {
    return this.validating ? this.error : '';
  }).readOnly(),

  /**
   * Perform custom validating against given list of validators, stop and return as soon as first failure
   *
   * @param {array} ...args - the information needed for validation. this part requires a co-op between
   *   the input component and the custom validator functions
   * @returns {ErrorObject}
   */
  customValidate(...args) {
    if (Array.isArray(this.validators)) {
      for (const validator of this.validators) {
        const result = validator(...args);

        if (result) return result;
      }
    }

    return null;
  },

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
  _getCustomError(rootElement, ...args) {
    if (!this.validators) return '';

    const error = this.customValidate(...args);

    if (!error) {
      this.lastElementWithCustomError = null;

      return '';
    } else if (typeof error === 'object') {
      const invalidElement = rootElement.querySelector(`[name="${error.name}"]`);

      if (!invalidElement && error.message) {
        throw new Error(`selector of [name="${error.selector}"] cannot find anything`);
      }

      this._setCustomValidity(invalidElement, error.message, /** isAriaInvalid*/ true);
      this.lastElementWithCustomError = invalidElement;

      return error.message;
    }

    return '';
  },

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
  },

  /**
   * Recursively collect constraint violation within the given root element
   *
   * @param {DOMNode} rootElement
   * @returns {String} error string, empty string (`''`) if no error
   */
  _collectConstraintViolation(rootElement) {
    const elementsForConstraintValidation = [rootElement, ...rootElement.querySelectorAll('input[name],select[name]')];
    const valueMissingToI18nMap = {
      input: 'i18n_js_validity_input_value_missing',
      select: 'i18n_js_validity_select_value_missing'
    };
    const typeMismatchToI18nMap = {
      email: 'i18n_js_validity_type_mismatch_email',
      url: 'i18n_js_validity_type_mismatch_url'
    };

    for (const element of elementsForConstraintValidation) {
      if (element.validity && !element.validity.customError && !element.validity.valid) {
        const inputType = element.getAttribute('type') && element.getAttribute('type').toLowerCase();
        const tagName = element.tagName.toLowerCase();

        if (element.validity.valueMissing && valueMissingToI18nMap[tagName]) {
          return get(this, 'i18n').lookupTranslation(
            'ember-ts-job-posting@components/shared/validator-wrapper',
            valueMissingToI18nMap[tagName]
          )();
        } else if (element.validity.typeMismatch && typeMismatchToI18nMap[inputType]) {
          return get(this, 'i18n').lookupTranslation(
            'ember-ts-job-posting@components/shared/validator-wrapper',
            typeMismatchToI18nMap[inputType]
          )();
        } else if (element.validity.patternMismatch) {
          return get(this, 'i18n').lookupTranslation(
            'ember-ts-job-posting@components/shared/validator-wrapper',
            'i18n_js_validity_pattern_mismatch'
          )();
        }
        // TODO bhsiung - support min (rangeUnderflow) & max (rangeOverflow) for type=number
        // TODO bhsiung - support minlength (tooShort) & maxlength (tooLong)
        this.jet.logError(
          `The invalidation is not categorized, unable to render a predefined error message via LI i18n library. Utilized the default error message by browser: ${element.validationMessage}`,
          [
            'ember-ts-job-posting',
            'ember-ts-job-posting@addon/components/shared/validator-wrapper#_collectConstraintViolation'
          ],
          false
        );
        return element.validationMessage;
      }
    }

    return '';
  },

  actions: {
    /**
     * Perform a series of form validation, will be invoked by form input field (oninput)
     *
     * @param {DOMNode} rootElement - the root element of the input field
     * @param {array} ...args - the information needed for validation. this part requires a co-op between
     *   the input component and the custom validator functions
     * @return {string}
     */
    contextualValidator(rootElement, ...args) {
      if (this.lastElementWithCustomError) {
        // this is needed for a corner case. assume both constraint and custom validator exists, a
        // node failed on custom validation from the last execution, user fixed it but violate the
        // constraint validation immediately. There is no easy way to tell if there is constraint
        // validation without rest the custom error first
        this._setCustomValidity(this.lastElementWithCustomError, /** errorMessage */ '', /** isAriaInvalid*/ false);
      }

      return set(
        this,
        'error',
        this._collectConstraintViolation(rootElement) || this._getCustomError(rootElement, ...args)
      );
    }
  }
});
