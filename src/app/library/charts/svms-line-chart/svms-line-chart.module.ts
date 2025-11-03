import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsLineChartComponent } from './svms-line-chart.component';



@NgModule({
  declarations: [SvmsLineChartComponent],
  imports: [
    CommonModule
  ],
  exports: [SvmsLineChartComponent]
})
export class SvmsLineChartModule { }
