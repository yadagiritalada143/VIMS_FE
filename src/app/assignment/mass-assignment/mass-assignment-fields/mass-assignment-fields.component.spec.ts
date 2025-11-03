import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MassAssignmentFieldsComponent } from './mass-assignment-fields.component';

describe('MassAssignmentFieldsComponent', () => {
  let component: MassAssignmentFieldsComponent;
  let fixture: ComponentFixture<MassAssignmentFieldsComponent>;
  CommonTestingModule.setUpTestBed(MassAssignmentFieldsComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MassAssignmentFieldsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MassAssignmentFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
