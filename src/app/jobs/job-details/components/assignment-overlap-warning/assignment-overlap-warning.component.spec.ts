import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentOverlapWarningComponent } from './assignment-overlap-warning.component';

describe('AssignmentOverlapWarningComponent', () => {
  let component: AssignmentOverlapWarningComponent;
  let fixture: ComponentFixture<AssignmentOverlapWarningComponent>;
  CommonTestingModule.setUpTestBed(AssignmentOverlapWarningComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignmentOverlapWarningComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentOverlapWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
