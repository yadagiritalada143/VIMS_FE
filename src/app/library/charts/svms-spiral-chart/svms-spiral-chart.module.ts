import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsSpiralChartComponent } from './svms-spiral-chart/svms-spiral-chart.component';



@NgModule({
  declarations: [SvmsSpiralChartComponent],
  exports: [SvmsSpiralChartComponent],
  imports: [
    CommonModule
  ],
})
export class SvmsSpiralChartModule { }
