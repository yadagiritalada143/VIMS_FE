import { CalendarResponsiveDirective } from './calendar-responsive.directive';
import { ElementRef } from '@angular/core';

describe('CalendarResponsiveDirective', () => {
  it('should create an instance', () => {
    const elementRefMock = {} as ElementRef<any>;
    const directive = new CalendarResponsiveDirective(elementRefMock);
    expect(directive).toBeTruthy();
  });
});
