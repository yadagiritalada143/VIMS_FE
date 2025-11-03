import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsColumnChartComponent } from './svms-column-chart.component';



@NgModule({
  declarations: [SvmsColumnChartComponent],
  exports: [SvmsColumnChartComponent],
  imports: [
    CommonModule
  ]
})
export class SvmsColumnChartModule { }
