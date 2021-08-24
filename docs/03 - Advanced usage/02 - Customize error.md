# Customize error message for constraint validation
Although the browser provide a very high quality error message when things go wrong, the message can still be considered too generic sometimes, because it is how it was designed. However, `ValidatorWrapper` allows developers to create functions to override the default behavior. The function will be invoked in the middle of the validation process, suppress the default error message if a custom error presents.

### param
**element** *{DOMNode}* the target input element
### return
*{string}* the designated error message.

```js
@action
customErrorFactory(element) {
  if (element.validity.valueMissing) {
    return 'Password is required, please enter at least 6 characters.';
  } else if (element.validity.patternMismatch) {
    return 'Only alphabet and digit are allowed.';
  }
  return element.validationMessage;
}
```
The `element` is provided for you to examine the type of `validity` issue, and perform a switch-case style of control. keep in mind, don't forget to return default error message (`element.validationMessage`) for uncovered edge case. For example, `element.validity.tooShort` is reserved intentionally. So the default error message from the browser will take place. 

```hbs
<ValidatorContainer as |v|>
  <v.validity
    @validator={{this.customValidator}}
    @model={{hash password=this.password}}
    @customErrorFactory={{this.customErrorFactory}}
    as |validity|
  >
    <input
      type="password"
      value={{this.password}}
      onInput={{this.onInput}}
      name="password"
      pattern="[a-zA-Z0-9]+"
      minlength="6"
      maxlength="30"
      required
    />
    {{#if validity.errorMessage.password}}
      <p data-test-error>{{validity.errorMessage.password}}</p>
    {{/if}}
  </v.validity>
</ValidatorContainer>
```
