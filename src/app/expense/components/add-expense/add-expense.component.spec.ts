import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddExpenseComponent } from './add-expense.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';

describe('AddExpenseComponent', () => {
  let component: AddExpenseComponent;
  let fixture: ComponentFixture<AddExpenseComponent>;
  CommonTestingModule.setUpTestBed(AddExpenseComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [DecimalPipe],
      declarations: [ AddExpenseComponent, AccuracyPipe, SvmsDatepickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
