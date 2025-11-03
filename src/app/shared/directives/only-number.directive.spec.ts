import { OnlyNumberDirective } from './only-number.directive';
import { ElementRef } from '@angular/core';

describe('OnlyNumberDirective', () => {
  it('should create an instance', () => {
    const elementRefMock = { nativeElement: {} } as ElementRef<any>;
    const directive = new OnlyNumberDirective(elementRefMock);
    expect(directive).toBeTruthy();
  });
});
