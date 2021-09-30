import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class FakeRadioButton extends Component {
  @action
  onClick(value) {
    this.args.onChange(value);
  }
}
