import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TerminateAssignmentComponent } from './terminate-assignment.component';

describe('TerminateAssignmentComponent', () => {
  let component: TerminateAssignmentComponent;
  let fixture: ComponentFixture<TerminateAssignmentComponent>;
  CommonTestingModule.setUpTestBed(TerminateAssignmentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TerminateAssignmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminateAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
