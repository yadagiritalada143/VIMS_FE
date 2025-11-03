import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaxTableComponent } from './tax-table.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

describe('TaxTableComponent', () => {
  let component: TaxTableComponent;
  let fixture: ComponentFixture<TaxTableComponent>;
  let UniqueKey: Partial<UniqueKeyPipe>
  let localDateFormat: Partial<LocalDateFormatPipe>;

  beforeEach(async(() => {
    const uniqueKeyPipe = jasmine.createSpyObj('UniqueKeyPipe',['transform']);
    const localDateFormatPipe = jasmine.createSpyObj('LocalDateFormatPipe',['transform']);
    TestBed.configureTestingModule({
      declarations: [ TaxTableComponent ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers:[
        { provide: UniqueKeyPipe, useValue:  uniqueKeyPipe},
        { provide: LocalDateFormatPipe, useValue:  localDateFormatPipe}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
