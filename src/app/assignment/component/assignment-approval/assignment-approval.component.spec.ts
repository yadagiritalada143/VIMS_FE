import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentApprovalComponent } from './assignment-approval.component';

describe('AssignmentApprovalComponent', () => {
  let component: AssignmentApprovalComponent;
  let fixture: ComponentFixture<AssignmentApprovalComponent>;
  CommonTestingModule.setUpTestBed(AssignmentApprovalComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentApprovalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
