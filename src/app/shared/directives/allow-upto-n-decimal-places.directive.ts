import { Directive, Input, ElementRef, HostListener } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Directive({
  selector: '[allowUptoNDigitDecimalNumber]'
})
export class AllowUptoNDigitDecimalNumberDirective {
  customaccuracy: number = -1;
  @Input() set allowUptoNDigitDecimalNumber(accuracy: any) {
    this.customaccuracy = isNaN(accuracy) ? -1: parseInt(accuracy);
  }
  // Backspace, tab, end, home
  private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Del', 'Delete'];

  constructor(
    private el: ElementRef,
    private sessionStorage: StorageService
    ) {
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

    let eventKey: any = event?.key;
    if (this.specialKeys.indexOf(event?.key) !== -1) {
      return;
    }

    if (event?.key != '.' && isNaN(eventKey)) {
      event?.preventDefault();
    }

    const programDetails = this.sessionStorage?.get(StorageKeys.CURRENT_PROGRAM);
    let num: any = (Number.isInteger(this.customaccuracy) && this.customaccuracy >= 0) ? this.customaccuracy : programDetails?.config?.currency?.edit_accuracy;
    if (!Number.isInteger(num))
      num = 2;

    this.el?.nativeElement?.setAttribute('type', 'text');
    let current: string = this.el?.nativeElement?.value;
    if(this.customaccuracy === 0) {
      let validKeyList: Array<string> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
      if(!(validKeyList.includes(event?.key) || this.specialKeys.includes(event?.key))) {
        event?.preventDefault();
        return event;
      }
    }

    if (current?.indexOf('.') > -1 && (event?.key == 'Decimal' || event?.key == '.')) {
      event?.preventDefault();
    }
    const position = this.el?.nativeElement?.selectionStart;
    const next: string = [
      current?.slice(0, position),
      event?.key == 'Decimal' ? '.' : event?.key,
      current?.slice(position),
    ].join('');
    if (next?.indexOf('.') > -1) {
      const myarray = next?.split('.');
      const afterdecimal = myarray[1];
      if (afterdecimal?.length > num) event?.preventDefault();
    }
  }
}