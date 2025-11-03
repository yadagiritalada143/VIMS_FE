import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RateCardsComponent } from './rate-cards.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('RateCardsComponent', () => {
  let component: RateCardsComponent;
  let fixture: ComponentFixture<RateCardsComponent>;
  CommonTestingModule.setUpTestBed(RateCardsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RateCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
