export class Month {
    static months: string[] = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];

    static getMonthName(index: number): string {
        return index < 0 && index > this.months.length ? '' : this.months[index];
    }

    static getMonths(): string[] {
        return this.months;
    }

    static getMonthNameSlice(): string[] {
        const months = this.months.map((name: string) => {
            return name.slice(0, 3);
        });
        return months;
    }
}
