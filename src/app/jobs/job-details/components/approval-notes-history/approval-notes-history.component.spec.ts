import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ApprovalNotesHistoryComponent } from './approval-notes-history.component';

describe('ApprovalNotesHistoryComponent', () => {
  let component: ApprovalNotesHistoryComponent;
  let fixture: ComponentFixture<ApprovalNotesHistoryComponent>;
  CommonTestingModule.setUpTestBed(ApprovalNotesHistoryComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApprovalNotesHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovalNotesHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
