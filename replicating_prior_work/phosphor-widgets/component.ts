// global
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation, TemplateRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as $ from "jquery";
import vegaEmbed, { Config } from "vega-embed";
import { Tooltip, TooltipOptions } from "primeng/tooltip";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "phosphor-widgets",
  templateUrl: "./component.html",
  providers: [],
  styleUrls: ["./component.scss"]
})
export class PhosphorWidgetsComponent implements OnInit, AfterViewInit {

  widgetModel: object;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
  ) {

  }

  widgetUpdated(model, widget) {
    let context = this;
    // console.log(model, widget);
    // console.log(this.widgetModel[widget]['model']['provenance']);
    let provenance = {...this.widgetModel[widget]['model']['provenance']};
    console.log(provenance);
    switch (widget) {
      case "singleSlider":
        if("data" in provenance){
          context.widgetModel[widget]['model']['provenance'] = provenance ? { 
            data: provenance["data"].slice(-2),
            revalidate: true
          } : provenance;
        }
        break;
        

      case "rangeSlider":
        if("data" in provenance){
          context.widgetModel[widget]['model']['provenance'] = provenance ? { 
            data: provenance["data"].slice(-2),
            revalidate: true
          } : provenance;
          console.log(context.widgetModel[widget]['model']['provenance']);
        }
        break;

      case "singleSelectDropdown":
        if("selections" in provenance){
          context.widgetModel[widget]['model']['provenance'] = provenance ? {
            ...provenance, 
            selections: provenance["selections"].slice(-2),
            revalidate: true
          } : provenance;
          console.log(context.widgetModel[widget]['model']['provenance']);
        }
        break;

      case "multiSelectDropdown":
        if("selections" in provenance){
          context.widgetModel[widget]['model']['provenance'] = provenance ? {
            ...provenance, 
            selections: provenance["selections"].slice(-2),
            revalidate: true
          } : provenance;  
          console.log(context.widgetModel[widget]['model']['provenance']);
        }
        break;

      case "radioButtonGroup":
        if("selections" in provenance){
          context.widgetModel[widget]['model']['provenance'] = provenance ? {
            ...provenance, 
            selections: provenance["selections"].slice(-2),
            revalidate: true
          } : provenance;
          console.log(context.widgetModel[widget]['model']['provenance']);
        }
        break;

      case "checkboxGroup":
        if("selections" in provenance){
          context.widgetModel[widget]['model']['provenance'] = provenance ? {
            ...provenance, 
            selections: provenance["selections"].slice(-2),
            revalidate: true
          } : provenance;
          console.log(context.widgetModel[widget]['model']['provenance']);
        }
        break;

      case "inputText":
        if("data" in provenance){
          context.widgetModel[widget]['model']['provenance'] = provenance ? { 
            data: provenance["data"].slice(-2),
            revalidate: true
          } : provenance
          console.log(context.widgetModel[widget]['model']['provenance']);
        }
        break;
    }
  }

  ngAfterViewInit(): void { }
  
  ngOnInit(): void {
    this.widgetModel = {
      singleSlider: {
        model: {
          value: 25,
          provenance: {}
        },
        config: { floor: 0, ceil: 100, showTicks: true, tickStep: 5 },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      rangeSlider: {
        config: { floor: 0, ceil: 250, showTicks: true, tickStep: 15 },
        model: {
          value: 75,
          highValue: 180,
          provenance: {},
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      singleSelectDropdown: {
        model: {
          options: [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
            { name: 'London', code: 'LDN' }
          ],
          value: { },
          provenance: {},
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      multiSelectDropdown: {
        model: {
          options: [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
            { name: 'London', code: 'LDN' }
          ],
          value: [],
          provenance: {},
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      checkboxGroup: {
        model: {
          options: [
            { label: 'New York', value: 'NY' },
            { label: 'Rome', value: 'RM' },
            { label: 'London', value: 'LDN' }
          ],
          value: [],
          provenance: {},
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      radioButtonGroup: {
        model: {
          options: [
            { label: 'New York', value: 'NY' },
            { label: 'Rome', value: 'RM' },
            { label: 'London', value: 'LDN' }
          ],
          value: undefined,
          provenance: {}
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      inputText: {
        model: {
          value: null,
          provenance: {}
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      }
    };
  }

}