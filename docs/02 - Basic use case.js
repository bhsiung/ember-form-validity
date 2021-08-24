import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class SampleComponent extends Component {
  @tracked number = '';
  @tracked range = '';
  @tracked date = '';
  @tracked datetime = '';
  @tracked month = '';
  @tracked week = '';
  @tracked time = '';
  @tracked text = '';
  @tracked password = '';
  @tracked url = '';
  @tracked email = '';

  @action
  onInput(e) {
    this[e.target.name] = e.target.value;
  }
}
