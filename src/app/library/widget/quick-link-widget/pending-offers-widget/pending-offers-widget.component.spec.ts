import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PendingOffersWidgetComponent } from './pending-offers-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PendingOffersWidgetComponent', () => {
  let component: PendingOffersWidgetComponent;
  let fixture: ComponentFixture<PendingOffersWidgetComponent>;
  CommonTestingModule.setUpTestBed(PendingOffersWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingOffersWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingOffersWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
