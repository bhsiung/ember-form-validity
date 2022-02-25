import { ValidationModel } from 'ember-form-validity/components/validator-wrapper';
import Modifier, { ModifierArgs } from 'ember-modifier';

interface Args extends ModifierArgs {
  positional: [ValidationModel];
  named: {
    onInsert: (element: Element) => void;
    onUpdate: (element: Element, model: ValidationModel) => void;
  };
}
export default class InstallValidationWrapper extends Modifier<Args> {
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
