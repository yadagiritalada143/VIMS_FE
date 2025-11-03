import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsBubbleChartComponent } from './svms-bubble-chart.component';



@NgModule({
  declarations: [SvmsBubbleChartComponent],
  exports: [SvmsBubbleChartComponent],
  imports: [
    CommonModule
  ]
})
export class SvmsBubbleChartModule { }
