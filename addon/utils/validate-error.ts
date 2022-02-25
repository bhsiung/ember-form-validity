import { isHTMLSafe } from '@ember/template';
import { isEmpty } from '@ember/utils';
import { ValidationError } from 'ember-form-validity/components/validator-wrapper';

export function isValidValidationError(object: ValidationError) {
  if (Array.isArray(object)) return false;
  if (typeof object !== 'object') return false;
  if (isEmpty(object)) return false;
  for (const name of Object.keys(object)) {
    if (typeof object[name] === 'string') continue;
    if (!isHTMLSafe(object[name])) return false;
  }
  return true;
}
export function isEmptyValidationError(object: ValidationError) {
  if (Object.keys(object).length === 0) return true;
  for (const key of Object.keys(object)) {
    if (object[key]) return false;
  }
  return true;
}
export function isValidationKeyMatch(
  object: ValidationError,
  availableNames: string[]
) {
  const errorKeys = Object.keys(object);
  for (const errorKey of errorKeys) {
    if (!availableNames.includes(errorKey)) return false;
  }
  return true;
}
