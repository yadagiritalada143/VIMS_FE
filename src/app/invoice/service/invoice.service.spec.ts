import { TestBed } from '@angular/core/testing';

import { InvoiceService } from './invoice.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccuracyPipe, DecimalPipe, CustomcurrencyPipe],
      imports: [HttpClientTestingModule, RouterTestingModule]
    });
    service = TestBed.inject(InvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
