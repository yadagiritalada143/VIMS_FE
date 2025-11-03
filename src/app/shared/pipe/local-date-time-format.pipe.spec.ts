import { LocalDateTimeFormatPipe } from "./local-date-time-format.pipe";
import { StorageService } from "src/app/core/services/storage.service"; 

describe('LocalDateTimeFormatPipe', () => {
  it('should create an instance', () => {
    const localeMock = 'en-US';
    const storageServiceMock = {} as StorageService;
    const pipe = new LocalDateTimeFormatPipe(localeMock, storageServiceMock);
    expect(pipe).toBeTruthy();
  });
});
