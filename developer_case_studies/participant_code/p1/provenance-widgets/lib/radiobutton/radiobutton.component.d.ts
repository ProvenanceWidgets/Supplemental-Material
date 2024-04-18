import { OnInit, EventEmitter, AfterViewInit } from '@angular/core';
import { ElementRef, OnDestroy } from '@angular/core';
import { ProvenanceWidgetsService, Provenance } from '../provenance-widgets.service';
import * as i0 from "@angular/core";
interface RadioButtonClickEvent {
    /**
     * Browser event.
     */
    originalEvent: Event;
    /**
     * Browser event.
     */
    value: any;
}
export declare class RadiobuttonComponent implements OnDestroy, OnInit, AfterViewInit {
    private mss;
    private el;
    /**
     * Value of the radiobutton.
     * @group Props
     */
    value: any;
    /**
     * The name of the form control.
     * @group Props
     */
    formControlName: string | undefined;
    /**
     * Name of the radiobutton group.
     * @group Props
     */
    name: string | undefined;
    /**
     * When present, it specifies that the element should be disabled.
     * @group Props
     */
    disabled: boolean | undefined;
    /**
     * Label of the radiobutton.
     * @group Props
     */
    label: string | undefined;
    /**
     * Index of the element in tabbing order.
     * @group Props
     */
    tabindex: number | undefined;
    /**
     * Identifier of the focus input to match a label defined for the component.
     * @group Props
     */
    inputId: string | undefined;
    /**
     * Establishes relationships between the component and label(s) where its value should be one or more element IDs.
     * @group Props
     */
    ariaLabelledBy: string | undefined;
    /**
     * Used to define a string that labels the input element.
     * @group Props
     */
    ariaLabel: string | undefined;
    /**
     * Inline style of the component.
     * @group Props
     */
    style: {
        [klass: string]: any;
    } | null | undefined;
    /**
     * Style class of the component.
     * @group Props
     */
    styleClass: string | undefined;
    /**
     * Style class of the label.
     * @group Props
     */
    labelStyleClass: string | undefined;
    /**
     * Callback to invoke on radio button click.
     * @param {RadioButtonClickEvent} event - Custom click event.
     * @group Emits
     */
    onClick: EventEmitter<RadioButtonClickEvent>;
    /**
     * Callback to invoke when the receives focus.
     * @param {Event} event - Browser event.
     * @group Emits
     */
    onFocus: EventEmitter<Event>;
    /**
     * Callback to invoke when the loses focus.
     * @param {Event} event - Browser event.
     * @group Emits
     */
    onBlur: EventEmitter<Event>;
    firstChange: boolean;
    mode: "hybrid" | "time" | "interaction";
    data: Record<any, any>[];
    get selected(): string | undefined;
    set selected(value: string | undefined);
    _selected?: string;
    visualize: boolean;
    freeze: boolean;
    selectedChange: EventEmitter<string>;
    interval: number;
    get provenance(): Provenance | undefined;
    set provenance(value: Provenance | undefined);
    _provenance?: Provenance;
    provenanceChange: EventEmitter<Provenance>;
    constructor(mss: ProvenanceWidgetsService, el: ElementRef);
    ngOnInit(): void;
    ngAfterViewInit(): void;
    getId(): string;
    ngOnDestroy(): void;
    change(e: any): void;
    _visualize(): void;
    getProvenance(): ProvenanceWidgetsService;
    static ɵfac: i0.ɵɵFactoryDeclaration<RadiobuttonComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<RadiobuttonComponent, "provenance-radiobutton", never, { "value": "value"; "formControlName": "formControlName"; "name": "name"; "disabled": "disabled"; "label": "label"; "tabindex": "tabindex"; "inputId": "inputId"; "ariaLabelledBy": "ariaLabelledBy"; "ariaLabel": "ariaLabel"; "style": "style"; "styleClass": "styleClass"; "labelStyleClass": "labelStyleClass"; "mode": "mode"; "data": "data"; "selected": "selected"; "visualize": "visualize"; "freeze": "freeze"; "provenance": "provenance"; }, { "onClick": "onClick"; "onFocus": "onFocus"; "onBlur": "onBlur"; "selectedChange": "selectedChange"; "provenanceChange": "provenanceChange"; }, never, never, false, never>;
}
export {};
