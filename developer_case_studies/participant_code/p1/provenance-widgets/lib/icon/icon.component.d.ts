import { OnChanges, SimpleChanges } from '@angular/core';
import * as i0 from "@angular/core";
export declare class IconComponent implements OnChanges {
    AGGREGATE_B64: string;
    TEMPORAL_B64: string;
    DISABLED_B64: string;
    icon: 'aggregate' | 'temporal' | 'disabled';
    size?: number;
    tooltipText: string;
    ngOnChanges(changes: SimpleChanges): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<IconComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<IconComponent, "provenance-icon", never, { "icon": "icon"; "size": "size"; }, {}, never, never, false, never>;
}
