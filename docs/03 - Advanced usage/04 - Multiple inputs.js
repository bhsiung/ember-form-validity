import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { later } from '@ember/runloop';

export default class SampleComponent extends Component {
  @tracked value = '';
  @tracked method = '';

  @action
  customValidator({ value, method }) {
    return {
      value: /invalid/.test(value)
        ? 'CUSTOM_VALIDATION_ERROR1'
        : method === 'url' && /\.com/.test(value)
        ? ''
        : 'CUSTOM_VALIDATION_ERROR2',
      method: '',
    };
  }

  @action
  onChangeValue(e) {
    this.value = e.target.value;
  }

  @action
  onChangeMethod(e) {
    this.method = e.target.value;
  }

  @action
  onSubmit() {
    alert('all passed!');
  }
}
