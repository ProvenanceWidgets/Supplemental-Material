import { OnDestroy, ElementRef, ChangeDetectorRef, NgZone, Renderer2, OnInit, EventEmitter, AfterViewInit } from '@angular/core';
import { MultiSelect } from 'primeng/multiselect';
import { FilterService, PrimeNGConfig, OverlayService } from 'primeng/api';
import { ProvenanceWidgetsService, Provenance } from '../provenance-widgets.service';
import * as i0 from "@angular/core";
export declare class MultiselectComponent extends MultiSelect implements OnInit, OnDestroy, AfterViewInit {
    private mss;
    firstChange: boolean;
    mode: "hybrid" | "time" | "interaction";
    get selected(): any[] | undefined;
    set selected(value: any[] | undefined);
    _selected?: typeof this.options;
    selectedChange: EventEmitter<any[]>;
    iconSize?: number;
    visualize: boolean;
    freeze: boolean;
    pMultiSelect: MultiSelect;
    interval: number;
    optionsRecord: Record<string, typeof this.options[0]>;
    myOverlayOptions: {
        mode?: import("primeng/api").OverlayModeType;
        style?: any;
        styleClass?: string | undefined;
        contentStyle?: any;
        contentStyleClass?: string | undefined;
        target?: any;
        appendTo: HTMLElement | "body";
        autoZIndex?: boolean | undefined;
        baseZIndex?: number | undefined;
        showTransitionOptions?: string | undefined;
        hideTransitionOptions?: string | undefined;
        hideOnEscape?: boolean | undefined;
        listener?: ((event: Event, options?: import("primeng/api").OverlayListenerOptions | undefined) => boolean | void) | undefined;
        responsive?: import("primeng/api").ResponsiveOverlayOptions | undefined;
        onBeforeShow?: ((event?: import("primeng/api").OverlayOnBeforeShowEvent | undefined) => void) | undefined;
        onShow?: ((event?: import("primeng/api").OverlayOnShowEvent | undefined) => void) | undefined;
        onBeforeHide?: ((event?: import("primeng/api").OverlayOnBeforeHideEvent | undefined) => void) | undefined;
        onHide?: ((event?: import("primeng/api").OverlayOnHideEvent | undefined) => void) | undefined;
        onAnimationStart?: ((event?: import("@angular/animations").AnimationEvent | undefined) => void) | undefined;
        onAnimationDone?: ((event?: import("@angular/animations").AnimationEvent | undefined) => void) | undefined;
    };
    get provenance(): Provenance | undefined;
    set provenance(value: Provenance | undefined);
    _provenance?: Provenance;
    provenanceChange: EventEmitter<Provenance>;
    constructor(mss: ProvenanceWidgetsService, el: ElementRef<any>, renderer: Renderer2, cd: ChangeDetectorRef, zone: NgZone, filterService: FilterService, config: PrimeNGConfig, overlayService: OverlayService);
    getId(): string;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    handleHide(e: any): void;
    handleShow(e: any): void;
    handleChange(value: typeof this.options): void;
    _visualize(): void;
    getOption(key: string): string;
    getProvenance(): ProvenanceWidgetsService;
    handleClick(btn: HTMLButtonElement): void;
    handleFilter(event: any): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MultiselectComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MultiselectComponent, "provenance-multiselect", never, { "mode": "mode"; "selected": "selected"; "iconSize": "iconSize"; "visualize": "visualize"; "freeze": "freeze"; "provenance": "provenance"; }, { "selectedChange": "selectedChange"; "provenanceChange": "provenanceChange"; }, never, never, false, never>;
}
