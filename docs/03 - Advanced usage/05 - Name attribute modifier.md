# Name attribute injection

By design, `name` attribute is required on the target `<input>` element in order to kick off the validation. However sometimes the the component that renders the element is remote and does not have the API specifying the `name` attribute. This helper allows to bind the name on the inner element.

## Positional arguments

#### name `{string}`
The name string that will embed to the `<input>`

#### selector `{string}` (optional)
The DOM selector string to the `<input>` that can help the modifier to better locate it.

## Without specifying the selector
The modifier will insert `name` attribute to the first `<input>` or `<select>` element encountered

```hbs
<div data-test-element {{install-name-attr "email"}}>
  <input
    placeholder="username@email.com"
    autocomplete="off"
    type="email"
    data-test-email
    value={{this.email}}
    required
  />
</div>
```

## Specifying the selector

```hbs
<div data-test-element {{install-name-attr "email" ".foo"}}>
  <div class="foo">
    <input
      placeholder="username@email.com"
      autocomplete="off"
      type="email"
      data-test-email
      value={{this.email}}
      required
    />
  </div>
</div>
```
