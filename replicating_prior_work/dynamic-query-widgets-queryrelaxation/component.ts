// global
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation, TemplateRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as $ from "jquery";
import vegaEmbed, { Config } from "vega-embed";
import { Tooltip, TooltipOptions } from "primeng/tooltip";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import embed from 'vega-embed';
import vegaLiteSpecCountries from './vegalite-spec-countries.json';
import countriesData from './countries.json';
import { View } from "vega";

@Component({
  selector: "dynamic-query-widgets-query-relaxation",
  templateUrl: "./component.html",
  providers: [],
  styleUrls: ["./component.scss"]
})
export class DynamicQueryWidgetsQueryRelaxationComponent implements OnInit, AfterViewInit {

  vegaLiteSpecCountries: any;
  appFilters: any = {
    year: {
      model: 1970,
      qFilterSliderConfig: {
        floor: 1955,
        ceil: 2000,
        showTicks: true,
        step: 5
      }
    },
    fertility: {
      model: [2, 8],
      qFilterSliderConfig: {
        floor: 2,
        ceil: 8,
        showTicks: true,
        step: 0.1,
        ticksArray: [2, 8]
      }
    },
    life_expect: {
      model: [40, 80],
      qFilterSliderConfig: {
        floor: 40,
        ceil: 80,
        showTicks: true,
        step: 0.1,
        ticksArray: [40, 80]
      }
    },
    countries: {
      model: Array.from(new Set(countriesData.map((d) => d.country))).map((country: any) => { return { "value": country, "label": country } }),
      options: Array.from(new Set(countriesData.map((d) => d.country))).map((country: any) => { return { "value": country, "label": country } }),
    }
  };


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
  ) {
    this.vegaLiteSpecCountries = vegaLiteSpecCountries;
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.updateVis();
  }

  updateVis(){
    let container = "#visualization-canvas";
    let filteredCountriesData = [...countriesData].filter((d) => {
      return d.year == this.appFilters.year.model;
    }).filter((d) => {
      return d.fertility >= this.appFilters.fertility.model[0] && d.fertility <= this.appFilters.fertility.model[1];
    }).filter((d) => {
      return d.life_expect >= this.appFilters.life_expect.model[0] && d.life_expect <= this.appFilters.life_expect.model[1];
    }).filter((d) => {
      return this.appFilters.countries.model.some(country => country.value == d.country);
    });
    this.vegaLiteSpecCountries["data"] = { values: filteredCountriesData }
    this.vegaLiteSpecCountries["width"] = $(container).parent().width() - 100;
    // this.vegaLiteSpecCountries["height"] = this.vegaLiteSpecCountries["width"] * 0.6;
    this.vegaLiteSpecCountries["height"] = this.vegaLiteSpecCountries["width"];

    embed(container, this.vegaLiteSpecCountries as any, { renderer: "svg", actions: false })
    .then(res => {
    });
  }
}