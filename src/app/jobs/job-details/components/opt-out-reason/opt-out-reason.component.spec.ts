import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { OptOutReasonComponent } from './opt-out-reason.component';

describe('OptOutReasonComponent', () => {
  let component: OptOutReasonComponent;
  let fixture: ComponentFixture<OptOutReasonComponent>;
  CommonTestingModule.setUpTestBed(OptOutReasonComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OptOutReasonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OptOutReasonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
