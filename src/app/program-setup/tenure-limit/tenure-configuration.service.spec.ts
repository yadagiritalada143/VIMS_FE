import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TenureConfigurationService } from './tenure-configuration.service';

describe('TenureConfigurationService', () => {
  let service: TenureConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[HttpClientTestingModule]
    });
    service = TestBed.inject(TenureConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
