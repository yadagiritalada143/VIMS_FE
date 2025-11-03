import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarComponent } from './full-calendar.component';
import { DayViewComponent } from './components/day-view/day-view.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EventsViewComponent } from './components/events-view/events-view.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { I18NextModule } from 'angular-i18next';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
    suppressScrollX: true
  };
@NgModule({
    declarations: [
        FullCalendarComponent,
        DayViewComponent,
        EventsViewComponent
    ],
  imports: [
    CommonModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    PerfectScrollbarModule,
    I18NextModule,
  ],
    providers: [
        {
          provide: PERFECT_SCROLLBAR_CONFIG,
          useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
        }
    ],
    exports: [
        FullCalendarComponent
    ]
})
export class FullCalendarModule { }
