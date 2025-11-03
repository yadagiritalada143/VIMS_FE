import { TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { SvmsRouterService } from './svms-router.service';

describe('SvmsRouterService', () => {
  let service: SvmsRouterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule]
    });
    service = TestBed.inject(SvmsRouterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
