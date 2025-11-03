import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpenseToggleComponent } from './expense-toggle.component';

describe('ExpenseToggleComponent', () => {
  let component: ExpenseToggleComponent;
  let fixture: ComponentFixture<ExpenseToggleComponent>;
  CommonTestingModule.setUpTestBed(ExpenseToggleComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpenseToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
