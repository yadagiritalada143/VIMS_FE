import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NewExpenseHeaderComponent } from './new-expense-header.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NewExpenseHeaderComponent', () => {
  let component: NewExpenseHeaderComponent;
  let fixture: ComponentFixture<NewExpenseHeaderComponent>;
  CommonTestingModule.setUpTestBed(NewExpenseHeaderComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NewExpenseHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
