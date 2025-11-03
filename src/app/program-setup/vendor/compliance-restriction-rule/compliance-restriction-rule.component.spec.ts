import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ComplianceRestrictionRuleComponent } from './compliance-restriction-rule.component';

describe('ComplianceRestrictionRuleComponent', () => {
  let component: ComplianceRestrictionRuleComponent;
  let fixture: ComponentFixture<ComplianceRestrictionRuleComponent>;
  CommonTestingModule.setUpTestBed(ComplianceRestrictionRuleComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComplianceRestrictionRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceRestrictionRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
