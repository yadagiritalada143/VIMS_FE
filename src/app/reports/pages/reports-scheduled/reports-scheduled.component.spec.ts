import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReportsScheduledComponent } from './reports-scheduled.component';

describe('ReportsScheduledComponent', () => {
  let component: ReportsScheduledComponent;
  let fixture: ComponentFixture<ReportsScheduledComponent>;
  CommonTestingModule.setUpTestBed(ReportsScheduledComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportsScheduledComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsScheduledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
