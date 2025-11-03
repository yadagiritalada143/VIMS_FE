import { HrefParserDirective } from './href-parser.directive';
import { ElementRef } from '@angular/core';

describe('HrefParserDirective', () => {
  it('should create an instance', () => {
    const elementRefMock = {} as ElementRef<any>;
    const directive = new HrefParserDirective(elementRefMock);
    expect(directive).toBeTruthy();
  });
});
