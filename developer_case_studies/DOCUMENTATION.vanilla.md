# Provenance Widgets Starter Code

This repository contains the starter code for the Provenance Widgets library. Provenance Widgets is a library of GUI widgets that encode analytical provenance information in the form of embedded visualizations. The widgets have been used in the [`main.ts`](./src/main.ts) file.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/)

## Getting Started

If you wish to start from scratch, jump straight to the [Installation](#Installation) section. To use the starter code, clone this repository and install the dependencies using `npm install`.

## Running the App

To run the app, use the following command:

```bash
npm run dev
```

This will start the app on [http://localhost:5173/](http://localhost:5173/).

## Installation

The library is hosted on Dropbox as a gzipped tarball. You can download it [here](https://www.dropbox.com/scl/fi/4112zqx985xcw1bylib31/provenance-widgets-0.0.1.tgz?rlkey=wkd8p7k36gzcl1atggr5ic7wv&dl=1). Alternatively, you can install it with npm using:

```sh
npm i "https://www.dropbox.com/scl/fi/4112zqx985xcw1bylib31/provenance-widgets-0.0.1.tgz?rlkey=wkd8p7k36gzcl1atggr5ic7wv&dl=1"
```

## Usage

All widgets extend an existing component's class. Hence, all original properties/attributes and methods of the component are available to the widget. For example, the `Slider` widget extends [ngx-slider's `SliderComponent`](https://angular-slider.github.io/ngx-slider/) class. Hence, attributes such as `value` and `highValue` from the ngx-slider `SliderComponent` class are available to the `Slider` widget.

Since these widgets extend Angular components, you may notice `[attr]` and `(event)` in the base components' documentation. These are Angular's property binding (`@Input`) and event binding (`@Output`) syntax, respectively. For example, `[(value)]` is a two-way binding syntax that binds the `value` property to the widget and listens for changes to the `value` property. This is syntactic sugar for `[value]` and `(valueChange)`.

Outside Angular, this is equivalent to passing `value` as attribute, and listening for the `valueChange` event. It looks like this:

```html
<web-provenance-slider value="50">
</web-provenance-slider>
```
or
```javascript
const slider = document.createElement('web-provenance-slider');
slider.value = 50;
slider.addEventListener('valueChange', (event) => {
    console.log(event.detail);
});
```

For more details on converting Angular syntax to vanilla JavaScript, refer [Angular's documentation on this](https://angular.io/guide/elements#mapping).

### Common Properties
All widgets have the following common properties:

- `id`: Must be provided for the library to uniquely identify the widget, and fallback for tooltip labels.
- `data-label`: The label to display in the tooltip. If not provided, the `id` property is used.
- `provenance`: The provenance of interactions recorded by the widget. Use this property to persist-restore or modify-reconstruct the provenance. Each widget has a different provenance type, which is described in the widget's documentation.
    - Default: `undefined`
    - Widget updates when the property is changed?: Yes

- `visualize`: Whether to visualize the provenance.
    - Default: `true`
    - Widget updates when the property is changed?: No (Only applied at initialization. The widget must be unmounted and remounted to apply changes.)
- `freeze`: Whether to freeze the provenance. If `true`, the widget will not record any provenance and existing visualizations will be frozen (i.e., interactions will not update the visualizations.)
    - Default: `false`
    - Widget updates when the property is changed?: No (Only applied at initialization. The widget must be unmounted and remounted to apply changes.)

### Common Events

All widgets emit the following events:

- `provenanceChange`: Emits the current provenance when the `provenance` property is changed.

#### Slider
- Extends: [`SliderComponent`](https://angular-slider.github.io/ngx-slider/docs)
- Selector: `<web-provenance-slider>`
- Provenance type: [`SliderProvenance`](node_modules/provenance-widgets/lib/slider/slider.component.d.ts#L17). Important properties:
    - data: An array of time-stamped values.
    - revalidate: Whether to revalidate the provenance. If `true`, the widget will recompute the provenance from the `data` property.
- Custom Events:
    - `selectedChange`: Emits a [`ChangeContext`](https://github.com/angular-slider/ngx-slider/blob/67c1c7fc245a2c02fd5a3af08bd1995b7902451d/src/ngx-slider/lib/change-context.ts#L3) when the `onUserChangeEnd` event is fired.
- Note: The widget does not update when the `value` or `highValue` properties are changed. Use the `provenance` property for this purpose instead.

#### InputText
- Extends: [`AutoComplete`](https://www.primefaces.org/primeng-v15-lts/autocomplete)
- Selector: `<web-provenance-inputtext>`
- Provenance type: [`InputTextProvenance`](node_modules/provenance-widgets/lib/inputtext/inputtext.component.d.ts#L19). Important properties:
    - data: An array of time-stamped values.
    - revalidate: Whether to revalidate the provenance. If `true`, the widget will recompute the provenance from the `data` property.
- Custom Properties:
    - `value`: The value of the input field.
        - Default: `undefined`
        - Widget updates when the property is changed?: Yes
- Custom Events:
    - `valueChange`: Emits the current value when the `value` property is changed.

### Selection-type Widgets

This subset of widgets allows the user to 'select' either a single item or multiple items from a list. They share the following common properties:

- `selected`: The selected item(s) from the list.
    - Default: `undefined`
    - Widget updates when the property is changed?: Yes
- `selectedChange`: Emits the current selection when the `selected` property is changed.
- **NOTE: It is mandatory to update the `selected` property when the `selectedChange` event is fired. This is because the widget relies on explicit updates to the `selected` property to update the provenance and visualization.**
- Provenance type: [`Provenance`](node_modules/provenance-widgets/lib/provenance-widgets.service.d.ts#L18). Important properties:
    - selections: An array of time-stamped values.
    - revalidate: Whether to revalidate the provenance. If `true`, the widget will recompute the provenance from the `selections` property.


#### MultiSelect

- Extends: [`MultiSelect`](https://www.primefaces.org/primeng-v15-lts/multiselect)
- Selector: `<web-provenance-multiselect>`
- Custom properties:
    - Type of `selected`: `typeof options`, where options is the array of options to display in the multiselect. See the [MultiSelect API](https://www.primefaces.org/primeng-v15-lts/multiselect#api.properties) for more information about the `options` property.
    - Note: The `label` (value to show) and `value` (unique identifier) properties *MUST* be identified by the `optionLabel` and `dataKey` properties, respectively. Example is available in the starter code.

#### Dropdown

- Extends: [`Dropdown`](https://www.primefaces.org/primeng-v15-lts/dropdown)
- Selector: `<provenance-dropdown>`
- Custom properties/behaviors: Same as `MultiSelect`, except that the `selected` property is of type `typeof options[i]`. See the [Dropdown API](https://www.primefaces.org/primeng-v15-lts/dropdown#api.properties) for more information about the `options` property.


#### Checkbox

- Extends: [`Checkbox`](https://www.primefaces.org/primeng-v15-lts/checkbox)
- Selector: `<provenance-checkbox>`
- Custom Properties:
    - `data`: List of items to select from.
        - Default: `undefined`
        - Type: `Record<keyof CheckboxProperties, any>[]`, where CheckboxProperties can include properties of the [Checkbox API](https://www.primefaces.org/primeng-v15-lts/checkbox#api.properties).
            - NOTE: The `label` and `value` properties can be aliased by providing them as `input`s to the widget. For example, if the `label` property is aliased as `name`, the `data` property should include an array of objects with a `name` property. Example is available in the starter code.
        - Widget updates when the property is changed?: No
    - Type of `selected`: `string[]`, where each string is the value (unique identifier, default is `value` unless aliased) of the selected item.

#### RadioButton

- Extends: [`RadioButton`](https://www.primefaces.org/primeng-v15-lts/radiobutton)
- Selector: `<web-provenance-radiobutton>`
- Custom Properties/behaviors: Same as `Checkbox`, except that the `selected` property is of type `string`.
