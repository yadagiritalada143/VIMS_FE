import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonViewRuleFlowComponent } from './common-view-rule-flow.component';

describe('CommonViewRuleFlowComponent', () => {
  let component: CommonViewRuleFlowComponent;
  let fixture: ComponentFixture<CommonViewRuleFlowComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CommonViewRuleFlowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonViewRuleFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
