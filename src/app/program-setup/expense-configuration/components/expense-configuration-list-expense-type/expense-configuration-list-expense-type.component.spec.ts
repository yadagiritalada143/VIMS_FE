import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpenseConfigurationListExpenseTypeComponent } from './expense-configuration-list-expense-type.component';

describe('ExpenseConfigurationListExpenseTypeComponent', () => {
  let component: ExpenseConfigurationListExpenseTypeComponent;
  let fixture: ComponentFixture<ExpenseConfigurationListExpenseTypeComponent>;
  CommonTestingModule.setUpTestBed(ExpenseConfigurationListExpenseTypeComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpenseConfigurationListExpenseTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseConfigurationListExpenseTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
