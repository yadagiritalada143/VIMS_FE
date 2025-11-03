import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsPieMiniChartComponent } from './svms-pie-mini-chart.component';



@NgModule({
  declarations: [SvmsPieMiniChartComponent],
  exports: [SvmsPieMiniChartComponent],
  imports: [
    CommonModule
  ]
})
export class SvmsPieMiniChartModule { }
