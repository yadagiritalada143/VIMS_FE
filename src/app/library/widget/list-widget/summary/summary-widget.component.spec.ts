import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SummaryWidgetComponent } from './summary-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SummaryWidgetComponent', () => {
  let component: SummaryWidgetComponent;
  let fixture: ComponentFixture<SummaryWidgetComponent>;
  CommonTestingModule.setUpTestBed(SummaryWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SummaryWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
