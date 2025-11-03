import { AccuracyPipe } from './accuracy.pipe';
import { StorageService } from 'src/app/core/services/storage.service'; 
import { DecimalPipe } from '@angular/common';
import { AlertService } from 'src/app/core/components/alert/alert.service'; 

describe('AccuracyPipe', () => {
  it('should create an instance', () => {
    const storageServiceMock = {} as StorageService;
    const decimalPipeMock = {} as DecimalPipe;
    const alertServiceMock = {} as AlertService;
    const pipe = new AccuracyPipe(storageServiceMock, decimalPipeMock, alertServiceMock);
    expect(pipe).toBeTruthy();
  });
});
