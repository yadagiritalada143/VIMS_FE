import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SummaryPageInfoComponent } from './summary-page-info.component';

describe('SummaryPageInfoComponent', () => {
  let component: SummaryPageInfoComponent;
  let fixture: ComponentFixture<SummaryPageInfoComponent>;
  CommonTestingModule.setUpTestBed(SummaryPageInfoComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SummaryPageInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryPageInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
