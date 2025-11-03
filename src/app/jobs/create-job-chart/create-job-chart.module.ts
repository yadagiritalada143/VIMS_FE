import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateJobChartComponent } from './create-job-chart.component';



@NgModule({
  declarations: [CreateJobChartComponent],
  exports: [CreateJobChartComponent],
  imports: [
    CommonModule
  ]
})
export class CreateJobChartModule { }
