import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ExpenseAwaitingApprovalComponent } from './expense-awaiting-approval.component';

describe('ExpenseAwaitingApprovalComponent', () => {
  let component: ExpenseAwaitingApprovalComponent;
  let fixture: ComponentFixture<ExpenseAwaitingApprovalComponent>;
  CommonTestingModule.setUpTestBed(ExpenseAwaitingApprovalComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpenseAwaitingApprovalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseAwaitingApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
