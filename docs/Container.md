# ValidatorContainer

this is the only component that is needed to setup to get everything done.

## `ValidationContainer`

### Properties

#### validationg `Boolean`
An optional prop that determine if validation mode is active or not, it can be useful for forms that does NOT proceed validating until the first attempt of submission. However, the value will be set to true while when the user invoke the `checkFrom` action.

### Yield properties

#### validity `WrapperComponent`
A wrapper component that allow the user to defne the custom validation functions per input (or related inputs).

#### checkForm `Callback`
A proxy function examine the correctness of the corrent form data. If the form is correct, the chained callback function will be invoke.

#### isValid `Boolean`
A flag to determine if everything on the form is valid

## Example
```
<ValidatorContainer @validating={{false}} as |v|>
  <v.validity>
    ...
  </v.validity>
  <button
    disabled={{not v.isValid}}
    {{on 'click' (fn v.checkForm this.onSubmit)}}
  >
    save
  </button>
</ValidatorContainer>
```

## `WrapperComponent`
Each input (or related input group) shall be wrapped within this components. You can specify the dedicated validation function receive the error message of the input element.

## Example
```
<ValidatorContainer as |v|>
  <v.validity
    @model={{hash email=this.email}}
    @validator={{this.isGmail}}
    as |validity|
  >
    <input name="email" required />
    <p>{{validity.errorMessage.email}}</p>
  </v.validity>
  <button
    disabled={{not v.isValid}}
    {{on 'click' (fn v.checkForm this.onSubmit)}}
  >
    save
  </button>
</ValidatorContainer>
```

### Properties

#### model `Object`
The wrapper component subscribe the change of user input thru this property. Keep in mind that the strcuture of the `model` is a key-value hash, the `key` represents the `name` attribute of the input element.

#### validator `Callback|Callback[]`
An optional function (or functions) can be passed here as custom validator, the function will be perform **AFTER** the element passed the native constraint validation.

Here is an example of callback functions:
```js
function isGmail(model) {
  const { email } = mdoel;
  return /.+@gmail\.com$/.test(email)
    ? { email: '' }
    : { email: 'Only gmail account is allowed' };
}
```
The argument `model` is perceived from the latest [`model`](#modelobject) property from the component property assigned to [`WrapperComponent`](#wrappercomponent); and it returns an error message object which contributes to the production of [`errorMessage`](#errormessageobject) from the yield properties.
<!-- TODO @bear add more content -->

### Yield properties

#### errorMessage `Object`
TBD
<!-- TODO bear add more content -->
