import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExpenseHeaderComponent } from './expense-header.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ExpenseHeaderComponent', () => {
  let component: ExpenseHeaderComponent;
  let fixture: ComponentFixture<ExpenseHeaderComponent>;
  CommonTestingModule.setUpTestBed(ExpenseHeaderComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpenseHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
