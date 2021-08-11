import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { later } from '@ember/runloop';

export default class SampleComponent extends Component {
  @tracked email = '';

  @action
  async customValidator({ email }) {
    return new Promise((resolve, reject) => {
      if (/^invalid/.test(email)) {
        later(null, () => resolve({ email: 'ASYNC_VALIDATION_ERROR' }), 1000);
      } else {
        later(null, () => resolve({ email: '' }), 1000);
      }
    });
  }

  @action
  onInput(e) {
    this.email = e.target.value;
  }

  @action
  onSubmit() {
    alert('all passed!');
  }
}
