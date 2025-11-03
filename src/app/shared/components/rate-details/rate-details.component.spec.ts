import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateDetailsComponent } from './rate-details.component';
import { AccuracyPipe } from '../../pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';

describe('RateDetailsComponent', () => {
  let component: RateDetailsComponent;
  let fixture: ComponentFixture<RateDetailsComponent>;
  CommonTestingModule.setUpTestBed(RateDetailsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RateDetailsComponent, AccuracyPipe ],
      providers: [DecimalPipe]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
