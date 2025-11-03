import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { HistoryDetailsComponent } from './history-details.component';
import { JobDetailsComponent } from '../../job-details.component';
describe('HistoryDetailsComponent', () => {
  let component: HistoryDetailsComponent;
  let fixture: ComponentFixture<HistoryDetailsComponent>;
  CommonTestingModule.setUpTestBed(HistoryDetailsComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HistoryDetailsComponent ],
      providers: [
        JobDetailsComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
