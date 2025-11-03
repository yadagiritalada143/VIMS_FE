import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MassUpdateAssignmentComponent } from './mass-update-assignment.component';
import { SvmsDatepickerComponent, svmsCalender } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
describe('MassUpdateAssignmentComponent', () => {
  let component: MassUpdateAssignmentComponent;
  let fixture: ComponentFixture<MassUpdateAssignmentComponent>;
  CommonTestingModule.setUpTestBed(MassUpdateAssignmentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MassUpdateAssignmentComponent,SvmsDatepickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MassUpdateAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
