# For artificial input elements

For rich input component such as rich text editor, (AKA editable element), does not rely on the native DOM element for the operation. The form validity will solely depend on custom validation method. When the error occurs, it also attempt to annotate the proper `aria-invalid` attribute on the editable element.

Give a try at the example below and remove the content:

```hbs
<ValidatorContainer as |v|>
  <v.validity
    @validator={{this.customValidator}}
    @model={{hash doc=this.doc}}
    as |validity|
  >
    <TuiEditor name='doc' @value={{this.doc}} @onChange={{this.onChange}} />
    {{#if validity.errorMessage.doc}}
      <p data-test-error>{{validity.errorMessage.doc}}</p>
    {{/if}}
  </v.validity>
</ValidatorContainer>
```
