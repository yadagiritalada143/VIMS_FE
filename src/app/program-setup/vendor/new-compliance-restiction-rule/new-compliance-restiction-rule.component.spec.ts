import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuillModule } from 'ngx-quill';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { NewComplianceRestictionRuleComponent } from './new-compliance-restiction-rule.component';

describe('NewComplianceRestictionRuleComponent', () => {
  let component: NewComplianceRestictionRuleComponent;
  let fixture: ComponentFixture<NewComplianceRestictionRuleComponent>;
  CommonTestingModule.setUpTestBed(NewComplianceRestictionRuleComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewComplianceRestictionRuleComponent,SvmsDatepickerComponent ],
      imports:[QuillModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewComplianceRestictionRuleComponent);
    component = fixture.componentInstance;
    component.vendorData = [];
    component.statusData = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
