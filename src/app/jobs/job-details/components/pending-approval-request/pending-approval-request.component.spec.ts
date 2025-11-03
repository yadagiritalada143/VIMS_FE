import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { PendingApprovalRequestComponent } from './pending-approval-request.component';

describe('PendingApprovalRequestComponent', () => {
  let component: PendingApprovalRequestComponent;
  let fixture: ComponentFixture<PendingApprovalRequestComponent>;
  CommonTestingModule.setUpTestBed(PendingApprovalRequestComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingApprovalRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingApprovalRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
