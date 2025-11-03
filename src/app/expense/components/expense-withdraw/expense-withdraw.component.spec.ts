import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WithdrawExpenseComponent } from './expense-withdraw-component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('WithdrawExpenseComponent', () => {
  let component: WithdrawExpenseComponent;
  let fixture: ComponentFixture<WithdrawExpenseComponent>;
  CommonTestingModule.setUpTestBed(WithdrawExpenseComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
