import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DashboardGridService } from './dashboard-grid.service';

describe('GridStackService', () => {
  let service: DashboardGridService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[HttpClientTestingModule]
    });
    service = TestBed.inject(DashboardGridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
