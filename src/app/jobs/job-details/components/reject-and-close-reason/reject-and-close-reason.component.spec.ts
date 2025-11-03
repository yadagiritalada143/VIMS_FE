import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RejectAndCloseReasonComponent } from './reject-and-close-reason.component';

describe('RejectAndCloseReasonComponent', () => {
  let component: RejectAndCloseReasonComponent;
  let fixture: ComponentFixture<RejectAndCloseReasonComponent>;
  CommonTestingModule.setUpTestBed(RejectAndCloseReasonComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RejectAndCloseReasonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RejectAndCloseReasonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
