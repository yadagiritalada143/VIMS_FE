import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation, HostListener, forwardRef, SimpleChanges, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { dateRangeToTimeStampConverter } from '../../../shared/util/date.util';
import { LocalDateFormatPipe } from '../../pipe/local-date-format.pipe';
import * as moment from 'moment-timezone';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
@Component({
  selector: 'svms-datepicker',
  templateUrl: './svms-datepicker.component.html',
  styleUrls: ['./svms-datepicker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SvmsDatepickerComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class SvmsDatepickerComponent implements OnInit, ControlValueAccessor, AfterViewInit {
  @Output() onDateChange = new EventEmitter<any>();
  @Output() onendDateChange = new EventEmitter<Date>();
  @Output() clearDate = new EventEmitter<any>();
  @Input() options: svmsOptions;
  @Input() isScheduled = false;
  @Input() clearInputDate = false;
  @Input() autoClearInputDate: boolean = false;
  startDate: Date;
  endDate: Date;
  placeholdervalue: string = 'Select Date';
  readonlyFlag: boolean = true;
  @Input() dateRangePicker;
  @Input() inputdateFormat;

  @Input() set placeholder(value: string) {
    this.placeholdervalue = value && value !== '' ? value : 'Select Date';
  }
  @Input() set readonly(value: boolean) {
    this.readonlyFlag = value ?? true;
  }
  @Input('value') _value = '';
  @Input() set id(value: string) {
    this._ID = value;
  }
  get id() {
    return this._ID;
  }
  @Input() alwaysVisible: boolean;
  @Input() hideDisplayValue: boolean = false;
  @Input() disabled = false;
  @Input() defaultStartDate: any;
  @Input() defaultEndDate: any;
  @Input() isRequired: false;
  @Input() responsiveDatepicker: false;
  @Input() customYear: string = new Date().getFullYear().toString();
  @Input() durationStartDate: Date;
  @Input() allowDuration: boolean;
  @Input() flip: boolean = true;
  calenderDuration: { duration: number; type: moment.unitOfTime.DurationConstructor } = { duration: 0, type: 'days' };
  calenderDurationOption = ['days','weeks','months','years'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.options) {
      this.options = new svmsOptions(changes.options.currentValue || {});
      this.initCalendar();
    }
  }

  pickCalyears: number[] = [];
  pickerLanguage: svmsLanguage;
  pickerCalendar: svmsCalender;
  pickerCalendarTwo: svmsCalender;
  mode = 'datepicker';
  // showPicker = false;
  dateData;
  airDateSim: Date;
  airEndDateSim: Date;
  private _ID = '';
  dateRangeOptions: DateRangeCode[] = [
    DateRangeCode.TODAY,
    DateRangeCode.YESTERDAY,
    DateRangeCode.WEEK,
    DateRangeCode.LAST_30_DAYS,
    DateRangeCode.CURRENT_MONTH,
    DateRangeCode.LAST_MONTH,
    DateRangeCode.CUSTOM_RANGE,
  ];

  @HostListener('click', ['$event'])
  datePopup(event: any) {
    if (event.target.id === 'datepicker' || event.target.className === 'datepicker-- form-control pl-32 text-truncate') {
      if (this.disabled) {
        return;
      }
      // if (!this.showPicker && this.value) {
      if (this.value) {
        const dateVal = this.convertDateFormat(this.value, this.inputdateFormat);
        if (!this.inputdateFormat?.includes('y') && (!this.startDate || isNaN(new Date(this.startDate).getTime()))) {
          this.startDate = new Date(dateVal.replace('undefined', this.customYear));
        }
        this.pickerCalendar = this.inputdateFormat?.includes('y')
          ? new svmsCalender(new Date(dateVal), this.options)
          : new svmsCalender(this.startDate, this.options);
        if(this.enableDurationSection){
          this.calculateDiff(this.inputdateFormat?.includes('y') ? new Date(dateVal) : this.startDate)
        }
      }
      const currentEvent = event.target?.parentElement?.parentElement?.childNodes?.[2];
      if (!this.options?.alwaysVisible) {
        // this.showPicker = !this.showPicker;
        // event.target.nextElementSibling.classList.toggle('hide')
        if (!currentEvent?.classList?.contains('hide')) currentEvent?.classList?.toggle('hide');
        else {
          this.hideAllDatePickers();
          currentEvent?.classList?.toggle('hide');
        }
      } else {
        // this.showPicker = true;
        currentEvent?.classList?.remove('hide');
      }
    }
  }

  @HostListener('document:click', ['$event'])
  datePopup1(event: any) {
    const tclassName = event.target.className;
    const target = event.target;
    if (
      event.target.tagName.toLowerCase() !== 'svg' &&
      event.target.tagName.toLowerCase() !== 'path' &&
      tclassName &&
      tclassName?.search('datepicker--') < 0
      && tclassName !== 'ng-arrow-wrapper'
      && target?.id !== 'calender_duration_dropdown'
      && target?.id !== 'calender_duration_days'
      && target?.parentElement?.id !=='calender_duration_dropdown'
      && target?.parentElement?.parentElement?.parentElement?.id !=='calender_duration_dropdown'
      && target?.parentElement?.className !== 'datepicker--footer'
      && tclassName !== 'calender-duration-value'
      && (target?.children?.length > 0 && target?.children?.[0]?.className !== 'calender-duration-value')
    ) {
      // if (!this.options?.alwaysVisible) {
      //   this.showPicker = false;
      // }
     if(this.enableDurationSection && this.value){
      const dateVal = this.convertDateFormat(this.value, this.inputdateFormat);
      this.onDateUpdate(new Date(dateVal));
    }
      this.hideAllDatePickers();
    }
  }

  hideAllDatePickers(): void {
    const datepickers = document.getElementsByClassName('datepicker-main-wrapper');
    if (datepickers?.length) {
      for (let i = 0; i < datepickers.length; i++) {
        if (!datepickers[i]?.classList.contains('hide') && !datepickers[i]?.classList.contains('always-visible')) {
          datepickers[i]?.classList.add('hide');
        }
      }
    }
  }

  constructor(private datePipe: LocalDateFormatPipe) {}

  ngOnInit() {
    this.options = new svmsOptions(this.options || ({} as svmsOptions));
    // this.showPicker = this.options.alwaysVisible || false;
    this.pickerLanguage = SVMS_LANGUAGES.get(this.options.language);
    if (this.defaultStartDate || this.defaultEndDate) {
      this.initCalendarByDefaultValue();
    } else {
      this.initCalendar();
    }
    const firstYear = this.pickerCalendar.year - 6;
    this.pickCalyears = Array.from({ length: 12 }, (v, k) => firstYear + k);
  }

  ngAfterViewInit() {
    if (this.defaultStartDate || this.defaultEndDate) {
      setTimeout(() => {
        if (this.defaultStartDate && this.defaultEndDate) {
          let startDate = this.datePipe.transform(this.defaultStartDate, this.inputdateFormat, '', '', true);

          let endDate = this.datePipe.transform(this.defaultEndDate, this.inputdateFormat, '', '', true);

          this.writeValue(`${startDate}-${endDate}`);
        } else {
          this.writeValue(`${this.dateFormat(this.startDate)}-${this.dateFormat(this.endDate)}`);
        }
      });
    }
  }

  /** Calender Duration Caculation Functions */
  onChangeDuration = () => {
    if (this.allowDuration && this.calenderDuration && this.calenderDuration.duration != null && this.calenderDuration.duration >= 0) {
      let durationStartDateValue = this.datePipe.transform(this.durationStartDate,DATE_FORMAT.FORMATYYMMDD,'','',true,this.inputdateFormat);
      durationStartDateValue = new Date(durationStartDateValue);
      var durationEndDate = new Date();
      if (this.calenderDuration.type) {
          durationEndDate = moment(durationStartDateValue, this.inputdateFormat).add(this.calenderDuration.duration, this.calenderDuration.type).toDate();
      }
      this.onDateUpdate(new Date(durationEndDate));
    }
  };

  get enableDurationSection() {
    return this.allowDuration && this.durationStartDate && moment(this.durationStartDate,this.inputdateFormat).isValid();
  }

  onApplyDuration = () => {
    if(!this.startDate){
      this.onChangeDuration();
    }
    this.setDateNoRange(this.startDate);
  };

  preventCharacters(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    // Only Numbers 0-9
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  calculateDiff(endDate){
    const startDate: string = this.datePipe.transform(this.durationStartDate,DATE_FORMAT.FORMATYYMMDD,'','',true,this.inputdateFormat);
    const [year,month,date] = startDate.split('/').map((val)=>parseInt(val,10));
    const startDateInMs = Date.UTC(year,(month-1),date);
    const endDateInMs = Date.UTC(endDate.getFullYear(),endDate.getMonth(),endDate.getDate());
    const duration = moment.duration(endDateInMs-startDateInMs);
    if(duration.years() && !duration.months() && !duration.days()){
      this.calenderDuration.duration = Math.floor(duration.asYears());
      this.calenderDuration.type = 'years';
    }
    else if ((duration.years() && duration.months() && !duration.days())
    ||(!duration.years() && duration.months() && !duration.days()) ){
        this.calenderDuration.duration = Math.floor(duration.asMonths());
        this.calenderDuration.type = 'months';
    }
    else{
      this.calenderDuration.duration = duration.asDays()%7 || duration.asDays()===0 ? duration.asDays() : duration.asWeeks();
      this.calenderDuration.type = duration.asDays()%7 || duration.asDays()===0 ? 'days' : 'weeks';
    }
  }

  /**END Calender Duration Caculation Functions*/

  convertAllDateFormat(value) {
    if (typeof value === 'string' && this.inputdateFormat) {
      return moment(value, this.inputdateFormat).format(DATE_FORMAT.FORMATYMD);
    } else {
      return value;
    }
  }

  initCalendar() {
    let initStartDate: Date;
    if (this.options.enabledDateRanges?.length) {
      initStartDate = this.options.enabledDateRanges[0].default
        ? this.options.enabledDateRanges[0].default
        : this.options.enabledDateRanges[0].start;
    }
    this.pickerCalendar = new svmsCalender(initStartDate, this.options);
    if (this.options.range) {
      this.pickerCalendarTwo = new svmsCalender(
        new Date(this.pickerCalendar.year, this.pickerCalendar.month + 1, this.pickerCalendar.date),
        this.options,
      );
    }
  }

  initCalendarByDefaultValue() {
    this.defaultStartDate = this.convertAllDateFormat(this.defaultStartDate);
    this.defaultEndDate = this.convertAllDateFormat(this.defaultEndDate);
    const isValidDate = (date: any) => new Date(date).toString() !== 'Invalid Date';
    let initStartDate: Date = isValidDate(this.defaultStartDate) ? new Date(this.defaultStartDate) : new Date();
    if (this.options.range) {
      let initEndDate: Date = isValidDate(this.defaultEndDate) ? new Date(this.defaultEndDate) : new Date();
      const millStartDate: number = initStartDate.getTime();
      const millEndDate: number = initEndDate.getTime();
      if (millStartDate > millEndDate) {
        initStartDate = new Date(millEndDate - 3600 * 1000 * 24);
      }
      this.pickerCalendar = new svmsCalender(initStartDate, this.options);
      this.pickerCalendarTwo = new svmsCalender(initEndDate, this.options);
      this.startDate = initStartDate;
      this.endDate = initEndDate;
    } else {
      this.pickerCalendar = new svmsCalender(initStartDate, this.options);
      this.startDate = initStartDate;
    }
  }

  onChange: any = () => {
    if (this.value && this.inputdateFormat) {
      const dateVal = this.convertDateFormat(this.value, this.inputdateFormat);
      this.pickerCalendar = new svmsCalender(new Date(dateVal), this.options);
      this.startDate = new Date(dateVal);
      this.pickerCalendar.updateCalendar();
    }
  };

  convertDateFormat = (dateString: string, dateFormat: string) => {
    if (!dateString) {
      return;
    }
    let date, month, year, dateArray, formatArray;
    if (dateString.includes('-')) {
      dateArray = dateString.split('-');
      formatArray = dateFormat?.split('-');
    } else if (dateString.includes('/')) {
      dateArray = dateString.split('/');
      formatArray = dateFormat?.split('/');
    }

    if (dateFormat?.includes('-')) {
      formatArray = dateFormat.split('-');
    } else if (dateFormat?.includes('/')) {
      formatArray = dateFormat.split('/');
    }

    for (let index = 0; index < formatArray?.length; index++) {
      const abb = formatArray[index];
      if (abb.toLowerCase().includes('mm')) {
        month = dateArray?.[index];
      } else if (abb.toLowerCase().includes('yy')) {
        year = dateArray?.[index];
      } else if (abb.toLowerCase().includes('dd')) {
        date = dateArray?.[index];
      }
    }
    return `${month}/${date}/${year}`;
  };

  onTouched: any = () => {};

  closeDatePicker() {
    if (!this.options.alwaysVisible) {
      // this.showPicker = false;
      if (this.autoClearInputDate) this.clearInput();
      // to clear the input date when user clicks cancel button
      this.pickerCalendar = new svmsCalender(new Date(), this.options);
    }
  }

  get value() {
    return this._value;
  }

  set value(val) {
    if (this.options.range && val) {
      val = this.initDateRange(val);
    }
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  initDateRange(val) {
    if(val && typeof val[0] == 'number'){
      this.startDate = new Date(val[0])
      this.endDate = new Date(val[1])
    }
    const rawDate = dateRangeToTimeStampConverter(val, this.inputdateFormat);
    let startDate = rawDate[0];
    let endDate = rawDate[1];
    if (startDate && endDate) {
      this.startDate = new Date(startDate);
      this.endDate = new Date(endDate);
    }
    return `${this.dateFormat(this.startDate)}-${this.dateFormat(this.endDate)}`;
  }

  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  writeValue(value) {
    this.value = value;
  }

  nextMonth() {
    this.pickerCalendar?.setMonth(this.pickerCalendar.month + 1);
    this.pickerCalendarTwo?.setMonth(this.pickerCalendarTwo.month + 1);
  }

  previousMonth() {
    this.pickerCalendar?.setMonth(this.pickerCalendar.month - 1);
    this.pickerCalendarTwo?.setMonth(this.pickerCalendarTwo.month - 1);
  }

  clearInput() {
    this.writeValue('');
    this.startDate = new Date();
    this.endDate = null;
    this.clearDate.emit('');
  }

  next() {
    for (let i = 0; i < this.pickCalyears.length; i++) {
      this.pickCalyears[i] += 10;
    }
  }

  previous() {
    for (let i = 0; i < this.pickCalyears.length; i++) {
      this.pickCalyears[i] -= 10;
    }
  }

  resetDate() {
    this.writeValue('');
  }

  setDate(index: number, calender: svmsCalender) {
    if (calender.airDays[index]) {
      if (calender.airDays[index].disabled) {
        return;
      }
      calender.selectDate(index);
    }
    const date = new Date(calender.year, calender.month, calender.date, 0, 0);
    if(this.enableDurationSection){
      this.calculateDiff(date);
    }
    if (this.options.range) {
      this.setDateIsRange(date);
    } else {
      this.setDateNoRange(date);
    }
  }

  setDateIsRange(date: Date) {
    if (!this.startDate && !this.endDate) {
      this.startDate = date;
    } else if (svmsOptions.sameDate(date, this.startDate) || svmsOptions.sameDate(date, this.endDate)) {
      this.startDate = date;
      this.endDate = date;
    } else if (this.startDate && this.endDate) {
      this.startDate = date;
      this.endDate = null;
    } else {
      if (this.startDate > date) {
        this.endDate = this.startDate;
        this.startDate = date;
      } else {
        this.endDate = date;
      }
    }
    this.onDateChange.emit({ startDate: this.startDate, endDate: this.endDate });
  }

  setDateNoRange(date: Date) {
    this.startDate = date;
    // this.hidePicker();
    this.hideAllDatePickers();
    this.writeValue(this.dateFormat(this.startDate));
    this.onDateChange.emit(this.startDate);
  }

  applySelectedDate() {
    this.writeValue(this.dateFormat(this.startDate) + '-' + this.dateFormat(this.endDate));
    this.onendDateChange.emit(this.endDate);
  }

  hidePicker() {
    // this.showPicker = this.options.alwaysVisible ? true : false;
  }

  dateFormat(date, range?) {
    if (!date) {
      return;
    }
    const shortMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let day = date.getDate();
    let month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (month < 10) {
      month = '0' + month;
    }
    if (day < 10) {
      day = '0' + day;
    }

    if (this.inputdateFormat === '' || this.inputdateFormat === undefined) {
      return shortMonth[date.getMonth()] + ' ' + day + ', ' + year;
    }
    // else if (this.inputdateFormat === 'dd-mm-yy') {
    //   return day + '-' + month + '-' + year;
    // } else if (this.inputdateFormat === 'yy-mm-dd') {
    //   return year + '-' + month + '-' + day;
    // } else if (this.inputdateFormat === 'mm-dd-yy') {
    //   return month + '-' + day + '-' + year;
    // } else if (this.inputdateFormat === 'MM/DD/YY') {
    //   return month + '/' + day + '/' + year;
    // } else if (this.inputdateFormat === 'mm/dd') {
    //   return month + '/' + day;
    // }
    else {
      return this.datePipe.transform(date, this.inputdateFormat, '', '', true);
    }
  }
  isInRange(day: AirDay) {
    if (this.startDate && this.endDate) {
      return this.startDate < new Date(day.year, day.month, day.date) && new Date(day.year, day.month, day.date, 23, 59, 59) < this.endDate;
    }

    if (this.airDateSim && this.airEndDateSim) {
      return (
        this.airDateSim < new Date(day.year, day.month, day.date) &&
        new Date(day.year, day.month, day.date, 23, 59, 59) < this.airEndDateSim
      );
    }

    return false;
  }

  isCalendarDate(date: Date, day: AirDay) {
    return date ? date.getFullYear() === day.year && date.getMonth() === day.month && date.getDate() === day.date : false;
  }

  simulate(day: AirDay) {
    const date = new Date(Date.UTC(day.year, day.month, day.date, 0, 0));
    this.airDateSim = this.startDate;
    this.airEndDateSim = this.endDate;

    if (!this.options.isDisabled(date) && ((this.startDate && !this.endDate) || (this.endDate && !this.startDate))) {
      if (this.startDate) {
        if (date < this.startDate) {
          this.airEndDateSim = this.startDate;
          this.airDateSim = date;
        } else {
          if (this.endDate) {
            this.airEndDateSim = null;
            this.airDateSim = date;
          } else {
            this.airEndDateSim = date;
          }
        }
      } /* endDate is truthy */ else {
        if (this.endDate < date) {
          this.airDateSim = this.endDate;
          this.airEndDateSim = date;
        } else {
          this.airDateSim = date;
          this.airEndDateSim = null;
        }
      }
    }
  }

  resetSim() {
    this.airDateSim = null;
    this.airEndDateSim = null;
  }

  changeDateRange(dateRangeOption: DateRangeCode) {
    let startDate = new Date();
    let endDate = new Date();
    switch (dateRangeOption) {
      case DateRangeCode.TODAY:
        break;
      case DateRangeCode.YESTERDAY:
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case DateRangeCode.WEEK:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case DateRangeCode.LAST_30_DAYS:
        startDate.setDate(startDate.getDate() - 30);
        break;
      case DateRangeCode.CURRENT_MONTH:
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
        break;
      case DateRangeCode.LAST_MONTH:
        const date = new Date();
        const y = date.getFullYear();
        const m = date.getMonth();
        startDate = new Date(y, m - 1, 1);
        endDate = new Date(y, m, 0);
        break;
      default:
        break;
    }

    this.setStartMonth(startDate);
    this.startDate = startDate;
    this.endDate = endDate;
  }

  setStartMonth(date: Date = new Date()) {
    this.pickerCalendar = new svmsCalender(date, this.options);
    const date2 = new Date(this.pickerCalendar.year, this.pickerCalendar.month + 1, this.pickerCalendar.date);
    this.pickerCalendarTwo = new svmsCalender(date2, this.options);
  }

  isDisabledCalendarTwo(): boolean {
    return this.pickerCalendar.year === this.pickerCalendarTwo.year && this.pickerCalendar.month === this.pickerCalendarTwo.month;
  }

  validateDate(e) {
    let input = e.target.value;
    let isValid = /^[\d\/\-.]+$/.test(input); // This regex allows digits and date separators only

    if (!isValid) {
      this.writeValue(''); // clear the input field if the input is not valid
    } else {
      let d = new Date(input);
      if (!isNaN(d.getTime())) {
        this.onDateUpdate(d);
      }
    }
  }

  onFocusOut(e) {
    let d = new Date(e.target.value);
    if (isNaN(d.getTime())) {
      this.writeValue('');
    } else {
      this.writeValue(this.dateFormat(d));
      this.onDateUpdate(d);
    }
  }

  validateInput(event) {
    let keyCode = event.keyCode || event.which;
    if ((keyCode >= 65 && keyCode <= 90) || (keyCode >= 97 && keyCode <= 122)) {
      // ASCII value of alphabet
      event.preventDefault();
      return false;
    }
  }

  onDateUpdate(d) {
    this.pickerCalendar.year = d.getFullYear();
    this.pickerCalendar.month = d.getMonth();
    this.pickerCalendar.date = d.getDate();
    this.pickerCalendar = new svmsCalender(new Date(d), this.options);
    this.startDate = new Date(d);
    this.pickerCalendar.updateCalendar();
  }
}

export enum DateRangeCode {
  TODAY = 'Today',
  YESTERDAY = 'Yesterday',
  WEEK = 'Last 7 Days',
  LAST_30_DAYS = 'Last 30 Days',
  CURRENT_MONTH = 'This Month',
  LAST_MONTH = 'Last Month',
  CUSTOM_RANGE = 'Custom Range',
}

export class svmsCalender {
  daysInMonth: Array<number> = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  options: svmsOptions;
  airDays: Array<AirDay>;
  currentMonth: number;
  currentYear: number;
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;

  constructor(date: Date = new Date(), options: svmsOptions = new svmsOptions()) {
    const currentDate = new Date(date);
    this.currentMonth = currentDate.getMonth();
    this.currentYear = currentDate.getFullYear();
    this.options = options;
    this.year = currentDate.getFullYear();
    this.month = currentDate.getMonth();
    this.date = currentDate.getDate();
    this.hour = currentDate.getHours();
    this.minute = currentDate.getMinutes();
    this.updateCalendar();
  }

  updateCalendar() {
    this.airDays = [];
    const daysInMonth = this.getDaysInMonth(this.month);

    const date = new Date();
    const firstDayOfMonth = (new Date(this.year, this.month, 1).getDay() || 7) - 1; // making 0 == monday
    const weekend = new AirWeekend();

    if (firstDayOfMonth >= 0 /* is not monday (0) */) {
      const daysInLastMonth = this.getDaysInMonth(this.month - 1);

      const prevAirMonth = new AirMonth(this.month - 1, this.year);
      // UI changes
      // add starting date's form previous month to start from SU
      for (let dateNo = daysInLastMonth - firstDayOfMonth; dateNo <= daysInLastMonth; dateNo++) {
        this.airDays.push(
          new AirDay(
            dateNo,
            prevAirMonth.month,
            prevAirMonth.year,
            weekend.progress(),
            this.options.isDisabled(new Date(prevAirMonth.year, prevAirMonth.month, dateNo)),
            true,
          ),
        );
      }
    }

    for (let dateNo = 1; dateNo <= daysInMonth; dateNo++) {
      this.airDays.push(
        new AirDay(dateNo, this.month, this.year, weekend.progress(), this.options.isDisabled(new Date(this.year, this.month, dateNo))),
      );
    }

    if (this.date > daysInMonth) {
      this.date = daysInMonth; // select the maximum available this month instead
    }

    // set the current date if it's the current month & year
    if (date.getMonth() === this.month && date.getFullYear() === this.year) {
      this.airDays[firstDayOfMonth + date.getDate()].current = true;
    }

    const daysSoFar = firstDayOfMonth + daysInMonth - 1;
    const nextAirMonth = new AirMonth(this.month + 1, this.year);
    // adding date's from next month
    for (let dateNo = 1; dateNo <= (daysSoFar > 35 ? 42 : 35) - daysSoFar; dateNo++) {
      this.airDays.push(
        new AirDay(
          dateNo,
          nextAirMonth.month,
          nextAirMonth.year,
          weekend.progress(),
          this.options.isDisabled(new Date(nextAirMonth.year, nextAirMonth.month, dateNo)),
          true,
        ),
      );
    }
  }

  selectDate(index: number) {
    this.date = this.airDays[index].date;

    // might be a day from the previous/next month
    if (index < 7 && this.date > 20) {
      this.setMonth(this.month - 1);
    } else if (index > 20 && this.date < 8) {
      this.setMonth(this.month + 1);
    }
  }

  setMonth(month: number) {
    const airMonth: AirMonth = new AirMonth(month, this.year);
    this.month = airMonth.month;
    this.year = airMonth.year;
    this.updateCalendar();
  }

  setYear(year: number) {
    this.year = year;
  }

  getDaysInMonth(month: number) {
    const airMonth: AirMonth = new AirMonth(month, this.year);
    if ((airMonth.month === 1 && airMonth.year % 4 === 0 && airMonth.year % 100 !== 0) || airMonth.year % 400 === 0) {
      return 29;
    }

    return this.daysInMonth[airMonth.month];
  }
}

// normalizes month/year
export class AirMonth {
  month: number;
  year: number;

  constructor(month, year) {
    if (month > 11) {
      year++;
      month = 0;
    } else if (month < 0) {
      year--;
      month = 11;
    }

    this.month = month;
    this.year = year;
  }
}

export class AirDay {
  date: number;
  month: number;
  year: number;
  weekend: boolean;
  other: boolean;
  current: boolean;
  disabled: boolean;

  constructor(date: number, month: number, year: number, weekend = false, disabled = false, other = false, current = false) {
    this.date = date;
    this.month = month;
    this.year = year;
    this.weekend = weekend;
    this.disabled = disabled;
    this.other = other;
    this.current = current;
  }
}

export class AirWeekend {
  day: number;

  constructor(day: number = 0) {
    this.day = day;
  }

  progress(): boolean {
    let weekend = false;

    if (this.day === 0 /* Sunday */) {
      weekend = true;
      ++this.day;
    } else if (this.day === 6 /* Saturday */) {
      weekend = true;
      this.day = 0; // it's a new week!
    } else {
      ++this.day;
    }

    return weekend;
  }
}

export class svmsOptions {
  timepicker?: boolean;
  format12h?: boolean;
  fullDays?: boolean;
  language?: string;
  hourStep?: number;
  minuteStep?: number;
  range?: boolean;
  showRangeOption?: boolean;
  enabledDateRanges?: DateRange[];
  alwaysVisible?: boolean;

  constructor(_options: svmsOptions = {} as svmsOptions) {
    this.timepicker = !!_options.timepicker;
    this.format12h = !!_options.format12h;
    this.fullDays = !!_options.fullDays;
    this.language = _options.language || 'English';
    this.hourStep = _options.hourStep || 1;
    this.minuteStep = _options.minuteStep || 1;
    this.range = !!_options.range;
    this.showRangeOption = typeof _options.showRangeOption == "undefined" ? true : _options.showRangeOption;
    this.enabledDateRanges = _options.enabledDateRanges || [];
    this.alwaysVisible = _options.alwaysVisible || false;
  }

  static sameDate(date1: Date, date2: Date) {
    return (
      date1 &&
      date2 &&
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  }

  isDisabled(date: Date) {
    for (const dateRange of this.enabledDateRanges) {
      if (dateRange.start && dateRange.end) {
        if (date >= dateRange.start && date <= dateRange.end) {
          return false;
        }
      } else if (dateRange.start && !dateRange.end) {
        if (date >= dateRange.start) {
          return false;
        }
      } else if (!dateRange.start && dateRange.end) {
        if (date <= dateRange.end) {
          return false;
        }
      }
    }
    return !!this.enabledDateRanges.length;
  }


}

export interface DateRange {
  start: Date;
  end: Date;
  default: Date;
}

export class svmsLanguage {
  days: Array<string>;
  daysMin: Array<string>;
  months: Array<string>;

  constructor(days: Array<string>, daysMin: Array<string>, months: Array<string>) {
    this.days = days;
    this.daysMin = daysMin;
    this.months = months;
  }
}

export const SVMS_LANGUAGES: Map<string, svmsLanguage> = new Map([
  [
    'English',
    new svmsLanguage(
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', ,],
      ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ),
  ] as [string, svmsLanguage],

  [
    'Español - ES - Traducción',
    new svmsLanguage(
      ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      ['Lu', 'Dp', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
      ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Augosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    ),
  ] as [string, svmsLanguage],

  [
    'fi',
    new svmsLanguage(
      ['Sunnuntai', 'Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai', 'Lauantai'],
      ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'],
      [
        'Tammikuu',
        'Helmikuu',
        'Maaliskuu',
        'Huhtikuu',
        'Toukokuu',
        'Kesäkuu',
        'Heinäkuu',
        'Elokuu',
        'Syyskuu',
        'Lokakuu',
        'Marraskuu',
        'Joulukuu',
      ],
    ),
  ] as [string, svmsLanguage],

  [
    'fr',
    new svmsLanguage(
      ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
      ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
      ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Decembre'],
    ),
  ] as [string, svmsLanguage],

  [
    'hu',
    new svmsLanguage(
      ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'],
      ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'],
      [
        'Január',
        'Február',
        'Március',
        'Április',
        'Május',
        'Június',
        'Július',
        'Augusztus',
        'Szeptember',
        'Október',
        'November',
        'December',
      ],
    ),
  ] as [string, svmsLanguage],
]);
