import type { NgElement, WithProperties } from '@angular/elements'
import { CheckboxComponent, DropdownComponent, InputtextComponent, MultiselectComponent, RadiobuttonComponent, SliderComponent } from 'provenance-widgets'
import './style.css';
import * as d3 from "d3";
import { UMAP } from 'umap-js';
import dataWithEmbedding from "./pokemon.json";

var uniqueTypes = Array.from(new Set(dataWithEmbedding.map(d => d["Primary Type"])));
var optionTypes = uniqueTypes.map(d => {
  let newRow = {};
  newRow.name = d;
  newRow.code = d;
  newRow.inputId = d;

  return newRow
})

var generations = Array.from(new Set(dataWithEmbedding.map(d => d["Generation"])));
var optionGenerations = generations.map(d => {
  let newRow = {};
  newRow.name = d;
  newRow.code = d;
  newRow.inputId = d;

  return newRow
})

var names = Array.from(new Set(dataWithEmbedding.map(d => d["Name"])));
var optionNames = names.map(d => {
  let newRow = {};
  newRow.name = d;
  newRow.code = d;
  newRow.inputId = d;

  return newRow
})

var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 50, r: 150, b: 50, l: 50};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

let filters = {"HP":65};

var colorMap = {"grass":"#7AC74C",
                "fire":"#EE8130",
                "water":"#6390F0",
                "bug":"#A6B91A",
                "normal":"#565656",
                "poison":"#A33EA1",
                "electric":"#F7D02C",
                "ground":"#E2BF65",
                "fairy":"#D685AD",
                "fighting":"#C22E28",
                "psychic":"#F95587",
                "rock":"#B6A136",
                "ghost":"#735797",
                "ice":"#96D9D6",
                "dragon":"#6F35FC",
                "dark":"#705746",
                "steel":"#B7B7CE",
                "flying":"#A98FF3"};

svg.selectAll(".legendRect")
  .data(Object.keys(colorMap))
  .join("rect")
  .attr("class", "legendRect")
  .attr('x', svgWidth - 100)
  .attr('y', (d, i) => padding.t + 15 * i)
  .attr("width", "10")
  .attr("height", "10")
  .attr('fill', d => colorMap[d])

svg.selectAll(".legendText")
  .data(Object.keys(colorMap))
  .join("text")
  .attr("class", "legendText")
  .text(d => d)
  .attr('x', svgWidth - 100 + 20)
  .attr('y', (d, i) => padding.t + 15 * i + 5)
  .attr("font-size", "11px")
  .attr("alignment-baseline", "middle")
  .attr('fill', d => colorMap[d])

// CODE FOR EMBEDDING, ONLY USED ONCE
// d3.csv('./src/pokemon.csv',
//     // Load data and use this function to process each row
//     function(row) {
//         return {
//             'Pokedex Number': +row['Pokedex Number'],
//             'Name': row['Name'],
//             'Classification': row['Classification'],
//             'Primary Type': row['Primary Type'],
//             'Secondary Type': row['Secondary Type'],
//             'Generation': +row['Generation'],
//             'Is Legendary': +row['Is Legendary'],
//             'Height_m': +row['Height_m'],
//             'Weight_kg': +row['Weight_kg'],
//             'HP': +row['HP'],
//             'Speed': +row['Speed'],
//             'Attack': +row['Attack'],
//             'Special Attack': +row['Special Attack'],
//             'Defense': +row['Defense'],
//             'Special Defense': +row['Special Defense'],
//             'Happiness': +row['Happiness']
//         }
//     })
//     .then(function (dataset) {

//       const umap = new UMAP();

//       let types = Array.from(new Set(dataset.map(d => d["Primary Type"])));

//       let dataNumerical = dataset.map(row => {
//         let newRow = {'Generation': +row['Generation'],
//                     'Is Legendary': +row['Is Legendary'],
//                     'Height_m': +row['Height_m'],
//                     'Weight_kg': +row['Weight_kg'],
//                     'HP': +row['HP'],
//                     'Speed': +row['Speed'],
//                     'Attack': +row['Attack'],
//                     'Special Attack': +row['Special Attack'],
//                     'Defense': +row['Defense'],
//                     'Special Defense': +row['Special Defense'],
//                     'Happiness': +row['Happiness']}

//         newRow["Type1"] = types.indexOf(row["Primary Type"]);
//         newRow["Type2"] = types.indexOf(row["Secondary Type"]);

//         return newRow
//       })

//       console.log(dataNumerical[0])
//       const embedding = umap.fit(dataNumerical);

//       const dataWithEmbedding = dataset.map((row, i) => {
//         row.x = embedding[i][0];
//         row.y = embedding[i][1];

//         return row
//       })

//     })

function applyFilters(filters, dataWithEmbedding) {

  let filteredData = JSON.parse(JSON.stringify(dataWithEmbedding));

  for (let filter of Object.keys(filters)) {

    console.log(filters)

    if (filter === "Name") {
      let selectedNames = filters[filter];

      if (selectedNames) {
        filteredData = filteredData.filter(d => selectedNames.indexOf(d.Name) >= 0);
      }
    }

    if (filter === "Primary Type") {
      let selectedTypes = filters[filter];
      filteredData = filteredData.filter(d => selectedTypes.indexOf(d["Primary Type"]) >= 0);
    }

    if (filter === "Secondary Type") {
      let selectedTypes = filters[filter];
      if (selectedTypes != "all") {
        filteredData = filteredData.filter(d => d["Secondary Type"].length > 0 && selectedTypes.indexOf(d["Secondary Type"]) >= 0);
      }
    }

    if (filter === "Generation") {
      let selectedGeneration = filters[filter];

      if (selectedGeneration && selectedGeneration != "all") {
        filteredData = filteredData.filter(d => selectedGeneration === d.Generation);
      }
    }

    if (filter === "HP") {
      let selectedHP = filters[filter];

      filteredData = filteredData.filter(d => selectedHP === d.HP);
    }

    if (filter === "Attack") {
      let selectedAttack = filters[filter];

      filteredData = filteredData.filter(d => d.Attack >= selectedAttack[0] && d.Attack <= selectedAttack[1]);
    }
  }

  return filteredData
}

function render(data) {
  let xScale = d3.scaleLinear()
                .domain(d3.extent(dataWithEmbedding, d => d.x))
                .range([padding.l, svgWidth - padding.r]);

  let yScale = d3.scaleLinear()
                  .domain(d3.extent(dataWithEmbedding, d => d.y))
                  .range([svgHeight - padding.b, padding.t]);

  let pokemonPoints = svg.selectAll(".pokemonPoints")
                          .data(data)
                          .join("circle")
                          .attr("class", "pokemonPoints")
                          .attr("cx", d => xScale(d.x))
                          .attr("cy", d => yScale(d.y))
                          .attr("r", 3)
                          .attr("fill", d => colorMap[d["Primary Type"]])
}

function update(filters, dataWithEmbedding) {

  let filteredData = applyFilters(filters, dataWithEmbedding);
  render(filteredData);

}

update(filters, dataWithEmbedding);

/**
 * Sliders
 */

let HPExtent = d3.extent(dataWithEmbedding, d => d.HP);

// Single slider
const sliderOpts = { floor: HPExtent[0], ceil: HPExtent[1], showTicks: true, tickStep: 25 }

const slider = document.createElement("web-provenance-slider") as NgElement & WithProperties<SliderComponent>

slider.id = 'wp-slider'
slider.value = 65
slider.options = sliderOpts
slider.provenance = undefined

// Listening to events
slider.addEventListener('provenanceChange', console.log)
slider.addEventListener('selectedChange', (event) => {

  filters["HP"] = event.detail.value;
  update(filters, dataWithEmbedding);

})

document.querySelector("label[for='wp-slider']")?.insertAdjacentElement("afterend", slider)

let AttackExtent = d3.extent(dataWithEmbedding, d => d.Attack);

// Range slider
const rangeSlider = document.createElement("web-provenance-slider") as NgElement & WithProperties<SliderComponent>

const rangeSliderOpts = { floor: AttackExtent[0], ceil: AttackExtent[1], showTicks: true, tickStep: 25 }

rangeSlider.id = 'wp-range-slider'
rangeSlider.value = AttackExtent[0]
rangeSlider.highValue = AttackExtent[1]
rangeSlider.options = rangeSliderOpts

rangeSlider.addEventListener('selectedChange', (event) => {

  filters["Attack"] = [event.detail.value, event.detail.highValue];
  update(filters, dataWithEmbedding);

})

document.querySelector("label[for='wp-range-slider']")?.insertAdjacentElement("afterend", rangeSlider)

/**
 * Text Input
 */

const inputtext = document.createElement("web-provenance-inputtext") as NgElement & WithProperties<InputtextComponent>

document.querySelector("label[for='wp-inputtext']")?.insertAdjacentElement("afterend", inputtext)


// Multiselect
const multiselect = document.createElement("web-provenance-multiselect") as NgElement & WithProperties<MultiselectComponent>

multiselect.id = 'wp-multiselect'
multiselect.options = optionNames
multiselect.optionLabel = 'name'
multiselect.dataKey = 'code'
multiselect.selected = optionNames;
multiselect.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  multiselect.selected = event.detail

  let selectedNames = event.detail.map(d => d.name);

  filters["Name"] = selectedNames;
  update(filters, dataWithEmbedding);
})



// Dropdown
document.querySelector("label[for='wp-multiselect']")?.insertAdjacentElement("afterend", multiselect)

const dropdown = document.createElement("web-provenance-dropdown") as NgElement & WithProperties<DropdownComponent>

const genOptions = [{name:"all", code:"all", inputId:"all"}].concat(optionGenerations)

dropdown.id = 'wp-dropdown'
dropdown.options = genOptions
dropdown.optionLabel = 'name'
dropdown.dataKey = 'code'
dropdown.selected = "all"
dropdown.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  dropdown.selected = event.detail

  let selectedGeneration = event.detail.name;

  filters["Generation"] = selectedGeneration;
  update(filters, dataWithEmbedding);
})

document.querySelector("label[for='wp-dropdown']")?.insertAdjacentElement("afterend", dropdown)



// Checkbox
const checkbox = document.createElement("web-provenance-checkbox") as NgElement & WithProperties<CheckboxComponent>

checkbox.id = 'wp-checkbox'
checkbox.data = optionTypes
checkbox.name="undefined"
checkbox.label = 'name'
checkbox.value = 'code'
checkbox.selected = optionTypes.map(d => d.code)
checkbox.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  checkbox.selected = event.detail;

  let selectedTypes = event.detail;

  filters["Primary Type"] = selectedTypes;
  update(filters, dataWithEmbedding);

})

document.querySelector("label[for='wp-checkbox']")?.insertAdjacentElement("afterend", checkbox)



// Radiobutton
const radiobutton = document.createElement("web-provenance-radiobutton") as NgElement & WithProperties<RadiobuttonComponent>

const radioOptions = [{name:"all", code:"all", inputId:"all"}].concat(optionTypes)

radiobutton.id = 'wp-radiobutton'
radiobutton.data = radioOptions
checkbox.name="r-interaction"
radiobutton.label = 'name'
radiobutton.value = 'code'
radiobutton.selected = "all";
radiobutton.addEventListener("selectedChange", (event: any) => {
  // Mandatory to update the selected property
  radiobutton.selected = event.detail

  let selectedTypes = event.detail;

  filters["Secondary Type"] = selectedTypes;
  update(filters, dataWithEmbedding);
})

document.querySelector("label[for='wp-radiobutton']")?.insertAdjacentElement("afterend", radiobutton)