import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DeleteExpenseComponent } from './delete-expense.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('DeleteExpenseComponent', () => {
  let component: DeleteExpenseComponent;
  let fixture: ComponentFixture<DeleteExpenseComponent>;
  CommonTestingModule.setUpTestBed(DeleteExpenseComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
