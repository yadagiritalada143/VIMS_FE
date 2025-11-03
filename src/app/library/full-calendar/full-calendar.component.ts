import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Day } from './objects/day';
import { Calendar } from './objects/calendar';
import { Month } from './objects/month';
import { Time } from './objects/time';
import { Weeks } from './objects/weeks';
import { CalendarViewTypes, ICalendarEvent, CalendarType } from './full-calendar.interfaces';
import { ICalendarInterviewsResponse, ICalendarLeavesResponse } from './calendar-widget.config';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { DashboardService } from '../../dashboard/dashboard.service';
import * as moment from 'moment-timezone'
import { I18NextEagerPipe, I18NextPipe } from 'angular-i18next';
I18NextEagerPipe

@Component({
    selector: 'full-calendar',
    templateUrl: './full-calendar.component.html',
    styleUrls: ['./full-calendar.component.scss'],
    providers:[I18NextEagerPipe]
})

export class FullCalendarComponent implements OnInit, OnChanges {
    @Input() public dateValue: any;
    @Input() public viewType: CalendarViewTypes;
    @Input() public selectedOptionsValues: any;
    @Input() public isCalendarItems: any;
    @Input() public widget: any;
    @Input() public reportApi: any;
    public events: any = [];
    public readonly weekDaysName: string[] = Weeks.getDaysNameSlice();
    public readonly dayTime: string[] = Time.time;
    public monthDays: Day[];
    public weekDays: Day[];
    public dayItem: Day;
    public month: number;
    public year: number;
    public day: number;
    private calendar: Calendar;
    public calendarType: string;
    public eventData: ICalendarEvent[];

    constructor(private dashboardService: DashboardService,private i18NextPipe:I18NextPipe) {
        this.calendar = new Calendar();
        this.calendarType = CalendarType.Month;
        this.eventData = [];
    }

    ngOnChanges(changes: SimpleChanges): void {
      if(this.selectedOptionsValues) {
        this.onChangeCalendarType(this.calendarType);
      }
    }

    ngOnInit() {
        this.setValues();
        this.onChangeCalendarType(this.calendarType);
    }

    private setValues() {
        const date = this.dateValue ? new Date(this.dateValue) : new Date();
        this.year = date.getFullYear();
        this.month = date.getMonth();
        this.day = date.getDate();
    }

    public onChangeCalendarType(type: string) {
        if (type === CalendarType.Month) {
            this.calendarType = CalendarType.Month;
            this.setMonthDays(this.calendar.getMonth(this.year, this.month));
        } else if (type === CalendarType.Week || type === CalendarType.List) {
            this.calendarType = type === CalendarType.Week ? CalendarType.Week : CalendarType.List;
            this.setWeekDays(this.calendar.getWeek(this.year, this.month, this.day));
        } else if (type === CalendarType.Day) {
            this.calendarType = CalendarType.Day;
            this.setDay(this.calendar.getDay(new Day(this.year, this.month, this.day)));
        } else if (type === CalendarType.Today) {
            this.onChangeTypeToday();
        }
    }

    private onChangeTypeToday() {
        this.setValues();
        if (this.calendarType === CalendarType.Month) {
            this.setMonthDays(this.calendar.getMonth(this.year, this.month));
        } else if (this.calendarType === CalendarType.Week || this.calendarType === CalendarType.List) {
            this.setWeekDays(this.calendar.getWeek(this.year, this.month, this.day));
        } else if (this.calendarType === CalendarType.Day) {
            this.setDay(this.calendar.getDay(new Day(this.year, this.month, this.day)));
        }
    }

    public onNext() {
        if (this.calendarType === CalendarType.Month) {
            this.onNextMonth();
        } else if (this.calendarType === CalendarType.Week || this.calendarType === CalendarType.List) {
            this.onNextWeek();
        } else if (this.calendarType === CalendarType.Day) {
            this.onNextDay();
        }
    }

    public onPrevious() {
        if (this.calendarType === CalendarType.Month) {
            this.onPreviousMonth();
        } else if (this.calendarType === CalendarType.Week || this.calendarType === CalendarType.List) {
            this.onPreviousWeek();
        } else if (this.calendarType === CalendarType.Day) {
            this.onPreviousDay();
        }
    }

    private onNextMonth() {
        this.month++;
        if (this.month == 12) {
            this.month = 0;
            this.year++;
        }
        this.setMonthDays(this.calendar.getMonth(this.year, this.month));
    }

    private onPreviousMonth() {
        this.month--;
        if (this.month < 0) {
            this.month = 11;
            this.year--;
        }
        this.setMonthDays(this.calendar.getMonth(this.year, this.month));
    }

    private onNextWeek() {
        this.year = this.weekDays[this.weekDays.length - 1].year;
        this.month = this.weekDays[this.weekDays.length - 1].month_index;
        this.day = this.weekDays[this.weekDays.length - 1].day_number;
        this.setWeekDays(this.calendar.getWeek(this.year, this.month, this.day));
    }

    private onPreviousWeek() {
        this.year = this.weekDays[0].year;
        this.month = this.weekDays[0].month_index;
        this.day = this.weekDays[0].day_number;
        this.setWeekDays(this.calendar.getWeek(this.year, this.month, this.day));
    }

    private onNextDay() {
        this.year = this.dayItem.year;
        this.month = this.dayItem.month_index;
        this.day = this.dayItem.day_number;
        this.setDay(this.calendar.getDay(this.dayItem, 1));
    }

    private onPreviousDay() {
        this.year = this.dayItem.year;
        this.month = this.dayItem.month_index;
        this.day = this.dayItem.day_number;
        this.setDay(this.calendar.getDay(this.dayItem, -1));
    }

    private setMonthDays(days: Day[]) {
        this.monthDays = days;
        this.getData(this.monthDays);
    }

    private setWeekDays(days: Day[]) {
        this.weekDays = days;
        this.getData(this.weekDays);
    }

    private setDay(day: Day) {
        this.dayItem = day;
        this.getData([this.dayItem]);
    }
    initCalendar(res, days) {
      const response = JSON.parse(JSON.stringify(res));
      let allEvents: ICalendarEvent[] = [];

      if (response.data?.length) {
        const responseEvents = response.data;
        if (this.viewType === CalendarViewTypes.Holiday) {
          for (let i = 0; i < responseEvents.length; ++i) {
            const event: ICalendarLeavesResponse = responseEvents[i];
            const newEvent: ICalendarEvent = {
              title: event.holiday_name,
              color: event.color,
              startDate: getDateFromString(event.holiday_date),
              endDate: getDateFromString(event.holiday_date),
              link: event.link,
            };
            allEvents.push(newEvent);
          }
        } else if (this.viewType === CalendarViewTypes.WorkEvent) {
          for (let i = 0; i < responseEvents.length; ++i) {
            const event: ICalendarInterviewsResponse = responseEvents[i];
            const newEvent: ICalendarEvent = {
              title: event.title,
              color: event.color,
              startDate: getDateFromString(event.start),
              endDate: getDateFromString(event.end),
              link: event.link,
              infoType: event.info_type,
              eventType: event.type,
            };
            allEvents.push(newEvent);
          }
        }
      }
      this.eventData = [...allEvents]
      this.setEvents(days)
    }

    private getData(days: any[] | any) {
      if (!days?.length) return;
      const payload = {
        items: this.selectedOptionsValues,
        filters: {
          start_date: moment(days[0]?.year?.toString() +'-' + (days[0]?.month_index+1)?.toString() +'-'+ days[0]?.day_number?.toString())?.format("YYYY-MM-DD"),
          end_date: moment(days[days?.length-1]?.year?.toString() +'-' + (days[days?.length-1]?.month_index+1)?.toString() +'-'+ days[days?.length-1]?.day_number?.toString())?.format("YYYY-MM-DD")
        }
      };

      if (!payload.items?.length) {
        this.events = [];
      }
      if (this.isCalendarItems) {
        this.dashboardService
          .post(`${this.widget?.api}`, payload, this.widget?.api?.indexOf('/report/programs') > -1 ? this.reportApi : null)
          .subscribe(
            res => {
              this.initCalendar(res, days);
            }
          );
      } else {
        this.dashboardService.get(`${this.widget?.api}`, this.widget?.api?.indexOf('/report/programs') > -1 ? this.reportApi : null).subscribe(
          res => {
            this.initCalendar(res, days);
          }
        );
      }

    }
    private setEvents(days: Day[] | Day) {
        if (Array.isArray(days)) {
            for (let i = 0; i < days.length; ++i) {
                let allevents: ICalendarEvent[] = [];
                for (let j = 0; j < this.eventData.length; ++j) {
                    if (this.isEvenBelongToDay(this.eventData[j], days[i])) {
                        allevents.push(this.eventData[j]);
                    }
                }
                days[i].events = allevents;
            }
        } else {
            let allevents: ICalendarEvent[] = [];
            for (let i = 0; i < this.eventData.length; ++i) {
                if (this.isEvenBelongToDay(this.eventData[i], days)) {
                    allevents.push(this.eventData[i]);
                }
            }
            days.events = allevents;
        }
    }

    private isEvenBelongToDay(event: ICalendarEvent, day: Day): boolean {
        let isSameYear: boolean = false;
        let isSameMonth: boolean = false;
        let isSameDay: boolean = false;

        if (event.startDate) {
            isSameYear = event.startDate.getFullYear() === day.year ? true : false;
            isSameMonth = event.startDate.getMonth() === day.month_index ? true : false;
            isSameDay = event.startDate.getDate() === day.day_number ? true : false;
        }
        return isSameYear && isSameMonth && isSameDay;
    }

    public getHeader(): string {
        if (this.calendarType === CalendarType.Month) {
            return this.getMonthHeader();
        } else if (this.calendarType === CalendarType.Week || this.calendarType === CalendarType.List) {
            return this.getWeekHeader();
        } else if (this.calendarType === CalendarType.Day) {
            return this.getDayHeader();
        }
        return '';
    }

    private getMonthHeader(): string {
        return `${this.i18NextPipe.transform(Month.getMonthName(this.month))} ${this.year}`;
    }

    private getWeekHeader(): string {
        const firstItem = this.weekDays[0];
        const lastItem = this.weekDays[this.weekDays.length - 1];
        return `${this.i18NextPipe.transform(firstItem.month_name)} ${firstItem.day_number}${firstItem.year === lastItem.year ? '' : `, ${firstItem.year}`} -
        ${firstItem.month_name === lastItem.month_name ? '' : this.i18NextPipe.transform(lastItem.month_name)} ${lastItem.day_number}, ${lastItem.year}`;
    }

    private getDayHeader(): string {
        return `${this.i18NextPipe.transform(this.dayItem.month_name)} ${this.dayItem.day_number}, ${this.dayItem.year}`;
    }

    public isButtonTodayDisabled(): boolean {
        if (this.calendarType === CalendarType.Month) {
            return this.monthDays?.filter((day: Day) => day.is_current === true).length ? true : false;
        } else if (this.calendarType === CalendarType.Week || this.calendarType === CalendarType.List) {
            return this.weekDays?.filter((day: Day) => day.is_current === true).length ? true : false;
        } else if (this.calendarType === CalendarType.Day) {
            return this.dayItem?.is_current ? true : false;
        } else {
            return false;
        }
    }
}
