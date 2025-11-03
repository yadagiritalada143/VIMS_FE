import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsPieChartComponent } from './svms-pie-chart.component';



@NgModule({
  declarations: [SvmsPieChartComponent],
  exports: [SvmsPieChartComponent],
  imports: [
    CommonModule
  ]
})
export class SvmsPieChartModule { }
