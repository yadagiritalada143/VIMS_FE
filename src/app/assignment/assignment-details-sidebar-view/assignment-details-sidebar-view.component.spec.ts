import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentDetailsSidebarViewComponent } from './assignment-details-sidebar-view.component';

describe('AssignmentDetailsSidebarViewComponent', () => {
  let component: AssignmentDetailsSidebarViewComponent;
  let fixture: ComponentFixture<AssignmentDetailsSidebarViewComponent>;
  CommonTestingModule.setUpTestBed(AssignmentDetailsSidebarViewComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentDetailsSidebarViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentDetailsSidebarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
