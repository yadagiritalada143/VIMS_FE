import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SvmsStateChartComponent } from './svms-state-chart.component';

@NgModule({
  declarations: [SvmsStateChartComponent],
  imports: [
    CommonModule
  ],
  exports: [SvmsStateChartComponent]
})
export class SvmsStateChartModule { }
