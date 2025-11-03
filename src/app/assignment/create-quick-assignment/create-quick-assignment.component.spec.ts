import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateQuickAssignmentComponent } from './create-quick-assignment.component';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
describe('CreateQuickAssignmentComponent', () => {
  let component: CreateQuickAssignmentComponent;
  let fixture: ComponentFixture<CreateQuickAssignmentComponent>;
  CommonTestingModule.setUpTestBed(CreateQuickAssignmentComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateQuickAssignmentComponent,SvmsDatepickerComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateQuickAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
