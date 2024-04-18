import { AfterViewInit, ElementRef, OnDestroy, OnInit, EventEmitter, ChangeDetectorRef, NgZone, Renderer2 } from '@angular/core';
import { ChangeContext, SliderComponent as NgxSliderComponent } from '@angular-slider/ngx-slider';
import * as d3 from 'd3';
import { OverlayPanel } from 'primeng/overlaypanel';
import * as i0 from "@angular/core";
interface TimeStampedValues {
    value: number[];
    timestamp: Date;
    actualIndex?: number;
}
interface Bucket {
    date: Date;
    count: number;
    highValue?: number;
    maxIndex?: number;
}
export type SliderProvenance = {
    data: TimeStampedValues[];
    minTime: Date;
    oldMaxTime: Date;
    maxTime: Date;
    maxFrequency: number;
    buckets: Map<number, Bucket>;
    value: number;
    highValue: number;
    revalidate?: boolean;
} | {
    data: TimeStampedValues[];
    revalidate: true;
};
export declare class SliderComponent extends NgxSliderComponent implements OnInit, AfterViewInit, OnDestroy {
    mode: "hybrid" | "time" | "interaction";
    id: string;
    get provenance(): SliderProvenance | undefined;
    set provenance(value: SliderProvenance | undefined);
    _provenance?: SliderProvenance;
    visualize: boolean;
    freeze: boolean;
    provenanceChange: EventEmitter<SliderProvenance>;
    selectedChange: EventEmitter<ChangeContext>;
    wrapper: ElementRef<HTMLDivElement>;
    provenanceSvg: ElementRef<SVGSVGElement>;
    aggregateSvg: ElementRef<SVGSVGElement>;
    pButton: ElementRef<HTMLButtonElement>;
    data: TimeStampedValues[];
    minTime: Date | undefined;
    oldMaxTime: Date | undefined;
    maxTime: Date | undefined;
    maxFrequency: number;
    interval: number;
    sliderHeight: number;
    brush: d3.BrushBehavior<unknown>;
    filterStart?: number | Date;
    filterEnd?: number | Date;
    buckets: Map<number, Bucket>;
    el: ElementRef;
    constructor(renderer: Renderer2, elementRef: ElementRef, changeDetectionRef: ChangeDetectorRef, zone: NgZone);
    initBuckets(date: Date, value?: number, highValue?: number): void;
    addBucket(date: Date, value: number, highValue?: number): void;
    resetProvenance(): void;
    revalidateProvenance(provenance: SliderProvenance): void;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    private draw;
    _visualize(): void;
    onUserChangeEnd(change: ChangeContext, interaction?: string): void;
    handleProvenanceButtonClick(event: MouseEvent, target: any, op: OverlayPanel): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<SliderComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<SliderComponent, "provenance-slider", never, { "mode": "mode"; "id": "id"; "provenance": "provenance"; "visualize": "visualize"; "freeze": "freeze"; }, { "provenanceChange": "provenanceChange"; "selectedChange": "selectedChange"; }, never, never, false, never>;
}
export {};
