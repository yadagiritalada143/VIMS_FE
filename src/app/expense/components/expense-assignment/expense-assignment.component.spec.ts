import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExpenseAssignmentComponent } from './expense-assignment.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ExpenseAssignmentComponent', () => {
  let component: ExpenseAssignmentComponent;
  let fixture: ComponentFixture<ExpenseAssignmentComponent>;
  CommonTestingModule.setUpTestBed(ExpenseAssignmentComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
