import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplianceRestrictionRulesComponent } from './compliance-restriction-rules.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ComplianceRestrictionRulesComponent', () => {
  let component: ComplianceRestrictionRulesComponent;
  let fixture: ComponentFixture<ComplianceRestrictionRulesComponent>;
  CommonTestingModule.setUpTestBed(ComplianceRestrictionRulesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ComplianceRestrictionRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
