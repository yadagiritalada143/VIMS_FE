import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateCardHeaderComponent } from './rate-card-header.component';

describe('RateCardHeaderComponent', () => {
  let component: RateCardHeaderComponent;
  let fixture: ComponentFixture<RateCardHeaderComponent>;
  CommonTestingModule.setUpTestBed(RateCardHeaderComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RateCardHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateCardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
