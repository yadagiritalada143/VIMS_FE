import { ElementRef, Input, Directive} from '@angular/core';

@Directive({selector: '[focusMe]'})
export class FocusDirective  {

  @Input('focusMe') isFocused: boolean;

  constructor(private hostElement: ElementRef) {
  }

  ngAfterViewChecked() {
    if (this.isFocused) {
      this.hostElement.nativeElement.focus();
    }
  }
}