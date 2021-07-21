import Modifier from 'ember-modifier';

export default class InstallValidationWrapper extends Modifier {
  didInstall() {
    const [onInsert, onUpdate, model] = this.args.positional;
    onInsert(this.element);
    onUpdate(this.element, model);
  }
  didUpdateArguments() {
    const [, onUpdate, model] = this.args.positional;
    onUpdate(this.element, model);
  }
}
