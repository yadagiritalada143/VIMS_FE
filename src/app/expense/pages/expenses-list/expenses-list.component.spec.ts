import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExpensesListComponent } from './expenses-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ExpensesListComponent', () => {
  let component: ExpensesListComponent;
  let fixture: ComponentFixture<ExpensesListComponent>;
  CommonTestingModule.setUpTestBed(ExpensesListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpensesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
