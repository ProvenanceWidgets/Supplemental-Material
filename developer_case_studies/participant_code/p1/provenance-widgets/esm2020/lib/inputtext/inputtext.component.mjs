import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import * as d3 from "d3";
import { AutoComplete } from "primeng/autocomplete";
import { convertRemToPixels, getTooltip, interpolateLightOranges, suffixed } from "../utils";
import { DEFAULT_HEIGHT, LINE_CIRCLE_DIAMETER, MODE } from "../constants";
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "primeng/overlaypanel";
import * as i3 from "primeng/api";
import * as i4 from "primeng/button";
import * as i5 from "@angular/forms";
import * as i6 from "primeng/autocomplete";
import * as i7 from "../icon/icon.component";
export class InputtextComponent extends AutoComplete {
    constructor() {
        super(...arguments);
        this.mode = MODE;
        this.id = "";
        this.visualize = true;
        this.freeze = false;
        this.valueChange = new EventEmitter();
        this.provenanceChange = new EventEmitter();
        this.data = [];
        this.dictionary = {};
        this.query = "";
        this.minTime = undefined;
        this.oldMaxTime = undefined;
        this.maxTime = undefined;
        this.minMsBetweenInteractions = Infinity;
        this.interval = NaN;
        this.hasUserInteracted = false;
        this.tooltip = getTooltip();
    }
    get provenance() {
        return this._provenance;
    }
    set provenance(value) {
        if (this._provenance && value?.revalidate) {
            this.setProvenance(value);
            this._visualize();
            return;
        }
        this._provenance = value;
    }
    setProvenance(provenance) {
        this.data = provenance.data;
        if (!provenance.revalidate) {
            this.dictionary = provenance.dictionary;
            this.minTime = provenance.minTime;
            this.oldMaxTime = provenance.oldMaxTime;
            this.maxTime = provenance.maxTime;
            this.minMsBetweenInteractions = provenance.minMsBetweenInteractions;
        }
        else {
            this.minTime = this.data[0].timestamp;
            this.maxTime = this.data[this.data.length - 1].timestamp;
            this.oldMaxTime = this.data.length > 1 ? this.data[this.data.length - 2].timestamp : this.data[0].timestamp;
            this.minMsBetweenInteractions = Math.min(Infinity, (+this.maxTime) - (+this.oldMaxTime));
            this.dictionary = this.data.reduce((acc, { value, timestamp }, i) => {
                acc[value] = {
                    count: (acc[value]?.count || 0) + 1,
                    timestamp,
                    maxIndex: i
                };
                return acc;
            }, {});
        }
    }
    getProvenance() {
        return {
            data: this.data,
            dictionary: this.dictionary,
            minTime: this.minTime,
            oldMaxTime: this.oldMaxTime,
            maxTime: this.maxTime,
            minMsBetweenInteractions: this.minMsBetweenInteractions
        };
    }
    ngOnInit() {
        this.tooltip = getTooltip();
        if (this.provenance?.data?.length) {
            this.setProvenance(this.provenance);
            this.value = this.data.slice(-1)[0].value;
            this.hasUserInteracted = this.data.length > 0;
            return;
        }
        if (this.value) {
            const value = this.field ? this.value[this.field] : this.value;
            const timestamp = new Date();
            this.minTime = timestamp;
            this.oldMaxTime = timestamp;
            this.maxTime = timestamp;
            this.data = [{ value, timestamp }];
            this.dictionary[value] = {
                count: 1,
                timestamp,
                maxIndex: 0
            };
        }
    }
    ngAfterViewInit() {
        if (this.provenance?.data?.length) {
            this._visualize();
        }
    }
    ngOnDestroy() {
        super.ngOnDestroy();
        clearInterval(this.interval);
    }
    handleKeyUp(event) {
        if (event.key === "Enter") {
            this.handleEnter("enter");
        }
    }
    handleEnter(eventType) {
        this.tooltip.style("opacity", 0).style("display", "none");
        const value = this.wrapper.nativeElement.querySelector("input")?.value;
        if (!value && value !== '')
            return;
        this.value = value;
        this.valueChange.emit(value);
        const timestamp = new Date();
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: this.id,
                widget: "inputtext",
                mode: this.mode,
                interaction: eventType,
                data: {
                    value,
                    timestamp
                }
            }
        }));
        if (this.freeze)
            return;
        if (!this.minTime)
            this.minTime = timestamp;
        if (this.maxTime)
            this.minMsBetweenInteractions = Math.min(this.minMsBetweenInteractions, (+timestamp) - (+this.maxTime));
        this.oldMaxTime = this.maxTime || timestamp;
        this.maxTime = timestamp;
        const newEntry = { value, timestamp };
        const dataEntry = [newEntry];
        if (this.mode === "time")
            dataEntry.push(newEntry);
        this.data = [
            ...this.data,
            ...dataEntry
        ];
        this.dictionary[value] = {
            count: (this.dictionary[value]?.count || 0) + 1,
            timestamp,
            maxIndex: this.data.length - 1
        };
        if (this.mode === "time" && isNaN(this.interval)) {
            this.interval = setInterval(() => {
                const newTimeStamp = new Date();
                this.oldMaxTime = this.maxTime || newTimeStamp;
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
        this.hasUserInteracted = true;
        const provenance = this.getProvenance();
        this.provenanceChange?.emit(provenance);
        this._visualize();
    }
    _visualize() {
        if (!this.visualize)
            return;
        const self = this;
        const width = this.wrapper.nativeElement.querySelector("input").offsetWidth;
        const defaultTextHeight = parseInt(getComputedStyle(document.body).getPropertyValue("font-size")) || 13;
        const timeDiff = (+this.maxTime) - (+this.minTime);
        const height = Math.max(defaultTextHeight * (this.mode === "interaction" ? this.data.length :
            timeDiff / this.minMsBetweenInteractions), DEFAULT_HEIGHT);
        const buttonWidth = this.button.nativeElement.offsetWidth;
        const FLEX_GAP = convertRemToPixels(0.5);
        const svg = d3
            .select(this.svg.nativeElement)
            .attr("height", height + defaultTextHeight)
            .attr("width", `${width + buttonWidth + FLEX_GAP}px`);
        const svgg = svg
            .select("g.body")
            .attr("transform", `translate(${buttonWidth + FLEX_GAP}, ${defaultTextHeight / 2})`);
        const y = this.mode === "interaction" ?
            d3.scaleLinear()
                .domain([0, this.data.length - 1])
                .range([0, height]) :
            d3.scaleTime()
                .domain([this.minTime, this.maxTime])
                .range([0, height]);
        const yAxis = d3.axisLeft(y.nice());
        if (this.mode !== "interaction")
            yAxis.tickValues([this.minTime, this.maxTime]).tickFormat((_, i) => i === 0 ? "t=0" : "now");
        const axisG = d3.select(this.svg.nativeElement).select("g.axis");
        axisG
            .select("text")
            .attr("x", -(DEFAULT_HEIGHT + defaultTextHeight) / 2);
        axisG
            .attr("transform", `translate(${buttonWidth + FLEX_GAP}, ${defaultTextHeight / 2})`)
            .call(yAxis);
        const line = d3.line()
            .x(LINE_CIRCLE_DIAMETER / 2)
            .y((d, i) => y(this.mode === "interaction" ? i : d.timestamp));
        const color = d3
            .scaleSequential(interpolateLightOranges)
            .domain(this.mode === "interaction" ?
            [0, this.data.length - 1] :
            [this.minTime, this.maxTime]);
        svgg
            .selectAll("path")
            .data([this.data])
            .join("path")
            .transition()
            .duration(250)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2);
        svgg
            .selectAll("circle")
            .data(this.data)
            .join("circle")
            .attr("psvgi", (_, i) => i)
            .on("click", (_, d) => {
            this.value = d.value;
            this.wrapper.nativeElement.querySelector("input").value = d.value;
            this.handleEnter("click");
        })
            .on("mouseover", function (e, d) {
            const { clientX: x, clientY: y } = e;
            self.tooltip
                .style("opacity", 1)
                .style("display", "block")
                .style("left", `${x + 10}px`)
                .style("top", `${y + 10}px`)
                .select("div")
                .html(`
                        Label: ${self.el?.nativeElement?.dataset?.label || self.id} <br />
                        ${suffixed(+d3.select(this).attr("psvgi"))}/${suffixed(self.data.length - 1)} search <br />
                        <span>Searched value: ${d.value}</span>
                        <br />
                        <span>Searched at: ${d.timestamp.toLocaleString()}</span>
                    `);
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: self.id,
                    widget: "inputtext",
                    mode: self.mode,
                    interaction: "hover",
                    data: {
                        value: d.value,
                        timestamp: d.timestamp,
                        index: d3.select(this).attr("psvgi")
                    }
                }
            }));
        })
            .on("mouseout", () => self.tooltip.style("opacity", 0).style("display", "none"))
            .transition()
            .duration(250)
            .attr("cx", LINE_CIRCLE_DIAMETER / 2)
            .attr("cy", (d, i) => y(this.mode === "interaction" ? i : d.timestamp))
            .attr("r", LINE_CIRCLE_DIAMETER / 2)
            .attr("fill", (d, i) => color(this.mode === "interaction" ? i : d.timestamp))
            .attr("stroke", "black")
            .style("cursor", "pointer");
        svgg
            .selectAll("text")
            .data(this.data)
            .join("text")
            .transition()
            .duration(250)
            .attr("x", LINE_CIRCLE_DIAMETER + 4)
            .attr("y", (d, i) => y(this.mode === "interaction" ? i : d.timestamp) + defaultTextHeight / 4)
            .text((d) => d.value || "<empty>");
    }
    handleSearch(event) {
        this.query = event.query;
    }
    getSuggestions() {
        if (!this.wrapper?.nativeElement)
            return [];
        const width = this.wrapper.nativeElement.querySelector("input").offsetWidth - convertRemToPixels(2.5);
        const resultSet = Object.entries(this.dictionary)
            .filter(([key]) => key.includes(this.query))
            .sort(([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime());
        const timeDomain = d3.extent(resultSet, ([, { timestamp }]) => timestamp);
        const interactionDomain = d3.extent(resultSet, ([, { maxIndex }]) => maxIndex);
        const countDomain = [0, d3.max(resultSet, ([, { count }]) => count)];
        const x = d3.scaleLinear().domain(countDomain).range([0, width]);
        const color = d3
            .scaleSequential(interpolateLightOranges)
            .domain(this.mode === "interaction" ? interactionDomain : timeDomain);
        return resultSet.map(([key, { count, timestamp, maxIndex }]) => ({
            label: key,
            count,
            timestamp,
            color: color(this.mode === "interaction" ? maxIndex : timestamp),
            width: x(count)
        }));
    }
    handleClear(autocomplete, event) {
        autocomplete.value = "";
        autocomplete.handleDropdownClick(event);
    }
    handleMouseOver(event, suggestion) {
        if (!this.visualize)
            return;
        const { clientX: x, clientY: y } = event;
        this.tooltip
            .style("opacity", 1)
            .style("display", "block")
            .style("left", `${x + 10}px`)
            .style("top", `${y + 10}px`)
            .select("div")
            .html(`
                <span>Label: ${this.el?.nativeElement?.dataset?.label || this.id}</span>
                <br />
                <span>Searched value: ${suggestion.label}</span>
                <br />
                <span>Last searched at: ${suggestion.timestamp.toLocaleString()}</span>
                <br />
                <span># times searched: ${suggestion.count}</span>
            `);
    }
    handleMouseOut() {
        this.tooltip.style("opacity", 0).style("display", "none");
    }
    handleProvenanceButtonClick(event, target, op) {
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: this.id,
                widget: "inputtext",
                mode: this.mode,
                interaction: "provenance-button-click",
                initialProvenanceMode: op.overlayVisible ? "temporal" : "aggregate"
            }
        }));
        op.toggle(event, target);
    }
}
InputtextComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: InputtextComponent, deps: null, target: i0.ɵɵFactoryTarget.Component });
InputtextComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: InputtextComponent, selector: "provenance-inputtext", inputs: { mode: "mode", id: "id", visualize: "visualize", freeze: "freeze", value: "value", provenance: "provenance" }, outputs: { valueChange: "valueChange", provenanceChange: "provenanceChange" }, viewQueries: [{ propertyName: "wrapper", first: true, predicate: ["wrapper"], descendants: true }, { propertyName: "svg", first: true, predicate: ["provenance"], descendants: true }, { propertyName: "button", first: true, predicate: ["provenanceButton"], descendants: true }], usesInheritance: true, ngImport: i0, template: "<p-overlayPanel\n    #op\n    [dismissable]=\"false\"\n    styleClass=\"textinput-overlay\"\n>\n    <svg #provenance class=\"inputtext-provenance\">\n        <g class=\"axis\">\n            <text\n                transform=\"rotate(-90)\"\n                text-anchor=\"middle\"\n                fill=\"black\"\n                y=\"-30\"\n                [attr.font-size]=\"'small'\"\n            >\n                {{mode === \"interaction\" ? \"Sequence of Interaction (0 = first)\" : \"time\"}}\n            </text>\n        </g>\n        <g class=\"body\"></g>\n    </svg>\n</p-overlayPanel>\n<div\n    #wrapper\n    class=\"flex flex-row gap-3\"\n>\n    <!-- <ng-content></ng-content> -->\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        #provenanceButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!hasUserInteracted\"\n        (click)=\"handleProvenanceButtonClick($event, wrapper, op)\"\n        [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n    >\n        \n    <provenance-icon \n        [icon]=\"!hasUserInteracted ? 'disabled' : op.overlayVisible ? 'temporal' : 'aggregate'\"\n    ></provenance-icon>\n   </button>\n    <p-autoComplete\n        #autocomplete\n        [appendTo]=\"'body'\"\n        [ngModel]=\"{ label: field ? value[field] : value }\"\n        [field]=\"'label'\"\n        [suggestions]=\"getSuggestions()\"\n        [overlayOptions]=\"{ appendTo: 'body' }\"\n        (completeMethod)=\"handleSearch($event)\"\n        (onFocus)=\"!autocomplete.value && autocomplete.handleDropdownClick($event)\"\n        (onClear)=\"handleClear(autocomplete, $event)\"\n        (onKeyUp)=\"handleKeyUp($event)\"\n        (onSelect)=\"handleEnter('select')\"\n        (mouseout)=\"handleMouseOut()\"\n    >\n        <ng-template let-suggestion pTemplate=\"item\">\n            <div style=\"position: relative; width: 100%;\" (mousemove)=\"handleMouseOver($event, suggestion)\" (mouseout)=\"handleMouseOut()\">\n                <svg *ngIf=\"visualize\" style=\"width: 100%; height: 100%; position: absolute\">\n                    <rect x=\"0\" y=\"0\" [attr.width]=\"suggestion.width\" [attr.fill]=\"suggestion.color\" [attr.stroke]=\"'black'\" [attr.stroke-width]=\"suggestion.timestamp >= this.oldMaxTime! ? 2 : 0\" [attr.stroke-dasharray]=\"suggestion.timestamp === this.maxTime! ? '0 0' : '4 1'\" style=\"height: 100%;\"></rect>\n                </svg>\n                <div style=\"display: flex; justify-content: space-between; position: inherit;\">\n                    <span>\n                        {{suggestion.label === \"\" ? '&lt;empty&gt;' : suggestion.label}}\n                    </span>\n                </div>\n            </div>\n        </ng-template>\n    </p-autoComplete>\n</div>", styles: ["::ng-deep .textinput-overlay>.p-overlaypanel-content{overflow-y:auto;max-height:calc(250px + 3.5rem);padding-left:0!important;padding-right:0!important}\n"], dependencies: [{ kind: "directive", type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i2.OverlayPanel, selector: "p-overlayPanel", inputs: ["dismissable", "showCloseIcon", "style", "styleClass", "appendTo", "autoZIndex", "ariaCloseLabel", "baseZIndex", "focusOnShow", "showTransitionOptions", "hideTransitionOptions"], outputs: ["onShow", "onHide"] }, { kind: "directive", type: i3.PrimeTemplate, selector: "[pTemplate]", inputs: ["type", "pTemplate"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "directive", type: i5.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i5.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i6.AutoComplete, selector: "p-autoComplete", inputs: ["minLength", "delay", "style", "panelStyle", "styleClass", "panelStyleClass", "inputStyle", "inputId", "inputStyleClass", "placeholder", "readonly", "disabled", "scrollHeight", "lazy", "virtualScroll", "virtualScrollItemSize", "virtualScrollOptions", "maxlength", "name", "required", "size", "appendTo", "autoHighlight", "forceSelection", "type", "autoZIndex", "baseZIndex", "ariaLabel", "dropdownAriaLabel", "ariaLabelledBy", "dropdownIcon", "unique", "group", "completeOnFocus", "showClear", "field", "dropdown", "showEmptyMessage", "dropdownMode", "multiple", "tabindex", "dataKey", "emptyMessage", "showTransitionOptions", "hideTransitionOptions", "autofocus", "autocomplete", "optionGroupChildren", "optionGroupLabel", "overlayOptions", "itemSize", "suggestions"], outputs: ["completeMethod", "onSelect", "onUnselect", "onFocus", "onBlur", "onDropdownClick", "onClear", "onKeyUp", "onShow", "onHide", "onLazyLoad"] }, { kind: "component", type: i7.IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: InputtextComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-inputtext', template: "<p-overlayPanel\n    #op\n    [dismissable]=\"false\"\n    styleClass=\"textinput-overlay\"\n>\n    <svg #provenance class=\"inputtext-provenance\">\n        <g class=\"axis\">\n            <text\n                transform=\"rotate(-90)\"\n                text-anchor=\"middle\"\n                fill=\"black\"\n                y=\"-30\"\n                [attr.font-size]=\"'small'\"\n            >\n                {{mode === \"interaction\" ? \"Sequence of Interaction (0 = first)\" : \"time\"}}\n            </text>\n        </g>\n        <g class=\"body\"></g>\n    </svg>\n</p-overlayPanel>\n<div\n    #wrapper\n    class=\"flex flex-row gap-3\"\n>\n    <!-- <ng-content></ng-content> -->\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        #provenanceButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!hasUserInteracted\"\n        (click)=\"handleProvenanceButtonClick($event, wrapper, op)\"\n        [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n    >\n        \n    <provenance-icon \n        [icon]=\"!hasUserInteracted ? 'disabled' : op.overlayVisible ? 'temporal' : 'aggregate'\"\n    ></provenance-icon>\n   </button>\n    <p-autoComplete\n        #autocomplete\n        [appendTo]=\"'body'\"\n        [ngModel]=\"{ label: field ? value[field] : value }\"\n        [field]=\"'label'\"\n        [suggestions]=\"getSuggestions()\"\n        [overlayOptions]=\"{ appendTo: 'body' }\"\n        (completeMethod)=\"handleSearch($event)\"\n        (onFocus)=\"!autocomplete.value && autocomplete.handleDropdownClick($event)\"\n        (onClear)=\"handleClear(autocomplete, $event)\"\n        (onKeyUp)=\"handleKeyUp($event)\"\n        (onSelect)=\"handleEnter('select')\"\n        (mouseout)=\"handleMouseOut()\"\n    >\n        <ng-template let-suggestion pTemplate=\"item\">\n            <div style=\"position: relative; width: 100%;\" (mousemove)=\"handleMouseOver($event, suggestion)\" (mouseout)=\"handleMouseOut()\">\n                <svg *ngIf=\"visualize\" style=\"width: 100%; height: 100%; position: absolute\">\n                    <rect x=\"0\" y=\"0\" [attr.width]=\"suggestion.width\" [attr.fill]=\"suggestion.color\" [attr.stroke]=\"'black'\" [attr.stroke-width]=\"suggestion.timestamp >= this.oldMaxTime! ? 2 : 0\" [attr.stroke-dasharray]=\"suggestion.timestamp === this.maxTime! ? '0 0' : '4 1'\" style=\"height: 100%;\"></rect>\n                </svg>\n                <div style=\"display: flex; justify-content: space-between; position: inherit;\">\n                    <span>\n                        {{suggestion.label === \"\" ? '&lt;empty&gt;' : suggestion.label}}\n                    </span>\n                </div>\n            </div>\n        </ng-template>\n    </p-autoComplete>\n</div>", styles: ["::ng-deep .textinput-overlay>.p-overlaypanel-content{overflow-y:auto;max-height:calc(250px + 3.5rem);padding-left:0!important;padding-right:0!important}\n"] }]
        }], propDecorators: { mode: [{
                type: Input
            }], id: [{
                type: Input
            }], visualize: [{
                type: Input
            }], wrapper: [{
                type: ViewChild,
                args: ["wrapper"]
            }], svg: [{
                type: ViewChild,
                args: ["provenance"]
            }], button: [{
                type: ViewChild,
                args: ["provenanceButton"]
            }], freeze: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], provenance: [{
                type: Input
            }], provenanceChange: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXR0ZXh0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL3Byb3ZlbmFuY2Utd2lkZ2V0cy9zcmMvbGliL2lucHV0dGV4dC9pbnB1dHRleHQuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvcHJvdmVuYW5jZS13aWRnZXRzL3NyYy9saWIvaW5wdXR0ZXh0L2lucHV0dGV4dC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQWlCLFNBQVMsRUFBYyxZQUFZLEVBQUUsS0FBSyxFQUFxQixNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2hJLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3pCLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUM3RixPQUFPLEVBQUUsY0FBYyxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxNQUFNLGNBQWMsQ0FBQzs7Ozs7Ozs7O0FBb0MxRSxNQUFNLE9BQU8sa0JBQW1CLFNBQVEsWUFBWTtJQUxwRDs7UUFNYSxTQUFJLEdBQUcsSUFBSSxDQUFBO1FBQ1gsT0FBRSxHQUFHLEVBQUUsQ0FBQTtRQUNQLGNBQVMsR0FBRyxJQUFJLENBQUE7UUFJaEIsV0FBTSxHQUFHLEtBQUssQ0FBQTtRQUViLGdCQUFXLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQWNoQyxxQkFBZ0IsR0FBRyxJQUFJLFlBQVksRUFBdUIsQ0FBQztRQUVyRSxTQUFJLEdBQXdCLEVBQUUsQ0FBQTtRQUM5QixlQUFVLEdBQXFDLEVBQUUsQ0FBQTtRQUNqRCxVQUFLLEdBQUcsRUFBRSxDQUFBO1FBQ1YsWUFBTyxHQUFxQixTQUFTLENBQUE7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QVU7c0JBRGIsS0FBSztnQkFhSSxnQkFBZ0I7c0JBQXpCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZnRlclZpZXdJbml0LCBDb21wb25lbnQsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE9uRGVzdHJveSwgT25Jbml0LCBPdXRwdXQsIFZpZXdDaGlsZCB9IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgKiBhcyBkMyBmcm9tIFwiZDNcIjtcbmltcG9ydCB7IEF1dG9Db21wbGV0ZSB9IGZyb20gXCJwcmltZW5nL2F1dG9jb21wbGV0ZVwiO1xuaW1wb3J0IHsgY29udmVydFJlbVRvUGl4ZWxzLCBnZXRUb29sdGlwLCBpbnRlcnBvbGF0ZUxpZ2h0T3Jhbmdlcywgc3VmZml4ZWQgfSBmcm9tIFwiLi4vdXRpbHNcIjtcbmltcG9ydCB7IERFRkFVTFRfSEVJR0hULCBMSU5FX0NJUkNMRV9ESUFNRVRFUiwgTU9ERSB9IGZyb20gXCIuLi9jb25zdGFudHNcIjtcbmltcG9ydCB7IE92ZXJsYXlQYW5lbCB9IGZyb20gXCJwcmltZW5nL292ZXJsYXlwYW5lbFwiO1xuXG5pbnRlcmZhY2UgVGltZVN0YW1wZWRWYWx1ZXMge1xuICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgdGltZXN0YW1wOiBEYXRlO1xufVxuXG5pbnRlcmZhY2UgVGltZVN0YW1wZWRDb3VudCB7XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICB0aW1lc3RhbXA6IERhdGU7XG4gICAgbWF4SW5kZXg6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIEF1dG9Db21wbGV0ZUNvbXBsZXRlRXZlbnQge1xuICAgIG9yaWdpbmFsRXZlbnQ6IEV2ZW50O1xuICAgIHF1ZXJ5OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIElucHV0VGV4dFByb3ZlbmFuY2UgPSB7XG4gICAgZGF0YTogVGltZVN0YW1wZWRWYWx1ZXNbXTtcbiAgICBkaWN0aW9uYXJ5OiBSZWNvcmQ8c3RyaW5nLCBUaW1lU3RhbXBlZENvdW50PjtcbiAgICBtaW5UaW1lPzogRGF0ZTtcbiAgICBvbGRNYXhUaW1lPzogRGF0ZTtcbiAgICBtYXhUaW1lPzogRGF0ZTtcbiAgICBtaW5Nc0JldHdlZW5JbnRlcmFjdGlvbnM6IG51bWJlcjtcbiAgICByZXZhbGlkYXRlPzogYm9vbGVhbjtcbn0gfCB7XG4gICAgcmV2YWxpZGF0ZTogdHJ1ZTtcbiAgICBkYXRhOiBUaW1lU3RhbXBlZFZhbHVlc1tdO1xufVxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdwcm92ZW5hbmNlLWlucHV0dGV4dCcsXG4gICAgdGVtcGxhdGVVcmw6ICcuL2lucHV0dGV4dC5jb21wb25lbnQuaHRtbCcsXG4gICAgc3R5bGVVcmxzOiBbJy4vaW5wdXR0ZXh0LmNvbXBvbmVudC5zY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgSW5wdXR0ZXh0Q29tcG9uZW50IGV4dGVuZHMgQXV0b0NvbXBsZXRlIGltcGxlbWVudHMgT25Jbml0LCBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICAgIEBJbnB1dCgpIG1vZGUgPSBNT0RFXG4gICAgQElucHV0KCkgaWQgPSBcIlwiXG4gICAgQElucHV0KCkgdmlzdWFsaXplID0gdHJ1ZVxuICAgIEBWaWV3Q2hpbGQoXCJ3cmFwcGVyXCIpIHdyYXBwZXIhOiBFbGVtZW50UmVmPEhUTUxEaXZFbGVtZW50PjtcbiAgICBAVmlld0NoaWxkKFwicHJvdmVuYW5jZVwiKSBzdmchOiBFbGVtZW50UmVmPFNWR1NWR0VsZW1lbnQ+O1xuICAgIEBWaWV3Q2hpbGQoXCJwcm92ZW5hbmNlQnV0dG9uXCIpIGJ1dHRvbiE6IEVsZW1lbnRSZWY8SFRNTEJ1dHRvbkVsZW1lbnQ+O1xuICAgIEBJbnB1dCgpIGZyZWV6ZSA9IGZhbHNlXG4gICAgQElucHV0KCkgb3ZlcnJpZGUgdmFsdWU6IGFueVxuICAgIEBPdXRwdXQoKSB2YWx1ZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICAgIEBJbnB1dCgpIFxuICAgIGdldCBwcm92ZW5hbmNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcHJvdmVuYW5jZVxuICAgIH1cbiAgICBzZXQgcHJvdmVuYW5jZSh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fcHJvdmVuYW5jZSAmJiB2YWx1ZT8ucmV2YWxpZGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5zZXRQcm92ZW5hbmNlKHZhbHVlKVxuICAgICAgICAgICAgdGhpcy5fdmlzdWFsaXplKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Byb3ZlbmFuY2UgPSB2YWx1ZVxuICAgIH1cbiAgICBfcHJvdmVuYW5jZT86IElucHV0VGV4dFByb3ZlbmFuY2VcbiAgICBAT3V0cHV0KCkgcHJvdmVuYW5jZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8SW5wdXRUZXh0UHJvdmVuYW5jZT4oKTtcblxuICAgIGRhdGE6IFRpbWVTdGFtcGVkVmFsdWVzW10gPSBbXVxuICAgIGRpY3Rpb25hcnk6IFJlY29yZDxzdHJpbmcsIFRpbWVTdGFtcGVkQ291bnQ+ID0ge31cbiAgICBxdWVyeSA9IFwiXCJcbiAgICBtaW5UaW1lOiBEYXRlIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG4gICAgb2xkTWF4VGltZTogRGF0ZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICAgIG1heFRpbWU6IERhdGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcbiAgICBtaW5Nc0JldHdlZW5JbnRlcmFjdGlvbnMgPSBJbmZpbml0eVxuICAgIGludGVydmFsID0gTmFOXG4gICAgaGFzVXNlckludGVyYWN0ZWQgPSBmYWxzZVxuICAgIHRvb2x0aXAgPSBnZXRUb29sdGlwKClcblxuICAgIHNldFByb3ZlbmFuY2UocHJvdmVuYW5jZTogSW5wdXRUZXh0UHJvdmVuYW5jZSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBwcm92ZW5hbmNlLmRhdGFcbiAgICAgICAgaWYgKCFwcm92ZW5hbmNlLnJldmFsaWRhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuZGljdGlvbmFyeSA9IHByb3ZlbmFuY2UuZGljdGlvbmFyeVxuICAgICAgICAgICAgdGhpcy5taW5UaW1lID0gcHJvdmVuYW5jZS5taW5UaW1lXG4gICAgICAgICAgICB0aGlzLm9sZE1heFRpbWUgPSBwcm92ZW5hbmNlLm9sZE1heFRpbWVcbiAgICAgICAgICAgIHRoaXMubWF4VGltZSA9IHByb3ZlbmFuY2UubWF4VGltZVxuICAgICAgICAgICAgdGhpcy5taW5Nc0JldHdlZW5JbnRlcmFjdGlvbnMgPSBwcm92ZW5hbmNlLm1pbk1zQmV0d2VlbkludGVyYWN0aW9uc1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5taW5UaW1lID0gdGhpcy5kYXRhWzBdLnRpbWVzdGFtcFxuICAgICAgICAgICAgdGhpcy5tYXhUaW1lID0gdGhpcy5kYXRhW3RoaXMuZGF0YS5sZW5ndGggLSAxXS50aW1lc3RhbXBcbiAgICAgICAgICAgIHRoaXMub2xkTWF4VGltZSA9IHRoaXMuZGF0YS5sZW5ndGggPiAxID8gdGhpcy5kYXRhW3RoaXMuZGF0YS5sZW5ndGggLSAyXS50aW1lc3RhbXAgOiB0aGlzLmRhdGFbMF0udGltZXN0YW1wXG4gICAgICAgICAgICB0aGlzLm1pbk1zQmV0d2VlbkludGVyYWN0aW9ucyA9IE1hdGgubWluKFxuICAgICAgICAgICAgICAgIEluZmluaXR5LCAoK3RoaXMubWF4VGltZSkgLSAoK3RoaXMub2xkTWF4VGltZSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHRoaXMuZGljdGlvbmFyeSA9IHRoaXMuZGF0YS5yZWR1Y2U8UmVjb3JkPHN0cmluZywgVGltZVN0YW1wZWRDb3VudD4+KChhY2MsIHsgdmFsdWUsIHRpbWVzdGFtcCB9LCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgYWNjW3ZhbHVlXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IChhY2NbdmFsdWVdPy5jb3VudCB8fCAwKSArIDEsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgICAgICAgbWF4SW5kZXg6IGlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY1xuICAgICAgICAgICAgfSwge30pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRQcm92ZW5hbmNlKCk6IElucHV0VGV4dFByb3ZlbmFuY2Uge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGF0YTogdGhpcy5kYXRhLFxuICAgICAgICAgICAgZGljdGlvbmFyeTogdGhpcy5kaWN0aW9uYXJ5LFxuICAgICAgICAgICAgbWluVGltZTogdGhpcy5taW5UaW1lLFxuICAgICAgICAgICAgb2xkTWF4VGltZTogdGhpcy5vbGRNYXhUaW1lLFxuICAgICAgICAgICAgbWF4VGltZTogdGhpcy5tYXhUaW1lLFxuICAgICAgICAgICAgbWluTXNCZXR3ZWVuSW50ZXJhY3Rpb25zOiB0aGlzLm1pbk1zQmV0d2VlbkludGVyYWN0aW9uc1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIHRoaXMudG9vbHRpcCA9IGdldFRvb2x0aXAoKVxuICAgICAgICBpZiAodGhpcy5wcm92ZW5hbmNlPy5kYXRhPy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0UHJvdmVuYW5jZSh0aGlzLnByb3ZlbmFuY2UpXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5kYXRhLnNsaWNlKC0xKVswXS52YWx1ZVxuICAgICAgICAgICAgdGhpcy5oYXNVc2VySW50ZXJhY3RlZCA9IHRoaXMuZGF0YS5sZW5ndGggPiAwXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy52YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmZpZWxkID8gdGhpcy52YWx1ZVt0aGlzLmZpZWxkXSA6IHRoaXMudmFsdWVcbiAgICAgICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKClcbiAgICAgICAgICAgIHRoaXMubWluVGltZSA9IHRpbWVzdGFtcFxuICAgICAgICAgICAgdGhpcy5vbGRNYXhUaW1lID0gdGltZXN0YW1wXG4gICAgICAgICAgICB0aGlzLm1heFRpbWUgPSB0aW1lc3RhbXBcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IFt7IHZhbHVlLCB0aW1lc3RhbXAgfV1cbiAgICAgICAgICAgIHRoaXMuZGljdGlvbmFyeVt2YWx1ZV0gPSB7XG4gICAgICAgICAgICAgICAgY291bnQ6IDEsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgICAgIG1heEluZGV4OiAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnByb3ZlbmFuY2U/LmRhdGE/Lmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5fdmlzdWFsaXplKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlIG5nT25EZXN0cm95KCkge1xuICAgICAgICBzdXBlci5uZ09uRGVzdHJveSgpXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbClcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlVcChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlRW50ZXIoXCJlbnRlclwiKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaGFuZGxlRW50ZXIoZXZlbnRUeXBlOiBcImNsaWNrXCIgfCBcImVudGVyXCIgfCBcInNlbGVjdFwiKSB7XG4gICAgICAgIHRoaXMudG9vbHRpcC5zdHlsZShcIm9wYWNpdHlcIiwgMCkuc3R5bGUoXCJkaXNwbGF5XCIsIFwibm9uZVwiKVxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMud3JhcHBlci5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKT8udmFsdWVcblxuICAgICAgICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAnJykgcmV0dXJuXG5cbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgICAgIHRoaXMudmFsdWVDaGFuZ2UuZW1pdCh2YWx1ZSlcblxuICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpXG5cbiAgICAgICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwcm92ZW5hbmNlLXdpZGdldHNcIiwge1xuICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICAgICAgd2lkZ2V0OiBcImlucHV0dGV4dFwiLFxuICAgICAgICAgICAgICAgIG1vZGU6IHRoaXMubW9kZSxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbjogZXZlbnRUeXBlLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpXG5cbiAgICAgICAgaWYgKHRoaXMuZnJlZXplKSByZXR1cm5cblxuICAgICAgICBpZiAoIXRoaXMubWluVGltZSkgdGhpcy5taW5UaW1lID0gdGltZXN0YW1wXG5cbiAgICAgICAgaWYgKHRoaXMubWF4VGltZSlcbiAgICAgICAgICAgIHRoaXMubWluTXNCZXR3ZWVuSW50ZXJhY3Rpb25zID0gTWF0aC5taW4odGhpcy5taW5Nc0JldHdlZW5JbnRlcmFjdGlvbnMsICgrdGltZXN0YW1wKSAtICgrdGhpcy5tYXhUaW1lISkpXG5cbiAgICAgICAgdGhpcy5vbGRNYXhUaW1lID0gdGhpcy5tYXhUaW1lIHx8IHRpbWVzdGFtcFxuICAgICAgICB0aGlzLm1heFRpbWUgPSB0aW1lc3RhbXBcblxuICAgICAgICBjb25zdCBuZXdFbnRyeSA9IHsgdmFsdWUsIHRpbWVzdGFtcCB9XG4gICAgICAgIGNvbnN0IGRhdGFFbnRyeSA9IFtuZXdFbnRyeV1cblxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcInRpbWVcIilcbiAgICAgICAgICAgIGRhdGFFbnRyeS5wdXNoKG5ld0VudHJ5KVxuXG4gICAgICAgIHRoaXMuZGF0YSA9IFtcbiAgICAgICAgICAgIC4uLnRoaXMuZGF0YSxcbiAgICAgICAgICAgIC4uLmRhdGFFbnRyeVxuICAgICAgICBdXG5cbiAgICAgICAgdGhpcy5kaWN0aW9uYXJ5W3ZhbHVlXSA9IHtcbiAgICAgICAgICAgIGNvdW50OiAodGhpcy5kaWN0aW9uYXJ5W3ZhbHVlXT8uY291bnQgfHwgMCkgKyAxLFxuICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgbWF4SW5kZXg6IHRoaXMuZGF0YS5sZW5ndGggLSAxXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcInRpbWVcIiAmJiBpc05hTih0aGlzLmludGVydmFsKSkge1xuICAgICAgICAgICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdUaW1lU3RhbXAgPSBuZXcgRGF0ZSgpXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRNYXhUaW1lID0gdGhpcy5tYXhUaW1lIHx8IG5ld1RpbWVTdGFtcFxuICAgICAgICAgICAgICAgIHRoaXMubWF4VGltZSA9IG5ld1RpbWVTdGFtcFxuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RFbnRyeSA9IHRoaXMuZGF0YS5zbGljZSgtMSlbMF1cbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSBbXG4gICAgICAgICAgICAgICAgICAgIC4uLnRoaXMuZGF0YS5zbGljZSgwLCAtMSksXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBsYXN0RW50cnkudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ld1RpbWVTdGFtcFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIHRoaXMuX3Zpc3VhbGl6ZSgpXG4gICAgICAgICAgICB9LCAxMDAwKSBhcyBhbnlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGFzVXNlckludGVyYWN0ZWQgPSB0cnVlXG5cbiAgICAgICAgY29uc3QgcHJvdmVuYW5jZSA9IHRoaXMuZ2V0UHJvdmVuYW5jZSgpXG4gICAgICAgIHRoaXMucHJvdmVuYW5jZUNoYW5nZT8uZW1pdChwcm92ZW5hbmNlKVxuICAgICAgICB0aGlzLl92aXN1YWxpemUoKVxuICAgIH1cblxuICAgIF92aXN1YWxpemUoKSB7XG4gICAgICAgIGlmICghdGhpcy52aXN1YWxpemUpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBjb25zdCBzZWxmID0gdGhpc1xuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMud3JhcHBlci5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKSEub2Zmc2V0V2lkdGhcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGV4dEhlaWdodCA9IHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkuZ2V0UHJvcGVydHlWYWx1ZShcImZvbnQtc2l6ZVwiKSkgfHwgMTNcblxuICAgICAgICBjb25zdCB0aW1lRGlmZiA9ICgrdGhpcy5tYXhUaW1lISkgLSAoK3RoaXMubWluVGltZSEpXG5cbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoXG4gICAgICAgICAgICBkZWZhdWx0VGV4dEhlaWdodCAqIChcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPT09IFwiaW50ZXJhY3Rpb25cIiA/IHRoaXMuZGF0YS5sZW5ndGggOlxuICAgICAgICAgICAgICAgICAgICB0aW1lRGlmZiAvIHRoaXMubWluTXNCZXR3ZWVuSW50ZXJhY3Rpb25zXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgREVGQVVMVF9IRUlHSFRcbiAgICAgICAgKVxuXG4gICAgICAgIGNvbnN0IGJ1dHRvbldpZHRoID0gdGhpcy5idXR0b24ubmF0aXZlRWxlbWVudC5vZmZzZXRXaWR0aFxuXG4gICAgICAgIGNvbnN0IEZMRVhfR0FQID0gY29udmVydFJlbVRvUGl4ZWxzKDAuNSlcblxuICAgICAgICBjb25zdCBzdmcgPSBkM1xuICAgICAgICAgICAgLnNlbGVjdCh0aGlzLnN2Zy5uYXRpdmVFbGVtZW50KVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgZGVmYXVsdFRleHRIZWlnaHQpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGAke3dpZHRoICsgYnV0dG9uV2lkdGggKyBGTEVYX0dBUH1weGApXG5cbiAgICAgICAgY29uc3Qgc3ZnZyA9IHN2Z1xuICAgICAgICAgICAgLnNlbGVjdChcImcuYm9keVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSgke2J1dHRvbldpZHRoICsgRkxFWF9HQVB9LCAke2RlZmF1bHRUZXh0SGVpZ2h0IC8gMn0pYClcblxuICAgICAgICBjb25zdCB5ID0gdGhpcy5tb2RlID09PSBcImludGVyYWN0aW9uXCIgP1xuICAgICAgICAgICAgZDMuc2NhbGVMaW5lYXIoKVxuICAgICAgICAgICAgICAgIC5kb21haW4oWzAsIHRoaXMuZGF0YS5sZW5ndGggLSAxXSlcbiAgICAgICAgICAgICAgICAucmFuZ2UoWzAsIGhlaWdodF0pIDpcbiAgICAgICAgICAgIGQzLnNjYWxlVGltZSgpXG4gICAgICAgICAgICAgICAgLmRvbWFpbihbdGhpcy5taW5UaW1lISwgdGhpcy5tYXhUaW1lIV0pXG4gICAgICAgICAgICAgICAgLnJhbmdlKFswLCBoZWlnaHRdKVxuXG4gICAgICAgIGNvbnN0IHlBeGlzID0gZDMuYXhpc0xlZnQoeS5uaWNlKCkpXG5cbiAgICAgICAgaWYgKHRoaXMubW9kZSAhPT0gXCJpbnRlcmFjdGlvblwiKVxuICAgICAgICAgICAgeUF4aXMudGlja1ZhbHVlcyhbdGhpcy5taW5UaW1lISwgdGhpcy5tYXhUaW1lIV0pLnRpY2tGb3JtYXQoKF8saSkgPT4gaSA9PT0gMCA/IFwidD0wXCIgOiBcIm5vd1wiKVxuXG4gICAgICAgIGNvbnN0IGF4aXNHID0gZDMuc2VsZWN0KHRoaXMuc3ZnLm5hdGl2ZUVsZW1lbnQpLnNlbGVjdChcImcuYXhpc1wiKVxuXG4gICAgICAgIGF4aXNHXG4gICAgICAgICAgICAuc2VsZWN0KFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIC0oREVGQVVMVF9IRUlHSFQgKyBkZWZhdWx0VGV4dEhlaWdodCkgLyAyKVxuXG4gICAgICAgIGF4aXNHXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlKCR7YnV0dG9uV2lkdGggKyBGTEVYX0dBUH0sICR7ZGVmYXVsdFRleHRIZWlnaHQgLyAyfSlgKVxuICAgICAgICAgICAgLmNhbGwoeUF4aXMgYXMgYW55KVxuXG4gICAgICAgIGNvbnN0IGxpbmUgPSBkMy5saW5lPFRpbWVTdGFtcGVkVmFsdWVzPigpXG4gICAgICAgICAgICAueChMSU5FX0NJUkNMRV9ESUFNRVRFUiAvIDIpXG4gICAgICAgICAgICAueSgoZCwgaSkgPT4geSh0aGlzLm1vZGUgPT09IFwiaW50ZXJhY3Rpb25cIiA/IGkgOiBkLnRpbWVzdGFtcCkpXG5cbiAgICAgICAgY29uc3QgY29sb3IgPSBkM1xuICAgICAgICAgICAgLnNjYWxlU2VxdWVudGlhbChpbnRlcnBvbGF0ZUxpZ2h0T3JhbmdlcylcbiAgICAgICAgICAgIC5kb21haW4odGhpcy5tb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBcbiAgICAgICAgICAgICAgICBbMCwgdGhpcy5kYXRhLmxlbmd0aCAtIDFdIDpcbiAgICAgICAgICAgICAgICBbdGhpcy5taW5UaW1lISwgdGhpcy5tYXhUaW1lIV1cbiAgICAgICAgICAgIClcblxuICAgICAgICBzdmdnXG4gICAgICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAgICAgLmRhdGEoW3RoaXMuZGF0YV0pXG4gICAgICAgICAgICAuam9pbihcInBhdGhcIilcbiAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC5kdXJhdGlvbigyNTApXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgbGluZSlcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDIpXG5cbiAgICAgICAgc3ZnZ1xuICAgICAgICAgICAgLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgICAgICAgLmRhdGEodGhpcy5kYXRhKVxuICAgICAgICAgICAgLmpvaW4oXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwicHN2Z2lcIiwgKF8sIGkpID0+IGkpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCAoXywgZCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBkLnZhbHVlXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwcGVyLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpIS52YWx1ZSA9IGQudmFsdWVcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUVudGVyKFwiY2xpY2tcIilcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKGUsIGQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGNsaWVudFg6IHgsIGNsaWVudFk6IHkgfSA9IGVcbiAgICAgICAgICAgICAgICBzZWxmLnRvb2x0aXBcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAxKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIilcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKFwibGVmdFwiLCBgJHt4ICsgMTB9cHhgKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgYCR7eSArIDEwfXB4YClcbiAgICAgICAgICAgICAgICAgICAgLnNlbGVjdChcImRpdlwiKVxuICAgICAgICAgICAgICAgICAgICAuaHRtbChgXG4gICAgICAgICAgICAgICAgICAgICAgICBMYWJlbDogJHtzZWxmLmVsPy5uYXRpdmVFbGVtZW50Py5kYXRhc2V0Py5sYWJlbCB8fCBzZWxmLmlkfSA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7c3VmZml4ZWQoK2QzLnNlbGVjdCh0aGlzKS5hdHRyKFwicHN2Z2lcIikpfS8ke3N1ZmZpeGVkKHNlbGYuZGF0YS5sZW5ndGggLSAxKX0gc2VhcmNoIDxiciAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+U2VhcmNoZWQgdmFsdWU6ICR7ZC52YWx1ZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPlNlYXJjaGVkIGF0OiAke2QudGltZXN0YW1wLnRvTG9jYWxlU3RyaW5nKCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICBgKVxuXG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwcm92ZW5hbmNlLXdpZGdldHNcIiwge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBzZWxmLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkZ2V0OiBcImlucHV0dGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZTogc2VsZi5tb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb246IFwiaG92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IGQudGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBkMy5zZWxlY3QodGhpcykuYXR0cihcInBzdmdpXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJtb3VzZW91dFwiLCAoKSA9PiBzZWxmLnRvb2x0aXAuc3R5bGUoXCJvcGFjaXR5XCIsIDApLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIikpXG4gICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAuZHVyYXRpb24oMjUwKVxuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBMSU5FX0NJUkNMRV9ESUFNRVRFUiAvIDIpXG4gICAgICAgICAgICAuYXR0cihcImN5XCIsIChkLCBpKSA9PiB5KHRoaXMubW9kZSA9PT0gXCJpbnRlcmFjdGlvblwiID8gaSA6IGQudGltZXN0YW1wKSlcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCBMSU5FX0NJUkNMRV9ESUFNRVRFUiAvIDIpXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGQ6IFRpbWVTdGFtcGVkVmFsdWVzLCBpKSA9PiBjb2xvcih0aGlzLm1vZGUgPT09IFwiaW50ZXJhY3Rpb25cIiA/IGkgOiBkLnRpbWVzdGFtcCkpXG4gICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgICAgICAgICAuc3R5bGUoXCJjdXJzb3JcIiwgXCJwb2ludGVyXCIpXG5cbiAgICAgICAgc3ZnZ1xuICAgICAgICAgICAgLnNlbGVjdEFsbChcInRleHRcIilcbiAgICAgICAgICAgIC5kYXRhKHRoaXMuZGF0YSlcbiAgICAgICAgICAgIC5qb2luKFwidGV4dFwiKVxuICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLmR1cmF0aW9uKDI1MClcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBMSU5FX0NJUkNMRV9ESUFNRVRFUiArIDQpXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgKGQsIGkpID0+IHkodGhpcy5tb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBpIDogZC50aW1lc3RhbXApICsgZGVmYXVsdFRleHRIZWlnaHQgLyA0KVxuICAgICAgICAgICAgLnRleHQoKGQ6IFRpbWVTdGFtcGVkVmFsdWVzKSA9PiBkLnZhbHVlIHx8IFwiPGVtcHR5PlwiKVxuICAgIH1cblxuICAgIGhhbmRsZVNlYXJjaChldmVudDogQXV0b0NvbXBsZXRlQ29tcGxldGVFdmVudCkge1xuICAgICAgICB0aGlzLnF1ZXJ5ID0gZXZlbnQucXVlcnlcbiAgICB9XG5cbiAgICBnZXRTdWdnZXN0aW9ucygpIHtcbiAgICAgICAgaWYgKCF0aGlzLndyYXBwZXI/Lm5hdGl2ZUVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm4gW11cblxuICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMud3JhcHBlci5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTElucHV0RWxlbWVudD4oXCJpbnB1dFwiKSEub2Zmc2V0V2lkdGggLSBjb252ZXJ0UmVtVG9QaXhlbHMoMi41KVxuICAgICAgICBjb25zdCByZXN1bHRTZXQgPSBPYmplY3QuZW50cmllcyh0aGlzLmRpY3Rpb25hcnkpXG4gICAgICAgICAgICAuZmlsdGVyKChba2V5XSkgPT4ga2V5LmluY2x1ZGVzKHRoaXMucXVlcnkpKVxuICAgICAgICAgICAgLnNvcnQoKFssIGFdLCBbLCBiXSkgPT4gYi50aW1lc3RhbXAuZ2V0VGltZSgpIC0gYS50aW1lc3RhbXAuZ2V0VGltZSgpKVxuICAgICAgICBcbiAgICAgICAgY29uc3QgdGltZURvbWFpbiA9IGQzLmV4dGVudChyZXN1bHRTZXQsIChbLCB7IHRpbWVzdGFtcCB9XSkgPT4gdGltZXN0YW1wKSBhcyBbRGF0ZSwgRGF0ZV1cbiAgICAgICAgY29uc3QgaW50ZXJhY3Rpb25Eb21haW4gPSBkMy5leHRlbnQocmVzdWx0U2V0LCAoWywgeyBtYXhJbmRleCB9XSkgPT4gbWF4SW5kZXgpIGFzIFtudW1iZXIsIG51bWJlcl1cbiAgICAgICAgY29uc3QgY291bnREb21haW4gPSBbMCwgZDMubWF4KHJlc3VsdFNldCwgKFssIHsgY291bnQgfV0pID0+IGNvdW50KSBhcyBudW1iZXJdXG4gICAgICAgIGNvbnN0IHggPSBkMy5zY2FsZUxpbmVhcigpLmRvbWFpbihjb3VudERvbWFpbikucmFuZ2UoWzAsIHdpZHRoXSlcbiAgICAgICAgY29uc3QgY29sb3IgPSBkM1xuICAgICAgICAgICAgLnNjYWxlU2VxdWVudGlhbChpbnRlcnBvbGF0ZUxpZ2h0T3JhbmdlcylcbiAgICAgICAgICAgIC5kb21haW4odGhpcy5tb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBpbnRlcmFjdGlvbkRvbWFpbiA6IHRpbWVEb21haW4pXG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdFNldC5tYXAoKFtrZXksIHsgY291bnQsIHRpbWVzdGFtcCwgbWF4SW5kZXggfV0pID0+ICh7XG4gICAgICAgICAgICBsYWJlbDoga2V5LFxuICAgICAgICAgICAgY291bnQsXG4gICAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgICBjb2xvcjogY29sb3IodGhpcy5tb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBtYXhJbmRleCA6IHRpbWVzdGFtcCksXG4gICAgICAgICAgICB3aWR0aDogeChjb3VudClcbiAgICAgICAgfSkpXG4gICAgfVxuXG4gICAgaGFuZGxlQ2xlYXIoYXV0b2NvbXBsZXRlOiBBdXRvQ29tcGxldGUsIGV2ZW50OiBhbnkpIHtcbiAgICAgICAgYXV0b2NvbXBsZXRlLnZhbHVlID0gXCJcIlxuICAgICAgICBhdXRvY29tcGxldGUuaGFuZGxlRHJvcGRvd25DbGljayhldmVudClcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZU92ZXIoZXZlbnQ6IE1vdXNlRXZlbnQsIHN1Z2dlc3Rpb246IGFueSkge1xuICAgICAgICBpZiAoIXRoaXMudmlzdWFsaXplKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGNvbnN0IHsgY2xpZW50WDogeCwgY2xpZW50WTogeSB9ID0gZXZlbnRcbiAgICAgICAgdGhpcy50b29sdGlwXG4gICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIDEpXG4gICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIilcbiAgICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwgYCR7eCArIDEwfXB4YClcbiAgICAgICAgICAgIC5zdHlsZShcInRvcFwiLCBgJHt5ICsgMTB9cHhgKVxuICAgICAgICAgICAgLnNlbGVjdChcImRpdlwiKVxuICAgICAgICAgICAgLmh0bWwoYFxuICAgICAgICAgICAgICAgIDxzcGFuPkxhYmVsOiAke3RoaXMuZWw/Lm5hdGl2ZUVsZW1lbnQ/LmRhdGFzZXQ/LmxhYmVsIHx8IHRoaXMuaWR9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPlNlYXJjaGVkIHZhbHVlOiAke3N1Z2dlc3Rpb24ubGFiZWx9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDxiciAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPkxhc3Qgc2VhcmNoZWQgYXQ6ICR7c3VnZ2VzdGlvbi50aW1lc3RhbXAudG9Mb2NhbGVTdHJpbmcoKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPGJyIC8+XG4gICAgICAgICAgICAgICAgPHNwYW4+IyB0aW1lcyBzZWFyY2hlZDogJHtzdWdnZXN0aW9uLmNvdW50fTwvc3Bhbj5cbiAgICAgICAgICAgIGApXG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VPdXQoKSB7XG4gICAgICAgIHRoaXMudG9vbHRpcC5zdHlsZShcIm9wYWNpdHlcIiwgMCkuc3R5bGUoXCJkaXNwbGF5XCIsIFwibm9uZVwiKVxuICAgIH1cblxuICAgIGhhbmRsZVByb3ZlbmFuY2VCdXR0b25DbGljayhldmVudDogTW91c2VFdmVudCwgdGFyZ2V0OiBhbnksIG9wOiBPdmVybGF5UGFuZWwpIHtcbiAgICAgICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwcm92ZW5hbmNlLXdpZGdldHNcIiwge1xuICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICAgICAgd2lkZ2V0OiBcImlucHV0dGV4dFwiLFxuICAgICAgICAgICAgICAgIG1vZGU6IHRoaXMubW9kZSxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbjogXCJwcm92ZW5hbmNlLWJ1dHRvbi1jbGlja1wiLFxuICAgICAgICAgICAgICAgIGluaXRpYWxQcm92ZW5hbmNlTW9kZTogb3Aub3ZlcmxheVZpc2libGUgPyBcInRlbXBvcmFsXCIgOiBcImFnZ3JlZ2F0ZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgICBvcC50b2dnbGUoZXZlbnQsIHRhcmdldClcbiAgICB9XG59IiwiPHAtb3ZlcmxheVBhbmVsXG4gICAgI29wXG4gICAgW2Rpc21pc3NhYmxlXT1cImZhbHNlXCJcbiAgICBzdHlsZUNsYXNzPVwidGV4dGlucHV0LW92ZXJsYXlcIlxuPlxuICAgIDxzdmcgI3Byb3ZlbmFuY2UgY2xhc3M9XCJpbnB1dHRleHQtcHJvdmVuYW5jZVwiPlxuICAgICAgICA8ZyBjbGFzcz1cImF4aXNcIj5cbiAgICAgICAgICAgIDx0ZXh0XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtPVwicm90YXRlKC05MClcIlxuICAgICAgICAgICAgICAgIHRleHQtYW5jaG9yPVwibWlkZGxlXCJcbiAgICAgICAgICAgICAgICBmaWxsPVwiYmxhY2tcIlxuICAgICAgICAgICAgICAgIHk9XCItMzBcIlxuICAgICAgICAgICAgICAgIFthdHRyLmZvbnQtc2l6ZV09XCInc21hbGwnXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7e21vZGUgPT09IFwiaW50ZXJhY3Rpb25cIiA/IFwiU2VxdWVuY2Ugb2YgSW50ZXJhY3Rpb24gKDAgPSBmaXJzdClcIiA6IFwidGltZVwifX1cbiAgICAgICAgICAgIDwvdGV4dD5cbiAgICAgICAgPC9nPlxuICAgICAgICA8ZyBjbGFzcz1cImJvZHlcIj48L2c+XG4gICAgPC9zdmc+XG48L3Atb3ZlcmxheVBhbmVsPlxuPGRpdlxuICAgICN3cmFwcGVyXG4gICAgY2xhc3M9XCJmbGV4IGZsZXgtcm93IGdhcC0zXCJcbj5cbiAgICA8IS0tIDxuZy1jb250ZW50PjwvbmctY29udGVudD4gLS0+XG4gICAgPGJ1dHRvblxuICAgICAgICAqbmdJZj1cInZpc3VhbGl6ZVwiXG4gICAgICAgIHBCdXR0b25cbiAgICAgICAgI3Byb3ZlbmFuY2VCdXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzPVwicC1idXR0b24taGVscCBwLWJ1dHRvbi10ZXh0XCJcbiAgICAgICAgW2Rpc2FibGVkXT1cIiFoYXNVc2VySW50ZXJhY3RlZFwiXG4gICAgICAgIChjbGljayk9XCJoYW5kbGVQcm92ZW5hbmNlQnV0dG9uQ2xpY2soJGV2ZW50LCB3cmFwcGVyLCBvcClcIlxuICAgICAgICBbbmdTdHlsZV09XCJ7ICdwYWRkaW5nJzogMCwgJ2FsaWduLXNlbGYnOiAnY2VudGVyJywgJ2hlaWdodCc6ICdtaW4tY29udGVudCcsICd2aXNpYmlsaXR5JzogdmlzdWFsaXplID8gJ3Zpc2libGUnIDogJ2hpZGRlbid9XCJcbiAgICA+XG4gICAgICAgIFxuICAgIDxwcm92ZW5hbmNlLWljb24gXG4gICAgICAgIFtpY29uXT1cIiFoYXNVc2VySW50ZXJhY3RlZCA/ICdkaXNhYmxlZCcgOiBvcC5vdmVybGF5VmlzaWJsZSA/ICd0ZW1wb3JhbCcgOiAnYWdncmVnYXRlJ1wiXG4gICAgPjwvcHJvdmVuYW5jZS1pY29uPlxuICAgPC9idXR0b24+XG4gICAgPHAtYXV0b0NvbXBsZXRlXG4gICAgICAgICNhdXRvY29tcGxldGVcbiAgICAgICAgW2FwcGVuZFRvXT1cIidib2R5J1wiXG4gICAgICAgIFtuZ01vZGVsXT1cInsgbGFiZWw6IGZpZWxkID8gdmFsdWVbZmllbGRdIDogdmFsdWUgfVwiXG4gICAgICAgIFtmaWVsZF09XCInbGFiZWwnXCJcbiAgICAgICAgW3N1Z2dlc3Rpb25zXT1cImdldFN1Z2dlc3Rpb25zKClcIlxuICAgICAgICBbb3ZlcmxheU9wdGlvbnNdPVwieyBhcHBlbmRUbzogJ2JvZHknIH1cIlxuICAgICAgICAoY29tcGxldGVNZXRob2QpPVwiaGFuZGxlU2VhcmNoKCRldmVudClcIlxuICAgICAgICAob25Gb2N1cyk9XCIhYXV0b2NvbXBsZXRlLnZhbHVlICYmIGF1dG9jb21wbGV0ZS5oYW5kbGVEcm9wZG93bkNsaWNrKCRldmVudClcIlxuICAgICAgICAob25DbGVhcik9XCJoYW5kbGVDbGVhcihhdXRvY29tcGxldGUsICRldmVudClcIlxuICAgICAgICAob25LZXlVcCk9XCJoYW5kbGVLZXlVcCgkZXZlbnQpXCJcbiAgICAgICAgKG9uU2VsZWN0KT1cImhhbmRsZUVudGVyKCdzZWxlY3QnKVwiXG4gICAgICAgIChtb3VzZW91dCk9XCJoYW5kbGVNb3VzZU91dCgpXCJcbiAgICA+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSBsZXQtc3VnZ2VzdGlvbiBwVGVtcGxhdGU9XCJpdGVtXCI+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwicG9zaXRpb246IHJlbGF0aXZlOyB3aWR0aDogMTAwJTtcIiAobW91c2Vtb3ZlKT1cImhhbmRsZU1vdXNlT3ZlcigkZXZlbnQsIHN1Z2dlc3Rpb24pXCIgKG1vdXNlb3V0KT1cImhhbmRsZU1vdXNlT3V0KClcIj5cbiAgICAgICAgICAgICAgICA8c3ZnICpuZ0lmPVwidmlzdWFsaXplXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBwb3NpdGlvbjogYWJzb2x1dGVcIj5cbiAgICAgICAgICAgICAgICAgICAgPHJlY3QgeD1cIjBcIiB5PVwiMFwiIFthdHRyLndpZHRoXT1cInN1Z2dlc3Rpb24ud2lkdGhcIiBbYXR0ci5maWxsXT1cInN1Z2dlc3Rpb24uY29sb3JcIiBbYXR0ci5zdHJva2VdPVwiJ2JsYWNrJ1wiIFthdHRyLnN0cm9rZS13aWR0aF09XCJzdWdnZXN0aW9uLnRpbWVzdGFtcCA+PSB0aGlzLm9sZE1heFRpbWUhID8gMiA6IDBcIiBbYXR0ci5zdHJva2UtZGFzaGFycmF5XT1cInN1Z2dlc3Rpb24udGltZXN0YW1wID09PSB0aGlzLm1heFRpbWUhID8gJzAgMCcgOiAnNCAxJ1wiIHN0eWxlPVwiaGVpZ2h0OiAxMDAlO1wiPjwvcmVjdD5cbiAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOyBwb3NpdGlvbjogaW5oZXJpdDtcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICB7e3N1Z2dlc3Rpb24ubGFiZWwgPT09IFwiXCIgPyAnJmx0O2VtcHR5Jmd0OycgOiBzdWdnZXN0aW9uLmxhYmVsfX1cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPC9wLWF1dG9Db21wbGV0ZT5cbjwvZGl2PiJdfQ==