import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { later } from '@ember/runloop';

export default class SampleComponent extends Component {
  @tracked doc = '## Hello world';

  @action
  onChange(newValue) {
    this.doc = newValue;
  }

  @action
  customValidator({ doc }) {
    return { doc: doc.length > 0 ? null : 'the document cannot be empty' };
  }
}
