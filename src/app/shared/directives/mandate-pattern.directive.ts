import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Directive({
  selector: '[mandatePattern]'
})
export class MandatePatternDirective {

  @Input() errorText: string = null;
  @Input() customAction: Function = null;
  @Input() mandatePattern: RegExp | string = null;
  
  constructor(
    private el: ElementRef,
    private alert: AlertService
  ) { }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

    // No pattern specified
    if(!this.mandatePattern)
      return event;

    // Helpers
    let eventKey: any = event?.key;
    let currValue: any = this.el?.nativeElement?.value;
    
    // Functional stroke
    if(!this.isKeyStroke(eventKey)) {
      return event;
    }

    let result: Array <string> = (currValue ?? '')?.split('');
    let caretPosition: any = this.el?.nativeElement?.selectionStart;
    result?.splice(caretPosition, 0, eventKey);

    // Validate resultant value
    if(!result?.join('').match(this.mandatePattern)) {
      if(this.errorText) {
        this.alert.error(this.errorText);
      }

      event.preventDefault();
      return event;
    }
    
    return event;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    return event;
  }
  
  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    // Custom event handler
    if(this.customAction) {
      this.customAction(event); 
    }
  }

  isKeyStroke(key: string) {
    return (key?.length === 1);
  }

}
