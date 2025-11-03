import { TestBed } from '@angular/core/testing';

import { CommonViewRuleFlowService } from './common-view-rule-flow.service';

describe('CommonViewRuleFlowService', () => {
  let service: CommonViewRuleFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonViewRuleFlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
