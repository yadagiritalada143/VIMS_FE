import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentDateUpdateComponent } from './assignment-date-update.component';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
describe('AssignmentDateUpdateComponent', () => {
  let component: AssignmentDateUpdateComponent;
  let fixture: ComponentFixture<AssignmentDateUpdateComponent>;
  CommonTestingModule.setUpTestBed(AssignmentDateUpdateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentDateUpdateComponent,SvmsDatepickerComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentDateUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
