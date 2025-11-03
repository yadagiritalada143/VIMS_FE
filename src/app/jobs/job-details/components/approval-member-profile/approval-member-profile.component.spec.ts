import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ApprovalMemberProfileComponent } from './approval-member-profile.component';

describe('ApprovalMemberProfileComponent', () => {
  let component: ApprovalMemberProfileComponent;
  let fixture: ComponentFixture<ApprovalMemberProfileComponent>;
  CommonTestingModule.setUpTestBed(ApprovalMemberProfileComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApprovalMemberProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovalMemberProfileComponent);
    component = fixture.componentInstance;
    component.profile = {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
