import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReportsScoreConfigurationComponent } from './reports-score-configuration.component';

describe('ReportsScoreConfigurationComponent', () => {
  let component: ReportsScoreConfigurationComponent;
  let fixture: ComponentFixture<ReportsScoreConfigurationComponent>;
  CommonTestingModule.setUpTestBed(ReportsScoreConfigurationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportsScoreConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsScoreConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
