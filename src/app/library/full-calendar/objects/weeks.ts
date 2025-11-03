export class Weeks {
    static weeks: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    static getDayName(index: number): string {
        return index < 0 && index > this.weeks.length ? '' : this.weeks[index];
    }

    static getDaysName(): string[] {
        return this.weeks;
    }

    static getDaysNameSlice(): string[] {
        const weeks = this.weeks.map((name: string) => {
            return name.slice(0, 3);
        });
        return weeks;
    }
}
