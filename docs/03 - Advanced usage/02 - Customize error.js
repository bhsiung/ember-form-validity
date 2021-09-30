import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class SampleComponent extends Component {
  @tracked password = '';

  @action
  customErrorFactory(element) {
    if (element.validity.valueMissing) {
      return 'Password is required, please enter at least 6 characters.';
    } else if (element.validity.patternMismatch) {
      return 'Only alphabet and digit are allowed.';
    } else if (element.validity.tooShort) {
      return 'password is too short, please enter at least 6 characters';
    }
    return element.validationMessage;
  }

  @action
  onInput(e) {
    this.password = e.target.value;
  }
}
