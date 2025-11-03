import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NoExpenseComponent } from './no-expense.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NoExpenseComponent', () => {
  let component: NoExpenseComponent;
  let fixture: ComponentFixture<NoExpenseComponent>;
  CommonTestingModule.setUpTestBed(NoExpenseComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NoExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
