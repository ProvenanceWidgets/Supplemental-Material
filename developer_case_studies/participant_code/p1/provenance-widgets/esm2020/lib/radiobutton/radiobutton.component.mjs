import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';
import { Component, Input } from '@angular/core';
import { MODE } from '../constants';
import { ProvenanceWidgetsService } from '../provenance-widgets.service';
import isEqual from 'lodash.isequal';
import * as i0 from "@angular/core";
import * as i1 from "../provenance-widgets.service";
import * as i2 from "@angular/common";
import * as i3 from "@angular-slider/ngx-slider";
import * as i4 from "primeng/button";
import * as i5 from "@angular/forms";
import * as i6 from "primeng/radiobutton";
import * as i7 from "../icon/icon.component";
export class RadiobuttonComponent {
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
        if (this._provenance && value?.revalidate) {
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
        this.mss.options = this.data.length;
        this.mss.mode = this.mode;
        if (this.provenance?.hasUserInteracted || this.provenance?.revalidate) {
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
        this.mss.setElement(this.el);
        if (this.mss.getProvenance()?.hasUserInteracted)
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
RadiobuttonComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: RadiobuttonComponent, deps: [{ token: i1.ProvenanceWidgetsService }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Component });
RadiobuttonComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.2.10", type: RadiobuttonComponent, selector: "provenance-radiobutton", inputs: { value: "value", formControlName: "formControlName", name: "name", disabled: "disabled", label: "label", tabindex: "tabindex", inputId: "inputId", ariaLabelledBy: "ariaLabelledBy", ariaLabel: "ariaLabel", style: "style", styleClass: "styleClass", labelStyleClass: "labelStyleClass", mode: "mode", data: "data", selected: "selected", visualize: "visualize", freeze: "freeze", provenance: "provenance" }, outputs: { onClick: "onClick", onFocus: "onFocus", onBlur: "onBlur", selectedChange: "selectedChange", provenanceChange: "provenanceChange" }, providers: [ProvenanceWidgetsService], ngImport: i0, template: "<div\n    style=\"display: flex; margin-bottom: 1rem; margin-top: 1rem;\"\n>\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [style]=\"{'margin-right': '0.5rem', 'height': '22px', 'width': '22px', 'padding': '0px', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"getProvenance().toggleProvenanceMode(btn, true)\"\n    >\n    <provenance-icon \n        [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n        [size]=\"20\"\n        style=\"height: 20px;\"\n    ></provenance-icon>\n    </button>\n    <div class=\"custom-slider\" style=\"width: 100%\">\n        <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n            style=\"margin-top: 0px\"\n        >\n        </ngx-slider>\n    </div>\n</div>\n<div *ngFor=\"let d of data\" class=\"field-checkbox\">\n    <svg\n        [id]=\"getId() + d[value || 'value']\"\n        width=\"0\"\n        height=\"0\"\n        style=\"position: absolute;\"\n    >\n    </svg>\n    <p-radioButton\n        [inputId]=\"d[inputId || 'inputId'] || null\"\n        [name]=\"d[name || 'name'] || name || null\"\n        [value]=\"d[value || 'value'] || null\"\n        [label]=\"d[label || 'label'] || null\"\n        [disabled]=\"d['disabled'] || false\"\n        [tabindex]=\"d['tabindex'] || null\"\n        [style]=\"d['style'] || style || null\"\n        [styleClass]=\"d['styleClass'] || styleClass || null\"\n        [labelStyleClass]=\"d['labelStyleClass'] || labelStyleClass || null\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n    >\n    </p-radioButton>\n</div>\n", styles: ["::ng-deep p-radiobutton{z-index:2}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"], dependencies: [{ kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "component", type: i3.SliderComponent, selector: "ngx-slider", inputs: ["value", "highValue", "options", "manualRefresh", "triggerFocus"], outputs: ["valueChange", "highValueChange", "userChangeStart", "userChange", "userChangeEnd"] }, { kind: "directive", type: i4.ButtonDirective, selector: "[pButton]", inputs: ["iconPos", "loadingIcon", "label", "icon", "loading"] }, { kind: "directive", type: i5.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { kind: "directive", type: i5.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { kind: "component", type: i6.RadioButton, selector: "p-radioButton", inputs: ["value", "formControlName", "name", "disabled", "label", "tabindex", "inputId", "ariaLabelledBy", "ariaLabel", "style", "styleClass", "labelStyleClass"], outputs: ["onClick", "onFocus", "onBlur"] }, { kind: "component", type: i7.IconComponent, selector: "provenance-icon", inputs: ["icon", "size"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: RadiobuttonComponent, decorators: [{
            type: Component,
            args: [{ selector: 'provenance-radiobutton', providers: [ProvenanceWidgetsService], template: "<div\n    style=\"display: flex; margin-bottom: 1rem; margin-top: 1rem;\"\n>\n    <button\n        *ngIf=\"visualize\"\n        pButton\n        type=\"button\"\n        class=\"p-button-help p-button-text\"\n        [disabled]=\"!getProvenance().hasUserInteracted\"\n        [style]=\"{'margin-right': '0.5rem', 'height': '22px', 'width': '22px', 'padding': '0px', 'visibility': visualize ? 'visible' : 'hidden'}\"\n        #btn\n        (click)=\"getProvenance().toggleProvenanceMode(btn, true)\"\n    >\n    <provenance-icon \n        [icon]=\"!getProvenance().hasUserInteracted ? 'disabled' : getProvenance().provenanceMode\"\n        [size]=\"20\"\n        style=\"height: 20px;\"\n    ></provenance-icon>\n    </button>\n    <div class=\"custom-slider\" style=\"width: 100%\">\n        <ngx-slider\n            *ngIf=\"getProvenance().provenanceMode === 'temporal'\"\n            [value]=\"getProvenance().temporalFilterRange[0]\"\n            [highValue]=\"getProvenance().temporalFilterRange[1]\"\n            [options]=\"getProvenance().temporalOptions\"\n            (userChangeEnd)=\"getProvenance().setTemporalRange($event)\"\n            style=\"margin-top: 0px\"\n        >\n        </ngx-slider>\n    </div>\n</div>\n<div *ngFor=\"let d of data\" class=\"field-checkbox\">\n    <svg\n        [id]=\"getId() + d[value || 'value']\"\n        width=\"0\"\n        height=\"0\"\n        style=\"position: absolute;\"\n    >\n    </svg>\n    <p-radioButton\n        [inputId]=\"d[inputId || 'inputId'] || null\"\n        [name]=\"d[name || 'name'] || name || null\"\n        [value]=\"d[value || 'value'] || null\"\n        [label]=\"d[label || 'label'] || null\"\n        [disabled]=\"d['disabled'] || false\"\n        [tabindex]=\"d['tabindex'] || null\"\n        [style]=\"d['style'] || style || null\"\n        [styleClass]=\"d['styleClass'] || styleClass || null\"\n        [labelStyleClass]=\"d['labelStyleClass'] || labelStyleClass || null\"\n        (ngModelChange)=\"this.getProvenance().interaction = 'user-change'; selectedChange.emit($event)\"\n        [ngModel]=\"selected\"\n        (onBlur)=\"onBlur\"\n        (onClick)=\"onClick\"\n    >\n    </p-radioButton>\n</div>\n", styles: ["::ng-deep p-radiobutton{z-index:2}\n", "::ng-deep .custom-slider .ngx-slider .ngx-slider-bar{background:lightgray;height:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-selection{background:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer{width:8px;height:16px;top:auto;bottom:0;background-color:#333;border-top-left-radius:3px;border-top-right-radius:3px}::ng-deep .custom-slider .ngx-slider .ngx-slider-pointer:after{display:none}::ng-deep .custom-slider:not(.temporal-slider) .ngx-slider .ngx-slider-bubble{top:5px}::ng-deep .custom-slider .ngx-slider .ngx-slider-limit{font-weight:700;color:var(--blue-500)}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick{width:1px;height:10px;margin-left:4px;border-radius:0;background:#ffe4d1;top:-1px}::ng-deep .custom-slider .ngx-slider .ngx-slider-tick.ngx-slider-selected{background:var(--blue-500)}::ng-deep g.axis text{font-size:.7rem}::ng-deep .custom-slider span{margin-top:0!important;padding-top:0!important}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.ProvenanceWidgetsService }, { type: i0.ElementRef }]; }, propDecorators: { value: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFkaW9idXR0b24uY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvcHJvdmVuYW5jZS13aWRnZXRzL3NyYy9saWIvcmFkaW9idXR0b24vcmFkaW9idXR0b24uY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvcHJvdmVuYW5jZS13aWRnZXRzL3NyYy9saWIvcmFkaW9idXR0b24vcmFkaW9idXR0b24uY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFVLFlBQVksRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDcEUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN2QyxPQUFPLEVBQUUsU0FBUyxFQUFjLEtBQUssRUFBYSxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3BDLE9BQU8sRUFBRSx3QkFBd0IsRUFBYyxNQUFNLCtCQUErQixDQUFDO0FBQ3JGLE9BQU8sT0FBTyxNQUFNLGdCQUFnQixDQUFDOzs7Ozs7Ozs7QUFtQnJDLE1BQU0sT0FBTyxvQkFBb0I7SUFrRi9CLDZCQUE2QjtJQUM3QixJQUNJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUE7SUFDdkIsQ0FBQztJQUNELElBQUksUUFBUSxDQUFDLEtBQXlCO1FBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUNuQjtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO1FBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO0lBQ3hCLENBQUM7SUFPRCxJQUNJLFVBQVU7UUFDWixPQUFP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QkFBb0I7c0dBQXBCLG9CQUFvQiw0bEJBRnBCLENBQUMsd0JBQXdCLENBQUMsMEJDdEJ2QyxzcEVBd0RBOzRGRGhDYSxvQkFBb0I7a0JBTmhDLFNBQVM7K0JBQ0Usd0JBQXdCLGFBR3ZCLENBQUMsd0JBQXdCLENBQUM7d0lBTzVCLEtBQUs7c0JBQWIsS0FBSztnQkFLRyxlQUFlO3NCQUF2QixLQUFLO2dCQUtHLElBQUk7c0JBQVosS0FBSztnQkFLRyxRQUFRO3NCQUFoQixLQUFLO2dCQUtHLEtBQUs7c0JBQWIsS0FBSztnQkFLRyxRQUFRO3NCQUFoQixLQUFLO2dCQUtHLE9BQU87c0JBQWYsS0FBSztnQkFLRyxjQUFjO3NCQUF0QixLQUFLO2dCQUtHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBS0csS0FBSztzQkFBYixLQUFLO2dCQUtHLFVBQVU7c0JBQWxCLEtBQUs7Z0JBS0csZUFBZTtzQkFBdkIsS0FBSztnQkFNSSxPQUFPO3NCQUFoQixNQUFNO2dCQU1HLE9BQU87c0JBQWhCLE1BQU07Z0JBTUcsTUFBTTtzQkFBZixNQUFNO2dCQUVFLElBQUk7c0JBQVosS0FBSztnQkFDRyxJQUFJO3NCQUFaLEtBQUs7Z0JBR0YsUUFBUTtzQkFEWCxLQUFLO2dCQWFHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNJLGNBQWM7c0JBQXZCLE1BQU07Z0JBR0gsVUFBVTtzQkFEYixLQUFLO2dCQWFJLGdCQUFnQjtzQkFBekIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9uSW5pdCwgRXZlbnRFbWl0dGVyLCBBZnRlclZpZXdJbml0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPdXRwdXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbXBvbmVudCwgRWxlbWVudFJlZiwgSW5wdXQsIE9uRGVzdHJveSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTU9ERSB9IGZyb20gJy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBQcm92ZW5hbmNlV2lkZ2V0c1NlcnZpY2UsIFByb3ZlbmFuY2UgfSBmcm9tICcuLi9wcm92ZW5hbmNlLXdpZGdldHMuc2VydmljZSc7XG5pbXBvcnQgaXNFcXVhbCBmcm9tICdsb2Rhc2guaXNlcXVhbCc7XG5cbmludGVyZmFjZSBSYWRpb0J1dHRvbkNsaWNrRXZlbnQge1xuICAvKipcbiAgICogQnJvd3NlciBldmVudC5cbiAgICovXG4gIG9yaWdpbmFsRXZlbnQ6IEV2ZW50O1xuICAvKipcbiAgICogQnJvd3NlciBldmVudC5cbiAgICovXG4gIHZhbHVlOiBhbnk7XG59XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3Byb3ZlbmFuY2UtcmFkaW9idXR0b24nLFxuICB0ZW1wbGF0ZVVybDogJy4vcmFkaW9idXR0b24uY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9yYWRpb2J1dHRvbi5jb21wb25lbnQuc2NzcycsICcuLi9zbGlkZXIvc2xpZGVyLmNvbXBvbmVudC5zY3NzJ10sXG4gIHByb3ZpZGVyczogW1Byb3ZlbmFuY2VXaWRnZXRzU2VydmljZV1cbn0pXG5leHBvcnQgY2xhc3MgUmFkaW9idXR0b25Db21wb25lbnQgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uSW5pdCwgQWZ0ZXJWaWV3SW5pdCB7XG4gIC8qKlxuICAgKiBWYWx1ZSBvZiB0aGUgcmFkaW9idXR0b24uXG4gICAqIEBncm91cCBQcm9wc1xuICAgKi9cbiAgQElucHV0KCkgdmFsdWU6IGFueTtcbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSBmb3JtIGNvbnRyb2wuXG4gICAqIEBncm91cCBQcm9wc1xuICAgKi9cbiAgQElucHV0KCkgZm9ybUNvbnRyb2xOYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBOYW1lIG9mIHRoZSByYWRpb2J1dHRvbiBncm91cC5cbiAgICogQGdyb3VwIFByb3BzXG4gICAqL1xuICBASW5wdXQoKSBuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBXaGVuIHByZXNlbnQsIGl0IHNwZWNpZmllcyB0aGF0IHRoZSBlbGVtZW50IHNob3VsZCBiZSBkaXNhYmxlZC5cbiAgICogQGdyb3VwIFByb3BzXG4gICAqL1xuICBASW5wdXQoKSBkaXNhYmxlZDogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgLyoqXG4gICAqIExhYmVsIG9mIHRoZSByYWRpb2J1dHRvbi5cbiAgICogQGdyb3VwIFByb3BzXG4gICAqL1xuICBASW5wdXQoKSBsYWJlbDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGFiYmluZyBvcmRlci5cbiAgICogQGdyb3VwIFByb3BzXG4gICAqL1xuICBASW5wdXQoKSB0YWJpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogSWRlbnRpZmllciBvZiB0aGUgZm9jdXMgaW5wdXQgdG8gbWF0Y2ggYSBsYWJlbCBkZWZpbmVkIGZvciB0aGUgY29tcG9uZW50LlxuICAgKiBAZ3JvdXAgUHJvcHNcbiAgICovXG4gIEBJbnB1dCgpIGlucHV0SWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgLyoqXG4gICAqIEVzdGFibGlzaGVzIHJlbGF0aW9uc2hpcHMgYmV0d2VlbiB0aGUgY29tcG9uZW50IGFuZCBsYWJlbChzKSB3aGVyZSBpdHMgdmFsdWUgc2hvdWxkIGJlIG9uZSBvciBtb3JlIGVsZW1lbnQgSURzLlxuICAgKiBAZ3JvdXAgUHJvcHNcbiAgICovXG4gIEBJbnB1dCgpIGFyaWFMYWJlbGxlZEJ5OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBVc2VkIHRvIGRlZmluZSBhIHN0cmluZyB0aGF0IGxhYmVscyB0aGUgaW5wdXQgZWxlbWVudC5cbiAgICogQGdyb3VwIFByb3BzXG4gICAqL1xuICBASW5wdXQoKSBhcmlhTGFiZWw6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgLyoqXG4gICAqIElubGluZSBzdHlsZSBvZiB0aGUgY29tcG9uZW50LlxuICAgKiBAZ3JvdXAgUHJvcHNcbiAgICovXG4gIEBJbnB1dCgpIHN0eWxlOiB7IFtrbGFzczogc3RyaW5nXTogYW55IH0gfCBudWxsIHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogU3R5bGUgY2xhc3Mgb2YgdGhlIGNvbXBvbmVudC5cbiAgICogQGdyb3VwIFByb3BzXG4gICAqL1xuICBASW5wdXQoKSBzdHlsZUNsYXNzOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBTdHlsZSBjbGFzcyBvZiB0aGUgbGFiZWwuXG4gICAqIEBncm91cCBQcm9wc1xuICAgKi9cbiAgQElucHV0KCkgbGFiZWxTdHlsZUNsYXNzOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byBpbnZva2Ugb24gcmFkaW8gYnV0dG9uIGNsaWNrLlxuICAgKiBAcGFyYW0ge1JhZGlvQnV0dG9uQ2xpY2tFdmVudH0gZXZlbnQgLSBDdXN0b20gY2xpY2sgZXZlbnQuXG4gICAqIEBncm91cCBFbWl0c1xuICAgKi9cbiAgQE91dHB1dCgpIG9uQ2xpY2s6IEV2ZW50RW1pdHRlcjxSYWRpb0J1dHRvbkNsaWNrRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxSYWRpb0J1dHRvbkNsaWNrRXZlbnQ+KCk7XG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byBpbnZva2Ugd2hlbiB0aGUgcmVjZWl2ZXMgZm9jdXMuXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gQnJvd3NlciBldmVudC5cbiAgICogQGdyb3VwIEVtaXRzXG4gICAqL1xuICBAT3V0cHV0KCkgb25Gb2N1czogRXZlbnRFbWl0dGVyPEV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8RXZlbnQ+KCk7XG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byBpbnZva2Ugd2hlbiB0aGUgbG9zZXMgZm9jdXMuXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gQnJvd3NlciBldmVudC5cbiAgICogQGdyb3VwIEVtaXRzXG4gICAqL1xuICBAT3V0cHV0KCkgb25CbHVyOiBFdmVudEVtaXR0ZXI8RXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxFdmVudD4oKTtcbiAgZmlyc3RDaGFuZ2UgPSB0cnVlO1xuICBASW5wdXQoKSBtb2RlID0gTU9ERVxuICBASW5wdXQoKSBkYXRhITogUmVjb3JkPGFueSwgYW55PltdXG4gIC8vIEBJbnB1dCgpIHNlbGVjdGVkPzogc3RyaW5nXG4gIEBJbnB1dCgpXG4gIGdldCBzZWxlY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRcbiAgfVxuICBzZXQgc2VsZWN0ZWQodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghdGhpcy5maXJzdENoYW5nZSAmJiAhaXNFcXVhbCh0aGlzLl9zZWxlY3RlZCwgdmFsdWUpKSB7XG4gICAgICB0aGlzLmNoYW5nZSh2YWx1ZSlcbiAgICB9XG4gICAgdGhpcy5maXJzdENoYW5nZSA9IGZhbHNlXG4gICAgdGhpcy5fc2VsZWN0ZWQgPSB2YWx1ZVxuICB9XG4gIF9zZWxlY3RlZD86IHN0cmluZ1xuXG4gIEBJbnB1dCgpIHZpc3VhbGl6ZSA9IHRydWVcbiAgQElucHV0KCkgZnJlZXplID0gZmFsc2VcbiAgQE91dHB1dCgpIHNlbGVjdGVkQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxzdHJpbmc+KClcbiAgaW50ZXJ2YWwgPSBOYU5cbiAgQElucHV0KCkgXG4gIGdldCBwcm92ZW5hbmNlKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm92ZW5hbmNlXG4gIH1cbiAgc2V0IHByb3ZlbmFuY2UodmFsdWUpIHtcbiAgICBpZiAodGhpcy5fcHJvdmVuYW5jZSAmJiB2YWx1ZT8ucmV2YWxpZGF0ZSkge1xuICAgICAgdGhpcy5fcHJvdmVuYW5jZSA9IHZhbHVlXG4gICAgICB0aGlzLm5nT25Jbml0KClcbiAgICAgIHRoaXMuX3Zpc3VhbGl6ZSgpXG4gICAgfVxuICAgIHRoaXMuX3Byb3ZlbmFuY2UgPSB2YWx1ZVxuICB9XG4gIF9wcm92ZW5hbmNlPzogUHJvdmVuYW5jZVxuICBAT3V0cHV0KCkgcHJvdmVuYW5jZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8UHJvdmVuYW5jZT4oKVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgbXNzOiBQcm92ZW5hbmNlV2lkZ2V0c1NlcnZpY2UsXG4gICAgcHJpdmF0ZSBlbDogRWxlbWVudFJlZlxuICApIHtcbiAgICBtc3MuaW5pdChlbCwgdW5kZWZpbmVkLCBcInJhZGlvXCIpXG4gICAgbXNzLmNyb3NzaGFpclNlbGVjdCA9IChrZXlzOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgdGhpcy5zZWxlY3RlZENoYW5nZS5lbWl0KGtleXNbMF0pXG4gICAgfVxuICB9XG5cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5tc3Mub3B0aW9ucyA9IHRoaXMuZGF0YS5sZW5ndGhcbiAgICB0aGlzLm1zcy5tb2RlID0gdGhpcy5tb2RlXG4gICAgaWYgKHRoaXMucHJvdmVuYW5jZT8uaGFzVXNlckludGVyYWN0ZWQgfHwgdGhpcy5wcm92ZW5hbmNlPy5yZXZhbGlkYXRlKSB7XG4gICAgICB0aGlzLm1zcy5zZXRQcm92ZW5hbmNlKHRoaXMucHJvdmVuYW5jZSlcbiAgICAgIHRoaXMuc2VsZWN0ZWQgPSBPYmplY3RcbiAgICAgICAgLmVudHJpZXModGhpcy5tc3MuZ2V0UHJvdmVuYW5jZSgpLmRhdGFCeU9wdGlvbilcbiAgICAgICAgLmZpbHRlcigoW18sIHZdKSA9PiB7XG4gICAgICAgICAgY29uc3QgbGFzdCA9IHYuYXQoLTEpXG4gICAgICAgICAgcmV0dXJuIGxhc3QgJiYgbGFzdC51bnNlbGVjdCA9PT0gdW5kZWZpbmVkICYmIGxhc3Quc2VsZWN0ICE9PSB1bmRlZmluZWRcbiAgICAgICAgfSlcbiAgICAgICAgLm1hcCgoW2ssIF9dKSA9PiBrKVswXTtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAodGhpcy5zZWxlY3RlZCl7XG4gICAgICB0aGlzLm1zcy5hZGRTaW11bHRhbmVvdXNFdmVudHMoXG4gICAgICAgIFtdLFxuICAgICAgICBbdGhpcy5zZWxlY3RlZF0sXG4gICAgICAgIHRoaXMuZnJlZXplLFxuICAgICAgICBmYWxzZVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLm1zcy5zZXRFbGVtZW50KHRoaXMuZWwpXG4gICAgaWYgKHRoaXMubXNzLmdldFByb3ZlbmFuY2UoKT8uaGFzVXNlckludGVyYWN0ZWQpXG4gICAgICB0aGlzLl92aXN1YWxpemUoKVxuICB9XG5cbiAgZ2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMubXNzLm15SWRcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbClcbiAgfVxuXG4gIGNoYW5nZShlOiBhbnkpIHtcbiAgICB0aGlzLm1zcy5hZGRTaW11bHRhbmVvdXNFdmVudHMoXG4gICAgICB0aGlzLnNlbGVjdGVkID8gW3RoaXMuc2VsZWN0ZWRdIDogW10sXG4gICAgICBlID8gW2VdIDogW10sXG4gICAgICB0aGlzLmZyZWV6ZSxcbiAgICAgIHRydWUsXG4gICAgICBuZXcgRGF0ZSgpLFxuICAgICAgdGhpcy5wcm92ZW5hbmNlQ2hhbmdlLFxuICAgICAgdGhpcy5fdmlzdWFsaXplLmJpbmQodGhpcylcbiAgICApXG4gIH1cblxuICBfdmlzdWFsaXplKCkge1xuICAgIGlmICghdGhpcy52aXN1YWxpemUpXG4gICAgICByZXR1cm5cbiAgICAvLyBUT0RPOiBSZW1vdmUgbWFnaWMgbnVtYmVyc1xuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5lbC5uYXRpdmVFbGVtZW50Lm9mZnNldFdpZHRoIC0gMjIgLSA4IC8vIHJhZGlvYnV0dG9uIHdpZHRoICsgbWFyZ2luXG4gICAgY29uc3QgaGVpZ2h0ID0gMjJcbiAgICB0aGlzLm1zcy52aXN1YWxpemUodGhpcy5tb2RlLCB3aWR0aCwgaGVpZ2h0LCBcIjAgMCAwIDMwcHhcIilcbiAgfVxuXG4gIGdldFByb3ZlbmFuY2UoKSB7XG4gICAgcmV0dXJuIHRoaXMubXNzXG4gIH1cbn1cbiIsIjxkaXZcbiAgICBzdHlsZT1cImRpc3BsYXk6IGZsZXg7IG1hcmdpbi1ib3R0b206IDFyZW07IG1hcmdpbi10b3A6IDFyZW07XCJcbj5cbiAgICA8YnV0dG9uXG4gICAgICAgICpuZ0lmPVwidmlzdWFsaXplXCJcbiAgICAgICAgcEJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY2xhc3M9XCJwLWJ1dHRvbi1oZWxwIHAtYnV0dG9uLXRleHRcIlxuICAgICAgICBbZGlzYWJsZWRdPVwiIWdldFByb3ZlbmFuY2UoKS5oYXNVc2VySW50ZXJhY3RlZFwiXG4gICAgICAgIFtzdHlsZV09XCJ7J21hcmdpbi1yaWdodCc6ICcwLjVyZW0nLCAnaGVpZ2h0JzogJzIycHgnLCAnd2lkdGgnOiAnMjJweCcsICdwYWRkaW5nJzogJzBweCcsICd2aXNpYmlsaXR5JzogdmlzdWFsaXplID8gJ3Zpc2libGUnIDogJ2hpZGRlbid9XCJcbiAgICAgICAgI2J0blxuICAgICAgICAoY2xpY2spPVwiZ2V0UHJvdmVuYW5jZSgpLnRvZ2dsZVByb3ZlbmFuY2VNb2RlKGJ0biwgdHJ1ZSlcIlxuICAgID5cbiAgICA8cHJvdmVuYW5jZS1pY29uIFxuICAgICAgICBbaWNvbl09XCIhZ2V0UHJvdmVuYW5jZSgpLmhhc1VzZXJJbnRlcmFjdGVkID8gJ2Rpc2FibGVkJyA6IGdldFByb3ZlbmFuY2UoKS5wcm92ZW5hbmNlTW9kZVwiXG4gICAgICAgIFtzaXplXT1cIjIwXCJcbiAgICAgICAgc3R5bGU9XCJoZWlnaHQ6IDIwcHg7XCJcbiAgICA+PC9wcm92ZW5hbmNlLWljb24+XG4gICAgPC9idXR0b24+XG4gICAgPGRpdiBjbGFzcz1cImN1c3RvbS1zbGlkZXJcIiBzdHlsZT1cIndpZHRoOiAxMDAlXCI+XG4gICAgICAgIDxuZ3gtc2xpZGVyXG4gICAgICAgICAgICAqbmdJZj1cImdldFByb3ZlbmFuY2UoKS5wcm92ZW5hbmNlTW9kZSA9PT0gJ3RlbXBvcmFsJ1wiXG4gICAgICAgICAgICBbdmFsdWVdPVwiZ2V0UHJvdmVuYW5jZSgpLnRlbXBvcmFsRmlsdGVyUmFuZ2VbMF1cIlxuICAgICAgICAgICAgW2hpZ2hWYWx1ZV09XCJnZXRQcm92ZW5hbmNlKCkudGVtcG9yYWxGaWx0ZXJSYW5nZVsxXVwiXG4gICAgICAgICAgICBbb3B0aW9uc109XCJnZXRQcm92ZW5hbmNlKCkudGVtcG9yYWxPcHRpb25zXCJcbiAgICAgICAgICAgICh1c2VyQ2hhbmdlRW5kKT1cImdldFByb3ZlbmFuY2UoKS5zZXRUZW1wb3JhbFJhbmdlKCRldmVudClcIlxuICAgICAgICAgICAgc3R5bGU9XCJtYXJnaW4tdG9wOiAwcHhcIlxuICAgICAgICA+XG4gICAgICAgIDwvbmd4LXNsaWRlcj5cbiAgICA8L2Rpdj5cbjwvZGl2PlxuPGRpdiAqbmdGb3I9XCJsZXQgZCBvZiBkYXRhXCIgY2xhc3M9XCJmaWVsZC1jaGVja2JveFwiPlxuICAgIDxzdmdcbiAgICAgICAgW2lkXT1cImdldElkKCkgKyBkW3ZhbHVlIHx8ICd2YWx1ZSddXCJcbiAgICAgICAgd2lkdGg9XCIwXCJcbiAgICAgICAgaGVpZ2h0PVwiMFwiXG4gICAgICAgIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiXG4gICAgPlxuICAgIDwvc3ZnPlxuICAgIDxwLXJhZGlvQnV0dG9uXG4gICAgICAgIFtpbnB1dElkXT1cImRbaW5wdXRJZCB8fCAnaW5wdXRJZCddIHx8IG51bGxcIlxuICAgICAgICBbbmFtZV09XCJkW25hbWUgfHwgJ25hbWUnXSB8fCBuYW1lIHx8IG51bGxcIlxuICAgICAgICBbdmFsdWVdPVwiZFt2YWx1ZSB8fCAndmFsdWUnXSB8fCBudWxsXCJcbiAgICAgICAgW2xhYmVsXT1cImRbbGFiZWwgfHwgJ2xhYmVsJ10gfHwgbnVsbFwiXG4gICAgICAgIFtkaXNhYmxlZF09XCJkWydkaXNhYmxlZCddIHx8IGZhbHNlXCJcbiAgICAgICAgW3RhYmluZGV4XT1cImRbJ3RhYmluZGV4J10gfHwgbnVsbFwiXG4gICAgICAgIFtzdHlsZV09XCJkWydzdHlsZSddIHx8IHN0eWxlIHx8IG51bGxcIlxuICAgICAgICBbc3R5bGVDbGFzc109XCJkWydzdHlsZUNsYXNzJ10gfHwgc3R5bGVDbGFzcyB8fCBudWxsXCJcbiAgICAgICAgW2xhYmVsU3R5bGVDbGFzc109XCJkWydsYWJlbFN0eWxlQ2xhc3MnXSB8fCBsYWJlbFN0eWxlQ2xhc3MgfHwgbnVsbFwiXG4gICAgICAgIChuZ01vZGVsQ2hhbmdlKT1cInRoaXMuZ2V0UHJvdmVuYW5jZSgpLmludGVyYWN0aW9uID0gJ3VzZXItY2hhbmdlJzsgc2VsZWN0ZWRDaGFuZ2UuZW1pdCgkZXZlbnQpXCJcbiAgICAgICAgW25nTW9kZWxdPVwic2VsZWN0ZWRcIlxuICAgICAgICAob25CbHVyKT1cIm9uQmx1clwiXG4gICAgICAgIChvbkNsaWNrKT1cIm9uQ2xpY2tcIlxuICAgID5cbiAgICA8L3AtcmFkaW9CdXR0b24+XG48L2Rpdj5cbiJdfQ==