import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SliderProvenance } from 'provenance-widgets';
import pokemonData from '../assets/pokemon.json';
import embed from 'vega-embed';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'provenance-demo';

  // Pokedex Number	Name	Classification	Primary Type	Secondary Type	Generation	Is Legendary	Height_m	Weight_kg	HP	Speed	Attack	Special Attack	Defense	Special Defense	Happiness

  categoricalColumns: Array<object> = ["Pokedex Number", "Name", "Classification", "Primary Type", "Secondary Type", "Generation", "Is Legendary"].map(function (col) { return { value: col, label: col } });
  // Note: "HP" is removed, because it is used in a filter already.
  numericalColumns: Array<object> = ["Height_m", "Weight_kg", "Speed", "Attack", "Special Attack", "Defense", "Special Defense", "Happiness"].map(function (col) { return { value: col, label: col } });

  xEncoding: any = { label: "Attack", value: "Attack" };
  yEncoding: any = { label: "Defense", value: "Defense" };
  colorEncoding: any = { label: "Defense", value: "Secondary Type" };

  pokemonColumns: Array<object>;
  pokemonDataObject: any = {};
  filteredPokemonData: Array<object>;
  vegaLiteSpec: any;
  pointSize: number = 150;
  pointOpacity: number = 0.8;

  baseFontSize: number = 12;
  chartFontSizeMultiplier: number = 1;
  brushSelection: any = [[], []];

  filterConfigs: any = {
    "Height_m": {
      model: [0.1, 14.5],
      provenance: {},
      qFilterSliderConfig: {
        floor: 0,
        ceil: 15,
        showTicks: true,
        step: 5,
        disabled: true,
        ticksArray: [0, 5, 10, 15]
      }
    },
    "Weight_kg": {
      model: [0.1, 999.9],
      provenance: {},
      qFilterSliderConfig: {
        floor: 0.1,
        ceil: 999.9,
        showTicks: true,
        step: 100,
        disabled: true,
        ticksArray: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      }
    },
    "Speed": {
      model: [5, 180],
      provenance: {},
      qFilterSliderConfig: {
        floor: 5,
        ceil: 180,
        showTicks: true,
        step: 5,
        disabled: true,
        ticksArray: [5, 50, 100, 150, 180]
      }
    },
    "Special Attack": {
      model: [10, 194],
      provenance: {},
      qFilterSliderConfig: {
        floor: 10,
        ceil: 194,
        showTicks: true,
        step: 2,
        disabled: true,
        ticksArray: [0, 50, 100, 150, 194]
      }
    },
    "Special Defense": {
      model: [20, 230],
      provenance: {},
      qFilterSliderConfig: {
        floor: 20,
        ceil: 230,
        showTicks: true,
        step: 5,
        disabled: true,
        ticksArray: [20, 50, 100, 150, 200, 230]
      }
    },
    "Happiness": {
      model: [0, 140],
      provenance: {},
      qFilterSliderConfig: {
        floor: 0,
        ceil: 140,
        showTicks: true,
        step: 5,
        disabled: true,
        ticksArray: [0, 50, 100, 140]
      }
    },
    "Attack": {
      model: [5, 185],
      provenance: {},
      qFilterSliderConfig: {
        floor: 5,
        ceil: 185,
        showTicks: true,
        step: 5,
        disabled: true,
        ticksArray: [5, 50, 100, 150, 185]
      }
    },
    "Defense": {
      model: [5, 230],
      provenance: {},
      qFilterSliderConfig: {
        floor: 5,
        ceil: 230,
        showTicks: true,
        step: 5,
        disabled: true,
        ticksArray: [5, 50, 100, 150, 200, 230]
      }
    },
    "HP": {
      model: [1, 255],
      provenance: {},
      qFilterSliderConfig: {
        floor: 1,
        ceil: 255,
        showTicks: true,
        step: 5,
        ticksArray: [5, 50, 100, 150, 200, 250, 255]
      }
    },
    "Primary Type": {
      model: Array.from(new Set(pokemonData.map((d: any) => d["Primary Type"]))).map((col: any) => { return { "value": col.toString(), "label": col.toString() } }),
      options: Array.from(new Set(pokemonData.map((d: any) => d["Primary Type"]))).map((col: any) => { return { "value": col.toString(), "label": col.toString() } }),
      provenance: {}
    },
    "Secondary Type": {
      model: Array.from(new Set(pokemonData.map((d: any) => d["Secondary Type"]))).map((col: any) => { return { "value": col.toString(), "label": col.toString() } }),
      options: Array.from(new Set(pokemonData.map((d: any) => d["Secondary Type"]))).map((col: any) => { return { "value": col.toString(), "label": col.toString() } }),
      provenance: {}
    },
    "Is Legendary": {
      model: "0",
      options: Array.from(new Set(pokemonData.map((d: any) => d["Is Legendary"]))).map((col: any) => { return { "value": col.toString(), "label": col.toString() } }),
      provenance: {}
    },
    "Generation": {
      model: Array.from(new Set(pokemonData.map((d: any) => d["Generation"]))).map((col: any) => { return col.toString()  }),
      options: Array.from(new Set(pokemonData.map((d: any) => d["Generation"]))).map((col: any) => { return { "value": col.toString(), "label": col.toString() } }),
      provenance: {}
    },
    "Name": {
      model: undefined,
      options: Array.from(new Set(pokemonData.map((d: any) => d["Is Legendary"]))).map((col: any) => { return { "value": col.toString(), "label": col.toString() } }),
      provenance: {}
    }
  };

  constructor() {
    let context = this;

    this.pokemonDataObject = {};
    pokemonData.forEach(function (d: any) {
      d["interactionCounter"] = 0;
      d["matchesFilter"] = true;
      context.pokemonDataObject[d["Pokedex Number"]] = d;
    });
    this.filteredPokemonData = Array.from(Object.values(context.pokemonDataObject));
    this.pokemonColumns = Object.keys(pokemonData[0]).map(function (column) { return { prop: column } });

    this.vegaLiteSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "description": "",
      "data": { "values": [] },
      "width": "container",
      "height": "container",
      "params": [{
        "name": "brush",
        "select": "interval",
        "value": { "x": [], "y": [] }
        // "value": {"x": this.brushSelection[0], "y": this.brushSelection[1]}
      }],
      "mark": { "type": "point", "size": 200, "tooltip": {"content": "data"}, filled: true },
      "encoding": {
        "x": { "field": null, "type": null },
        "y": { "field": null, "type": null },
        "color": { "field": null, "type": null },
        "size": { "field": null, "type": null }
      }
    };
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.updateVis();
  }

  updateVis() {
    let context = this;
    let container = "#visualization-canvas";

    context.filteredPokemonData = Object.values(context.pokemonDataObject).filter((d: any) => {
      return d["HP"] <= context.filterConfigs["HP"]["model"][1] && d["HP"] >= context.filterConfigs["HP"]["model"][0];
      })
      .filter((d: any) => {
        return this.filterConfigs["Primary Type"].model.some((entity: any) => entity.value == d["Primary Type"]);
      })
      .filter((d: any) => {
        return this.filterConfigs["Generation"].model.some((entity: any) => entity == d["Generation"]);
      })
      .filter((d: any) => {
        return this.filterConfigs["Is Legendary"].model.toString() == d["Is Legendary"].toString()
      })
      .filter((d: any) => {
        if (this.filterConfigs["Name"].model == undefined || this.filterConfigs["Name"] == ""){
          return true;
        }
        return d["Name"].toLowerCase().includes(this.filterConfigs["Name"].model.toLowerCase());
      }) as any;

    // Font Size:
    const fontSize = this.baseFontSize * this.chartFontSizeMultiplier;

    // X
    this.vegaLiteSpec["encoding"]["x"]["field"] = this.xEncoding["value"];
    this.vegaLiteSpec["encoding"]["x"]["type"] = "quantitative";
    this.vegaLiteSpec["encoding"]["x"]["axis"] = { "titleFontSize": fontSize * 1.5, "labelFontSize": fontSize * 1.25 }

    // Y
    this.vegaLiteSpec["encoding"]["y"]["field"] = this.yEncoding["value"];
    this.vegaLiteSpec["encoding"]["y"]["type"] = "quantitative";
    this.vegaLiteSpec["encoding"]["y"]["axis"] = { "titleFontSize": fontSize * 1.5, "labelFontSize": fontSize * 1.25 }

    // Color
    this.vegaLiteSpec["encoding"]["color"]["field"] = this.colorEncoding["value"];
    this.vegaLiteSpec["encoding"]["color"]["type"] = "nominal";
    this.vegaLiteSpec["encoding"]["color"]["legend"] = { "titleFontSize": fontSize * 1.5, "labelFontSize": fontSize * 1.25 }

    // Size and Opacity of Mark
    this.vegaLiteSpec["mark"]["size"] = this.pointSize;
    this.vegaLiteSpec["mark"]["opacity"] = this.pointOpacity;

    // Data
    this.vegaLiteSpec["data"]["values"] = this.filteredPokemonData;

    embed(container, this.vegaLiteSpec as any, { renderer: "svg", actions: true })
      .then(result => {

        result.view.addDataListener('brush_store', function (event, items) {
          if (items.length > 0 && "values" in items[0]) {
            context.brushSelection = items[0]["values"];
          } else {
            context.brushSelection = [[], []];
          }
        });

        result.view.addEventListener('click', function (event, items) {

          if (context.brushSelection.length != 2 || context.brushSelection[0].length != 2 || context.brushSelection[1].length != 2) {
            return;
          };

          setTimeout(function () {
            let xFlag = false;
            let yFlag = false;

            let x = context.xEncoding["value"];
            let y = context.yEncoding["value"];

            let xRange = context.brushSelection[0];
            let yRange = context.brushSelection[1].reverse();

            // xEncoding
            let provenanceModelX = {...context.filterConfigs[context.xEncoding["value"]]['provenance']};
            if(!("data" in provenanceModelX)){
              provenanceModelX["data"] = [];
            }
            provenanceModelX["data"].push({value: xRange, timestamp: new Date()})
            context.filterConfigs[context.xEncoding["value"]]['provenance'] = provenanceModelX ? { 
              data: provenanceModelX["data"],
              revalidate: true
            } : provenanceModelX;

            // xEncoding
            let provenanceModelY = {...context.filterConfigs[context.yEncoding["value"]]['provenance']};
            if(!("data" in provenanceModelY)){
              provenanceModelY["data"] = [];
            }
            provenanceModelY["data"].push({value: yRange, timestamp: new Date()})
            context.filterConfigs[context.yEncoding["value"]]['provenance'] = provenanceModelY ? { 
              data: provenanceModelY["data"],
              revalidate: true
            } : provenanceModelY;

            context.filteredPokemonData.forEach(function (d: any) {
              if (d[x] <= xRange[1] && d[x] >= xRange[0]) {
                xFlag = true;
              }

              if (d[y] <= yRange[1] && d[y] >= yRange[0]) {
                yFlag = true;
              }

              if (xFlag && yFlag) {
                d["interactionCounter"] += 1;
                d["matchesFilter"] = true;
              } else {
                d["matchesFilter"] = false;
              }
            });

            context.filteredPokemonData = [...Array.from(Object.values(context.pokemonDataObject).filter(function (d: any) { return d["matchesFilter"] }))] as any;
          });

        });

      });
  }
}
