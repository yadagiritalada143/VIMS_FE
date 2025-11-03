import { TestBed } from '@angular/core/testing';

import { ExpenseStatusService } from './expense-status.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

describe('ExpenseStatusService', () => {
  let service: ExpenseStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccuracyPipe, DecimalPipe, LocalDateFormatPipe],
      imports: [HttpClientTestingModule, RouterTestingModule]
    });
    service = TestBed.inject(ExpenseStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
