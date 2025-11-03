import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfferProgramConfigComponent } from './offer-program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramConfigControlComponent } from '../program-config-control/program-config-control.component';

describe('OfferProgramConfigComponent', () => {
  let component: OfferProgramConfigComponent;
  let fixture: ComponentFixture<OfferProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(OfferProgramConfigComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OfferProgramConfigComponent, ProgramConfigControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
