import Modifier from 'ember-modifier';
import { assert } from '@ember/debug';

export default class Validates extends Modifier {
  inputElement;
  didReceiveArguments() {
    const [validator] = this.args.positional;
    const { value } = this.args.named;
    if (!validator) throw new Error('no validator found');
    this.validator = validator;
    this.inputElement = this.element.querySelector('input,select');
    assert(
      'more than 2 input elements detected within the component, only the first one will be used for validation',
      this.element.querySelectorAll('input,select').length === 1
    );

    this.validator(this.inputElement, value);
  }
}
