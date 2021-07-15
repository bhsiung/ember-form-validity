import { setProperties } from '@ember/object';
import Component from '@ember/component';
import layout from 'ember-form-validation/components/validator-container';

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
export default Component.extend({
  layout,
  validating: false,
  isValid: true,
  actions: {
    checkForm(saveForm, event) {
      event.preventDefault();

      const invalidSelector = 'form :invalid, form [aria-invalid="true"]';
      const isValid = !this.element.querySelector(invalidSelector);

      setProperties(this, { isValid, validating: true });
      if (!isValid) {
        this.element.querySelector(invalidSelector).focus();
      }

      if (isValid) {
        saveForm();
      }
    },
  },
});
