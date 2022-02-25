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
import { SafeString } from '@ember/template/-private/handlebars';
import { isHTMLSafe } from '@ember/template';

/**
 * The structured error message will be used to print the error message, using
 * key-value structure that maps the element `name` attribute to the error
 * message it associates to
 */
export type ValidationError = Record<string, string | SafeString>;

export type ValidationModel = Record<string, unknown>;
/**
 * This callback represents the custom validation such as max length check
 */
type CustomValidatorCallback = (
  modeL: ValidationModel
) => Promise<ValidationError> | ValidationError;

interface Args {
  // immutable model to be used for validation The structured model
  // will be used to associates the current value of each input element,
  // using key-value structure that maps the element `name` attribute to its value
  model: ValidationModel;
  validating: boolean; // determine if the form is in validating mode
  validator: CustomValidatorCallback | CustomValidatorCallback[]; // single or a set of validator to be tested
  registerId: () => number; // assigned an ID from the container for tracking
  unregisterId?: (id: number) => void; // unassigned an ID from the container for tracking (used when destroying)
  customErrorFactory: (element: HTMLInputElement) => string; // contraint validation error message generator
  onWrapperValidate: (id: number, isValid: boolean) => void; // trigger and report the validation result to the container
}
/**
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
export default class ValidatorWrapper extends Component<Args> {
  @tracked error: ValidationError = {};

  /**
   * A flag to indicate if there has been a custom error detected from the last round
   */
  hadCustomError = false;

  /**
   * A flag to indicate if the wrapper is currently loading async validation
   */
  @tracked loading = false;

  /**
   * optional id perceived from validator container
   */
  wrapperId?: number;

  targetInputNames: string[] = [];

  /**
   * proxied error message based on the `validating` flag
   */
  get errorMessage(): ValidationError {
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

  constructor(...args: [unknown, Args]) {
    super(...args);
    if (isEmpty(this.args.model))
      throw new Error('model prop is required for validator wrapper');
  }

  willDestroy() {
    super.willDestroy();
    if (this.wrapperId !== undefined) this.args?.unregisterId?.(this.wrapperId);
  }

  private async customValidate(): Promise<ValidationError> {
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

  private async collectCustomViolation(
    element: HTMLElement
  ): Promise<ValidationError> {
    if (this.validators.length === 0) return {};

    const error = await this.customValidate();
    if (this.isDestroying || this.isDestroyed) return {};
    this.setCustomValidity(element, error);
    this.hadCustomError = true;

    return error;
  }

  /**
   * Helper function to set or clear the error attributes on the element. It
   * handles the error differently based on whether or not `setCustomValidity`
   * is available function on this element.
   */
  private setCustomValidity(rootElement: HTMLElement, error: ValidationError) {
    if (this.targetInputNames.length) {
      for (const inputName of this.targetInputNames) {
        const inputElement = rootElement.querySelector(
          `[name=${inputName}]`
        ) as HTMLInputElement;
        if (inputElement.setCustomValidity) {
          const _error = error[inputName];
          const str = isHTMLSafe(_error) ? _error.toString() : _error;
          inputElement.setCustomValidity(str ?? '');
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

  collectConstraintViolation(rootElement: HTMLElement): ValidationError {
    const elements: NodeListOf<HTMLInputElement> = rootElement.querySelectorAll(
      'input,select'
    ) ?? [rootElement];
    const error: Record<string, string> = {};
    for (const element of elements) {
      const name = element.getAttribute('name') ?? '';
      if (
        name &&
        this.targetInputNames.indexOf(name) > -1 &&
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

  private collectInputNames(element: HTMLElement) {
    const modelKeys = Object.keys(this.args.model);
    const inputElements = [
      ...element.querySelectorAll('input,select'),
    ] as HTMLInputElement[];
    const inputNames = inputElements.reduce(
      (names: Set<string>, element: HTMLInputElement) => {
        const name = element.getAttribute('name');
        if (!name) return names;
        names.add(name);
        return names;
      },
      new Set()
    );

    this.targetInputNames = intersection<string>(modelKeys, inputNames);
    // TODO @bear - add test coverage
    warn(
      'Discovered some inputs does not have a `name` attribute, they will be ignored while validating',
      !element.querySelectorAll('input:not([name]),select:not([name])').length,
      { id: FORM_ELEMENT_WITHOUT_NAME_ATTR }
    );
  }

  @action
  onReceiveProperties(element: HTMLElement) {
    this.collectInputNames(element);
    this.contextualValidator(element);
  }

  @action
  onInsert(element: HTMLElement) {
    this.wrapperId = this.args.registerId?.();
    this.collectInputNames(element);
    this.contextualValidator(element);
  }

  /**
   * debounced validation handler
   */
  @action
  async contextualValidator(rootElement: HTMLElement) {
    debounce(this, this._contextualValidator, rootElement, 150);
  }

  private async _contextualValidator(rootElement: HTMLElement) {
    if (this.hadCustomError) {
      // this is needed for a corner case. assume both constraint and custom validator exists, a
      // node failed on custom validation from the last execution, user fixed it but violate the
      // constraint validation immediately. There is no easy way to tell if there is constraint
      // validation without rest the custom error first
      this.setCustomValidity(rootElement, {});
    }

    let error = {};
    const errorFromConstraintValidation =
      this.collectConstraintViolation(rootElement);
    const anyFieldPassedConstraintValidation =
      this.targetInputNames.length === 0 ||
      this.targetInputNames.length >
        Object.keys(errorFromConstraintValidation).length;
    if (anyFieldPassedConstraintValidation) {
      error = {
        ...(await this.collectCustomViolation(rootElement)),
        ...errorFromConstraintValidation,
      };
      if (this.isDestroying || this.isDestroyed) return;
    } else {
      error = errorFromConstraintValidation;
    }

    if (this.args.onWrapperValidate && this.wrapperId !== undefined) {
      this.args.onWrapperValidate(
        this.wrapperId,
        isEmptyValidationError(error)
      );
    }

    if (!this.isDestroying && !this.isDestroyed) {
      setProperties(this, { error });
    }
  }
}
