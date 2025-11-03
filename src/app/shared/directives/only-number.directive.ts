import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[onlyNumber]'
})
export class OnlyNumberDirective {
  @Input() allowDecimal: boolean = true;
  constructor(public el: ElementRef) {

    this.el.nativeElement.onkeypress = (evt) => {
      if(this.allowDecimal){
        if (((evt.which < 48) && (evt.which !== 46)) || evt.which > 57) {
          evt.preventDefault();
        }
      }
      else{
        if ((evt.which < 48) || evt.which > 57) {
          evt.preventDefault();
        }
      }
    };

  }

}
