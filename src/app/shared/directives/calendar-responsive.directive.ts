import { Directive, ElementRef} from '@angular/core';

@Directive({
  selector: '[appCalendarResponsive]'
})
export class CalendarResponsiveDirective {
  elemPosition
  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.elemPosition = this.el.nativeElement;
    const flipEnabled = this.elemPosition.querySelector(".flip-trigger");
    if(flipEnabled) {
      const inputElement = this.elemPosition.querySelector(".datepicker--");
      const checkCalendarResponsive = () => {
        const pickerElement = this.elemPosition.querySelector(".datepicker-main-wrapper");
        const elmRect = inputElement.getBoundingClientRect();
        if((elmRect.y + elmRect.height + 300) > window.innerHeight) {
          pickerElement.classList.add('flip');
        }
        else {
          pickerElement.classList.remove('flip');
        }
      }
  
      document.addEventListener('scroll', function(e) {  
        checkCalendarResponsive();
      });
      setTimeout(() => {
        checkCalendarResponsive();
      }, 800);
  
      window.addEventListener('resize', checkCalendarResponsive); 
    }
  }
}
