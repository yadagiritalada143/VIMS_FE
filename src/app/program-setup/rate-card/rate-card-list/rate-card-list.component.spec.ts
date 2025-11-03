import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateCardListComponent } from './rate-card-list.component';

describe('RateCardListComponent', () => {
  let component: RateCardListComponent;
  let fixture: ComponentFixture<RateCardListComponent>;
  CommonTestingModule.setUpTestBed(RateCardListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RateCardListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
