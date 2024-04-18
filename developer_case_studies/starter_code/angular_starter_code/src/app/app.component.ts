import { Component } from '@angular/core';
import { SliderProvenance } from 'provenance-widgets';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'provenance-demo';

  // Slider/Range slider attributes - START
  value: number = 0;
  highValue: number = 250;
  options = {
    floor: 0, ceil: 250, showTicks: true, tickStep: 25
  }

  // Implicit 2-way binding for provenance
  sliderProvenance?: SliderProvenance = undefined
  
  // Explicit 2-way binding for provenance
  rangeSliderProvenance?: SliderProvenance = undefined
  handleRangeSliderProvenanceChange(event: SliderProvenance) {
    this.rangeSliderProvenance = event;
  }
  // Slider/Range slider attributes - END
  
  // Selection-type widgets attributes - START
  cities = [
    {
      name: 'New York',
      code: 'New York',
      inputId: 'NY'
    },
    {
      name: 'Rome',
      code: 'Rome',
      inputId: 'RM'
    },
    {
      name: 'London',
      code: 'London',
      inputId: 'LDN'
    },
    {
      name: 'Istanbul',
      code: 'Istanbul',
      inputId: 'IST'
    },
    {
      name: 'Paris',
      code: 'Paris',
      inputId: 'PRS'
    }
  ];

  // Implicit 2-way binding for provenance
  checkbox_selected = this.cities.slice(0, 2).map(c => c.code);
  radio_selected = this.cities[0].code;
  dropdown_selected?: string = undefined

  // Explicit 2-way binding for provenance
  multiselect_selected = this.cities.slice(0, 2);
  handleMultiselectChange(event: typeof this.multiselect_selected) {
    this.multiselect_selected = event;
  }

  // Selection-type widgets attributes - END
}
