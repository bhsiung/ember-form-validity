# ValidatorContainer

this is the only component that is needed to setup to get everything done.

## `ValidationContainer`

### Properties

**validationg** `Boolean`
An optional prop that determine if validation mode is active or not, it can be useful for forms that does NOT proceed validating until the first attempt of submission. However, the value will be set to true while when the user invoke the `checkFrom` action.

### Yield properties

**validity** `WrapperComponent`
A wrapper component that allow the user to defne the custom validation functions per input (or related inputs).

**checkForm** `Callback`
A proxy function examine the correctness of the corrent form data. If the form is correct, the chained callback function will be invoke.

**isValid** `Boolean`
A flag to determine if everything on the form is valid

## Usage

Simplest use case: a button with text in it, telling the user what to do.

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

More examples:

```html
<button type="button" name="button">How about now?</button>
```
