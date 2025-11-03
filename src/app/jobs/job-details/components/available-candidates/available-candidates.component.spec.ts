import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AvailableCandidatesComponent } from './available-candidates.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { RouterTestingModule } from '@angular/router/testing';  
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';

describe('AvailableCandidatesComponent', () => {
  let component: AvailableCandidatesComponent;
  let fixture: ComponentFixture<AvailableCandidatesComponent>;
  let localDateFormat: Partial<LocalDateFormatPipe>;
  let CustomCurrency: Partial<CustomcurrencyPipe>;

  beforeEach(waitForAsync(() => {
    const localDateFormatService = jasmine.createSpyObj('LocalDateFormatPipe',['transform']);
    const  customCurrencyService = jasmine.createSpyObj('CustomcurrencyPipe', ['transform']);
    TestBed.configureTestingModule({
      declarations: [ AvailableCandidatesComponent ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers:[
        { provide: LocalDateFormatPipe, useValue:  localDateFormatService},
        { provide: CustomcurrencyPipe, useValue:  customCurrencyService}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableCandidatesComponent);
    component = fixture.componentInstance;
    localDateFormat = TestBed.inject(LocalDateFormatPipe);
    CustomCurrency = TestBed.inject(CustomcurrencyPipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
