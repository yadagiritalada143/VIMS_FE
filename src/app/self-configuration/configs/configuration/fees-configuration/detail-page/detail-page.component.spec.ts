import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DetailPageComponent } from './detail-page.component';
import { PrecisionPipe } from 'src/app/shared/pipe/precision.pipe';

describe('DetailPageComponent', () => {
  let component: DetailPageComponent;
  let fixture: ComponentFixture<DetailPageComponent>;
  CommonTestingModule.setUpTestBed(DetailPageComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailPageComponent, PrecisionPipe ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
