import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  HttpClientTestingModule
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DocumentsFavouritesListComponent } from './documents-favourites-list.component';

describe('DocumentsFavouritesListComponent', () => {
  let component: DocumentsFavouritesListComponent;
  let fixture: ComponentFixture<DocumentsFavouritesListComponent>;
  let userServiceStub: Partial<LocalDateFormatPipe>;

  beforeEach(waitForAsync(() => {
    const localDateFormatPipe = jasmine.createSpyObj('LocalDateFormatPipe',['transform']);
    TestBed.configureTestingModule({
      declarations: [ DocumentsFavouritesListComponent ],
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
    fixture = TestBed.createComponent(DocumentsFavouritesListComponent);
    component = fixture.componentInstance;
      // UserService from the root injector
    userServiceStub = TestBed.inject(LocalDateFormatPipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
