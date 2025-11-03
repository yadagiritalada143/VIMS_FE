import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditExpenseComponent } from './edit-expense.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('EditExpenseComponent', () => {
  let component: EditExpenseComponent;
  let fixture: ComponentFixture<EditExpenseComponent>;
  CommonTestingModule.setUpTestBed(EditExpenseComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(EditExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
