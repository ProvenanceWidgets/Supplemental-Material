// global
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation, TemplateRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as $ from "jquery";
import vegaEmbed, { Config } from "vega-embed";
import { Tooltip, TooltipOptions } from "primeng/tooltip";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "scented-widgets",
  templateUrl: "./component.html",
  providers: [],
  styleUrls: ["./component.scss"]
})
export class ScentedWidgetsComponent implements OnInit, AfterViewInit {

  widgetModel: object;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: BsModalService,
  ) {

  }

  widgetUpdated(model, widget) {
    console.log(widget, this.widgetModel[widget]['model']['provenance']);
  }

  ngAfterViewInit(): void { }

  ngOnInit(): void {
    this.widgetModel = {
      singleSlider: {
        isFrozen: true,
        model: {
          value: 25,
          provenance: {
            revalidate: true,
            "data": [
              {
                "value": [
                  25
                ],
                "timestamp": new Date("2024-03-05T03:44:05.234Z")
              },
              {
                "value": [
                  20
                ],
                "timestamp": new Date("2024-03-05T03:44:08.566Z")
              },
              {
                "value": [
                  35
                ],
                "timestamp": new Date("2024-03-05T03:44:09.020Z")
              },
              {
                "value": [
                  45
                ],
                "timestamp": new Date("2024-03-05T03:44:09.784Z")
              },
              {
                "value": [
                  40
                ],
                "timestamp": new Date("2024-03-05T03:44:10.994Z")
              },
              {
                "value": [
                  50
                ],
                "timestamp": new Date("2024-03-05T03:44:11.478Z")
              },
              {
                "value": [
                  45
                ],
                "timestamp": new Date("2024-03-05T03:44:12.547Z")
              },
              {
                "value": [
                  40
                ],
                "timestamp": new Date("2024-03-05T03:44:13.240Z")
              },
              {
                "value": [
                  30
                ],
                "timestamp": new Date("2024-03-05T03:44:13.885Z")
              },
              {
                "value": [
                  40
                ],
                "timestamp": new Date("2024-03-05T03:44:14.457Z")
              },
              {
                "value": [
                  10
                ],
                "timestamp": new Date("2024-03-05T03:44:15.818Z")
              },
              {
                "value": [
                  20
                ],
                "timestamp": new Date("2024-03-05T03:44:16.361Z")
              },
              {
                "value": [
                  25
                ],
                "timestamp": new Date("2024-03-05T03:44:16.737Z")
              },
              {
                "value": [
                  35
                ],
                "timestamp": new Date("2024-03-05T03:44:17.315Z")
              },
              {
                "value": [
                  30
                ],
                "timestamp": new Date("2024-03-05T03:44:18.032Z")
              },
              {
                "value": [
                  30
                ],
                "timestamp": new Date("2024-03-05T03:44:18.757Z")
              },
              {
                "value": [
                  30
                ],
                "timestamp": new Date("2024-03-05T03:44:19.027Z")
              },
              {
                "value": [
                  35
                ],
                "timestamp": new Date("2024-03-05T03:44:19.433Z")
              },
              {
                "value": [
                  25
                ],
                "timestamp": new Date("2024-03-05T03:44:20.095Z")
              },
              {
                "value": [
                  20
                ],
                "timestamp": new Date("2024-03-05T03:44:20.828Z")
              },
              {
                "value": [
                  65
                ],
                "timestamp": new Date("2024-03-05T03:44:21.345Z")
              }
            ]
          }
        },
        config: { floor: 0, ceil: 100, showTicks: true, tickStep: 5 },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      rangeSlider: {
        config: { floor: 0, ceil: 250, showTicks: true, tickStep: 15 },
        isFrozen: true,
        model: {
          value: 75,
          highValue: 180,
          provenance: {
            revalidate: true,
            "data": [
              {
                "value": [
                  105,
                  180
                ],
                "timestamp": new Date("2024-03-05T04:12:58.558Z")
              },
              {
                "value": [
                  135,
                  180
                ],
                "timestamp": new Date("2024-03-05T04:12:59.770Z")
              },
              {
                "value": [
                  135,
                  210
                ],
                "timestamp": new Date("2024-03-05T04:13:00.557Z")
              }
            ]
          },
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      singleSelectDropdown: {
        isFrozen: true,
        model: {
          options: [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
            { name: 'London', code: 'LDN' }
          ],
          value: { name: 'London', code: 'LDN' },
          provenance: {
            revalidate: true,
            "selections": [
              {
                "value": [
                  "NY"
                ],
                "timestamp": new Date("2024-03-05T04:24:54.726Z")
              },
              {
                "value": [
                  "RM"
                ],
                "timestamp": new Date("2024-03-05T04:25:47.060Z")
              },
              {
                "value": [
                  "NY"
                ],
                "timestamp": new Date("2024-03-05T04:25:49.200Z")
              },
              {
                "value": [
                  "RM"
                ],
                "timestamp": new Date("2024-03-05T04:25:53.250Z")
              },
              {
                "value": [
                  "RM"
                ],
                "timestamp": new Date("2024-03-05T04:25:53.772Z")
              }
            ]
          }
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      multiSelectDropdown: {
        isFrozen: true,
        model: {
          options: [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
            { name: 'London', code: 'LDN' }
          ],
          value: [{ name: 'London', code: 'LDN' }],
          provenance: {
            revalidate: true,
            "selections": [
              {
                "value": [
                  "RM"
                ],
                "timestamp": new Date("2024-03-05T05:08:43.777Z")
              },
              {
                "value": [
                  "NY"
                ],
                "timestamp": new Date("2024-03-05T05:08:46.654Z")
              }
            ]
          },
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      checkboxGroup: {
        isFrozen: true,
        model: {
          options: [
            { label: 'New York', value: 'NY' },
            { label: 'Rome', value: 'RM' },
            { label: 'London', value: 'LDN' }
          ],
          value: ['NY'],
          provenance: {
            revalidate: true,
            "selections": [
              {
                "value": [
                  "NY",
                  "RM"
                ],
                "timestamp": new Date("2024-03-05T05:08:43.777Z")
              },
              {
                "value": [
                  "NY"
                ],
                "timestamp": new Date("2024-03-05T05:08:46.654Z")
              },
              {
                "value": [
                  "NY"
                ],
                "timestamp": new Date("2024-03-05T05:08:47.246Z")
              },
              {
                "value": [
                  "NY",
                  "RM"
                ],
                "timestamp": new Date("2024-03-05T05:08:47.795Z")
              }
            ]
          },
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      radioButtonGroup: {
        isFrozen: true,
        model: {
          options: [
            { label: 'New York', value: 'NY' },
            { label: 'Rome', value: 'RM' },
            { label: 'London', value: 'LDN' }
          ],
          value: 'NY',
          provenance: {
            revalidate: true,
            "selections": [
              {
                "value": [
                  "NY"
                ],
                "timestamp": new Date("2024-03-05T04:24:54.726Z")
              },
              {
                "value": [
                  "RM"
                ],
                "timestamp": new Date("2024-03-05T04:25:47.060Z")
              },
              {
                "value": [
                  "NY"
                ],
                "timestamp": new Date("2024-03-05T04:25:57.763Z")
              }
            ]
          }
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      },
      inputText: {
        isFrozen: true,
        model: {
          value: "New York",
          provenance: {
            revalidate: true,
            "data": [
              {
                "value": "London",
                "timestamp": new Date("2024-03-05T03:58:03.965Z")
              },
              {
                "value": "New York",
                "timestamp": new Date("2024-03-05T03:58:07.602Z")
              },
              {
                "value": "London",
                "timestamp": new Date("2024-03-05T03:58:09.639Z")
              },
              {
                "value": "New York",
                "timestamp": new Date("2024-03-05T03:58:11.539Z")
              }
            ]
          }
        },
        mode: {
          options: [{ label: "Interaction", value: "interaction" }, { label: "Time", value: "time" }],
          value: "interaction"
        }
      }
    }
  }
}