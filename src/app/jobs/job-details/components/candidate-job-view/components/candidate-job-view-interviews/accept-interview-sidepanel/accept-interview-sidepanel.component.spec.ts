import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AcceptInterviewSidepanelComponent } from './accept-interview-sidepanel.component';

describe('AcceptInterviewSidepanelComponent', () => {
  let component: AcceptInterviewSidepanelComponent;
  let fixture: ComponentFixture<AcceptInterviewSidepanelComponent>;
  CommonTestingModule.setUpTestBed(AcceptInterviewSidepanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AcceptInterviewSidepanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptInterviewSidepanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
