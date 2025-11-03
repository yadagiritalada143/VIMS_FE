import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExpenseSingleDetailComponent } from './expense-single-detail.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ExpenseSingleDetailComponent', () => {
  let component: ExpenseSingleDetailComponent;
  let fixture: ComponentFixture<ExpenseSingleDetailComponent>;
  CommonTestingModule.setUpTestBed(ExpenseSingleDetailComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseSingleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
