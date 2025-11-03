import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApprovalsService } from './approvals.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports :[HttpClientTestingModule]
    });
    service = TestBed.inject(ApprovalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
