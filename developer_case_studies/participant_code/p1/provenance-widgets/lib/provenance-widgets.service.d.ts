import { Options, ChangeContext } from '@angular-slider/ngx-slider';
import { ElementRef, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import { MODE } from './constants';
import * as i0 from "@angular/core";
interface EventDateIndex {
    date: Date;
    index: number;
}
interface Events {
    select?: EventDateIndex;
    unselect?: EventDateIndex;
}
export interface RangeSliderEvent {
    originalEvent: MouseEvent;
    values: number[];
}
export type Provenance = {
    dataByOption: Record<string, Events[]>;
    minTime: Date | undefined;
    oldMaxTime: Date | undefined;
    maxTime: Date | undefined;
    events: number;
    hasUserInteracted: boolean;
    selections: {
        value: string[];
        timestamp: Date;
    }[];
    revalidate?: boolean;
};
export declare class ProvenanceWidgetsService {
    dataByOption: Record<string, Events[]>;
    selections: {
        value: string[];
        timestamp: Date;
    }[];
    minTime: Date | undefined;
    oldMaxTime: Date | undefined;
    maxTime: Date | undefined;
    events: number;
    myId: string;
    self?: ElementRef;
    crosshairTarget?: any;
    provenanceMode: "aggregate" | "temporal";
    mode: typeof MODE;
    width: number;
    height: number;
    margin?: string;
    temporalFilterRange: number[];
    crosshairSelect: (keys: string[]) => Provenance | undefined | void;
    visType?: "multiselect" | "select" | "radio" | "checkbox";
    tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    hasUserInteracted: boolean;
    options: number;
    interaction: string;
    temporalRectKV?: [string, Events];
    resetInteraction(): void;
    temporalOptions: Options;
    constructor();
    setTemporalRange(change: ChangeContext): void;
    init(el: ElementRef, crosshairTarget?: any, visType?: typeof this.visType): void;
    setElement(el: ElementRef): void;
    resetProvenance(): void;
    setProvenance(provenance: Provenance): void;
    getProvenance(): Provenance;
    toggleProvenanceMode(btn: HTMLButtonElement, vis?: boolean): void;
    addEvent(key: string, event: "select" | "unselect", time: Date): void;
    addSimultaneousEvents(oldValues: string[], newValues: string[], freeze: boolean, hasUserInteracted: boolean, time?: Date, emitter?: EventEmitter<Provenance>, visualize?: () => void): void;
    visualize(mode: typeof MODE, width: number, height: number, margin?: string): void;
    private _visualize;
    static ɵfac: i0.ɵɵFactoryDeclaration<ProvenanceWidgetsService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ProvenanceWidgetsService>;
}
export {};
