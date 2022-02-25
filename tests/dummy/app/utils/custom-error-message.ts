export function getErrorFromElement(element: HTMLInputElement): string {
  if (element.name === 'date') {
    if (element.validity.valueMissing) {
      return 'VALUE_MISSING';
    } else if (element.validity.typeMismatch) {
      return 'TYPE_MISMATCH';
    } else if (element.validity.patternMismatch) {
      return 'PATTERN_MISMATCH';
    } else if (element.validity.rangeOverflow) {
      return 'VALUE_TOO_MUCH';
    } else if (element.validity.rangeUnderflow) {
      return 'VALUE_TOO_LOW';
    } else if (element.validity.stepMismatch) {
      return 'VALUE_MISMATCH_STEP';
    }
  } else if (element.name === 'url') {
    if (element.validity.typeMismatch) {
      return 'TYPE_MISMATCH';
    } else if (element.validity.patternMismatch) {
      return 'PATTERN_MISMATCH';
    } else if (element.validity.tooLong) {
      return 'VALUE_TOO_LONG';
    } else if (element.validity.tooShort) {
      return 'VALUE_TOO_SHORT';
    }
  }
  return element.validationMessage;
}
