import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ViewAssignmentHistoryFlyoutComponent } from './view-assignment-history-flyout.component';

describe('ViewAssignmentHistoryFlyoutComponent', () => {
  let component: ViewAssignmentHistoryFlyoutComponent;
  let fixture: ComponentFixture<ViewAssignmentHistoryFlyoutComponent>;
  CommonTestingModule.setUpTestBed(ViewAssignmentHistoryFlyoutComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewAssignmentHistoryFlyoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewAssignmentHistoryFlyoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
