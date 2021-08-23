# Basic use cases

The vadility component covers any kind of form element, here we listed all the possible validation can be handled with the constraint validation from browser. They are 3 kinds:
- numeric value: `date`, `month`, `week`, `time`, `datetime-local`, `number` and `range`
- string value: `text`, `password`, `email`, `url`

Keep in mind in this page, we tried to list down most common input types that may involve validation. And provide examples of implementation with only browser API, there is another topic for the [usage of custom validation function](/01%20-%20API/#validatorcallbackcallback) and how to [customize the default error message](/03%20-%20Advanced%20usage/02%20-%20Customize%20error/) from browser API.

## Numeric value

list of attributes available for validation:
- step
- max
- min

## Number

Number is the most basic numeric input type, most of the modern browsers already blocked the input from none numeric charcters.
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="number"
      value={{this.value}}
      onInput={{this.onInput}}
      required
      step="0.5"
      min="30.00"
      max="75.00"
      name="value"
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

## Range

Range is very similar to `number`, provide a different visual. Thanks for the restriction of input method, the user cannot enter any value manually which leads to invalid.
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="range"
      value={{this.value}}
      onInput={{this.onInput}}
      required
      step="0.5"
      min="30.00"
      max="75.00"
      name="value"
    />
    <div>value: {{this.value}}</div>
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>

```

## date (type=date|month|week|time|datetime-local)

Most of the modern browsers can render a calender for date input and already black out the unavailable dates for selection. However the error can still arise with bad user input from typing.
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="date"
      value={{this.value}}
      onInput={{this.onInput}}
      required
      step="7"
      min="2021-01-15"
      max="2021-09-15"
      name="value"
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

### month
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="month"
      value={{this.value}}
      onInput={{this.onInput}}
      required
      step="2"
      min="2021-01"
      max="2021-09"
      name="value"
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

### week
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="week"
      value={{this.value}}
      onInput={{this.onInput}}
      required
      step="2"
      min="2021-W30"
      max="2021-W35"
      name="value"
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

### time
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="time"
      value={{this.value}}
      onInput={{this.onInput}}
      required
      step="900"
      min="09:30:00"
      max="12:00:00"
      name="value"
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

### datetime-local
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="datetime-local"
      value={{this.value}}
      onInput={{this.onInput}}
      required
      step="900"
      min="2021-09-01T09:30:00"
      max="2021-09-30T18:00:00"
      name="value"
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```


## String fields

list of attributes available for validation:
- pattern
- maxlength
- minlength

### text (text|password|email|url)
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="text"
      value={{this.value}}
      onInput={{this.onInput}}
      name="value"
      pattern="[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1-3}"
      minlength="10"
      maxlength="13"
      required
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

### password
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="password"
      value={{this.value}}
      onInput={{this.onInput}}
      name="value"
      pattern="[0-9a-zA-Z!@#]{8,15}"
      minlength="8"
      maxlength="15"
      required
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

### url
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="url"
      value={{this.value}}
      onInput={{this.onInput}}
      name="value"
      pattern="http:.*"
      minlength="10"
      maxlength="15"
      required
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```

### email
```hbs
<ValidatorContainer as |v|>
  <v.validity @model={{hash value=this.value}} as |validity|>
    <input
      type="email"
      value={{this.value}}
      onInput={{this.onInput}}
      name="value"
      pattern="[a-z0-9]{1,10}@gmail.com"
      minlength="12"
      maxlength="20"
      required
    />
    {{#if validity.errorMessage.value}}
      <br />
      <br />
      {{validity.errorMessage.value}}
    {{/if}}
  </v.validity>
</ValidatorContainer>
```
