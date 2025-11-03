import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'activeColumnOrder',
    pure: false
})

export class ActiveColumnOrderPipe implements PipeTransform {
    transform(items: any[], filter: Object): any {
        items.sort((a: any, b: any) => {
            if (a.isEnabled === filter && b.isEnabled !== filter) {
                return -1;
            } else if (a.isEnabled !== filter && b.isEnabled === filter) {
                return 1;
            } else return 0;
        })
        return items;
    }
}