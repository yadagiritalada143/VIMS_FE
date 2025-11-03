import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsAreaChartComponent } from './svms-area-chart.component';



@NgModule({
  declarations: [SvmsAreaChartComponent],
  exports: [SvmsAreaChartComponent],
  imports: [
    CommonModule
  ]
})
export class SvmsAreaChartModule { }
