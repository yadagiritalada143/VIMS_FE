import { TestBed } from '@angular/core/testing';

import { TaxConfigurationService } from './tax-configuration.service';

describe('TaxConfigurationService', () => {
  let service: TaxConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaxConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
