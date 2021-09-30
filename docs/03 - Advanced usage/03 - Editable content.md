# For artificial input elements
```hbs
<ValidatorContainer as |v|>
  <v.validity
    @validator={{this.customValidator}}
    @model={{hash doc=this.doc}}
    as |validity|
  >
    <TuiEditor name="doc" @value={{this.doc}} @onChange={{this.onChange}} />
    {{#if validity.errorMessage.doc}}
      <p data-test-error>{{validity.errorMessage.doc}}</p>
    {{/if}}
  </v.validity>
</ValidatorContainer>
```
