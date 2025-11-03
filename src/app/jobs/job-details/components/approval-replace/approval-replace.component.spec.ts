import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ApprovalReplaceComponent } from './approval-replace.component';

describe('ApprovalReplaceComponent', () => {
  let component: ApprovalReplaceComponent;
  let fixture: ComponentFixture<ApprovalReplaceComponent>;
  CommonTestingModule.setUpTestBed(ApprovalReplaceComponent)
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApprovalReplaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovalReplaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
