import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsStackedBarChartComponent } from './svms-stacked-bar-chart.component';



@NgModule({
  declarations: [SvmsStackedBarChartComponent],
  exports: [SvmsStackedBarChartComponent],
  imports: [
    CommonModule
  ]
})
export class SvmsStackedBarChartModule { }
