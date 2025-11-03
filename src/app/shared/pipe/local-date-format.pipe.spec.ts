import { LocalDateFormatPipe } from './local-date-format.pipe';
import { StorageService } from 'src/app/core/services/storage.service'; 

describe('LocalDateFormatPipe', () => {
  it('should create an instance', () => {
    const localeMock = 'en-US';
    const storageServiceMock = {} as StorageService;
    const pipe = new LocalDateFormatPipe(localeMock, storageServiceMock);
    expect(pipe).toBeTruthy();
  });
});
