import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  HttpClientTestingModule
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { RulesListComponent } from './rules-list.component';

describe('RulesListComponent', () => {
  let component: RulesListComponent;
  let fixture: ComponentFixture<RulesListComponent>;
  let localDateFormat: Partial<LocalDateFormatPipe>;
  beforeEach(async(() => {
    const localDateFormatPipe = jasmine.createSpyObj('LocalDateFormatPipe',['transform']);
    TestBed.configureTestingModule({
      declarations: [ RulesListComponent ],
      imports:[
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers:[
        { provide: LocalDateFormatPipe, useValue:  localDateFormatPipe}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RulesListComponent);
    component = fixture.componentInstance;
    localDateFormat = TestBed.inject(LocalDateFormatPipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
