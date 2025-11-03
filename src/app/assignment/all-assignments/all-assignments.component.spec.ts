import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AllAssignmentsComponent } from './all-assignments.component';

describe('AllAssignmentsComponent', () => {
  let component: AllAssignmentsComponent;
  let fixture: ComponentFixture<AllAssignmentsComponent>;
  CommonTestingModule.setUpTestBed(AllAssignmentsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AllAssignmentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
