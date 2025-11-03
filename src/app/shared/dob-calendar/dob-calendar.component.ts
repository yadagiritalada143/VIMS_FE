import { Component, EventEmitter, Output, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Month } from 'src/app/library/full-calendar/objects/month';

@Component({
  selector: 'app-dob-calendar',
  templateUrl: './dob-calendar.component.html',
  styleUrls: ['./dob-calendar.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DobCalendarComponent),
      multi: true,
    },
  ],
})
export class DobCalendarComponent implements ControlValueAccessor {
  months:any=Month.months;
  selectedMonth: any = 1;
  selectedDay: any | null = null;
  selectedDate: string = ''; // Initial value
  selectedYear: number = 2024; // Leap year
  selectedDOB: string = '';
  weeks: number[][] = [];
  isShowCalendar: boolean = false;
  isFormatValid: boolean = false;
  @Input() isNotValid: boolean = false;
  @Input('value') _value = '';
  @Input() isSubmitted: any;
  onChange: any = () => {};
  onTouched: any = () => {};

  @Output() dobChange = new EventEmitter<any>();

  constructor() {
    this.updateDays();
  }

  getDaysInMonth(month: number): number {
    switch (month) {
      case 2: // February
        return this.selectedYear % 4 === 0 && (this.selectedYear % 100 !== 0 || this.selectedYear % 400 === 0) ? 29 : 28;
      case 4: // April
      case 6: // June
      case 9: // September
      case 11: // November
        return 30;
      default:
        return 31;
    }
  }

  writeValue(value) {
    this.value = value;
  }

  updateDays(): void {
    const daysInMonth = this.getDaysInMonth(this.selectedMonth);
    this.weeks = [];
    let currentWeek: number[] = new Array(7).fill(null);

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDayOfWeek = (i - 1) % 7;
      if (currentDayOfWeek === 0 && i !== 1) {
        this.weeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
      currentWeek[currentDayOfWeek] = i;
    }

    if (currentWeek.some(day => day !== null)) {
      this.weeks.push(currentWeek);
    }
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  onDateChange(event: any): void {
    if (this.selectedDate?.length == 2) {
      let isValid=/^[\d\-.]+$/.test(this.selectedDate);
      let month=+this.selectedDate;
      if(isValid && month >= 1 && month <= 12){
      this.selectedDate = this.selectedDate + '/';
      this.selectedMonth = month;
      this.isFormatValid = false;
      this.isSubmitted = false;
    } else {
      this.selectedDate = this.selectedDate;
      this.selectedDay = '';
      this.selectedMonth = 1;
      this.isFormatValid = true;
      this.isSubmitted = true;
      this.isShowCalendar = false;
    }
  }
  if(this.selectedDate.length==0){
    this.selectedMonth = 1;
    this.updateDays();
  }
    this.activeDate(this.selectedDate);
  }

  activeDate(parts) {
    if (this.selectedDate.length == 5 || this.selectedDate.length == 4 || this.selectedDate.length == 2) {
      parts = this.selectedDate.split('/');
      if (parts.length === 2) {
        const [month, day] = parts.map(Number);
        if (month >= 1 && month <= 12 && day >=0 && day <= this.getDaysInMonth(month) && parts[1]!='00') {
          this.selectedMonth = month;
          this.selectedDay = day;
          this.isFormatValid = false;
          this.isSubmitted = false;
          this.updateDays();
          this.dobChange.emit(this.selectedDate);
        } else {
          this.selectedDay = '';
          this.selectedMonth = month;
          this.selectedDate = this.selectedDate;
          this.isFormatValid = true;
          this.isSubmitted = true;
          this.isShowCalendar = false;
        }
      } else {
        const month = parts;
        if (month >= 1 && month <= 12) {
          this.selectedMonth = month;
          this.isFormatValid = false;
          this.isSubmitted = false;
          this.updateDays();
          this.dobChange.emit(this.selectedDate);
        } else {
          this.selectedDay = '';
          this.selectedMonth = 1;
          this.selectedDate = this.selectedDate;
          this.isFormatValid = true;
          this.isSubmitted = true;
          this.isShowCalendar = false;
        }
      }
    } else if(this.selectedDate.length == 3){
      let isValid=/^[\d\/]+$/.test(this.selectedDate);
      let candidateMonth = this.selectedDate.substring(0, this.selectedDate.length - 1);
      let month=+candidateMonth;
      if(isValid && month >= 1 && month <= 12){
        this.selectedMonth = month;
        this.updateDays();
        this.isFormatValid = false;
        this.isSubmitted = false;
      } else {
        this.selectedDate = this.selectedDate;
        this.selectedDay = '';
        this.selectedMonth = 1;
        this.isFormatValid = true;
        this.isSubmitted = true;
        this.isShowCalendar = false;
      }
    }
    else {
      this.selectedDay = 1;
      this.selectedMonth = this.selectedMonth;
      return;
    }
  }

  isSelectedDate(day: number): boolean {
    return this.selectedMonth && this.selectedDay === day;
  }

  onClick() {
    this.isShowCalendar = !this.isShowCalendar;
    this.onCliclSelectdate();
  }

  onCliclSelectdate() {
    this.selectedDate = this.selectedDate === '' ? '' : this.selectedDate;
    this.activeDate(this.selectedDate);
  }

  onMonthChange(event: any): void {
    this.selectedMonth = +event; // Update selectedMonth based on the dropdown value
    this.selectedDay = '';
    this.updateDays();
    this.selectedDate = this.selectedDate;
    setTimeout(() => {
      this.isShowCalendar=true;
    }, 1);
    
  }

  onInputClick(event: Event): void {
    event.stopPropagation(); // Prevent the event from propagating further
  }

  selectDay(day: number): void {
    this.selectedDay = day;
    this.selectedDate = `${this.selectedMonth.toString().padStart(2, '0')}/${this.selectedDay.toString().padStart(2, '0')}`;
    this.selectedDOB = `${this.selectedMonth.toString().padStart(2, '0')}/${this.selectedDay
      .toString()
      .padStart(2, '0')}/${this.selectedYear.toString().padStart(2, '0')}`;
    this.dobChange.emit(this.selectedDOB);
    this.writeValue(this.selectedDate);
    if (this.selectedDate) {
      this.isShowCalendar = this.isFormatValid = this.isSubmitted = false;
    }
  }

  inputFocused() {
    this.isShowCalendar = !this.isShowCalendar;
  }

  updateDob(newDob: any) {
    this.writeValue(newDob);
    this.dobChange.emit(newDob);
  }

  validateDate(e) {
    let input = e.target.value;
    let isValid = /^[\d\/]+$/.test(input);
    if (isValid) {
      this.isShowCalendar = true;
      return true;
    }
    else {
      this.selectedDate =this.selectedDate.substring(0, this.selectedDate.length - 1);
      this.isFormatValid = true;
      this.isSubmitted = true;
      return false;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
