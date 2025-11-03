import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { OptedOutJobComponent } from './opted-out-job.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
describe('OptedOutJobComponent', () => {
  let component: OptedOutJobComponent;
  let fixture: ComponentFixture<OptedOutJobComponent>;
  CommonTestingModule.setUpTestBed(OptedOutJobComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OptedOutJobComponent ],
      providers: [
        { provide: AccuracyPipe, useValue: DecimalPipe },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OptedOutJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
