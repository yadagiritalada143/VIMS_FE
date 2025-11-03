import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpenseConfigurationFormComponent } from './expense-configuration-form.component';

describe('ExpenseConfigurationFormComponent', () => {
  let component: ExpenseConfigurationFormComponent;
  let fixture: ComponentFixture<ExpenseConfigurationFormComponent>;

  CommonTestingModule.setUpTestBed(ExpenseConfigurationFormComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseConfigurationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
