import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExpenseDetailComponent } from './expense-detail.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ExpenseDetailComponent', () => {
  let component: ExpenseDetailComponent;
  let fixture: ComponentFixture<ExpenseDetailComponent>;
  CommonTestingModule.setUpTestBed(ExpenseDetailComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
