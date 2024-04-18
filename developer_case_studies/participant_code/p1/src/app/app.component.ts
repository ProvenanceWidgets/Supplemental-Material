import { ApplicationRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import * as Papa from 'papaparse';
import * as d3 from 'd3';
import { SliderProvenance } from 'provenance-widgets';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  @ViewChild('svg') svgEl: any;

  title = 'provenance-demo';

  // data
  attrs: any = {};
  data: any = [];

  // get dict
  jsonReader = new Observable<string>((observer) => {
    fetch('assets/pokemon-dict.json')
      .then((response) => response.json())
      .then((json) => observer.next(json));
  });

  // get rows
  csvReader = new Observable<string>((observer) => {
    Papa.parse('assets/pokemon.csv', {
      header: true,
      download: true,
      dynamicTyping: true,
      complete: function (results: any) {
        observer.next(results);
      },
    });
  });

  // x-axis dropdown
  xAxisDropdownOptions: any = [];
  xAxisDropdownSelected: any = undefined;

  // x-axis filter
  xAxisFilterValue: number = 0;
  xAxisFilterHighValue: number = 250;
  xAxisFilterOptions = {
    floor: 0,
    ceil: 250,
    showTicks: true,
    tickStep: 25,
  };
  xAxisFilterRangeSliderProvenance?: SliderProvenance = undefined;
  handleXAxisFilterRangeSliderProvenanceChange(event: SliderProvenance) {
    this.xAxisFilterRangeSliderProvenance = event;
    const latest: any = event.data.at(-1);
    this.xAxisFilterValue = latest.value[0];
    this.xAxisFilterHighValue = latest.value[1];
    this.drawScatterplot();
  }

  // y-axis dropdown
  yAxisDropdownOptions: any = [];
  yAxisDropdownSelected: any = undefined;

  // y-axis filter
  yAxisFilterValue: number = 0;
  yAxisFilterHighValue: number = 250;
  yAxisFilterOptions = {
    floor: 0,
    ceil: 250,
    showTicks: true,
    tickStep: 25,
  };
  yAxisFilterRangeSliderProvenance?: SliderProvenance = undefined;
  handleYAxisFilterRangeSliderProvenanceChange(event: SliderProvenance) {
    this.yAxisFilterRangeSliderProvenance = event;
    const latest: any = event.data.at(-1);
    this.yAxisFilterValue = latest.value[0];
    this.yAxisFilterHighValue = latest.value[1];
    this.drawScatterplot();
  }

  // set label
  labelDropdownOptions: any = [];
  labelDropdownSelected: any = null;

  constructor(private appRef: ApplicationRef) {}

  ngAfterViewInit() {
    // read in data dictionary
    this.jsonReader.subscribe((jsonResult: any) => {
      // read in data array
      this.csvReader.subscribe((csvResult: any) => {
        const attrs: any = jsonResult;
        const data: any = csvResult.data;

        // get attr values
        Object.keys(attrs).forEach((field: any) => {
          if (attrs[field].type == 'num') {
            attrs[field].extent = d3.extent(data, (d: any) => d[field]);
          } else if (attrs[field].type == 'cat') {
            attrs[field].extent = Array.from(new Set(data.map((d: any) => d[field])));
          }
        });

        // get attrs
        const attrsList: any = Object.values(attrs);
        const numAttrs: any = attrsList.filter((d: any) => d.type == 'num'); // numerical attributes only
        const catAttrs: any = attrsList.filter((d: any) => d.type == 'cat'); // numerical attributes only

        // populate x-axis widgets
        const xAttr = numAttrs[Math.floor(Math.random() * numAttrs.length)]; // get a random attr
        this.xAxisDropdownOptions = numAttrs;
        this.xAxisDropdownSelected = xAttr;
        this.updateXAxisFilter(xAttr);

        // populate y-axis widgets
        const yAttr = numAttrs[Math.floor(Math.random() * numAttrs.length)]; // get a random attr
        this.yAxisDropdownOptions = numAttrs;
        this.yAxisDropdownSelected = yAttr;
        this.updateYAxisFilter(yAttr);

        // populate label widget
        this.labelDropdownOptions = catAttrs;

        // save refs
        this.attrs = attrs;
        this.data = data;

        // draw charts
        this.drawScatterplot();
      });
    });
  }

  /**
   * Updates x-axis filter slider.
   *
   * TODO: Needs to update provenance as well!! Cannot figure out how to do this.
   *
   * See: <https://angular-slider.github.io/ngx-slider/demos#dynamic-options-slider>
   */
  updateXAxisFilter(attr: any) {
    this.xAxisFilterValue = attr.extent[0];
    this.xAxisFilterHighValue = attr.extent[1];
    const newXAxisFilterOptions: any = Object.assign({}, this.xAxisFilterOptions);
    newXAxisFilterOptions.floor = attr.extent[0];
    newXAxisFilterOptions.ceil = attr.extent[1];
    newXAxisFilterOptions.tickStep = Math.floor((attr.extent[1] - attr.extent[0]) / 8);
    this.xAxisFilterOptions = newXAxisFilterOptions;
  }

  /**
   * Updates y-axis filter slider.
   *
   * TODO: Needs to update provenance as well!! Cannot figure out how to do this.
   *
   * See: <https://angular-slider.github.io/ngx-slider/demos#dynamic-options-slider>
   */
  updateYAxisFilter(attr: any) {
    this.yAxisFilterValue = attr.extent[0];
    this.yAxisFilterHighValue = attr.extent[1];
    const newYAxisFilterOptions: any = Object.assign({}, this.yAxisFilterOptions);
    newYAxisFilterOptions.floor = attr.extent[0];
    newYAxisFilterOptions.ceil = attr.extent[1];
    newYAxisFilterOptions.tickStep = Math.floor((attr.extent[1] - attr.extent[0]) / 8);
    this.yAxisFilterOptions = newYAxisFilterOptions;
  }

  /**
   * Called when a dropdown widget changes a value.
   */
  onAttrSelected(attr: any, widget: string) {
    if (widget == 'xaxis') this.updateXAxisFilter(attr);
    if (widget == 'yaxis') this.updateYAxisFilter(attr);
    this.drawScatterplot();
  }

  /**
   * Draws a scatterplot.
   *
   * See: <https://observablehq.com/@d3/scatterplot/2>
   */
  drawScatterplot() {
    const svg = d3.select(this.svgEl.nativeElement);
    const width = this.svgEl.nativeElement.getBoundingClientRect().width;
    const height = this.svgEl.nativeElement.getBoundingClientRect().height;

    svg.selectAll('*').remove();

    // get data
    const xAttr = this.xAxisDropdownSelected.field;
    const xAttrMin = this.xAxisFilterValue;
    const xAttrMax = this.xAxisFilterHighValue;

    const yAttr = this.yAxisDropdownSelected.field;
    const yAttrMin = this.yAxisFilterValue;
    const yAttrMax = this.yAxisFilterHighValue;

    const label = this.labelDropdownSelected !== null ? this.labelDropdownSelected.field : null;

    const data = this.data.filter((d: any) => {
      return (
        d[xAttr] !== null &&
        d[yAttr] !== null &&
        d[xAttr] >= xAttrMin &&
        d[xAttr] <= xAttrMax &&
        d[yAttr] >= yAttrMin &&
        d[yAttr] <= yAttrMax
      );
    });

    // Specify the chart’s dimensions.
    const marginTop = 24;
    const marginRight = 24;
    const marginBottom = 40;
    const marginLeft = 40;

    // Prepare the scales for positional encoding.
    const xDomain: any = d3.extent(data, (d: any) => d[xAttr]);
    const x = d3
      .scaleLinear()
      .domain(xDomain)
      .nice()
      .range([marginLeft, width - marginRight]);

    const yDomain: any = d3.extent(data, (d: any) => d[yAttr]);
    const y = d3
      .scaleLinear()
      .domain(yDomain)
      .nice()
      .range([height - marginBottom, marginTop]);

    // prepare color scale
    const groups = Array.from(new Set(data.map((d: any) => (label !== null ? d[label] : null))));
    const color = (group: any) =>
      label !== null ? d3.interpolateRainbow(groups.indexOf(group) / groups.length) : 'steelblue';

    // Create the axes.
    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80))
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .append('text')
          .attr('x', width)
          .attr('y', marginBottom - 4)
          .attr('fill', 'currentColor')
          .attr('text-anchor', 'end')
          .text(`${xAttr} →`)
      );

    svg
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .append('text')
          .attr('x', -marginLeft)
          .attr('y', 10)
          .attr('fill', 'currentColor')
          .attr('text-anchor', 'start')
          .text(`↑ ${yAttr}`)
      );

    // Create the grid.
    svg
      .append('g')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.1)
      .call((g) =>
        g
          .append('g')
          .selectAll('line')
          .data(x.ticks())
          .join('line')
          .attr('x1', (d: any) => 0.5 + x(d))
          .attr('x2', (d: any) => 0.5 + x(d))
          .attr('y1', marginTop)
          .attr('y2', height - marginBottom)
      )
      .call((g) =>
        g
          .append('g')
          .selectAll('line')
          .data(y.ticks())
          .join('line')
          .attr('y1', (d: any) => 0.5 + y(d))
          .attr('y2', (d: any) => 0.5 + y(d))
          .attr('x1', marginLeft)
          .attr('x2', width - marginRight)
      );

    // Add a layer of dots.
    svg
      .append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('stroke', (d: any) => color(d[label]))
      .attr('stroke-width', 1)
      .attr('fill', (d: any) => color(d[label]))
      .attr('fill-opacity', 0.15)
      .attr('cx', (d: any) => x(d[xAttr]))
      .attr('cy', (d: any) => y(d[yAttr]))
      .attr('r', 6)
      .on('mouseenter', mouseenter)
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave);

    // Add a layer of labels.
    // svg
    //   .append('g')
    //   .attr('font-family', 'sans-serif')
    //   .attr('font-size', 10)
    //   .selectAll('text')
    //   .data(data)
    //   .join('text')
    //   .attr('dy', '0.35em')
    //   .attr('x', (d: any) => x(d[xAttr]) + 7)
    //   .attr('y', (d: any) => y(d[yAttr]))
    //   .text((d: any) => d.Name);

    /**
     * When the mouse enters an svg object.
     */
    function mouseenter(event: any, d: any) {
      if (d !== null) {
        d3.select('.tooltip').style('display', 'block').style('opacity', 1).html(getTooltipHTML(d));
      }
    }

    /**
     * When the mouse moves over an svg object.
     */
    function mousemove(event: any, d: any) {
      if (d !== null) {
        positionTooltip(event.x, event.y);
      }
    }

    /**
     * When the mouse leaves an svg object.
     */
    function mouseleave(event: any, d: any) {
      if (d !== null) {
        d3.select('.tooltip').style('display', 'none').style('opacity', 0).html('');
      }
    }

    const topPad = 8; // draw tooltip px up from top edge of cursor
    const leftPad = -8; // draw tooltip px left from left edge of cursor

    /**
     * Positions tooltip near mouse without letting it leave the viewport
     */
    function positionTooltip(eventX: any, eventY: any) {
      const tooltip: any = d3.select('.tooltip');
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const width = tooltip.node().getBoundingClientRect().width + 2;
      const height = tooltip.node().getBoundingClientRect().height + 2;
      let left = window.scrollX + eventX - leftPad;
      if (left >= vw - width) left = eventX - width + leftPad; // too far right
      let top = window.scrollY + eventY - height - topPad;
      if (top <= 0) top = 0; // too far up
      // if (top <= 0) top = eventY + topPad; // too far up
      tooltip.style('left', `${left}px`).style('top', `${top}px`);
    }

    /**
     * Creates HTML to inject into tooltip.
     */
    function getTooltipHTML(item: any) {
      const values = Object.keys(item).map((field) => `<li>${field}: ${item[field]}</li>`);
      const n = String(item['Pokedex Number']).padStart(3, '0'); // url expects left padded with zeros
      return `
        <span class="title">${item.Name}</span>
        <img src="https://serebii.net/pokemon/art/${n}.png" width="100%">
        <ul class="list">
          ${values.join('')}
        </ul>
      `;
    }
  }
}
