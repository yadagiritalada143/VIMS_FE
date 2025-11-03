import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GlobalLaunchService } from './global-launch.service';

describe('GlobalLaunchService', () => {
  let service: GlobalLaunchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports :[HttpClientTestingModule]
    });
    service = TestBed.inject(GlobalLaunchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
