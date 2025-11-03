import { TestBed } from '@angular/core/testing';

import { CardRateService } from './card-rate.service';

describe('CardRateService', () => {
  let service: CardRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardRateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
