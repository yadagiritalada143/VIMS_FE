import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TenureLimitListComponent } from './tenure-limit-list.component';
import { RouterTestingModule } from '@angular/router/testing';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';

describe('TenureLimitListComponent', () => {
  let component: TenureLimitListComponent;
  let fixture: ComponentFixture<TenureLimitListComponent>;
  let localDateFormat: Partial<LocalDateFormatPipe>;
  let LocalDateTimeFormat: Partial<LocalDateTimeFormatPipe>

  beforeEach(async () => {
    const localDateFormatPipe = jasmine.createSpyObj('LocalDateFormatPipe',['transform']);
    const localDateTimeFormatPipe=jasmine.createSpyObj('LocalDateTimeFormatPipe', ['transform'])
    await TestBed.configureTestingModule({
      declarations: [ TenureLimitListComponent ],
      imports:[
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers:[
        { provide: LocalDateFormatPipe, useValue:  localDateFormatPipe},
        {provide:LocalDateTimeFormatPipe, useValue: localDateTimeFormatPipe}
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TenureLimitListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
