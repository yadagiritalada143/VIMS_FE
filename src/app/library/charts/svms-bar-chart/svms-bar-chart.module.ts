import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsBarChartComponent } from './svms-bar-chart.component';



@NgModule({
  declarations: [SvmsBarChartComponent],
  exports: [SvmsBarChartComponent],
  imports: [
    CommonModule
  ]
})
export class SvmsBarChartModule { }
