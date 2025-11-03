import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpenseHistoryDetailsComponent } from './expense-history-details.component';

describe('ExpenseHistoryDetailsComponent', () => {
  let component: ExpenseHistoryDetailsComponent;
  let fixture: ComponentFixture<ExpenseHistoryDetailsComponent>;
  CommonTestingModule.setUpTestBed(ExpenseHistoryDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseHistoryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
