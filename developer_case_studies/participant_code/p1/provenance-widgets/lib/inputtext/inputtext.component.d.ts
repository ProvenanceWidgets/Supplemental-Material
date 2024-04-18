import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, OnInit } from "@angular/core";
import * as d3 from "d3";
import { AutoComplete } from "primeng/autocomplete";
import { OverlayPanel } from "primeng/overlaypanel";
import * as i0 from "@angular/core";
interface TimeStampedValues {
    value: string;
    timestamp: Date;
}
interface TimeStampedCount {
    count: number;
    timestamp: Date;
    maxIndex: number;
}
interface AutoCompleteCompleteEvent {
    originalEvent: Event;
    query: string;
}
export type InputTextProvenance = {
    data: TimeStampedValues[];
    dictionary: Record<string, TimeStampedCount>;
    minTime?: Date;
    oldMaxTime?: Date;
    maxTime?: Date;
    minMsBetweenInteractions: number;
    revalidate?: boolean;
} | {
    revalidate: true;
    data: TimeStampedValues[];
};
export declare class InputtextComponent extends AutoComplete implements OnInit, AfterViewInit, OnDestroy {
    mode: "hybrid" | "time" | "interaction";
    id: string;
    visualize: boolean;
    wrapper: ElementRef<HTMLDivElement>;
    svg: ElementRef<SVGSVGElement>;
    button: ElementRef<HTMLButtonElement>;
    freeze: boolean;
    value: any;
    valueChange: EventEmitter<any>;
    get provenance(): InputTextProvenance | undefined;
    set provenance(value: InputTextProvenance | undefined);
    _provenance?: InputTextProvenance;
    provenanceChange: EventEmitter<InputTextProvenance>;
    data: TimeStampedValues[];
    dictionary: Record<string, TimeStampedCount>;
    query: string;
    minTime: Date | undefined;
    oldMaxTime: Date | undefined;
    maxTime: Date | undefined;
    minMsBetweenInteractions: number;
    interval: number;
    hasUserInteracted: boolean;
    tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    setProvenance(provenance: InputTextProvenance): void;
    getProvenance(): InputTextProvenance;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    handleKeyUp(event: KeyboardEvent): void;
    handleEnter(eventType: "click" | "enter" | "select"): void;
    _visualize(): void;
    handleSearch(event: AutoCompleteCompleteEvent): void;
    getSuggestions(): {
        label: string;
        count: number;
        timestamp: Date;
        color: string;
        width: number;
    }[];
    handleClear(autocomplete: AutoComplete, event: any): void;
    handleMouseOver(event: MouseEvent, suggestion: any): void;
    handleMouseOut(): void;
    handleProvenanceButtonClick(event: MouseEvent, target: any, op: OverlayPanel): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<InputtextComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<InputtextComponent, "provenance-inputtext", never, { "mode": "mode"; "id": "id"; "visualize": "visualize"; "freeze": "freeze"; "value": "value"; "provenance": "provenance"; }, { "valueChange": "valueChange"; "provenanceChange": "provenanceChange"; }, never, never, false, never>;
}
export {};
