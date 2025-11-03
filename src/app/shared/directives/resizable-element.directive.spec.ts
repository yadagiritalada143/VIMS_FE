import { ResizableElementDirective } from './resizable-element.directive';
import { ElementRef } from '@angular/core';

describe('ResizableElementDirective', () => {
  it('should create an instance', () => {
    const elementRefMock= {} as ElementRef<any>;
    const directive = new ResizableElementDirective(elementRefMock);
    expect(directive).toBeTruthy();
  });
});
