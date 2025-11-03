import { InputAccuracyDirective } from './input-accuracy.directive';
import { ElementRef } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';

describe('InputAccuracyDirective', () => {
  it('should create an instance', () => {
    const elementRefMock = {} as ElementRef<any>;
    const storageServiceMock = {
      get: jasmine.createSpy('get'),
    } as unknown as StorageService;
        const directive = new InputAccuracyDirective(elementRefMock, storageServiceMock);
    expect(directive).toBeTruthy();
  });
});
