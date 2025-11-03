import { MandatePatternDirective } from './mandate-pattern.directive';
import { ElementRef } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';

describe('MandatePatternDirective', () => {
  it('should create an instance', () => {
    const elementRefMock={} as ElementRef<any>;
    const AlertServiceMock= {} as AlertService
    const directive = new MandatePatternDirective(elementRefMock,AlertServiceMock);
    expect(directive).toBeTruthy();
  });
});
