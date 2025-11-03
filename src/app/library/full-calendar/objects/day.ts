import { ICalendarEvent } from "../full-calendar.interfaces";
import { Month } from "./month";
import { Weeks } from "./weeks";


export class Day {
    public year: number;
    public month_name: string;
    public month_index: number;
    public day_number: number;
    public day_name: string;
    public day_index: number;
    public disable: boolean;
    public is_current: boolean;
    public events: ICalendarEvent[];

    constructor(_year: number, _month_index: number, _day_number: number, _disable: boolean = false) {
        this.year = _year;
        this.month_name = Month.getMonthName(_month_index);
        this.month_index = _month_index;
        this.day_number = _day_number;
        this.day_index = new Date(_year, _month_index, _day_number).getDay();
        this.day_name = Weeks.getDayName(this.day_index);
        this.disable = _disable;
        this.is_current = this.isCurrentDate(_year, _month_index, _day_number);
        this.events = [];
    }

    private isCurrentDate(_year: number, _month_index: number, _day_number: number): boolean {
        const date: Date = new Date(_year, _month_index, _day_number);
        const currentDate: Date = new Date();
        const isCurrentYear: boolean = date.getFullYear() === currentDate.getFullYear();
        const isCurrentMonth: boolean = date.getMonth() === currentDate.getMonth();
        const isCurrentDay: boolean = date.getDate() === currentDate.getDate();
        if (isCurrentYear && isCurrentMonth && isCurrentDay) {
            return true;
        }
        return false;
    }
}