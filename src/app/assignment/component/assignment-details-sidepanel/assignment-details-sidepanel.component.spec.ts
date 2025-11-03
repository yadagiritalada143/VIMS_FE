import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentDetailsSidepanelComponent } from './assignment-details-sidepanel.component';

describe('AssignmentDetailsSidepanelComponent', () => {
  let component: AssignmentDetailsSidepanelComponent;
  let fixture: ComponentFixture<AssignmentDetailsSidepanelComponent>;
  CommonTestingModule.setUpTestBed(AssignmentDetailsSidepanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentDetailsSidepanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentDetailsSidepanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
