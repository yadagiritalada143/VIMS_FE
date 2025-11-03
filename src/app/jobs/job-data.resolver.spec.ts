import { TestBed } from '@angular/core/testing';
import { JobDataResolver } from './job-data.resolver';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('JobDataResolver', () => {
  let resolver: JobDataResolver;
  beforeEach(() => {
    TestBed.configureTestingModule({
         imports : [HttpClientTestingModule]
    });
    resolver = TestBed.inject(JobDataResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
