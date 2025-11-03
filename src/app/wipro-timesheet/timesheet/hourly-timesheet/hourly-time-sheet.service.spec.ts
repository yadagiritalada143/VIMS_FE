import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HourlyTimeSheetService } from './hourly-time-sheet.service';
import { DatePipe } from '@angular/common';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
describe('HourlyTimeSheetService', () => {
  let service: HourlyTimeSheetService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [CustomcurrencyPipe,LocalDateFormatPipe,DecimalPipe,DatePipe,AccuracyPipe] });
    service = TestBed.inject(HourlyTimeSheetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
