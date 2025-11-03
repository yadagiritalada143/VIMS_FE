import { Pipe, PipeTransform } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Pipe({
  name: 'dob'
})
export class DateOfBirthPipe implements PipeTransform {
    constructor(private locStorage: StorageService) {
    }
    transform(value): string {
        const dobFormat: any = this.locStorage.get(StorageKeys.CURRENT_PROGRAM).config['preferred_dob_format'];
        if (!dobFormat) {
            return value;
        }
        const date = new Date(value);
        const dateVal = date.getDate();
        let months= ["January","February","March","April","May","June","July",
                "August","September","October","November","December"]
        return `${months[date.getMonth()]} ${dateVal}${this.nth(dateVal)}`;
    }

    nth(d) {
        if (d > 3 && d < 21) return 'th'; 
        switch (d % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
        }
    }
}