import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NewExpenseDetailsComponent } from './new-expense-details.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NewExpenseDetailsComponent', () => {
  let component: NewExpenseDetailsComponent;
  let fixture: ComponentFixture<NewExpenseDetailsComponent>;
  CommonTestingModule.setUpTestBed(NewExpenseDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NewExpenseDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
