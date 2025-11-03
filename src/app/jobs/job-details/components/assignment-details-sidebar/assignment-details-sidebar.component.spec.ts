import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentDetailsSidebarComponent } from './assignment-details-sidebar.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
describe('AssignmentDetailsSidebarComponent', () => {
  let component: AssignmentDetailsSidebarComponent;
  let fixture: ComponentFixture<AssignmentDetailsSidebarComponent>;
  CommonTestingModule.setUpTestBed(AssignmentDetailsSidebarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentDetailsSidebarComponent ],
      providers:
        [{ provide: AccuracyPipe, useValue: DecimalPipe },]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentDetailsSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
