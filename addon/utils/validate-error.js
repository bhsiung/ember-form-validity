import { isHTMLSafe } from '@ember/template';
import { isEmpty } from '@ember/utils';

export function isValidValidationError(object) {
  if (Array.isArray(object)) return false;
  if (typeof object !== 'object') return false;
  if (isEmpty(object)) return false;
  for (const name of Object.keys(object)) {
    if (typeof object[name] === 'string') continue;
    if (!isHTMLSafe(object[name])) return false;
  }
  return true;
}
export function isEmptyValidationError(object) {
  if (!isValidValidationError(object))
    throw new Error(
      'The given object is invalid, unable to identify whether the validation has pass'
    );
  if (Object.keys(object).length === 0) return true;
  for (const key of Object.keys(object)) {
    if (object[key]) return false;
  }
  return true;
}
export function isValidationKeyMatch(object, availableNames) {
  if (!isValidValidationError(object)) return false;

  const errorKeys = Object.keys(object);
  for (const errorKey of errorKeys) {
    if (!availableNames.includes(errorKey)) return false;
  }
  return true;
}
