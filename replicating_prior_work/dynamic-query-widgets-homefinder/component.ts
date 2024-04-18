// global
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation, TemplateRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as $ from "jquery";
import vegaEmbed, { Config } from "vega-embed";
import { Tooltip, TooltipOptions } from "primeng/tooltip";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import embed from 'vega-embed';
import vegaLiteSpec from './vegalite-spec-housing.json';
import housingData from './housing.json';
import { View } from "vega";

@Component({
  selector: "dynamic-query-widgets-homefinder",
  templateUrl: "./component.html",
  providers: [],
  styleUrls: ["./component.scss"]
})
export class DynamicQueryWidgetsHomeFinderComponent implements OnInit, AfterViewInit {

  vegaLiteSpec: any;
  appFilters: any = {
    "Rooms": {
      model: 10,
      qFilterSliderConfig: {
        floor: 2,
        ceil: 14,
        showTicks: true,
        step: 1
      }
    },
    "Year": {
      model: 2007,
      qFilterSliderConfig: {
        floor: 2006,
        ceil: 2010,
        showTicks: true,
        step: 1
      }
    },
    "Price": {
      model: [34900, 755000],
      qFilterSliderConfig: {
        floor: 34900,
        ceil: 755000,
        showTicks: true,
        step: 100000
      }
    },
    "Heating Type": {
      model: Array.from(new Set(housingData.map((d) => d["Heating Type"]))).map((val: any) => { return { "value": val, "label": val } }),
      options: Array.from(new Set(housingData.map((d) => d["Heating Type"]))).map((val: any) => { return { "value": val, "label": val } }),
    },
    "Home Type": {
      model: Array.from(new Set(housingData.map((d) => d["Home Type"]))).map((val: any) => { return { "value": val, "label": val } }),
      options: Array.from(new Set(housingData.map((d) => d["Home Type"]))).map((val: any) => { return { "value": val, "label": val } }),
    },
    "Lot Config": {
      model: "Corner",
      options: Array.from(new Set(housingData.map((d) => d["Lot Config"]))).map((val: any) => { return { "value": val, "label": val } }),
    }
  };


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
  ) {
    this.vegaLiteSpec = vegaLiteSpec;
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.updateVis();
  }

  updateVis(){
    let container = "#visualization-canvas";
    let filteredData = [...housingData]
    .filter((d) => {
      return d["Rooms"] == this.appFilters["Rooms"].model;
    })
    .filter((d) => {
      return d["Price"] >= this.appFilters["Price"].model[0] && d["Price"] <= this.appFilters["Price"].model[1];
    })
    .filter((d) => {
      return this.appFilters["Heating Type"].model.some(model => model.value == d["Heating Type"]);
    })
    .filter((d) => {
      return this.appFilters["Lot Config"].model == d["Lot Config"];
    });
    this.vegaLiteSpec["data"] = { values: filteredData }
    this.vegaLiteSpec["width"] = $(container).parent().width() - 100;
    // this.vegaLiteSpec["height"] = this.vegaLiteSpec["width"] * 0.6;
    this.vegaLiteSpec["height"] = this.vegaLiteSpec["width"];

    embed(container, this.vegaLiteSpec as any, { renderer: "svg", actions: false })
    .then(res => {
    });
  }
}