import * as i3 from '@angular-slider/ngx-slider';
import { LabelType, SliderComponent as SliderComponent$1, NgxSliderModule } from '@angular-slider/ngx-slider';
import * as i0 from '@angular/core';
import { Injectable, Component, Input, EventEmitter, Output, ViewChild, NgModule } from '@angular/core';
import * as d3 from 'd3';
import isEqual from 'lodash.isequal';
import * as i2 from '@angular/common';
import { CommonModule } from '@angular/common';
import * as i5 from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import * as i1 from 'primeng/tooltip';
import { TooltipModule } from 'primeng/tooltip';
import * as i6 from 'primeng/checkbox';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';
import * as i4 from 'primeng/button';
import { ButtonModule } from 'primeng/button';
import * as i6$1 from 'primeng/radiobutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import * as i7 from 'primeng/multiselect';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import * as i2$1 from 'primeng/api';
import * as i6$2 from 'primeng/autocomplete';
import { AutoComplete, AutoCompleteModule } from 'primeng/autocomplete';
import * as i2$2 from 'primeng/overlaypanel';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import * as i7$1 from 'primeng/dropdown';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
function interpolateLightOranges(d) {
    return d3.interpolateOranges(d / 2);
}
function suffixed(n) {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) {
        return n + "st";
    }
    if (j === 2 && k !== 12) {
        return n + "nd";
    }
    if (j === 3 && k !== 13) {
        return n + "rd";
    }
    return n + "th";
}
function getTooltip() {
    let tooltip = d3.select("#provenance-widgets-tooltip");
    if (!tooltip.empty()) {
        return tooltip;
    }
    tooltip = d3
        .select("body")
        .append("div")
        .attr("id", "provenance-widgets-tooltip")
        .style("position", "fixed")
        .style("z-index", "2000")
        .style("background-color", "var(--surface-100)")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("display", "none")
        .style("opacity", 0)
        .style("width", "max-content");
    // append close button
    tooltip
        .append("button")
        .style("position", "absolute")
        .style("top", "-5px")
        .style("right", "-5px")
        .style("background-color", "var(--surface-300)")
        .style("border", "none", "important")
        .style("border-radius", "20px")
        .style("cursor", "pointer")
        .text("x")
        .on("click", () => {
        tooltip.style("display", "none");
        tooltip.style("opacity", 0);
    });
    // append content div
    tooltip.append("div");
    return tooltip;
}

class ProvenanceWidgetsService {
    resetInteraction() {
        this.interaction = "external";
    }
    constructor() {
        this.dataByOption = {};
        this.selections = [];
        this.minTime = undefined;
        this.oldMaxTime = undefined;
        this.maxTime = undefined;
        this.events = 0;
        this.provenanceMode = "aggregate";
        this.temporalFilterRange = [0, 100];
        this.hasUserInteracted = false;
        this.options = 0;
        this.interaction = "external";
        this.temporalOptions = {
            floor: 0,
            ceil: 100,
            hidePointerLabels: true,
            translate: (value, label) => {
                switch (label) {
                    case LabelType.Floor:
                        return this.mode === "interaction" ? "n=0" : "t=0";
                    case LabelType.Ceil:
                        return "now";
                    default:
                        return `${value}`;
                }
            }
        };
        this.myId = crypto.randomUUID();
        this.tooltip = getTooltip();
    }
    setTemporalRange(change) {
        var _a;
        this.temporalFilterRange = [change.value, change.highValue];
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: (_a = this.self) === null || _a === void 0 ? void 0 : _a.nativeElement.id,
                widget: this.visType,
                mode: this.mode,
                interaction: "brush-end",
                data: {
                    selection: this.temporalFilterRange,
                }
            }
        }));
        this._visualize();
    }
    init(el, crosshairTarget, visType) {
        var _a, _b;
        if ((_b = (_a = el === null || el === void 0 ? void 0 : el.nativeElement) === null || _a === void 0 ? void 0 : _a.style) === null || _b === void 0 ? void 0 : _b.position)
            el.nativeElement.style.position = "relative";
        this.self = el;
        this.crosshairTarget = crosshairTarget;
        this.visType = visType;
    }
    setElement(el) {
        var _a, _b;
        if ((_b = (_a = el === null || el === void 0 ? void 0 : el.nativeElement) === null || _a === void 0 ? void 0 : _a.style) === null || _b === void 0 ? void 0 : _b.position)
            el.nativeElement.style.position = "relative";
        this.self = el;
    }
    resetProvenance() {
        var _a;
        this.dataByOption = {};
        this.selections = [];
        this.minTime = undefined;
        this.oldMaxTime = undefined;
        this.maxTime = undefined;
        this.events = 0;
        this.hasUserInteracted = false;
        // d3.select(this.self?.nativeElement).selectAll("rect").remove()
        const selector = this.crosshairTarget ? document.querySelector(this.crosshairTarget) : (_a = this.self) === null || _a === void 0 ? void 0 : _a.nativeElement;
        d3.select(selector).selectAll("rect").remove();
    }
    setProvenance(provenance) {
        var _a;
        if (!provenance.revalidate) {
            this.dataByOption = provenance.dataByOption;
            this.minTime = provenance.minTime;
            this.oldMaxTime = provenance.oldMaxTime;
            this.maxTime = provenance.maxTime;
            this.events = provenance.events;
            this.hasUserInteracted = provenance.hasUserInteracted;
            this.selections = provenance.selections;
            return;
        }
        this.resetProvenance();
        const selections = provenance.selections;
        for (let i = 0; i < selections.length; i++) {
            this.addSimultaneousEvents((_a = selections[i - 1]) === null || _a === void 0 ? void 0 : _a.value, selections[i].value, false, false, selections[i].timestamp);
        }
        this.hasUserInteracted = true;
    }
    getProvenance() {
        return {
            dataByOption: this.dataByOption,
            minTime: this.minTime,
            oldMaxTime: this.oldMaxTime,
            maxTime: this.maxTime,
            events: this.events,
            hasUserInteracted: this.hasUserInteracted,
            selections: this.selections
        };
    }
    toggleProvenanceMode(btn, vis = true) {
        var _a;
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: (_a = this.self) === null || _a === void 0 ? void 0 : _a.nativeElement.id,
                widget: this.visType,
                mode: this.mode,
                interaction: "provenance-button-click",
                initialProvenanceMode: this.provenanceMode,
            }
        }));
        this.provenanceMode = this.provenanceMode === "aggregate" ? "temporal" : "aggregate";
        d3
            .select(btn)
            .selectChild("span")
            .attr("class", `p-button-icon pi pi-${this.provenanceMode === "aggregate" ? "history" : "chart-bar"}`)
            .style("transform", `rotate(${this.provenanceMode === "aggregate" ? "0" : "90deg"})`);
        Object
            .entries(this.dataByOption)
            .forEach(([key]) => {
            const id = this.myId + key;
            const svg = d3.select(document.getElementById(id));
            svg
                .selectAll("rect")
                .remove();
        });
        if (vis) {
            this._visualize();
        }
    }
    // Do not call this method directly, use addSimultaneousEvents instead
    addEvent(key, event, time) {
        if (this.minTime === undefined) {
            this.minTime = time;
        }
        this.oldMaxTime = this.maxTime || this.minTime;
        this.maxTime = time;
        if (this.dataByOption[key] === undefined) {
            this.dataByOption[key] = [{
                    "select": {
                        date: time,
                        index: this.events
                    }
                }];
            return;
        }
        const len = this.dataByOption[key].length;
        const last = this.dataByOption[key][len - 1];
        if (event === "select") {
            // CASE: Two selects in a row, do nothing
            if (!last["unselect"]) {
                return;
            }
            // CASE: Select after unselect, create a new entry
            this.dataByOption[key].push({
                [event]: {
                    date: time,
                    index: this.events
                }
            });
        }
        else {
            // CASE: Two unselects in a row, do nothing
            if (!last["select"]) {
                return;
            }
            // CASE: Unselect after select, update the last entry
            last[event] = {
                date: time,
                index: this.events
            };
        }
    }
    addSimultaneousEvents(oldValues, newValues, freeze, hasUserInteracted, time = new Date(), emitter, visualize) {
        var _a, _b;
        const oldSet = new Set(freeze ? oldValues : (_a = this.selections.at(-1)) === null || _a === void 0 ? void 0 : _a.value);
        const newSet = new Set(newValues);
        const symDiff = new Set([...oldSet].filter(x => !newSet.has(x)).concat(newValues.filter(x => !oldSet.has(x))));
        const selected = [...symDiff].filter(v => newSet.has(v));
        const unselected = [...symDiff].filter(v => oldSet.has(v));
        if (hasUserInteracted) {
            this.hasUserInteracted = true;
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: (_b = this.self) === null || _b === void 0 ? void 0 : _b.nativeElement.id,
                    widget: this.visType,
                    mode: this.mode,
                    interaction: this.interaction,
                    data: {
                        selected,
                        unselected,
                        timestamp: new Date(),
                        interaction: this.events + 1
                    }
                }
            }));
        }
        if (freeze)
            return;
        unselected.forEach((key) => {
            this.addEvent(key, "unselect", time);
        });
        selected.forEach((key) => {
            this.addEvent(key, "select", time);
        });
        this.selections.push({ value: newValues, timestamp: time });
        this.events++;
        this.interaction = "external";
        emitter === null || emitter === void 0 ? void 0 : emitter.emit(this.getProvenance());
        visualize === null || visualize === void 0 ? void 0 : visualize();
    }
    visualize(mode, width, height, margin) {
        this.mode = mode;
        this.width = width;
        this.height = height;
        this.margin = margin;
        this._visualize();
    }
    _visualize() {
        var _a;
        if (!this.minTime)
            return;
        const mode = this.mode;
        const width = this.width;
        const height = this.height;
        const margin = this.margin;
        const scaleFilterToDate = d3.scaleLinear().domain([0, 100]).range([this.minTime, this.maxTime]);
        const scaleFilterToEvents = d3.scaleLinear().domain([0, 100]).range([0, this.events]);
        const temporalDateRange = this.temporalFilterRange.map(scaleFilterToDate);
        const temporalEventRange = this.temporalFilterRange.map(scaleFilterToEvents);
        const x = mode === "interaction" ? d3.scaleLinear().domain(temporalEventRange) : d3.scaleTime().domain(temporalDateRange);
        x.range([0, width]);
        const aggX = d3
            .scaleLinear()
            .domain([0, d3.max(Object.values(this.dataByOption), d => this.visType === "radio" || this.visType === "select" ?
                d.length :
                d.reduce((a, v) => a + (v.unselect ? 1 : 0) + 1, 0))
        ]).range([0, width]);
        const color = d3
            .scaleSequential(interpolateLightOranges)
            .domain(mode === "interaction" ?
            [0, this.events] :
            [this.minTime.getTime(), this.maxTime.getTime()]);
        const selector = this.crosshairTarget ? document.querySelector(this.crosshairTarget) : (_a = this.self) === null || _a === void 0 ? void 0 : _a.nativeElement;
        let left = selector.offsetWidth - width; // - (this.margin ? 0 : convertRemToPixels(1.25))
        if (!this.margin)
            left -= 40;
        if (this.visType === "multiselect")
            left -= 22;
        Object
            .entries(this.dataByOption)
            .forEach(([key, value], keyIndex) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const id = this.myId + key;
            const svg = d3.select(document.getElementById(id));
            svg
                .attr("width", width)
                .attr("height", height)
                .style("margin", margin || "0");
            if (this.provenanceMode === "aggregate") {
                let rect = svg
                    .select("rect");
                if (rect.empty()) {
                    rect = svg
                        .append("rect");
                }
                const last = value[value.length - 1];
                const selectDate = ((_a = last.select) === null || _a === void 0 ? void 0 : _a.date.getTime()) || 0;
                const unselectDate = ((_c = (_b = last.unselect) === null || _b === void 0 ? void 0 : _b.date) === null || _c === void 0 ? void 0 : _c.getTime()) || 0;
                const ev = this.visType === "radio" || this.visType === "select" ? "select" : "interact";
                const date = this.visType === "radio" || this.visType === "select" ? selectDate : Math.max(selectDate, unselectDate);
                rect
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", aggX(this.visType === "radio" || this.visType === "select" ?
                    value.length :
                    value.reduce((a, v) => a + (v.unselect ? 1 : 0) + 1, 0)))
                    .attr("height", height)
                    .attr("fill", color(mode === "interaction" ? ((_d = last.unselect) === null || _d === void 0 ? void 0 : _d.index) || ((_e = last.select) === null || _e === void 0 ? void 0 : _e.index) : date))
                    .attr("stroke", "black")
                    .attr("stroke-width", date >= ((_f = this.oldMaxTime) === null || _f === void 0 ? void 0 : _f.getTime()) ? 2 : 0)
                    .attr("stroke-dasharray", date === ((_g = this.maxTime) === null || _g === void 0 ? void 0 : _g.getTime()) ? "0 0" : "4 1");
                d3.select((_h = svg.node()) === null || _h === void 0 ? void 0 : _h.parentElement)
                    .on("mouseover", (e) => {
                    var _a, _b, _c, _d, _e;
                    if (this.provenanceMode === "temporal")
                        return;
                    dispatchEvent(new CustomEvent("provenance-widgets", {
                        detail: {
                            id: (_a = this.self) === null || _a === void 0 ? void 0 : _a.nativeElement.id,
                            widget: this.visType,
                            mode: this.mode,
                            interaction: "aggregate-rect-hover",
                            data: {
                                key,
                                value: value.map(v => ({
                                    select: v.select,
                                    unselect: v.unselect
                                }))
                            }
                        }
                    }));
                    const { clientX: x, clientY: y } = e;
                    this.tooltip
                        .style("opacity", 1)
                        .style("display", "block")
                        .style("left", `${x + 10}px`)
                        .style("top", `${y + 10}px`)
                        .select("div")
                        .html(`
                  Label: ${((_d = (_c = (_b = this.self) === null || _b === void 0 ? void 0 : _b.nativeElement) === null || _c === void 0 ? void 0 : _c.dataset) === null || _d === void 0 ? void 0 : _d.label) || ((_e = this.self) === null || _e === void 0 ? void 0 : _e.nativeElement.id)} <br/>
                  Selected value: ${key}<br/>
                  # times ${["select", "radio"].some(v => v === this.visType) ? `selected: ${value.length}` : `interacted: ${value.reduce((a, v) => a + (v.unselect ? 1 : 0) + 1, 0)}`}<br/>
                  Last ${ev}ed at: ${(new Date(date)).toLocaleString()}<br/>                  
                `);
                })
                    .on("mouseout", () => {
                    this.tooltip
                        .style("opacity", 0)
                        .style("display", "none");
                });
            }
            else {
                svg
                    .selectAll("rect")
                    .data(value)
                    .join("rect")
                    .attr("x", d => x(d.select[mode === "interaction" ? "index" : "date"]))
                    .attr("y", 0)
                    .attr("width", d => {
                    var _a, _b;
                    return x(mode === "interaction" ?
                        ((_a = d.unselect) === null || _a === void 0 ? void 0 : _a.index) || this.events
                        :
                            ((_b = d.unselect) === null || _b === void 0 ? void 0 : _b.date) || this.maxTime)
                        -
                            x(mode === "interaction" ?
                                d.select.index :
                                d.select.date);
                })
                    .attr("height", height)
                    .attr("fill", (v, i, a) => {
                    var _a, _b;
                    return i === a.length - 1 ?
                        color(mode === "interaction" ?
                            ((_a = v.unselect) === null || _a === void 0 ? void 0 : _a.index) || this.events :
                            ((_b = v.unselect) === null || _b === void 0 ? void 0 : _b.date) || this.maxTime) :
                        "#E5E5E5";
                })
                    .attr("opacity", 1)
                    .attr("data-key", key)
                    .attr("data-value", d => JSON.stringify(d, null, '\t'))
                    .attr("data-index", keyIndex);
                d3.select((_j = svg.node()) === null || _j === void 0 ? void 0 : _j.parentElement)
                    .on("mouseout", () => {
                    this.tooltip
                        .style("opacity", 0)
                        .style("display", "none");
                })
                    .on("mousemove", (e) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    let [mouse_x] = d3.pointer(e);
                    mouse_x -= left;
                    let [rects, unselectedRects] = d3
                        .select(selector)
                        .selectAll("rect")
                        .nodes()
                        .reduce((acc, rect) => {
                        const x = parseInt(rect.getAttribute("x"));
                        const width = parseInt(rect.getAttribute("width"));
                        if (x <= mouse_x && x + width >= mouse_x) {
                            acc[0].push(rect);
                        }
                        else {
                            acc[1].push(rect);
                        }
                        return acc;
                    }, [[], []]);
                    if (rects.every((rect) => rect.getAttribute("data-key") !== key)) {
                        rects = [];
                        unselectedRects = d3
                            .select(selector)
                            .selectAll("rect")
                            .nodes();
                    }
                    d3
                        .selectAll(rects)
                        .style("stroke", "var(--blue-500)");
                    d3
                        .selectAll(unselectedRects)
                        .style("stroke", "none");
                    const keys = new Set(rects.map((rect) => rect.getAttribute("data-key")));
                    for (const key of Object.keys(this.dataByOption)) {
                        let parent = (_a = document.getElementById(`${this.myId}${key}`)) === null || _a === void 0 ? void 0 : _a.parentElement;
                        if (!parent)
                            continue;
                        if (this.crosshairTarget)
                            parent = parent.parentElement;
                        const inputParent = d3
                            .select(parent)
                            .selectChildren()
                            .nodes()
                            .filter((e) => e.id !== `${this.myId}${key}`)[0];
                        let child = d3
                            .select(inputParent)
                            .selectChild();
                        if (!this.crosshairTarget) {
                            child = child.select("div:nth-child(2)");
                        }
                        child.style("border-color", keys.has(key) ? "var(--blue-500)" : "#ced4da");
                    }
                    const rect = rects.find((rect) => rect.getAttribute("data-key") === key);
                    if (!rect) {
                        this.temporalRectKV = undefined;
                        this.tooltip
                            .style("opacity", 0)
                            .style("display", "none");
                        return;
                    }
                    const d = JSON.parse(rect.getAttribute("data-value"));
                    const startDate = new Date(d.select.date);
                    const endDate = new Date(((_b = d.unselect) === null || _b === void 0 ? void 0 : _b.date) || new Date());
                    let selectionTime = d3.timeSecond.count(startDate, endDate);
                    if (selectionTime > 60)
                        selectionTime = d3.timeMinute.count(startDate, endDate) + "m";
                    else {
                        selectionTime = selectionTime + "s";
                    }
                    const { clientX: x, clientY: y } = e;
                    this.tooltip
                        .style("opacity", 1)
                        .style("display", "block")
                        .style("left", `${x + 10}px`)
                        .style("top", `${y + 10}px`)
                        .select("div")
                        .html(`
                  Label: ${((_e = (_d = (_c = this.self) === null || _c === void 0 ? void 0 : _c.nativeElement) === null || _d === void 0 ? void 0 : _d.dataset) === null || _e === void 0 ? void 0 : _e.label) || ((_f = this.self) === null || _f === void 0 ? void 0 : _f.nativeElement.id)} <br/>
                  Selected value: ${key}<br/>
                  Selected at: ${startDate.toLocaleString()}
                  ${d.unselect ? `<br/>Unselected at: ${new Date(d.unselect.date).toLocaleString()}` : ""}<br/>
                  Selected for: ${selectionTime}
                `);
                    const kv = [key, d];
                    if (isEqual(kv, this.temporalRectKV)) {
                        return;
                    }
                    this.temporalRectKV = kv;
                    dispatchEvent(new CustomEvent("provenance-widgets", {
                        detail: {
                            id: (_g = this.self) === null || _g === void 0 ? void 0 : _g.nativeElement.id,
                            widget: this.visType,
                            mode: this.mode,
                            interaction: "temporal-rect-hover",
                            data: {
                                key,
                                value: d
                            }
                        }
                    }));
                })
                    .on("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    let [mouse_x] = d3.pointer(e);
                    mouse_x -= left;
                    const rects = d3
                        .select(selector)
                        .selectAll("rect")
                        .nodes()
                        .filter((rect) => {
                        const x = parseInt(rect.getAttribute("x"));
                        const width = parseInt(rect.getAttribute("width"));
                        return x <= mouse_x && x + width >= mouse_x;
                    });
                    if (rects.every((rect) => rect.getAttribute("data-key") !== key)) {
                        return;
                    }
                    const keys = new Set(rects.map((rect) => rect.getAttribute("data-key")));
                    this.interaction = "temporal-rect-click";
                    this.crosshairSelect([...keys]);
                });
            }
        });
    }
}
ProvenanceWidgetsService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
ProvenanceWidgetsService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return []; } });

class ProvenanceWidgetsComponent {
}
ProvenanceWidgetsComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
ProvenanceWidgetsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: ProvenanceWidgetsComponent, selector: "lib-provenance-widgets", ngImport: i0, template: `
    <p>
      provenance-widgets works!
    </p>
  `, isInline: true });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsComponent, decorators: [{
            type: Component,
            args: [{ selector: 'lib-provenance-widgets', template: `
    <p>
      provenance-widgets works!
    </p>
  ` }]
        }] });

const MARGINS = {
    top: 20,
    right: 50,
    bottom: 30,
    left: 50
};
const DEFAULT_HEIGHT = 250;
const TICK_OFFSET = 10;
const THUMB_OFFSET = 32;
const LINE_CIRCLE_DIAMETER = 8;
const MODE = "interaction";
const AGGREGATE_SVG_BASE64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmlld0JveD0iLTMgLTMgNjcuNDg3IDEwNiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQogIDxnPg0KICA8cGF0aCBzdHJva2U9IiMyYzNlNTAiIHN0cm9rZS13aWR0aD0iNXB4IiBmaWxsPSJub25lIiBkPSJNMzcuMjY3LDgzLjY4MWMtMi4zNDYsNS45MzItNC4xMzMsMTQuMTgzLDIuNjU1LDE1Ljk5YzEwLjQyNywyLjc3MiwxMS45MDctMTIuODk2LDExLjkwNy0xMi44OTYNCglMMzcuMjY3LDgzLjY4MXoiLz4NCiAgPHBhdGggc3Ryb2tlPSIjMmMzZTUwIiBzdHJva2Utd2lkdGg9IjVweCIgZmlsbD0ibm9uZSIgZD0iTTYwLjc0Miw2My4zODZjMS41NTgtOC4xMTQsMS40NjctMjEuOTU3LTguMjcxLTI1LjM5NGMtMi40LTAuODQ4LTExLjQ2Ny0zLjAwNi0xNS4xMjYsMTIuOTU2DQoJYy0yLjY1MSwxMS42MTIsMS40ODgsMjUuNTM5LDEuNDg4LDI1LjUzOWwxNC43MjUsMy4xMzJDNTMuNTYsNzkuNjE4LDU5LjY5OCw2OC44MTQsNjAuNzQyLDYzLjM4NnoiLz4NCiAgPHBhdGggc3Ryb2tlPSIjMmMzZTUwIiBzdHJva2Utd2lkdGg9IjVweCIgZmlsbD0ibm9uZSIgZD0iTTIxLjM2Niw0Ny4zMTljMS43MTYsNi4xNDIsMi42MzMsMTQuNTM0LTQuMzExLDE1LjYyM0M2LjQsNjQuNjExLDYuNTY1LDQ4Ljg3NSw2LjU2NSw0OC44NzVMMjEuMzY2LDQ3LjMxOXoNCgkiLz4NCiAgPHBhdGggc3Ryb2tlPSIjMmMzZTUwIiBzdHJva2Utd2lkdGg9IjVweCIgZmlsbD0ibm9uZSIgZD0iTTAuMTQ2LDI0LjY3OUMtMC41NTUsMTYuNDQ3LDAuOTgsMi42OSwxMS4wMjgsMC4yODdDMTMuNS0wLjMwNiwyMi43NDEtMS41MDEsMjQuNzExLDE0Ljc1NQ0KCWMxLjQzMSwxMS44MjctNC4xNTEsMjUuMjQzLTQuMTUxLDI1LjI0M2wtMTQuOTcsMS41NzVDNS41ODksNDEuNTczLDAuNjEyLDMwLjE5LDAuMTQ2LDI0LjY3OXoiLz4NCiAgICA8L2c+DQo8L3N2Zz4=";
const TEMPORAL_SVG_BASE64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmlld0JveD0iLTMgLTMgNjcuNDg3IDEwNiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQogIDxnPg0KICA8cGF0aCBzdHJva2U9IiMyYzNlNTAiIHN0cm9rZS13aWR0aD0iNXB4IiBmaWxsPSIjMmMzZTUwIiBkPSJNMzcuMjY3LDgzLjY4MWMtMi4zNDYsNS45MzItNC4xMzMsMTQuMTgzLDIuNjU1LDE1Ljk5YzEwLjQyNywyLjc3MiwxMS45MDctMTIuODk2LDExLjkwNy0xMi44OTYNCglMMzcuMjY3LDgzLjY4MXoiLz4NCiAgPHBhdGggc3Ryb2tlPSIjMmMzZTUwIiBzdHJva2Utd2lkdGg9IjVweCIgZmlsbD0iIzJjM2U1MCIgZD0iTTYwLjc0Miw2My4zODZjMS41NTgtOC4xMTQsMS40NjctMjEuOTU3LTguMjcxLTI1LjM5NGMtMi40LTAuODQ4LTExLjQ2Ny0zLjAwNi0xNS4xMjYsMTIuOTU2DQoJYy0yLjY1MSwxMS42MTIsMS40ODgsMjUuNTM5LDEuNDg4LDI1LjUzOWwxNC43MjUsMy4xMzJDNTMuNTYsNzkuNjE4LDU5LjY5OCw2OC44MTQsNjAuNzQyLDYzLjM4NnoiLz4NCiAgPHBhdGggc3Ryb2tlPSIjMmMzZTUwIiBzdHJva2Utd2lkdGg9IjVweCIgZmlsbD0iIzJjM2U1MCIgZD0iTTIxLjM2Niw0Ny4zMTljMS43MTYsNi4xNDIsMi42MzMsMTQuNTM0LTQuMzExLDE1LjYyM0M2LjQsNjQuNjExLDYuNTY1LDQ4Ljg3NSw2LjU2NSw0OC44NzVMMjEuMzY2LDQ3LjMxOXoNCgkiLz4NCiAgPHBhdGggc3Ryb2tlPSIjMmMzZTUwIiBzdHJva2Utd2lkdGg9IjVweCIgZmlsbD0iIzJjM2U1MCIgZD0iTTAuMTQ2LDI0LjY3OUMtMC41NTUsMTYuNDQ3LDAuOTgsMi42OSwxMS4wMjgsMC4yODdDMTMuNS0wLjMwNiwyMi43NDEtMS41MDEsMjQuNzExLDE0Ljc1NQ0KCWMxLjQzMSwxMS44MjctNC4xNTEsMjUuMjQzLTQuMTUxLDI1LjI0M2wtMTQuOTcsMS41NzVDNS41ODksNDEuNTczLDAuNjEyLDMwLjE5LDAuMTQ2LDI0LjY3OXoiLz4NCiAgICA8L2c+DQo8L3N2Zz4=";
const DISABLED_SVG_BASE64 = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmlld0JveD0iLTMgLTMgNjcuNDg3IDEwNiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQogIDxnPg0KICAgIDxwYXRoIHN0cm9rZT0iIzdmOGM4ZCIgc3Ryb2tlLXdpZHRoPSI1cHgiIGZpbGw9Im5vbmUiIGQ9Ik0zNy4yNjcsODMuNjgxYy0yLjM0Niw1LjkzMi00LjEzMywxNC4xODMsMi42NTUsMTUuOTljMTAuNDI3LDIuNzcyLDExLjkwNy0xMi44OTYsMTEuOTA3LTEyLjg5NiBMMzcuMjY3LDgzLjY4MXoiLz4NCiAgICA8cGF0aCBzdHJva2U9IiM3ZjhjOGQiIHN0cm9rZS13aWR0aD0iNXB4IiBmaWxsPSJub25lIiBkPSJNNjAuNzQyLDYzLjM4NmMxLjU1OC04LjExNCwxLjQ2Ny0yMS45NTctOC4yNzEtMjUuMzk0Yy0yLjQtMC44NDgtMTEuNDY3LTMuMDA2LTE1LjEyNiwxMi45NTYgYy0yLjY1MSwxMS42MTIsMS40ODgsMjUuNTM5LDEuNDg4LDI1LjUzOWwxNC43MjUsMy4xMzJDNTMuNTYsNzkuNjE4LDU5LjY5OCw2OC44MTQsNjAuNzQyLDYzLjM4NnoiLz4NCiAgICA8cGF0aCBzdHJva2U9IiM3ZjhjOGQiIHN0cm9rZS13aWR0aD0iNXB4IiBmaWxsPSJub25lIiBkPSJNMjEuMzY2LDQ3LjMxOWMxLjcxNiw2LjE0MiwyLjYzMywxNC41MzQtNC4zMTEsMTUuNjIzQzYuNCw2NC42MTEsNi41NjUsNDguODc1LDYuNTY1LDQ4Ljg3NUwyMS4zNjYsNDcuMzE5eiIvPg0KICAgIDxwYXRoIHN0cm9rZT0iIzdmOGM4ZCIgc3Ryb2tlLXdpZHRoPSI1cHgiIGZpbGw9Im5vbmUiIGQ9Ik0wLjE0NiwyNC42NzlDLTAuNTU1LDE2LjQ0NywwLjk4LDIuNjksMTEuMDI4LDAuMjg3QzEzLjUtMC4zMDYsMjIuNzQxLTEuNTAxLDI0LjcxMSwxNC43NTUgYzEuNDMxLDExLjgyNy00LjE1MSwyNS4yNDMtNC4xNTEsMjUuMjQzbC0xNC45NywxLjU3NUM1LjU4OSw0MS41NzMsMC42MTIsMzAuMTkwLDAuMTQ2LDI0LjY3OXoiLz4NCiAgICA8bGluZSB4MT0iMCIgeTE9IjAiIHgyPSI2MCIgeTI9IjEwMCIgc3Ryb2tlPSIjN2Y4YzhkIiBzdHJva2Utd2lkdGg9IjUiLz4NCiAgPC9nPg0KPC9zdmc+";

class IconComponent {
    constructor() {
        this.AGGREGATE_B64 = AGGREGATE_SVG_BASE64;
        this.TEMPORAL_B64 = TEMPORAL_SVG_BASE64;
        this.DISABLED_B64 = DISABLED_SVG_BASE64;
        this.tooltipText = '';
    }
    ngOnChanges(changes) {
        if (changes["icon"].currentValue) {
            const icon = changes["icon"].currentValue;
            this.tooltipText = '<small>';
            if (icon === 'aggregate') {
                this.tooltipText += `<strong>Aggregate mode</strong><br/>Showing overall frequency (larger size = more) and recency (darker color = more) of past interactions.<br />Click to toggle.`;
            }
            else if (icon === 'temporal') {
                this.tooltipText += `<strong>Temporal mode</strong><br/>Showing individual past interactions over the selected time period.<br />Click to toggle.`;
            }
            else if (icon === 'disabled') {
                this.tooltipText += `<strong>No provenance yet.</strong><br/>Interact with the widget to generate/see provenance.`;
            }
            this.tooltipText += '</small>';
        }
    }
}
IconComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: IconComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
IconComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: IconComponent, selector: "provenance-icon", inputs: { icon: "icon", size: "size" }, usesOnChanges: true, ngImport: i0, template: "<img\n    [width]=\"size || 32\"\n    [height]=\"size || 32\"\n    [src]=\"icon === 'aggregate' ? AGGREGATE_B64 : icon === 'temporal' ? TEMPORAL_B64 : DISABLED_B64\"\n    style=\"vertical-align: initial;\"\n    [pTooltip]=\"tooltipText\"\n    [tooltipOptions]=\"{ \n        escape: false,\n        hideOnEscape: true,\n        showDelay: 500,\n        tooltipStyleClass: 'provenance-icon-tooltip'\n    }\"\n/>", styles: ["::ng-deep{.provenance-icon-tooltip {width: max-content !important; max-width: 335px !important;}}\n"], dependencies: [{ kind: "directive", type: i1.Tooltip, selector: "[pTooltip]", inputs: ["tooltipPosition", "tooltipEvent", "appendTo", "positionStyle", "tooltipStyleClass", "tooltipZIndex", "escape", "showDelay", "hideDelay", "life", "positionTop", "positionLeft", "autoHide", "fitContent", "hideOnEscape", "pTooltip", "tooltipDisabled", "tooltipOptions"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: IconComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-icon', template: "<img\n    [width]=\"size || 32\"\n    [height]=\"size || 32\"\n    [src]=\"icon === 'aggregate' ? AGGREGATE_B64 : icon === 'temporal' ? TEMPORAL_B64 : DISABLED_B64\"\n    style=\"vertical-align: initial;\"\n    [pTooltip]=\"tooltipText\"\n    [tooltipOptions]=\"{ \n        escape: false,\n        hideOnEscape: true,\n        showDelay: 500,\n        tooltipStyleClass: 'provenance-icon-tooltip'\n    }\"\n/>", styles: ["::ng-deep{.provenance-icon-tooltip {width: max-content !important; max-width: 335px !important;}}\n"] }]
        }], propDecorators: { icon: [{
                type: Input
            }], size: [{
                type: Input
            }] } });

class CheckboxComponent extends Checkbox {
    get selected() {
        return this._selected;
    }
    set selected(value) {
        if (!this.firstChange && !isEqual(this._selected, value)) {
            this.change(value || []);
        }
        this.firstChange = false;
        this._selected = value;
    }
    get provenance() {
        return this._provenance;
    }
    set provenance(value) {
        if (this._provenance && (value === null || value === void 0 ? void 0 : value.revalidate)) {
            this._provenance = value;
            this.ngOnInit();
            this._visualize();
            return;
        }
        this._provenance = value;
    }
    constructor(mss, el, cd) {
        super(cd);
        this.mss = mss;
        this.el = el;
        this.firstChange = true;
        this.mode = MODE;
        this.visualize = true;
        this.freeze = false;
        this.selectedChange = new EventEmitter();
        this.interval = NaN;
        this.provenanceChange = new EventEmitter();
        mss.init(el, undefined, "checkbox");
        mss.crosshairSelect = (keys) => {
            this.selectedChange.emit(keys);
        };
    }
    ngOnInit() {
        var _a, _b;
        this.mss.options = this.data.length;
        this.mss.mode = this.mode;
        if (((_a = this.provenance) === null || _a === void 0 ? void 0 : _a.hasUserInteracted) || ((_b = this.provenance) === null || _b === void 0 ? void 0 : _b.revalidate)) {
            this.mss.setProvenance(this.provenance);
            this.selected = Object
                .entries(this.mss.getProvenance().dataByOption)
                .filter(([_, v]) => {
                const last = v.at(-1);
                return last && last.unselect === undefined && last.select !== undefined;
            })
                .map(([k, _]) => k);
            return;
        }
        if (this.selected) {
            this.mss.addSimultaneousEvents([], this.selected, this.freeze, false);
        }
    }
    ngAfterViewInit() {
        var _a;
        this.mss.setElement(this.el);
        if ((_a = this.mss.getProvenance()) === null || _a === void 0 ? void 0 : _a.hasUserInteracted)
            this._visualize();
    }
    getId() {
        return this.mss.myId;
    }
    ngOnDestroy() {
        clearInterval(this.interval);
    }
    change(e) {
        this.mss.addSimultaneousEvents(this.selected || [], e, this.freeze, true, new Date(), this.provenanceChange, this._visualize.bind(this));
    }
    _visualize() {
        if (!this.visualize)
            return;
        // TODO: Remove magic numbers
        const width = this.el.nativeElement.offsetWidth - 22 - 8; // checkbox width + margin
        const height = 22;
        this.mss.visualize(this.mode, width, height, "0 0 0 30px");
    }
    getProvenance() {
        return this.mss;
    }
}
CheckboxComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CheckboxComponent, deps: [{ token: ProvenanceWidgetsService }, { token: i0.ElementRef }, { token: i0.ChangeDetectorRef }], target: i0.ɵɵFactoryTarget.Component });
CheckboxComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: CheckboxComponent, selector: "provenance-checkbox", inputs: { mode: "mode", data: "data", selected: "selected", visualize: "visualize", freeze: "freeze", provenance: "provenance" }, outputs: { selectedChange: "selectedChange", provenanceChange: "provenanceChange" }, providers: [ProvenanceWidgetsService], usesInheritance: true, ngImport: i0, template: "<div\n    style=\"display: flex; margin-bottom: 1rem; margin-top: 1rem;\"\n>\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [style]=\"{'margin-right': '0.5rem', 'height': '22px', 'width': '22px', 'padding': '0px', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"getProvenance().toggleProvenanceMode(btn, true)\"\n    >\n    <provenance-icon \n        [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n        [size]=\"20\"\n        style=\"height: 20px;\"\n    ></provenance-icon>\n    </button>\n    <div class=\"custom-slider\" style=\"width: 100%\">\n        <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n            style=\"margin-top: 0px\"\n        >\n        </ngx-slider>\n    </div>\n</div>\n<div \n    *ngFor=\"let d of data\" \n    class=\"field-checkbox\"\n    style=\"position: relative;\"\n>\n    <svg\n        [id]=\"getId() + d[value || 'value']\"\n        width=\"0\"\n        height=\"0\"\n        style=\"position: absolute;\"\n    >\n    </svg>\n    <p-checkbox\n        [inputId]=\"d[inputId || 'inputId'] || null\"\n        [name]=\"d[name || 'name'] || null\"\n        [value]=\"d[value || 'value'] || null\"\n        [label]=\"d[label || 'label'] || null\"\n        [disabled]=\"d['disabled'] || false\"\n        [binary]=\"d['binary'] || false\"\n        [tabindex]=\"d['tabindex'] || null\"\n        [style]=\"d['style'] || style || null\"\n        [styleClass]=\"d['styleClass'] || styleClass || null\"\n        [labelStyleClass]=\"d['labelStyleClass'] || labelStyleClass || null\"\n        [checkboxIcon]=\"d['checkboxIcon'] || 'pi pi-check'\"\n        [readonly]=\"d['readonly'] || false\"\n        [required]=\"d['required'] || false\"\n        [trueValue]=\"d['trueValue'] || true\"\n        [falseValue]=\"d['falseValue'] || false\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n        (onChange)=\"onChange\"\n    >\n    </p-checkbox>\n</div>", styles: ["::ng-deep p-checkbox{z-index:2}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"], dependencies: [{ kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "component", type: i3.SliderComponent, selector: "ngx-slider", inputs: ["value", "highValue", "options", "manualRefresh", "triggerFocus"], outputs: ["valueChange", "highValueChange", "userChangeStart", "userChange", "userChangeEnd"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "directive", type: i5.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i5.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i5.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i6.Checkbox, selector: "p-checkbox", inputs: ["value", "name", "disabled", "binary", "label", "ariaLabelledBy", "ariaLabel", "tabindex", "inputId", "style", "styleClass", "labelStyleClass", "formControl", "checkboxIcon", "readonly", "required", "trueValue", "falseValue"], outputs: ["onChange"] }, { kind: "component", type: IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: CheckboxComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-checkbox', providers: [ProvenanceWidgetsService], template: "<div\n    style=\"display: flex; margin-bottom: 1rem; margin-top: 1rem;\"\n>\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [style]=\"{'margin-right': '0.5rem', 'height': '22px', 'width': '22px', 'padding': '0px', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"getProvenance().toggleProvenanceMode(btn, true)\"\n    >\n    <provenance-icon \n        [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n        [size]=\"20\"\n        style=\"height: 20px;\"\n    ></provenance-icon>\n    </button>\n    <div class=\"custom-slider\" style=\"width: 100%\">\n        <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n            style=\"margin-top: 0px\"\n        >\n        </ngx-slider>\n    </div>\n</div>\n<div \n    *ngFor=\"let d of data\" \n    class=\"field-checkbox\"\n    style=\"position: relative;\"\n>\n    <svg\n        [id]=\"getId() + d[value || 'value']\"\n        width=\"0\"\n        height=\"0\"\n        style=\"position: absolute;\"\n    >\n    </svg>\n    <p-checkbox\n        [inputId]=\"d[inputId || 'inputId'] || null\"\n        [name]=\"d[name || 'name'] || null\"\n        [value]=\"d[value || 'value'] || null\"\n        [label]=\"d[label || 'label'] || null\"\n        [disabled]=\"d['disabled'] || false\"\n        [binary]=\"d['binary'] || false\"\n        [tabindex]=\"d['tabindex'] || null\"\n        [style]=\"d['style'] || style || null\"\n        [styleClass]=\"d['styleClass'] || styleClass || null\"\n        [labelStyleClass]=\"d['labelStyleClass'] || labelStyleClass || null\"\n        [checkboxIcon]=\"d['checkboxIcon'] || 'pi pi-check'\"\n        [readonly]=\"d['readonly'] || false\"\n        [required]=\"d['required'] || false\"\n        [trueValue]=\"d['trueValue'] || true\"\n        [falseValue]=\"d['falseValue'] || false\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n        (onChange)=\"onChange\"\n    >\n    </p-checkbox>\n</div>", styles: ["::ng-deep p-checkbox{z-index:2}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"] }]
        }], ctorParameters: function () { return [{ type: ProvenanceWidgetsService }, { type: i0.ElementRef }, { type: i0.ChangeDetectorRef }]; }, propDecorators: { mode: [{
                type: Input
            }], data: [{
                type: Input
            }], selected: [{
                type: Input
            }], visualize: [{
                type: Input
            }], freeze: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], provenance: [{
                type: Input
            }], provenanceChange: [{
                type: Output
            }] } });

class RadiobuttonComponent {
    // @Input() selected?: string
    get selected() {
        return this._selected;
    }
    set selected(value) {
        if (!this.firstChange && !isEqual(this._selected, value)) {
            this.change(value);
        }
        this.firstChange = false;
        this._selected = value;
    }
    get provenance() {
        return this._provenance;
    }
    set provenance(value) {
        if (this._provenance && (value === null || value === void 0 ? void 0 : value.revalidate)) {
            this._provenance = value;
            this.ngOnInit();
            this._visualize();
        }
        this._provenance = value;
    }
    constructor(mss, el) {
        this.mss = mss;
        this.el = el;
        /**
         * Callback to invoke on radio button click.
         * @param {RadioButtonClickEvent} event - Custom click event.
         * @group Emits
         */
        this.onClick = new EventEmitter();
        /**
         * Callback to invoke when the receives focus.
         * @param {Event} event - Browser event.
         * @group Emits
         */
        this.onFocus = new EventEmitter();
        /**
         * Callback to invoke when the loses focus.
         * @param {Event} event - Browser event.
         * @group Emits
         */
        this.onBlur = new EventEmitter();
        this.firstChange = true;
        this.mode = MODE;
        this.visualize = true;
        this.freeze = false;
        this.selectedChange = new EventEmitter();
        this.interval = NaN;
        this.provenanceChange = new EventEmitter();
        mss.init(el, undefined, "radio");
        mss.crosshairSelect = (keys) => {
            this.selectedChange.emit(keys[0]);
        };
    }
    ngOnInit() {
        var _a, _b;
        this.mss.options = this.data.length;
        this.mss.mode = this.mode;
        if (((_a = this.provenance) === null || _a === void 0 ? void 0 : _a.hasUserInteracted) || ((_b = this.provenance) === null || _b === void 0 ? void 0 : _b.revalidate)) {
            this.mss.setProvenance(this.provenance);
            this.selected = Object
                .entries(this.mss.getProvenance().dataByOption)
                .filter(([_, v]) => {
                const last = v.at(-1);
                return last && last.unselect === undefined && last.select !== undefined;
            })
                .map(([k, _]) => k)[0];
            return;
        }
        if (this.selected) {
            this.mss.addSimultaneousEvents([], [this.selected], this.freeze, false);
        }
    }
    ngAfterViewInit() {
        var _a;
        this.mss.setElement(this.el);
        if ((_a = this.mss.getProvenance()) === null || _a === void 0 ? void 0 : _a.hasUserInteracted)
            this._visualize();
    }
    getId() {
        return this.mss.myId;
    }
    ngOnDestroy() {
        clearInterval(this.interval);
    }
    change(e) {
        this.mss.addSimultaneousEvents(this.selected ? [this.selected] : [], e ? [e] : [], this.freeze, true, new Date(), this.provenanceChange, this._visualize.bind(this));
    }
    _visualize() {
        if (!this.visualize)
            return;
        // TODO: Remove magic numbers
        const width = this.el.nativeElement.offsetWidth - 22 - 8; // radiobutton width + margin
        const height = 22;
        this.mss.visualize(this.mode, width, height, "0 0 0 30px");
    }
    getProvenance() {
        return this.mss;
    }
}
RadiobuttonComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: RadiobuttonComponent, deps: [{ token: ProvenanceWidgetsService }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Component });
RadiobuttonComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: RadiobuttonComponent, selector: "provenance-radiobutton", inputs: { value: "value", formControlName: "formControlName", name: "name", disabled: "disabled", label: "label", tabindex: "tabindex", inputId: "inputId", ariaLabelledBy: "ariaLabelledBy", ariaLabel: "ariaLabel", style: "style", styleClass: "styleClass", labelStyleClass: "labelStyleClass", mode: "mode", data: "data", selected: "selected", visualize: "visualize", freeze: "freeze", provenance: "provenance" }, outputs: { onClick: "onClick", onFocus: "onFocus", onBlur: "onBlur", selectedChange: "selectedChange", provenanceChange: "provenanceChange" }, providers: [ProvenanceWidgetsService], ngImport: i0, template: "<div\n    style=\"display: flex; margin-bottom: 1rem; margin-top: 1rem;\"\n>\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [style]=\"{'margin-right': '0.5rem', 'height': '22px', 'width': '22px', 'padding': '0px', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"getProvenance().toggleProvenanceMode(btn, true)\"\n    >\n    <provenance-icon \n        [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n        [size]=\"20\"\n        style=\"height: 20px;\"\n    ></provenance-icon>\n    </button>\n    <div class=\"custom-slider\" style=\"width: 100%\">\n        <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n            style=\"margin-top: 0px\"\n        >\n        </ngx-slider>\n    </div>\n</div>\n<div *ngFor=\"let d of data\" class=\"field-checkbox\">\n    <svg\n        [id]=\"getId() + d[value || 'value']\"\n        width=\"0\"\n        height=\"0\"\n        style=\"position: absolute;\"\n    >\n    </svg>\n    <p-radioButton\n        [inputId]=\"d[inputId || 'inputId'] || null\"\n        [name]=\"d[name || 'name'] || name || null\"\n        [value]=\"d[value || 'value'] || null\"\n        [label]=\"d[label || 'label'] || null\"\n        [disabled]=\"d['disabled'] || false\"\n        [tabindex]=\"d['tabindex'] || null\"\n        [style]=\"d['style'] || style || null\"\n        [styleClass]=\"d['styleClass'] || styleClass || null\"\n        [labelStyleClass]=\"d['labelStyleClass'] || labelStyleClass || null\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n    >\n    </p-radioButton>\n</div>\n", styles: ["::ng-deep p-radiobutton{z-index:2}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"], dependencies: [{ kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "component", type: i3.SliderComponent, selector: "ngx-slider", inputs: ["value", "highValue", "options", "manualRefresh", "triggerFocus"], outputs: ["valueChange", "highValueChange", "userChangeStart", "userChange", "userChangeEnd"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "directive", type: i5.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i5.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i6$1.RadioButton, selector: "p-radioButton", inputs: ["value", "formControlName", "name", "disabled", "label", "tabindex", "inputId", "ariaLabelledBy", "ariaLabel", "style", "styleClass", "labelStyleClass"], outputs: ["onClick", "onFocus", "onBlur"] }, { kind: "component", type: IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: RadiobuttonComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-radiobutton', providers: [ProvenanceWidgetsService], template: "<div\n    style=\"display: flex; margin-bottom: 1rem; margin-top: 1rem;\"\n>\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [style]=\"{'margin-right': '0.5rem', 'height': '22px', 'width': '22px', 'padding': '0px', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"getProvenance().toggleProvenanceMode(btn, true)\"\n    >\n    <provenance-icon \n        [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n        [size]=\"20\"\n        style=\"height: 20px;\"\n    ></provenance-icon>\n    </button>\n    <div class=\"custom-slider\" style=\"width: 100%\">\n        <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n            style=\"margin-top: 0px\"\n        >\n        </ngx-slider>\n    </div>\n</div>\n<div *ngFor=\"let d of data\" class=\"field-checkbox\">\n    <svg\n        [id]=\"getId() + d[value || 'value']\"\n        width=\"0\"\n        height=\"0\"\n        style=\"position: absolute;\"\n    >\n    </svg>\n    <p-radioButton\n        [inputId]=\"d[inputId || 'inputId'] || null\"\n        [name]=\"d[name || 'name'] || name || null\"\n        [value]=\"d[value || 'value'] || null\"\n        [label]=\"d[label || 'label'] || null\"\n        [disabled]=\"d['disabled'] || false\"\n        [tabindex]=\"d['tabindex'] || null\"\n        [style]=\"d['style'] || style || null\"\n        [styleClass]=\"d['styleClass'] || styleClass || null\"\n        [labelStyleClass]=\"d['labelStyleClass'] || labelStyleClass || null\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n    >\n    </p-radioButton>\n</div>\n", styles: ["::ng-deep p-radiobutton{z-index:2}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"] }]
        }], ctorParameters: function () { return [{ type: ProvenanceWidgetsService }, { type: i0.ElementRef }]; }, propDecorators: { value: [{
                type: Input
            }], formControlName: [{
                type: Input
            }], name: [{
                type: Input
            }], disabled: [{
                type: Input
            }], label: [{
                type: Input
            }], tabindex: [{
                type: Input
            }], inputId: [{
                type: Input
            }], ariaLabelledBy: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], style: [{
                type: Input
            }], styleClass: [{
                type: Input
            }], labelStyleClass: [{
                type: Input
            }], onClick: [{
                type: Output
            }], onFocus: [{
                type: Output
            }], onBlur: [{
                type: Output
            }], mode: [{
                type: Input
            }], data: [{
                type: Input
            }], selected: [{
                type: Input
            }], visualize: [{
                type: Input
            }], freeze: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], provenance: [{
                type: Input
            }], provenanceChange: [{
                type: Output
            }] } });

class MultiselectComponent extends MultiSelect {
    get selected() {
        return this._selected;
    }
    set selected(value) {
        if (!this.firstChange && !isEqual(this._selected, value)) {
            this.handleChange(value || []);
        }
        this.firstChange = false;
        this._selected = value;
    }
    get provenance() {
        return this._provenance;
    }
    set provenance(value) {
        if (this._provenance && (value === null || value === void 0 ? void 0 : value.revalidate)) {
            this._provenance = value;
            this.ngOnInit();
            this._visualize();
        }
        this._provenance = value;
    }
    constructor(mss, el, renderer, cd, zone, filterService, config, overlayService) {
        super(el, renderer, cd, zone, filterService, config, overlayService);
        this.mss = mss;
        this.firstChange = true;
        this.mode = MODE;
        this.selectedChange = new EventEmitter();
        this.visualize = true;
        this.freeze = false;
        this.interval = NaN;
        this.optionsRecord = {};
        this.myOverlayOptions = Object.assign({ 'appendTo': 'body' }, this.overlayOptions);
        this.provenanceChange = new EventEmitter();
        mss.init(el, ".panel" + this.mss.myId + " > div > ul", "multiselect");
        mss.crosshairSelect = (keys) => {
            this.selectedChange.emit(keys.map((key) => this.optionsRecord[key]));
        };
    }
    getId() {
        return this.mss.myId;
    }
    ngOnInit() {
        var _a, _b;
        super.ngOnInit();
        this.mss.options = this.options.length;
        this.mss.mode = this.mode;
        this.options.forEach((option) => {
            this.optionsRecord[option[this.dataKey]] = option;
        });
        if (((_a = this.provenance) === null || _a === void 0 ? void 0 : _a.hasUserInteracted) || ((_b = this.provenance) === null || _b === void 0 ? void 0 : _b.revalidate)) {
            this.mss.setProvenance(this.provenance);
            this.selected = Object
                .entries(this.mss.getProvenance().dataByOption)
                .filter(([_, v]) => {
                const last = v.at(-1);
                return last && last.unselect === undefined && last.select !== undefined;
            })
                .map(([k, _]) => this.optionsRecord[k]);
            return;
        }
        if (this.selected) {
            this.mss.addSimultaneousEvents([], this.selected.map(o => o[this.dataKey]), this.freeze, false);
        }
    }
    ngAfterViewInit() {
        var _a;
        super.ngAfterViewInit();
        this.mss.setElement(this.el);
        if ((_a = this.mss.getProvenance()) === null || _a === void 0 ? void 0 : _a.hasUserInteracted)
            this._visualize();
    }
    ngOnDestroy() {
        clearInterval(this.interval);
    }
    handleHide(e) {
        var _a;
        (_a = this.onPanelHide) === null || _a === void 0 ? void 0 : _a.emit(e);
        this.overlayVisible = false;
    }
    handleShow(e) {
        var _a;
        (_a = this.onPanelShow) === null || _a === void 0 ? void 0 : _a.emit(e);
        this.overlayVisible = true;
        this._visualize();
    }
    handleChange(value) {
        this.mss.addSimultaneousEvents(this.selected ? this.selected.map(o => o[this.dataKey]) : [], value.map(o => o[this.dataKey]), this.freeze, true, new Date(), this.provenanceChange, this._visualize.bind(this));
    }
    _visualize() {
        if (!this.visualize || !this.overlayVisible)
            return;
        let li = undefined;
        for (const option of this.options) {
            const div = document.getElementById(this.mss.myId + option[this.dataKey] + 'div');
            if (div && div.parentElement) {
                li = div.parentElement;
                break;
            }
        }
        if (!li)
            return;
        // subtracting padding values
        // TODO: remove magic numbers
        const offsetWidth = li.offsetWidth - 40 - 22; //checkbox width
        const offsetHeight = li.offsetHeight - 24;
        this.mss.visualize(this.mode, offsetWidth, offsetHeight);
    }
    getOption(key) {
        var _a;
        const events = (_a = this.mss.dataByOption[key]) === null || _a === void 0 ? void 0 : _a.length;
        return events ? `(${events})` : "";
    }
    getProvenance() {
        return this.mss;
    }
    handleClick(btn) {
        this.mss.toggleProvenanceMode(btn, false);
        setTimeout(() => this.pMultiSelect.show(), this.pMultiSelect.overlayVisible ? 1000 : 0);
    }
    handleFilter(event) {
        var _a;
        (_a = this.onFilter) === null || _a === void 0 ? void 0 : _a.emit(event);
        // When the filter is cleared, items are not made available to the DOM immediately, so we need to wait a bit
        // TODO: find a better way to handle this
        const timeout = event.filter ? 0 : 100;
        setTimeout(() => this._visualize(), timeout);
    }
}
MultiselectComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: MultiselectComponent, deps: [{ token: ProvenanceWidgetsService }, { token: i0.ElementRef }, { token: i0.Renderer2 }, { token: i0.ChangeDetectorRef }, { token: i0.NgZone }, { token: i2$1.FilterService }, { token: i2$1.PrimeNGConfig }, { token: i2$1.OverlayService }], target: i0.ɵɵFactoryTarget.Component });
MultiselectComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: MultiselectComponent, selector: "provenance-multiselect", inputs: { mode: "mode", selected: "selected", iconSize: "iconSize", visualize: "visualize", freeze: "freeze", provenance: "provenance" }, outputs: { selectedChange: "selectedChange", provenanceChange: "provenanceChange" }, providers: [ProvenanceWidgetsService], viewQueries: [{ propertyName: "pMultiSelect", first: true, predicate: ["pMultiSelect"], descendants: true }], usesInheritance: true, ngImport: i0, template: "<div class=\"p-inputgroup flex flex-row gap-3\">\n    <button\n    *ngIf=\"visualize\"\n    pButton\n    type=\"button\"\n    class=\"p-button-help p-button-text\"\n    [disabled]=\"!getProvenance().hasUserInteracted\"\n    [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n    #btn\n    (click)=\"handleClick(btn)\"\n   >\n    <provenance-icon \n    [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n    [size]=\"iconSize\"\n    ></provenance-icon>\n   </button>\n   <p-multiSelect\n    #pMultiSelect \n    [appendTo]=\"appendTo\" \n    [ariaFilterLabel]=\"ariaFilterLabel\" \n    [label]=\"label\"\n    [ariaLabelledBy]=\"ariaLabelledBy\"\n    [autofocusFilter]=\"autofocusFilter\"\n    [autoZIndex]=\"autoZIndex\"\n    [baseZIndex]=\"baseZIndex\"\n    [defaultLabel]=\"defaultLabel\"\n    [dataKey]=\"dataKey\"\n    [disabled]=\"disabled\"\n    [displaySelectedLabel]=\"displaySelectedLabel\"\n    [dropdownIcon]=\"dropdownIcon\"\n    [emptyFilterMessage]=\"emptyFilterMessage\"\n    [filter]=\"filter\"\n    [filterMatchMode]=\"filterMatchMode\"\n    [filterValue]=\"filterValue\"\n    [filterLocale]=\"filterLocale\"\n    [filterBy]=\"filterBy\"\n    [filterPlaceHolder]=\"filterPlaceHolder\"\n    [hideTransitionOptions]=\"hideTransitionOptions\"\n    [inputId]=\"inputId\"\n    [maxSelectedLabels]=\"maxSelectedLabels || 3\"\n    [name]=\"name\"\n    [options]=\"options\"\n    [optionLabel]=\"optionLabel\"\n    [optionValue]=\"optionValue\"\n    [optionDisabled]=\"optionDisabled\"\n    [optionGroupLabel]=\"optionGroupLabel\"\n    [optionGroupChildren]=\"optionGroupChildren\"\n    [group]=\"group\"\n    [overlayVisible]=\"overlayVisible\"\n    [panelStyle]=\"panelStyle\"\n    [placeholder]=\"placeholder\"\n    [readonly]=\"readonly\"\n    [emptyMessage]=\"emptyMessage\"\n    [emptyFilterMessage]=\"emptyFilterMessage\"\n    [resetFilterOnHide]=\"resetFilterOnHide\"\n    [scrollHeight]=\"scrollHeight\"\n    [selectedItemsLabel]=\"selectedItemsLabel\"\n    [selectionLimit]=\"selectionLimit\"\n    [showHeader]=\"showHeader\"\n    [showTransitionOptions]=\"showTransitionOptions\"\n    [showToggleAll]=\"showToggleAll\"\n    [style]=\"style\"\n    [styleClass]=\"(styleClass || '') + ' provenance-multiselect'\"\n    [panelStyleClass]=\"(panelStyleClass || '') + 'provenance-multiselect-panel panel' + this.getId()\"\n    [tabindex]=\"tabindex\"\n    [tooltip]=\"tooltip\"\n    [tooltipStyleClass]=\"tooltipStyleClass\"\n    [tooltipPosition]=\"tooltipPosition\"\n    [tooltipPositionStyle]=\"tooltipPositionStyle\"\n    [showClear]=\"showClear\"\n    [virtualScroll]=\"virtualScroll\"\n    [virtualScrollItemSize]=\"virtualScrollItemSize\"\n    [virtualScrollOptions]=\"virtualScrollOptions\"\n    [overlayOptions]=\"myOverlayOptions\"\n    [lazy]=\"lazy\"\n    (onClick)=\"onClick\"\n    (onChange)=\"onChange\"\n    (onFilter)=\"handleFilter($event)\"\n    (onFocus)=\"onFocus\"\n    (onBlur)=\"onBlur\"\n    (onPanelShow)=\"handleShow($event)\"\n    (onPanelHide)=\"handleHide($event)\"\n    (onClear)=\"onClear\"\n    (onLazyLoad)=\"onLazyLoad\"\n    (onRemove)=\"onRemove\"\n    (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n    [ngModel]=\"selected\"\n    >\n      <ng-template let-option pTemplate=\"item\">\n        <div style=\"position: relative; width: 100%;\" [id]=\"getId() + option[dataKey] + 'div'\">\n          <svg \n            [id]=\"getId() + option[dataKey]\" \n            width=\"0\" \n            height=\"0\"\n            [style]=\"{ 'position': 'absolute', 'display': getProvenance().hasUserInteracted ? 'initial' : 'none' }\"\n          ></svg>\n          <div style=\"display: flex; justify-content: space-between; position: inherit;\">\n            <span>\n              {{ option[optionLabel] }}\n            </span>\n          </div>\n        </div>\n      </ng-template>\n      <ng-template pTemplate=\"footer\">\n        <div class=\"custom-slider temporal-slider\">\n          <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n          >\n          </ngx-slider>\n        </div>\n      </ng-template>\n    </p-multiSelect>\n  \n   </div>", styles: ["::ng-deep div.provenance-multiselect-panel>div>ul{position:relative}::ng-deep div.provenance-multiselect-panel>div.p-multiselect-footer.ng-star-inserted:has(div.temporal-slider){padding-left:48px;padding-right:24px}::ng-deep div.provenance-multiselect-panel>div.p-multiselect-items-wrapper>ul>p-multiselectitem>li.p-multiselect-item{background:none!important}::ng-deep div.provenance-multiselect{width:initial!important}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"], dependencies: [{ kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i3.SliderComponent, selector: "ngx-slider", inputs: ["value", "highValue", "options", "manualRefresh", "triggerFocus"], outputs: ["valueChange", "highValueChange", "userChangeStart", "userChange", "userChangeEnd"] }, { kind: "directive", type: i2$1.PrimeTemplate, selector: "[pTemplate]", inputs: ["type", "pTemplate"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "directive", type: i5.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i5.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i7.MultiSelect, selector: "p-multiSelect", inputs: ["style", "styleClass", "panelStyle", "panelStyleClass", "inputId", "disabled", "readonly", "group", "filter", "filterPlaceHolder", "filterLocale", "overlayVisible", "tabindex", "appendTo", "dataKey", "name", "label", "ariaLabelledBy", "displaySelectedLabel", "maxSelectedLabels", "selectionLimit", "selectedItemsLabel", "showToggleAll", "emptyFilterMessage", "emptyMessage", "resetFilterOnHide", "dropdownIcon", "optionLabel", "optionValue", "optionDisabled", "optionGroupLabel", "optionGroupChildren", "showHeader", "filterBy", "scrollHeight", "lazy", "virtualScroll", "virtualScrollItemSize", "virtualScrollOptions", "overlayOptions", "ariaFilterLabel", "filterMatchMode", "tooltip", "tooltipPosition", "tooltipPositionStyle", "tooltipStyleClass", "autofocusFilter", "display", "autocomplete", "showClear", "autoZIndex", "baseZIndex", "showTransitionOptions", "hideTransitionOptions", "defaultLabel", "placeholder", "options", "filterValue", "itemSize"], outputs: ["onChange", "onFilter", "onFocus", "onBlur", "onClick", "onClear", "onPanelShow", "onPanelHide", "onLazyLoad", "onRemove"] }, { kind: "component", type: IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: MultiselectComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-multiselect', providers: [ProvenanceWidgetsService], template: "<div class=\"p-inputgroup flex flex-row gap-3\">\n    <button\n    *ngIf=\"visualize\"\n    pButton\n    type=\"button\"\n    class=\"p-button-help p-button-text\"\n    [disabled]=\"!getProvenance().hasUserInteracted\"\n    [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n    #btn\n    (click)=\"handleClick(btn)\"\n   >\n    <provenance-icon \n    [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n    [size]=\"iconSize\"\n    ></provenance-icon>\n   </button>\n   <p-multiSelect\n    #pMultiSelect \n    [appendTo]=\"appendTo\" \n    [ariaFilterLabel]=\"ariaFilterLabel\" \n    [label]=\"label\"\n    [ariaLabelledBy]=\"ariaLabelledBy\"\n    [autofocusFilter]=\"autofocusFilter\"\n    [autoZIndex]=\"autoZIndex\"\n    [baseZIndex]=\"baseZIndex\"\n    [defaultLabel]=\"defaultLabel\"\n    [dataKey]=\"dataKey\"\n    [disabled]=\"disabled\"\n    [displaySelectedLabel]=\"displaySelectedLabel\"\n    [dropdownIcon]=\"dropdownIcon\"\n    [emptyFilterMessage]=\"emptyFilterMessage\"\n    [filter]=\"filter\"\n    [filterMatchMode]=\"filterMatchMode\"\n    [filterValue]=\"filterValue\"\n    [filterLocale]=\"filterLocale\"\n    [filterBy]=\"filterBy\"\n    [filterPlaceHolder]=\"filterPlaceHolder\"\n    [hideTransitionOptions]=\"hideTransitionOptions\"\n    [inputId]=\"inputId\"\n    [maxSelectedLabels]=\"maxSelectedLabels || 3\"\n    [name]=\"name\"\n    [options]=\"options\"\n    [optionLabel]=\"optionLabel\"\n    [optionValue]=\"optionValue\"\n    [optionDisabled]=\"optionDisabled\"\n    [optionGroupLabel]=\"optionGroupLabel\"\n    [optionGroupChildren]=\"optionGroupChildren\"\n    [group]=\"group\"\n    [overlayVisible]=\"overlayVisible\"\n    [panelStyle]=\"panelStyle\"\n    [placeholder]=\"placeholder\"\n    [readonly]=\"readonly\"\n    [emptyMessage]=\"emptyMessage\"\n    [emptyFilterMessage]=\"emptyFilterMessage\"\n    [resetFilterOnHide]=\"resetFilterOnHide\"\n    [scrollHeight]=\"scrollHeight\"\n    [selectedItemsLabel]=\"selectedItemsLabel\"\n    [selectionLimit]=\"selectionLimit\"\n    [showHeader]=\"showHeader\"\n    [showTransitionOptions]=\"showTransitionOptions\"\n    [showToggleAll]=\"showToggleAll\"\n    [style]=\"style\"\n    [styleClass]=\"(styleClass || '') + ' provenance-multiselect'\"\n    [panelStyleClass]=\"(panelStyleClass || '') + 'provenance-multiselect-panel panel' + this.getId()\"\n    [tabindex]=\"tabindex\"\n    [tooltip]=\"tooltip\"\n    [tooltipStyleClass]=\"tooltipStyleClass\"\n    [tooltipPosition]=\"tooltipPosition\"\n    [tooltipPositionStyle]=\"tooltipPositionStyle\"\n    [showClear]=\"showClear\"\n    [virtualScroll]=\"virtualScroll\"\n    [virtualScrollItemSize]=\"virtualScrollItemSize\"\n    [virtualScrollOptions]=\"virtualScrollOptions\"\n    [overlayOptions]=\"myOverlayOptions\"\n    [lazy]=\"lazy\"\n    (onClick)=\"onClick\"\n    (onChange)=\"onChange\"\n    (onFilter)=\"handleFilter($event)\"\n    (onFocus)=\"onFocus\"\n    (onBlur)=\"onBlur\"\n    (onPanelShow)=\"handleShow($event)\"\n    (onPanelHide)=\"handleHide($event)\"\n    (onClear)=\"onClear\"\n    (onLazyLoad)=\"onLazyLoad\"\n    (onRemove)=\"onRemove\"\n    (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n    [ngModel]=\"selected\"\n    >\n      <ng-template let-option pTemplate=\"item\">\n        <div style=\"position: relative; width: 100%;\" [id]=\"getId() + option[dataKey] + 'div'\">\n          <svg \n            [id]=\"getId() + option[dataKey]\" \n            width=\"0\" \n            height=\"0\"\n            [style]=\"{ 'position': 'absolute', 'display': getProvenance().hasUserInteracted ? 'initial' : 'none' }\"\n          ></svg>\n          <div style=\"display: flex; justify-content: space-between; position: inherit;\">\n            <span>\n              {{ option[optionLabel] }}\n            </span>\n          </div>\n        </div>\n      </ng-template>\n      <ng-template pTemplate=\"footer\">\n        <div class=\"custom-slider temporal-slider\">\n          <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n          >\n          </ngx-slider>\n        </div>\n      </ng-template>\n    </p-multiSelect>\n  \n   </div>", styles: ["::ng-deep div.provenance-multiselect-panel>div>ul{position:relative}::ng-deep div.provenance-multiselect-panel>div.p-multiselect-footer.ng-star-inserted:has(div.temporal-slider){padding-left:48px;padding-right:24px}::ng-deep div.provenance-multiselect-panel>div.p-multiselect-items-wrapper>ul>p-multiselectitem>li.p-multiselect-item{background:none!important}::ng-deep div.provenance-multiselect{width:initial!important}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"] }]
        }], ctorParameters: function () { return [{ type: ProvenanceWidgetsService }, { type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i0.ChangeDetectorRef }, { type: i0.NgZone }, { type: i2$1.FilterService }, { type: i2$1.PrimeNGConfig }, { type: i2$1.OverlayService }]; }, propDecorators: { mode: [{
                type: Input
            }], selected: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], iconSize: [{
                type: Input
            }], visualize: [{
                type: Input
            }], freeze: [{
                type: Input
            }], pMultiSelect: [{
                type: ViewChild,
                args: ["pMultiSelect"]
            }], provenance: [{
                type: Input
            }], provenanceChange: [{
                type: Output
            }] } });

class InputtextComponent extends AutoComplete {
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
        if (this._provenance && (value === null || value === void 0 ? void 0 : value.revalidate)) {
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
                var _a;
                acc[value] = {
                    count: (((_a = acc[value]) === null || _a === void 0 ? void 0 : _a.count) || 0) + 1,
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
        var _a, _b;
        this.tooltip = getTooltip();
        if ((_b = (_a = this.provenance) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.length) {
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
        var _a, _b;
        if ((_b = (_a = this.provenance) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.length) {
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
        var _a, _b, _c;
        this.tooltip.style("opacity", 0).style("display", "none");
        const value = (_a = this.wrapper.nativeElement.querySelector("input")) === null || _a === void 0 ? void 0 : _a.value;
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
            count: (((_b = this.dictionary[value]) === null || _b === void 0 ? void 0 : _b.count) || 0) + 1,
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
        (_c = this.provenanceChange) === null || _c === void 0 ? void 0 : _c.emit(provenance);
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
            var _a, _b, _c;
            const { clientX: x, clientY: y } = e;
            self.tooltip
                .style("opacity", 1)
                .style("display", "block")
                .style("left", `${x + 10}px`)
                .style("top", `${y + 10}px`)
                .select("div")
                .html(`
                        Label: ${((_c = (_b = (_a = self.el) === null || _a === void 0 ? void 0 : _a.nativeElement) === null || _b === void 0 ? void 0 : _b.dataset) === null || _c === void 0 ? void 0 : _c.label) || self.id} <br />
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
        var _a;
        if (!((_a = this.wrapper) === null || _a === void 0 ? void 0 : _a.nativeElement))
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
        var _a, _b, _c;
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
                <span>Label: ${((_c = (_b = (_a = this.el) === null || _a === void 0 ? void 0 : _a.nativeElement) === null || _b === void 0 ? void 0 : _b.dataset) === null || _c === void 0 ? void 0 : _c.label) || this.id}</span>
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
InputtextComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: InputtextComponent, selector: "provenance-inputtext", inputs: { mode: "mode", id: "id", visualize: "visualize", freeze: "freeze", value: "value", provenance: "provenance" }, outputs: { valueChange: "valueChange", provenanceChange: "provenanceChange" }, viewQueries: [{ propertyName: "wrapper", first: true, predicate: ["wrapper"], descendants: true }, { propertyName: "svg", first: true, predicate: ["provenance"], descendants: true }, { propertyName: "button", first: true, predicate: ["provenanceButton"], descendants: true }], usesInheritance: true, ngImport: i0, template: "<p-overlayPanel\n    #op\n    [dismissable]=\"false\"\n    styleClass=\"textinput-overlay\"\n>\n    <svg #provenance class=\"inputtext-provenance\">\n        <g class=\"axis\">\n            <text\n                transform=\"rotate(-90)\"\n                text-anchor=\"middle\"\n                fill=\"black\"\n                y=\"-30\"\n                [attr.font-size]=\"'small'\"\n            >\n                {{mode === \"interaction\" ? \"Sequence of Interaction (0 = first)\" : \"time\"}}\n            </text>\n        </g>\n        <g class=\"body\"></g>\n    </svg>\n</p-overlayPanel>\n<div\n    #wrapper\n    class=\"flex flex-row gap-3\"\n>\n    <!-- <ng-content></ng-content> -->\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        #provenanceButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!hasUserInteracted\"\n        (click)=\"handleProvenanceButtonClick($event, wrapper, op)\"\n        [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n    >\n        \n    <provenance-icon \n        [icon]=\"!hasUserInteracted ? 'disabled' : op.overlayVisible ? 'temporal' : 'aggregate'\"\n    ></provenance-icon>\n   </button>\n    <p-autoComplete\n        #autocomplete\n        [appendTo]=\"'body'\"\n        [ngModel]=\"{ label: field ? value[field] : value }\"\n        [field]=\"'label'\"\n        [suggestions]=\"getSuggestions()\"\n        [overlayOptions]=\"{ appendTo: 'body' }\"\n        (completeMethod)=\"handleSearch($event)\"\n        (onFocus)=\"!autocomplete.value && autocomplete.handleDropdownClick($event)\"\n        (onClear)=\"handleClear(autocomplete, $event)\"\n        (onKeyUp)=\"handleKeyUp($event)\"\n        (onSelect)=\"handleEnter('select')\"\n        (mouseout)=\"handleMouseOut()\"\n    >\n        <ng-template let-suggestion pTemplate=\"item\">\n            <div style=\"position: relative; width: 100%;\" (mousemove)=\"handleMouseOver($event, suggestion)\" (mouseout)=\"handleMouseOut()\">\n                <svg *ngIf=\"visualize\" style=\"width: 100%; height: 100%; position: absolute\">\n                    <rect x=\"0\" y=\"0\" [attr.width]=\"suggestion.width\" [attr.fill]=\"suggestion.color\" [attr.stroke]=\"'black'\" [attr.stroke-width]=\"suggestion.timestamp >= this.oldMaxTime! ? 2 : 0\" [attr.stroke-dasharray]=\"suggestion.timestamp === this.maxTime! ? '0 0' : '4 1'\" style=\"height: 100%;\"></rect>\n                </svg>\n                <div style=\"display: flex; justify-content: space-between; position: inherit;\">\n                    <span>\n                        {{suggestion.label === \"\" ? '&lt;empty&gt;' : suggestion.label}}\n                    </span>\n                </div>\n            </div>\n        </ng-template>\n    </p-autoComplete>\n</div>", styles: ["::ng-deep .textinput-overlay>.p-overlaypanel-content{overflow-y:auto;max-height:calc(250px + 3.5rem);padding-left:0!important;padding-right:0!important}\n"], dependencies: [{ kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i2$2.OverlayPanel, selector: "p-overlayPanel", inputs: ["dismissable", "showCloseIcon", "style", "styleClass", "appendTo", "autoZIndex", "ariaCloseLabel", "baseZIndex", "focusOnShow", "showTransitionOptions", "hideTransitionOptions"], outputs: ["onShow", "onHide"] }, { kind: "directive", type: i2$1.PrimeTemplate, selector: "[pTemplate]", inputs: ["type", "pTemplate"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "directive", type: i5.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i5.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i6$2.AutoComplete, selector: "p-autoComplete", inputs: ["minLength", "delay", "style", "panelStyle", "styleClass", "panelStyleClass", "inputStyle", "inputId", "inputStyleClass", "placeholder", "readonly", "disabled", "scrollHeight", "lazy", "virtualScroll", "virtualScrollItemSize", "virtualScrollOptions", "maxlength", "name", "required", "size", "appendTo", "autoHighlight", "forceSelection", "type", "autoZIndex", "baseZIndex", "ariaLabel", "dropdownAriaLabel", "ariaLabelledBy", "dropdownIcon", "unique", "group", "completeOnFocus", "showClear", "field", "dropdown", "showEmptyMessage", "dropdownMode", "multiple", "tabindex", "dataKey", "emptyMessage", "showTransitionOptions", "hideTransitionOptions", "autofocus", "autocomplete", "optionGroupChildren", "optionGroupLabel", "overlayOptions", "itemSize", "suggestions"], outputs: ["completeMethod", "onSelect", "onUnselect", "onFocus", "onBlur", "onDropdownClick", "onClear", "onKeyUp", "onShow", "onHide", "onLazyLoad"] }, { kind: "component", type: IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
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

class DropdownComponent extends Dropdown {
    get selected() {
        return this._selected;
    }
    set selected(value) {
        if (!this.firstChange && !isEqual(this._selected, value)) {
            this.handleChange({ originalEvent: new Event("provenance"), value });
        }
        this.firstChange = false;
        this._selected = value;
    }
    get provenance() {
        return this._provenance;
    }
    set provenance(value) {
        if (this._provenance && (value === null || value === void 0 ? void 0 : value.revalidate)) {
            this._provenance = value;
            this.ngOnInit();
            this._visualize();
        }
        this._provenance = value;
    }
    constructor(mss, el, renderer, cd, zone, filterService, config) {
        super(el, renderer, cd, zone, filterService, config);
        this.mss = mss;
        this.firstChange = true;
        this.mode = MODE;
        this.visualize = true;
        this.selectedChange = new EventEmitter();
        this.interval = NaN;
        this.optionsRecord = {};
        this.myOverlayOptions = Object.assign({ 'appendTo': 'body', hideOnEscape: false }, this.overlayOptions);
        this.freeze = false;
        this.provenanceChange = new EventEmitter();
        mss.init(el, ".panel" + this.mss.myId + " > div > ul", "select");
        mss.crosshairSelect = (keys) => {
            this.selectedChange.emit(this.optionsRecord[keys[0]]);
        };
    }
    ngOnInit() {
        var _a, _b;
        super.ngOnInit();
        this.mss.options = this.options.length;
        this.mss.mode = this.mode;
        this.options.forEach((option) => {
            this.optionsRecord[option[this.dataKey]] = option;
        });
        if (((_a = this.provenance) === null || _a === void 0 ? void 0 : _a.hasUserInteracted) || ((_b = this.provenance) === null || _b === void 0 ? void 0 : _b.revalidate)) {
            this.mss.setProvenance(this.provenance);
            this.selected = Object
                .entries(this.mss.getProvenance().dataByOption)
                .filter(([_, v]) => {
                const last = v.at(-1);
                return last && last.unselect === undefined && last.select !== undefined;
            })
                .map(([k, _]) => this.optionsRecord[k])[0];
            return;
        }
        if (this.selected) {
            this.mss.addSimultaneousEvents([], [this.selected[this.dataKey]], this.freeze, false);
        }
    }
    ngAfterViewInit() {
        var _a;
        this.mss.setElement(this.el);
        super.ngAfterViewInit();
        if ((_a = this.mss.getProvenance()) === null || _a === void 0 ? void 0 : _a.hasUserInteracted)
            this._visualize();
    }
    getProvenance() {
        return this.mss;
    }
    getId() {
        return this.mss.myId;
    }
    handleClick(btn) {
        this.mss.toggleProvenanceMode(btn, false);
        setTimeout(() => this.pDropdown.show(), this.pDropdown.overlayVisible ? 1000 : 0);
    }
    handleChange(e) {
        this.mss.addSimultaneousEvents(this.selected ? [this.selected[this.dataKey]] : [], e.value ? [e.value[this.dataKey]] : [], this.freeze, true, new Date(), this.provenanceChange, this._visualize.bind(this));
    }
    handleFilter(event) {
        var _a;
        (_a = this.onFilter) === null || _a === void 0 ? void 0 : _a.emit(event);
        const timeout = event.filter ? 0 : 100;
        setTimeout(() => this._visualize(), timeout);
    }
    toggleShow(e) {
        var _a;
        (_a = this[this.overlayVisible ? 'onHide' : 'onShow']) === null || _a === void 0 ? void 0 : _a.emit(e);
        this.overlayVisible = !this.overlayVisible;
        this._visualize();
    }
    _visualize() {
        if (!this.visualize || !this.overlayVisible)
            return;
        let li = undefined;
        for (const option of this.options) {
            const div = document.getElementById(this.mss.myId + option[this.dataKey] + 'div');
            if (div && div.parentElement) {
                li = div.parentElement;
                break;
            }
        }
        if (!li)
            return;
        const offsetWidth = li.offsetWidth - 40;
        const offsetHeight = li.offsetHeight - 24;
        this.mss.visualize(this.mode, offsetWidth, offsetHeight);
    }
}
DropdownComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: DropdownComponent, deps: [{ token: ProvenanceWidgetsService }, { token: i0.ElementRef }, { token: i0.Renderer2 }, { token: i0.ChangeDetectorRef }, { token: i0.NgZone }, { token: i2$1.FilterService }, { token: i2$1.PrimeNGConfig }], target: i0.ɵɵFactoryTarget.Component });
DropdownComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: DropdownComponent, selector: "provenance-dropdown", inputs: { mode: "mode", selected: "selected", iconSize: "iconSize", visualize: "visualize", provenance: "provenance", freeze: "freeze" }, outputs: { selectedChange: "selectedChange", provenanceChange: "provenanceChange" }, providers: [ProvenanceWidgetsService], viewQueries: [{ propertyName: "pDropdown", first: true, predicate: ["pDropdown"], descendants: true }], usesInheritance: true, ngImport: i0, template: "<div class=\"p-inputgroup flex flex-row gap-3\">\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"handleClick(btn)\"\n    >\n        <provenance-icon\n            [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n            [size]=\"iconSize\"\n        ></provenance-icon>\n    </button>\n    <p-dropdown\n        #pDropdown\n        [scrollHeight]=\"scrollHeight\"\n        [filter]=\"filter\"\n        [name]=\"name\"\n        [style]=\"style\"\n        [panelStyle]=\"panelStyle\"\n        [styleClass]=\"(styleClass || '') + ' provenance-dropdown'\"\n        [panelStyleClass]=\"(panelStyleClass || '') + 'provenance-dropdown-panel panel' + this.getId()\"\n        [readonly]=\"readonly\"\n        [required]=\"required\"\n        [editable]=\"editable\"\n        [appendTo]=\"appendTo\"\n        [tabindex]=\"tabindex\"\n        [placeholder]=\"placeholder\"\n        [filterPlaceholder]=\"filterPlaceholder\"\n        [filterLocale]=\"filterLocale\"\n        [inputId]=\"inputId\"\n        [selectId]=\"selectId\"\n        [dataKey]=\"dataKey\"\n        [filterBy]=\"filterBy\"\n        [autofocus]=\"autofocus\"\n        [resetFilterOnHide]=\"resetFilterOnHide\"\n        [dropdownIcon]=\"dropdownIcon\"\n        [optionLabel]=\"optionLabel\"\n        [optionValue]=\"optionValue\"\n        [optionDisabled]=\"optionDisabled\"\n        [optionGroupLabel]=\"optionGroupLabel\"\n        [optionGroupChildren]=\"optionGroupChildren\"\n        [autoDisplayFirst]=\"autoDisplayFirst\"\n        [group]=\"group\"\n        [showClear]=\"showClear\"\n        [emptyFilterMessage]=\"emptyFilterMessage\"\n        [emptyMessage]=\"emptyMessage\"\n        [lazy]=\"lazy\"\n        [virtualScroll]=\"virtualScroll\"\n        [virtualScrollItemSize]=\"virtualScrollItemSize\"\n        [virtualScrollOptions]=\"virtualScrollOptions\"\n        [overlayOptions]=\"myOverlayOptions\"\n        [ariaFilterLabel]=\"ariaFilterLabel\"\n        [ariaLabel]=\"ariaLabel\"\n        [ariaLabelledBy]=\"ariaLabelledBy\"\n        [filterMatchMode]=\"filterMatchMode\"\n        [maxlength]=\"maxlength\"\n        [tooltip]=\"tooltip\"\n        [tooltipPosition]=\"tooltipPosition\"\n        [tooltipPositionStyle]=\"tooltipPositionStyle\"\n        [tooltipStyleClass]=\"tooltipStyleClass\"\n        [autofocusFilter]=\"autofocusFilter\"\n        [overlayDirection]=\"overlayDirection\"\n        [disabled]=\"disabled\"\n        [itemSize]=\"itemSize\"\n        [autoZIndex]=\"autoZIndex\"\n        [baseZIndex]=\"baseZIndex\"\n        [showTransitionOptions]=\"showTransitionOptions\"\n        [hideTransitionOptions]=\"hideTransitionOptions\"\n        [options]=\"options\"\n        [filterValue]=\"filterValue\"\n        (onChange)=\"onChange\"\n        (onFilter)=\"handleFilter($event)\"\n        (onFocus)=\"onFocus\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n        (onShow)=\"toggleShow($event)\"\n        (onHide)=\"toggleShow($event)\"\n        (onClear)=\"onClear\"\n        (onLazyLoad)=\"onLazyLoad\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n    >\n        <ng-template let-option pTemplate=\"item\">\n            <div style=\"position: relative; width: 100%;\" [id]=\"getId() + option[dataKey] + 'div'\">\n                <svg \n                  [id]=\"getId() + option[dataKey]\" \n                  width=\"0\" \n                  height=\"0\"\n                  [style]=\"{ 'position': 'absolute', 'display': getProvenance().hasUserInteracted ? 'initial' : 'none' }\"\n                ></svg>\n                <div style=\"display: flex; justify-content: space-between; position: inherit;\">\n                    <span>\n                        {{ option[optionLabel] }}\n                    </span>\n                </div>\n            </div>\n        </ng-template>\n        <ng-template pTemplate=\"footer\">\n            <div class=\"custom-slider temporal-slider\">\n                <ngx-slider\n                    *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n                    [value]=\"getProvenance().temporalFilterRange[0]\"\n                    [highValue]=\"getProvenance().temporalFilterRange[1]\"\n                    [options]=\"getProvenance().temporalOptions\"\n                    (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n                ></ngx-slider>\n            </div>\n        </ng-template>\n    </p-dropdown>\n</div>\n", styles: ["::ng-deep div.provenance-dropdown-panel>div>ul{position:relative}::ng-deep div.provenance-dropdown-panel>div.temporal-slider{padding-right:1.25rem;padding-left:1.25rem}::ng-deep .provenance-dropdown{width:initial!important}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"], dependencies: [{ kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i3.SliderComponent, selector: "ngx-slider", inputs: ["value", "highValue", "options", "manualRefresh", "triggerFocus"], outputs: ["valueChange", "highValueChange", "userChangeStart", "userChange", "userChangeEnd"] }, { kind: "directive", type: i2$1.PrimeTemplate, selector: "[pTemplate]", inputs: ["type", "pTemplate"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "directive", type: i5.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i5.RequiredValidator, selector: ":not([type=checkbox])[required][formControlName],:not([type=checkbox])[required][formControl],:not([type=checkbox])[required][ngModel]", inputs: ["required"] }, { kind: "directive", type: i5.MaxLengthValidator, selector: "[maxlength][formControlName],[maxlength][formControl],[maxlength][ngModel]", inputs: ["maxlength"] }, { kind: "directive", type: i5.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i7$1.Dropdown, selector: "p-dropdown", inputs: ["scrollHeight", "filter", "name", "style", "panelStyle", "styleClass", "panelStyleClass", "readonly", "required", "editable", "appendTo", "tabindex", "placeholder", "filterPlaceholder", "filterLocale", "inputId", "selectId", "dataKey", "filterBy", "autofocus", "resetFilterOnHide", "dropdownIcon", "optionLabel", "optionValue", "optionDisabled", "optionGroupLabel", "optionGroupChildren", "autoDisplayFirst", "group", "showClear", "emptyFilterMessage", "emptyMessage", "lazy", "virtualScroll", "virtualScrollItemSize", "virtualScrollOptions", "overlayOptions", "ariaFilterLabel", "ariaLabel", "ariaLabelledBy", "filterMatchMode", "maxlength", "tooltip", "tooltipPosition", "tooltipPositionStyle", "tooltipStyleClass", "autofocusFilter", "overlayDirection", "disabled", "itemSize", "autoZIndex", "baseZIndex", "showTransitionOptions", "hideTransitionOptions", "options", "filterValue"], outputs: ["onChange", "onFilter", "onFocus", "onBlur", "onClick", "onShow", "onHide", "onClear", "onLazyLoad"] }, { kind: "component", type: IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: DropdownComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-dropdown', providers: [ProvenanceWidgetsService], template: "<div class=\"p-inputgroup flex flex-row gap-3\">\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"handleClick(btn)\"\n    >\n        <provenance-icon\n            [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n            [size]=\"iconSize\"\n        ></provenance-icon>\n    </button>\n    <p-dropdown\n        #pDropdown\n        [scrollHeight]=\"scrollHeight\"\n        [filter]=\"filter\"\n        [name]=\"name\"\n        [style]=\"style\"\n        [panelStyle]=\"panelStyle\"\n        [styleClass]=\"(styleClass || '') + ' provenance-dropdown'\"\n        [panelStyleClass]=\"(panelStyleClass || '') + 'provenance-dropdown-panel panel' + this.getId()\"\n        [readonly]=\"readonly\"\n        [required]=\"required\"\n        [editable]=\"editable\"\n        [appendTo]=\"appendTo\"\n        [tabindex]=\"tabindex\"\n        [placeholder]=\"placeholder\"\n        [filterPlaceholder]=\"filterPlaceholder\"\n        [filterLocale]=\"filterLocale\"\n        [inputId]=\"inputId\"\n        [selectId]=\"selectId\"\n        [dataKey]=\"dataKey\"\n        [filterBy]=\"filterBy\"\n        [autofocus]=\"autofocus\"\n        [resetFilterOnHide]=\"resetFilterOnHide\"\n        [dropdownIcon]=\"dropdownIcon\"\n        [optionLabel]=\"optionLabel\"\n        [optionValue]=\"optionValue\"\n        [optionDisabled]=\"optionDisabled\"\n        [optionGroupLabel]=\"optionGroupLabel\"\n        [optionGroupChildren]=\"optionGroupChildren\"\n        [autoDisplayFirst]=\"autoDisplayFirst\"\n        [group]=\"group\"\n        [showClear]=\"showClear\"\n        [emptyFilterMessage]=\"emptyFilterMessage\"\n        [emptyMessage]=\"emptyMessage\"\n        [lazy]=\"lazy\"\n        [virtualScroll]=\"virtualScroll\"\n        [virtualScrollItemSize]=\"virtualScrollItemSize\"\n        [virtualScrollOptions]=\"virtualScrollOptions\"\n        [overlayOptions]=\"myOverlayOptions\"\n        [ariaFilterLabel]=\"ariaFilterLabel\"\n        [ariaLabel]=\"ariaLabel\"\n        [ariaLabelledBy]=\"ariaLabelledBy\"\n        [filterMatchMode]=\"filterMatchMode\"\n        [maxlength]=\"maxlength\"\n        [tooltip]=\"tooltip\"\n        [tooltipPosition]=\"tooltipPosition\"\n        [tooltipPositionStyle]=\"tooltipPositionStyle\"\n        [tooltipStyleClass]=\"tooltipStyleClass\"\n        [autofocusFilter]=\"autofocusFilter\"\n        [overlayDirection]=\"overlayDirection\"\n        [disabled]=\"disabled\"\n        [itemSize]=\"itemSize\"\n        [autoZIndex]=\"autoZIndex\"\n        [baseZIndex]=\"baseZIndex\"\n        [showTransitionOptions]=\"showTransitionOptions\"\n        [hideTransitionOptions]=\"hideTransitionOptions\"\n        [options]=\"options\"\n        [filterValue]=\"filterValue\"\n        (onChange)=\"onChange\"\n        (onFilter)=\"handleFilter($event)\"\n        (onFocus)=\"onFocus\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n        (onShow)=\"toggleShow($event)\"\n        (onHide)=\"toggleShow($event)\"\n        (onClear)=\"onClear\"\n        (onLazyLoad)=\"onLazyLoad\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n    >\n        <ng-template let-option pTemplate=\"item\">\n            <div style=\"position: relative; width: 100%;\" [id]=\"getId() + option[dataKey] + 'div'\">\n                <svg \n                  [id]=\"getId() + option[dataKey]\" \n                  width=\"0\" \n                  height=\"0\"\n                  [style]=\"{ 'position': 'absolute', 'display': getProvenance().hasUserInteracted ? 'initial' : 'none' }\"\n                ></svg>\n                <div style=\"display: flex; justify-content: space-between; position: inherit;\">\n                    <span>\n                        {{ option[optionLabel] }}\n                    </span>\n                </div>\n            </div>\n        </ng-template>\n        <ng-template pTemplate=\"footer\">\n            <div class=\"custom-slider temporal-slider\">\n                <ngx-slider\n                    *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n                    [value]=\"getProvenance().temporalFilterRange[0]\"\n                    [highValue]=\"getProvenance().temporalFilterRange[1]\"\n                    [options]=\"getProvenance().temporalOptions\"\n                    (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n                ></ngx-slider>\n            </div>\n        </ng-template>\n    </p-dropdown>\n</div>\n", styles: ["::ng-deep div.provenance-dropdown-panel>div>ul{position:relative}::ng-deep div.provenance-dropdown-panel>div.temporal-slider{padding-right:1.25rem;padding-left:1.25rem}::ng-deep .provenance-dropdown{width:initial!important}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"] }]
        }], ctorParameters: function () { return [{ type: ProvenanceWidgetsService }, { type: i0.ElementRef }, { type: i0.Renderer2 }, { type: i0.ChangeDetectorRef }, { type: i0.NgZone }, { type: i2$1.FilterService }, { type: i2$1.PrimeNGConfig }]; }, propDecorators: { mode: [{
                type: Input
            }], selected: [{
                type: Input
            }], iconSize: [{
                type: Input
            }], visualize: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }], pDropdown: [{
                type: ViewChild,
                args: ["pDropdown"]
            }], provenance: [{
                type: Input
            }], freeze: [{
                type: Input
            }], provenanceChange: [{
                type: Output
            }] } });

class SliderComponent extends SliderComponent$1 {
    get provenance() {
        return this._provenance;
    }
    set provenance(value) {
        if (this.provenance && (value === null || value === void 0 ? void 0 : value.revalidate)) {
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
        var _a;
        if (highValue == null) {
            this.buckets.set(value, {
                date,
                count: (((_a = this.buckets.get(value)) === null || _a === void 0 ? void 0 : _a.count) || 0) + 1,
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
                    newBuckets.push([k, Object.assign(Object.assign({}, v), { highValue: value })]);
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
                    newBuckets.push([highValue, Object.assign(Object.assign({}, v), { highValue: v.highValue })]);
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
                    newBuckets.push([highValue, Object.assign(Object.assign({}, v), { highValue: v.highValue })]);
                }
                endProcessed = true;
                return;
            }
            // either the bucket is completely inside the interval or before/after the interval
            const increment = startProcessed && !endProcessed;
            newBuckets.push([k, increment ? Object.assign(Object.assign({}, v), { count: v.count + 1, date, maxIndex: this.data.length - 1 }) : v]);
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
        var _a, _b;
        this.options = Object.assign(Object.assign({}, this.options), { floor: this.options.floor || 0, ceil: this.options.ceil || 100, step: this.options.step || 1 });
        if ((_b = (_a = this.provenance) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.length) {
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
        var _a, _b;
        // DO NOT CALL super.ngAfterViewInit() or REMOVE THIS METHOD
        if ((_b = (_a = this.provenance) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.length) {
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
            .attr("stroke-width", ([_, value]) => { var _a; return value.date.getTime() >= ((_a = this.oldMaxTime) === null || _a === void 0 ? void 0 : _a.getTime()) ? 2 : 0; })
            .attr("stroke-dasharray", ([_, value]) => { var _a; return value.date.getTime() === ((_a = this.oldMaxTime) === null || _a === void 0 ? void 0 : _a.getTime()) ? "4 1" : "0 0"; })
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
            var _a, _b, _c;
            const { clientX: x, clientY: y } = e;
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: self.id,
                    widget: self.highValue != null ? "range-slider" : "slider",
                    mode: self.mode,
                    interaction: "aggregate-rect-mouseover",
                    data: Object.assign({ lowValue: d[0] }, d[1])
                }
            }));
            d3.select(this).attr("opacity", 0.5);
            tooltip
                .style("opacity", 1)
                .style("display", "block")
                .style("left", `${x + 10}px`)
                .style("top", `${y + 10}px`)
                .select("div")
                .html(`Label: ${((_c = (_b = (_a = self.el) === null || _a === void 0 ? void 0 : _a.nativeElement) === null || _b === void 0 ? void 0 : _b.dataset) === null || _c === void 0 ? void 0 : _c.label) || self.id} <br />` +
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
                        acc.push(Object.assign(Object.assign({}, v), { actualIndex: i }));
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
            .y((d, i) => { var _a; return y(this.mode === "interaction" ? filtered ? (_a = d.actualIndex) !== null && _a !== void 0 ? _a : i : i : d.timestamp); });
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
            var _a, _b, _c;
            // const [x, y] = d3.pointer(e)
            const { clientX: x, clientY: y } = e;
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: self.id,
                    widget: self.highValue != null ? "range-slider" : "slider",
                    mode: self.mode,
                    interaction: "temporal-circle-mouseover",
                    data: Object.assign(Object.assign({}, d), { index: d3.select(this).attr("data-index") })
                }
            }));
            tooltip
                .style("opacity", 1)
                .style("display", "block")
                .style("left", `${x + 10}px`)
                .style("top", `${y + 10}px`)
                .select("div")
                .html(`Label: ${((_c = (_b = (_a = self.el) === null || _a === void 0 ? void 0 : _a.nativeElement) === null || _b === void 0 ? void 0 : _b.dataset) === null || _c === void 0 ? void 0 : _c.label) || self.id} <br />` +
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
            .attr("cy", (d, i) => { var _a; return y(this.mode === "interaction" ? filtered ? (_a = d.actualIndex) !== null && _a !== void 0 ? _a : i : i : d.timestamp); })
            .attr("r", 4)
            .attr("fill", (d, i) => { var _a; return color(this.mode === "interaction" ? filtered ? (_a = d.actualIndex) !== null && _a !== void 0 ? _a : i : i : d.timestamp); })
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
        var _a, _b;
        this.userChangeEnd.emit(change);
        (_a = this.selectedChange) === null || _a === void 0 ? void 0 : _a.emit(change);
        const value = change.highValue != null ? [change.value, change.highValue] : [change.value];
        const timestamp = new Date();
        const newEntry = { value, timestamp };
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: this.id,
                widget: this.highValue != null ? "range-slider" : "slider",
                mode: this.mode,
                interaction,
                data: Object.assign({}, newEntry)
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
        (_b = this.provenanceChange) === null || _b === void 0 ? void 0 : _b.emit({
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
SliderComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: SliderComponent, selector: "provenance-slider", inputs: { mode: "mode", id: "id", provenance: "provenance", visualize: "visualize", freeze: "freeze" }, outputs: { provenanceChange: "provenanceChange", selectedChange: "selectedChange" }, viewQueries: [{ propertyName: "wrapper", first: true, predicate: ["wrapper"], descendants: true }, { propertyName: "provenanceSvg", first: true, predicate: ["provenance"], descendants: true }, { propertyName: "aggregateSvg", first: true, predicate: ["aggregate"], descendants: true }, { propertyName: "pButton", first: true, predicate: ["provenanceButton"], descendants: true }], usesInheritance: true, ngImport: i0, template: "<p-overlayPanel\n  #op\n  [dismissable]=\"false\"\n>\n  <svg #provenance class=\"slider-provenance\">\n    <g class=\"axis\">\n      <text \n        transform=\"rotate(-90)\" \n        text-anchor=\"middle\" \n        y=\"-33\" \n        fill=\"black\"\n        [attr.font-size]=\"'1rem'\"\n      >\n        {{mode === \"interaction\" ? \"Sequence of Interaction (0 = first)\" : \"time\"}}\n      </text>\n    </g>\n    <g class=\"body\"></g>\n  </svg>\n</p-overlayPanel>\n<div\n  #wrapper\n  class=\"flex flex-row gap-3 custom-slider\"\n>\n  <button\n    *ngIf=\"visualize\"\n    pButton\n    #provenanceButton\n    type=\"button\"\n    class=\"p-button-help p-button-text\"\n    (click)=\"handleProvenanceButtonClick($event, wrapper, op)\"\n    [disabled]=\"data.length === 1\"\n    [ngStyle]=\"{ 'padding': 0, 'align-self': 'center', 'height': 'min-content', 'visibility': visualize ? 'visible' : 'hidden'}\"\n  >\n    <provenance-icon \n      [icon]=\"data.length === 1 ? 'disabled' : op.overlayVisible ? 'temporal' : 'aggregate'\"\n    ></provenance-icon>\n  </button>\n  <svg #aggregate style=\"position: absolute;\" width=\"0\" height=\"0\">\n    <g></g>\n  </svg>\n  <ngx-slider\n  [(value)]=\"value\"\n  [(highValue)]=\"highValue\"\n  [options]=\"options\"\n  (userChange)=\"userChange\"\n  (userChangeEnd)=\"onUserChangeEnd($event)\"\n  (userChangeStart)=\"userChangeStart\"\n  (valueChange)=\"valueChange\"\n  (highValueChange)=\"highValueChange\"\n  />\n</div>", styles: ["::ng-deep provenance-slider{display:initial!important}::ng-deep .p-overlaypanel{box-shadow:none;margin-top:0}::ng-deep .p-overlaypanel:before{display:none}::ng-deep .p-overlaypanel:after{display:none}::ng-deep .p-overlaypanel-content{box-shadow:0 1px 3px #0000004d;border:0 none;border-radius:6px;color:#495057}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"], dependencies: [{ kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { kind: "component", type: i3.SliderComponent, selector: "ngx-slider", inputs: ["value", "highValue", "options", "manualRefresh", "triggerFocus"], outputs: ["valueChange", "highValueChange", "userChangeStart", "userChange", "userChangeEnd"] }, { kind: "component", type: i2$2.OverlayPanel, selector: "p-overlayPanel", inputs: ["dismissable", "showCloseIcon", "style", "styleClass", "appendTo", "autoZIndex", "ariaCloseLabel", "baseZIndex", "focusOnShow", "showTransitionOptions", "hideTransitionOptions"], outputs: ["onShow", "onHide"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "component", type: IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
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

class ProvenanceWidgetsModule {
}
ProvenanceWidgetsModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
ProvenanceWidgetsModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsModule, declarations: [ProvenanceWidgetsComponent,
        SliderComponent,
        IconComponent,
        CheckboxComponent,
        RadiobuttonComponent,
        MultiselectComponent,
        InputtextComponent,
        DropdownComponent], imports: [CommonModule,
        NgxSliderModule,
        OverlayPanelModule,
        ButtonModule,
        TooltipModule,
        FormsModule,
        BrowserAnimationsModule,
        CheckboxModule,
        RadioButtonModule,
        MultiSelectModule,
        DropdownModule,
        InputTextModule,
        AutoCompleteModule], exports: [ProvenanceWidgetsComponent,
        SliderComponent,
        CheckboxComponent,
        RadiobuttonComponent,
        MultiselectComponent,
        InputtextComponent,
        DropdownComponent] });
ProvenanceWidgetsModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsModule, imports: [CommonModule,
        NgxSliderModule,
        OverlayPanelModule,
        ButtonModule,
        TooltipModule,
        FormsModule,
        BrowserAnimationsModule,
        CheckboxModule,
        RadioButtonModule,
        MultiSelectModule,
        DropdownModule,
        InputTextModule,
        AutoCompleteModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: ProvenanceWidgetsModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        ProvenanceWidgetsComponent,
                        SliderComponent,
                        IconComponent,
                        CheckboxComponent,
                        RadiobuttonComponent,
                        MultiselectComponent,
                        InputtextComponent,
                        DropdownComponent,
                    ],
                    imports: [
                        CommonModule,
                        NgxSliderModule,
                        OverlayPanelModule,
                        ButtonModule,
                        TooltipModule,
                        FormsModule,
                        BrowserAnimationsModule,
                        CheckboxModule,
                        RadioButtonModule,
                        MultiSelectModule,
                        DropdownModule,
                        InputTextModule,
                        AutoCompleteModule
                    ],
                    exports: [
                        ProvenanceWidgetsComponent,
                        SliderComponent,
                        CheckboxComponent,
                        RadiobuttonComponent,
                        MultiselectComponent,
                        InputtextComponent,
                        DropdownComponent
                    ]
                }]
        }] });

/*
 * Public API Surface of provenance-widgets
 */

/**
 * Generated bundle index. Do not edit.
 */

export { CheckboxComponent, DropdownComponent, InputtextComponent, MultiselectComponent, ProvenanceWidgetsComponent, ProvenanceWidgetsModule, ProvenanceWidgetsService, RadiobuttonComponent, SliderComponent };
//# sourceMappingURL=provenance-widgets.mjs.map
