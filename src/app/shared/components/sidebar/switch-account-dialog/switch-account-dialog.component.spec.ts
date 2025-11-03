import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  HttpClientTestingModule
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { I18NextModule, I18NextPipe } from 'angular-i18next';
import { I18N_PROVIDERS } from 'src/app/i18nextHelper';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { SwitchAccountDialogComponent } from './switch-account-dialog.component';

describe('SwitchAccountDialogComponent', () => {
  let component: SwitchAccountDialogComponent;
  let fixture: ComponentFixture<SwitchAccountDialogComponent>;
  let sortPipe: Partial<SortHelperPipe>;
  let netPipe: Partial<I18NextPipe>;
  beforeEach(async () => {
    const sortHelperPipe = jasmine.createSpyObj('SortHelperPipe',['transform']);
    await TestBed.configureTestingModule({
      declarations: [ SwitchAccountDialogComponent ],
      imports:[
        RouterTestingModule,
        HttpClientTestingModule,
        I18NextModule.forRoot(),
      ],
      providers:[
        { provide: SortHelperPipe, useValue:  sortHelperPipe},
     //   { provide: I18NextPipe, useValue:  i18Pipe},
        I18N_PROVIDERS[0]

      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchAccountDialogComponent);
    component = fixture.componentInstance;
    sortPipe = TestBed.inject(SortHelperPipe);
   // netPipe = TestBed.inject(I18NextPipe);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
