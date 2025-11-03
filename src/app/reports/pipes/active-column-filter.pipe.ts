import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'activeColumnFilter',
    pure: false
})

export class ActiveColumnFilterPipe implements PipeTransform {
    transform(items: any[], filter: Object): any {
        if (!items || !filter) {
            return items;
        }
        return items.filter(item => item.isEnabled === filter);
    }
}