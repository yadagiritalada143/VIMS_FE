import { Day } from "./day";
import { Weeks } from "./weeks";


export class Calendar {
    constructor() { }

    public getMonth(_year: number, _month: number): Day[] {
        let days: Day[] = [];
        const dayIndex: number = new Date(_year, _month, 0).getDay();

        if (dayIndex < Weeks.weeks.length - 1) {
            const date = new Date(_year, _month, 0);
            const month: number = date.getMonth();
            const year: number = date.getFullYear();
            const day: number = date.getDate();
            if (dayIndex === 0) {
                days.push(this.getDay(new Day(year, month, day, true)));
            } else {
                for (let i = dayIndex; i >= 0; i--) {
                    days.push(this.getDay(new Day(year, month, day, true), -i));
                }
            }
        }

        const countDaysInMonth: number = new Date(_year, _month + 1, 0).getDate();
        for (let i = 1; i <= countDaysInMonth; i++) {
            days.push(this.getDay(new Day(_year, _month, i)));
        }

        const lastDayIndex = days[days.length - 1]?.day_index;
        if (lastDayIndex < Weeks.weeks.length - 1) {
            const date = new Date(_year, _month + 1, 1);
            const month: number = date.getMonth();
            const year: number = date.getFullYear();
            const day: number = date.getDate();
            for (let i = lastDayIndex, j = 0; i < Weeks.weeks.length - 1; i++, j++) {
                days.push(this.getDay(new Day(year, month, day, true), j));
            }
        }
        return days;
    }

    public getWeek(_year: number, _month: number, _day: number): Day[] {
        let days: Day[] = [];
        const dayIndex: number = new Date(_year, _month, _day).getDay();
        if (dayIndex < Weeks.weeks.length - 1 && dayIndex !== 0) {
            for (let i = dayIndex; i > 0; i--) {
                days.push(this.getDay(new Day(_year, _month, _day), -i));
            }
            for (let i = 0; i < Weeks.weeks.length - dayIndex; i++) {
                days.push(this.getDay(new Day(_year, _month, _day), i));
            }
        } else if (dayIndex === Weeks.weeks.length - 1) {
            for (let i = 1; i <= Weeks.weeks.length; i++) {
                days.push(this.getDay(new Day(_year, _month, _day), i));
            }
        } else if (dayIndex === 0) {
            for (let i = Weeks.weeks.length; i > 0; i--) {
                days.push(this.getDay(new Day(_year, _month, _day), -i));
            }
        }
        return days;
    }

    public getDay(_day: Day, increment: number = null): Day {
        let day: Day;
        let date = new Date(_day.year, _day.month_index, _day.day_number);
        if (increment > 0) {
            date.setDate(date.getDate() + increment);
            day = new Day(date.getFullYear(), date.getMonth(), date.getDate(), _day.disable);
        } else if (increment < 0) {
            increment *= -1;
            date.setDate(date.getDate() - increment);
            day = new Day(date.getFullYear(), date.getMonth(), date.getDate(), _day.disable);
        } else {
            day = new Day(date.getFullYear(), date.getMonth(), date.getDate(), _day.disable);
        }
        return day;
    }
}