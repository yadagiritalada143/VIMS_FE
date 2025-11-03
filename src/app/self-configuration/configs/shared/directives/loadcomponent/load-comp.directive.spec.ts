import { LoadCompDirective } from './load-comp.directive';
import { ViewContainerRef } from '@angular/core';

describe('LoadCompDirective', () => {
  it('should create an instance', () => {
    const viewContainerRefMock = {} as ViewContainerRef;
    const directive = new LoadCompDirective(viewContainerRefMock);
    expect(directive).toBeTruthy();
  });
});
