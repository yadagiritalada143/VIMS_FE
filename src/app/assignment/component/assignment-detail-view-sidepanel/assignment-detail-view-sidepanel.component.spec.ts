import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentDetailViewSidepanelComponent } from './assignment-detail-view-sidepanel.component';

describe('AssignmentDetailViewSidepanelComponent', () => {
  let component: AssignmentDetailViewSidepanelComponent;
  let fixture: ComponentFixture<AssignmentDetailViewSidepanelComponent>;
  CommonTestingModule.setUpTestBed(AssignmentDetailViewSidepanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentDetailViewSidepanelComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentDetailViewSidepanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
