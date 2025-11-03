import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountDownTimerComponent } from './count-down-timer.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';

@NgModule({
  declarations: [CountDownTimerComponent],
  exports: [CountDownTimerComponent],
  imports: [
    CommonModule,
    SharedModule,
    NewSharedModule
  ]
})
export class CountDownTimerModule { }

