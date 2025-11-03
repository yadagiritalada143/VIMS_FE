import { TestBed } from '@angular/core/testing';

import { AddExpenseService } from './add-expense.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

describe('AddExpenseService', () => {
  let service: AddExpenseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomcurrencyPipe, AccuracyPipe, DecimalPipe, LocalDateFormatPipe],
      imports: [HttpClientTestingModule, RouterTestingModule]
    });
    service = TestBed.inject(AddExpenseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
