import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RejectExpenseComponent } from './reject-expense.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('RejectExpenseComponent', () => {
  let component: RejectExpenseComponent;
  let fixture: ComponentFixture<RejectExpenseComponent>;
  CommonTestingModule.setUpTestBed(RejectExpenseComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RejectExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
