import type { NgElement, WithProperties } from '@angular/elements'
import { CheckboxComponent, DropdownComponent, InputtextComponent, MultiselectComponent, RadiobuttonComponent, SliderComponent } from 'provenance-widgets'
import './style.css'

/**
 * Sliders
 */



// Single slider
const sliderOpts = { floor: 0, ceil: 250, showTicks: true, tickStep: 25 }

const slider = document.createElement("web-provenance-slider") as NgElement & WithProperties<SliderComponent>

slider.id = 'wp-slider'
slider.value = 25
slider.options = sliderOpts
slider.provenance = undefined

// Listening to events
slider.addEventListener('provenanceChange', console.log)
slider.addEventListener('selectedChange', console.log)

document.querySelector("label[for='wp-slider']")?.insertAdjacentElement("afterend", slider)



// Range slider
const rangeSlider = document.createElement("web-provenance-slider") as NgElement & WithProperties<SliderComponent>

rangeSlider.id = 'wp-range-slider'
rangeSlider.value = 25
rangeSlider.highValue = 75
rangeSlider.options = sliderOpts

document.querySelector("label[for='wp-range-slider']")?.insertAdjacentElement("afterend", rangeSlider)

/**
 * Text Input
 */

const inputtext = document.createElement("web-provenance-inputtext") as NgElement & WithProperties<InputtextComponent>

document.querySelector("label[for='wp-inputtext']")?.insertAdjacentElement("afterend", inputtext)

/**
 * Selection-type widgets
 */

const cities = [
  {
    name: 'New York',
    code: 'New York',
    inputId: 'NY'
  },
  {
    name: 'Rome',
    code: 'Rome',
    inputId: 'RM'
  },
  {
    name: 'London',
    code: 'London',
    inputId: 'LDN'
  },
  {
    name: 'Istanbul',
    code: 'Istanbul',
    inputId: 'IST'
  },
  {
    name: 'Paris',
    code: 'Paris',
    inputId: 'PRS'
  }
];



// Multiselect
const multiselect = document.createElement("web-provenance-multiselect") as NgElement & WithProperties<MultiselectComponent>

multiselect.id = 'wp-multiselect'
multiselect.options = cities
multiselect.optionLabel = 'name'
multiselect.dataKey = 'code'
multiselect.selected = cities.slice(0, 2);
multiselect.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  multiselect.selected = event.detail
})



// Dropdown
document.querySelector("label[for='wp-multiselect']")?.insertAdjacentElement("afterend", multiselect)

const dropdown = document.createElement("web-provenance-dropdown") as NgElement & WithProperties<DropdownComponent>

dropdown.id = 'wp-dropdown'
dropdown.options = cities
dropdown.optionLabel = 'name'
dropdown.dataKey = 'code'
dropdown.selected = undefined
dropdown.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  dropdown.selected = event.detail
})

document.querySelector("label[for='wp-dropdown']")?.insertAdjacentElement("afterend", dropdown)



// Checkbox
const checkbox = document.createElement("web-provenance-checkbox") as NgElement & WithProperties<CheckboxComponent>

checkbox.id = 'wp-checkbox'
checkbox.data = cities
checkbox.name="undefined"
checkbox.label = 'name'
checkbox.value = 'code'
checkbox.selected = cities.slice(0, 2).map(c => c.code);
checkbox.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  checkbox.selected = event.detail
})

document.querySelector("label[for='wp-checkbox']")?.insertAdjacentElement("afterend", checkbox)



// Radiobutton
const radiobutton = document.createElement("web-provenance-radiobutton") as NgElement & WithProperties<RadiobuttonComponent>

radiobutton.id = 'wp-radiobutton'
radiobutton.data = cities
checkbox.name="r-interaction"
radiobutton.label = 'name'
radiobutton.value = 'code'
radiobutton.selected = cities[0].code;
radiobutton.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  radiobutton.selected = event.detail
})

document.querySelector("label[for='wp-radiobutton']")?.insertAdjacentElement("afterend", radiobutton)