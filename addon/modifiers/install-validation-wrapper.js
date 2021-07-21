import Modifier from 'ember-modifier';

export default class InstallValidationWrapper extends Modifier {
  didInstall() {
    const { onInsert } = this.args.named;

    onInsert(this.element);
  }
  didUpdateArguments() {
    const [model] = this.args.positional;
    const { onUpdate } = this.args.named;
    onUpdate(this.element, model);
  }
}
