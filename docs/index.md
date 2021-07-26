# Welcome

This add-on aims to resolve the form validation on your WEB development. Yes, it can be straightforward build a simple solution by listening the `input` event and disable the `continue` button until it's correct. But that's clearly not always the case, especially when the project involve tons of user input. Normally a form validation library can ease the pain and setup a certain standard for consistency. Well, this is one of them, however, we are trying build a tool that is more versatile and not stop you the way.

## Build for accessibility

Most of the validation library on the market does not take accessibility seriously. They are either rely on the developer implement the a11y attributes (e.g. `required`) along the library; or provide a complete solution but it may not be exactly what you need (and sometime can be REALLY heavy too).

Here we are trying work with the native form validity API from the browser and integrate with it.

```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash email=this.email}} as |validity|>
    <input
      {{on 'input' this.onInput}}
      type='email'
      name='email'
      required
      value={{this.email}}
    />
    {{#if validity.errorMessage.email}}
      <p data-test-error>{{validity.errorMessage.email}}</p>
    {{/if}}
  </v.validity>
  <p>
    <button
      disabled={{not v.isValid}}
      {{on 'click' (fn v.checkForm this.onSubmit)}}
    >
      save
    </button>
  </p>
</ValidatorContainer>
```

In this example, we solely rely on the native [constraint validation](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation) by browser, which are the `required` and `email` attributes. When any invalid data identified, the validation component will **collect** them automatically and surface to the `errorMessage` prop from `yield` object. Meanwhile, while the form remains invalid, `isValid` is set to `false`. Which is extremely helpful to convey this so you can decide to disable the button until the issue is fixed.

When engaging the validation with [constraint validation API](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation). The default error message from the browser will be exposed in the `errorMessage` object, you can choose the customize them by declaring the error message of your own see [this doc](/advanced-usage/customize-error-message) for more detail.
