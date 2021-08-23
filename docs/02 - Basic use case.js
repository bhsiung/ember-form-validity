import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class SampleComponent extends Component {
  @tracked value = '';

  @action
  onInput(e) {
    this.value = e.target.value;
  }
}
