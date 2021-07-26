import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ButtonGlimmerComponent extends Component {
  @tracked email = '';

  @action
  onInput(e) {
    this.email = e.target.value;
  }

  @action
  onSubmit() {
    alert('all passed!');
  }
}
