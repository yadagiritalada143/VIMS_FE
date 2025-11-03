import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentDetailsViewComponent } from './assignment-details-view.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';

describe('AssignmentDetailsViewComponent', () => {
  let component: AssignmentDetailsViewComponent;
  let fixture: ComponentFixture<AssignmentDetailsViewComponent>;
  CommonTestingModule.setUpTestBed(AssignmentDetailsViewComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentDetailsViewComponent ,AccuracyPipe],
      providers: [DecimalPipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentDetailsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
