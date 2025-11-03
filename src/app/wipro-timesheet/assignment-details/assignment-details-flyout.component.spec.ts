import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentDetailsFlyoutComponent } from './assignment-details-flyout.component';

describe('AssignmentDetailsFlyoutComponent', () => {
  let component: AssignmentDetailsFlyoutComponent;
  let fixture: ComponentFixture<AssignmentDetailsFlyoutComponent>;
  CommonTestingModule.setUpTestBed(AssignmentDetailsFlyoutComponent);
 
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentDetailsFlyoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentDetailsFlyoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
