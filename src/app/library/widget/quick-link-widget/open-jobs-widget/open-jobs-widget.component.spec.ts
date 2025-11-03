import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { OpenJobsWidgetComponent } from './open-jobs-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('OpenJobsWidgetComponent', () => {
  let component: OpenJobsWidgetComponent;
  let fixture: ComponentFixture<OpenJobsWidgetComponent>;
  CommonTestingModule.setUpTestBed(OpenJobsWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenJobsWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenJobsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
