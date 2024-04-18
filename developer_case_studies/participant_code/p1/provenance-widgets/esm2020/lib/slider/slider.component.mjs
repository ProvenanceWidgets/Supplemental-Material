import { Component, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { SliderComponent as NgxSliderComponent } from '@angular-slider/ngx-slider';
import * as d3 from 'd3';
import { DEFAULT_HEIGHT, LINE_CIRCLE_DIAMETER, MODE } from '../constants';
import { convertRemToPixels, getTooltip, interpolateLightOranges, suffixed } from '../utils';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular-slider/ngx-slider";
import * as i3 from "primeng/overlaypanel";
import * as i4 from "primeng/button";
import * as i5 from "../icon/icon.component";
export class SliderComponent extends NgxSliderComponent {
    get provenance() {
        return this._provenance;
    }
    set provenance(value) {
        if (this.provenance && value?.revalidate) {
            this._provenance = value;
            this.revalidateProvenance(value);
            this._visualize();
        }
        this._provenance = value;
    }
    constructor(renderer, elementRef, changeDetectionRef, zone) {
        super(renderer, elementRef, changeDetectionRef, zone, false);
        this.mode = MODE;
        this.id = "";
        this.visualize = true;
        this.freeze = false;
        this.provenanceChange = new EventEmitter();
        this.selectedChange = new EventEmitter();
        this.data = [];
        this.minTime = undefined;
        this.oldMaxTime = undefined;
        this.maxTime = undefined;
        this.maxFrequency = 0;
        this.interval = NaN;
        this.sliderHeight = 0;
        this.buckets = new Map();
        this.el = elementRef;
    }
    initBuckets(date, value = this.value, highValue = this.highValue) {
        this.buckets.set(value, {
            date,
            count: 1,
            highValue: highValue,
            maxIndex: 0
        });
        if (highValue != null) {
            // enables 100% slider coverage
            if (this.options.floor < value) {
                this.buckets.set(this.options.floor, {
                    date,
                    count: 0,
                    highValue: value
                });
            }
            if (this.options.ceil > highValue) {
                this.buckets.set(highValue, {
                    date,
                    count: 0,
                    highValue: this.options.ceil
                });
            }
        }
        this.maxFrequency = 1;
    }
    addBucket(date, value, highValue) {
        if (highValue == null) {
            this.buckets.set(value, {
                date,
                count: (this.buckets.get(value)?.count || 0) + 1,
                maxIndex: this.data.length - 1
            });
            this.maxFrequency = Math.max(this.maxFrequency, this.buckets.get(value).count);
            return;
        }
        const buckets = Array.from(this.buckets.entries()).sort((a, b) => a[0] - b[0]);
        let newBuckets = [];
        let startProcessed = false;
        let endProcessed = false;
        buckets.forEach(([k, v]) => {
            // interval start is in a bucket
            if (!startProcessed && !endProcessed && value < v.highValue) {
                startProcessed = true;
                // 1st sub-interval in the bucket
                if (value > k) {
                    newBuckets.push([k, {
                            ...v,
                            highValue: value
                        }]);
                }
                // 2nd sub-interval in the bucket
                newBuckets.push([value, {
                        date,
                        count: v.count + 1,
                        highValue: Math.min(highValue, v.highValue),
                        maxIndex: this.data.length - 1
                    }]);
                this.maxFrequency = Math.max(this.maxFrequency, v.count + 1);
                // If the interval end is also in the bucket, we need to add a 3rd sub-interval
                if (highValue < v.highValue) {
                    newBuckets.push([highValue, {
                            ...v,
                            highValue: v.highValue
                        }]);
                    endProcessed = true;
                }
                return;
            }
            // interval end is in bucket, but start is not
            if (!endProcessed && highValue <= v.highValue) {
                if (highValue > k) {
                    newBuckets.push([k, {
                            date,
                            count: v.count + 1,
                            highValue: highValue,
                            maxIndex: this.data.length - 1
                        }]);
                    this.maxFrequency = Math.max(this.maxFrequency, v.count + 1);
                }
                // 2nd sub-interval, if bucket end != interval end
                if (highValue < v.highValue) {
                    newBuckets.push([highValue, {
                            ...v,
                            highValue: v.highValue
                        }]);
                }
                endProcessed = true;
                return;
            }
            // either the bucket is completely inside the interval or before/after the interval
            const increment = startProcessed && !endProcessed;
            newBuckets.push([k, increment ? {
                    ...v,
                    count: v.count + 1,
                    date,
                    maxIndex: this.data.length - 1
                } : v]);
            if (increment)
                this.maxFrequency = Math.max(this.maxFrequency, v.count + 1);
        });
        this.buckets = new Map(newBuckets);
    }
    resetProvenance() {
        this.data = [];
        this.minTime = undefined;
        this.oldMaxTime = undefined;
        this.maxTime = undefined;
        this.maxFrequency = 0;
        this.buckets = new Map();
    }
    revalidateProvenance(provenance) {
        this.resetProvenance();
        const pdata = provenance.data;
        const first = pdata[0];
        const last = pdata[pdata.length - 1];
        this.data.push(first);
        this.initBuckets(first.timestamp, first.value[0], first.value[1]);
        pdata.slice(1).forEach(v => {
            this.data.push(v);
            this.addBucket(v.timestamp, v.value[0], v.value[1]);
        });
        this.minTime = first.timestamp;
        this.maxTime = last.timestamp;
        this.oldMaxTime = pdata.length > 1 ? pdata[pdata.length - 2].timestamp : first.timestamp;
        this.value = last.value[0];
        this.highValue = last.value[1];
    }
    ngOnInit() {
        this.options = {
            ...this.options,
            floor: this.options.floor || 0,
            ceil: this.options.ceil || 100,
            step: this.options.step || 1,
        };
        if (this.provenance?.data?.length) {
            if (this.provenance.revalidate) {
                this.revalidateProvenance(this.provenance);
            }
            else {
                this.data = this.provenance.data;
                this.minTime = this.provenance.minTime;
                this.oldMaxTime = this.provenance.oldMaxTime;
                this.maxTime = this.provenance.maxTime;
                this.maxFrequency = this.provenance.maxFrequency;
                this.buckets = this.provenance.buckets;
                this.value = this.provenance.value;
                this.highValue = this.provenance.highValue;
            }
            return;
        }
        const newDate = new Date();
        this.minTime = newDate;
        this.data = [
            {
                value: this.highValue == null ? [this.value] : [this.value, this.highValue],
                timestamp: newDate
            }
        ];
        this.initBuckets(newDate);
    }
    ngAfterViewInit() {
        // DO NOT CALL super.ngAfterViewInit() or REMOVE THIS METHOD
        if (this.provenance?.data?.length) {
            this._visualize();
        }
    }
    ngOnDestroy() {
        clearInterval(this.interval);
    }
    draw(xScale, yScale, index, data) {
        const self = this;
        const pSvg = d3.select(this.provenanceSvg.nativeElement);
        const aSvg = d3.select(this.aggregateSvg.nativeElement);
        const y = yScale.copy();
        const aggY = d3.scaleLinear().domain([0, this.maxFrequency]).range([0, this.sliderHeight - 2]);
        const color = d3
            .scaleSequential(interpolateLightOranges)
            .domain(this.mode === "interaction" ?
            [0, this.data.length - 1] :
            [this.minTime.getTime(), this.maxTime.getTime()]);
        aSvg
            .select("g")
            .selectAll("rect")
            .remove();
        // sort by timestamp, lowest first
        const buckets = Array.from(this.buckets.entries()).sort((a, b) => a[1].date.getTime() - b[1].date.getTime());
        const tooltip = getTooltip();
        aSvg
            .selectAll("rect")
            .data(buckets)
            .join("rect")
            .attr("x", ([key]) => xScale(+key))
            .attr("y", ([_, value]) => this.sliderHeight - aggY(value.count))
            .attr("width", ([key, value]) => this.highValue != null ? xScale((this.options.floor || 0) + value.highValue - (+key)) : 8)
            .attr("height", ([_, value]) => aggY(value.count))
            .attr("fill", ([_, value]) => color(this.mode === "interaction" ? value.maxIndex : value.date.getTime()))
            .attr("stroke", "black")
            .attr("stroke-width", ([_, value]) => value.date.getTime() >= this.oldMaxTime?.getTime() ? 2 : 0)
            .attr("stroke-dasharray", ([_, value]) => value.date.getTime() === this.oldMaxTime?.getTime() ? "4 1" : "0 0")
            .on("click", (_, d) => {
            this.value = d[0];
            if (d[1].highValue != null && this.highValue != null) {
                this.highValue = d[1].highValue;
            }
            this.onUserChangeEnd({
                value: d[0],
                highValue: this.highValue || undefined,
                pointerType: 1
            }, "aggregate-rect-click");
        })
            .on("mouseover", function (e, d) {
            const { clientX: x, clientY: y } = e;
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: self.id,
                    widget: self.highValue != null ? "range-slider" : "slider",
                    mode: self.mode,
                    interaction: "aggregate-rect-mouseover",
                    data: {
                        lowValue: d[0],
                        ...d[1]
                    }
                }
            }));
            d3.select(this).attr("opacity", 0.5);
            tooltip
                .style("opacity", 1)
                .style("display", "block")
                .style("left", `${x + 10}px`)
                .style("top", `${y + 10}px`)
                .select("div")
                .html(`Label: ${self.el?.nativeElement?.dataset?.label || self.id} <br />` +
                `Selected ${d[1].highValue == null ? `value: ${d[0]}` : `range: [${d[0]}, ${d[1].highValue}]`} <br />` +
                `# times selected: ${d[1].count} <br />` +
                `Last selected at: ${d[1].date.toLocaleString()} <br />` +
                `${suffixed(d[1].maxIndex)}/${suffixed(self.data.length - 1)} selection`);
        })
            .on("mouseout", function () {
            d3.select(this).attr("opacity", 1);
            tooltip
                .style("opacity", 0)
                .style("display", "none");
        });
        let filtered = false;
        if (this.filterStart || this.filterEnd) {
            filtered = true;
            data = data.reduce((acc, v, i) => {
                if (this.mode === "interaction") {
                    if (i >= this.filterStart && i <= this.filterEnd)
                        acc.push({
                            ...v,
                            actualIndex: i
                        });
                }
                else {
                    if (v.timestamp >= this.filterStart && v.timestamp <= this.filterEnd)
                        acc.push(v);
                }
                return acc;
            }, []);
            y.domain([this.filterStart, this.filterEnd]);
        }
        const line = d3.line()
            .x(d => xScale(d.value[index]))
            .y((d, i) => y(this.mode === "interaction" ? filtered ? d.actualIndex ?? i : i : d.timestamp));
        pSvg
            .select("g.body")
            .selectAll(`.line-${index}`)
            .data([data])
            .join("path")
            .transition()
            .duration(250)
            .attr("class", `line-${index}`)
            .attr("fill", "none")
            .attr("stroke", "#495057")
            .attr("stroke-width", 1)
            .attr("d", line);
        const circle = pSvg
            .select("g.body")
            .selectAll(`.circle-${index}`)
            .data(data)
            .join("circle")
            .on("click", (_, d) => {
            this.value = d.value[0];
            if (this.highValue != null) {
                this.highValue = d.value[1];
            }
            this.onUserChangeEnd({
                value: d.value[0],
                highValue: this.highValue || undefined,
                pointerType: 1
            }, "temporal-circle-click");
        })
            .on("mouseover", function (e, d) {
            // const [x, y] = d3.pointer(e)
            const { clientX: x, clientY: y } = e;
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: self.id,
                    widget: self.highValue != null ? "range-slider" : "slider",
                    mode: self.mode,
                    interaction: "temporal-circle-mouseover",
                    data: {
                        ...d,
                        index: d3.select(this).attr("data-index")
                    }
                }
            }));
            tooltip
                .style("opacity", 1)
                .style("display", "block")
                .style("left", `${x + 10}px`)
                .style("top", `${y + 10}px`)
                .select("div")
                .html(`Label: ${self.el?.nativeElement?.dataset?.label || self.id} <br />` +
                `Selected value: ${d.value[index]} <br />` +
                `Selected at: ${d.timestamp.toLocaleString()} <br />` +
                `${suffixed(+d3.select(this).attr("data-index"))}/${suffixed(self.data.length - 1)} selection <br />`);
        })
            .on("mouseout", () => {
            tooltip
                .style("opacity", 0)
                .style("display", "none");
        });
        circle
            .selectChild((d, i) => `.${i}`)
            .remove();
        circle
            .transition()
            .duration(250)
            .attr("class", `circle-${index}`)
            .attr("data-index", (_, i) => i)
            .attr("cx", d => xScale(d.value[index]))
            .attr("cy", (d, i) => y(this.mode === "interaction" ? filtered ? d.actualIndex ?? i : i : d.timestamp))
            .attr("r", 4)
            .attr("fill", (d, i) => color(this.mode === "interaction" ? filtered ? d.actualIndex ?? i : i : d.timestamp))
            .attr("stroke", "#495057")
            .attr("stroke-width", 1)
            .style("cursor", "pointer");
    }
    _visualize() {
        if (!this.visualize)
            return;
        const pSvg = d3.select(this.provenanceSvg.nativeElement);
        const aSvg = d3.select(this.aggregateSvg.nativeElement);
        const sliderNode = d3.select(this.wrapper.nativeElement).select("ngx-slider").node();
        // Fix implementation - Get integer width
        const sliderWidth = sliderNode.offsetWidth - 2 * 4;
        // get margin-top of node
        if (!this.sliderHeight) {
            this.sliderHeight = parseInt(getComputedStyle(sliderNode).marginTop);
        }
        const pButtonWidth = this.pButton.nativeElement.offsetWidth;
        pSvg
            .attr('width', sliderWidth + LINE_CIRCLE_DIAMETER)
            .attr('height', DEFAULT_HEIGHT + LINE_CIRCLE_DIAMETER)
            .style('transform', 'translateX(-1.25rem)')
            .style('width', `calc(${pButtonWidth}px + 1rem + ${sliderWidth + LINE_CIRCLE_DIAMETER}px)`);
        pSvg
            .select("g.body")
            .attr("style", `transform: translate(calc(${pButtonWidth}px + 1rem + ${LINE_CIRCLE_DIAMETER / 2}px),${1 + LINE_CIRCLE_DIAMETER / 2}px)`);
        aSvg
            .attr('width', sliderWidth + LINE_CIRCLE_DIAMETER)
            .attr('height', this.sliderHeight)
            .style("transform", `translateX(calc(1rem + ${pButtonWidth}px))`);
        const x = d3.scaleLinear()
            .domain([this.options.floor, this.options.ceil])
            .range([0, parseInt(pSvg.attr('width')) - LINE_CIRCLE_DIAMETER]);
        const y = this.mode === "interaction" ?
            d3.scaleLinear()
                .domain([0, this.data.length - 1])
                .range([0, DEFAULT_HEIGHT])
            :
                d3.scaleTime()
                    .domain([this.minTime, this.maxTime])
                    .range([0, DEFAULT_HEIGHT]);
        const yAxis = d3.axisLeft(y.nice());
        if (this.mode !== "interaction")
            yAxis.tickValues([this.minTime, this.maxTime]).tickFormat((_, i) => i === 0 ? "t=0" : "now");
        const axis = pSvg
            .select(".axis");
        axis
            .select("text")
            .attr("x", -(DEFAULT_HEIGHT + LINE_CIRCLE_DIAMETER) / 2);
        axis
            .style("transform", `translate(calc(${pButtonWidth}px + 1rem + ${LINE_CIRCLE_DIAMETER / 2}px),${1 + LINE_CIRCLE_DIAMETER / 2}px)`)
            .call(yAxis);
        this.brush = d3
            .brushY()
            .extent([[-convertRemToPixels(2), 0], [0, DEFAULT_HEIGHT + LINE_CIRCLE_DIAMETER]])
            .on("end", (d) => {
            const selection = d.selection;
            if (selection) {
                this.filterStart = y.invert(selection[0]);
                this.filterEnd = y.invert(selection[1]);
            }
            else {
                this.filterStart = undefined;
                this.filterEnd = undefined;
            }
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: this.id,
                    widget: this.highValue != null ? "range-slider" : "slider",
                    mode: this.mode,
                    interaction: "brush-end",
                    data: {
                        selection
                    }
                }
            }));
            this.draw(x, y, 0, this.data);
            if (this.highValue != null)
                this.draw(x, y, 1, this.data);
        });
        axis.call(this.brush);
        this.draw(x, y, 0, this.data);
        if (this.highValue != null) {
            this.draw(x, y, 1, this.data);
        }
        axis.selectAll("rect").raise();
    }
    onUserChangeEnd(change, interaction = "user-change-end") {
        this.userChangeEnd.emit(change);
        this.selectedChange?.emit(change);
        const value = change.highValue != null ? [change.value, change.highValue] : [change.value];
        const timestamp = new Date();
        const newEntry = { value, timestamp };
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: this.id,
                widget: this.highValue != null ? "range-slider" : "slider",
                mode: this.mode,
                interaction,
                data: {
                    ...newEntry
                }
            }
        }));
        if (this.freeze)
            return;
        const dataEntry = [newEntry];
        if (this.mode === "time")
            dataEntry.push(newEntry);
        this.data = [
            ...this.data,
            ...dataEntry
        ];
        this.addBucket(timestamp, change.value, change.highValue);
        if (!this.minTime)
            this.minTime = timestamp;
        this.oldMaxTime = this.maxTime || this.minTime;
        this.maxTime = timestamp;
        if (this.mode === "time" && isNaN(this.interval)) {
            this.interval = setInterval(() => {
                const newTimeStamp = new Date();
                this.oldMaxTime = this.maxTime;
                this.maxTime = newTimeStamp;
                const lastEntry = this.data.slice(-1)[0];
                this.data = [
                    ...this.data.slice(0, -1),
                    {
                        value: lastEntry.value,
                        timestamp: newTimeStamp
                    }
                ];
                this._visualize();
            }, 1000);
        }
        this.provenanceChange?.emit({
            data: this.data,
            minTime: this.minTime,
            oldMaxTime: this.oldMaxTime,
            maxTime: this.maxTime,
            maxFrequency: this.maxFrequency,
            buckets: this.buckets,
            value: this.value,
            highValue: this.highValue
        });
        this._visualize();
    }
    handleProvenanceButtonClick(event, target, op) {
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: this.id,
                widget: this.highValue ? "range-slider" : "slider",
                mode: this.mode,
                interaction: "provenance-button-click",
                initialProvenanceMode: op.overlayVisible ? "temporal" : "aggregate"
            }
        }));
        op.toggle(event, target);
    }
}
SliderComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: SliderComponent, deps: [{ token: i0.Renderer2 }, { token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
SliderComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: SliderComponent, selector: "provenance-slider", inputs: { mode: "mode", id: "id", provenance: "provenance", visualize: "visualize", freeze: "freeze" }, outputs: { provenanceChange: "provenanceChange", selectedChange: "selectedChange" }, viewQueries: [{ propertyName: "wrapper", first: true, predicate: ["wrapper"], descendants: true }, { propertyName: "provenanceSvg", first: true, predicate: ["provenance"], descendants: true }, { propertyName: "aggregateSvg", first: true, predicate: ["aggregate"], descendants: true }, { propertyName: "pButton", first: true, predicate: ["provenanceButton"], descendants: true }], usesInheritance: true, ngImport: i0, template: "<p-overlayPanel\n  #op\n  [dismissable]=\"false\"\n>\n  <svg #provenance class=\"slider-provenance\">\n    <g class=\"axis\">\n      <text \n        transform=\"rotate(-90)\" \n        text-anchor=\"middle\" \n        y=\"-33\" \n        fill=\"black\"\n        [attr.font-size]=\"'1rem'\"\n      >\n        {{mode === \"interaction\" ? \"Sequence of Interaction (0 = first)\" : \"time\"}}\n      </text>\n    </g>\n    <g class=\"body\"></g>\n  </svg>\n</p-overlayPanel>\n<div\n  #wrapper\n  class=\"flex flex-row gap-3 custom-slider\"\n>\n  <button\n    *ngIf=\"visualize\"\n    pButton\n    #provenanceButton\n    type=\"button\"\n    class=\"p-button-help p-button-text\"\n    (click)=\"handleProvenanceButtonClick($event, wrapper, op)\"\n    [disabled]=\"data.length === 1\"\n    [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n  >\n    <provenance-icon \n      [icon]=\"data.length === 1 ? 'disabled' : op.overlayVisible ? 'temporal' : 'aggregate'\"\n    ></provenance-icon>\n  </button>\n  <svg #aggregate style=\"position: absolute;\" width=\"0\" height=\"0\">\n    <g></g>\n  </svg>\n  <ngx-slider\n  [(value)]=\"value\"\n  [(highValue)]=\"highValue\"\n  [options]=\"options\"\n  (userChange)=\"userChange\"\n  (userChangeEnd)=\"onUserChangeEnd($event)\"\n  (userChangeStart)=\"userChangeStart\"\n  (valueChange)=\"valueChange\"\n  (highValueChange)=\"highValueChange\"\n  />\n</div>", styles: ["::ng-deep provenance-slider{display:initial!important}::ng-deep .p-overlaypanel{box-shadow:none;margin-top:0}::ng-deep .p-overlaypanel:before{display:none}::ng-deep .p-overlaypanel:after{display:none}::ng-deep .p-overlaypanel-content{box-shadow:0 1px 3px #0000004d;border:0 none;border-radius:6px;color:#495057}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"], dependencies: [{ kind: "directive", type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i2.SliderComponent, selector: "ngx-slider", inputs: ["value", "highValue", "options", "manualRefresh", "triggerFocus"], outputs: ["valueChange", "highValueChange", "userChangeStart", "userChange", "userChangeEnd"] }, { kind: "component", type: i3.OverlayPanel, selector: "p-overlayPanel", inputs: ["dismissable", "showCloseIcon", "style", "styleClass", "appendTo", "autoZIndex", "ariaCloseLabel", "baseZIndex", "focusOnShow", "showTransitionOptions", "hideTransitionOptions"], outputs: ["onShow", "onHide"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "component", type: i5.IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: SliderComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-slider', template: "<p-overlayPanel\n  #op\n  [dismissable]=\"false\"\n>\n  <svg #provenance class=\"slider-provenance\">\n    <g class=\"axis\">\n      <text \n        transform=\"rotate(-90)\" \n        text-anchor=\"middle\" \n        y=\"-33\" \n        fill=\"black\"\n        [attr.font-size]=\"'1rem'\"\n      >\n        {{mode === \"interaction\" ? \"Sequence of Interaction (0 = first)\" : \"time\"}}\n      </text>\n    </g>\n    <g class=\"body\"></g>\n  </svg>\n</p-overlayPanel>\n<div\n  #wrapper\n  class=\"flex flex-row gap-3 custom-slider\"\n>\n  <button\n    *ngIf=\"visualize\"\n    pButton\n    #provenanceButton\n    type=\"button\"\n    class=\"p-button-help p-button-text\"\n    (click)=\"handleProvenanceButtonClick($event, wrapper, op)\"\n    [disabled]=\"data.length === 1\"\n    [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n  >\n    <provenance-icon \n      [icon]=\"data.length === 1 ? 'disabled' : op.overlayVisible ? 'temporal' : 'aggregate'\"\n    ></provenance-icon>\n  </button>\n  <svg #aggregate style=\"position: absolute;\" width=\"0\" height=\"0\">\n    <g></g>\n  </svg>\n  <ngx-slider\n  [(value)]=\"value\"\n  [(highValue)]=\"highValue\"\n  [options]=\"options\"\n  (userChange)=\"userChange\"\n  (userChangeEnd)=\"onUserChangeEnd($event)\"\n  (userChangeStart)=\"userChangeStart\"\n  (valueChange)=\"valueChange\"\n  (highValueChange)=\"highValueChange\"\n  />\n</div>", styles: ["::ng-deep provenance-slider{display:initial!important}::ng-deep .p-overlaypanel{box-shadow:none;margin-top:0}::ng-deep .p-overlaypanel:before{display:none}::ng-deep .p-overlaypanel:after{display:none}::ng-deep .p-overlaypanel-content{box-shadow:0 1px 3px #0000004d;border:0 none;border-radius:6px;color:#495057}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.Renderer2 }, { type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i0.NgZone }]; }, propDecorators: { mode: [{
                type: Input
            }], id: [{
                type: Input
            }], provenance: [{
                type: Input
            }], visualize: [{
                type: Input
            }], freeze: [{
                type: Input
            }], provenanceChange: [{
                type: Output
            }], selectedChange: [{
                type: Output
            }], wrapper: [{
                type: ViewChild,
                args: ["wrapper"]
            }], provenanceSvg: [{
                type: ViewChild,
                args: ["provenance"]
            }], aggregateSvg: [{
                type: ViewChild,
                args: ["aggregate"]
            }], pButton: [{
                type: ViewChild,
                args: ["provenanceButton"]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xpZGVyLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL3Byb3ZlbmFuY2Utd2lkZ2V0cy9zcmMvbGliL3NsaWRlci9zbGlkZXIuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvcHJvdmVuYW5jZS13aWRnZXRzL3NyYy9saWIvc2xpZGVyL3NsaWRlci5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQWlCLFNBQVMsRUFBYyxLQUFLLEVBQXFCLE1BQU0sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUF3QyxNQUFNLGVBQWUsQ0FBQztBQUN0SyxPQUFPLEVBQWlCLGVBQWUsSUFBSSxrQkFBa0IsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ2pHLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQ3hCLE9BQU8sRUFBRSxjQUFjLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxFQUFFLE1BQU0sVUFBVSxDQUFDOzs7Ozs7O0FBb0M3RixNQUFNLE9BQU8sZUFBZ0IsU0FBUSxrQkFBa0I7SUFHckQsSUFDSSxVQUFVO1FBQ1osT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFBO0lBQ3pCLENBQUM7SUFDRCxJQUFJLFVBQVUsQ0FBQyxLQUFLO1FBQ2xCLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxLQUFLLEVBQUUsVUFBVSxFQUFFO1lBQ3hDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO1lBQ3hCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNoQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7U0FDbEI7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtJQUMxQixD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Q0FBQyxJQUFJLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRTtZQUNsRCxNQUFNLEVBQUU7Z0JBQ04sRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNYLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVE7Z0JBQ2xELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixXQUFXLEVBQUUseUJBQXlCO2dCQUN0QyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVc7YUFDcEU7U0FDRixDQUFDLENBQUMsQ0FBQTtRQUNILEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQzFCLENBQUM7OzZHQXJtQlUsZUFBZTtpR0FBZixlQUFlLHlvQkN4QzVCLGs4Q0FrRE07NEZEVk8sZUFBZTtrQkFMM0IsU0FBUzsrQkFDRSxtQkFBbUI7OEtBS3BCLElBQUk7c0JBQVosS0FBSztnQkFDRyxFQUFFO3NCQUFWLEtBQUs7Z0JBRUYsVUFBVTtzQkFEYixLQUFLO2dCQWFHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNJLGdCQUFnQjtzQkFBekIsTUFBTTtnQkFDRyxjQUFjO3NCQUF2QixNQUFNO2dCQUNlLE9BQU87c0JBQTVCLFNBQVM7dUJBQUMsU0FBUztnQkFDSyxhQUFhO3NCQUFyQyxTQUFTO3VCQUFDLFlBQVk7Z0JBQ0MsWUFBWTtzQkFBbkMsU0FBUzt1QkFBQyxXQUFXO2dCQUNTLE9BQU87c0JBQXJDLFNBQVM7dUJBQUMsa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWZ0ZXJWaWV3SW5pdCwgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBJbnB1dCwgT25EZXN0cm95LCBPbkluaXQsIE91dHB1dCwgVmlld0NoaWxkLCBFdmVudEVtaXR0ZXIsIENoYW5nZURldGVjdG9yUmVmLCBOZ1pvbmUsIFJlbmRlcmVyMiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ2hhbmdlQ29udGV4dCwgU2xpZGVyQ29tcG9uZW50IGFzIE5neFNsaWRlckNvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyLXNsaWRlci9uZ3gtc2xpZGVyJ1xuaW1wb3J0ICogYXMgZDMgZnJvbSAnZDMnXG5pbXBvcnQgeyBERUZBVUxUX0hFSUdIVCwgTElORV9DSVJDTEVfRElBTUVURVIsIE1PREUgfSBmcm9tICcuLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgY29udmVydFJlbVRvUGl4ZWxzLCBnZXRUb29sdGlwLCBpbnRlcnBvbGF0ZUxpZ2h0T3Jhbmdlcywgc3VmZml4ZWQgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBPdmVybGF5UGFuZWwgfSBmcm9tICdwcmltZW5nL292ZXJsYXlwYW5lbCc7XG5cbmludGVyZmFjZSBUaW1lU3RhbXBlZFZhbHVlcyB7XG4gIHZhbHVlOiBudW1iZXJbXTtcbiAgdGltZXN0YW1wOiBEYXRlO1xuICBhY3R1YWxJbmRleD86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIEJ1Y2tldCB7XG4gIGRhdGU6IERhdGU7XG4gIGNvdW50OiBudW1iZXI7XG4gIGhpZ2hWYWx1ZT86IG51bWJlcjtcbiAgbWF4SW5kZXg/OiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFNsaWRlclByb3ZlbmFuY2UgPSB7XG4gIGRhdGE6IFRpbWVTdGFtcGVkVmFsdWVzW107XG4gIG1pblRpbWU6IERhdGU7XG4gIG9sZE1heFRpbWU6IERhdGU7XG4gIG1heFRpbWU6IERhdGU7XG4gIG1heEZyZXF1ZW5jeTogbnVtYmVyO1xuICBidWNrZXRzOiBNYXA8bnVtYmVyLCBCdWNrZXQ+O1xuICB2YWx1ZTogbnVtYmVyO1xuICBoaWdoVmFsdWU6IG51bWJlcjtcbiAgcmV2YWxpZGF0ZT86IGJvb2xlYW47XG59IHwge1xuICBkYXRhOiBUaW1lU3RhbXBlZFZhbHVlc1tdO1xuICByZXZhbGlkYXRlOiB0cnVlO1xufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdwcm92ZW5hbmNlLXNsaWRlcicsXG4gIHRlbXBsYXRlVXJsOiAnLi9zbGlkZXIuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9vdmVybGF5cGFuZWwuY29tcG9uZW50LnNjc3MnLCAnLi9zbGlkZXIuY29tcG9uZW50LnNjc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBTbGlkZXJDb21wb25lbnQgZXh0ZW5kcyBOZ3hTbGlkZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG4gIEBJbnB1dCgpIG1vZGUgPSBNT0RFXG4gIEBJbnB1dCgpIGlkID0gXCJcIlxuICBASW5wdXQoKSBcbiAgZ2V0IHByb3ZlbmFuY2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb3ZlbmFuY2VcbiAgfVxuICBzZXQgcHJvdmVuYW5jZSh2YWx1ZSkge1xuICAgIGlmICh0aGlzLnByb3ZlbmFuY2UgJiYgdmFsdWU/LnJldmFsaWRhdGUpIHtcbiAgICAgIHRoaXMuX3Byb3ZlbmFuY2UgPSB2YWx1ZVxuICAgICAgdGhpcy5yZXZhbGlkYXRlUHJvdmVuYW5jZSh2YWx1ZSlcbiAgICAgIHRoaXMuX3Zpc3VhbGl6ZSgpXG4gICAgfVxuICAgIHRoaXMuX3Byb3ZlbmFuY2UgPSB2YWx1ZVxuICB9XG4gIF9wcm92ZW5hbmNlPzogU2xpZGVyUHJvdmVuYW5jZVxuICBASW5wdXQoKSB2aXN1YWxpemUgPSB0cnVlXG4gIEBJbnB1dCgpIGZyZWV6ZSA9IGZhbHNlXG4gIEBPdXRwdXQoKSBwcm92ZW5hbmNlQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxTbGlkZXJQcm92ZW5hbmNlPigpO1xuICBAT3V0cHV0KCkgc2VsZWN0ZWRDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPENoYW5nZUNvbnRleHQ+KCk7XG4gIEBWaWV3Q2hpbGQoXCJ3cmFwcGVyXCIpIHdyYXBwZXIhOiBFbGVtZW50UmVmPEhUTUxEaXZFbGVtZW50PjtcbiAgQFZpZXdDaGlsZChcInByb3ZlbmFuY2VcIikgcHJvdmVuYW5jZVN2ZyE6IEVsZW1lbnRSZWY8U1ZHU1ZHRWxlbWVudD47XG4gIEBWaWV3Q2hpbGQoXCJhZ2dyZWdhdGVcIikgYWdncmVnYXRlU3ZnITogRWxlbWVudFJlZjxTVkdTVkdFbGVtZW50PjtcbiAgQFZpZXdDaGlsZChcInByb3ZlbmFuY2VCdXR0b25cIikgcEJ1dHRvbiE6IEVsZW1lbnRSZWY8SFRNTEJ1dHRvbkVsZW1lbnQ+O1xuXG4gIGRhdGE6IFRpbWVTdGFtcGVkVmFsdWVzW10gPSBbXVxuICBtaW5UaW1lOiBEYXRlIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG4gIG9sZE1heFRpbWU6IERhdGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcbiAgbWF4VGltZTogRGF0ZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICBtYXhGcmVxdWVuY3kgPSAwXG4gIGludGVydmFsID0gTmFOXG4gIHNsaWRlckhlaWdodCA9IDBcbiAgYnJ1c2ghOiBkMy5CcnVzaEJlaGF2aW9yPHVua25vd24+XG4gIGZpbHRlclN0YXJ0PzogbnVtYmVyIHwgRGF0ZVxuICBmaWx0ZXJFbmQ/OiBudW1iZXIgfCBEYXRlXG4gIGJ1Y2tldHM6IE1hcDxudW1iZXIsIEJ1Y2tldD4gPSBuZXcgTWFwKClcbiAgZWw6IEVsZW1lbnRSZWZcblxuICBjb25zdHJ1Y3RvcihyZW5kZXJlcjogUmVuZGVyZXIyLCBlbGVtZW50UmVmOiBFbGVtZW50UmVmLCBjaGFuZ2VEZXRlY3Rpb25SZWY6IENoYW5nZURldGVjdG9yUmVmLCB6b25lOiBOZ1pvbmUpIHtcbiAgICBzdXBlcihyZW5kZXJlciwgZWxlbWVudFJlZiwgY2hhbmdlRGV0ZWN0aW9uUmVmLCB6b25lLCBmYWxzZSlcbiAgICB0aGlzLmVsID0gZWxlbWVudFJlZlxuICB9XG5cbiAgaW5pdEJ1Y2tldHMoZGF0ZTogRGF0ZSwgdmFsdWUgPSB0aGlzLnZhbHVlLCBoaWdoVmFsdWUgPSB0aGlzLmhpZ2hWYWx1ZSkge1xuICAgIHRoaXMuYnVja2V0cy5zZXQodmFsdWUsIHtcbiAgICAgIGRhdGUsXG4gICAgICBjb3VudDogMSxcbiAgICAgIGhpZ2hWYWx1ZTogaGlnaFZhbHVlLFxuICAgICAgbWF4SW5kZXg6IDBcbiAgICB9KVxuICAgIGlmIChoaWdoVmFsdWUgIT0gbnVsbCkge1xuICAgICAgLy8gZW5hYmxlcyAxMDAlIHNsaWRlciBjb3ZlcmFnZVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5mbG9vciEgPCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmJ1Y2tldHMuc2V0KHRoaXMub3B0aW9ucy5mbG9vciEsIHtcbiAgICAgICAgICBkYXRlLFxuICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgIGhpZ2hWYWx1ZTogdmFsdWVcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2VpbCEgPiBoaWdoVmFsdWUpIHtcbiAgICAgICAgdGhpcy5idWNrZXRzLnNldChoaWdoVmFsdWUsIHtcbiAgICAgICAgICBkYXRlLFxuICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgIGhpZ2hWYWx1ZTogdGhpcy5vcHRpb25zLmNlaWwhXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWF4RnJlcXVlbmN5ID0gMVxuICB9XG5cbiAgYWRkQnVja2V0KGRhdGU6IERhdGUsIHZhbHVlOiBudW1iZXIsIGhpZ2hWYWx1ZT86IG51bWJlcikge1xuICAgIGlmIChoaWdoVmFsdWUgPT0gbnVsbCkge1xuICAgICAgdGhpcy5idWNrZXRzLnNldCh2YWx1ZSwge1xuICAgICAgICBkYXRlLFxuICAgICAgICBjb3VudDogKHRoaXMuYnVja2V0cy5nZXQodmFsdWUpPy5jb3VudCB8fCAwKSArIDEsXG4gICAgICAgIG1heEluZGV4OiB0aGlzLmRhdGEubGVuZ3RoIC0gMVxuICAgICAgfSlcbiAgICAgIHRoaXMubWF4RnJlcXVlbmN5ID0gTWF0aC5tYXgodGhpcy5tYXhGcmVxdWVuY3ksIHRoaXMuYnVja2V0cy5nZXQodmFsdWUpIS5jb3VudClcblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgYnVja2V0cyA9IEFycmF5LmZyb20odGhpcy5idWNrZXRzLmVudHJpZXMoKSkuc29ydCgoYSwgYikgPT4gYVswXSAtIGJbMF0pXG5cbiAgICBsZXQgbmV3QnVja2V0czogdHlwZW9mIGJ1Y2tldHMgPSBbXVxuICAgIGxldCBzdGFydFByb2Nlc3NlZCA9IGZhbHNlXG4gICAgbGV0IGVuZFByb2Nlc3NlZCA9IGZhbHNlXG5cbiAgICBidWNrZXRzLmZvckVhY2goKFtrLCB2XSkgPT4ge1xuICAgICAgLy8gaW50ZXJ2YWwgc3RhcnQgaXMgaW4gYSBidWNrZXRcbiAgICAgIGlmICghc3RhcnRQcm9jZXNzZWQgJiYgIWVuZFByb2Nlc3NlZCAmJiB2YWx1ZSA8IHYuaGlnaFZhbHVlISkge1xuICAgICAgICBzdGFydFByb2Nlc3NlZCA9IHRydWVcbiAgICAgICAgLy8gMXN0IHN1Yi1pbnRlcnZhbCBpbiB0aGUgYnVja2V0XG4gICAgICAgIGlmICh2YWx1ZSA+IGspIHtcbiAgICAgICAgICBuZXdCdWNrZXRzLnB1c2goW2ssIHtcbiAgICAgICAgICAgIC4uLnYsXG4gICAgICAgICAgICBoaWdoVmFsdWU6IHZhbHVlXG4gICAgICAgICAgfV0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyAybmQgc3ViLWludGVydmFsIGluIHRoZSBidWNrZXRcbiAgICAgICAgbmV3QnVja2V0cy5wdXNoKFt2YWx1ZSwge1xuICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgY291bnQ6IHYuY291bnQgKyAxLFxuICAgICAgICAgIGhpZ2hWYWx1ZTogTWF0aC5taW4oaGlnaFZhbHVlLCB2LmhpZ2hWYWx1ZSEpLFxuICAgICAgICAgIG1heEluZGV4OiB0aGlzLmRhdGEubGVuZ3RoIC0gMVxuICAgICAgICB9XSlcbiAgICAgICAgdGhpcy5tYXhGcmVxdWVuY3kgPSBNYXRoLm1heCh0aGlzLm1heEZyZXF1ZW5jeSwgdi5jb3VudCArIDEpXG5cbiAgICAgICAgLy8gSWYgdGhlIGludGVydmFsIGVuZCBpcyBhbHNvIGluIHRoZSBidWNrZXQsIHdlIG5lZWQgdG8gYWRkIGEgM3JkIHN1Yi1pbnRlcnZhbFxuICAgICAgICBpZiAoaGlnaFZhbHVlIDwgdi5oaWdoVmFsdWUhKSB7XG4gICAgICAgICAgbmV3QnVja2V0cy5wdXNoKFtoaWdoVmFsdWUsIHtcbiAgICAgICAgICAgIC4uLnYsXG4gICAgICAgICAgICBoaWdoVmFsdWU6IHYuaGlnaFZhbHVlXG4gICAgICAgICAgfV0pXG4gICAgICAgICAgZW5kUHJvY2Vzc2VkID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIGludGVydmFsIGVuZCBpcyBpbiBidWNrZXQsIGJ1dCBzdGFydCBpcyBub3RcbiAgICAgIGlmICghZW5kUHJvY2Vzc2VkICYmIGhpZ2hWYWx1ZSA8PSB2LmhpZ2hWYWx1ZSEpIHtcbiAgICAgICAgaWYgKGhpZ2hWYWx1ZSA+IGspIHtcbiAgICAgICAgICBuZXdCdWNrZXRzLnB1c2goW2ssIHtcbiAgICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgICBjb3VudDogdi5jb3VudCArIDEsXG4gICAgICAgICAgICBoaWdoVmFsdWU6IGhpZ2hWYWx1ZSxcbiAgICAgICAgICAgIG1heEluZGV4OiB0aGlzLmRhdGEubGVuZ3RoIC0gMVxuICAgICAgICAgIH1dKVxuICAgICAgICAgIHRoaXMubWF4RnJlcXVlbmN5ID0gTWF0aC5tYXgodGhpcy5tYXhGcmVxdWVuY3ksIHYuY291bnQgKyAxKVxuICAgICAgICB9XG4gICAgICAgIC8vIDJuZCBzdWItaW50ZXJ2YWwsIGlmIGJ1Y2tldCBlbmQgIT0gaW50ZXJ2YWwgZW5kXG4gICAgICAgIGlmIChoaWdoVmFsdWUgPCB2LmhpZ2hWYWx1ZSEpIHtcbiAgICAgICAgICBuZXdCdWNrZXRzLnB1c2goW2hpZ2hWYWx1ZSwge1xuICAgICAgICAgICAgLi4udixcbiAgICAgICAgICAgIGhpZ2hWYWx1ZTogdi5oaWdoVmFsdWVcbiAgICAgICAgICB9XSlcbiAgICAgICAgfVxuICAgICAgICBlbmRQcm9jZXNzZWQgPSB0cnVlXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBlaXRoZXIgdGhlIGJ1Y2tldCBpcyBjb21wbGV0ZWx5IGluc2lkZSB0aGUgaW50ZXJ2YWwgb3IgYmVmb3JlL2FmdGVyIHRoZSBpbnRlcnZhbFxuICAgICAgY29uc3QgaW5jcmVtZW50ID0gc3RhcnRQcm9jZXNzZWQgJiYgIWVuZFByb2Nlc3NlZFxuICAgICAgbmV3QnVja2V0cy5wdXNoKFtrLCBpbmNyZW1lbnQgPyB7XG4gICAgICAgIC4uLnYsXG4gICAgICAgIGNvdW50OiB2LmNvdW50ICsgMSxcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgbWF4SW5kZXg6IHRoaXMuZGF0YS5sZW5ndGggLSAxXG4gICAgICB9IDogdl0pXG5cbiAgICAgIGlmIChpbmNyZW1lbnQpXG4gICAgICAgIHRoaXMubWF4RnJlcXVlbmN5ID0gTWF0aC5tYXgodGhpcy5tYXhGcmVxdWVuY3ksIHYuY291bnQgKyAxKVxuICAgIH0pXG4gICAgdGhpcy5idWNrZXRzID0gbmV3IE1hcChuZXdCdWNrZXRzKVxuICB9XG5cbiAgcmVzZXRQcm92ZW5hbmNlKCkge1xuICAgIHRoaXMuZGF0YSA9IFtdXG4gICAgdGhpcy5taW5UaW1lID0gdW5kZWZpbmVkXG4gICAgdGhpcy5vbGRNYXhUaW1lID0gdW5kZWZpbmVkXG4gICAgdGhpcy5tYXhUaW1lID0gdW5kZWZpbmVkXG4gICAgdGhpcy5tYXhGcmVxdWVuY3kgPSAwXG4gICAgdGhpcy5idWNrZXRzID0gbmV3IE1hcCgpXG4gIH1cblxuICByZXZhbGlkYXRlUHJvdmVuYW5jZShwcm92ZW5hbmNlOiBTbGlkZXJQcm92ZW5hbmNlKSB7XG4gICAgdGhpcy5yZXNldFByb3ZlbmFuY2UoKVxuICAgIGNvbnN0IHBkYXRhID0gcHJvdmVuYW5jZS5kYXRhXG4gICAgY29uc3QgZmlyc3QgPSBwZGF0YVswXVxuICAgIGNvbnN0IGxhc3QgPSBwZGF0YVtwZGF0YS5sZW5ndGggLSAxXVxuXG4gICAgdGhpcy5kYXRhLnB1c2goZmlyc3QpXG4gICAgdGhpcy5pbml0QnVja2V0cyhmaXJzdC50aW1lc3RhbXAsIGZpcnN0LnZhbHVlWzBdLCBmaXJzdC52YWx1ZVsxXSlcblxuICAgIHBkYXRhLnNsaWNlKDEpLmZvckVhY2godiA9PiB7XG4gICAgICB0aGlzLmRhdGEucHVzaCh2KVxuICAgICAgdGhpcy5hZGRCdWNrZXQodi50aW1lc3RhbXAsIHYudmFsdWVbMF0sIHYudmFsdWVbMV0pXG4gICAgfSlcblxuICAgIHRoaXMubWluVGltZSA9IGZpcnN0LnRpbWVzdGFtcFxuICAgIHRoaXMubWF4VGltZSA9IGxhc3QudGltZXN0YW1wXG4gICAgdGhpcy5vbGRNYXhUaW1lID0gcGRhdGEubGVuZ3RoID4gMSA/IHBkYXRhW3BkYXRhLmxlbmd0aCAtIDJdLnRpbWVzdGFtcCA6IGZpcnN0LnRpbWVzdGFtcFxuICAgIHRoaXMudmFsdWUgPSBsYXN0LnZhbHVlWzBdXG4gICAgdGhpcy5oaWdoVmFsdWUgPSBsYXN0LnZhbHVlWzFdXG4gIH1cblxuICBvdmVycmlkZSBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICBmbG9vcjogdGhpcy5vcHRpb25zLmZsb29yIHx8IDAsXG4gICAgICBjZWlsOiB0aGlzLm9wdGlvbnMuY2VpbCB8fCAxMDAsXG4gICAgICBzdGVwOiB0aGlzLm9wdGlvbnMuc3RlcCB8fCAxLFxuICAgIH1cbiAgICBpZiAodGhpcy5wcm92ZW5hbmNlPy5kYXRhPy5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLnByb3ZlbmFuY2UucmV2YWxpZGF0ZSkge1xuICAgICAgICB0aGlzLnJldmFsaWRhdGVQcm92ZW5hbmNlKHRoaXMucHJvdmVuYW5jZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IHRoaXMucHJvdmVuYW5jZS5kYXRhXG4gICAgICAgIHRoaXMubWluVGltZSA9IHRoaXMucHJvdmVuYW5jZS5taW5UaW1lXG4gICAgICAgIHRoaXMub2xkTWF4VGltZSA9IHRoaXMucHJvdmVuYW5jZS5vbGRNYXhUaW1lXG4gICAgICAgIHRoaXMubWF4VGltZSA9IHRoaXMucHJvdmVuYW5jZS5tYXhUaW1lXG4gICAgICAgIHRoaXMubWF4RnJlcXVlbmN5ID0gdGhpcy5wcm92ZW5hbmNlLm1heEZyZXF1ZW5jeVxuICAgICAgICB0aGlzLmJ1Y2tldHMgPSB0aGlzLnByb3ZlbmFuY2UuYnVja2V0c1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5wcm92ZW5hbmNlLnZhbHVlXG4gICAgICAgIHRoaXMuaGlnaFZhbHVlID0gdGhpcy5wcm92ZW5hbmNlLmhpZ2hWYWx1ZVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgpXG4gICAgdGhpcy5taW5UaW1lID0gbmV3RGF0ZVxuICAgIHRoaXMuZGF0YSA9IFtcbiAgICAgIHtcbiAgICAgICAgdmFsdWU6IHRoaXMuaGlnaFZhbHVlID09IG51bGwgPyBbdGhpcy52YWx1ZV0gOiBbdGhpcy52YWx1ZSwgdGhpcy5oaWdoVmFsdWVdLFxuICAgICAgICB0aW1lc3RhbXA6IG5ld0RhdGVcbiAgICAgIH1cbiAgICBdXG4gICAgdGhpcy5pbml0QnVja2V0cyhuZXdEYXRlKVxuICB9XG5cbiAgb3ZlcnJpZGUgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIC8vIERPIE5PVCBDQUxMIHN1cGVyLm5nQWZ0ZXJWaWV3SW5pdCgpIG9yIFJFTU9WRSBUSElTIE1FVEhPRFxuICAgIGlmICh0aGlzLnByb3ZlbmFuY2U/LmRhdGE/Lmxlbmd0aCkge1xuICAgICAgdGhpcy5fdmlzdWFsaXplKClcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBuZ09uRGVzdHJveSgpIHtcbiAgICBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpXG4gIH1cblxuICBwcml2YXRlIGRyYXcoXG4gICAgeFNjYWxlOiBkMy5TY2FsZUxpbmVhcjxudW1iZXIsIG51bWJlciwgbmV2ZXI+LFxuICAgIHlTY2FsZTogZDMuU2NhbGVMaW5lYXI8bnVtYmVyLCBudW1iZXIsIG5ldmVyPiB8IGQzLlNjYWxlVGltZTxudW1iZXIsIG51bWJlciwgbmV2ZXI+LFxuICAgIGluZGV4OiAwIHwgMSxcbiAgICBkYXRhOiBUaW1lU3RhbXBlZFZhbHVlc1tdLFxuICApIHtcbiAgICBjb25zdCBzZWxmID0gdGhpc1xuICAgIGNvbnN0IHBTdmcgPSBkMy5zZWxlY3QodGhpcy5wcm92ZW5hbmNlU3ZnLm5hdGl2ZUVsZW1lbnQpXG4gICAgY29uc3QgYVN2ZyA9IGQzLnNlbGVjdCh0aGlzLmFnZ3JlZ2F0ZVN2Zy5uYXRpdmVFbGVtZW50KVxuICAgIGNvbnN0IHkgPSB5U2NhbGUuY29weSgpXG4gICAgY29uc3QgYWdnWSA9IGQzLnNjYWxlTGluZWFyKCkuZG9tYWluKFswLCB0aGlzLm1heEZyZXF1ZW5jeV0pLnJhbmdlKFswLCB0aGlzLnNsaWRlckhlaWdodCAtIDJdKVxuICAgIGNvbnN0IGNvbG9yID0gZDNcbiAgICAgIC5zY2FsZVNlcXVlbnRpYWwoaW50ZXJwb2xhdGVMaWdodE9yYW5nZXMpXG4gICAgICAuZG9tYWluKFxuICAgICAgICB0aGlzLm1vZGUgPT09IFwiaW50ZXJhY3Rpb25cIiA/XG4gICAgICAgICAgWzAsIHRoaXMuZGF0YS5sZW5ndGggLSAxXSA6XG4gICAgICAgICAgW3RoaXMubWluVGltZSEuZ2V0VGltZSgpLCB0aGlzLm1heFRpbWUhLmdldFRpbWUoKV1cbiAgICAgIClcblxuICAgIGFTdmdcbiAgICAgIC5zZWxlY3QoXCJnXCIpXG4gICAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxuICAgICAgLnJlbW92ZSgpXG5cbiAgICAvLyBzb3J0IGJ5IHRpbWVzdGFtcCwgbG93ZXN0IGZpcnN0XG4gICAgY29uc3QgYnVja2V0cyA9IEFycmF5LmZyb20odGhpcy5idWNrZXRzLmVudHJpZXMoKSkuc29ydCgoYSwgYikgPT4gYVsxXS5kYXRlLmdldFRpbWUoKSAtIGJbMV0uZGF0ZS5nZXRUaW1lKCkpXG5cbiAgICBjb25zdCB0b29sdGlwID0gZ2V0VG9vbHRpcCgpXG5cbiAgICBhU3ZnXG4gICAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxuICAgICAgLmRhdGEoYnVja2V0cylcbiAgICAgIC5qb2luKFwicmVjdFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIChba2V5XSkgPT4geFNjYWxlKCtrZXkpKVxuICAgICAgLmF0dHIoXCJ5XCIsIChbXywgdmFsdWVdKSA9PiB0aGlzLnNsaWRlckhlaWdodCAtIGFnZ1kodmFsdWUuY291bnQpKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAoW2tleSwgdmFsdWVdKSA9PiB0aGlzLmhpZ2hWYWx1ZSAhPSBudWxsID8geFNjYWxlKCh0aGlzLm9wdGlvbnMuZmxvb3IgfHwgMCkgKyB2YWx1ZS5oaWdoVmFsdWUhIC0gKCtrZXkpKSA6IDgpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCAoW18sIHZhbHVlXSkgPT4gYWdnWSh2YWx1ZS5jb3VudCkpXG4gICAgICAuYXR0cihcImZpbGxcIiwgKFtfLCB2YWx1ZV0pID0+IGNvbG9yKHRoaXMubW9kZSA9PT0gXCJpbnRlcmFjdGlvblwiID8gdmFsdWUubWF4SW5kZXghIDogdmFsdWUuZGF0ZS5nZXRUaW1lKCkpKVxuICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgKFtfLCB2YWx1ZV0pID0+IHZhbHVlLmRhdGUuZ2V0VGltZSgpID49IHRoaXMub2xkTWF4VGltZT8uZ2V0VGltZSgpISA/IDIgOiAwKVxuICAgICAgLmF0dHIoXCJzdHJva2UtZGFzaGFycmF5XCIsIChbXywgdmFsdWVdKSA9PiB2YWx1ZS5kYXRlLmdldFRpbWUoKSA9PT0gdGhpcy5vbGRNYXhUaW1lPy5nZXRUaW1lKCkgPyBcIjQgMVwiIDogXCIwIDBcIilcbiAgICAgIC5vbihcImNsaWNrXCIsIChfLCBkKSA9PiB7XG4gICAgICAgIHRoaXMudmFsdWUgPSBkWzBdXG4gICAgICAgIGlmIChkWzFdLmhpZ2hWYWx1ZSAhPSBudWxsICYmIHRoaXMuaGlnaFZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmhpZ2hWYWx1ZSA9IGRbMV0uaGlnaFZhbHVlXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vblVzZXJDaGFuZ2VFbmQoe1xuICAgICAgICAgIHZhbHVlOiBkWzBdLFxuICAgICAgICAgIGhpZ2hWYWx1ZTogdGhpcy5oaWdoVmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgIHBvaW50ZXJUeXBlOiAxXG4gICAgICAgIH0sIFwiYWdncmVnYXRlLXJlY3QtY2xpY2tcIilcbiAgICAgIH0pXG4gICAgICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKGUsIGQpIHtcbiAgICAgICAgY29uc3QgeyBjbGllbnRYOiB4LCBjbGllbnRZOiB5IH0gPSBlXG5cbiAgICAgICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwcm92ZW5hbmNlLXdpZGdldHNcIiwge1xuICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgaWQ6IHNlbGYuaWQsXG4gICAgICAgICAgICB3aWRnZXQ6IHNlbGYuaGlnaFZhbHVlICE9IG51bGwgPyBcInJhbmdlLXNsaWRlclwiIDogXCJzbGlkZXJcIixcbiAgICAgICAgICAgIG1vZGU6IHNlbGYubW9kZSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uOiBcImFnZ3JlZ2F0ZS1yZWN0LW1vdXNlb3ZlclwiLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBsb3dWYWx1ZTogZFswXSxcbiAgICAgICAgICAgICAgLi4uZFsxXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSkpXG5cbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJvcGFjaXR5XCIsIDAuNSlcblxuICAgICAgICB0b29sdGlwXG4gICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAxKVxuICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJibG9ja1wiKVxuICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwgYCR7eCArIDEwfXB4YClcbiAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgYCR7eSArIDEwfXB4YClcbiAgICAgICAgICAuc2VsZWN0KFwiZGl2XCIpXG4gICAgICAgICAgLmh0bWwoXG4gICAgICAgICAgICBgTGFiZWw6ICR7c2VsZi5lbD8ubmF0aXZlRWxlbWVudD8uZGF0YXNldD8ubGFiZWwgfHwgc2VsZi5pZH0gPGJyIC8+YCArXG4gICAgICAgICAgICBgU2VsZWN0ZWQgJHtkWzFdLmhpZ2hWYWx1ZSA9PSBudWxsID8gYHZhbHVlOiAke2RbMF19YCA6IGByYW5nZTogWyR7ZFswXX0sICR7ZFsxXS5oaWdoVmFsdWV9XWB9IDxiciAvPmAgK1xuICAgICAgICAgICAgYCMgdGltZXMgc2VsZWN0ZWQ6ICR7ZFsxXS5jb3VudH0gPGJyIC8+YCArXG4gICAgICAgICAgICBgTGFzdCBzZWxlY3RlZCBhdDogJHtkWzFdLmRhdGUudG9Mb2NhbGVTdHJpbmcoKX0gPGJyIC8+YCArXG4gICAgICAgICAgICBgJHtzdWZmaXhlZChkWzFdLm1heEluZGV4ISl9LyR7c3VmZml4ZWQoc2VsZi5kYXRhLmxlbmd0aCAtIDEpfSBzZWxlY3Rpb25gXG4gICAgICAgICAgKVxuICAgICAgfSlcbiAgICAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJvcGFjaXR5XCIsIDEpXG4gICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG4gICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIilcbiAgICAgIH0pXG5cbiAgICBsZXQgZmlsdGVyZWQgPSBmYWxzZVxuXG4gICAgaWYgKHRoaXMuZmlsdGVyU3RhcnQgfHwgdGhpcy5maWx0ZXJFbmQpIHtcbiAgICAgIGZpbHRlcmVkID0gdHJ1ZVxuICAgICAgZGF0YSA9IGRhdGEucmVkdWNlPFRpbWVTdGFtcGVkVmFsdWVzW10+KChhY2MsIHYsIGkpID0+IHtcbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJpbnRlcmFjdGlvblwiKSB7XG4gICAgICAgICAgaWYgKGkgPj0gKHRoaXMuZmlsdGVyU3RhcnQgYXMgbnVtYmVyKSAmJiBpIDw9ICh0aGlzLmZpbHRlckVuZCBhcyBudW1iZXIpKVxuICAgICAgICAgICAgYWNjLnB1c2goe1xuICAgICAgICAgICAgICAuLi52LFxuICAgICAgICAgICAgICBhY3R1YWxJbmRleDogaVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodi50aW1lc3RhbXAgPj0gKHRoaXMuZmlsdGVyU3RhcnQgYXMgRGF0ZSkgJiYgdi50aW1lc3RhbXAgPD0gKHRoaXMuZmlsdGVyRW5kIGFzIERhdGUpKVxuICAgICAgICAgICAgYWNjLnB1c2godilcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjXG4gICAgICB9LCBbXSlcbiAgICAgIHkuZG9tYWluKFt0aGlzLmZpbHRlclN0YXJ0ISwgdGhpcy5maWx0ZXJFbmQhXSlcbiAgICB9XG5cbiAgICBjb25zdCBsaW5lID0gZDMubGluZTxUaW1lU3RhbXBlZFZhbHVlcz4oKVxuICAgICAgLngoZCA9PiB4U2NhbGUoZC52YWx1ZVtpbmRleF0pKVxuICAgICAgLnkoKGQsIGkpID0+IHkodGhpcy5tb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBmaWx0ZXJlZCA/IGQuYWN0dWFsSW5kZXggPz8gaSA6IGkgOiBkLnRpbWVzdGFtcCkpXG5cbiAgICBwU3ZnXG4gICAgICAuc2VsZWN0KFwiZy5ib2R5XCIpXG4gICAgICAuc2VsZWN0QWxsKGAubGluZS0ke2luZGV4fWApXG4gICAgICAuZGF0YShbZGF0YV0pXG4gICAgICAuam9pbihcInBhdGhcIilcbiAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgIC5kdXJhdGlvbigyNTApXG4gICAgICAuYXR0cihcImNsYXNzXCIsIGBsaW5lLSR7aW5kZXh9YClcbiAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiIzQ5NTA1N1wiKVxuICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSlcbiAgICAgIC5hdHRyKFwiZFwiLCBsaW5lKVxuXG4gICAgY29uc3QgY2lyY2xlID0gcFN2Z1xuICAgICAgLnNlbGVjdChcImcuYm9keVwiKVxuICAgICAgLnNlbGVjdEFsbChgLmNpcmNsZS0ke2luZGV4fWApXG4gICAgICAuZGF0YShkYXRhKVxuICAgICAgLmpvaW4oXCJjaXJjbGVcIilcbiAgICAgIC5vbihcImNsaWNrXCIsIChfLCBkKSA9PiB7XG4gICAgICAgIHRoaXMudmFsdWUgPSBkLnZhbHVlWzBdXG4gICAgICAgIGlmICh0aGlzLmhpZ2hWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5oaWdoVmFsdWUgPSBkLnZhbHVlWzFdXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vblVzZXJDaGFuZ2VFbmQoe1xuICAgICAgICAgIHZhbHVlOiBkLnZhbHVlWzBdLFxuICAgICAgICAgIGhpZ2hWYWx1ZTogdGhpcy5oaWdoVmFsdWUgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgIHBvaW50ZXJUeXBlOiAxXG4gICAgICAgIH0sIFwidGVtcG9yYWwtY2lyY2xlLWNsaWNrXCIpXG4gICAgICB9KVxuICAgICAgLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChlLCBkKSB7XG4gICAgICAgIC8vIGNvbnN0IFt4LCB5XSA9IGQzLnBvaW50ZXIoZSlcbiAgICAgICAgY29uc3QgeyBjbGllbnRYOiB4LCBjbGllbnRZOiB5IH0gPSBlXG5cbiAgICAgICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwcm92ZW5hbmNlLXdpZGdldHNcIiwge1xuICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgaWQ6IHNlbGYuaWQsXG4gICAgICAgICAgICB3aWRnZXQ6IHNlbGYuaGlnaFZhbHVlICE9IG51bGwgPyBcInJhbmdlLXNsaWRlclwiIDogXCJzbGlkZXJcIixcbiAgICAgICAgICAgIG1vZGU6IHNlbGYubW9kZSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uOiBcInRlbXBvcmFsLWNpcmNsZS1tb3VzZW92ZXJcIixcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgLi4uZCxcbiAgICAgICAgICAgICAgaW5kZXg6IGQzLnNlbGVjdCh0aGlzKS5hdHRyKFwiZGF0YS1pbmRleFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSkpXG5cbiAgICAgICAgdG9vbHRpcFxuICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgMSlcbiAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIilcbiAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIGAke3ggKyAxMH1weGApXG4gICAgICAgICAgLnN0eWxlKFwidG9wXCIsIGAke3kgKyAxMH1weGApXG4gICAgICAgICAgLnNlbGVjdChcImRpdlwiKVxuICAgICAgICAgIC5odG1sKFxuICAgICAgICAgICAgYExhYmVsOiAke3NlbGYuZWw/Lm5hdGl2ZUVsZW1lbnQ/LmRhdGFzZXQ/LmxhYmVsIHx8IHNlbGYuaWR9IDxiciAvPmAgK1xuICAgICAgICAgICAgYFNlbGVjdGVkIHZhbHVlOiAke2QudmFsdWVbaW5kZXhdfSA8YnIgLz5gICtcbiAgICAgICAgICAgIGBTZWxlY3RlZCBhdDogJHtkLnRpbWVzdGFtcC50b0xvY2FsZVN0cmluZygpfSA8YnIgLz5gICtcbiAgICAgICAgICAgIGAke3N1ZmZpeGVkKCtkMy5zZWxlY3QodGhpcykuYXR0cihcImRhdGEtaW5kZXhcIikpfS8ke3N1ZmZpeGVkKHNlbGYuZGF0YS5sZW5ndGggLSAxKX0gc2VsZWN0aW9uIDxiciAvPmBcbiAgICAgICAgICApXG4gICAgICB9KVxuICAgICAgLm9uKFwibW91c2VvdXRcIiwgKCkgPT4ge1xuICAgICAgICB0b29sdGlwXG4gICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpXG4gICAgICB9KVxuXG4gICAgY2lyY2xlXG4gICAgICAuc2VsZWN0Q2hpbGQoKGQsIGkpID0+IGAuJHtpfWAgYXMgYW55KVxuICAgICAgLnJlbW92ZSgpXG5cbiAgICBjaXJjbGVcbiAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgIC5kdXJhdGlvbigyNTApXG4gICAgICAuYXR0cihcImNsYXNzXCIsIGBjaXJjbGUtJHtpbmRleH1gKVxuICAgICAgLmF0dHIoXCJkYXRhLWluZGV4XCIsIChfLCBpKSA9PiBpKVxuICAgICAgLmF0dHIoXCJjeFwiLCBkID0+IHhTY2FsZShkLnZhbHVlW2luZGV4XSkpXG4gICAgICAuYXR0cihcImN5XCIsIChkLCBpKSA9PiB5KHRoaXMubW9kZSA9PT0gXCJpbnRlcmFjdGlvblwiID8gZmlsdGVyZWQgPyBkLmFjdHVhbEluZGV4ID8/IGkgOiBpIDogZC50aW1lc3RhbXApKVxuICAgICAgLmF0dHIoXCJyXCIsIDQpXG4gICAgICAuYXR0cihcImZpbGxcIiwgKGQsIGkpID0+IGNvbG9yKHRoaXMubW9kZSA9PT0gXCJpbnRlcmFjdGlvblwiID8gZmlsdGVyZWQgPyBkLmFjdHVhbEluZGV4ID8/IGkgOiBpIDogZC50aW1lc3RhbXApKVxuICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCIjNDk1MDU3XCIpXG4gICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgLnN0eWxlKFwiY3Vyc29yXCIsIFwicG9pbnRlclwiKVxuICB9XG5cbiAgX3Zpc3VhbGl6ZSgpIHtcbiAgICBpZiAoIXRoaXMudmlzdWFsaXplKVxuICAgICAgcmV0dXJuXG5cbiAgICBjb25zdCBwU3ZnID0gZDMuc2VsZWN0KHRoaXMucHJvdmVuYW5jZVN2Zy5uYXRpdmVFbGVtZW50KVxuICAgIGNvbnN0IGFTdmcgPSBkMy5zZWxlY3QodGhpcy5hZ2dyZWdhdGVTdmcubmF0aXZlRWxlbWVudClcblxuICAgIGNvbnN0IHNsaWRlck5vZGUgPSBkMy5zZWxlY3QodGhpcy53cmFwcGVyLm5hdGl2ZUVsZW1lbnQpLnNlbGVjdChcIm5neC1zbGlkZXJcIikubm9kZSgpIGFzIGFueVxuXG4gICAgLy8gRml4IGltcGxlbWVudGF0aW9uIC0gR2V0IGludGVnZXIgd2lkdGhcbiAgICBjb25zdCBzbGlkZXJXaWR0aCA9IHNsaWRlck5vZGUub2Zmc2V0V2lkdGggLSAyICogNFxuXG4gICAgLy8gZ2V0IG1hcmdpbi10b3Agb2Ygbm9kZVxuICAgIGlmICghdGhpcy5zbGlkZXJIZWlnaHQpIHtcbiAgICAgIHRoaXMuc2xpZGVySGVpZ2h0ID0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZShzbGlkZXJOb2RlKS5tYXJnaW5Ub3ApXG4gICAgfVxuXG4gICAgY29uc3QgcEJ1dHRvbldpZHRoID0gdGhpcy5wQnV0dG9uLm5hdGl2ZUVsZW1lbnQub2Zmc2V0V2lkdGhcblxuICAgIHBTdmdcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHNsaWRlcldpZHRoICsgTElORV9DSVJDTEVfRElBTUVURVIpXG4gICAgICAuYXR0cignaGVpZ2h0JywgREVGQVVMVF9IRUlHSFQgKyBMSU5FX0NJUkNMRV9ESUFNRVRFUilcbiAgICAgIC5zdHlsZSgndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVgoLTEuMjVyZW0pJylcbiAgICAgIC5zdHlsZSgnd2lkdGgnLCBgY2FsYygke3BCdXR0b25XaWR0aH1weCArIDFyZW0gKyAke3NsaWRlcldpZHRoICsgTElORV9DSVJDTEVfRElBTUVURVJ9cHgpYClcblxuICAgIHBTdmdcbiAgICAgIC5zZWxlY3QoXCJnLmJvZHlcIilcbiAgICAgIC5hdHRyKFwic3R5bGVcIiwgYHRyYW5zZm9ybTogdHJhbnNsYXRlKGNhbGMoJHtwQnV0dG9uV2lkdGh9cHggKyAxcmVtICsgJHtMSU5FX0NJUkNMRV9ESUFNRVRFUiAvIDJ9cHgpLCR7MSArIExJTkVfQ0lSQ0xFX0RJQU1FVEVSIC8gMn1weClgKVxuXG4gICAgYVN2Z1xuICAgICAgLmF0dHIoJ3dpZHRoJywgc2xpZGVyV2lkdGggKyBMSU5FX0NJUkNMRV9ESUFNRVRFUilcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCB0aGlzLnNsaWRlckhlaWdodClcbiAgICAgIC5zdHlsZShcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlWChjYWxjKDFyZW0gKyAke3BCdXR0b25XaWR0aH1weCkpYClcblxuICAgIGNvbnN0IHggPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgICAuZG9tYWluKFt0aGlzLm9wdGlvbnMuZmxvb3IhLCB0aGlzLm9wdGlvbnMuY2VpbCFdKVxuICAgICAgLnJhbmdlKFswLCBwYXJzZUludChwU3ZnLmF0dHIoJ3dpZHRoJykpIC0gTElORV9DSVJDTEVfRElBTUVURVJdKVxuXG4gICAgY29uc3QgeSA9IHRoaXMubW9kZSA9PT0gXCJpbnRlcmFjdGlvblwiID9cbiAgICAgIGQzLnNjYWxlTGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgdGhpcy5kYXRhLmxlbmd0aCAtIDFdKVxuICAgICAgICAucmFuZ2UoWzAsIERFRkFVTFRfSEVJR0hUXSlcbiAgICAgIDpcbiAgICAgIGQzLnNjYWxlVGltZSgpXG4gICAgICAgIC5kb21haW4oW3RoaXMubWluVGltZSEsIHRoaXMubWF4VGltZSFdKVxuICAgICAgICAucmFuZ2UoWzAsIERFRkFVTFRfSEVJR0hUXSlcblxuICAgIGNvbnN0IHlBeGlzID0gZDMuYXhpc0xlZnQoeS5uaWNlKCkpXG5cbiAgICBpZiAodGhpcy5tb2RlICE9PSBcImludGVyYWN0aW9uXCIpXG4gICAgICB5QXhpcy50aWNrVmFsdWVzKFt0aGlzLm1pblRpbWUhLCB0aGlzLm1heFRpbWUhXSkudGlja0Zvcm1hdCgoXywgaSkgPT4gaSA9PT0gMCA/IFwidD0wXCIgOiBcIm5vd1wiKVxuXG4gICAgY29uc3QgYXhpcyA9IHBTdmdcbiAgICAgIC5zZWxlY3QoXCIuYXhpc1wiKVxuXG4gICAgYXhpc1xuICAgICAgLnNlbGVjdChcInRleHRcIilcbiAgICAgIC5hdHRyKFwieFwiLCAtKERFRkFVTFRfSEVJR0hUICsgTElORV9DSVJDTEVfRElBTUVURVIpIC8gMilcblxuICAgIGF4aXNcbiAgICAgIC5zdHlsZShcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlKGNhbGMoJHtwQnV0dG9uV2lkdGh9cHggKyAxcmVtICsgJHtMSU5FX0NJUkNMRV9ESUFNRVRFUiAvIDJ9cHgpLCR7MSArIExJTkVfQ0lSQ0xFX0RJQU1FVEVSIC8gMn1weClgKVxuICAgICAgLmNhbGwoeUF4aXMgYXMgYW55KVxuXG4gICAgdGhpcy5icnVzaCA9IGQzXG4gICAgICAuYnJ1c2hZKClcbiAgICAgIC5leHRlbnQoW1stY29udmVydFJlbVRvUGl4ZWxzKDIpLCAwXSwgWzAsIERFRkFVTFRfSEVJR0hUICsgTElORV9DSVJDTEVfRElBTUVURVJdXSlcbiAgICAgIC5vbihcImVuZFwiLCAoZCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbjogbnVtYmVyW10gPSBkLnNlbGVjdGlvblxuICAgICAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICAgICAgdGhpcy5maWx0ZXJTdGFydCA9IHkuaW52ZXJ0KHNlbGVjdGlvblswXSlcbiAgICAgICAgICB0aGlzLmZpbHRlckVuZCA9IHkuaW52ZXJ0KHNlbGVjdGlvblsxXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmZpbHRlclN0YXJ0ID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5maWx0ZXJFbmQgPSB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicHJvdmVuYW5jZS13aWRnZXRzXCIsIHtcbiAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgICAgICAgd2lkZ2V0OiB0aGlzLmhpZ2hWYWx1ZSAhPSBudWxsID8gXCJyYW5nZS1zbGlkZXJcIiA6IFwic2xpZGVyXCIsXG4gICAgICAgICAgICBtb2RlOiB0aGlzLm1vZGUsXG4gICAgICAgICAgICBpbnRlcmFjdGlvbjogXCJicnVzaC1lbmRcIixcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgc2VsZWN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KSlcblxuICAgICAgICB0aGlzLmRyYXcoeCwgeSwgMCwgdGhpcy5kYXRhKVxuICAgICAgICBpZiAodGhpcy5oaWdoVmFsdWUgIT0gbnVsbClcbiAgICAgICAgICB0aGlzLmRyYXcoeCwgeSwgMSwgdGhpcy5kYXRhKVxuICAgICAgfSlcblxuICAgIGF4aXMuY2FsbCh0aGlzLmJydXNoIGFzIGFueSlcblxuICAgIHRoaXMuZHJhdyh4LCB5LCAwLCB0aGlzLmRhdGEpXG5cbiAgICBpZiAodGhpcy5oaWdoVmFsdWUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5kcmF3KHgsIHksIDEsIHRoaXMuZGF0YSlcbiAgICB9XG5cbiAgICBheGlzLnNlbGVjdEFsbChcInJlY3RcIikucmFpc2UoKVxuICB9XG5cbiAgb25Vc2VyQ2hhbmdlRW5kKGNoYW5nZTogQ2hhbmdlQ29udGV4dCwgaW50ZXJhY3Rpb24gPSBcInVzZXItY2hhbmdlLWVuZFwiKSB7XG4gICAgdGhpcy51c2VyQ2hhbmdlRW5kLmVtaXQoY2hhbmdlKTtcbiAgICB0aGlzLnNlbGVjdGVkQ2hhbmdlPy5lbWl0KGNoYW5nZSlcbiAgICBjb25zdCB2YWx1ZSA9IGNoYW5nZS5oaWdoVmFsdWUgIT0gbnVsbCA/IFtjaGFuZ2UudmFsdWUsIGNoYW5nZS5oaWdoVmFsdWVdIDogW2NoYW5nZS52YWx1ZV07XG4gICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKVxuICAgIGNvbnN0IG5ld0VudHJ5ID0geyB2YWx1ZSwgdGltZXN0YW1wIH1cblxuICAgIGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicHJvdmVuYW5jZS13aWRnZXRzXCIsIHtcbiAgICAgIGRldGFpbDoge1xuICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgd2lkZ2V0OiB0aGlzLmhpZ2hWYWx1ZSAhPSBudWxsID8gXCJyYW5nZS1zbGlkZXJcIiA6IFwic2xpZGVyXCIsXG4gICAgICAgIG1vZGU6IHRoaXMubW9kZSxcbiAgICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAuLi5uZXdFbnRyeVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkpXG5cbiAgICBpZiAodGhpcy5mcmVlemUpXG4gICAgICByZXR1cm5cblxuICAgIGNvbnN0IGRhdGFFbnRyeSA9IFtuZXdFbnRyeV1cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInRpbWVcIilcbiAgICAgIGRhdGFFbnRyeS5wdXNoKG5ld0VudHJ5KVxuICAgIHRoaXMuZGF0YSA9IFtcbiAgICAgIC4uLnRoaXMuZGF0YSxcbiAgICAgIC4uLmRhdGFFbnRyeVxuICAgIF1cblxuICAgIHRoaXMuYWRkQnVja2V0KHRpbWVzdGFtcCwgY2hhbmdlLnZhbHVlLCBjaGFuZ2UuaGlnaFZhbHVlKVxuXG4gICAgaWYgKCF0aGlzLm1pblRpbWUpXG4gICAgICB0aGlzLm1pblRpbWUgPSB0aW1lc3RhbXBcbiAgICB0aGlzLm9sZE1heFRpbWUgPSB0aGlzLm1heFRpbWUgfHwgdGhpcy5taW5UaW1lXG4gICAgdGhpcy5tYXhUaW1lID0gdGltZXN0YW1wXG5cbiAgICBpZiAodGhpcy5tb2RlID09PSBcInRpbWVcIiAmJiBpc05hTih0aGlzLmludGVydmFsKSkge1xuICAgICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3QgbmV3VGltZVN0YW1wID0gbmV3IERhdGUoKVxuICAgICAgICB0aGlzLm9sZE1heFRpbWUgPSB0aGlzLm1heFRpbWVcbiAgICAgICAgdGhpcy5tYXhUaW1lID0gbmV3VGltZVN0YW1wXG4gICAgICAgIGNvbnN0IGxhc3RFbnRyeSA9IHRoaXMuZGF0YS5zbGljZSgtMSlbMF1cbiAgICAgICAgdGhpcy5kYXRhID0gW1xuICAgICAgICAgIC4uLnRoaXMuZGF0YS5zbGljZSgwLCAtMSksXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFsdWU6IGxhc3RFbnRyeS52YWx1ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3VGltZVN0YW1wXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICAgIHRoaXMuX3Zpc3VhbGl6ZSgpXG4gICAgICB9LCAxMDAwKSBhcyBhbnlcbiAgICB9XG5cbiAgICB0aGlzLnByb3ZlbmFuY2VDaGFuZ2U/LmVtaXQoe1xuICAgICAgZGF0YTogdGhpcy5kYXRhLFxuICAgICAgbWluVGltZTogdGhpcy5taW5UaW1lLFxuICAgICAgb2xkTWF4VGltZTogdGhpcy5vbGRNYXhUaW1lLFxuICAgICAgbWF4VGltZTogdGhpcy5tYXhUaW1lLFxuICAgICAgbWF4RnJlcXVlbmN5OiB0aGlzLm1heEZyZXF1ZW5jeSxcbiAgICAgIGJ1Y2tldHM6IHRoaXMuYnVja2V0cyxcbiAgICAgIHZhbHVlOiB0aGlzLnZhbHVlLFxuICAgICAgaGlnaFZhbHVlOiB0aGlzLmhpZ2hWYWx1ZVxuICAgIH0pXG4gICAgdGhpcy5fdmlzdWFsaXplKClcbiAgfVxuXG4gIGhhbmRsZVByb3ZlbmFuY2VCdXR0b25DbGljayhldmVudDogTW91c2VFdmVudCwgdGFyZ2V0OiBhbnksIG9wOiBPdmVybGF5UGFuZWwpIHtcbiAgICBkaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInByb3ZlbmFuY2Utd2lkZ2V0c1wiLCB7XG4gICAgICBkZXRhaWw6IHtcbiAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgIHdpZGdldDogdGhpcy5oaWdoVmFsdWUgPyBcInJhbmdlLXNsaWRlclwiIDogXCJzbGlkZXJcIixcbiAgICAgICAgbW9kZTogdGhpcy5tb2RlLFxuICAgICAgICBpbnRlcmFjdGlvbjogXCJwcm92ZW5hbmNlLWJ1dHRvbi1jbGlja1wiLFxuICAgICAgICBpbml0aWFsUHJvdmVuYW5jZU1vZGU6IG9wLm92ZXJsYXlWaXNpYmxlID8gXCJ0ZW1wb3JhbFwiIDogXCJhZ2dyZWdhdGVcIlxuICAgICAgfVxuICAgIH0pKVxuICAgIG9wLnRvZ2dsZShldmVudCwgdGFyZ2V0KVxuICB9XG59XG5cbiIsIjxwLW92ZXJsYXlQYW5lbFxuICAjb3BcbiAgW2Rpc21pc3NhYmxlXT1cImZhbHNlXCJcbj5cbiAgPHN2ZyAjcHJvdmVuYW5jZSBjbGFzcz1cInNsaWRlci1wcm92ZW5hbmNlXCI+XG4gICAgPGcgY2xhc3M9XCJheGlzXCI+XG4gICAgICA8dGV4dCBcbiAgICAgICAgdHJhbnNmb3JtPVwicm90YXRlKC05MClcIiBcbiAgICAgICAgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiBcbiAgICAgICAgeT1cIi0zM1wiIFxuICAgICAgICBmaWxsPVwiYmxhY2tcIlxuICAgICAgICBbYXR0ci5mb250LXNpemVdPVwiJzFyZW0nXCJcbiAgICAgID5cbiAgICAgICAge3ttb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBcIlNlcXVlbmNlIG9mIEludGVyYWN0aW9uICgwID0gZmlyc3QpXCIgOiBcInRpbWVcIn19XG4gICAgICA8L3RleHQ+XG4gICAgPC9nPlxuICAgIDxnIGNsYXNzPVwiYm9keVwiPjwvZz5cbiAgPC9zdmc+XG48L3Atb3ZlcmxheVBhbmVsPlxuPGRpdlxuICAjd3JhcHBlclxuICBjbGFzcz1cImZsZXggZmxleC1yb3cgZ2FwLTMgY3VzdG9tLXNsaWRlclwiXG4+XG4gIDxidXR0b25cbiAgICAqbmdJZj1cInZpc3VhbGl6ZVwiXG4gICAgcEJ1dHRvblxuICAgICNwcm92ZW5hbmNlQnV0dG9uXG4gICAgdHlwZT1cImJ1dHRvblwiXG4gICAgY2xhc3M9XCJwLWJ1dHRvbi1oZWxwIHAtYnV0dG9uLXRleHRcIlxuICAgIChjbGljayk9XCJoYW5kbGVQcm92ZW5hbmNlQnV0dG9uQ2xpY2soJGV2ZW50LCB3cmFwcGVyLCBvcClcIlxuICAgIFtkaXNhYmxlZF09XCJkYXRhLmxlbmd0aCA9PT0gMVwiXG4gICAgW25nU3R5bGVdPVwieyAncGFkZGluZyc6IDAsICdhbGlnbi1zZWxmJzogJ2NlbnRlcicsICdoZWlnaHQnOiAnbWluLWNvbnRlbnQnLCAndmlzaWJpbGl0eSc6IHZpc3VhbGl6ZSA/ICd2aXNpYmxlJyA6ICdoaWRkZW4nfVwiXG4gID5cbiAgICA8cHJvdmVuYW5jZS1pY29uIFxuICAgICAgW2ljb25dPVwiZGF0YS5sZW5ndGggPT09IDEgPyAnZGlzYWJsZWQnIDogb3Aub3ZlcmxheVZpc2libGUgPyAndGVtcG9yYWwnIDogJ2FnZ3JlZ2F0ZSdcIlxuICAgID48L3Byb3ZlbmFuY2UtaWNvbj5cbiAgPC9idXR0b24+XG4gIDxzdmcgI2FnZ3JlZ2F0ZSBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIiB3aWR0aD1cIjBcIiBoZWlnaHQ9XCIwXCI+XG4gICAgPGc+PC9nPlxuICA8L3N2Zz5cbiAgPG5neC1zbGlkZXJcbiAgWyh2YWx1ZSldPVwidmFsdWVcIlxuICBbKGhpZ2hWYWx1ZSldPVwiaGlnaFZhbHVlXCJcbiAgW29wdGlvbnNdPVwib3B0aW9uc1wiXG4gICh1c2VyQ2hhbmdlKT1cInVzZXJDaGFuZ2VcIlxuICAodXNlckNoYW5nZUVuZCk9XCJvblVzZXJDaGFuZ2VFbmQoJGV2ZW50KVwiXG4gICh1c2VyQ2hhbmdlU3RhcnQpPVwidXNlckNoYW5nZVN0YXJ0XCJcbiAgKHZhbHVlQ2hhbmdlKT1cInZhbHVlQ2hhbmdlXCJcbiAgKGhpZ2hWYWx1ZUNoYW5nZSk9XCJoaWdoVmFsdWVDaGFuZ2VcIlxuICAvPlxuPC9kaXY+Il19