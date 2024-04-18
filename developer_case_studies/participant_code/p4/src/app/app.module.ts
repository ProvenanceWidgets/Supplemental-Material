import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ProvenanceWidgetsModule } from "provenance-widgets"

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ProvenanceWidgetsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
