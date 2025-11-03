import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PendingInterviewsWidgetComponent } from './pending-interviews-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PendingInterviewsWidgetComponent', () => {
  let component: PendingInterviewsWidgetComponent;
  let fixture: ComponentFixture<PendingInterviewsWidgetComponent>;
  CommonTestingModule.setUpTestBed(PendingInterviewsWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingInterviewsWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingInterviewsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
