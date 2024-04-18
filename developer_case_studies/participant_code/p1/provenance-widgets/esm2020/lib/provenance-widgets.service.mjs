import { LabelType } from '@angular-slider/ngx-slider';
import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { getTooltip, interpolateLightOranges } from './utils';
import isEqual from 'lodash.isequal';
import * as i0 from "@angular/core";
export class ProvenanceWidgetsService {
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
        this.temporalFilterRange = [change.value, change.highValue];
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: this.self?.nativeElement.id,
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
        if (el?.nativeElement?.style?.position)
            el.nativeElement.style.position = "relative";
        this.self = el;
        this.crosshairTarget = crosshairTarget;
        this.visType = visType;
    }
    setElement(el) {
        if (el?.nativeElement?.style?.position)
            el.nativeElement.style.position = "relative";
        this.self = el;
    }
    resetProvenance() {
        this.dataByOption = {};
        this.selections = [];
        this.minTime = undefined;
        this.oldMaxTime = undefined;
        this.maxTime = undefined;
        this.events = 0;
        this.hasUserInteracted = false;
        // d3.select(this.self?.nativeElement).selectAll("rect").remove()
        const selector = this.crosshairTarget ? document.querySelector(this.crosshairTarget) : this.self?.nativeElement;
        d3.select(selector).selectAll("rect").remove();
    }
    setProvenance(provenance) {
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
            this.addSimultaneousEvents(selections[i - 1]?.value, selections[i].value, false, false, selections[i].timestamp);
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
        dispatchEvent(new CustomEvent("provenance-widgets", {
            detail: {
                id: this.self?.nativeElement.id,
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
        const oldSet = new Set(freeze ? oldValues : this.selections.at(-1)?.value);
        const newSet = new Set(newValues);
        const symDiff = new Set([...oldSet].filter(x => !newSet.has(x)).concat(newValues.filter(x => !oldSet.has(x))));
        const selected = [...symDiff].filter(v => newSet.has(v));
        const unselected = [...symDiff].filter(v => oldSet.has(v));
        if (hasUserInteracted) {
            this.hasUserInteracted = true;
            dispatchEvent(new CustomEvent("provenance-widgets", {
                detail: {
                    id: this.self?.nativeElement.id,
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
        emitter?.emit(this.getProvenance());
        visualize?.();
    }
    visualize(mode, width, height, margin) {
        this.mode = mode;
        this.width = width;
        this.height = height;
        this.margin = margin;
        this._visualize();
    }
    _visualize() {
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
        const selector = this.crosshairTarget ? document.querySelector(this.crosshairTarget) : this.self?.nativeElement;
        let left = selector.offsetWidth - width; // - (this.margin ? 0 : convertRemToPixels(1.25))
        if (!this.margin)
            left -= 40;
        if (this.visType === "multiselect")
            left -= 22;
        Object
            .entries(this.dataByOption)
            .forEach(([key, value], keyIndex) => {
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
                const selectDate = last.select?.date.getTime() || 0;
                const unselectDate = last.unselect?.date?.getTime() || 0;
                const ev = this.visType === "radio" || this.visType === "select" ? "select" : "interact";
                const date = this.visType === "radio" || this.visType === "select" ? selectDate : Math.max(selectDate, unselectDate);
                rect
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", aggX(this.visType === "radio" || this.visType === "select" ?
                    value.length :
                    value.reduce((a, v) => a + (v.unselect ? 1 : 0) + 1, 0)))
                    .attr("height", height)
                    .attr("fill", color(mode === "interaction" ? last.unselect?.index || last.select?.index : date))
                    .attr("stroke", "black")
                    .attr("stroke-width", date >= this.oldMaxTime?.getTime() ? 2 : 0)
                    .attr("stroke-dasharray", date === this.maxTime?.getTime() ? "0 0" : "4 1");
                d3.select(svg.node()?.parentElement)
                    .on("mouseover", (e) => {
                    if (this.provenanceMode === "temporal")
                        return;
                    dispatchEvent(new CustomEvent("provenance-widgets", {
                        detail: {
                            id: this.self?.nativeElement.id,
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
                  Label: ${this.self?.nativeElement?.dataset?.label || this.self?.nativeElement.id} <br/>
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
                    .attr("width", d => x(mode === "interaction" ?
                    d.unselect?.index || this.events
                    :
                        d.unselect?.date || this.maxTime)
                    -
                        x(mode === "interaction" ?
                            d.select.index :
                            d.select.date))
                    .attr("height", height)
                    .attr("fill", (v, i, a) => i === a.length - 1 ?
                    color(mode === "interaction" ?
                        v.unselect?.index || this.events :
                        v.unselect?.date || this.maxTime) :
                    "#E5E5E5")
                    .attr("opacity", 1)
                    .attr("data-key", key)
                    .attr("data-value", d => JSON.stringify(d, null, '\t'))
                    .attr("data-index", keyIndex);
                d3.select(svg.node()?.parentElement)
                    .on("mouseout", () => {
                    this.tooltip
                        .style("opacity", 0)
                        .style("display", "none");
                })
                    .on("mousemove", (e) => {
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
                        let parent = document.getElementById(`${this.myId}${key}`)?.parentElement;
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
                    const endDate = new Date(d.unselect?.date || new Date());
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
                  Label: ${this.self?.nativeElement?.dataset?.label || this.self?.nativeElement.id} <br/>
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
                            id: this.self?.nativeElement.id,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmVuYW5jZS13aWRnZXRzLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9wcm92ZW5hbmNlLXdpZGdldHMvc3JjL2xpYi9wcm92ZW5hbmNlLXdpZGdldHMuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQVcsU0FBUyxFQUFpQixNQUFNLDRCQUE0QixDQUFDO0FBQy9FLE9BQU8sRUFBNEIsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3JFLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBRXpCLE9BQU8sRUFBRSxVQUFVLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDOUQsT0FBTyxPQUFPLE1BQU0sZ0JBQWdCLENBQUE7O0FBOEJwQyxNQUFNLE9BQU8sd0JBQXdCO0lBeUJuQyxnQkFBZ0I7UUFDZCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQTtJQUMvQixDQUFDO0lBa0JEO1FBM0NBLGlCQUFZLEdBQTZCLEVBQUUsQ0FBQTtRQUMzQyxlQUFVLEdBQTJDLEVBQUUsQ0FBQTtRQUN2RCxZQUFPLEdBQXFCLFNBQVMsQ0FBQTtRQUNyQyxlQUFVLEdBQXFCLFNBQVMsQ0FBQTtRQUN4QyxZQUFPLEdBQXFCLFNBQVMsQ0FBQTtRQUNyQyxXQUFNLEdBQUcsQ0FBQyxDQUFBO1FBSVYsbUJBQWMsR0FBNkIsV0FBVyxDQUFBO1FBS3RELHdCQUFtQixHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBSTlCLHNCQUFpQixHQUFHLEtBQUssQ0FBQTtRQUN6QixZQUFPLEdBQUcsQ0FBQyxDQUFBO1FBQ1gsZ0JBQVcsR0FBRyxVQUFVLENBQUE7UUFPeEIsb0JBQWUsR0FBWTtZQUN6QixLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksRUFBRSxHQUFHO1lBQ1QsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixTQUFTLEVBQUUsQ0FBQyxL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RyxLQUFLLElBQUksT0FBTyxDQUFBO29CQUM3QyxDQUFDLENBQUMsQ0FBQTtvQkFFSixJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7d0JBQ3JFLE9BQU07cUJBQ1A7b0JBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQ2xCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFFLENBQUMsQ0FDekQsQ0FBQTtvQkFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLHFCQUFxQixDQUFBO29CQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFBO2dCQUNqQyxDQUFDLENBQUMsQ0FBQTthQUNMO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDOztzSEFuakJVLHdCQUF3QjswSEFBeEIsd0JBQXdCLGNBRnZCLE1BQU07NEZBRVAsd0JBQXdCO2tCQUhwQyxVQUFVO21CQUFDO29CQUNWLFVBQVUsRUFBRSxNQUFNO2lCQUNuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9wdGlvbnMsIExhYmVsVHlwZSwgQ2hhbmdlQ29udGV4dCB9IGZyb20gJ0Bhbmd1bGFyLXNsaWRlci9uZ3gtc2xpZGVyJztcbmltcG9ydCB7IEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZDMgZnJvbSAnZDMnO1xuaW1wb3J0IHsgTU9ERSB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IGdldFRvb2x0aXAsIGludGVycG9sYXRlTGlnaHRPcmFuZ2VzIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgaXNFcXVhbCBmcm9tICdsb2Rhc2guaXNlcXVhbCdcblxuaW50ZXJmYWNlIEV2ZW50RGF0ZUluZGV4IHtcbiAgZGF0ZTogRGF0ZVxuICBpbmRleDogbnVtYmVyXG59XG5pbnRlcmZhY2UgRXZlbnRzIHtcbiAgc2VsZWN0PzogRXZlbnREYXRlSW5kZXhcbiAgdW5zZWxlY3Q/OiBFdmVudERhdGVJbmRleFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJhbmdlU2xpZGVyRXZlbnQge1xuICBvcmlnaW5hbEV2ZW50OiBNb3VzZUV2ZW50XG4gIHZhbHVlczogbnVtYmVyW11cbn1cblxuZXhwb3J0IHR5cGUgUHJvdmVuYW5jZSA9IHtcbiAgZGF0YUJ5T3B0aW9uOiBSZWNvcmQ8c3RyaW5nLCBFdmVudHNbXT5cbiAgbWluVGltZTogRGF0ZSB8IHVuZGVmaW5lZFxuICBvbGRNYXhUaW1lOiBEYXRlIHwgdW5kZWZpbmVkXG4gIG1heFRpbWU6IERhdGUgfCB1bmRlZmluZWRcbiAgZXZlbnRzOiBudW1iZXJcbiAgaGFzVXNlckludGVyYWN0ZWQ6IGJvb2xlYW5cbiAgc2VsZWN0aW9uczogeyB2YWx1ZTogc3RyaW5nW107IHRpbWVzdGFtcDogRGF0ZSB9W11cbiAgcmV2YWxpZGF0ZT86IGJvb2xlYW5cbn1cblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgUHJvdmVuYW5jZVdpZGdldHNTZXJ2aWNlIHtcblxuICBkYXRhQnlPcHRpb246IFJlY29yZDxzdHJpbmcsIEV2ZW50c1tdPiA9IHt9XG4gIHNlbGVjdGlvbnM6IHsgdmFsdWU6IHN0cmluZ1tdOyB0aW1lc3RhbXA6IERhdGUgfVtdID0gW11cbiAgbWluVGltZTogRGF0ZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxuICBvbGRNYXhUaW1lOiBEYXRlIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG4gIG1heFRpbWU6IERhdGUgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcbiAgZXZlbnRzID0gMFxuICBteUlkOiBzdHJpbmdcbiAgc2VsZj86IEVsZW1lbnRSZWZcbiAgY3Jvc3NoYWlyVGFyZ2V0PzogYW55XG4gIHByb3ZlbmFuY2VNb2RlOiBcImFnZ3JlZ2F0ZVwiIHwgXCJ0ZW1wb3JhbFwiID0gXCJhZ2dyZWdhdGVcIlxuICBtb2RlITogdHlwZW9mIE1PREVcbiAgd2lkdGghOiBudW1iZXJcbiAgaGVpZ2h0ITogbnVtYmVyXG4gIG1hcmdpbj86IHN0cmluZ1xuICB0ZW1wb3JhbEZpbHRlclJhbmdlID0gWzAsIDEwMF1cbiAgY3Jvc3NoYWlyU2VsZWN0ITogKGtleXM6IHN0cmluZ1tdKSA9PiBQcm92ZW5hbmNlIHwgdW5kZWZpbmVkIHwgdm9pZFxuICB2aXNUeXBlPzogXCJtdWx0aXNlbGVjdFwiIHwgXCJzZWxlY3RcIiB8IFwicmFkaW9cIiB8IFwiY2hlY2tib3hcIlxuICB0b29sdGlwOiBkMy5TZWxlY3Rpb248SFRNTERpdkVsZW1lbnQsIHVua25vd24sIEhUTUxFbGVtZW50LCBhbnk+XG4gIGhhc1VzZXJJbnRlcmFjdGVkID0gZmFsc2VcbiAgb3B0aW9ucyA9IDBcbiAgaW50ZXJhY3Rpb24gPSBcImV4dGVybmFsXCJcbiAgdGVtcG9yYWxSZWN0S1Y/OiBbc3RyaW5nLCBFdmVudHNdIFxuXG4gIHJlc2V0SW50ZXJhY3Rpb24oKSB7XG4gICAgdGhpcy5pbnRlcmFjdGlvbiA9IFwiZXh0ZXJuYWxcIlxuICB9XG4gIFxuICB0ZW1wb3JhbE9wdGlvbnM6IE9wdGlvbnMgPSB7XG4gICAgZmxvb3I6IDAsXG4gICAgY2VpbDogMTAwLFxuICAgIGhpZGVQb2ludGVyTGFiZWxzOiB0cnVlLFxuICAgIHRyYW5zbGF0ZTogKHZhbHVlOiBudW1iZXIsIGxhYmVsOiBMYWJlbFR5cGUpOiBzdHJpbmcgPT4ge1xuICAgICAgc3dpdGNoKGxhYmVsKSB7XG4gICAgICAgIGNhc2UgTGFiZWxUeXBlLkZsb29yOlxuICAgICAgICAgIHJldHVybiB0aGlzLm1vZGUgPT09IFwiaW50ZXJhY3Rpb25cIiA/IFwibj0wXCIgOiBcInQ9MFwiXG4gICAgICAgIGNhc2UgTGFiZWxUeXBlLkNlaWw6XG4gICAgICAgICAgcmV0dXJuIFwibm93XCJcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gYCR7dmFsdWV9YFxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubXlJZCA9IGNyeXB0by5yYW5kb21VVUlEKClcbiAgICB0aGlzLnRvb2x0aXAgPSBnZXRUb29sdGlwKClcbiAgfVxuXG4gIHNldFRlbXBvcmFsUmFuZ2UoY2hhbmdlOiBDaGFuZ2VDb250ZXh0KSB7XG4gICAgdGhpcy50ZW1wb3JhbEZpbHRlclJhbmdlID0gW2NoYW5nZS52YWx1ZSwgY2hhbmdlLmhpZ2hWYWx1ZSFdXG4gICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwcm92ZW5hbmNlLXdpZGdldHNcIiwge1xuICAgICAgZGV0YWlsOiB7XG4gICAgICAgIGlkOiB0aGlzLnNlbGY/Lm5hdGl2ZUVsZW1lbnQuaWQsXG4gICAgICAgIHdpZGdldDogdGhpcy52aXNUeXBlLFxuICAgICAgICBtb2RlOiB0aGlzLm1vZGUsXG4gICAgICAgIGludGVyYWN0aW9uOiBcImJydXNoLWVuZFwiLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgc2VsZWN0aW9uOiB0aGlzLnRlbXBvcmFsRmlsdGVyUmFuZ2UsXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSlcbiAgICB0aGlzLl92aXN1YWxpemUoKVxuICB9XG5cbiAgaW5pdChlbDogRWxlbWVudFJlZiwgY3Jvc3NoYWlyVGFyZ2V0PzogYW55LCB2aXNUeXBlPzogdHlwZW9mIHRoaXMudmlzVHlwZSkge1xuICAgIGlmIChlbD8ubmF0aXZlRWxlbWVudD8uc3R5bGU/LnBvc2l0aW9uKVxuICAgICAgZWwubmF0aXZlRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIlxuICAgIHRoaXMuc2VsZiA9IGVsXG4gICAgdGhpcy5jcm9zc2hhaXJUYXJnZXQgPSBjcm9zc2hhaXJUYXJnZXRcbiAgICB0aGlzLnZpc1R5cGUgPSB2aXNUeXBlXG4gIH1cblxuICBzZXRFbGVtZW50KGVsOiBFbGVtZW50UmVmKSB7XG4gICAgaWYgKGVsPy5uYXRpdmVFbGVtZW50Py5zdHlsZT8ucG9zaXRpb24pXG4gICAgICBlbC5uYXRpdmVFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiXG4gICAgdGhpcy5zZWxmID0gZWxcbiAgfVxuXG4gIHJlc2V0UHJvdmVuYW5jZSgpIHtcbiAgICB0aGlzLmRhdGFCeU9wdGlvbiA9IHt9XG4gICAgdGhpcy5zZWxlY3Rpb25zID0gW11cbiAgICB0aGlzLm1pblRpbWUgPSB1bmRlZmluZWRcbiAgICB0aGlzLm9sZE1heFRpbWUgPSB1bmRlZmluZWRcbiAgICB0aGlzLm1heFRpbWUgPSB1bmRlZmluZWRcbiAgICB0aGlzLmV2ZW50cyA9IDBcbiAgICB0aGlzLmhhc1VzZXJJbnRlcmFjdGVkID0gZmFsc2VcbiAgICAvLyBkMy5zZWxlY3QodGhpcy5zZWxmPy5uYXRpdmVFbGVtZW50KS5zZWxlY3RBbGwoXCJyZWN0XCIpLnJlbW92ZSgpXG4gICAgY29uc3Qgc2VsZWN0b3IgPSB0aGlzLmNyb3NzaGFpclRhcmdldCA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5jcm9zc2hhaXJUYXJnZXQpIDogdGhpcy5zZWxmPy5uYXRpdmVFbGVtZW50XG4gICAgZDMuc2VsZWN0KHNlbGVjdG9yKS5zZWxlY3RBbGwoXCJyZWN0XCIpLnJlbW92ZSgpXG4gIH1cblxuICBzZXRQcm92ZW5hbmNlKHByb3ZlbmFuY2U6IFByb3ZlbmFuY2UpIHtcbiAgICBpZiAoIXByb3ZlbmFuY2UucmV2YWxpZGF0ZSkge1xuICAgICAgdGhpcy5kYXRhQnlPcHRpb24gPSBwcm92ZW5hbmNlLmRhdGFCeU9wdGlvblxuICAgICAgdGhpcy5taW5UaW1lID0gcHJvdmVuYW5jZS5taW5UaW1lXG4gICAgICB0aGlzLm9sZE1heFRpbWUgPSBwcm92ZW5hbmNlLm9sZE1heFRpbWVcbiAgICAgIHRoaXMubWF4VGltZSA9IHByb3ZlbmFuY2UubWF4VGltZVxuICAgICAgdGhpcy5ldmVudHMgPSBwcm92ZW5hbmNlLmV2ZW50c1xuICAgICAgdGhpcy5oYXNVc2VySW50ZXJhY3RlZCA9IHByb3ZlbmFuY2UuaGFzVXNlckludGVyYWN0ZWRcbiAgICAgIHRoaXMuc2VsZWN0aW9ucyA9IHByb3ZlbmFuY2Uuc2VsZWN0aW9uc1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHRoaXMucmVzZXRQcm92ZW5hbmNlKClcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gcHJvdmVuYW5jZS5zZWxlY3Rpb25zXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmFkZFNpbXVsdGFuZW91c0V2ZW50cyhcbiAgICAgICAgc2VsZWN0aW9uc1tpIC0gMV0/LnZhbHVlLFxuICAgICAgICBzZWxlY3Rpb25zW2ldLnZhbHVlLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgZmFsc2UsXG4gICAgICAgIHNlbGVjdGlvbnNbaV0udGltZXN0YW1wXG4gICAgICApXG4gICAgfVxuICAgIHRoaXMuaGFzVXNlckludGVyYWN0ZWQgPSB0cnVlXG4gIH1cblxuICBnZXRQcm92ZW5hbmNlKCk6IFByb3ZlbmFuY2Uge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRhQnlPcHRpb246IHRoaXMuZGF0YUJ5T3B0aW9uLFxuICAgICAgbWluVGltZTogdGhpcy5taW5UaW1lLFxuICAgICAgb2xkTWF4VGltZTogdGhpcy5vbGRNYXhUaW1lLFxuICAgICAgbWF4VGltZTogdGhpcy5tYXhUaW1lLFxuICAgICAgZXZlbnRzOiB0aGlzLmV2ZW50cyxcbiAgICAgIGhhc1VzZXJJbnRlcmFjdGVkOiB0aGlzLmhhc1VzZXJJbnRlcmFjdGVkLFxuICAgICAgc2VsZWN0aW9uczogdGhpcy5zZWxlY3Rpb25zXG4gICAgfVxuICB9XG5cbiAgdG9nZ2xlUHJvdmVuYW5jZU1vZGUoYnRuOiBIVE1MQnV0dG9uRWxlbWVudCwgdmlzID0gdHJ1ZSkge1xuICAgIGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicHJvdmVuYW5jZS13aWRnZXRzXCIsIHtcbiAgICAgIGRldGFpbDoge1xuICAgICAgICBpZDogdGhpcy5zZWxmPy5uYXRpdmVFbGVtZW50LmlkLFxuICAgICAgICB3aWRnZXQ6IHRoaXMudmlzVHlwZSxcbiAgICAgICAgbW9kZTogdGhpcy5tb2RlLFxuICAgICAgICBpbnRlcmFjdGlvbjogXCJwcm92ZW5hbmNlLWJ1dHRvbi1jbGlja1wiLFxuICAgICAgICBpbml0aWFsUHJvdmVuYW5jZU1vZGU6IHRoaXMucHJvdmVuYW5jZU1vZGUsXG4gICAgICB9XG4gICAgfSkpICAgIFxuICAgIHRoaXMucHJvdmVuYW5jZU1vZGUgPSB0aGlzLnByb3ZlbmFuY2VNb2RlID09PSBcImFnZ3JlZ2F0ZVwiID8gXCJ0ZW1wb3JhbFwiIDogXCJhZ2dyZWdhdGVcIlxuICAgIGQzXG4gICAgICAuc2VsZWN0KGJ0bilcbiAgICAgIC5zZWxlY3RDaGlsZChcInNwYW5cIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgYHAtYnV0dG9uLWljb24gcGkgcGktJHt0aGlzLnByb3ZlbmFuY2VNb2RlID09PSBcImFnZ3JlZ2F0ZVwiID8gXCJoaXN0b3J5XCIgOiBcImNoYXJ0LWJhclwifWApXG4gICAgICAuc3R5bGUoXCJ0cmFuc2Zvcm1cIiwgYHJvdGF0ZSgke3RoaXMucHJvdmVuYW5jZU1vZGUgPT09IFwiYWdncmVnYXRlXCIgPyBcIjBcIiA6IFwiOTBkZWdcIn0pYClcbiAgICBcbiAgICBPYmplY3RcbiAgICAgIC5lbnRyaWVzKHRoaXMuZGF0YUJ5T3B0aW9uKVxuICAgICAgLmZvckVhY2goKFtrZXldKSA9PiB7XG4gICAgICAgIGNvbnN0IGlkID0gdGhpcy5teUlkICsga2V5XG4gICAgICAgIGNvbnN0IHN2ZyA9IGQzLnNlbGVjdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkhKVxuICAgICAgICBzdmdcbiAgICAgICAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxuICAgICAgICAgIC5yZW1vdmUoKVxuICAgICAgfSlcbiAgICBpZiAodmlzKSB7XG4gICAgICB0aGlzLl92aXN1YWxpemUoKVxuICAgIH1cbiAgfVxuXG4gIC8vIERvIG5vdCBjYWxsIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCB1c2UgYWRkU2ltdWx0YW5lb3VzRXZlbnRzIGluc3RlYWRcbiAgYWRkRXZlbnQoa2V5OiBzdHJpbmcsIGV2ZW50OiBcInNlbGVjdFwiIHwgXCJ1bnNlbGVjdFwiLCB0aW1lOiBEYXRlKSB7XG5cbiAgICBpZiAodGhpcy5taW5UaW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMubWluVGltZSA9IHRpbWVcbiAgICB9XG4gICAgdGhpcy5vbGRNYXhUaW1lID0gdGhpcy5tYXhUaW1lIHx8IHRoaXMubWluVGltZVxuICAgIHRoaXMubWF4VGltZSA9IHRpbWVcblxuICAgIGlmICh0aGlzLmRhdGFCeU9wdGlvbltrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZGF0YUJ5T3B0aW9uW2tleV0gPSBbe1xuICAgICAgICBcInNlbGVjdFwiOiB7XG4gICAgICAgICAgZGF0ZTogdGltZSxcbiAgICAgICAgICBpbmRleDogdGhpcy5ldmVudHNcbiAgICAgICAgfVxuICAgICAgfV1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBsZW4gPSB0aGlzLmRhdGFCeU9wdGlvbltrZXldLmxlbmd0aFxuICAgIGNvbnN0IGxhc3QgPSB0aGlzLmRhdGFCeU9wdGlvbltrZXldW2xlbiAtIDFdXG4gICAgaWYgKGV2ZW50ID09PSBcInNlbGVjdFwiKSB7XG4gICAgICAvLyBDQVNFOiBUd28gc2VsZWN0cyBpbiBhIHJvdywgZG8gbm90aGluZ1xuICAgICAgaWYgKCFsYXN0W1widW5zZWxlY3RcIl0pIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICAvLyBDQVNFOiBTZWxlY3QgYWZ0ZXIgdW5zZWxlY3QsIGNyZWF0ZSBhIG5ldyBlbnRyeVxuICAgICAgdGhpcy5kYXRhQnlPcHRpb25ba2V5XS5wdXNoKHtcbiAgICAgICAgW2V2ZW50XToge1xuICAgICAgICAgIGRhdGU6IHRpbWUsXG4gICAgICAgICAgaW5kZXg6IHRoaXMuZXZlbnRzXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENBU0U6IFR3byB1bnNlbGVjdHMgaW4gYSByb3csIGRvIG5vdGhpbmdcbiAgICAgIGlmICghbGFzdFtcInNlbGVjdFwiXSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8vIENBU0U6IFVuc2VsZWN0IGFmdGVyIHNlbGVjdCwgdXBkYXRlIHRoZSBsYXN0IGVudHJ5XG4gICAgICBsYXN0W2V2ZW50XSA9IHtcbiAgICAgICAgZGF0ZTogdGltZSxcbiAgICAgICAgaW5kZXg6IHRoaXMuZXZlbnRzXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYWRkU2ltdWx0YW5lb3VzRXZlbnRzKFxuICAgIG9sZFZhbHVlczogc3RyaW5nW10sXG4gICAgbmV3VmFsdWVzOiBzdHJpbmdbXSxcbiAgICBmcmVlemU6IGJvb2xlYW4sXG4gICAgaGFzVXNlckludGVyYWN0ZWQ6IGJvb2xlYW4sXG4gICAgdGltZSA9IG5ldyBEYXRlKCksXG4gICAgZW1pdHRlcj86IEV2ZW50RW1pdHRlcjxQcm92ZW5hbmNlPixcbiAgICB2aXN1YWxpemU/OiAoKSA9PiB2b2lkXG4gICkge1xuICAgIGNvbnN0IG9sZFNldCA9IG5ldyBTZXQoZnJlZXplID8gb2xkVmFsdWVzIDogdGhpcy5zZWxlY3Rpb25zLmF0KC0xKT8udmFsdWUpXG4gICAgY29uc3QgbmV3U2V0ID0gbmV3IFNldChuZXdWYWx1ZXMpXG4gICAgY29uc3Qgc3ltRGlmZiA9IG5ldyBTZXQoXG4gICAgICBbLi4ub2xkU2V0XS5maWx0ZXIoeCA9PiAhbmV3U2V0Lmhhcyh4KSkuY29uY2F0KFxuICAgICAgICBuZXdWYWx1ZXMuZmlsdGVyKHggPT4gIW9sZFNldC5oYXMoeCkpXG4gICAgICApXG4gICAgKVxuICAgIGNvbnN0IHNlbGVjdGVkID0gWy4uLnN5bURpZmZdLmZpbHRlcih2ID0+IG5ld1NldC5oYXModikpXG4gICAgY29uc3QgdW5zZWxlY3RlZCA9IFsuLi5zeW1EaWZmXS5maWx0ZXIodiA9PiBvbGRTZXQuaGFzKHYpKVxuICAgIGlmIChoYXNVc2VySW50ZXJhY3RlZCkge1xuICAgICAgdGhpcy5oYXNVc2VySW50ZXJhY3RlZCA9IHRydWVcbiAgICAgIGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicHJvdmVuYW5jZS13aWRnZXRzXCIsIHtcbiAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgaWQ6IHRoaXMuc2VsZj8ubmF0aXZlRWxlbWVudC5pZCxcbiAgICAgICAgICB3aWRnZXQ6IHRoaXMudmlzVHlwZSxcbiAgICAgICAgICBtb2RlOiB0aGlzLm1vZGUsXG4gICAgICAgICAgaW50ZXJhY3Rpb246IHRoaXMuaW50ZXJhY3Rpb24sXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgc2VsZWN0ZWQsXG4gICAgICAgICAgICB1bnNlbGVjdGVkLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb246IHRoaXMuZXZlbnRzICsgMVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkpXG4gICAgfVxuICAgIGlmIChmcmVlemUpXG4gICAgICByZXR1cm4gXG4gICAgdW5zZWxlY3RlZC5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoa2V5LCBcInVuc2VsZWN0XCIsIHRpbWUpXG4gICAgfSlcbiAgICBzZWxlY3RlZC5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoa2V5LCBcInNlbGVjdFwiLCB0aW1lKVxuICAgIH0pXG4gICAgdGhpcy5zZWxlY3Rpb25zLnB1c2goeyB2YWx1ZTogbmV3VmFsdWVzLCB0aW1lc3RhbXA6IHRpbWUgfSlcbiAgICB0aGlzLmV2ZW50cysrXG4gICAgdGhpcy5pbnRlcmFjdGlvbiA9IFwiZXh0ZXJuYWxcIlxuICAgIGVtaXR0ZXI/LmVtaXQodGhpcy5nZXRQcm92ZW5hbmNlKCkpXG4gICAgdmlzdWFsaXplPy4oKVxuICB9XG5cbiAgdmlzdWFsaXplKG1vZGU6IHR5cGVvZiBNT0RFLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbWFyZ2luPzogc3RyaW5nKSB7XG4gICAgdGhpcy5tb2RlID0gbW9kZVxuICAgIHRoaXMud2lkdGggPSB3aWR0aFxuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XG4gICAgdGhpcy5tYXJnaW4gPSBtYXJnaW5cbiAgICB0aGlzLl92aXN1YWxpemUoKVxuICB9XG5cbiAgcHJpdmF0ZSBfdmlzdWFsaXplKCkge1xuICAgIGlmICghdGhpcy5taW5UaW1lKVxuICAgICAgcmV0dXJuXG4gICAgY29uc3QgbW9kZSA9IHRoaXMubW9kZVxuICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aFxuICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuaGVpZ2h0XG4gICAgY29uc3QgbWFyZ2luID0gdGhpcy5tYXJnaW5cbiAgICBjb25zdCBzY2FsZUZpbHRlclRvRGF0ZSA9IGQzLnNjYWxlTGluZWFyKCkuZG9tYWluKFswLCAxMDBdKS5yYW5nZShbdGhpcy5taW5UaW1lISwgdGhpcy5tYXhUaW1lIV0gYXMgYW55KSBhcyBhbnlcbiAgICBjb25zdCBzY2FsZUZpbHRlclRvRXZlbnRzID0gZDMuc2NhbGVMaW5lYXIoKS5kb21haW4oWzAsIDEwMF0pLnJhbmdlKFswLCB0aGlzLmV2ZW50c10pXG4gICAgY29uc3QgdGVtcG9yYWxEYXRlUmFuZ2U6IERhdGVbXSA9IHRoaXMudGVtcG9yYWxGaWx0ZXJSYW5nZS5tYXAoc2NhbGVGaWx0ZXJUb0RhdGUpXG4gICAgY29uc3QgdGVtcG9yYWxFdmVudFJhbmdlID0gdGhpcy50ZW1wb3JhbEZpbHRlclJhbmdlLm1hcChzY2FsZUZpbHRlclRvRXZlbnRzKVxuICAgIGNvbnN0IHggPSBtb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBkMy5zY2FsZUxpbmVhcigpLmRvbWFpbih0ZW1wb3JhbEV2ZW50UmFuZ2UpIDogZDMuc2NhbGVUaW1lKCkuZG9tYWluKHRlbXBvcmFsRGF0ZVJhbmdlKVxuXG4gICAgeC5yYW5nZShbMCwgd2lkdGhdKVxuXG4gICAgY29uc3QgYWdnWCA9IGQzXG4gICAgICAuc2NhbGVMaW5lYXIoKVxuICAgICAgLmRvbWFpbihbMCwgZDMubWF4KFxuICAgICAgICAgIE9iamVjdC52YWx1ZXModGhpcy5kYXRhQnlPcHRpb24pLCBcbiAgICAgICAgICBkID0+IHRoaXMudmlzVHlwZSA9PT0gXCJyYWRpb1wiIHx8IHRoaXMudmlzVHlwZSA9PT0gXCJzZWxlY3RcIiA/XG4gICAgICAgICAgZC5sZW5ndGggOlxuICAgICAgICAgIGQucmVkdWNlKChhLCB2KSA9PiBhICsgKHYudW5zZWxlY3QgPyAxIDogMCkgKyAxLCAwKVxuICAgICAgICApIVxuICAgICAgXSkucmFuZ2UoWzAsIHdpZHRoXSlcblxuICAgIGNvbnN0IGNvbG9yID0gZDNcbiAgICAgIC5zY2FsZVNlcXVlbnRpYWwoaW50ZXJwb2xhdGVMaWdodE9yYW5nZXMpXG4gICAgICAuZG9tYWluKFxuICAgICAgICBtb2RlID09PSBcImludGVyYWN0aW9uXCIgP1xuICAgICAgICBbMCwgdGhpcy5ldmVudHNdIDpcbiAgICAgICAgW3RoaXMubWluVGltZSEuZ2V0VGltZSgpLCB0aGlzLm1heFRpbWUhLmdldFRpbWUoKV1cbiAgICAgIClcblxuICAgIGNvbnN0IHNlbGVjdG9yID0gdGhpcy5jcm9zc2hhaXJUYXJnZXQgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuY3Jvc3NoYWlyVGFyZ2V0KSA6IHRoaXMuc2VsZj8ubmF0aXZlRWxlbWVudFxuXG4gICAgbGV0IGxlZnQgPSBzZWxlY3Rvci5vZmZzZXRXaWR0aCAtIHdpZHRoLy8gLSAodGhpcy5tYXJnaW4gPyAwIDogY29udmVydFJlbVRvUGl4ZWxzKDEuMjUpKVxuICAgIGlmICghdGhpcy5tYXJnaW4pXG4gICAgICBsZWZ0IC09IDQwXG4gICAgaWYgKHRoaXMudmlzVHlwZSA9PT0gXCJtdWx0aXNlbGVjdFwiKVxuICAgICAgbGVmdCAtPSAyMlxuICAgIFxuICAgIE9iamVjdFxuICAgICAgLmVudHJpZXModGhpcy5kYXRhQnlPcHRpb24pXG4gICAgICAuZm9yRWFjaCgoW2tleSwgdmFsdWVdLCBrZXlJbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBpZCA9IHRoaXMubXlJZCArIGtleVxuICAgICAgICBjb25zdCBzdmcgPSBkMy5zZWxlY3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpISlcbiAgICAgICAgc3ZnXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgICAgICAgLnN0eWxlKFwibWFyZ2luXCIsIG1hcmdpbiB8fCBcIjBcIilcbiAgICAgICAgaWYgKHRoaXMucHJvdmVuYW5jZU1vZGUgPT09IFwiYWdncmVnYXRlXCIpIHtcbiAgICAgICAgICBsZXQgcmVjdDpkMy5TZWxlY3Rpb248U1ZHUmVjdEVsZW1lbnQsIHVua25vd24sIG51bGwsIHVuZGVmaW5lZD4gPSBzdmdcbiAgICAgICAgICAgIC5zZWxlY3QoXCJyZWN0XCIpXG4gIFxuICAgICAgICAgIGlmIChyZWN0LmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHJlY3QgPSBzdmdcbiAgICAgICAgICAgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgbGFzdCA9IHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdXG4gICAgICAgICAgY29uc3Qgc2VsZWN0RGF0ZSA9IGxhc3Quc2VsZWN0Py5kYXRlLmdldFRpbWUoKSB8fCAwXG4gICAgICAgICAgY29uc3QgdW5zZWxlY3REYXRlID0gbGFzdC51bnNlbGVjdD8uZGF0ZT8uZ2V0VGltZSgpIHx8IDBcbiAgICAgICAgICBjb25zdCBldiA9IHRoaXMudmlzVHlwZSA9PT0gXCJyYWRpb1wiIHx8IHRoaXMudmlzVHlwZSA9PT0gXCJzZWxlY3RcIiA/IFwic2VsZWN0XCIgOiBcImludGVyYWN0XCJcbiAgICAgICAgICBjb25zdCBkYXRlID0gdGhpcy52aXNUeXBlID09PSBcInJhZGlvXCIgfHwgdGhpcy52aXNUeXBlID09PSBcInNlbGVjdFwiID8gc2VsZWN0RGF0ZSA6IE1hdGgubWF4KHNlbGVjdERhdGUsIHVuc2VsZWN0RGF0ZSlcblxuICAgICAgICAgIHJlY3RcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGFnZ1goXG4gICAgICAgICAgICAgIHRoaXMudmlzVHlwZSA9PT0gXCJyYWRpb1wiIHx8IHRoaXMudmlzVHlwZSA9PT0gXCJzZWxlY3RcIiA/XG4gICAgICAgICAgICAgIHZhbHVlLmxlbmd0aCA6XG4gICAgICAgICAgICAgIHZhbHVlLnJlZHVjZSgoYSwgdikgPT4gYSArICh2LnVuc2VsZWN0ID8gMSA6IDApICsgMSwgMClcbiAgICAgICAgICAgICkpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgY29sb3IobW9kZSA9PT0gXCJpbnRlcmFjdGlvblwiID8gbGFzdC51bnNlbGVjdD8uaW5kZXggfHwgbGFzdC5zZWxlY3Q/LmluZGV4ISA6IGRhdGUpKVxuICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZGF0ZSA+PSB0aGlzLm9sZE1heFRpbWU/LmdldFRpbWUoKSEgPyAyIDogMClcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBkYXRlID09PSB0aGlzLm1heFRpbWU/LmdldFRpbWUoKSA/IFwiMCAwXCIgOiBcIjQgMVwiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgZDMuc2VsZWN0KHN2Zy5ub2RlKCk/LnBhcmVudEVsZW1lbnQhKVxuICAgICAgICAgICAgLm9uKFwibW91c2VvdmVyXCIsIChlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnByb3ZlbmFuY2VNb2RlID09PSBcInRlbXBvcmFsXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicHJvdmVuYW5jZS13aWRnZXRzXCIsIHtcbiAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgIGlkOiB0aGlzLnNlbGY/Lm5hdGl2ZUVsZW1lbnQuaWQsXG4gICAgICAgICAgICAgICAgICB3aWRnZXQ6IHRoaXMudmlzVHlwZSxcbiAgICAgICAgICAgICAgICAgIG1vZGU6IHRoaXMubW9kZSxcbiAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uOiBcImFnZ3JlZ2F0ZS1yZWN0LWhvdmVyXCIsXG4gICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLm1hcCh2ID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgc2VsZWN0OiB2LnNlbGVjdCxcbiAgICAgICAgICAgICAgICAgICAgICB1bnNlbGVjdDogdi51bnNlbGVjdFxuICAgICAgICAgICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pKVxuXG4gICAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50WDogeCwgY2xpZW50WTogeSB9ID0gZVxuXG4gICAgICAgICAgICAgIHRoaXMudG9vbHRpcFxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgMSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIGAke3ggKyAxMH1weGApXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIGAke3kgKyAxMH1weGApXG4gICAgICAgICAgICAgICAgLnNlbGVjdChcImRpdlwiKVxuICAgICAgICAgICAgICAgIC5odG1sKGBcbiAgICAgICAgICAgICAgICAgIExhYmVsOiAke3RoaXMuc2VsZj8ubmF0aXZlRWxlbWVudD8uZGF0YXNldD8ubGFiZWwgfHwgdGhpcy5zZWxmPy5uYXRpdmVFbGVtZW50LmlkfSA8YnIvPlxuICAgICAgICAgICAgICAgICAgU2VsZWN0ZWQgdmFsdWU6ICR7a2V5fTxici8+XG4gICAgICAgICAgICAgICAgICAjIHRpbWVzICR7W1wic2VsZWN0XCIsIFwicmFkaW9cIl0uc29tZSh2ID0+IHYgPT09IHRoaXMudmlzVHlwZSkgPyBgc2VsZWN0ZWQ6ICR7dmFsdWUubGVuZ3RofWAgOiBgaW50ZXJhY3RlZDogJHt2YWx1ZS5yZWR1Y2UoKGEsIHYpID0+IGEgKyAodi51bnNlbGVjdCA/IDEgOiAwKSArIDEsIDApfWB9PGJyLz5cbiAgICAgICAgICAgICAgICAgIExhc3QgJHtldn1lZCBhdDogJHsobmV3IERhdGUoZGF0ZSkpLnRvTG9jYWxlU3RyaW5nKCl9PGJyLz4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcIm1vdXNlb3V0XCIsICgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy50b29sdGlwXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImRpc3BsYXlcIiwgXCJub25lXCIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN2Z1xuICAgICAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcbiAgICAgICAgICAgIC5kYXRhKHZhbHVlKVxuICAgICAgICAgICAgLmpvaW4oXCJyZWN0XCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZCA9PiB4KGQuc2VsZWN0IVttb2RlID09PSBcImludGVyYWN0aW9uXCIgPyBcImluZGV4XCIgOiBcImRhdGVcIl0pKVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGQgPT5cbiAgICAgICAgICAgICAgeChcbiAgICAgICAgICAgICAgICBtb2RlID09PSBcImludGVyYWN0aW9uXCIgP1xuICAgICAgICAgICAgICAgICAgZC51bnNlbGVjdD8uaW5kZXggfHwgdGhpcy5ldmVudHNcbiAgICAgICAgICAgICAgICAgIDpcbiAgICAgICAgICAgICAgICAgIGQudW5zZWxlY3Q/LmRhdGUgfHwgdGhpcy5tYXhUaW1lIVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIC1cbiAgICAgICAgICAgICAgeChcbiAgICAgICAgICAgICAgICBtb2RlID09PSBcImludGVyYWN0aW9uXCIgP1xuICAgICAgICAgICAgICAgICAgZC5zZWxlY3QhLmluZGV4IDpcbiAgICAgICAgICAgICAgICAgIGQuc2VsZWN0IS5kYXRlXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCAodiwgaSwgYSkgPT4gaSA9PT0gYS5sZW5ndGggLSAxID8gXG4gICAgICAgICAgICAgIGNvbG9yKG1vZGUgPT09IFwiaW50ZXJhY3Rpb25cIiA/IFxuICAgICAgICAgICAgICAgIHYudW5zZWxlY3Q/LmluZGV4IHx8IHRoaXMuZXZlbnRzIDogXG4gICAgICAgICAgICAgICAgdi51bnNlbGVjdD8uZGF0ZSB8fCB0aGlzLm1heFRpbWUhXG4gICAgICAgICAgICAgICkgOlxuICAgICAgICAgICAgICBcIiNFNUU1RTVcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmF0dHIoXCJvcGFjaXR5XCIsIDEpXG4gICAgICAgICAgICAuYXR0cihcImRhdGEta2V5XCIsIGtleSlcbiAgICAgICAgICAgIC5hdHRyKFwiZGF0YS12YWx1ZVwiLCBkID0+IEpTT04uc3RyaW5naWZ5KGQsIG51bGwsICdcXHQnKSlcbiAgICAgICAgICAgIC5hdHRyKFwiZGF0YS1pbmRleFwiLCBrZXlJbmRleClcblxuICAgICAgICAgICAgZDMuc2VsZWN0KHN2Zy5ub2RlKCk/LnBhcmVudEVsZW1lbnQhKVxuICAgICAgICAgICAgLm9uKFwibW91c2VvdXRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvb2x0aXBcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwiZGlzcGxheVwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJtb3VzZW1vdmVcIiwgKGUpID0+IHtcbiAgICAgICAgICAgICAgbGV0IFttb3VzZV94XSA9IGQzLnBvaW50ZXIoZSlcbiAgICAgICAgICAgICAgbW91c2VfeCAtPSBsZWZ0XG4gICAgICAgICAgICAgIGxldCBbcmVjdHMsIHVuc2VsZWN0ZWRSZWN0c10gPSBkM1xuICAgICAgICAgICAgICAgIC5zZWxlY3Qoc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcbiAgICAgICAgICAgICAgICAubm9kZXMoKVxuICAgICAgICAgICAgICAgIC5yZWR1Y2U8W1NWR1JlY3RFbGVtZW50W10sIFNWR1JlY3RFbGVtZW50W11dPigoYWNjLCByZWN0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSBwYXJzZUludChyZWN0LmdldEF0dHJpYnV0ZShcInhcIikhKVxuICAgICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBwYXJzZUludChyZWN0LmdldEF0dHJpYnV0ZShcIndpZHRoXCIpISlcbiAgICAgICAgICAgICAgICAgIGlmICh4IDw9IG1vdXNlX3ggJiYgeCArIHdpZHRoID49IG1vdXNlX3gpIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjWzBdLnB1c2gocmVjdClcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFjY1sxXS5wdXNoKHJlY3QpXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4gYWNjXG4gICAgICAgICAgICAgICAgfSwgW1tdLFtdXSlcblxuICAgICAgICAgICAgICBpZiAocmVjdHMuZXZlcnkoKHJlY3Q6IGFueSkgPT4gcmVjdC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWtleVwiKSAhPT0ga2V5KSkge1xuICAgICAgICAgICAgICAgIHJlY3RzID0gW11cbiAgICAgICAgICAgICAgICB1bnNlbGVjdGVkUmVjdHMgPSBkM1xuICAgICAgICAgICAgICAgICAgLnNlbGVjdChzZWxlY3RvcilcbiAgICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXG4gICAgICAgICAgICAgICAgICAubm9kZXMoKSBhcyBTVkdSZWN0RWxlbWVudFtdXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBkM1xuICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwocmVjdHMpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsIFwidmFyKC0tYmx1ZS01MDApXCIpXG5cbiAgICAgICAgICAgICAgZDNcbiAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKHVuc2VsZWN0ZWRSZWN0cylcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJzdHJva2VcIiwgXCJub25lXCIpXG5cbiAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IG5ldyBTZXQ8c3RyaW5nPihcbiAgICAgICAgICAgICAgICByZWN0cy5tYXAoKHJlY3Q6IGFueSkgPT4gcmVjdC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWtleVwiKSEpXG4gICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh0aGlzLmRhdGFCeU9wdGlvbikpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYCR7dGhpcy5teUlkfSR7a2V5fWApPy5wYXJlbnRFbGVtZW50XG4gICAgICAgICAgICAgICAgaWYgKCFwYXJlbnQpXG4gICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNyb3NzaGFpclRhcmdldClcbiAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50IVxuICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0UGFyZW50ID0gZDNcbiAgICAgICAgICAgICAgICAgIC5zZWxlY3QocGFyZW50KVxuICAgICAgICAgICAgICAgICAgLnNlbGVjdENoaWxkcmVuKClcbiAgICAgICAgICAgICAgICAgIC5ub2RlcygpXG4gICAgICAgICAgICAgICAgICAuZmlsdGVyKChlOiBhbnkpID0+IGUuaWQgIT09IGAke3RoaXMubXlJZH0ke2tleX1gKVswXVxuICAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IGQzXG4gICAgICAgICAgICAgICAgICAuc2VsZWN0KGlucHV0UGFyZW50KVxuICAgICAgICAgICAgICAgICAgLnNlbGVjdENoaWxkKClcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY3Jvc3NoYWlyVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLnNlbGVjdChcImRpdjpudGgtY2hpbGQoMilcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2hpbGQuc3R5bGUoXCJib3JkZXItY29sb3JcIiwga2V5cy5oYXMoa2V5KSA/IFwidmFyKC0tYmx1ZS01MDApXCIgOiBcIiNjZWQ0ZGFcIilcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHJlY3QgPSByZWN0cy5maW5kKChyZWN0OiBhbnkpID0+IHJlY3QuZ2V0QXR0cmlidXRlKFwiZGF0YS1rZXlcIikgPT09IGtleSlcblxuICAgICAgICAgICAgICBpZiAoIXJlY3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRlbXBvcmFsUmVjdEtWID0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgdGhpcy50b29sdGlwXG4gICAgICAgICAgICAgICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG4gICAgICAgICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgZCA9IEpTT04ucGFyc2UocmVjdC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpISkgYXMgRXZlbnRzXG5cbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoZC5zZWxlY3QhLmRhdGUpXG4gICAgICAgICAgICAgIGNvbnN0IGVuZERhdGUgPSBuZXcgRGF0ZShkLnVuc2VsZWN0Py5kYXRlIHx8IG5ldyBEYXRlKCkpXG4gICAgICAgICAgICAgIGxldCBzZWxlY3Rpb25UaW1lOiBzdHJpbmd8bnVtYmVyID0gZDMudGltZVNlY29uZC5jb3VudChzdGFydERhdGUsIGVuZERhdGUpXG4gICAgICAgICAgICAgIGlmIChzZWxlY3Rpb25UaW1lID4gNjApXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uVGltZSA9IGQzLnRpbWVNaW51dGUuY291bnQoc3RhcnREYXRlLCBlbmREYXRlKSArIFwibVwiXG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvblRpbWUgPSBzZWxlY3Rpb25UaW1lICsgXCJzXCJcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50WDogeCwgY2xpZW50WTogeSB9ID0gZVxuXG4gICAgICAgICAgICAgIHRoaXMudG9vbHRpcFxuICAgICAgICAgICAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgMSlcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIGAke3ggKyAxMH1weGApXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidG9wXCIsIGAke3kgKyAxMH1weGApXG4gICAgICAgICAgICAgICAgLnNlbGVjdChcImRpdlwiKVxuICAgICAgICAgICAgICAgIC5odG1sKGBcbiAgICAgICAgICAgICAgICAgIExhYmVsOiAke3RoaXMuc2VsZj8ubmF0aXZlRWxlbWVudD8uZGF0YXNldD8ubGFiZWwgfHwgdGhpcy5zZWxmPy5uYXRpdmVFbGVtZW50LmlkfSA8YnIvPlxuICAgICAgICAgICAgICAgICAgU2VsZWN0ZWQgdmFsdWU6ICR7a2V5fTxici8+XG4gICAgICAgICAgICAgICAgICBTZWxlY3RlZCBhdDogJHtzdGFydERhdGUudG9Mb2NhbGVTdHJpbmcoKX1cbiAgICAgICAgICAgICAgICAgICR7ZC51bnNlbGVjdCA/IGA8YnIvPlVuc2VsZWN0ZWQgYXQ6ICR7bmV3IERhdGUoZC51bnNlbGVjdC5kYXRlKS50b0xvY2FsZVN0cmluZygpfWAgOiBcIlwifTxici8+XG4gICAgICAgICAgICAgICAgICBTZWxlY3RlZCBmb3I6ICR7c2VsZWN0aW9uVGltZX1cbiAgICAgICAgICAgICAgICBgKVxuXG4gICAgICAgICAgICAgICAgY29uc3Qga3YgPSBba2V5LCBkXSBhcyBbc3RyaW5nLCBFdmVudHNdXG4gICAgICAgICAgICAgICAgaWYgKGlzRXF1YWwoa3YsIHRoaXMudGVtcG9yYWxSZWN0S1YpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50ZW1wb3JhbFJlY3RLViA9IGt2XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJwcm92ZW5hbmNlLXdpZGdldHNcIiwge1xuICAgICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzLnNlbGY/Lm5hdGl2ZUVsZW1lbnQuaWQsXG4gICAgICAgICAgICAgICAgICAgIHdpZGdldDogdGhpcy52aXNUeXBlLFxuICAgICAgICAgICAgICAgICAgICBtb2RlOiB0aGlzLm1vZGUsXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uOiBcInRlbXBvcmFsLXJlY3QtaG92ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgICAgbGV0IFttb3VzZV94XSA9IGQzLnBvaW50ZXIoZSlcbiAgICAgICAgICAgICAgbW91c2VfeCAtPSBsZWZ0XG4gICAgICAgICAgICAgIGNvbnN0IHJlY3RzID0gZDNcbiAgICAgICAgICAgICAgICAuc2VsZWN0KHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXG4gICAgICAgICAgICAgICAgLm5vZGVzKClcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChyZWN0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSBwYXJzZUludChyZWN0LmdldEF0dHJpYnV0ZShcInhcIikhKVxuICAgICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBwYXJzZUludChyZWN0LmdldEF0dHJpYnV0ZShcIndpZHRoXCIpISlcbiAgICAgICAgICAgICAgICAgIHJldHVybiB4IDw9IG1vdXNlX3ggJiYgeCArIHdpZHRoID49IG1vdXNlX3hcbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgIGlmIChyZWN0cy5ldmVyeSgocmVjdDogYW55KSA9PiByZWN0LmdldEF0dHJpYnV0ZShcImRhdGEta2V5XCIpICE9PSBrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBrZXlzID0gbmV3IFNldDxzdHJpbmc+KFxuICAgICAgICAgICAgICAgIHJlY3RzLm1hcCgocmVjdDogYW55KSA9PiByZWN0LmdldEF0dHJpYnV0ZShcImRhdGEta2V5XCIpISlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uID0gXCJ0ZW1wb3JhbC1yZWN0LWNsaWNrXCJcbiAgICAgICAgICAgICAgdGhpcy5jcm9zc2hhaXJTZWxlY3QoWy4uLmtleXNdKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgfVxufVxuIl19